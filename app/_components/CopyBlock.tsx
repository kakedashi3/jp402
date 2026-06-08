'use client';

import { useState } from 'react';

// コピペ用のコードブロック + コピーボタン（買い手がエージェントに貼り付ける）。
// tone='dark' でターミナル調のダークなコードブロックになる（ヒーローの配色と統一）。
export function CopyBlock({
  text,
  label = 'プロンプト',
  tone = 'light',
}: {
  text: string;
  label?: string;
  tone?: 'light' | 'dark';
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボード不許可時は手動選択にフォールバック（pre をユーザーが選択）
    }
  }

  return (
    <div className={tone === 'dark' ? 'copyblock copyblock-dark' : 'copyblock'}>
      <div className="copyhead">
        <span className="copylabel">{label}</span>
        <button type="button" className="copybtn" onClick={copy} aria-label={`${label}をコピー`}>
          {copied ? '✓ コピーしました' : 'コピー'}
        </button>
      </div>
      <pre className="copypre mono">{text}</pre>
    </div>
  );
}
