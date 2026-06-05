'use client';

import { useState } from 'react';

// インラインのコピーボタン（URL 等の横に置く小さいボタン）。
export function CopyButton({ text, title = 'コピー' }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // クリップボード不許可時は何もしない（ユーザーが手動選択）
    }
  }

  return (
    <button
      type="button"
      className="copyinline"
      onClick={copy}
      title={title}
      aria-label={title}
    >
      {copied ? '✓ コピー' : 'コピー'}
    </button>
  );
}
