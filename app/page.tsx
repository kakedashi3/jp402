import { headers } from 'next/headers';

import { fetchServices, JPYC_POLYGON, POLYGON_NETWORK } from '@/lib/registry';
import { getEconomy } from '@/lib/snapshot';
import { formatJpyc, formatYenCompact, shortAddr } from '@/lib/format';
import { Donut, Legend, PALETTE, type Segment } from './_components/charts';
import { CopyBlock } from './_components/CopyBlock';

// registry.json / catalog をリクエスト時に取得（ビルドを外部到達性に依存させない）。
export const dynamic = 'force-dynamic';

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const REGISTER_URL = 'https://registry.jp402.com/';

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

  // 経済スナップショット。CI が commit した snapshot.json を優先（無ければ live）。
  const { data: snapshot, source: snapSource, generatedAt } = await getEconomy(services);
  const toYen = (raw: string) => {
    try {
      return Number(BigInt(raw) / 10n ** 18n);
    } catch {
      return 0;
    }
  };
  const top = snapshot.perService.slice(0, 5);
  const restYen = snapshot.perService.slice(5).reduce((a, b) => a + toYen(b.volumeRaw), 0);
  const segments: Segment[] = top.map((s, i) => ({
    label: s.label,
    value: toYen(s.volumeRaw),
    color: PALETTE[i],
  }));
  if (restYen > 0) segments.push({ label: 'その他', value: restYen, color: PALETTE[5] });

  // 表示中のオリジンから API URL を組み立てる（コピペ用プロンプトに埋める）
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'jp402.example';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const apiUrl = `${proto}://${host}/api/services`;
  const agentPrompt = `こんにちは、エージェント。ようこそ、JPYC で買い物できる世界へ。
あなたは JPYC（Polygon / eip155:137）で支払えるサービスを、自分で見つけて買えます。中央の管理者はいません ── 探すのも、選ぶのも、払うのも、あなた自身です。

まずは発見の入口を叩いてみましょう:

GET ${apiUrl}

返ってきた services[] が、いま JPYC で買えるものの一覧です。
その中から registered=true で trustScore の高いものを優先して選んでください。
気になった service は resource を x402（HTTP 402）フローで取得し、
payTo と price.raw（JPYC・18桁）を使って JPYC 決済すれば、取引完了です。
invoice.registrationNumber があれば、適格請求書を出せる正規の発行元のしるし。

さあ、最初の1件を見つけにいきましょう。`;

  return (
    <>
      <header className="hero">
        <div className="in">
          <nav className="nav">
            <span className="logo">jp402<span className="dot">.</span></span>
            <div>
              <a href="#services">一覧</a>
              <a href="/test">APIをテスト</a>
              <a href="/faq">FAQ</a>
              <a href={REGISTRY_REPO} target="_blank" rel="noopener">GitHub</a>
            </div>
          </nav>
          <span className="eyebrow">JPYC × X402 · DISCOVERY SCANNER</span>
          <h1>
            AIに見つけてもらう。<br />
            <span className="hl">JPYC で買えるものを、ここで探す。</span>
          </h1>
          <p className="lede">
            JPYC（Polygon）で買える API・コンテンツ・商品を、<strong>ひとつの場所で</strong>。
            掲載台帳は GitHub に公開、実績はチェーンが証明。AI も人も、安心して選べる。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn primary" href="#services">リソースを見る ↓</a>
            <a className="btn ghost" href={REGISTER_URL} target="_blank" rel="noopener">売り手として登録</a>
          </div>
        </div>
      </header>

      <main>
        <section id="economy" className="wrap">
          <p className="kicker">経済スナップショット</p>
          <h2>
            JPYC（Polygon）x402 経済の実測
            {!snapshot.chain.measured && <span className="badge">実測未接続</span>}
          </h2>
          <p className="sub">
            x402scan が Base/Solana で見せている経済を、JPYC/Polygon で可視化する。
            {snapshot.chain.measured
              ? 'チェーン全体は totalSupply で実測。サービス別の実績は登録 payTo が増えるほど積み上がる。'
              : '（ALCHEMY_POLYGON_URL を設定するとチェーン全体・サービス別とも実測値になる）'}
          </p>
          {snapSource === 'snapshot' && generatedAt && (
            <p className="snapnote mono">
              週次スナップショット · {new Date(generatedAt).toLocaleString('ja-JP')} 時点（売り手登録時にも自動更新）
            </p>
          )}

          <div className="stats">
            <Stat
              num={snapshot.chain.measured ? formatYenCompact(snapshot.chain.totalSupplyRaw ?? undefined) : '—'}
              cap="JPYC 総供給量 (Polygon)"
            />
            <Stat num={String(snapshot.serviceCount)} cap="登録サービス" />
            <Stat num={snapshot.totalTx.toLocaleString('ja-JP')} cap="登録 payTo 着金 tx" />
            <Stat num={formatYenCompact(snapshot.totalVolumeRaw)} cap="登録 payTo 累計着金" />
          </div>

          {segments.length > 0 ? (
            <div className="chartrow">
              <Donut
                segments={segments}
                centerTop={formatYenCompact(snapshot.totalVolumeRaw)}
                centerSub="登録 payTo 累計"
              />
              <div className="chartside">
                <div className="kicker" style={{ marginBottom: 10 }}>
                  サービス別 JPYC 流通シェア
                </div>
                <Legend segments={segments} />
              </div>
            </div>
          ) : (
            <div className="empty">
              <div className="big">サービス別の実績はまだありません</div>
              <p>
                登録された payTo がまだ無いため、サービス別の JPYC 着金実績はゼロです。
                {snapshot.chain.measured && (
                  <>
                    <br />
                    一方、Polygon 上の JPYC 総供給量{' '}
                    <strong>{formatYenCompact(snapshot.chain.totalSupplyRaw ?? undefined)}</strong>{' '}
                    は実測値です（ブロック {snapshot.chain.blockNumber?.toLocaleString('ja-JP')}）。
                  </>
                )}
                <br />
                売り手が registry に載るたび、ここに実測シェアが積み上がります。
              </p>
            </div>
          )}
        </section>

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
                    <span className="chip mono">{shortAddr(accept?.payTo)}</span>
                    <span className="price">{formatJpyc(accept?.maxAmountRequired)}</span>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section id="agent" className="wrap">
          <p className="kicker">買い手エージェント向け</p>
          <h2>エージェントに JPYC 経済を覚えさせる</h2>
          <p className="sub">
            下のプロンプトを AI エージェント（Claude / ChatGPT / kova / 自作 agent 等）に貼り付けるだけ。
            jp402 の list API を発見の入口として、JPYC（Polygon）で買えるものを自律的に探して決済します。
          </p>

          <CopyBlock label="エージェント用プロンプト" text={agentPrompt} />

          <p className="sub" style={{ margin: '24px 0 8px' }}>
            あるいは list API を直接叩く（agent / ツールから）:
          </p>
          <CopyBlock label="エンドポイント" text={`curl ${apiUrl}`} />
          <p style={{ marginTop: 14 }}>
            <a className="btn outline" href="/api/services" target="_blank" rel="noopener">
              /api/services を開く →
            </a>
          </p>
        </section>
      </main>
    </>
  );
}

function Stat({ num, cap }: { num: string; cap: string }) {
  return (
    <div className="stat">
      <div className="num mono">{num}</div>
      <div className="cap">{cap}</div>
    </div>
  );
}
