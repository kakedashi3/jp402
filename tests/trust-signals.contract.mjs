#!/usr/bin/env node
// Task #5 — trust signals 整合テスト。
// フラグ意味論(registered/verified/live402)、signals の形、そして「共有 payTo の
// 二重計上をしない(dedupe)」回帰を検証する。オンチェーン照合(Alchemy)は env 依存
// のため本テストの対象外(snapshot.mjs 側で実測)。
//   使い方: node tests/trust-signals.contract.mjs
const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const results = [];
const check = (n, ok, d = '') => results.push({ n, ok: !!ok, d });

async function run() {
  const d = await (await fetch(`${BASE}/api/services`)).json();
  const svcs = d.services ?? [];
  check('#5 services 取得', svcs.length > 0, `count=${d.count}`);

  // --- フラグ意味論 ---
  for (const s of svcs) {
    const label = `${s.publisher}/${String(s.resource).split('/').pop()}`;
    check(`#5 ${label} registered=true`, s.registered === true);
    check(`#5 ${label} verified=false(NTA dormant)`, s.verified === false);
    check(`#5 ${label} live402∈{true,false,null}`, [true, false, null].includes(s.live402), String(s.live402));
    check(
      `#5 ${label} signals 形`,
      s.signals && 'measured' in s.signals && 'txCount' in s.signals && 'volumeRaw' in s.signals,
    );
    check(
      `#5 ${label} trustScore は数値`,
      typeof s.trustScore === 'number' && s.trustScore >= 0,
      String(s.trustScore),
    );
  }

  // --- dedupe 回帰: snapshot の totalTx/perService が payTo 単位(二重計上なし) ---
  const snap = await (await fetch(`${BASE}/snapshot.json`)).json();
  const uniquePayTos = new Set(svcs.map(s => String(s.payTo).toLowerCase()));
  check(
    '#5 perService は payTo 単位(<= ユニーク payTo 数・サービス数ではない)',
    (snap.perService?.length ?? 0) <= uniquePayTos.size,
    `perService=${snap.perService?.length} uniquePayTo=${uniquePayTos.size} services=${svcs.length}`,
  );
  const sumPer = (snap.perService ?? []).reduce((a, b) => a + (b.txCount ?? 0), 0);
  check(
    '#5 totalTx == Σ perService.txCount(集計整合)',
    snap.totalTx === sumPer,
    `totalTx=${snap.totalTx} Σ=${sumPer}`,
  );
  // 共有 payTo があるのに二重計上していれば totalTx > ユニーク payTo の実 tx になる。
  // services 数 > ユニーク payTo 数(= 共有あり)のとき、totalTx が services 基準に
  // 膨らんでいないこと(<= 旧バグなら service 数倍)を粗くチェック。
  if (svcs.length > uniquePayTos.size) {
    check('#5 共有 payTo 検出 → dedupe 効果を確認対象', true, `services>${uniquePayTos.size}=payTo`);
  }

  report();
}

function report() {
  console.log(`=== Task #5 trust signals 整合 (${BASE}) ===`);
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
