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
      fracStr = '.' + padded.slice(0, 2);
    }
    return `¥${int.toLocaleString('ja-JP')}${fracStr} JPYC`;
  } catch {
    return raw;
  }
}

export function shortAddr(a?: string): string {
  if (!a) return '—';
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
