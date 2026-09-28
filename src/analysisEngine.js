import { Chess } from "chess.js";

const enginePath = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`;
const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const DEFAULT_ENGINE_SETTINGS = { depth: 14, movetime: 550, reviewTime: 200, multiPv: 3, hash: 16, auto: true };

function engineSettings(options = {}) {
  return {
    depth: [8, 12, 14, 16, 20].includes(Number(options.depth)) ? Number(options.depth) : DEFAULT_ENGINE_SETTINGS.depth,
    movetime: [200, 550, 1200, 2500].includes(Number(options.movetime)) ? Number(options.movetime) : DEFAULT_ENGINE_SETTINGS.movetime,
    reviewTime: [200, 550, 1200].includes(Number(options.reviewTime)) ? Number(options.reviewTime) : DEFAULT_ENGINE_SETTINGS.reviewTime,
    multiPv: [1, 2, 3, 5].includes(Number(options.multiPv)) ? Number(options.multiPv) : DEFAULT_ENGINE_SETTINGS.multiPv,
    hash: [16, 32, 64].includes(Number(options.hash)) ? Number(options.hash) : DEFAULT_ENGINE_SETTINGS.hash,
  };
}

function request(worker, signal, command, finish, onLine, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Analysis cancelled.", "AbortError"));
      return;
    }
    let settled = false;
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
      clearTimeout(timer);
    };
    const complete = (value, error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(value);
    };
    const handleMessage = (event) => {
      for (const line of String(event.data).split(/\r?\n/)) {
        if (!line) continue;
        onLine?.(line);
        if (finish(line)) {
          complete(line);
          break;
        }
      }
    };
    const handleError = () => complete(null, new Error("Stockfish could not start. Reload the page and try again."));
    const handleAbort = () => complete(null, new DOMException("Analysis cancelled.", "AbortError"));
    const timer = setTimeout(() => complete(null, new Error("The engine took too long to respond. Try again on a shorter line.")), timeoutMs);
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    signal.addEventListener("abort", handleAbort, { once: true });
    worker.postMessage(command);
  });
}

function sanFromUci(fen, uci) {
  if (!uci || uci === "(none)") return null;
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })?.san || null;
  } catch {
    return null;
  }
}

function lineFromUci(fen, pv) {
  const game = new Chess(fen);
  const line = [];
  for (const uci of pv.slice(0, 5)) {
    try {
      line.push(game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san);
    } catch {
      break;
    }
  }
  return line.join(" ");
}

export function winPercent(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * Math.max(-1200, Math.min(1200, cp)))) - 1);
}

function moveAccuracy(before, after, side) {
  const sign = side === "w" ? 1 : -1;
  const chanceLoss = Math.max(0, winPercent(before.whiteCp * sign) - winPercent(after.whiteCp * sign));
  return { chanceLoss, accuracy: Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * chanceLoss) - 3.1669)) };
}

function classifyMove({ chanceLoss, isBest, critical, sacrifice, missedWin }) {
  if (chanceLoss >= 20) return "Blunder";
  if (missedWin && chanceLoss >= 10) return "Miss";
  if (chanceLoss >= 10) return "Mistake";
  if (chanceLoss >= 5) return "Inaccuracy";
  if (isBest && sacrifice) return "Brilliant";
  if (isBest && critical) return "Great";
  if (isBest) return "Best";
  if (chanceLoss < 1.5) return "Excellent";
  return "Good";
}

function estimateGameElo(accuracy, avgLoss, count) {
  if (count < 6) return null;
  const raw = Math.max(400, Math.min(2800, 300 + 22 * accuracy - 1.4 * Math.min(avgLoss, 150)));
  return Math.round((1200 + (raw - 1200) * Math.min(1, count / 24)) / 10) * 10;
}

export function summarizeGame(rows) {
  const labels = ["Brilliant", "Great", "Best", "Excellent", "Good", "Inaccuracy", "Mistake", "Miss", "Blunder"];
  const categories = {
    Opening: (row) => row.phase === "Opening",
    Tactics: (row) => row.tactical,
    Strategy: (row) => row.phase === "Middle game" && !row.tactical,
    Endgame: (row) => row.phase === "Endgame",
  };
  const sides = Object.fromEntries(["w", "b"].map((side) => {
    const sideRows = rows.filter((row) => row.color === side);
    const avg = (selected) => selected.length ? selected.reduce((sum, row) => sum + row.accuracy, 0) / selected.length : null;
    const accuracy = avg(sideRows);
    const avgLoss = sideRows.length ? sideRows.reduce((sum, row) => sum + row.loss, 0) / sideRows.length : 0;
    const breakdown = Object.fromEntries(Object.entries(categories).map(([name, predicate]) => {
      const selected = sideRows.filter(predicate);
      const categoryAccuracy = avg(selected);
      const categoryLoss = selected.length ? selected.reduce((sum, row) => sum + row.loss, 0) / selected.length : 0;
      return [name, { count: selected.length, accuracy: categoryAccuracy === null ? null : Math.round(categoryAccuracy), elo: categoryAccuracy === null ? null : estimateGameElo(categoryAccuracy, categoryLoss, selected.length) }];
    }));
    return [side, { count: sideRows.length, accuracy: accuracy === null ? null : Math.round(accuracy), avgLoss: Math.round(avgLoss), elo: accuracy === null ? null : estimateGameElo(accuracy, avgLoss, sideRows.length), labels: Object.fromEntries(labels.map((label) => [label, sideRows.filter((row) => row.label === label).length])), breakdown }];
  }));
  return { sides, labels, moments: rows.filter((row) => ["Brilliant", "Great", "Mistake", "Miss", "Blunder"].includes(row.label)) };
}

function materialBalance(game) {
  return game.board().flat().filter(Boolean).reduce((balance, piece) => balance + pieceValues[piece.type] * (piece.color === "w" ? 1 : -1), 0);
}

function scoreFromInfo(game, line) {
  const match = line.match(/\bscore (cp|mate) (-?\d+)/);
  if (!match) return null;
  const value = Number(match[2]);
  const cp = match[1] === "mate" ? (value < 0 ? -1 : 1) * (1000 + Math.max(0, 10 - Math.abs(value)) * 20) : value;
  return { whiteCp: cp * (game.turn() === "w" ? 1 : -1), mate: match[1] === "mate" ? value : null };
}

export function formatEngineScore(score) {
  if (!score) return "0.00";
  if (score.mate !== null) return `${score.whiteCp < 0 ? "−" : ""}M${Math.abs(score.mate)}`;
  return `${score.whiteCp > 0 ? "+" : score.whiteCp < 0 ? "−" : ""}${(Math.abs(score.whiteCp) / 100).toFixed(2)}`;
}

export async function analyzePosition(fen, signal, options = DEFAULT_ENGINE_SETTINGS) {
  const settings = engineSettings(options);
  const game = new Chess(fen);
  const material = materialBalance(game);
  const pieceCount = game.board().flat().filter(Boolean).length;
  const legalMoves = game.moves().length;
  const phase = pieceCount <= 12 ? "Endgame" : Number(fen.split(" ")[5]) <= 10 ? "Opening" : "Middle game";
  if (game.isGameOver()) {
    const whiteCp = game.isCheckmate() ? game.turn() === "w" ? -1200 : 1200 : 0;
    return { fen, score: { whiteCp, mate: game.isCheckmate() ? 0 : null }, lines: [], depth: 0, material, pieceCount, legalMoves, phase, status: game.isCheckmate() ? "Checkmate" : "Draw" };
  }
  const worker = new Worker(enginePath);
  try {
    await request(worker, signal, "uci", (line) => line === "uciok", null, 30000);
    worker.postMessage(`setoption name Hash value ${settings.hash}`);
    worker.postMessage("setoption name UCI_AnalyseMode value true");
    worker.postMessage(`setoption name MultiPV value ${settings.multiPv}`);
    await request(worker, signal, "isready", (line) => line === "readyok");
    worker.postMessage(`position fen ${fen}`);
    const lines = new Map();
    await request(worker, signal, `go depth ${settings.depth} movetime ${settings.movetime}`, (line) => line.startsWith("bestmove "), (line) => {
      if (!line.startsWith("info ") || !line.includes(" score ") || !line.includes(" pv ")) return;
      const pvRank = Number(line.match(/\bmultipv (\d+)/)?.[1] || 1);
      const depth = Number(line.match(/\bdepth (\d+)/)?.[1] || 0);
      const score = scoreFromInfo(game, line);
      const pv = line.split(" pv ")[1]?.trim().split(/\s+/) || [];
      if (!score || !pv.length || (lines.get(pvRank)?.depth || 0) > depth) return;
      lines.set(pvRank, { rank: pvRank, depth, score, san: sanFromUci(fen, pv[0]), uci: pv[0], line: lineFromUci(fen, pv), from: pv[0].slice(0, 2), to: pv[0].slice(2, 4) });
    }, 30000);
    const rankedLines = [...lines.values()].sort((a, b) => a.rank - b.rank);
    return { fen, score: rankedLines[0]?.score || { whiteCp: 0, mate: null }, lines: rankedLines, depth: rankedLines[0]?.depth || 0, material, pieceCount, legalMoves, phase, status: game.isCheck() ? "Check" : "In play" };
  } finally {
    worker.terminate();
  }
}

export async function analyzePracticeMoves(moves, playerSide, signal, onProgress, initialFen, plyOffset = 0, options = DEFAULT_ENGINE_SETTINGS) {
  if (!moves.length) throw new Error("Play at least one move before starting analysis.");
  const settings = engineSettings(options);
  const worker = new Worker(enginePath);
  try {
    await request(worker, signal, "uci", (line) => line === "uciok", null, 30000);
    worker.postMessage(`setoption name Hash value ${settings.hash}`);
    worker.postMessage("setoption name UCI_AnalyseMode value true");
    worker.postMessage("setoption name MultiPV value 2");
    await request(worker, signal, "isready", (line) => line === "readyok");

    const evaluate = async (fen) => {
      const game = new Chess(fen);
      if (game.isGameOver()) {
        const whiteCp = game.isCheckmate() ? game.turn() === "w" ? -1200 : 1200 : 0;
        return { whiteCp, mate: game.isCheckmate() ? 0 : null, bestUci: null, line: "", pvUci: [], secondScore: null, depth: 0 };
      }
      let latest = { whiteCp: 0, mate: null, bestUci: null, line: "", pvUci: [], secondScore: null, depth: 0 };
      let secondDepth = 0;
      worker.postMessage(`position fen ${fen}`);
      const result = await request(worker, signal, `go depth ${settings.depth} movetime ${settings.movetime}`, (line) => line.startsWith("bestmove "), (line) => {
        if (!line.startsWith("info ") || !line.includes(" score ")) return;
        const depth = Number(line.match(/\bdepth (\d+)/)?.[1] || 0);
        const rank = Number(line.match(/\bmultipv (\d+)/)?.[1] || 1);
        const score = scoreFromInfo(game, line);
        if (!score) return;
        const pv = line.split(" pv ")[1]?.trim().split(/\s+/) || [];
        if (rank === 2 && depth >= secondDepth) {
          secondDepth = depth;
          latest.secondScore = score;
        }
        if (rank === 1 && depth >= latest.depth) latest = { ...latest, ...score, bestUci: pv[0] || latest.bestUci, line: pv.length ? lineFromUci(fen, pv) : latest.line, pvUci: pv, depth };
      }, Math.max(25000, settings.movetime * 4));
      latest.bestUci ||= result.split(/\s+/)[1] || null;
      return latest;
    };

    const game = initialFen ? new Chess(initialFen) : new Chess();
    const initialMaterial = materialBalance(game);
    const rows = [];
    let before = await evaluate(game.fen());
    onProgress({ done: 0, total: moves.length, rows: [] });
    for (let index = 0; index < moves.length; index += 1) {
      if (signal.aborted) throw new DOMException("Analysis cancelled.", "AbortError");
      const fenBefore = game.fen();
      const bestMove = sanFromUci(fenBefore, before.bestUci);
      const wasCheck = game.isCheck();
      const legalMovesBefore = game.moves().length;
      const played = game.move(moves[index]);
      const after = await evaluate(game.fen());
      const playedUci = `${played.from}${played.to}${played.promotion || ""}`;
      const loss = Math.max(0, Math.round((before.whiteCp - after.whiteCp) * (played.color === "w" ? 1 : -1)));
      const isBest = playedUci === before.bestUci;
      const { chanceLoss, accuracy } = moveAccuracy(before, after, played.color);
      const sign = played.color === "w" ? 1 : -1;
      const critical = isBest && legalMovesBefore > 1 && before.secondScore && winPercent(before.whiteCp * sign) - winPercent(before.secondScore.whiteCp * sign) >= 8;
      let sacrifice = false;
      if (isBest && before.pvUci[1] && pieceValues[played.piece] >= 3) {
        try {
          const reply = new Chess(game.fen()).move({ from: before.pvUci[1].slice(0, 2), to: before.pvUci[1].slice(2, 4), promotion: before.pvUci[1][4] });
          sacrifice = Boolean(reply.captured && reply.to === played.to && pieceValues[played.piece] >= pieceValues[reply.piece] + 2 && winPercent(after.whiteCp * sign) >= 42);
        } catch { sacrifice = false; }
      }
      const missedWin = winPercent(before.whiteCp * sign) >= 65 && winPercent(after.whiteCp * sign) < 55;
      const label = classifyMove({ chanceLoss, isBest, critical, sacrifice, missedWin });
      rows.push({
        index: index + plyOffset,
        san: played.san,
        color: played.color,
        fenAfter: game.fen(),
        loss,
        accuracy: Math.round(accuracy * 10) / 10,
        chanceLoss: Math.round(chanceLoss * 10) / 10,
        label,
        isBest,
        bestMove,
        engineLine: before.line,
        beforeScore: before,
        afterScore: after,
        phase: game.board().flat().filter(Boolean).length <= 12 ? "Endgame" : index + plyOffset < 20 ? "Opening" : "Middle game",
        material: materialBalance(game),
        capture: Boolean(played.captured),
        check: played.san.includes("+") || played.san.includes("#"),
        tactical: wasCheck || Boolean(played.captured) || played.san.includes("+") || played.san.includes("#") || Boolean(played.promotion) || /[x+#]/.test(bestMove || ""),
      });
      before = after;
      onProgress({ done: index + 1, total: moves.length, rows: [...rows] });
    }
    const playerRows = rows.filter((row) => row.color === playerSide);
    const avgLoss = playerRows.length ? Math.round(playerRows.reduce((sum, row) => sum + row.loss, 0) / playerRows.length) : 0;
    const review = summarizeGame(rows);
    const quality = review.sides[playerSide].accuracy ?? 0;
    return {
      rows,
      playerSide,
      quality,
      avgLoss,
      bestCount: playerRows.filter((row) => row.isBest).length,
      sharpMoments: playerRows.filter((row) => ["Mistake", "Miss", "Blunder"].includes(row.label)).length,
      classification: review.sides[playerSide].labels,
      review,
      phaseSummary: ["Opening", "Middle game", "Endgame"].map((phase) => ({ phase, count: playerRows.filter((row) => row.phase === phase).length, avgLoss: playerRows.some((row) => row.phase === phase) ? Math.round(playerRows.filter((row) => row.phase === phase).reduce((sum, row) => sum + row.loss, 0) / playerRows.filter((row) => row.phase === phase).length) : 0 })),
      captures: rows.filter((row) => row.capture).length,
      checks: rows.filter((row) => row.check).length,
      biggestMiss: [...playerRows].sort((a, b) => b.loss - a.loss)[0] || null,
      material: materialBalance(game),
      initialMaterial,
      finalScore: before,
      depth: Math.max(...rows.map((row) => row.afterScore.depth)),
      settings,
    };
  } finally {
    worker.terminate();
  }
}
