// 共通ヘッダーロゴ。jp4◎2 ワードマーク（紫ヘッダー用＝白字 + ◎白環2重 + 黄芯）を
// インライン SVG で描画。意匠は public/brand/logo-wordmark-hero.svg と同一（brand/README 参照）。
// href=null でリンクなし（ホーム＝現在地は span）。
export function Logo({ href = '/' }: { href?: string | null }) {
  const svg = (
    <svg viewBox="0 0 180 64" className="logo-svg" role="img" aria-label="jp402">
      <g
        fontFamily="system-ui, -apple-system, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif"
        fontWeight="800"
        fontSize="40"
        fill="#ffffff"
      >
        <text x="92" y="44" textAnchor="end">jp4</text>
        <text x="132" y="44" textAnchor="start">2</text>
      </g>
      <g transform="translate(112 29)">
        <circle r="15" fill="none" stroke="#ffffff" strokeWidth="4.5" />
        <circle r="6" fill="#ffe27a" />
      </g>
    </svg>
  );
  return href ? (
    <a className="logo" href={href} aria-label="jp402">
      {svg}
    </a>
  ) : (
    <span className="logo" aria-label="jp402">
      {svg}
    </span>
  );
}
