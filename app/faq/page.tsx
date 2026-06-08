import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'よくある質問（FAQ）',
  description:
    'jp402（JPYC × x402 ディスカバリー scanner）についてのよくある質問。全般・売り手向け・買い手向けに分けて、掲載方法やエージェントの使い方、信頼シグナルなどを丁寧に解説します。',
};

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const REGISTER_URL = 'https://registry.jp402.com/';

type Cat = 'general' | 'seller' | 'buyer';

interface QA {
  cat: Cat;
  q: string;
  a: React.ReactNode;
}

const GROUPS: { key: Cat; kicker: string; title: string }[] = [
  { key: 'general', kicker: '全般', title: 'jp402 について' },
  { key: 'seller', kicker: '売り手向け', title: '載せる・登録する' },
  { key: 'buyer', kicker: '買い手向け', title: '買う・エージェントで使う' },
];

const FAQ: QA[] = [
  // ───────── 全般 ─────────
  {
    cat: 'general',
    q: 'jp402 とは何ですか？',
    a: (
      <>
        jp402 は、JPYC（Polygon）で支払える x402 リソース（API・コンテンツ・商品）を見つけるための
        <strong>ディスカバリー scanner</strong> です。
        <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>{' '}
        という公開台帳を「真実の源」として読み込み、一覧・選別・詳細表示します。
        独自のデータベースは持たず、台帳を読んで見せることに徹した軽量なアプリです。
      </>
    ),
  },
  {
    cat: 'general',
    q: 'JPYC 株式会社の公式サービスですか？',
    a: (
      <>
        いいえ。<strong>有志による非公式プロジェクト</strong>で、JPYC 株式会社とは資本・運営上の関係はありません
        （「JPYC」は同社の登録商標です）。”jp402” は x402（HTTP-native 決済プロトコル）を
        JPYC 向けに準拠拡張した呼称であり、特定企業の製品名ではありません。
      </>
    ),
  },
  {
    cat: 'general',
    q: 'なぜ JPYC と Polygon に限定しているのですか？',
    a: (
      <>
        既存の汎用 x402 エクスプローラが Base / Solana・USDC に最適化され、Polygon を構造的に外している
        （チェーンセレクタからの削除など）ためです。jp402 はその「汎用が降りた空白」だけを取り、
        JPYC のホームである Polygon に集中することで、他にない発見体験を提供します。
        全チェーン対応や網羅性の競争は意図的に追いません。
      </>
    ),
  },
  {
    cat: 'general',
    q: 'なぜ宣言フォーマットに OpenAPI を採用しているのですか？',
    a: (
      <>
        ディスカバリーの宣言フォーマットの正典を <strong>OpenAPI（<code>/openapi.json</code>）</strong>に寄せ、
        既存の支配的な x402 エクスプローラ（x402scan）の discovery 仕様に準拠しているためです。理由は主に次の通りです。
        <br />
        <br />
        <strong>① 形式そのものは差別化要因ではない。</strong>宣言フォーマットは誰でも複製できるため、独自仕様に賭ける意味がありません。
        支配的なツールの規約に相乗りした方が、売り手の採用障壁が下がり、エコシステムの合意（相互運用性）が積み上がります。
        jp402 は「形式は相乗り、コンテンツ（JPYC / Polygon + 経理連携）で差別化」という方針です。
        <br />
        <br />
        <strong>② 寛容な reader（Postel の法則）。</strong>OpenAPI を優先しつつ、Bazaar 形式
        （<code>.well-known/x402-catalog.json</code>）など他形式も受け入れ、最後は実際の <code>402</code> 応答で確定します。
        ひとつの規約に依存して壊れないための保険です。
        <br />
        <br />
        <strong>③ 日本固有の要件を綺麗に隔離できる。</strong>価格・通貨は <code>x-payment-info</code>、
        T 番号や適格請求書などは <code>x-jp402</code> 拡張に分けて記述します。汎用エージェントは標準部分だけ読んで動作でき、
        将来 x402 の公式な地域拡張が出れば差し替え可能な粒度に保ってあります。
        <br />
        <br />
        <strong>④ 登録の単位が「発行者の openapi.json 1 本＝1 PR」で閉じる。</strong>記事ごと課金のような細かいリソースも、
        自分の openapi.json の中の <code>paths</code>（operation）として動的に表現でき、台帳（registry）側を都度書き換える必要がありません。
        受取先（payTo）を発行者で 1 つに揃えることで、信頼（着金実績）も 1 本に積み上がります。
      </>
    ),
  },
  {
    cat: 'general',
    q: '「載っている」ことは「信頼できる」ことと同じですか？',
    a: (
      <>
        いいえ。jp402 は <strong>「載る（listing）」と「信頼される（trust）」を別レイヤー</strong>として扱います。
        準拠ファイルを置けば誰でも載れますが、それは推薦を意味しません。各リソースには着金実績などの
        信頼シグナルを透明に表示し、利用者・エージェントが自分で判断できるようにすることが scanner の役割です。
      </>
    ),
  },
  {
    cat: 'general',
    q: 'ソースコードやライセンスは公開されていますか？',
    a: (
      <>
        jp402（本サイト）と{' '}
        <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>
        （台帳・標準）はいずれも GitHub で公開しています。台帳は誰でも読める JSON 形式で、
        他のツールからも参照できる公共のデータ源として運用しています。
      </>
    ),
  },

  // ───────── 売り手向け ─────────
  {
    cat: 'seller',
    q: '売り手として掲載されるにはどうすればよいですか？',
    a: (
      <>
        <a href={REGISTER_URL} target="_blank" rel="noopener">jp402-registry に opt-in 登録（PR）</a>
        するだけです。自分のドメインに <code>/openapi.json</code>（有料 operation に{' '}
        <code>x-payment-info</code> と <code>x-jp402</code> を付けた OpenAPI）を publish し、
        その URL を台帳（registry.json）に <code>openapi_url</code> として 1 行 PR で追加します。
        CI が「スキーマ準拠」と「402 応答が生きているか」を客観的にチェックし、問題なければ掲載されます。掲載は無料です。
        （旧 Bazaar 形式の <code>.well-known/x402-catalog.json</code> も後方互換として受け付けます。）
      </>
    ),
  },
  {
    cat: 'seller',
    q: '入力フォームから DB 登録する方が楽では？なぜ PR 方式なのですか？',
    a: (
      <>
        フォーム送信より PR の方が手間がかかるのは事実です。それでも PR を採るのは、
        <strong>公開された「合意」そのものが jp402 の中核的な価値</strong>だからです。
        <br />
        <br />
        運営が送信内容を自前のデータベースに保存する方式にすると、「載せる / 載せない」を運営が握る
        中央集権的な台帳になり、jp402 が避けたい構造（一社の都合でチェーンや登録が外される）を
        自分で再生産してしまいます。スクレイプやコピーで複製できるデータは差別化になりませんが、
        <strong>売り手が能動的に opt-in した同意の蓄積（公開 PR）</strong>は、レイヤーと売り手の合意でしか
        作れない複製不能な資産です。
        <br />
        <br />
        PR 方式なら台帳は誰でも読める公開 JSON のまま保て、他のツールからも参照・fork できる
        公共のデータ源になります。運営は可否を判断せず、CI が客観チェックするだけ
        （承認ではなく疎通検査）です。
        <br />
        <br />
        手間は「DB 化（＝この価値を捨てる）」ではなく「PR を出しやすくする」方向で下げています。
        登録ページにはプロンプトをコピーするだけの<strong>エージェント向け 2 ステップ登録</strong>を用意し、
        AI エージェントに PR の作成そのものを任せられるようにしています。
      </>
    ),
  },
  {
    cat: 'seller',
    q: '掲載に審査や手数料はありますか？',
    a: (
      <>
        審査による可否判断はありません。運営が「載せる / 載せない」を決める中央集権的な台帳にはしない方針です。
        能動的な opt-in（公開 PR）と、既知の悪性のみを除外する <strong>denylist</strong> で運用します。
        手数料も当面いただきません。
      </>
    ),
  },
  {
    cat: 'seller',
    q: '適格請求書（インボイス）や T 番号には対応していますか？',
    a: (
      <>
        x-jp402 仕様には invoice 区画があり、登録番号（T 番号）や適格請求書発行事業者かどうかを記述できます。
        現状は自己申告値の表示で、国税庁の適格請求書 Web-API による実在検証（verified）は
        順次対応していく予定です。それまでは「T 番号あり（要実在検証）」のように明示します。
      </>
    ),
  },

  // ───────── 買い手向け ─────────
  {
    cat: 'buyer',
    q: '買い手や AI エージェントはどう使いますか？',
    a: (
      <>
        2 通りあります。(1) トップページの「買い手エージェント向け」セクションにあるプロンプトをコピーして、
        お使いのエージェント（Claude / ChatGPT / kova / 自作 agent 等）に貼り付ける。
        (2) list API <code>GET /api/services</code> を直接呼ぶ。
        返り値の <code>services[]</code> から registered かつ信頼度の高いものを選び、
        各リソースを x402（HTTP 402）フローで取得して JPYC 決済します。
        yen402-mcp を使えば、MCP 経由でこの API を自動的に参照します。
      </>
    ),
  },
  {
    cat: 'buyer',
    q: '表示される実績データ（着金額・tx 数）はどこから来ますか？',
    a: (
      <>
        Polygon 上の JPYC 着金を <strong>Alchemy 経由でオンチェーン実測</strong>しています。
        台帳メタデータ（何のリソースか・JPYC 建てか・T 番号の有無）は registry 由来、
        実績シグナルはチェーン由来で、両者を突き合わせて「説明つき・実績裏付き」の発見にします。
        実測キーが未設定の環境では、デザイン確認用のサンプル表示になります。
      </>
    ),
  },
  {
    cat: 'buyer',
    q: '詐欺やなりすましのリスクはどう考えていますか？',
    a: (
      <>
        permissionless に載れる以上、詐欺的なリソースも準拠ファイルさえあれば掲載され得ます。
        ただし allowlist（許可制）は中央集権の再生産になるため採りません。代わりに、
        <strong>payTo（受取先）はオンチェーンの事実</strong>なので、着金実績ゼロやアドレス不一致は露見し、
        信頼シグナルで自然に下位へ沈みます。既知の悪性は denylist で除外します。
        最終的な支払い判断は、買い手側のポリシー（支出上限など）と併用してください。
      </>
    ),
  },
];

export default function FaqPage() {
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
              <a href={REGISTRY_REPO} target="_blank" rel="noopener">GitHub</a>
            </div>
          </nav>
          <span className="eyebrow">FAQ · よくある質問</span>
          <h1>よくある質問</h1>
          <p className="lede">
            jp402 の使い方・掲載方法・信頼の考え方について、
            <strong>全般 / 売り手向け / 買い手向け</strong>に分けてまとめました。
          </p>
        </div>
      </header>

      <main className="wrap">
        {GROUPS.map(group => {
          const items = FAQ.filter(item => item.cat === group.key);
          return (
            <section key={group.key} className="faq-group">
              <p className="kicker">{group.kicker}</p>
              <h2>{group.title}</h2>
              <div className="faqlist">
                {items.map((item, i) => (
                  <details className="faq" key={i}>
                    <summary>{item.q}</summary>
                    <div className="faq-a">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <div className="empty">
            <div className="big">解決しませんでしたか？</div>
            <p>
              不明点・要望は jp402-registry の Issue / Discussion で受け付けています。
              売り手として載せたい場合は下のボタンからどうぞ。
            </p>
            <p style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a className="btn outline" href={REGISTRY_REPO} target="_blank" rel="noopener">
                GitHub で質問する →
              </a>
              <a className="btn outline" href={REGISTER_URL} target="_blank" rel="noopener">
                レジストリに登録 →
              </a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
