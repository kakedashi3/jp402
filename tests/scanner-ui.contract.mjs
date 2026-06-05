#!/usr/bin/env node
// Task #6 — scanner UI 表示テスト。
// home(stat カード / x402scan 風カード = method バッジ・概要 / buyer プロンプト)と
// 詳細ページ(method バッジ / payable URL / エージェント用プロンプト copy)を HTML で確認。
//   使い方: node tests/scanner-ui.contract.mjs
const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function run() {
  const home = await (await fetch(`${BASE}/`)).text();
  const api = await (await fetch(`${BASE}/api/services`)).json();
  const has = (h, s) => h.includes(s);

  // --- 経済 stat カード ---
  for (const cap of ['登録サービス', '登録 payTo 着金 tx', 'JPYC 総供給量']) {
    check(`#6 home stat「${cap}」`, has(home, cap));
  }
  // --- buyer 向けプロンプト欄 ---
  check('#6 home buyer プロンプト欄', has(home, 'resourceTemplate') || has(home, 'GET https'));

  // --- #services 一覧(x402scan 風) ---
  if ((api.count ?? 0) > 0) {
    check('#6 一覧に method バッジ', /class="method method-(get|post|put|patch|delete)"/.test(home));
    check('#6 一覧に空状態を出さない(登録あり)', !has(home, 'まだ登録がありません'));
    // 概要(description)が一覧に出る
    const anyDesc = (api.services ?? []).some(s => s.description && has(home, s.description.slice(0, 12)));
    check('#6 一覧にサービス概要', anyDesc);
  } else {
    check('#6 登録ゼロ時は空状態メッセージ', has(home, 'まだ登録がありません'));
  }

  // --- 詳細ページ ---
  if ((api.services ?? []).length > 0) {
    const s = api.services[0];
    const detail = await (await fetch(`${BASE}/service/${s.id}`)).text();
    check('#6 詳細に method バッジ', /class="method method-/.test(detail));
    check('#6 詳細に payable URL', has(detail, 'ep-url'));
    check('#6 詳細にエージェント用プロンプト copy', has(detail, 'プロンプトをコピー') || has(detail, 'JPYC×x402 リソースを取得して'));
    check('#6 詳細に信頼シグナル節', has(detail, '信頼シグナル'));
  }

  report();
}

function report() {
  console.log(`=== Task #6 scanner UI 表示 (${BASE}) ===`);
  let fail = 0;
  for (const { n, ok, d } of results) {
    console.log(`  ${ok ? '✅' : '❌'} ${n}${d && !ok ? `  [${d}]` : ''}`);
    if (!ok) fail++;
  }
  console.log(`\n  結果: ${results.length - fail}/${results.length} PASS${fail ? ` / ${fail} FAIL` : ' — 全PASS'}`);
  process.exit(fail ? 1 : 0);
}

run().catch(e => {
  console.error('テスト実行エラー:', e.message);
  process.exit(1);
});
