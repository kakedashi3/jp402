// JPYC は decimals 18。最小単位文字列 → 円建て表示。
export function formatJpyc(raw?: string): string {
  if (!raw) return '—';
  try {
    const v = BigInt(raw);
    const d = 10n ** 18n;
    const int = v / d;
    const frac = v % d;
    let fracStr = '';
    if (frac !== 0n) {
      const padded = frac.toString().padStart(18, '0').replace(/0+$/, '');
      const two = padded.slice(0, 2);
      // 0.01 未満は 2 桁表示だと "0.00" になり実額が消える → 潰さず明示する。
      if (int === 0n && two === '00') return '¥<0.01 JPYC';
      fracStr = '.' + two;
    }
    return `¥${int.toLocaleString('ja-JP')}${fracStr} JPYC`;
  } catch {
    return raw;
  }
}

// API 用: 18dec raw → JPYC 建ての数値文字列（"5" / "0.5"）。表示桁を 2 桁に切り詰めるため
// 0.01 未満は lossy（"0.00" に潰れる）。買い手は price.raw（最小単位）を正とすること。
export function rawToJpyc(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const v = BigInt(raw);
    const d = 10n ** 18n;
    const frac = (v % d).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 2);
    return `${(v / d).toString()}${frac ? '.' + frac : ''}`;
  } catch {
    return null;
  }
}

// ヘッドライン用のコンパクト表記（万 / 億）。JPYC 18dec の raw を受ける。
export function formatYenCompact(raw?: string): string {
  if (!raw) return '—';
  let yen: number;
  try {
    yen = Number(BigInt(raw) / 10n ** 18n);
  } catch {
    return '—';
  }
  if (yen >= 1e8) return `¥${(yen / 1e8).toFixed(1)}億`;
  if (yen >= 1e4) return `¥${(yen / 1e4).toFixed(1)}万`;
  return `¥${yen.toLocaleString('ja-JP')}`;
}

export function shortAddr(a?: string): string {
  if (!a) return '—';
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

// resource URL からパス部分だけ（x402scan 風の "METHOD /path" 表示用）。
export function resourcePath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || '');
  } catch {
    return url;
  }
}

// 実際に払える URL（必須 query param を ?name={name} で埋める）。bare resource は
// 無料インデックス/404 のことがあるため、buyer はこちらを叩く。
export function payableUrl(
  resource: string,
  parameters?: Array<{ name: string; in: string; required: boolean }>,
): string {
  const q = (parameters ?? []).filter(p => p.in === 'query' && p.required);
  if (q.length === 0) return resource;
  const sep = resource.includes('?') ? '&' : '?';
  return resource + sep + q.map(p => `${p.name}={${p.name}}`).join('&');
}

// そのリソースを取得するためのエージェント向けプロンプト（コピー用）。
// x402scan の「Use … to test this endpoint」相当を JPYC×x402 文脈で。
export function buyerPrompt(opts: {
  method: string;
  url: string;
  priceJpyc: string;
  payTo?: string;
  publisher?: string;
}): string {
  const price = opts.priceJpyc && opts.priceJpyc !== '—' ? `価格 ${opts.priceJpyc}・` : '';
  const payTo = opts.payTo ? `payTo ${opts.payTo}。` : '';
  return `この JPYC×x402 リソースを取得して。JPYC（Polygon / eip155:137, asset 0xe7c3d8c9a439fede00d2600032d5db0be71c3c29）で支払う。

${opts.method} ${opts.url}

${price}${payTo}
手順: 上の URL を ${opts.method} で叩く → HTTP 402 が返る → EIP-3009 署名で JPYC を payTo に支払う → 本文を取得。価格・payTo はその場の 402 応答を最終真実とすること。`;
}
