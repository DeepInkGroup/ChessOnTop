import { useState } from "react";
import { Activity, ArrowRight, Check, ChevronLeft, Clipboard, FileInput, FlipHorizontal, RotateCcw, ScanSearch, Sparkles, Target, Zap } from "lucide-react";
import { EvaluationTimeline, MaterialTimeline } from "./AnalysisCharts";
import { formatEngineScore } from "./analysisEngine";

export default function LiveAnalysisPage({ game, moves, analysis, history, historyProgress, openingName, onUndo, onReset, onFlip, onImport }) {
  const [pgn, setPgn] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const data = analysis.data;
  const turn = game.turn() === "w" ? "White" : "Black";
  const cp = data?.score.whiteCp || 0;
  const whiteShare = Math.round(50 + Math.tanh(cp / 350) * 45);
  const evaluationPoints = history.length ? history.map((point, index) => ({ label: point.label, value: data && index === history.length - 1 && point.ply === moves.length ? data.score.whiteCp : point.score })) : [{ label: "Start", value: 0 }];
  const materialPoints = history.length ? history.map((point) => ({ label: point.label, value: point.material })) : [{ label: "Start", value: 0 }];

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(game.fen());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function importPgn(event) {
    event.preventDefault();
    const outcome = onImport(pgn);
    setImportMessage(outcome.message);
    if (outcome.ok) setPgn("");
  }

  return <div className="live-page">
    <section className="live-hero"><div><span className="eyebrow">LIVE ANALYSIS STUDIO</span><h1>See the position <em>think.</em></h1><p>Play moves on the board and Stockfish will refresh the evaluation, leading continuations, and position data.</p><div className="live-hero-status"><span className={`live-status-dot ${analysis.status}`} />{analysis.status === "running" ? "Engine thinking" : analysis.status === "error" ? "Engine unavailable" : "Engine ready"}<span>·</span>{turn} to move</div></div><div className="live-hero-art" aria-hidden="true"><Activity size={120} strokeWidth={1.2}/><span>CO.T</span></div></section>

    <div className="live-toolbar"><div><strong>{openingName || "Uncharted position"}</strong><span>{moves.length} {moves.length === 1 ? "move" : "moves"} played · {data?.phase || "Opening"}</span></div><div><button onClick={onUndo} disabled={!moves.length}><ChevronLeft size={15}/> Undo</button><button onClick={onFlip}><FlipHorizontal size={15}/> Flip</button><button onClick={onReset}><RotateCcw size={15}/> New board</button></div></div>

    <div className="live-main-grid"><section className="live-evaluation-card"><div className="live-card-title"><span><Zap size={18}/></span><div><small>POSITION EVALUATION</small><h2>{analysis.status === "running" ? "Looking deeper…" : data ? formatEngineScore(data.score) : "Engine starting…"}</h2></div><em>{data ? `Depth ${data.depth}` : "Local analysis"}</em></div><p>{analysis.status === "error" ? analysis.error : data ? data.status === "Checkmate" ? "The game is over by checkmate." : data.status === "Draw" ? "The game has reached a drawn position." : Math.abs(cp) < 35 ? "The position is close to equal." : `${cp > 0 ? "White" : "Black"} has the stronger position at this search depth.` : "Move a piece or wait for Stockfish to evaluate the board."}</p><div className="live-eval-balance" role="img" aria-label={`Evaluation bar: ${whiteShare}% white side, ${100 - whiteShare}% black side`}><span style={{ width: `${whiteShare}%` }}/><i /></div><div className="live-eval-labels"><span>WHITE</span><span>BLACK</span></div><div className="live-position-facts"><div><strong>{data?.legalMoves ?? "—"}</strong><span>LEGAL MOVES</span></div><div><strong>{data?.pieceCount ?? "—"}</strong><span>PIECES</span></div><div><strong>{data ? `${data.material > 0 ? "+" : ""}${data.material}` : "—"}</strong><span>MATERIAL ±</span></div><div><strong>{data?.status ?? "—"}</strong><span>STATUS</span></div></div></section>

    <section className="live-lines-card"><div className="live-section-heading"><span className="eyebrow dark">ENGINE IDEAS</span><h2>Three paths forward</h2><p>Each line starts with the suggested move. Scores are shown from White’s side.</p></div>{data?.lines.length ? <><div className="live-variations">{data.lines.map((line) => <div key={line.rank} className={line.rank === 1 ? "top" : ""}><span className="live-variation-rank">{line.rank === 1 ? <Sparkles size={16}/> : `0${line.rank}`}</span><div><strong>{line.san || line.uci}</strong><p>{line.line}</p></div><em>{formatEngineScore(line.score)}</em></div>)}</div><p className="live-arrow-note">The green board arrow marks the first engine choice.</p></> : <div className="live-lines-empty"><ScanSearch size={30}/><strong>{data?.status === "Checkmate" || data?.status === "Draw" ? "No continuation available" : "Finding the best continuations"}</strong><span>{data?.status === "Checkmate" || data?.status === "Draw" ? "Start a new board to keep analyzing." : "The first search may take a moment on a slower device."}</span></div>}</section></div>

    {historyProgress && <div className="live-chart-status" role="status">{historyProgress.error ? historyProgress.error : `Building the full game charts · ${historyProgress.done} of ${historyProgress.total} moves`}{!historyProgress.error && <span><i style={{ width: `${historyProgress.total ? historyProgress.done / historyProgress.total * 100 : 0}%` }}/></span>}</div>}
    <div className="live-chart-grid"><EvaluationTimeline points={evaluationPoints}/><MaterialTimeline points={materialPoints}/></div>

    <div className="live-lower-grid"><section className="live-import-card"><div className="live-section-heading"><span className="eyebrow dark">BRING A GAME</span><h2>Paste a PGN</h2><p>Load a game from the standard starting position, inspect its final position, then keep playing.</p></div><form onSubmit={importPgn}><textarea aria-label="PGN to analyze" value={pgn} onChange={(event) => setPgn(event.target.value)} placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"/><button type="submit" disabled={!pgn.trim()}><FileInput size={15}/> Load game <ArrowRight size={14}/></button></form>{importMessage && <small role="status" className="live-import-message">{importMessage}</small>}</section><section className="live-position-card"><div className="live-section-heading"><span className="eyebrow dark">SHARE A POSITION</span><h2>Current FEN</h2><p>The complete board state after {moves.length} {moves.length === 1 ? "move" : "moves"}.</p></div><code>{game.fen()}</code><button onClick={copyFen}>{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy FEN"}</button><div className="live-tip"><Target size={16}/><span>Tap any move on the board’s move list to return to that position and compare the engine’s plan.</span></div></section></div>
    <div className="live-footnote">Analysis runs locally in your browser. Short searches are useful for ideas; deeper searches can change the scores and move order.</div>
  </div>;
}
