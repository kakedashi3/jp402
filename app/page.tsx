import { fetchServices, JPYC_POLYGON, POLYGON_NETWORK } from '@/lib/registry';
import { formatJpyc, shortAddr } from '@/lib/format';

// registry.json / catalog をリクエスト時に取得（ビルドを外部到達性に依存させない）。
export const dynamic = 'force-dynamic';

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const REGISTER_URL = 'https://kakedashi3.github.io/jp402-registry/register.html';

export default async function Home() {
  const services = await fetchServices();
  // MVP: JPYC(Polygon) を受ける accept があるサービスのみ表示
  const jpyc = services.filter(s =>
    s.accepts?.some(
      a =>
        a.network === POLYGON_NETWORK &&
        a.asset?.toLowerCase() === JPYC_POLYGON,
    ),
  );

  return (
    <>
      <header className="hero">
        <div className="in">
          <nav className="nav">
            <span className="logo">jp402<span className="dot">.</span></span>
            <div>
              <a href="#services">一覧</a>
              <a href={REGISTRY_REPO} target="_blank" rel="noopener">GitHub</a>
            </div>
          </nav>
          <span className="eyebrow">JPYC × X402 · DISCOVERY SCANNER</span>
          <h1>
            AIに見つけてもらう。<br />
            <span className="hl">JPYC で買えるものを、ここで探す。</span>
          </h1>
          <p className="lede">
            <strong>jp402-registry</strong> の準拠台帳を読み、Polygon 上の JPYC で支払える
            x402 リソースを一覧・選別する。中央台帳に頼らず、オンチェーン実測で信頼を可視化する。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn primary" href="#services">リソースを見る ↓</a>
            <a className="btn ghost" href={REGISTER_URL} target="_blank" rel="noopener">売り手として登録</a>
          </div>
        </div>
      </header>

      <main>
        <section id="services" className="wrap">
          <p className="kicker">登録リソース</p>
          <h2>JPYC（Polygon）で買える x402 リソース</h2>
          <p className="sub">
            jp402-registry に opt-in 登録され、JPYC（Polygon）建ての支払いを受けるサービス。
            「載る」と「信頼される」は別レイヤー — 実績シグナルは透明に表示する（実測は順次）。
          </p>

          {jpyc.length === 0 ? (
            <div className="empty">
              <div className="big">まだ登録がありません</div>
              <p>
                最初の1件になりませんか？ JPYC × x402 で売っているなら、<br />
                <code>.well-known/x402-catalog.json</code> を置いて URL を1行 PR するだけです。
              </p>
              <p style={{ marginTop: 16 }}>
                <a className="btn primary" href={REGISTER_URL} target="_blank" rel="noopener">
                  レジストリに登録 →
                </a>
              </p>
            </div>
          ) : (
            <div className="list">
              {jpyc.map(s => {
                const accept = s.accepts.find(
                  a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON,
                );
                const t = s['x-jp402']?.invoice?.registrationNumber;
                return (
                  <a key={s.id} className="svc" href={`/service/${s.id}`}>
                    <div>
                      <div className="name">{s.publisher}</div>
                      <div className="res">{s.resource}</div>
                    </div>
                    {t ? <span className="chip ok">T番号あり</span> : <span className="chip">免税/未登録</span>}
                    <span className="chip">{shortAddr(accept?.payTo)}</span>
                    <span className="price">{formatJpyc(accept?.maxAmountRequired)}</span>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <footer className="wrap">
          <div style={{ marginBottom: 12 }}>
            <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry (台帳/標準)</a>
            <a href={REGISTER_URL} target="_blank" rel="noopener">登録</a>
          </div>
          ⚠️ 有志による非公式プロジェクトです。JPYC 株式会社とは関係ありません（JPYC は同社の登録商標）。
          "jp402" は x402（HTTP-native 決済プロトコル）の JPYC 向け準拠拡張を指す呼称です。
        </footer>
      </main>
    </>
  );
}
