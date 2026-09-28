import { useState } from "react";
import { Activity, ArrowRight, Check, ChevronLeft, Clipboard, FileInput, FlipHorizontal, RotateCcw, ScanSearch, Settings2, Sparkles, Target, Zap } from "lucide-react";
import { EvaluationTimeline, MaterialTimeline, QualityMix } from "./AnalysisCharts";
import { formatEngineScore } from "./analysisEngine";

const reviewLabels = ["Brilliant", "Great", "Best", "Excellent", "Good", "Inaccuracy", "Mistake", "Miss", "Blunder"];
const categories = [
  { name: "Opening", note: "Early development and plans" },
  { name: "Tactics", note: "Checks, captures, and forcing moves" },
  { name: "Strategy", note: "Quiet middle game decisions" },
  { name: "Endgame", note: "Positions with 12 pieces or fewer" },
];

function EngineControls({ settings, onChange, onAnalyzeNow, analysisStatus }) {
  return <section className="live-engine-controls" aria-label="Engine settings">
    <div className="live-section-heading"><span className="eyebrow dark">YOUR ENGINE</span><h2><Settings2 size={19}/> Search settings</h2><p>Choose how much time and memory the browser engine can use.</p></div>
    <div className="live-engine-fields">
      <label>Depth cap<select aria-label="Engine depth" value={settings.depth} onChange={(event) => onChange("depth", Number(event.target.value))}>{[8, 12, 14, 16, 20].map((depth) => <option key={depth} value={depth}>{depth} plies</option>)}</select></label>
      <label>Time / position<select aria-label="Engine time per position" value={settings.movetime} onChange={(event) => onChange("movetime", Number(event.target.value))}>{[[200, "0.2 s"], [550, "0.55 s"], [1200, "1.2 s"], [2500, "2.5 s"]].map(([time, text]) => <option key={time} value={time}>{text}</option>)}</select></label>
      <label>Engine lines<select aria-label="Engine lines" value={settings.multiPv} onChange={(event) => onChange("multiPv", Number(event.target.value))}>{[1, 2, 3, 5].map((count) => <option key={count} value={count}>{count} {count === 1 ? "line" : "lines"}</option>)}</select></label>
      <label>Hash memory<select aria-label="Engine hash memory" value={settings.hash} onChange={(event) => onChange("hash", Number(event.target.value))}>{[16, 32, 64].map((size) => <option key={size} value={size}>{size} MB</option>)}</select></label>
      <label className="live-engine-wide">Review time / move<select aria-label="Review time per move" value={settings.reviewTime} onChange={(event) => onChange("reviewTime", Number(event.target.value))}>{[[200, "Fast · 0.2 s"], [550, "Balanced · 0.55 s"], [1200, "Deep · 1.2 s"]].map(([time, text]) => <option key={time} value={time}>{text}</option>)}</select></label>
    </div>
    <div className="live-engine-bottom"><label className="live-auto-label">Auto analyze<span>Refresh after each move</span></label><button type="button" role="switch" aria-label="Auto analyze" aria-checked={settings.auto !== false} className={`live-auto-switch ${settings.auto !== false ? "on" : ""}`} onClick={() => onChange("auto", settings.auto === false)}><i/></button></div>
    <button className="live-analyze-now" onClick={onAnalyzeNow}><Zap size={15}/>{analysisStatus === "running" ? "Restart search" : "Analyze position"}</button>
  </section>;
}

function SideReviewCard({ side, data }) {
  const name = side === "w" ? "White" : "Black";
  return <div className={`live-side-review ${side}`}><div className="live-side-heading"><span className="live-side-mark">{name[0]}</span><div><small>{name.toUpperCase()}</small><strong>{data?.count || 0} moves reviewed</strong></div></div><div className="live-side-scores"><div><small>ACCURACY</small><strong>{data?.accuracy === null || data?.accuracy === undefined ? "—" : `${data.accuracy}%`}</strong></div><div><small>GAME RATING</small><strong>{data?.elo ?? "—"}<em>{data?.elo ? " Elo" : ""}</em></strong></div></div><p>{data?.elo ? "Training estimate from this game" : "Review at least 6 moves for a rating estimate."}</p></div>;
}

function ReviewDashboard({ review, historyProgress, onReviewGame, moves, onSelectPly }) {
  const result = review.result;
  const summary = result?.review;
  const rows = result?.rows || [];
  const totalLabels = Object.fromEntries(reviewLabels.map((label) => [label, (summary?.sides.w.labels[label] || 0) + (summary?.sides.b.labels[label] || 0)]));
  return <section className="live-review-section" id="live-game-review"><div className="live-review-title"><div><span className="eyebrow dark">GAME REVIEW</span><h2>Two sides of the story.</h2><p>Accuracy, a training Elo estimate, and a reason to revisit each key move.</p></div><button onClick={onReviewGame} disabled={!moves.length || review.status === "running"}><Sparkles size={16}/>{review.status === "ready" ? "Review again" : review.status === "running" ? "Reviewing…" : "Review game"}</button></div>
    {historyProgress && !historyProgress.error && <div className="live-chart-status" role="status">Reviewing {historyProgress.done} of {historyProgress.total} moves<span><i style={{ width: `${historyProgress.total ? historyProgress.done / historyProgress.total * 100 : 0}%` }}/></span></div>}
    {review.status === "error" && <p className="live-review-error" role="alert">{review.error}</p>}
    <div className="live-accuracy-grid"><SideReviewCard side="w" data={summary?.sides.w}/><SideReviewCard side="b" data={summary?.sides.b}/></div>
    {summary && <><div className="live-review-detail-grid"><div className="live-category-panel"><div className="live-section-heading"><span className="eyebrow dark">ADVANCED STATS</span><h3>Opening, tactics, strategy, endgame</h3><p>Scores use the moves in each category. Tactics can overlap another phase.</p></div>{categories.map(({ name, note }) => {
      const white = summary.sides.w.breakdown[name];
      const black = summary.sides.b.breakdown[name];
      return <div className="live-category-row" key={name}><div><strong>{name}</strong><small>{note}</small></div><div className="live-category-side"><span>W</span><div><i style={{ width: `${white.accuracy || 0}%` }}/></div><strong>{white.accuracy === null ? "—" : `${white.accuracy}%`}</strong><em>{white.elo ? `${white.elo} Elo` : `${white.count} moves`}</em></div><div className="live-category-side black"><span>B</span><div><i style={{ width: `${black.accuracy || 0}%` }}/></div><strong>{black.accuracy === null ? "—" : `${black.accuracy}%`}</strong><em>{black.elo ? `${black.elo} Elo` : `${black.count} moves`}</em></div></div>;
    })}</div><QualityMix counts={totalLabels}/></div>
    <div className="live-move-review"><div className="live-section-heading"><span className="eyebrow dark">MOVE LABELS</span><h3>Review every decision</h3><p>Brilliant is reserved for an engine approved material sacrifice; Great marks a critical best move. Labels may change with deeper search.</p></div><div className="live-review-list">{rows.map((row, index) => <button key={`${index}-${row.san}`} onClick={() => onSelectPly(index + 1)}><span>{Math.floor(index / 2) + 1}{row.color === "w" ? "." : "..."}</span><strong>{row.san}</strong><em className={`quality-${row.label.toLowerCase()}`}>{row.label}</em><span>{row.accuracy}%</span><small>{row.chanceLoss > 0 ? `−${row.chanceLoss}% win chance` : "No loss"}</small><ArrowRight size={14}/></button>)}</div></div></>}
    <p className="live-method-note">Move accuracy uses the published <a href="https://lichess.org/page/accuracy" target="_blank" rel="noreferrer">Lichess win chance formula</a>. CO.T averages those move scores and uses a sample adjusted heuristic for game Elo. These are training estimates, not an official rating or a measure of player strength.</p>
  </section>;
}

export default function LiveAnalysisPage({ game, moves, currentPly, analysis, history, historyProgress, review, board, settings, onSettingsChange, onAnalyzeNow, onReviewGame, openingName, onUndo, onReset, onFlip, onImport, onSelectPly }) {
  const [pgn, setPgn] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const data = analysis.data;
  const turn = game.turn() === "w" ? "White" : "Black";
  const cp = data?.score.whiteCp || 0;
  const whiteShare = Math.round(50 + Math.tanh(cp / 350) * 45);
  const evaluationPoints = history.length ? history.map((point, index) => ({ label: point.label, value: data && index === history.length - 1 && point.ply === currentPly ? data.score.whiteCp : point.score })) : [{ label: "Start", value: 0 }];
  const materialPoints = history.length ? history.map((point) => ({ label: point.label, value: point.material })) : [{ label: "Start", value: 0 }];

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(game.fen());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }

  function importPgn(event) {
    event.preventDefault();
    const outcome = onImport(pgn);
    setImportMessage(outcome.message);
    if (outcome.ok) setPgn("");
  }

  return <div className="live-page">
    <section className="live-hero"><div><span className="eyebrow">LIVE ANALYSIS STUDIO</span><h1>Put the board at the center.</h1><p>Play a move, follow the engine, then review both sides of the game.</p></div><div className="live-hero-status"><span className={`live-status-dot ${analysis.status}`}/>{analysis.status === "running" ? "Engine thinking" : analysis.status === "paused" ? "Auto analysis paused" : analysis.status === "error" ? "Engine unavailable" : "Engine ready"}<span>·</span>{turn} to move</div></section>

    <div className="live-arena"><div className="live-arena-left"><section className="live-evaluation-card"><div className="live-card-title"><span><Zap size={18}/></span><div><small>POSITION EVALUATION</small><h2>{analysis.status === "running" ? "Searching…" : data ? formatEngineScore(data.score) : analysis.status === "paused" ? "Paused" : "Engine starting…"}</h2></div><em>{data ? `Depth ${data.depth}` : "Local analysis"}</em></div><p>{analysis.status === "error" ? analysis.error : data ? data.status === "Checkmate" ? "The game is over by checkmate." : data.status === "Draw" ? "The game has reached a drawn position." : Math.abs(cp) < 35 ? "The position is close to equal." : `${cp > 0 ? "White" : "Black"} has the stronger position at this search depth.` : analysis.status === "running" ? "Stockfish is checking this position." : "Use Analyze position to search when auto analysis is paused."}</p><div className="live-eval-balance" role="img" aria-label={`Evaluation bar: ${whiteShare}% white side, ${100 - whiteShare}% black side`}><span style={{ width: `${whiteShare}%` }}/><i/></div><div className="live-eval-labels"><span>WHITE</span><span>BLACK</span></div><div className="live-position-facts"><div><strong>{data?.legalMoves ?? "—"}</strong><span>LEGAL MOVES</span></div><div><strong>{data?.pieceCount ?? "—"}</strong><span>PIECES</span></div><div><strong>{data ? `${data.material > 0 ? "+" : ""}${data.material}` : "—"}</strong><span>MATERIAL ±</span></div><div><strong>{data?.status ?? "—"}</strong><span>STATUS</span></div></div></section><div className="live-left-hint"><Target size={17}/><span>Green arrow: engine’s first choice. Right drag: your own board arrows.</span></div></div>

      <div className="live-center"><div className="live-center-heading"><div><span className="eyebrow dark">FOCUS BOARD</span><strong>{openingName || "Uncharted position"}</strong></div><span>{currentPly}/{moves.length} moves</span></div>{board}<div className="live-toolbar"><button onClick={onUndo} disabled={!currentPly}><ChevronLeft size={15}/> Undo</button><button onClick={onFlip}><FlipHorizontal size={15}/> Flip</button><button onClick={onReset}><RotateCcw size={15}/> New board</button></div><div className="live-board-moves"><div><strong>Move trail</strong><span>Tap a move to inspect it</span></div><div><button className={currentPly === 0 ? "active" : ""} onClick={() => onSelectPly(0)}>Start</button>{moves.map((move, index) => <button key={`${index}-${move}`} className={index + 1 === currentPly ? "active" : ""} onClick={() => onSelectPly(index + 1)}>{index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ""}{move}{review.result?.rows[index] && <i className={`quality-${review.result.rows[index].label.toLowerCase()}`}/>}</button>)}</div></div></div>

      <div className="live-arena-right"><EngineControls settings={settings} onChange={onSettingsChange} onAnalyzeNow={onAnalyzeNow} analysisStatus={analysis.status}/><section className="live-lines-card"><div className="live-section-heading"><span className="eyebrow dark">ENGINE IDEAS</span><h2>{settings.multiPv} {settings.multiPv === 1 ? "path" : "paths"} forward</h2><p>Scores are shown from White’s side.</p></div>{data?.lines.length ? <div className="live-variations">{data.lines.map((line) => <div key={line.rank} className={line.rank === 1 ? "top" : ""}><span className="live-variation-rank">{line.rank === 1 ? <Sparkles size={16}/> : `0${line.rank}`}</span><div><strong>{line.san || line.uci}</strong><p>{line.line}</p></div><em>{formatEngineScore(line.score)}</em></div>)}</div> : <div className="live-lines-empty"><ScanSearch size={30}/><strong>{data?.status === "Checkmate" || data?.status === "Draw" ? "No continuation available" : "Finding the best continuations"}</strong><span>{data?.status === "Checkmate" || data?.status === "Draw" ? "Start a new board to keep analyzing." : "The first search may take a moment."}</span></div>}</section></div></div>

    <ReviewDashboard review={review} historyProgress={historyProgress} onReviewGame={onReviewGame} moves={moves} onSelectPly={onSelectPly}/>
    <div className="live-chart-grid"><EvaluationTimeline points={evaluationPoints}/><MaterialTimeline points={materialPoints}/></div>
    <div className="live-lower-grid"><section className="live-import-card"><div className="live-section-heading"><span className="eyebrow dark">BRING A GAME</span><h2>Paste a PGN</h2><p>Load a game from the standard starting position to build its review and charts.</p></div><form onSubmit={importPgn}><textarea aria-label="PGN to analyze" value={pgn} onChange={(event) => setPgn(event.target.value)} placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"/><button type="submit" disabled={!pgn.trim()}><FileInput size={15}/> Load game <ArrowRight size={14}/></button></form>{importMessage && <small role="status" className="live-import-message">{importMessage}</small>}</section><section className="live-position-card"><div className="live-section-heading"><span className="eyebrow dark">SHARE A POSITION</span><h2>Current FEN</h2><p>The board state after {currentPly} {currentPly === 1 ? "move" : "moves"}.</p></div><code>{game.fen()}</code><button onClick={copyFen}>{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy FEN"}</button><div className="live-tip"><Activity size={16}/><span>Engine depth is a cap; the search may stop earlier when its time limit is reached.</span></div></section></div>
  </div>;
}
