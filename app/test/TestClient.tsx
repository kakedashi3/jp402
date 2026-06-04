'use client';

import { useEffect, useState } from 'react';

interface Svc {
  publisher: string;
  resource: string;
  payTo: string | null;
  price: { jpyc: string | null };
  invoice: { registrationNumber?: string } | null;
  probeable: boolean;
  live402: boolean | null;
}
interface Result {
  origin: string;
  count: number;
  services: Svc[];
  issues: string[];
  note: string;
}

function liveLabel(s: Svc) {
  if (!s.probeable) return <span className="chip">宣言ベース</span>;
  if (s.live402 === true) return <span className="chip ok">✓ 402 確認</span>;
  if (s.live402 === false) return <span className="chip warn">402 以外</span>;
  return <span className="chip warn">到達不可</span>;
}

export function TestClient() {
  const [origin, setOrigin] = useState('');
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // ?origin= が付いていれば prefill + 自動実行（register.html の「登録前にテスト」導線用）
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('origin');
    if (p) {
      setOrigin(p);
      run(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(o0?: string) {
    let o = (o0 ?? origin).trim();
    if (!o) return;
    if (!/^https?:\/\//.test(o)) o = 'https://' + o;
    setErr('');
    setData(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/resolve?origin=${encodeURIComponent(o)}`);
      const j = await r.json();
      if (!r.ok) setErr(j.error || 'ディスカバリに失敗しました');
      else setData(j);
    } catch {
      setErr('リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="testbar">
        <input
          className="testinput mono"
          placeholder="https://yourdomain.com"
          value={origin}
          onChange={e => setOrigin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
        />
        <button className="btn primary" onClick={() => run()} disabled={loading}>
          {loading ? '実行中…' : 'ディスカバリ実行'}
        </button>
      </div>

      {err && <p className="testerr">⚠️ {err}</p>}

      {data && (
        <div style={{ marginTop: 20 }}>
          <p className="sub" style={{ margin: '0 0 12px' }}>
            <strong>{data.count}</strong> 件の JPYC リソースを解決
            <span className="badge" style={{ marginLeft: 10 }}>登録はされません</span>
          </p>

          {data.services.length > 0 && (
            <div className="list">
              {data.services.map((s, i) => (
                <div className="svc" style={{ display: 'block' }} key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="name">{s.publisher}</span>
                    {liveLabel(s)}
                    {s.invoice?.registrationNumber ? (
                      <span className="chip ok">T番号あり</span>
                    ) : (
                      <span className="chip">免税/未登録</span>
                    )}
                    <span className="price" style={{ marginLeft: 'auto' }}>
                      {s.price.jpyc ? `¥${s.price.jpyc} JPYC` : '—'}
                    </span>
                  </div>
                  <div className="res" style={{ marginTop: 6 }}>{s.resource}</div>
                  <div className="res">payTo: {s.payTo ?? '—'}</div>
                </div>
              ))}
            </div>
          )}

          {data.issues.length > 0 && (
            <div className="empty" style={{ textAlign: 'left', marginTop: 16 }}>
              <div className="big">気づき（登録前に直すと良い点）</div>
              <ul style={{ margin: '8px 0 0', paddingLeft: '1.2em' }}>
                {data.issues.map((x, i) => (
                  <li key={i} style={{ marginTop: 4 }}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
