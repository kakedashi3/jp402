'use client';

import { useState } from 'react';

// ヒーロー内に置くターミナル風のワンライナー（発見の入口を1行で見せる）。
// 濃いグラデ背景の上に乗るので、白カードの CopyBlock とは別のダーク配色にする。
export function HeroTerminal({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボード不許可時は pre をユーザーが手動選択
    }
  }

  return (
    <div className="heroterm">
      <div className="heroterm-bar">
        <span className="heroterm-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="heroterm-title mono">discover · GET /api/services</span>
        <button type="button" className="heroterm-copy" onClick={copy} aria-label="コマンドをコピー">
          {copied ? '✓ コピー' : 'コピー'}
        </button>
      </div>
      <pre className="heroterm-body mono">
        <span className="heroterm-prompt" aria-hidden="true">$ </span>
        {command}
      </pre>
    </div>
  );
}
