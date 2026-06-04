import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description:
    'jp402（JPYC × x402 ディスカバリー scanner）のプライバシーポリシー。アカウント・Cookie・トラッキングを用いず個人情報を収集しないこと、サーバーログやオンチェーン情報の扱いを定めます。',
};

const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';

const UPDATED = '2026-06-04';

export default function PrivacyPage() {
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
          <span className="eyebrow">LEGAL · プライバシー</span>
          <h1>プライバシーポリシー</h1>
          <p className="lede">
            jp402（以下「本サイト」）は、利用者の個人情報をできる限り「持たない」設計です。
            本ポリシーは、本サイトが扱う情報とその範囲を説明します。
          </p>
        </div>
      </header>

      <main className="wrap legal">
        <p className="updated">最終更新: {UPDATED}</p>

        <section>
          <h2>1. 収集しない情報</h2>
          <p>
            本サイトは、ユーザー登録・ログイン・ウォレット接続の機能を持たず、
            <strong>アカウント情報・氏名・メールアドレス等の個人情報を収集しません</strong>。
            トラッキング Cookie や行動分析（アクセス解析）ツールも使用していません。
          </p>
        </section>

        <section>
          <h2>2. サーバー / ホスティングのログ</h2>
          <p>
            本サイトはホスティング事業者（例: Vercel）上で配信されます。
            これらの事業者は、サービス提供・不正防止・安定運用のため、IP アドレスやアクセス日時、
            User-Agent などの標準的なアクセスログを一時的に記録することがあります。
            これらは事業者のポリシーに基づいて取り扱われ、本サイトが個人を特定する目的で利用・保存することはありません。
          </p>
        </section>

        <section>
          <h2>3. オンチェーン情報の扱い</h2>
          <p>
            本サイトが表示する着金実績・受取先（payTo）アドレス・取引量などは、
            Polygon ブロックチェーン上にすでに公開されている情報を読み取って可視化したものです。
            これらは誰でも参照できる公開データであり、本サイトが新たに個人情報として収集・作成するものではありません。
            なお、ウォレットアドレスは文脈によっては個人に結び付き得る情報です。本サイトはアドレスと個人を紐付ける情報を保持しません。
          </p>
        </section>

        <section>
          <h2>4. 外部サイトへのリンク</h2>
          <p>
            本サイトには、各売り手のリソースや GitHub など外部サイトへのリンクが含まれます。
            リンク先での情報の取り扱いについては、各サイトのプライバシーポリシーをご確認ください。本サイトは責任を負いません。
          </p>
        </section>

        <section>
          <h2>5. 改定</h2>
          <p>
            本ポリシーは予告なく改定されることがあります。重要な変更は本ページの最終更新日で示します。
          </p>
        </section>

        <section>
          <h2>6. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは{' '}
            <a href={REGISTRY_REPO} target="_blank" rel="noopener">jp402-registry</a>{' '}
            の Issue / Discussion で受け付けています。
          </p>
        </section>
      </main>
    </>
  );
}
