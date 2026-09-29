import { useState } from "react";
import { Activity, ArrowRight, Check, ChevronLeft, Clipboard, FileInput, FlipHorizontal, RotateCcw, ScanSearch, Settings2, Sparkles, Target, Zap } from "lucide-react";
import { AccuracyTimeline, EvaluationTimeline, MaterialTimeline, QualityMix } from "./AnalysisCharts";
import { formatEngineScore } from "./analysisEngine";

const reviewLabels = ["Brilliant", "Great", "Best", "Excellent", "Good", "Inaccuracy", "Mistake", "Miss", "Blunder"];
const categories = [
  { name: "Opening", note: "Early development and plans" },
  { name: "Tactics", note: "Checks, captures, and forcing moves" },
  { name: "Strategy", note: "Quiet middle game decisions" },
  { name: "Endgame", note: "Positions with 12 pieces or fewer" },
];

function EngineControls({ settings, moveCount, onChange, onAnalyzeNow, analysisStatus }) {
  const preset = settings.reviewDepth === 14 && settings.reviewTime === 200 && settings.reviewLines === 2 ? "fast" : settings.reviewDepth === 20 && settings.reviewTime === 550 && settings.reviewLines === 3 ? "balanced" : settings.reviewDepth === 28 && settings.reviewTime === 2500 && settings.reviewLines === 3 ? "thorough" : "custom";
  const budgetSeconds = Math.ceil((moveCount + 1) * settings.reviewTime / 1000);
  return <section className="live-engine-controls" aria-label="Engine settings">
    <div className="live-section-heading"><span className="eyebrow dark">YOUR ENGINE</span><h2><Settings2 size={19}/> Search settings</h2><p>Choose how much time and memory the browser engine can use.</p></div>
    <div className="live-engine-fields">
      <label>Live depth cap<select aria-label="Engine depth" value={settings.depth} onChange={(event) => onChange("depth", Number(event.target.value))}>{[8, 12, 14, 16, 20, 24, 28, 32].map((depth) => <option key={depth} value={depth}>{depth} plies</option>)}</select></label>
      <label>Time / position<select aria-label="Engine time per position" value={settings.movetime} onChange={(event) => onChange("movetime", Number(event.target.value))}>{[[200, "0.2 s"], [550, "0.55 s"], [1200, "1.2 s"], [2500, "2.5 s"], [5000, "5 s"], [10000, "10 s"]].map(([time, text]) => <option key={time} value={time}>{text}</option>)}</select></label>
      <label>Engine lines<select aria-label="Engine lines" value={settings.multiPv} onChange={(event) => onChange("multiPv", Number(event.target.value))}>{[1, 2, 3, 5].map((count) => <option key={count} value={count}>{count} {count === 1 ? "line" : "lines"}</option>)}</select></label>
      <label>Hash memory<select aria-label="Engine hash memory" value={settings.hash} onChange={(event) => onChange("hash", Number(event.target.value))}>{[16, 32, 64, 128].map((size) => <option key={size} value={size}>{size} MB</option>)}</select></label>
      <div className="live-setting-divider">FULL GAME REVIEW</div>
      <label className="live-engine-wide">Review preset<select aria-label="Review preset" value={preset} onChange={(event) => onChange("reviewPreset", event.target.value)}><option value="fast">Fast</option><option value="balanced">Balanced</option><option value="thorough">Thorough</option>{preset === "custom" && <option value="custom">Custom</option>}</select></label>
      <label>Review depth cap<select aria-label="Review depth" value={settings.reviewDepth} onChange={(event) => onChange("reviewDepth", Number(event.target.value))}>{[8, 12, 14, 16, 20, 24, 28, 32].map((depth) => <option key={depth} value={depth}>{depth} plies</option>)}</select></label>
      <label>Review candidates<select aria-label="Review candidates" value={settings.reviewLines} onChange={(event) => onChange("reviewLines", Number(event.target.value))}>{[2, 3, 5].map((count) => <option key={count} value={count}>{count} lines</option>)}</select></label>
      <label className="live-engine-wide">Review time / position<select aria-label="Review time per move" value={settings.reviewTime} onChange={(event) => onChange("reviewTime", Number(event.target.value))}>{[[200, "Fast · 0.2 s"], [550, "Balanced · 0.55 s"], [1200, "Deep · 1.2 s"], [2500, "Thorough · 2.5 s"], [5000, "Extended · 5 s"]].map(([time, text]) => <option key={time} value={time}>{text}</option>)}</select></label>
    </div>
    <p className="live-review-budget">{moveCount ? `Current ${moveCount}-move game: up to ${budgetSeconds >= 60 ? `${Math.round(budgetSeconds / 60)} min` : `${budgetSeconds} s`} of engine search, plus setup. Depth may finish sooner.` : "Review time applies to every position in a game."}</p>
    <div className="live-engine-bottom"><label className="live-auto-label">Auto analyze<span>Refresh after each move</span></label><button type="button" role="switch" aria-label="Auto analyze" aria-checked={settings.auto !== false} className={`live-auto-switch ${settings.auto !== false ? "on" : ""}`} onClick={() => onChange("auto", settings.auto === false)}><i/></button></div>
    <div className="live-engine-bottom"><label className="live-auto-label">Auto review<span>Review the game after play pauses</span></label><button type="button" role="switch" aria-label="Auto review" aria-checked={settings.autoReview !== false} className={`live-auto-switch ${settings.autoReview !== false ? "on" : ""}`} onClick={() => onChange("autoReview", settings.autoReview === false)}><i/></button></div>
    <button className="live-analyze-now" onClick={onAnalyzeNow}><Zap size={15}/>{analysisStatus === "running" ? "Restart search" : "Analyze position"}</button>
  </section>;
}

function SideReviewCard({ side, data }) {
  const name = side === "w" ? "White" : "Black";
  return <div className={`live-side-review ${side}`}><div className="live-side-heading"><span className="live-side-mark">{name[0]}</span><div><small>{name.toUpperCase()}</small><strong>{data?.count || 0} moves reviewed</strong></div></div><div className="live-side-scores"><div><small>ACCURACY</small><strong>{data?.accuracy === null || data?.accuracy === undefined ? "—" : `${data.accuracy}%`}</strong></div><div><small>GAME RATING</small><strong>{data?.elo ?? "—"}<em>{data?.elo ? " Elo" : ""}</em></strong></div></div><p>{data?.elo ? "Training estimate from this game" : "Review at least 6 moves for a rating estimate."}</p></div>;
}

function openingSteps(timeline) {
  return timeline.reduce((steps, opening, index) => {
    if (opening && steps.at(-1)?.name !== opening.name) steps.push({ name: opening.name, eco: opening.eco, ply: index + 1 });
    return steps;
  }, []);
}

function MoveNotebook({ row, opening }) {
  if (!row) return <article className="live-move-notebook"><span className="eyebrow dark">MOVE NOTEBOOK</span><h3>Choose a reviewed move</h3><p>Select a move above to read its position notes and the engine’s idea.</p></article>;
  const moveNumber = `${Math.floor(row.index / 2) + 1}${row.color === "w" ? "." : "..."}`;
  const findability = row.findability;
  const ease = findability >= 70 ? "More visible" : findability >= 45 ? "Needs a closer look" : "Hard to spot";
  const positionNote = row.phase === "Opening" ? "This decision belongs to the opening: development and pawn structure still shape the plan." : row.phase === "Endgame" ? "This is an endgame decision, where king activity and pawn moves often matter most." : row.tactical ? "This is a forcing moment with a check, capture, or immediate threat to examine." : "This is a quieter middle game choice; compare plans and piece placement.";
  const qualityNote = row.label === "Brilliant" ? "The move is the engine’s first choice and offers material for compensation in its line." : row.label === "Great" ? "The engine strongly prefers this move over its next candidate." : row.isBest ? "You matched the engine’s first choice at this search depth." : row.label === "Blunder" || row.label === "Miss" || row.label === "Mistake" ? `The evaluation shifted after ${row.san}. Replay the position and compare ${row.bestMove || "the engine’s choice"} with your move.` : `The engine preferred ${row.bestMove || "a different move"}, though your choice kept more of the position’s chances.`;
  const coachPrompt = row.label === "Blunder" || row.label === "Miss" || row.label === "Mistake" ? `Before replaying ${row.bestMove || "the engine line"}, pause at the previous position and list your opponent’s checks, captures, and threats.` : row.tactical ? "Pause before this move and look for checks, captures, and forcing replies. Which continuation would you calculate first?" : row.phase === "Endgame" ? "Pause before this move. Which king or pawn move would improve your position without allowing a tactic?" : "Pause before this move. Compare the plans behind your choice and the engine’s first choice.";
  return <article className="live-move-notebook" aria-label={`Analysis of ${moveNumber} ${row.san}`}>
    <div className="live-notebook-head"><div><span className="eyebrow dark">MOVE NOTEBOOK</span><h3>{moveNumber} {row.san}</h3><span className={`live-notebook-label quality-${row.label.toLowerCase()}`}>{row.label}</span></div><span>{row.color === "w" ? "White" : "Black"} · {row.phase}</span></div>
    {opening && <p className="live-notebook-opening">{opening.eco} · {opening.name}</p>}
    <p>{positionNote}</p><p>{qualityNote}</p><p>The search changed the evaluation from {formatEngineScore(row.beforeScore)} to {formatEngineScore(row.afterScore)} from White’s view. For the mover, that is {row.loss} centipawns and {row.chanceLoss}% estimated win chance lost.</p>
    <div className="live-notebook-numbers"><div><small>BEFORE</small><strong>{formatEngineScore(row.beforeScore)}</strong></div><div><small>AFTER</small><strong>{formatEngineScore(row.afterScore)}</strong></div><div><small>ACCURACY</small><strong>{row.accuracy}%</strong></div></div>
    <div className="live-notebook-idea"><small>ENGINE’S IDEA</small><strong>{row.bestMove || "No legal reply"}</strong><p>{row.engineLine || "The position has reached a game ending."}</p></div>
    <div className="live-notebook-exercise"><small>TRAIN YOUR EYE</small><p>{coachPrompt}</p></div>
    <div className="live-findability"><div><span>Human findability of the engine move</span><strong>{findability === null ? "—" : `${findability}/100`}</strong></div><div className="live-findability-track"><i style={{ width: `${findability || 0}%` }}/></div><p>{findability === null ? "No engine candidate is available." : `${ease}: ${row.legalMovesBefore} legal choices, ${row.candidateGap}% win chance gap to the next engine candidate. Checks, captures, quiet moves, and sacrifices also affect this estimate.`}</p></div>
    <small className="live-notebook-disclaimer">Findability is a position heuristic, not a measured percentage of players who would find the move. Review notes use engine evaluations and board features; deeper searches can change them.</small>
  </article>;
}

function TurningPoints({ rows, onSelectPly }) {
  const moments = [...rows].filter((row) => row.chanceLoss >= 5).sort((a, b) => b.chanceLoss - a.chanceLoss).slice(0, 3);
  return <section className="live-turning-points"><div><span className="eyebrow dark">REVIEW IDEA</span><h3>Turning points to replay</h3><p>The largest changes in estimated winning chances.</p></div>{moments.length ? <div className="live-turning-list">{moments.map((row) => <button key={row.index} onClick={() => onSelectPly(row.index + 1)}><span>{Math.floor(row.index / 2) + 1}{row.color === "w" ? "." : "..."} {row.san}</span><strong>{row.label}</strong><em>−{row.chanceLoss}%</em><small>Try {row.bestMove || "the engine line"}</small><ArrowRight size={14}/></button>)}</div> : <p className="live-turning-empty">No large swing found in the reviewed moves so far.</p>}</section>;
}

function ReviewDashboard({ review, historyProgress, onReviewGame, moves, currentPly, gameOpening, openingTimeline, autoReview, onSelectPly }) {
  const result = review.result;
  const summary = result?.review;
  const rows = result?.rows || [];
  const currentRow = currentPly > 0 ? rows[currentPly - 1] : null;
  const route = openingSteps(openingTimeline);
  const totalLabels = Object.fromEntries(reviewLabels.map((label) => [label, (summary?.sides.w.labels[label] || 0) + (summary?.sides.b.labels[label] || 0)]));
  return <section className="live-review-section" id="live-game-review"><div className="live-review-title"><div><span className="eyebrow dark">GAME REVIEW</span><h2>Two sides of the story.</h2><p>Accuracy, a training Elo estimate, and a reason to revisit each key move.</p><small className="live-review-auto-note">{autoReview ? "Auto review on · updates after you pause" : "Auto review off · run a review when ready"}</small>{result && <small className="live-review-settings-note">Depth cap {result.settings.reviewDepth} · {result.settings.movetime / 1000}s per position · {result.settings.reviewLines} candidates</small>}</div><button onClick={onReviewGame} disabled={!moves.length || review.status === "running"}><Sparkles size={16}/>{review.status === "ready" ? "Recalculate" : review.status === "running" ? "Reviewing…" : "Run now"}</button></div>
    {review.status === "queued" && <div className="live-review-queued" role="status">Auto review is scheduled. Continue playing or pause to let the engine finish the game review.</div>}
    {historyProgress && !historyProgress.error && <div className="live-chart-status" role="status">Reviewing {historyProgress.done} of {historyProgress.total} moves<span><i style={{ width: `${historyProgress.total ? historyProgress.done / historyProgress.total * 100 : 0}%` }}/></span></div>}
    {review.status === "error" && <p className="live-review-error" role="alert">{review.error}</p>}
    <div className="live-opening-route"><div><span className="eyebrow dark">OPENING RECOGNITION</span><h3>{gameOpening ? gameOpening.name : "No catalog match yet"}</h3><p>{gameOpening ? `${gameOpening.eco} · Deepest named opening reached in this game` : "Play or import more opening moves to reveal the line."}</p></div>{route.length > 0 && <div className="live-opening-steps">{route.slice(-5).map((step) => <button key={`${step.ply}-${step.name}`} onClick={() => onSelectPly(step.ply)}><small>{step.eco} · MOVE {Math.ceil(step.ply / 2)}{step.ply % 2 ? "." : "..."}</small><strong>{step.name}</strong></button>)}</div>}</div>
    <div className="live-accuracy-grid"><SideReviewCard side="w" data={summary?.sides.w}/><SideReviewCard side="b" data={summary?.sides.b}/></div>
    <AccuracyTimeline rows={rows} selectedPly={currentPly} onSelectPly={onSelectPly}/>
    {rows.length > 0 && <TurningPoints rows={rows} onSelectPly={onSelectPly}/>}
    {summary && <><div className="live-review-detail-grid"><div className="live-category-panel"><div className="live-section-heading"><span className="eyebrow dark">ADVANCED STATS</span><h3>Opening, tactics, strategy, endgame</h3><p>Scores use the moves in each category. Tactics can overlap another phase.</p></div>{categories.map(({ name, note }) => {
      const white = summary.sides.w.breakdown[name];
      const black = summary.sides.b.breakdown[name];
      return <div className="live-category-row" key={name}><div><strong>{name}</strong><small>{note}</small></div><div className="live-category-side"><span>W</span><div><i style={{ width: `${white.accuracy || 0}%` }}/></div><strong>{white.accuracy === null ? "—" : `${white.accuracy}%`}</strong><em>{white.elo ? `${white.elo} Elo` : `${white.count} moves`}</em></div><div className="live-category-side black"><span>B</span><div><i style={{ width: `${black.accuracy || 0}%` }}/></div><strong>{black.accuracy === null ? "—" : `${black.accuracy}%`}</strong><em>{black.elo ? `${black.elo} Elo` : `${black.count} moves`}</em></div></div>;
    })}</div><QualityMix counts={totalLabels}/></div>
    <div className="live-move-review"><div className="live-section-heading"><span className="eyebrow dark">MOVE LABELS</span><h3>Review every decision</h3><p>Brilliant is reserved for an engine approved material sacrifice; Great marks a critical best move. Labels may change with deeper search.</p></div><div className="live-review-list">{rows.map((row, index) => <button key={`${index}-${row.san}`} className={currentPly === index + 1 ? "active" : ""} onClick={() => onSelectPly(index + 1)}><span>{Math.floor(index / 2) + 1}{row.color === "w" ? "." : "..."}</span><strong>{row.san}</strong><em className={`quality-${row.label.toLowerCase()}`}>{row.label}</em><span>{row.accuracy}%</span><small>{row.chanceLoss > 0 ? `−${row.chanceLoss}% win chance` : "No loss"}</small><ArrowRight size={14}/></button>)}</div></div><MoveNotebook row={currentRow} opening={openingTimeline[currentPly - 1]}/></>}
    <p className="live-method-note">Move accuracy uses the published <a href="https://lichess.org/page/accuracy" target="_blank" rel="noreferrer">Lichess win chance formula</a>. CO.T averages those move scores and uses a sample adjusted heuristic for game Elo. These are training estimates, not an official rating or a measure of player strength.</p>
  </section>;
}

export default function LiveAnalysisPage({ game, moves, currentPly, analysis, history, historyProgress, review, board, settings, onSettingsChange, onAnalyzeNow, onReviewGame, openingName, gameOpening, openingTimeline, onUndo, onReset, onFlip, onImport, onSelectPly }) {
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

      <div className="live-center"><div className="live-center-heading"><div><span className="eyebrow dark">FOCUS BOARD</span><strong>{openingName || "Uncharted position"}</strong></div><span>{currentPly}/{moves.length} moves</span></div>{board}<div className="live-toolbar"><button onClick={onUndo} disabled={!currentPly}><ChevronLeft size={15}/> Undo move</button><button onClick={onFlip}><FlipHorizontal size={15}/> Flip</button><button onClick={onReset}><RotateCcw size={15}/> New board</button></div><div className="live-board-moves"><div><strong>Move trail</strong><span>Tap a move to inspect it</span></div><div><button className={currentPly === 0 ? "active" : ""} onClick={() => onSelectPly(0)}>Start</button>{moves.map((move, index) => <button key={`${index}-${move}`} className={index + 1 === currentPly ? "active" : ""} onClick={() => onSelectPly(index + 1)}>{index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ""}{move}{review.result?.rows[index] && <i className={`quality-${review.result.rows[index].label.toLowerCase()}`}/>}</button>)}</div></div></div>

      <div className="live-arena-right"><EngineControls settings={settings} moveCount={moves.length} onChange={onSettingsChange} onAnalyzeNow={onAnalyzeNow} analysisStatus={analysis.status}/><section className="live-lines-card"><div className="live-section-heading"><span className="eyebrow dark">ENGINE IDEAS</span><h2>{settings.multiPv} {settings.multiPv === 1 ? "path" : "paths"} forward</h2><p>Scores are shown from White’s side.</p></div>{data?.lines.length ? <div className="live-variations">{data.lines.map((line) => <div key={line.rank} className={line.rank === 1 ? "top" : ""}><span className="live-variation-rank">{line.rank === 1 ? <Sparkles size={16}/> : `0${line.rank}`}</span><div><strong>{line.san || line.uci}</strong><p>{line.line}</p></div><em>{formatEngineScore(line.score)}</em></div>)}</div> : <div className="live-lines-empty"><ScanSearch size={30}/><strong>{data?.status === "Checkmate" || data?.status === "Draw" ? "No continuation available" : "Finding the best continuations"}</strong><span>{data?.status === "Checkmate" || data?.status === "Draw" ? "Start a new board to keep analyzing." : "The first search may take a moment."}</span></div>}</section></div></div>

    <ReviewDashboard review={review} historyProgress={historyProgress} onReviewGame={onReviewGame} moves={moves} currentPly={currentPly} gameOpening={gameOpening} openingTimeline={openingTimeline} autoReview={settings.autoReview !== false} onSelectPly={onSelectPly}/>
    <div className="live-chart-grid"><EvaluationTimeline points={evaluationPoints}/><MaterialTimeline points={materialPoints}/></div>
    <div className="live-lower-grid"><section className="live-import-card"><div className="live-section-heading"><span className="eyebrow dark">BRING A GAME</span><h2>Paste a PGN</h2><p>Load a game from the standard starting position to build its review and charts.</p></div><form onSubmit={importPgn}><textarea aria-label="PGN to analyze" value={pgn} onChange={(event) => setPgn(event.target.value)} placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"/><button type="submit" disabled={!pgn.trim()}><FileInput size={15}/> Load game <ArrowRight size={14}/></button></form>{importMessage && <small role="status" className="live-import-message">{importMessage}</small>}</section><section className="live-position-card"><div className="live-section-heading"><span className="eyebrow dark">SHARE A POSITION</span><h2>Current FEN</h2><p>The board state after {currentPly} {currentPly === 1 ? "move" : "moves"}.</p></div><code>{game.fen()}</code><button onClick={copyFen}>{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy FEN"}</button><div className="live-tip"><Activity size={16}/><span>Engine depth is a cap; the search may stop earlier when its time limit is reached.</span></div></section></div>
  </div>;
}
