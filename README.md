# jp402

**JPYC × x402 のディスカバリー scanner**（0→1 クリーン実装・ハイブリッド設計）。

[jp402-registry](https://github.com/kakedashi3/jp402-registry)（準拠カタログ＋opt-in 台帳＋PRゲート）を **真実の源**として読み、Polygon 上の JPYC で支払える x402 リソースを一覧・選別・詳細表示する薄い Next.js アプリ。

> ⚠️ 有志による**非公式**プロジェクト。JPYC 株式会社とは無関係（JPYC は登録商標）。

## なぜ 0→1 か（x402scan fork でなく）

x402scan の fork（`jp402-scan`）は探索として有用だったが、**Coinbase CDP facilitator＋ClickHouse 分析という"逆向きのエンジン"が中核に溶接**され、実使用は2〜3割・残りは死荷重＋`ignoreBuildErrors` 負債だった。本リポジトリは内省（knowledge `jp402-scan.md` §内省）の結論に従い、**必要分だけを薄く自作**する：

- **DB なし**：`registry.json` を読むだけ（jp402-registry が台帳）。
- **JPYC/Polygon 専用**：`0xe7c3d8c9…3c29`（decimals 18）。
- **依存薄く**：Next.js + プレーンCSS（[awesome-design-md-jp](https://github.com/kzhrknt/awesome-design-md-jp) 準拠の和文タイポ）。
- **負債ゼロ**：ウォレット/CDP/Stripe/composer/admin なし。

## 構成

```
app/
  layout.tsx          メタ + globals
  globals.css         デザイントークン(accent #6c5ce7 / 和文タイポ)
  page.tsx            ホーム: registry を読み JPYC リソース一覧 / 空状態
  service/[id]/page.tsx  詳細 + 信頼シグナル表示
lib/
  registry.ts         registry.json → 各 catalog → services 解決
  format.ts           JPYC(18桁) 表示・アドレス短縮
  signals.ts          信頼シグナル(Alchemy/paylog 走査) ※P5 でスタブ→実装
```

## 開発

```bash
corepack pnpm install   # or npm/pnpm
cp .env.example .env.local   # 既定で jp402-registry main を読む
pnpm dev                # http://localhost:3000
pnpm build
```

env:
- `NEXT_PUBLIC_REGISTRY_URL` — registry.json の取得元（既定 = jp402-registry main raw）
- `ALCHEMY_POLYGON_URL` — 任意。設定すると信頼シグナル（JPYC 着金実測）を有効化（P5 で実装）

## ロードマップ

- [ ] **P5 信頼シグナル実装**：`alchemy_getAssetTransfers` で payTo への JPYC 着金を走査 → txCount/uniqueWallets/volume（paylog 連携も）
- [ ] 検索・フィルタ（chain/price/T番号）
- [ ] 登録 probe を `@agentcash/discovery` で内製（今は jp402-registry の register ページへ送客）
- [ ] 買い手エージェント向け JSON API（`/api/services`）
- [ ] Vercel デプロイ

## 関連

- [jp402-registry](https://github.com/kakedashi3/jp402-registry) — 準拠カタログ＋台帳＋PRゲート（標準/登録側）
- jp402-scan（x402scan fork・private）— 参照仕様。本リポジトリの設計お手本（実装ベースには非採用）
