import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約',
  description:
    'jp402（JPYC × x402 ディスカバリー scanner）の利用規約。非公式・無保証（AS-IS）の前提、台帳は各売り手の自己申告であること、信頼シグナルの位置づけ、知的財産・準拠法を定めます。',
};

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';

const UPDATED = '2026-06-04';

export default function TermsPage() {
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
          <span className="eyebrow">LEGAL · 利用規約</span>
          <h1>利用規約</h1>
          <p className="lede">
            jp402（以下「本サイト」）をご利用いただく前に、以下の条件をご確認ください。
            本サイトの利用をもって、本規約に同意したものとみなします。
          </p>
        </div>
      </header>

      <main className="wrap legal">
        <p className="updated">最終更新: {UPDATED}</p>

        <section>
          <h2>1. 本サイトの位置づけ</h2>
          <p>
            本サイトは、JPYC（Polygon）で支払える x402 リソースを発見するための
            <strong>有志による非公式のディスカバリー scanner</strong> です。
            JPYC 株式会社が運営・提供するものではなく、同社とは資本・運営上の関係はありません
            （「JPYC」は同社の登録商標です）。”jp402” は x402（HTTP-native 決済プロトコル）を
            JPYC 向けに準拠拡張した呼称であり、特定企業の製品名ではありません。
          </p>
        </section>

        <section>
          <h2>2. 掲載情報について（自己申告と無審査）</h2>
          <p>
            本サイトが表示する情報は、公開台帳{' '}
            <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>{' '}
            に各売り手が opt-in 登録した内容と、Polygon 上のオンチェーン実測値を突き合わせたものです。
            台帳の記載（リソース内容・価格・登録番号〈T 番号〉・発行事業者区分など）は
            <strong>各売り手の自己申告</strong>であり、本サイトはその真正性・適法性・品質を保証・推薦するものではありません。
          </p>
          <p>
            本サイトは「載る（listing）」と「信頼される（trust）」を別レイヤーとして扱います。
            準拠ファイルを置けば誰でも掲載され得るため、掲載は推薦を意味しません。
          </p>
        </section>

        <section>
          <h2>3. 信頼シグナルと自己責任</h2>
          <p>
            着金実績・tx 数などの信頼シグナルは、判断を助けるための<strong>参考情報</strong>です。
            実測キーの設定状況やチェーンの状態により、欠落・遅延・誤差が生じることがあります。
            リソースの購入・決済を行うかどうかの<strong>最終判断は利用者（および利用者が用いる AI エージェント）の責任</strong>で、
            支出上限などのポリシーと併せてご判断ください。本サイトは取引の当事者ではなく、決済を仲介・代行しません。
          </p>
        </section>

        <section>
          <h2>4. 免責（無保証 / AS-IS）</h2>
          <p>
            本サイトは「現状有姿（AS-IS）」で提供され、正確性・完全性・特定目的への適合性・継続的な可用性について
            明示・黙示を問わず一切保証しません。本サイトの利用または利用不能、表示情報への依拠、
            外部サイト・売り手リソースとの取引に起因して生じたいかなる損害についても、
            法令上許容される最大限の範囲で責任を負いません。
          </p>
        </section>

        <section>
          <h2>5. 禁止事項</h2>
          <ul>
            <li>本サイトや台帳への虚偽情報・なりすまし・スパムの登録</li>
            <li>法令または公序良俗に反する目的での利用</li>
            <li>本サイトの運営を妨げる過度な自動アクセス・攻撃行為</li>
          </ul>
          <p>既知の悪性リソースは denylist により除外することがあります。</p>
        </section>

        <section>
          <h2>6. 知的財産・商標</h2>
          <p>
            本サイトおよび台帳のソースコードは GitHub で公開しています（ライセンスは各リポジトリの表記に従います）。
            「JPYC」は JPYC 株式会社の登録商標です。各売り手の名称・商標・コンテンツの権利は、それぞれの権利者に帰属します。
          </p>
        </section>

        <section>
          <h2>7. 変更・終了</h2>
          <p>
            本規約および本サイトの内容は、予告なく変更・中断・終了することがあります。重要な変更は本ページの最終更新日で示します。
          </p>
        </section>

        <section>
          <h2>8. 準拠法・お問い合わせ</h2>
          <p>
            本規約は日本法に準拠します。お問い合わせ・要望・不具合報告は{' '}
            <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>{' '}
            の Issue / Discussion で受け付けています。
          </p>
        </section>
      </main>
    </>
  );
}
