import { useId } from "react";

const qualityColors = {
  Brilliant: "#54b4af",
  Great: "#6495c9",
  Best: "#4b9365",
  Excellent: "#79aa6c",
  Good: "#b0c883",
  Inaccuracy: "#edbd67",
  Mistake: "#dc8b62",
  Miss: "#d97887",
  Blunder: "#ca655f",
};

function TimelineChart({ points, selected = points.length - 1, kind = "evaluation", onSelect }) {
  const gradientId = useId().replace(/:/g, "");
  const isEvaluation = kind === "evaluation";
  const values = points.map((point) => point.value);
  const maxAbs = isEvaluation ? 500 : Math.max(3, ...values.map((value) => Math.abs(value)));
  const x = (index) => 46 + index / Math.max(1, points.length - 1) * 608;
  const y = (value) => 85 - (isEvaluation ? Math.tanh(value / 280) * 59 : value / maxAbs * 59);
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index)} ${y(point.value)}`).join(" ");
  const area = `${path} L${x(points.length - 1)} 85 L46 85 Z`;
  const active = points[Math.min(selected, points.length - 1)];
  const currentLabel = isEvaluation ? `${active?.value > 0 ? "+" : ""}${((active?.value || 0) / 100).toFixed(2)}` : `${active?.value > 0 ? "+" : ""}${active?.value || 0}`;
  return <div className="data-chart">
    <div className="data-chart-head"><div><small>{isEvaluation ? "ENGINE EVALUATION" : "MATERIAL BALANCE"}</small><strong>{isEvaluation ? "How the position changed" : "What changed hands"}</strong></div><span>{currentLabel} <small>{active?.label || "Start"}</small></span></div>
    <svg viewBox="0 0 700 175" preserveAspectRatio="none" role="img" aria-label={isEvaluation ? "Evaluation trend from White's perspective" : "Material balance after each move"}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#81af74" stopOpacity=".31"/><stop offset="100%" stopColor="#81af74" stopOpacity=".025"/></linearGradient></defs>
      {[26, 85, 144].map((lineY, index) => <g key={lineY}><line x1="46" y1={lineY} x2="654" y2={lineY} className={index === 1 ? "zero" : ""}/><text x="39" y={lineY + 4} textAnchor="end">{index === 1 ? "0" : isEvaluation ? index === 0 ? "+3" : "−3" : index === 0 ? `+${maxAbs}` : `−${maxAbs}`}</text></g>)}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} className="data-chart-line" />
      {points.map((point, index) => <circle key={`${index}-${point.label}`} cx={x(index)} cy={y(point.value)} r={index === selected ? 5.5 : 3.3} className={index === selected ? "selected" : ""} onClick={() => onSelect?.(index)}><title>{point.label}: {isEvaluation ? `${point.value > 0 ? "+" : ""}${(point.value / 100).toFixed(2)}` : `${point.value > 0 ? "+" : ""}${point.value}`}</title></circle>)}
    </svg>
    <div className="data-chart-foot"><span>{points[0]?.label || "Start"}</span><span>{points.at(-1)?.label || "Current"}</span></div>
  </div>;
}

export function EvaluationTimeline({ points, selected, onSelect }) {
  return <TimelineChart points={points} selected={selected} onSelect={onSelect} />;
}

export function MaterialTimeline({ points, selected, onSelect }) {
  return <TimelineChart points={points} selected={selected} kind="material" onSelect={onSelect} />;
}

export function AccuracyTimeline({ rows, selectedPly, onSelectPly }) {
  const x = (index) => 45 + index / Math.max(1, rows.length - 1) * 630;
  const y = (accuracy) => 185 - accuracy * 1.6;
  const sides = [["w", "White", "#6c9c59"], ["b", "Black", "#385947"]];
  const selected = rows[selectedPly - 1];
  return <section className="live-accuracy-chart" aria-label="Move accuracy chart">
    <div className="live-accuracy-chart-head"><div><small>NEW · ACCURACY FLOW</small><h3>Where the game changed.</h3><p>Each dot is one move. Select a point to inspect it on the board.</p></div><div className="live-accuracy-chart-legend">{sides.map(([side, label, color]) => <span key={side}><i style={{ background: color }}/>{label}</span>)}</div></div>
    {rows.length ? <><svg viewBox="0 0 720 210" preserveAspectRatio="none" role="img" aria-label="Move accuracy for White and Black across the game">
      {[100, 75, 50, 25, 0].map((value) => <g key={value}><line x1="45" x2="675" y1={y(value)} y2={y(value)} className={value === 50 ? "midline" : ""}/><text x="37" y={y(value) + 4} textAnchor="end">{value}</text></g>)}
      {sides.map(([side, label, color]) => {
        const points = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.color === side);
        const path = points.map(({ row, index }, pointIndex) => `${pointIndex ? "L" : "M"}${x(index)} ${y(row.accuracy)}`).join(" ");
        return <g key={side}><path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>{points.map(({ row, index }) => <circle key={index} cx={x(index)} cy={y(row.accuracy)} r={selectedPly === index + 1 ? 7 : 5} fill={color} stroke="transparent" strokeWidth="18" role="button" tabIndex="0" aria-label={`${label} move ${Math.floor(index / 2) + 1} ${row.san}, ${row.accuracy}% accuracy`} onClick={() => onSelectPly(index + 1)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectPly(index + 1); } }}><title>{row.san} · {row.label} · {row.accuracy}%</title></circle>)}</g>;
      })}
    </svg><div className="live-accuracy-chart-foot"><span>FIRST MOVE</span><strong>{selected ? `${Math.floor((selectedPly - 1) / 2) + 1}${selected.color === "w" ? "." : "..."} ${selected.san} · ${selected.accuracy}%` : `${rows.length} moves reviewed`}</strong><span>LATEST MOVE</span></div></> : <p className="live-accuracy-chart-empty">Your accuracy flow appears as moves are reviewed.</p>}
  </section>;
}

export function ImpactTimeline({ rows, selectedPly, onSelectPly }) {
  const selected = rows[selectedPly - 1];
  const highest = Math.max(10, ...rows.map((row) => row.chanceLoss));
  const scale = Math.ceil(Math.min(100, highest) / 10) * 10;
  const width = Math.max(300, rows.length * 29 + 80);
  const spacing = (width - 100) / Math.max(1, rows.length);
  const y = (value) => 160 - Math.min(value, scale) / scale * 120;
  return <section className="live-impact-chart" aria-label="Move impact chart">
    <div className="live-accuracy-chart-head"><div><small>ENGINE IMPACT</small><h3>Where chances slipped.</h3><p>Each bar shows estimated winning chance lost on that move.</p></div><strong className="live-impact-selected">{selected ? `${selected.san} · −${selected.chanceLoss}%` : `${rows.length} moves`}</strong></div>
    {rows.length ? <><div className="live-impact-scroll"><svg viewBox={`0 0 ${width} 185`} style={{ minWidth: `${width}px` }} role="img" aria-label="Winning chance lost after each move">
      {[0, .25, .5, .75, 1].map((fraction) => <g key={fraction}><line x1="45" x2={width - 30} y1={y(scale * fraction)} y2={y(scale * fraction)}/><text x="38" y={y(scale * fraction) + 4} textAnchor="end">{Math.round(scale * fraction)}%</text></g>)}
      {rows.map((row, index) => {
        const color = row.chanceLoss >= 20 ? "#c85f5c" : row.chanceLoss >= 10 ? "#dc8b62" : row.chanceLoss >= 5 ? "#e4b75d" : row.color === "w" ? "#7dae71" : "#426c50";
        const barY = Math.min(157, y(row.chanceLoss));
        return <g key={index}><rect x={55 + index * spacing} y={barY} width={Math.min(19, spacing - 6)} height={160 - barY} rx="3" fill={color} stroke={selectedPly === index + 1 ? "#244b35" : "transparent"} strokeWidth="2" role="button" tabIndex="0" aria-label={`Move ${Math.floor(index / 2) + 1} ${row.san}, ${row.chanceLoss}% win chance lost`} onClick={() => onSelectPly(index + 1)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectPly(index + 1); } }}><title>{row.san} · {row.label} · −{row.chanceLoss}%</title></rect><text x={65 + index * spacing} y="177" textAnchor="middle">{Math.floor(index / 2) + 1}{row.color === "w" ? "." : ""}</text></g>;
      })}
    </svg></div><div className="live-impact-legend"><span><i className="steady"/>Small change</span><span><i className="inaccuracy"/>Inaccuracy</span><span><i className="mistake"/>Mistake</span><span><i className="blunder"/>Blunder</span></div></> : <p className="live-accuracy-chart-empty">Move impact appears when the engine finishes a review.</p>}
  </section>;
}

export function QualityMix({ counts }) {
  const entries = Object.entries(qualityColors).map(([label, color]) => ({ label, color, count: counts?.[label] || 0 }));
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  return <div className="quality-mix"><div className="quality-mix-head"><small>MOVE QUALITY</small><strong>The shape of your decisions</strong><span>{total} {total === 1 ? "move" : "moves"}</span></div><div className="quality-mix-track" role="img" aria-label={entries.map((entry) => `${entry.count} ${entry.label}`).join(", ")}>{entries.filter((entry) => entry.count).map((entry) => <span key={entry.label} style={{ width: `${entry.count / total * 100}%`, background: entry.color }} title={`${entry.label}: ${entry.count}`} />)}</div><div className="quality-mix-legend">{entries.map((entry) => <span key={entry.label}><i style={{ background: entry.color }}/>{entry.label} <strong>{entry.count}</strong></span>)}</div></div>;
}
