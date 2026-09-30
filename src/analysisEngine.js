import { Chess } from "chess.js";

const enginePath = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`;
const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const DEFAULT_ENGINE_SETTINGS = { depth: 14, movetime: 550, reviewDepth: 14, reviewTime: 200, reviewLines: 2, multiPv: 3, hash: 16, auto: true, autoReview: true };
const depthOptions = [8, 12, 14, 16, 20, 24, 28, 32];

function engineSettings(options = {}) {
  return {
    depth: depthOptions.includes(Number(options.depth)) ? Number(options.depth) : DEFAULT_ENGINE_SETTINGS.depth,
    movetime: [200, 550, 1200, 2500, 5000, 10000].includes(Number(options.movetime)) ? Number(options.movetime) : DEFAULT_ENGINE_SETTINGS.movetime,
    reviewDepth: depthOptions.includes(Number(options.reviewDepth)) ? Number(options.reviewDepth) : DEFAULT_ENGINE_SETTINGS.reviewDepth,
    reviewTime: [200, 550, 1200, 2500, 5000].includes(Number(options.reviewTime)) ? Number(options.reviewTime) : DEFAULT_ENGINE_SETTINGS.reviewTime,
    reviewLines: [2, 3, 5].includes(Number(options.reviewLines)) ? Number(options.reviewLines) : DEFAULT_ENGINE_SETTINGS.reviewLines,
    multiPv: [1, 2, 3, 5].includes(Number(options.multiPv)) ? Number(options.multiPv) : DEFAULT_ENGINE_SETTINGS.multiPv,
    hash: [16, 32, 64, 128].includes(Number(options.hash)) ? Number(options.hash) : DEFAULT_ENGINE_SETTINGS.hash,
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

function findabilityEstimate({ legalMoves, bestMove, critical, sacrifice, candidateGap }) {
  if (!bestMove) return null;
  const forcing = bestMove.includes("#") ? 27 : bestMove.includes("+") ? 16 : bestMove.includes("x") ? 10 : 0;
  const optionsPenalty = Math.min(28, Math.max(0, legalMoves - 8) * 0.8);
  const quietPenalty = !/[x+#]/.test(bestMove) && legalMoves > 15 ? 8 : 0;
  const uniqueBonus = critical ? forcing ? 5 : -9 : candidateGap < 2 ? -4 : 0;
  const score = Math.round(72 + forcing + uniqueBonus - optionsPenalty - quietPenalty - (sacrifice ? 25 : 0));
  return Math.max(10, Math.min(95, score));
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

function searchInfo(game, line) {
  if (!line.startsWith("info ") || !line.includes(" score ") || !line.includes(" pv ") || /\b(?:lowerbound|upperbound)\b/.test(line)) return null;
  const score = scoreFromInfo(game, line);
  const pv = line.split(" pv ")[1]?.trim().split(/\s+/) || [];
  if (!score || !pv.length) return null;
  const number = (name) => Number(line.match(new RegExp(`\\b${name} (\\d+)`))?.[1] || 0);
  return { rank: number("multipv") || 1, depth: number("depth"), score, pv, nodes: number("nodes"), nps: number("nps"), searchMs: number("time"), hashfull: number("hashfull") };
}

export function summarizeSearch(rows) {
  if (!rows.length) return { positions: 0, avgDepth: 0, minDepth: 0, maxDepth: 0, nodes: 0, searchMs: 0 };
  const positions = [rows[0].beforeScore, ...rows.map((row) => row.afterScore)];
  const searched = positions.filter((position) => position.depth > 0);
  return {
    positions: positions.length,
    avgDepth: searched.length ? Math.round(searched.reduce((sum, position) => sum + position.depth, 0) / searched.length) : 0,
    minDepth: searched.length ? Math.min(...searched.map((position) => position.depth)) : 0,
    maxDepth: searched.length ? Math.max(...searched.map((position) => position.depth)) : 0,
    nodes: positions.reduce((sum, position) => sum + (position.nodes || 0), 0),
    searchMs: positions.reduce((sum, position) => sum + (position.searchMs || 0), 0),
  };
}

export function formatEngineScore(score) {
  if (!score) return "0.00";
  if (score.mate !== null) return `${score.whiteCp < 0 ? "−" : ""}M${Math.abs(score.mate)}`;
  return `${score.whiteCp > 0 ? "+" : score.whiteCp < 0 ? "−" : ""}${(Math.abs(score.whiteCp) / 100).toFixed(2)}`;
}

export async function analyzePosition(fen, signal, options = DEFAULT_ENGINE_SETTINGS, onUpdate) {
  const settings = engineSettings(options);
  const game = new Chess(fen);
  const material = materialBalance(game);
  const pieceCount = game.board().flat().filter(Boolean).length;
  const legalMoves = game.moves().length;
  const phase = pieceCount <= 12 ? "Endgame" : Number(fen.split(" ")[5]) <= 10 ? "Opening" : "Middle game";
  if (game.isGameOver()) {
    const whiteCp = game.isCheckmate() ? game.turn() === "w" ? -1200 : 1200 : 0;
    return { fen, score: { whiteCp, mate: game.isCheckmate() ? 0 : null }, lines: [], depth: 0, nodes: 0, nps: 0, searchMs: 0, hashfull: 0, material, pieceCount, legalMoves, phase, status: game.isCheckmate() ? "Checkmate" : "Draw" };
  }
  const worker = new Worker(enginePath);
  try {
    await request(worker, signal, "uci", (line) => line === "uciok", null, 30000);
    worker.postMessage(`setoption name Hash value ${settings.hash}`);
    worker.postMessage("setoption name UCI_AnalyseMode value true");
    worker.postMessage(`setoption name MultiPV value ${settings.multiPv}`);
    await request(worker, signal, "isready", (line) => line === "readyok");
    worker.postMessage(`position fen ${fen}`);
    const latestLines = new Map();
    const iterations = new Map();
    const expected = Math.min(settings.multiPv, legalMoves);
    let completedDepth = 0;
    let lastUpdateMs = -100;
    const snapshot = (rankedLines) => {
      const first = rankedLines[0];
      return { fen, score: first?.score || { whiteCp: 0, mate: null }, lines: rankedLines, depth: first?.depth || 0, nodes: first?.nodes || 0, nps: first?.nps || 0, searchMs: first?.searchMs || 0, hashfull: first?.hashfull || 0, material, pieceCount, legalMoves, phase, status: game.isCheck() ? "Check" : "In play" };
    };
    await request(worker, signal, `go depth ${settings.depth} movetime ${settings.movetime}`, (line) => line.startsWith("bestmove "), (line) => {
      const info = searchInfo(game, line);
      if (!info || !info.depth || info.rank > expected) return;
      const item = { rank: info.rank, depth: info.depth, score: info.score, san: sanFromUci(fen, info.pv[0]), uci: info.pv[0], line: lineFromUci(fen, info.pv), from: info.pv[0].slice(0, 2), to: info.pv[0].slice(2, 4), nodes: info.nodes, nps: info.nps, searchMs: info.searchMs, hashfull: info.hashfull };
      if ((latestLines.get(info.rank)?.depth || 0) <= info.depth) latestLines.set(info.rank, item);
      if (!iterations.has(info.depth)) iterations.set(info.depth, new Map());
      iterations.get(info.depth).set(info.rank, item);
      const group = iterations.get(info.depth);
      if (group.size >= expected && info.depth > completedDepth) {
        completedDepth = info.depth;
        if (info.searchMs - lastUpdateMs >= 90 || info.depth <= 3) {
          lastUpdateMs = info.searchMs;
          onUpdate?.(snapshot([...group.values()].sort((a, b) => a.rank - b.rank)));
        }
        for (const depth of iterations.keys()) if (depth < completedDepth - 2) iterations.delete(depth);
      }
    }, 30000);
    const complete = iterations.get(completedDepth);
    const rankedLines = [...(complete?.values() || latestLines.values())].sort((a, b) => a.rank - b.rank);
    return snapshot(rankedLines);
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
    worker.postMessage(`setoption name MultiPV value ${settings.reviewLines}`);
    await request(worker, signal, "isready", (line) => line === "readyok");

    const evaluate = async (fen) => {
      const game = new Chess(fen);
      if (game.isGameOver()) {
        const whiteCp = game.isCheckmate() ? game.turn() === "w" ? -1200 : 1200 : 0;
        return { whiteCp, mate: game.isCheckmate() ? 0 : null, bestUci: null, line: "", pvUci: [], secondScore: null, depth: 0, nodes: 0, nps: 0, searchMs: 0, hashfull: 0 };
      }
      const latest = new Map();
      const iterations = new Map();
      const needsSecond = game.moves().length > 1;
      worker.postMessage(`position fen ${fen}`);
      const result = await request(worker, signal, `go depth ${settings.reviewDepth} movetime ${settings.movetime}`, (line) => line.startsWith("bestmove "), (line) => {
        const info = searchInfo(game, line);
        if (!info || !info.depth || info.rank > 2) return;
        if ((latest.get(info.rank)?.depth || 0) <= info.depth) latest.set(info.rank, info);
        if (!iterations.has(info.depth)) iterations.set(info.depth, new Map());
        iterations.get(info.depth).set(info.rank, info);
      }, Math.max(25000, settings.movetime * 4));
      const completeDepth = [...iterations.keys()].sort((a, b) => b - a).find((depth) => iterations.get(depth).has(1) && (!needsSecond || iterations.get(depth).has(2)));
      const group = iterations.get(completeDepth);
      const first = group?.get(1) || latest.get(1);
      const second = group?.get(2) || (latest.get(2)?.depth === first?.depth ? latest.get(2) : null);
      return { ...(first?.score || { whiteCp: 0, mate: null }), bestUci: first?.pv[0] || result.split(/\s+/)[1] || null, line: first?.pv.length ? lineFromUci(fen, first.pv) : "", pvUci: first?.pv || [], secondScore: second?.score || null, depth: first?.depth || 0, nodes: first?.nodes || 0, nps: first?.nps || 0, searchMs: first?.searchMs || 0, hashfull: first?.hashfull || 0 };
    };

    const game = initialFen ? new Chess(initialFen) : new Chess();
    const initialMaterial = materialBalance(game);
    const rows = [];
    let before = options.initialScore || await evaluate(game.fen());
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
      const candidateGap = before.secondScore ? Math.max(0, winPercent(before.whiteCp * sign) - winPercent(before.secondScore.whiteCp * sign)) : 0;
      let bestSacrifice = false;
      if (before.bestUci && before.pvUci[1]) {
        try {
          const bestGame = new Chess(fenBefore);
          const bestPlayed = bestGame.move({ from: before.bestUci.slice(0, 2), to: before.bestUci.slice(2, 4), promotion: before.bestUci[4] });
          const reply = bestGame.move({ from: before.pvUci[1].slice(0, 2), to: before.pvUci[1].slice(2, 4), promotion: before.pvUci[1][4] });
          bestSacrifice = Boolean(reply.captured && reply.to === bestPlayed.to && pieceValues[bestPlayed.piece] >= 3 && pieceValues[bestPlayed.piece] >= pieceValues[reply.piece] + 2 && winPercent(before.whiteCp * sign) >= 42);
        } catch { bestSacrifice = false; }
      }
      const sacrifice = isBest && bestSacrifice;
      const missedWin = winPercent(before.whiteCp * sign) >= 65 && winPercent(after.whiteCp * sign) < 55;
      const label = classifyMove({ chanceLoss, isBest, critical, sacrifice, missedWin });
      const findability = findabilityEstimate({ legalMoves: legalMovesBefore, bestMove, critical: candidateGap >= 8, sacrifice: bestSacrifice, candidateGap });
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
        findability,
        legalMovesBefore,
        candidateGap: Math.round(candidateGap * 10) / 10,
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
      searchStats: summarizeSearch(rows),
      settings,
    };
  } finally {
    worker.terminate();
  }
}
