import type { Metadata } from 'next';

import { TestClient } from './TestClient';

export const metadata: Metadata = {
  title: 'API をテスト',
  description:
    '登録前に、jp402 があなたのオリジンから何を解決するかを確認する。/openapi.json を解決し各ルートを probe（登録はされません）。',
};

const REGISTER_URL = 'https://kakedashi3.github.io/jp402-registry/register.html';

export default function TestPage() {
  return (
    <>
      <header className="hero slim">
        <div className="in">
          <nav className="nav">
            <a className="logo" href="/">
              jp402<span className="dot">.</span>
            </a>
            <div>
              <a href="/">ホーム</a>
              <a href="/faq">FAQ</a>
            </div>
          </nav>
          <span className="eyebrow">TEST · 登録前チェック</span>
          <h1>API をテスト</h1>
          <p className="lede">
            登録前に、jp402 があなたのオリジンから何を解決するかを確認できます。
            <code>/openapi.json</code> を解決し、見つかった各ルートを probe します。
            <strong>登録はされません。</strong>
          </p>
        </div>
      </header>

      <main className="wrap">
        <section>
          <TestClient />

          <p className="sub" style={{ marginTop: 28 }}>
            意図通りに解決できたら → {' '}
            <a href={REGISTER_URL} target="_blank" rel="noopener">レジストリに登録（手順①②③）</a>
          </p>
        </section>
      </main>
    </>
  );
}
