#!/usr/bin/env node
// Task #1 — Discovery API 契約テスト (/api/services)。
// 60% スイートの中核。live(既定 https://jp402.com)に対し契約を検証する。
//   使い方: node tests/api-services.contract.mjs              # 本番
//           BASE=http://localhost:3000 node tests/...mjs      # ローカル
// 失敗時は exit 1（CI/手動どちらでも使える）。
//
// 注: T1.5(空 registry→count:0)は登録状態に依存するため、登録ゼロのときのみ
//     厳密判定し、登録ありのときは「graceful（配列で返る）」までを確認する。
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = (process.env.BASE ?? 'https://jp402.com').replace(/\/+$/, '');
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

async function run() {
  // --- T1.1 HTTP + envelope ---
  const res = await fetch(`${BASE}/api/services`);
  check('T1.1 GET 200', res.status === 200, `HTTP ${res.status}`);
  const d = await res.json();
  check('T1.1 spec=jp402-scan/0.1', d.spec === 'jp402-scan/0.1', d.spec);
  const a = d.asset ?? {};
  check(
    'T1.1 asset metadata',
    a.symbol === 'JPYC' && a.decimals === 18 && a.chain === 'eip155:137' && String(a.address).startsWith('0xe7c3'),
    JSON.stringify(a),
  );
  const svcs = Array.isArray(d.services) ? d.services : null;
  check('T1.1 services is list', svcs !== null);
  check('T1.1 count==len(services)', d.count === (svcs?.length ?? -1), `count=${d.count} len=${svcs?.length}`);

  // --- T1.2 CORS ---
  check('T1.2 CORS GET *', res.headers.get('access-control-allow-origin') === '*', res.headers.get('access-control-allow-origin'));
  const opt = await fetch(`${BASE}/api/services`, { method: 'OPTIONS' });
  check('T1.2 OPTIONS 204', opt.status === 204, `HTTP ${opt.status}`);

  // --- T1.3 per-service required fields ---
  const REQ = ['id', 'publisher', 'description', 'resource', 'resourceTemplate', 'parameters',
    'payTo', 'price', 'registered', 'verified', 'live402', 'signals', 'trustScore', 'invoice'];
  const SIG = ['measured', 'txCount', 'uniqueWallets', 'volumeRaw'];
  for (const [i, s] of (svcs ?? []).entries()) {
    const label = String(s.resource ?? '').split('/').pop();
    check(`T1.3 svc[${i}] ${label} 必須field`, REQ.every(k => k in s), `missing=${REQ.filter(k => !(k in s))}`);
    check(`T1.3 svc[${i}] signals field`, s.signals && SIG.every(k => k in s.signals), `missing=${SIG.filter(k => !(k in (s.signals ?? {})))}`);
    check(`T1.3 svc[${i}] price{raw,jpyc}`, s.price && 'raw' in s.price && 'jpyc' in s.price, JSON.stringify(s.price));
  }

  // --- T1.4 resourceTemplate ---
  for (const s of svcs ?? []) {
    const label = String(s.resource ?? '').split('/').pop();
    const reqq = (s.parameters ?? []).filter(p => p.in === 'query' && p.required).map(p => p.name);
    if (reqq.length) {
      const ok = reqq.every(n => String(s.resourceTemplate).includes(`{${n}}`)) && String(s.resourceTemplate).startsWith(`${s.resource}?`);
      check(`T1.4 ${label} resourceTemplate に必須param`, ok, s.resourceTemplate);
    } else {
      check(`T1.4 ${label} param無→resource同一`, s.resourceTemplate === s.resource, s.resourceTemplate);
    }
  }

  // --- T1.7 JPYC/Polygon only ---
  check('T1.7 全 service JPYC/Polygon', (svcs ?? []).every(s => s.chain === 'eip155:137'));

  // --- T1.5 空 registry → count:0（登録ゼロ時のみ厳密、ありなら graceful まで）---
  if ((svcs?.length ?? 0) === 0) check('T1.5 空 registry→count:0', d.count === 0);
  else check('T1.5 graceful（配列で返る・登録ありのため count:0 は登録リセット時に確認）', svcs !== null);

  // --- T1.6 || 空文字 fallback（コードレベル）---
  try {
    const src = await readFile(path.join(process.cwd(), 'lib', 'registry.ts'), 'utf8');
    check('T1.6 REGISTRY_URL は || (空文字 fallback)', src.includes('process.env.NEXT_PUBLIC_REGISTRY_URL ||'));
  } catch {
    check('T1.6 REGISTRY_URL は || (空文字 fallback)', false, 'lib/registry.ts 未読込（repo ルートから実行を）');
  }

  // --- report ---
  console.log(`=== Task #1 Discovery API 契約テスト (${BASE}) ===`);
  let fail = 0;
  for (const { name, ok, detail } of results) {
    console.log(`  ${ok ? '✅' : '❌'} ${name}${detail && !ok ? `  [${detail}]` : ''}`);
    if (!ok) fail++;
  }
  console.log(`\n  結果: ${results.length - fail}/${results.length} PASS${fail ? ` / ${fail} FAIL` : ' — 全PASS'}`);
  process.exit(fail ? 1 : 0);
}

run().catch(e => {
  console.error('テスト実行エラー:', e.message);
  process.exit(1);
});
