#!/usr/bin/env node
// Task #8 — デプロイ/インフラ健全性テスト。
// jp402.com / registry.jp402.com の TLS+200、/api/services 契約、snapshot.json 配信、
// registry raw 到達、を確認する。secret/env の存在は CI 外からは見えないため対象外。
//   使い方: node tests/infra-health.contract.mjs
const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const REGISTRY_SITE = process.env.REGISTRY_SITE ?? 'https://registry.jp402.com';
const REGISTRY_RAW =
  'https://raw.githubusercontent.com/kakedashi3/jp402-registry/main/registry.json';
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function run() {
  for (const url of [BASE, `${REGISTRY_SITE}`]) {
    try {
      const r = await fetch(url);
      check(`#8 ${url} 200+TLS`, r.status === 200 && url.startsWith('https://'), `HTTP ${r.status}`);
    } catch (e) {
      check(`#8 ${url} 到達`, false, e.message);
    }
  }

  const api = await fetch(`${BASE}/api/services`);
  check('#8 /api/services 200', api.status === 200, `HTTP ${api.status}`);
  const apiJson = await api.json().catch(() => null);
  check('#8 /api/services spec', apiJson?.spec === 'jp402-scan/0.1', apiJson?.spec);

  const sn = await fetch(`${BASE}/snapshot.json`);
  check('#8 /snapshot.json 配信', sn.ok, `HTTP ${sn.status}`);
  const snJson = await sn.json().catch(() => null);
  check('#8 snapshot に chain.measured', snJson?.chain?.measured === true);

  const reg = await fetch(REGISTRY_RAW).then(r => r.json()).catch(() => null);
  check('#8 registry raw 到達(entries 配列)', Array.isArray(reg?.entries), `entries=${reg?.entries?.length}`);

  // registry raw の entry 数と /api/services の publisher 整合（ざっくり: entry>=1 なら services>=1）
  if (Array.isArray(reg?.entries) && reg.entries.length > 0) {
    check('#8 registry に登録あり→services 非空', (apiJson?.count ?? 0) > 0, `count=${apiJson?.count}`);
  }

  report();
}

function report() {
  console.log(`=== Task #8 デプロイ/インフラ健全性 (${BASE}) ===`);
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
