import type { Metadata } from 'next';

import { Logo } from '@/app/_components/Logo';

export const metadata: Metadata = {
  title: 'API で何を売るのか — マイクロペイメントのユースケース',
  description:
    'API でマイクロペイメントをやりたいけれど、何をどう売ればいいか分からない人のためのページ。x402 / JPYC で「1 回いくら」で売られている実在サービスを、調査・生成・データ・インフラなどのカテゴリーに分けて紹介します。自分の持ち物が API で売れる形を見つけられます。',
};

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const REGISTER_URL = 'https://registry.jp402.com/';

// ---------------------------------------------------------------------------
// カテゴリー定義
// examples の name/desc/price は x402 / MPP エコシステム（mpp.dev・x402scan）の
// 実在サービスから引用。価格は出典どおり USD 建て（Base/USDC が中心）。
// jp402 はこの市場を JPYC（Polygon）・円建てに持ち込むレイヤー。
// ---------------------------------------------------------------------------
type Example = { name: string; desc: string; price: string };
type Category = {
  icon: string;
  title: string;
  en: string;
  tagline: string;
  forWho: string;
  examples: Example[];
};

const CATEGORIES: Category[] = [
  {
    icon: '🔎',
    title: '調査・取得',
    en: 'Research / Retrieval',
    tagline: 'Web を調べて、必要な情報だけ持ってくる。',
    forWho: '検索・クロール・スクレイピングの仕組みを持っているなら、1 リクエストずつ売れる。',
    examples: [
      { name: 'Exa', desc: 'Web を意味検索して結果を返す', price: '$0.005 / 回' },
      { name: 'Tavily', desc: 'AI 向けの Web 検索', price: '$0.09 / 回' },
      { name: 'Firecrawl', desc: 'URL をスクレイピングして整形', price: '$0.002 / URL' },
      { name: 'Browserbase', desc: 'クラウドのブラウザセッションを貸す', price: '$0.12 / 時' },
      { name: 'ScreenshotOne', desc: '任意の URL のスクショを撮る', price: '$0.055 / 枚' },
    ],
  },
  {
    icon: '🎨',
    title: '生成',
    en: 'Generative AI',
    tagline: 'モデルで、画像・文章・音声・音楽を「作って」返す。',
    forWho: '学習済みモデル・推論環境・独自プロンプトを持っているなら、1 生成ずつ売れる。',
    examples: [
      { name: 'fal.ai', desc: 'FLUX で text-to-image 生成', price: '$0.025 / 枚' },
      { name: 'Stability AI', desc: '高品質な画像生成（Ultra）', price: '$0.092 / 枚' },
      { name: 'Suno', desc: 'テキストから楽曲を生成', price: '$0.105 / 曲' },
      { name: 'Deepgram', desc: '音声を文字起こし', price: '$0.053 / 回' },
      { name: 'Grok / Mistral / Perplexity', desc: 'LLM チャット補完', price: '〜$0.02 / 回' },
    ],
  },
  {
    icon: '📊',
    title: 'データ',
    en: 'Data / Feeds',
    tagline: '持っているデータを、叩かれた分だけ切り売りする。',
    forWho: 'リアルタイム情報・独自データベース・名寄せ済みデータを持っているなら、1 クエリずつ売れる。',
    examples: [
      { name: 'Nansen', desc: 'スマートマネーのオンチェーン資金フロー', price: '$0.05 / 回' },
      { name: 'CoinGecko', desc: '暗号資産の現在価格', price: '$0.06 / 回' },
      { name: 'OpenWeather', desc: '指定地点の現在の天気', price: '$0.006 / 回' },
      { name: 'RentCast', desc: '不動産の物件・成約データ', price: '$0.033 / 回' },
      { name: 'Hunter', desc: 'ドメインから連絡先を検索', price: '$0.013〜 / 回' },
    ],
  },
  {
    icon: '🛠️',
    title: 'インフラ・計算',
    en: 'Infra / Compute',
    tagline: '計算資源・保管・ノードを、使った分だけ従量で。',
    forWho: 'サーバー・ストレージ・ブロックチェーンノードの余力があるなら、使用量で売れる。',
    examples: [
      { name: 'Alchemy / Quicknode', desc: 'ブロックチェーン JSON-RPC コール', price: '$0.0001〜 / コール' },
      { name: 'Pinata IPFS', desc: 'ファイルを IPFS に保管（サイズ従量）', price: '$0.01〜' },
      { name: 'Judge0', desc: '任意コードをサンドボックス実行', price: '$0.006 / 回' },
      { name: 'Modal', desc: 'コード実行用サンドボックスを作成', price: '従量' },
    ],
  },
  {
    icon: '📰',
    title: 'コンテンツ',
    en: 'Content / Paywall',
    tagline: '記事・レポート・メディアを、1 本ずつ売る。',
    forWho: '書ける・撮れる・まとめられるなら、ログイン不要のペイウォールで 1 本ごとに売れる。',
    examples: [
      { name: 'DripStack', desc: '投稿コンテンツを 1 本ずつ販売', price: '$0.05〜$10 / 本' },
      { name: 'AI×Web3週報 アーカイブ', desc: 'ニュースレター過去号の x402 記事ゲート（jp402 掲載）', price: 'JPYC 建て' },
    ],
  },
  {
    icon: '📮',
    title: '通信・アクション',
    en: 'Messaging / Action',
    tagline: '現実世界に「1 アクション」を起こして課金する。',
    forWho: '送信・送付・架電などの実行手段を持っているなら、1 件ごとに売れる。',
    examples: [
      { name: 'agentfax', desc: '任意の番号に FAX を送信（ページ単価）', price: '$0.20 / ページ' },
      { name: 'StableEmail', desc: 'リレーアドレスからメール送信', price: '$0.02 / 通' },
      { name: 'StablePhone', desc: 'AI による電話発信', price: '$0.54 / 件' },
      { name: 'Papercut', desc: 'AI が書いた葉書を印刷・郵送', price: '$1 / $3' },
    ],
  },
  {
    icon: '🤝',
    title: 'タスク委託',
    en: 'Tasks / Labor',
    tagline: '人や別の AI に、成果報酬で仕事を発注する場を作る。',
    forWho: '人手・専門家・別エージェントを束ねられるなら、タスク単位で仲介・販売できる。',
    examples: [
      { name: 'molty.cash', desc: 'X 等で人にやってもらう pay-per-post を発注', price: '$0.10〜$50' },
      { name: 'Auto.exchange', desc: 'エージェントを実行（トークン量で従量）', price: '$0.0006〜 / 1k tok' },
    ],
  },
  {
    icon: '🛒',
    title: '物販・実世界',
    en: 'Commerce',
    tagline: '実物・チケットを、AI エージェントに直接売る。',
    forWho: '在庫・商品・席を持っているなら、agent が自律購入できる導線で売れる。',
    examples: [
      { name: 'Martin Estate Winery', desc: '本人確認付きでワインを購入', price: '商品価格' },
      { name: 'Sayer & Stone', desc: 'ジュエリーを購入', price: '商品価格' },
      { name: 'Megapot', desc: '宝くじチケットを購入', price: '$1 / 枚' },
      { name: 'mameta EC（28 店舗）', desc: 'JPYC × x402 で実物を販売（観測中）', price: '¥1,000〜' },
    ],
  },
];

// 「持ち物 → 売り方」対応表
const MAPPING: { have: string; sell: string }[] = [
  { have: '独自のデータ・データベース', sell: '1 クエリいくらの データ API' },
  { have: '学習済みモデル・推論環境', sell: '1 生成いくらの 生成 API' },
  { have: '書いた記事・レポート・動画', sell: 'ログイン不要の ペイウォール（1 本売り）' },
  { have: 'スクレイピング・検索の仕組み', sell: '1 リクエストいくらの 取得 API' },
  { have: 'サーバー・ストレージ・ノードの余力', sell: '使った分だけの 従量インフラ' },
  { have: '送信・架電・郵送などの実行手段', sell: '1 アクションいくらの 実行 API' },
  { have: '在庫・商品・チケット', sell: 'agent が自律購入できる x402 物販' },
];

const cardGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 'var(--sp-m)',
  margin: 'var(--sp-l) 0 var(--sp-xl)',
};
const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: 'var(--sh-1)',
};

export default function UseCasesPage() {
  return (
    <>
      <header className="hero slim">
        <div className="in">
          <nav className="nav">
            <Logo />
            <div>
              <a href="/">ホーム</a>
              <a href="/x402">x402とは</a>
              <a href="/faq">FAQ</a>
              <a href={REGISTRY_REPO} target="_blank" rel="noopener">GitHub</a>
            </div>
          </nav>
          <span className="eyebrow">LEARN · ユースケース</span>
          <h1>API で、何を売るのか</h1>
          <p className="lede">
            「API でマイクロペイメントをやってみたい。でも、<strong>何をどう売ればいいのか分からない</strong>」
            ── そんな人のためのページです。すでに <strong>x402 / JPYC で「1 回いくら」で売られている実在サービス</strong>を
            カテゴリー別に並べました。眺めているうちに、<strong>あなたの持ち物が「売れる API」になる形</strong>が見えてきます。
          </p>
        </div>
      </header>

      <main className="wrap legal">
        {/* 一言で */}
        <section>
          <h2>考え方 — HTTP で結果を返せるものは、何でも売れる</h2>
          <p>
            マイクロペイメント API の本質はシンプルです。
            <strong>「リクエストされたら、結果を返す。返す前に、その場で代金をもらう」</strong>。
            これだけ。x402（<a href="/x402">仕組みはこちら</a>）を使うと、サーバーが
            <code>402 Payment Required</code> で「これは有料」と返し、買い手（多くは AI エージェント）が
            その場で支払うと結果が返ります。アカウント登録もカード番号もいりません。
          </p>
          <p>
            だから「何を売るか」は、<strong>あなたが HTTP で返せる “結果” は何か？</strong> という問いに置き換わります。
            データ・生成物・調査結果・処理・実物 ── 下のカテゴリーが、その答えのカタログです。
          </p>
        </section>

        {/* 持ち物 → 売り方 */}
        <section>
          <h2>自分は何を売れる？ — 持ち物から逆引き</h2>
          <p>左の「持っているもの」に心当たりがあれば、右の形で API 化できます。</p>
          <div style={{ ...card, padding: 0, overflow: 'hidden', margin: 'var(--sp-l) 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.92rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                    持っているもの
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                    売れる形
                  </th>
                </tr>
              </thead>
              <tbody>
                {MAPPING.map((m, i) => (
                  <tr key={i}>
                    <td style={{ padding: '11px 16px', borderBottom: i < MAPPING.length - 1 ? '1px solid var(--line)' : 'none', color: 'var(--fg)' }}>
                      {m.have}
                    </td>
                    <td style={{ padding: '11px 16px', borderBottom: i < MAPPING.length - 1 ? '1px solid var(--line)' : 'none', fontWeight: 700, color: 'var(--accent-dark)' }}>
                      {m.sell}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* カテゴリーギャラリー */}
        <section>
          <h2>ユースケース・カタログ</h2>
          <p>
            実在する x402 / JPYC サービスを、売っている “結果” の種類でカテゴリー分けしました。
            <strong>各カードは「こういうものを持っているなら、こう売れる」</strong>の見本です。
          </p>
          <div style={cardGrid}>
            {CATEGORIES.map(c => (
              <div key={c.title} style={card}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.4rem' }} aria-hidden>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' }}>{c.title}</div>
                    <div className="mono" style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{c.en}</div>
                  </div>
                </div>
                <p style={{ fontSize: '.92rem', margin: '0 0 8px', color: 'var(--fg)' }}>{c.tagline}</p>
                <p style={{ fontSize: '.82rem', margin: '0 0 14px', color: 'var(--muted)' }}>{c.forWho}</p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {c.examples.map(e => (
                    <div
                      key={e.name}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '.86rem' }}>{e.name}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}> — {e.desc}</span>
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: '.74rem', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        {e.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="footnote" style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
            ※ 掲載サービス・価格は x402 / MPP エコシステム（<span className="mono">mpp.dev</span> ・ x402scan）の実在事例から引用。
            価格は出典どおり USD 建て（Base / USDC が中心）。jp402 は、この市場を
            <strong> JPYC（Polygon）・円建て</strong>に持ち込むディスカバリー層です。
          </p>
        </section>

        {/* どう始める */}
        <section>
          <h2>では、どう始めるか — 3 ステップ</h2>
          <ul>
            <li>
              <strong>① 売りたい “結果” を HTTP で返すエンドポイントを用意する</strong> —
              すでに API やコンテンツがあるなら、そのままで構いません。
            </li>
            <li>
              <strong>② 有料の操作で 402 を返すようにする</strong> —
              「いくら・どのアドレス（payTo）へ・どの通貨で」を 402 で提示します。
              JPYC（Polygon）建てなら、買い手はガス不要の署名で支払えます。
            </li>
            <li>
              <strong>③ jp402-registry に 1 行 PR で載る</strong> —
              自分のドメインに <code>/openapi.json</code>（有料 op に <code>x-payment-info</code> /{' '}
              <code>x-jp402</code>）を置いて URL を出すだけ。AI エージェントから発見されます。
            </li>
          </ul>
          <p>
            仕組みの詳細は <a href="/x402">「x402 とは」</a>、載せ方・信頼の考え方は{' '}
            <a href="/faq">FAQ</a> を参照してください。
          </p>
        </section>

        <p style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn primary" href={REGISTER_URL} target="_blank" rel="noopener">
            売り手として登録する →
          </a>
          <a className="btn outline" href="/x402">x402 の仕組みを読む →</a>
          <a className="btn ghost" href="/">リソース一覧を見る →</a>
        </p>
      </main>
    </>
  );
}
