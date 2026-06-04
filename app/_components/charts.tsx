// 依存ライブラリなしの軽量チャート（インラインSVG）。サーバーコンポーネントで静的描画。

export interface Segment {
  label: string;
  value: number;
  color: string;
}

// JPYC アクセント由来のパレット（USDC 比較ではなく JPYC 内部のシェア表示用）
export const PALETTE = ['#6c5ce7', '#8b7bff', '#a99bff', '#4b3fb0', '#c7bdff', '#cfd0e8'];

/** ドーナツ円グラフ。stroke-dasharray でセグメントを描く。 */
export function Donut({
  segments,
  size = 184,
  thickness = 28,
  centerTop,
  centerSub,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={segments.map(s => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}
    >
      {/* 背景リング */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edecf5" strokeWidth={thickness} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((s, i) => {
          const dash = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
            />
          );
          acc += dash;
          return el;
        })}
      </g>
      {centerTop && (
        <text x="50%" y="48%" textAnchor="middle" className="donut-top">
          {centerTop}
        </text>
      )}
      {centerSub && (
        <text x="50%" y="62%" textAnchor="middle" className="donut-sub">
          {centerSub}
        </text>
      )}
    </svg>
  );
}

/** 凡例（色・ラベル・割合）。 */
export function Legend({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <ul className="legend">
      {segments.map((s, i) => (
        <li key={i}>
          <span className="dot" style={{ background: s.color }} />
          <span className="lbl">{s.label}</span>
          <span className="pct mono">{((s.value / total) * 100).toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}
