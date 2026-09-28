import { Chess } from "chess.js";

const enginePath = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`;
const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

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

function classifyMove(loss, isBest) {
  if (isBest) return "Best";
  if (loss < 30) return "Strong";
  if (loss < 80) return "Solid";
  if (loss < 150) return "Inaccuracy";
  if (loss < 300) return "Mistake";
  return "Blunder";
}

function materialBalance(game) {
  return game.board().flat().filter(Boolean).reduce((balance, piece) => balance + pieceValues[piece.type] * (piece.color === "w" ? 1 : -1), 0);
}

export function formatEngineScore(score) {
  if (!score) return "0.00";
  if (score.mate !== null) return `${score.whiteCp < 0 ? "−" : ""}M${Math.abs(score.mate)}`;
  return `${score.whiteCp > 0 ? "+" : score.whiteCp < 0 ? "−" : ""}${(Math.abs(score.whiteCp) / 100).toFixed(2)}`;
}

export async function analyzePracticeMoves(moves, playerSide, signal, onProgress, initialFen, plyOffset = 0) {
  if (!moves.length) throw new Error("Play at least one move before starting analysis.");
  const worker = new Worker(enginePath);
  try {
    await request(worker, signal, "uci", (line) => line === "uciok", null, 30000);
    worker.postMessage("setoption name Hash value 16");
    worker.postMessage("setoption name UCI_AnalyseMode value true");
    await request(worker, signal, "isready", (line) => line === "readyok");

    const evaluate = async (fen) => {
      const game = new Chess(fen);
      if (game.isGameOver()) {
        const whiteCp = game.isCheckmate() ? game.turn() === "w" ? -1200 : 1200 : 0;
        return { whiteCp, mate: game.isCheckmate() ? 0 : null, bestUci: null, line: "", depth: 0 };
      }
      let latest = { whiteCp: 0, mate: null, bestUci: null, line: "", depth: 0 };
      worker.postMessage(`position fen ${fen}`);
      const result = await request(worker, signal, "go depth 11 movetime 180", (line) => line.startsWith("bestmove "), (line) => {
        if (!line.startsWith("info ") || !line.includes(" score ")) return;
        const depth = Number(line.match(/\bdepth (\d+)/)?.[1] || 0);
        const score = line.match(/\bscore (cp|mate) (-?\d+)/);
        if (!score || depth < latest.depth) return;
        const value = Number(score[2]);
        const cp = score[1] === "mate" ? (value < 0 ? -1 : 1) * (1000 + Math.max(0, 10 - Math.abs(value)) * 20) : value;
        const pv = line.split(" pv ")[1]?.trim().split(/\s+/) || [];
        latest = {
          whiteCp: cp * (game.turn() === "w" ? 1 : -1),
          mate: score[1] === "mate" ? value : null,
          bestUci: pv[0] || latest.bestUci,
          line: pv.length ? lineFromUci(fen, pv) : latest.line,
          depth,
        };
      });
      latest.bestUci ||= result.split(/\s+/)[1] || null;
      return latest;
    };

    const game = initialFen ? new Chess(initialFen) : new Chess();
    const rows = [];
    let before = await evaluate(game.fen());
    onProgress({ done: 0, total: moves.length, rows: [] });
    for (let index = 0; index < moves.length; index += 1) {
      if (signal.aborted) throw new DOMException("Analysis cancelled.", "AbortError");
      const fenBefore = game.fen();
      const bestMove = sanFromUci(fenBefore, before.bestUci);
      const played = game.move(moves[index]);
      const after = await evaluate(game.fen());
      const playedUci = `${played.from}${played.to}${played.promotion || ""}`;
      const loss = Math.max(0, Math.round((before.whiteCp - after.whiteCp) * (played.color === "w" ? 1 : -1)));
      const isBest = playedUci === before.bestUci;
      rows.push({
        index: index + plyOffset,
        san: played.san,
        color: played.color,
        loss,
        label: classifyMove(loss, isBest),
        bestMove,
        engineLine: before.line,
        beforeScore: before,
        afterScore: after,
        phase: index < 16 ? "Opening" : game.board().flat().filter(Boolean).length <= 12 ? "Endgame" : "Middle game",
      });
      before = after;
      onProgress({ done: index + 1, total: moves.length, rows: [...rows] });
    }
    const playerRows = rows.filter((row) => row.color === playerSide);
    const avgLoss = playerRows.length ? Math.round(playerRows.reduce((sum, row) => sum + row.loss, 0) / playerRows.length) : 0;
    const quality = Math.round(100 * Math.exp(-avgLoss / 230));
    return {
      rows,
      playerSide,
      quality,
      avgLoss,
      bestCount: playerRows.filter((row) => row.label === "Best").length,
      sharpMoments: playerRows.filter((row) => row.loss >= 150).length,
      biggestMiss: [...playerRows].sort((a, b) => b.loss - a.loss)[0] || null,
      material: materialBalance(game),
      finalScore: before,
      depth: Math.max(...rows.map((row) => row.afterScore.depth)),
    };
  } finally {
    worker.terminate();
  }
}
