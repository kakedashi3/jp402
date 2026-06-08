#!/usr/bin/env node
// 純粋ユニット（ネット不要・オフライン/CI 単体で走る）。
// 目的 2 つ:
//  (1) 固定すべき定数（JPYC コントラクト / network / decimals）の事故的変更を検知。
//      アドレス/decimals は買い手フルループ実 tx でオンチェーン検証済みの固定値。
//  (2) lib/registry.ts と scripts/snapshot.mjs（CI 用パーサミラー）の定数 drift を検知。
//      片方だけ直すと UI と snapshot で金額/対象がズレるため。
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p), 'utf8');

const EXPECT_JPYC = '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29';
const EXPECT_NET = 'eip155:137';

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const registry = await read('lib/registry.ts');
const snapshot = await read('scripts/snapshot.mjs');

// (1) 定数が固定値どおりか
check('registry JPYC_POLYGON 固定', registry.includes(`JPYC_POLYGON = '${EXPECT_JPYC}'`));
check('registry POLYGON_NETWORK 固定', registry.includes(`POLYGON_NETWORK = '${EXPECT_NET}'`));
check('registry JPYC_DECIMALS=18', /JPYC_DECIMALS\s*=\s*18/.test(registry));

// (2) snapshot.mjs ミラーと一致（drift 検出）
check('snapshot JPYC 一致', snapshot.toLowerCase().includes(EXPECT_JPYC));
check('snapshot NET 一致', snapshot.includes(`'${EXPECT_NET}'`));
// 18dec の換算（10n ** 18n）が両方に在る
check('registry/snapshot ともに 18dec 換算', /10n \*\* 18n/.test(registry + snapshot));

const ok = results.every(r => r.ok);
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
console.log(ok ? 'constants.unit OK' : 'constants.unit FAILED');
process.exit(ok ? 0 : 1);
