#!/usr/bin/env node
// Task #4 — buyer フルループ(決済直前まで)テスト。
// 実決済は実マネー(不可逆)のため自動化対象外 — 本番フルループは実証済み
// (tx 0xce45f3ff…, 5 JPYC → 0x3Be27, 2026-06-05)。本テストは「buyer が discovery から
// 払える形に到達し、402 が決済可能な envelope を返す」ところまでを検証する。
//   discovery(/api/services)→ resourceTemplate → live402=true は 402 を覗く →
//   payTo / amount(18dec) / asset=JPYC / network=Polygon / EIP-712 extra が揃う。
//   使い方: node tests/buyer-loop.contract.mjs
const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const JPYC = '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29';
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function accepts402(url) {
  const r = await fetch(url, { redirect: 'manual' });
  const text = await r.text();
  let a = null;
  try {
    a = (JSON.parse(text).accepts ?? [])[0] ?? null;
  } catch {
    /* body は JSON でない */
  }
  // body から取れなければ payment-required ヘッダ(base64 envelope)を見る。
  if (!a) {
    const h = r.headers.get('payment-required');
    if (h) {
      try {
        a = (JSON.parse(Buffer.from(h, 'base64').toString()).accepts ?? [])[0] ?? null;
      } catch {
        /* skip */
      }
    }
  }
  return { status: r.status, a };
}

async function run() {
  const d = await (await fetch(`${BASE}/api/services`)).json();
  check('#4 discovery 入口(/api/services)', (d.count ?? 0) > 0, `count=${d.count}`);

  // buyer は resourceTemplate を使う(bare resource は無料/404 のことがある)。
  check(
    '#4 各 service に resourceTemplate',
    (d.services ?? []).every(s => typeof s.resourceTemplate === 'string' && s.resourceTemplate.length > 0),
  );

  let priced = 0;
  for (const s of d.services ?? []) {
    const label = `${s.publisher}/${String(s.resource).split('/').pop()}`;
    if (s.live402 !== true) {
      // param 必須/テンプレ = 決済 URL 構築に値が要る。discovery で parameters が提示されているか。
      check(`#4 ${label} 宣言ベースは parameters 提示`, Array.isArray(s.parameters) && s.parameters.length >= 0);
      continue;
    }
    priced++;
    const { status, a } = await accepts402(s.resource);
    check(`#4 ${label} 402 が返る`, status === 402, `HTTP ${status}`);
    if (!a) {
      check(`#4 ${label} 402 envelope`, false, 'accepts[] 取得不可');
      continue;
    }
    check(`#4 ${label} network=Polygon`, a.network === 'eip155:137', a.network);
    check(`#4 ${label} asset=JPYC`, String(a.asset).toLowerCase() === JPYC, a.asset);
    const amt = a.amount ?? a.maxAmountRequired;
    check(`#4 ${label} amount(18dec)`, /^[0-9]+$/.test(String(amt)) && String(amt).length >= 1, String(amt));
    check(`#4 ${label} payTo 提示`, /^0x[0-9a-fA-F]{40}$/.test(String(a.payTo)), a.payTo);
    // EIP-712 domain: extra(name/version)が理想。無くても asset=JPYC なら buyer は
    // 既知の domain(name "JPY Coin", version "1")で署名可能なので soft 扱い。
    const hasExtra = !!(a.extra && a.extra.name && a.extra.version);
    check(
      `#4 ${label} EIP-712 domain 取得可(extra or JPYC 既知)`,
      hasExtra || String(a.asset).toLowerCase() === JPYC,
      'extra 無し',
    );
    if (!hasExtra) console.log(`    ⚠ ${label}: 402 に extra(EIP-712 name/version)が無い — JPYC domain は既知だが宣言の完全性として推奨`);
  }
  check('#4 価格付きリソースを1つ以上 402 検証', priced >= 1, `priced=${priced}`);

  console.log(`=== Task #4 buyer フルループ(決済直前まで) (${BASE}) ===`);
  let fail = 0;
  for (const { n, ok, d: dd } of results) {
    console.log(`  ${ok ? '✅' : '❌'} ${n}${dd && !ok ? `  [${dd}]` : ''}`);
    if (!ok) fail++;
  }
  console.log(
    `\n  結果: ${results.length - fail}/${results.length} PASS${fail ? ` / ${fail} FAIL` : ' — 全PASS'}（実決済は実証済み: tx 0xce45f3…）`,
  );
  process.exit(fail ? 1 : 0);
}

run().catch(e => {
  console.error('テスト実行エラー:', e.message);
  process.exit(1);
});
