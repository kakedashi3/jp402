#!/usr/bin/env node
// Task #3 — automation 疎通の「配線」テスト(静的)。
// 実デプロイは安全に自動化できないため、merge→反映チェーンのトリガー/配線が正しく
// 在ることを静的に確認する(実走は newsletter/paylog 登録で実証済み)。
//   - jp402 snapshot.yml(local): repository_dispatch(registry-updated) + 週次 cron + Vercel deploy + snapshot.mjs
//   - jp402-registry notify-jp402.yml(public raw): push:main + paths registry.json + jp402 へ dispatch + DISPATCH_TOKEN
//   使い方: node tests/automation-config.contract.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function run() {
  // --- jp402 snapshot.yml(local) ---
  const snap = readFileSync(path.join(ROOT, '.github/workflows/snapshot.yml'), 'utf8');
  check('#3 snapshot: repository_dispatch(registry-updated)', /repository_dispatch:[\s\S]*registry-updated/.test(snap));
  check('#3 snapshot: 週次 cron 有効', /schedule:[\s\S]*cron:/.test(snap));
  check('#3 snapshot: Vercel deploy step', /vercel (build|deploy|pull)/.test(snap) || /VERCEL_TOKEN/.test(snap));
  check('#3 snapshot: snapshot.mjs 実行', /snapshot\.mjs/.test(snap));

  // --- jp402-registry notify-jp402.yml(public raw) ---
  const NOTIFY_RAW =
    process.env.NOTIFY_RAW ??
    'https://raw.githubusercontent.com/kakedashi3/jp402-registry/main/.github/workflows/notify-jp402.yml';
  let notify = '';
  try {
    const r = await fetch(NOTIFY_RAW);
    notify = r.ok ? await r.text() : '';
    check('#3 notify-jp402.yml 取得', r.ok, `HTTP ${r.status}`);
  } catch (e) {
    check('#3 notify-jp402.yml 取得', false, e.message);
  }
  check('#3 notify: push main + paths registry.json', /push:/.test(notify) && /registry\.json/.test(notify));
  check('#3 notify: jp402 へ dispatch(registry-updated)', /repos\/kakedashi3\/jp402\/dispatches/.test(notify) && /registry-updated/.test(notify));
  check('#3 notify: DISPATCH_TOKEN 使用', /DISPATCH_TOKEN/.test(notify));

  console.log('=== Task #3 automation 配線(静的) ===');
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
