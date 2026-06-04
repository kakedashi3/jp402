# DESIGN.md — jp402

> このファイルはAIエージェントが正確な日本語UIを生成するためのデザイン仕様書です。
> セクションヘッダーは英語、値の説明は日本語で記述しています。
> 実装の真実は `app/globals.css`（CSS 変数）。値が乖離したらCSSを正とする。

---

## 1. Visual Theme & Atmosphere

- **デザイン方針**: クリーン・モダンで信頼感のあるプロダクト UI。ディスカバリー（探索）ツールらしく、情報を整理して見せる
- **密度**: ゆったり（line-height 1.8、十分な余白）。一覧はカード型で 1 行 1 サービス
- **キーワード**: クリーン / モダン / トラストフル / 軽量 / 和文ファースト

---

## 2. Color Palette & Roles

### Primary（ブランドカラー）

- **Primary** (`#6c5ce7`): メインのブランドカラー。CTA・リンク・価格・kicker
- **Primary Dark** (`#4b3fb0`): hover/press、hero グラデーション終端
- **Primary Light** (`#8b7bff`): hero グラデーション起点・アクセント

### Semantic（意味的な色）

- **Danger** (`#d64545`): エラー、危険な操作
- **Warning** (`#8a6d3b`): 注意（免税/未登録 chip 等）。背景 `#fdf8ee` / 枠 `#f0e0bd`
- **Success** (`#2a8f5a`): 成功・検証済み（T番号あり chip 等）。背景 `#f1faf4` / 枠 `#bfe6cf`

### Neutral（ニュートラル）

- **Text Primary** (`#1a1a2e`): 本文テキスト（純黒 `#000` は使わない）
- **Text Secondary** (`#5a5a72`): 補足テキスト、ラベル、resource URL
- **Text Disabled** (`#9a9ab0`): 無効状態のテキスト
- **Border** (`#e4e4ec`): 区切り線、カード枠
- **Background** (`#f4f4f6`): ページ背景
- **Surface** (`#ffffff`): カード、空状態の面

---

## 3. Typography Rules

### 3.1 和文フォント

- **ゴシック体**: Hiragino Kaku Gothic ProN → Noto Sans JP（明朝は不使用）

### 3.2 欧文フォント

- **サンセリフ**: system-ui → -apple-system → Segoe UI → Arial
- **等幅**: SFMono-Regular → Consolas → Liberation Mono → Menlo（アドレス/URL/数値/コード）

### 3.3 font-family 指定

```css
/* 本文（和文を先頭に＝日本語の表示品質を優先） */
font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;

/* 等幅 */
font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
```

**フォールバックの考え方**:
- 和文フォントを先に指定（日本語の表示品質を優先）
- ウォレットアドレス・払い金額・コントラストアドレス・コードは必ず等幅（`.mono` クラス / `<code>`）
- 最後に generic family（sans-serif / monospace）

### 3.4 文字サイズ・ウェイト階層

| Role | 適用 | Size | Weight | Line Height | Letter Spacing | 備考 |
|------|------|------|--------|-------------|----------------|------|
| Display | `h1`（hero） | clamp(1.8rem, 5vw, 2.9rem) | 850 | 1.3 | 0 | palt + keep-all |
| Heading 1 | `h2` | clamp(1.4rem, 3.2vw, 1.9rem) | 800 | 1.4 | 0 | palt |
| Lede | `.lede` | clamp(1rem, 2.3vw, 1.12rem) | 400 | 1.9 | .02em | hero 説明文 |
| Body | `body` | 1rem (16px) | 400 | 1.8 | .02em | kern |
| Kicker | `.kicker` | .85rem | 700 | — | .08em | セクションラベル |
| Caption | `.sub` / `.res` | .85rem | 400 | — | — | 補足・URL |
| Small | footer / `.chip` | .75–.82rem | 400–700 | — | .14em(eyebrow) | 最小・chip |

### 3.5 行間・字間

- **本文の行間 (line-height)**: 1.8（日本語本文は 1.7〜2.0 が標準）
- **見出しの行間**: 1.3〜1.4
- **本文の字間 (letter-spacing)**: .02em（見出しは 0）

**ガイドライン**:
- 日本語本文は `line-height: 1.5` 以上（jp402 は 1.8）
- `letter-spacing` は和欧混植で欧文に影響するため本文は .02em に抑える

### 3.6 禁則処理・改行ルール

```css
line-break: strict;          /* 厳格な禁則処理（body 全体） */
overflow-wrap: anywhere;     /* 長いURL/英単語の折り返し（body 全体） */
word-break: keep-all;        /* 見出し h1: 語の途中で折らない */
word-break: break-all;       /* アドレス/URL（.res / .mono の値） */
```

**禁則対象**:
- 行頭禁止: `）」』】〕〉》、。，．・：；？！`
- 行末禁止: `（「『【〔〈《`

### 3.7 OpenType 機能

```css
font-feature-settings: 'kern' 1;  /* body: 和欧混植のカーニング */
font-feature-settings: 'palt' 1;  /* 見出し h1/h2/eyebrow: プロポーショナル字詰め */
font-variant-numeric: tabular-nums; /* 価格・tx数・アドレス: 桁揃え */
```

- **palt**: 見出し・eyebrow にのみ適用。本文には当てない（可読性優先）
- **kern**: 本文の和欧混植に適用

### 3.8 縦書き

該当なし（横書きのみ）。

---

## 4. Component Stylings

### Buttons（`.btn`）

**Primary**（`.btn.primary` — hero 上では白地に accent 文字）
- Background: `#ffffff`（hover `#f3f0ff`）
- Text: `#6c5ce7`
- Padding: 12px 20px
- Border Radius: 10px
- Font Size: .95rem / Font Weight: 700
- Min Height: 44px（タッチターゲット）

**Ghost / Secondary**（`.btn.ghost`）
- Background: `rgba(255,255,255,.1)`（hover `.2`）
- Text: `#ffffff`
- Border: 1px solid `rgba(255,255,255,.45)`
- Padding: 12px 20px / Border Radius: 10px

**Chip**（`.chip` — メタ情報タグ）
- Border: 1px solid `#e4e4ec` / Radius: 999px / Padding: 3px 10px / Font Size: .75rem
- `.ok` = Success 系 / `.warn` = Warning 系

### Inputs

現状なし（登録は jp402-registry へ送客するため入力フォームを持たない）。追加時:
- Border: 1px solid `#e4e4ec` / focus: 2px solid `#6c5ce7`（outline-offset 2px）
- Border Radius: 10px / Padding: 10px 14px / Min Height: 44px

### Cards（`.svc` / `.empty`）

- Background: `#ffffff`
- Border: 1px solid `#e4e4ec`（`.empty` は dashed）
- Border Radius: 14px（`.empty` 16px）
- Padding: 18px 20px
- Shadow: Level 1（hover で Level 2 + translateY(-2px)）

---

## 5. Layout Principles

### Spacing Scale（`--sp-*`）

| Token | Value |
|-------|-------|
| XS | 4px |
| S | 8px |
| M | 14px |
| L | 20px |
| XL | 36px |
| XXL | 56px |

### Container（`.wrap`）

- Max Width: 960px
- Padding (horizontal): 20px

### Grid

- 一覧は単一カラムの縦積み（`.list` = grid / gap 14px）。レスポンシブで段組みしない

---

## 6. Depth & Elevation

| Level | Shadow | 用途 |
|-------|--------|------|
| 0 | none | フラットな要素 |
| 1 | `0 1px 2px rgba(15,16,33,.06)` | カード（`.svc` 既定） |
| 2 | `0 10px 28px rgba(15,16,33,.07)` | カード hover |
| 3 | `0 8px 24px rgba(15,16,33,.15)` | ダイアログ/フローティング（予約） |

---

## 7. Do's and Don'ts

### Do（推奨）

- フォントは必ず和文先頭のフォールバックチェーンを指定する
- 日本語本文の line-height は 1.8 を維持する
- ウォレットアドレス・URL・金額・tx 数は等幅（`.mono`）+ tabular-nums で表示
- 余白は Spacing Scale（`--sp-*`）に従う
- 色のコントラストは WCAG AA 以上（テキストは `#1a1a2e` / `#5a5a72`）

### Don't（禁止）

- `font-family` に和文フォント1つだけを指定しない
- 日本語本文に `line-height: 1.2` 以下を使わない
- テキストに純粋な `#000000` を使わない（`#1a1a2e` を使う）
- アドレス・数値をプロポーショナルフォントで表示しない（桁ズレ・誤読の元）

---

## 8. Responsive Behavior

### Breakpoints

| Name | Width | 説明 |
|------|-------|------|
| Mobile | ≤ 560px | カードの価格が左寄せに回り込む |
| Desktop | > 560px | 通常レイアウト |

- 主要なサイズは `clamp()` で連続スケール（h1/h2/lede/section padding）

### タッチターゲット

- 最小サイズ: 44px × 44px（`.btn` は `min-height: 44px`）

### フォントサイズの調整

- `clamp()` により mobile で本文 16px・見出しが自動縮小（h1 下限 1.8rem / h2 下限 1.4rem）

---

## 9. Agent Prompt Guide

### クイックリファレンス

```
Primary Color: #6c5ce7
Text Color: #1a1a2e
Background: #f4f4f6
Surface: #ffffff
Font (body): 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, sans-serif
Font (mono): 'SFMono-Regular', Consolas, Menlo, monospace
Body Size: 16px
Line Height: 1.8
Letter Spacing: .02em
```

### プロンプト例

```
jp402 のデザインシステム（DESIGN.md）に従ってサービス一覧カードを作成してください。
- プライマリカラー: #6c5ce7
- 本文フォント: 上記 body font-family / line-height 1.8 / letter-spacing .02em
- ウォレットアドレス・価格は等幅フォント（.mono）+ tabular-nums
- カード: 背景 #fff / 枠 1px solid #e4e4ec / radius 14px / shadow Level 1（hover Level 2）
- 余白は --sp-* スケール（XS4 / S8 / M14 / L20 / XL36 / XXL56）
- 純黒は使わず、テキストは #1a1a2e / 補足は #5a5a72
```
