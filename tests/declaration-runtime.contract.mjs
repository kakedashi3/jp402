#!/usr/bin/env node
// Task #7 — 宣言=runtime 整合 & 鍵衛生テスト。
// /api/services の各 service について、live402=true（具体 resource）なら実際に叩いて
// HTTP 402 + payTo が宣言と一致することを確認。param 必須/テンプレ(live402=null)は
// 宣言ベース＝runtime 402 が真実なのでスキップ。加えてキー(jpyc_sk_)非漏洩を確認。
//   使い方: node tests/declaration-runtime.contract.mjs  [BASE=... で向き先変更]
const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function inspect402(url) {
  const r = await fetch(url, { redirect: 'manual' });
  const text = await r.text();
  let payTo = null;
  try {
    const j = JSON.parse(text);
    payTo = j.accepts?.[0]?.payTo ?? j.payTo ?? null;
  } catch {
    /* not json */
  }
  if (!payTo) {
    const h = r.headers.get('payment-required');
    if (h) {
      try {
        payTo = JSON.parse(Buffer.from(h, 'base64').toString()).accepts?.[0]?.payTo ?? null;
      } catch {
        /* skip */
      }
    }
  }
  return { status: r.status, payTo, leak: /jpyc_sk_[0-9a-f]/i.test(text) };
}

async function run() {
  const d = await (await fetch(`${BASE}/api/services`)).json();
  check('#7 services 取得', Array.isArray(d.services) && d.services.length > 0, `count=${d.count}`);

  let probed = 0;
  for (const s of d.services ?? []) {
    const label = `${s.publisher}/${String(s.resource).split('/').pop()}`;
    if (s.live402 === true) {
      probed++;
      const res = await inspect402(s.resource);
      check(`#7 ${label} live 402`, res.status === 402, `HTTP ${res.status}`);
      check(
        `#7 ${label} 宣言=runtime payTo`,
        res.payTo && String(res.payTo).toLowerCase() === String(s.payTo).toLowerCase(),
        `live=${res.payTo} decl=${s.payTo}`,
      );
      check(`#7 ${label} キー(jpyc_sk_)非漏洩`, !res.leak);
    } else {
      check(`#7 ${label} 宣言ベース(live402=${s.live402})`, true, 'param必須/テンプレ→runtime402が真実');
    }
  }
  check('#7 具体 resource を1つ以上 probe', probed >= 1, `probed=${probed}`);

  report();
}

function report() {
  console.log(`=== Task #7 宣言=runtime 整合 & 鍵衛生 (${BASE}) ===`);
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
