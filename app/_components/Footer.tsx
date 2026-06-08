const REGISTRY_REPO = 'https://github.com/kakedashi3/jp402-registry';
const REGISTER_URL = 'https://registry.jp402.com/';

// 全ページ共通フッター（layout.tsx から描画）。
// jp402 は kakedashi3 個人 OSS 帽子の非公式プロジェクト。著作権表記も kakedashi3 名義で統一する。
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="wrap">
      <div className="footlinks">
        <a href="/">ホーム</a>
        <a href="/x402">x402とは</a>
        <a href="/faq">FAQ</a>
        <a href={REGISTRY_REPO} target="_blank" rel="noopener">
          jp402-registry（台帳/標準）
        </a>
        <a href={REGISTER_URL} target="_blank" rel="noopener">
          登録
        </a>
        <a href="/terms">利用規約</a>
        <a href="/privacy">プライバシー</a>
      </div>
      <p className="footnote">
        ⚠️ 有志による非公式プロジェクトです。JPYC 株式会社とは関係ありません（JPYC は同社の登録商標）。
        “jp402” は x402（HTTP-native 決済プロトコル）の JPYC 向け準拠拡張を指す呼称です。
      </p>
      <p className="footcopy mono">© {year} kakedashi3 · OSS（個人プロジェクト）</p>
    </footer>
  );
}
