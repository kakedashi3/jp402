import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x402 とは — HTTP-native な AI エージェント決済',
  description:
    'x402（HTTP 402 Payment Required を使った決済プロトコル）を、はじめての人にも分かるように丁寧に解説します。なぜ生まれたか・仕組み・登場人物・従来の決済との違い・JPYC との相性、そして jp402 がどこに位置するかまで。',
};

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const SPEC_URL = 'https://www.x402.org/';
const JPYC_CONTRACT = '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29';

// HTTP フロー図（mono pre で表示）
const FLOW = `① 買い手（AIエージェント）            ② 売り手のサーバー
   │  GET /article?id=42                  │
   │ ───────────────────────────────────▶ │
   │                                       │  「これは有料です」
   │   HTTP 402 Payment Required           │
   │   ＋ 支払い条件(いくら・どこへ・何で) │
   │ ◀─────────────────────────────────── │
   │                                       │
   │  条件どおり JPYC を送る署名を作る     │
   │  （ウォレットで EIP-3009 署名）       │
   │                                       │
   │  GET /article?id=42                   │
   │  ＋ 支払い署名を添付                  │
   │ ───────────────────────────────────▶ │
   │                          ┌──────────────────────────┐
   │                          │ ③ facilitator が         │
   │                          │   署名を検証し決済を実行  │
   │                          └──────────────────────────┘
   │   HTTP 200 OK ＋ 本文                  │
   │ ◀─────────────────────────────────── │
   ▼                                       ▼
 記事が手に入る                       JPYC を受け取る`;

const preBox: React.CSSProperties = {
  background: 'var(--card, #0e0e14)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '14px 16px',
  overflowX: 'auto',
  fontSize: '.8rem',
  lineHeight: 1.6,
  margin: '0 0 14px',
};

export default function X402Page() {
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
              <a href={REGISTRY_REPO} target="_blank" rel="noopener">GitHub</a>
            </div>
          </nav>
          <span className="eyebrow">LEARN · x402 とは</span>
          <h1>x402 とは</h1>
          <p className="lede">
            <strong>x402</strong> は、Web の「HTTP 402 Payment Required」という
            “使われていなかったステータスコード”を使って、
            <strong>API やコンテンツの代金をその場で支払う</strong>ためのオープンな決済プロトコルです。
            人間のクレジットカード入力を前提とせず、<strong>AI エージェントが自分で支払える</strong>のが最大の特徴です。
          </p>
        </div>
      </header>

      <main className="wrap legal">
        {/* 一言で */}
        <section>
          <h2>一言でいうと</h2>
          <p>
            「<strong>払うまで見せない。払えばすぐ見せる。</strong>」を、HTTP の標準の流れだけで実現する仕組みです。
            アカウント登録もカード番号も要りません。サーバーが「これは有料です（402）」と返し、
            買い手がその場で代金（jp402 の文脈では <strong>JPYC</strong>）を支払うと、
            同じ URL からすぐに中身が返ってきます。
          </p>
        </section>

        {/* 問題 */}
        <section>
          <h2>なぜ生まれたのか</h2>
          <p>
            これまでのオンライン決済は、すべて「人間がブラウザでカード番号を入れる」ことを前提に作られていました。
            ところが AI エージェントが自律的に Web を使う時代になると、この前提が壁になります。
          </p>
          <ul>
            <li>エージェントはカード番号入力フォームや 3D セキュアの画面を操作できない（するべきでもない）。</li>
            <li>API 1 回・記事 1 本のような<strong>少額</strong>に、クレジットカードの手数料・最低課金は重すぎる。</li>
            <li>サービスごとにアカウント登録・APIキー発行をするのは、無数のサービスを横断する agent には現実的でない。</li>
          </ul>
          <p>
            x402 は「<strong>支払いを HTTP リクエストの一部にしてしまう</strong>」ことでこれを解きます。
            エージェントはページを取りに行く感覚で、そのまま代金を払えます。
          </p>
        </section>

        {/* 仕組み */}
        <section>
          <h2>仕組み — HTTP 402 の流れ</h2>
          <p>
            鍵は、ほとんど使われてこなかった HTTP ステータス
            <code>402 Payment Required</code> です。流れはこうなります。
          </p>
          <pre className="mono" style={preBox}>{FLOW}</pre>
          <ul>
            <li>
              <strong>① 普通に叩く</strong> — 買い手はまず欲しい URL を普通に <code>GET</code> します。
            </li>
            <li>
              <strong>② 402 が返る</strong> — 有料リソースなら、サーバーは <code>402</code> と一緒に
              「<strong>いくら・どのアドレス(payTo)へ・どの通貨で</strong>」という支払い条件を返します。
            </li>
            <li>
              <strong>③ 払って再送</strong> — 買い手はその条件どおりの支払い（署名）を作り、
              その場の 402 が指定する支払いヘッダに載せて<strong>同じ URL をもう一度</strong>叩きます。
            </li>
            <li>
              <strong>④ 検証して 200</strong> — 支払いが正しければ、サーバーは <code>200 OK</code> と本文を返します。
            </li>
          </ul>
          <p>
            つまり「402 が返る → 払う → 200 が返る」という、<strong>たった 1 往復半</strong>の素直なやり取りです。
            この最後の真実は常に<strong>その場の 402 応答</strong>であり、一覧や宣言ではありません
            （だから jp402 でも「価格・payTo は 402 を最終真実とする」と案内しています）。
          </p>
        </section>

        {/* 登場人物 */}
        <section>
          <h2>登場人物は 3 者</h2>
          <ul>
            <li>
              <strong>買い手（client / AI エージェント）</strong> — リソースを取りに行き、402 を見て支払う側。
            </li>
            <li>
              <strong>売り手（resource server）</strong> — 有料リソースを公開し、402 で条件を提示する側。
              受け取り先アドレス（<code>payTo</code>）を持ちます。
            </li>
            <li>
              <strong>facilitator（決済の仲介者）</strong> — 売り手に代わって、買い手の署名を検証し、
              実際のオンチェーン決済を実行・確定する役割。売り手はブロックチェーンの細部を知らなくても、
              facilitator に「検証して」「決済して」と頼むだけで済みます。
            </li>
          </ul>
          <p>
            x402 で専門性が要るのは主に facilitator です。売り手・買い手は「402 を返す／読む」だけでよく、
            実装は驚くほど薄くなります。
          </p>
        </section>

        {/* 従来との違い */}
        <section>
          <h2>従来の決済とどう違うか</h2>
          <ul>
            <li>
              <strong>アカウント不要</strong> — 事前登録もログインもなし。ウォレットさえあればその場で払えます。
            </li>
            <li>
              <strong>少額に強い</strong> — 1 記事・1 API コールのような<strong>マイクロペイメント</strong>が成立します。
            </li>
            <li>
              <strong>機械が主役</strong> — 画面操作でなく HTTP ヘッダで完結するので、AI エージェントが自分で払えます。
            </li>
            <li>
              <strong>オープン標準</strong> — 特定企業の SDK に縛られず、HTTP と署名の規約に従えば誰でも実装できます。
            </li>
          </ul>
        </section>

        {/* JPYC */}
        <section>
          <h2>x402 と JPYC</h2>
          <p>
            x402 自体は通貨を選びません。jp402 は、その支払い通貨を
            <strong>JPYC（日本円ステーブルコイン）</strong>、ネットワークを
            <strong>Polygon</strong> に絞った世界を扱います。理由は 3 つあります。
          </p>
          <ul>
            <li>
              <strong>円建てで分かりやすい</strong> — 価格も会計も日本円のまま。為替を介しません。
            </li>
            <li>
              <strong>ガス不要の支払い体験</strong> — JPYC は <code>EIP-3009</code>（署名による送金）に対応し、
              買い手は「送金の許可に署名するだけ」。ガス代の支払いは facilitator 側に寄せられます。
            </li>
            <li>
              <strong>適格請求書とつながる</strong> — 日本の経理（T 番号・適格請求書）と接続できる余地があり、
              支払いと帳簿を地続きにできます。
            </li>
          </ul>
          <p className="mono" style={{ fontSize: '.82rem' }}>
            JPYC (Polygon / eip155:137) · asset {JPYC_CONTRACT} · decimals 18
          </p>
        </section>

        {/* jp402 の立ち位置 */}
        <section>
          <h2>では jp402 は何をするのか</h2>
          <p>
            x402 は「払う仕組み」ですが、<strong>「どこで買えるか」を見つける仕組み</strong>は別に要ります。
            jp402 はその<strong>ディスカバリー（発見）層</strong>です。
            JPYC（Polygon）で支払える x402 リソースを台帳から集め、一覧・選別・詳細表示し、
            買い手エージェントが最初に叩く<strong>発見の入口</strong>になります。
          </p>
          <p>
            掲載台帳は GitHub に公開（<a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>）、
            実績はチェーンが証明します。「載る」と「信頼される」は分けて扱い、判断は利用者・エージェントに委ねます。
          </p>
        </section>

        {/* もっと知る */}
        <section>
          <h2>もっと知る</h2>
          <ul>
            <li>
              <a href="/faq">jp402 のよくある質問（FAQ）</a> — 売り手の載せ方・買い手の使い方・信頼の考え方。
            </li>
            <li>
              <a href="/">トップで実際のリソース一覧と経済スナップショットを見る</a>。
            </li>
            <li>
              <a href={SPEC_URL} target="_blank" rel="noopener">x402 の公式情報（x402.org）</a> — プロトコルの一次情報。
            </li>
          </ul>
        </section>

        <p style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn primary" href="/">リソース一覧を見る →</a>
          <a className="btn outline" href="/faq">FAQ を読む →</a>
        </p>
      </main>
    </>
  );
}
