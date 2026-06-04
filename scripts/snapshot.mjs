#!/usr/bin/env node
// jp402 経済スナップショット生成。週次 cron / registry 登録 dispatch から実行。
// Alchemy を叩いて public/snapshot.json（現状値）と public/history.json（週次トレンド）を書く。
// Alchemy キーは CI Secret（ALCHEMY_POLYGON_URL）に置き、runtime には出さない。
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ALCHEMY = process.env.ALCHEMY_POLYGON_URL;
const REGISTRY_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL ||
  'https://raw.githubusercontent.com/kakedashi3/jp402-registry/main/registry.json';
const JPYC = '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29';
const NET = 'eip155:137';
const MAX = 1000;

if (!ALCHEMY) {
  console.error('ALCHEMY_POLYGON_URL 未設定。snapshot を生成できません。');
  process.exit(1);
}

async function rpc(method, params) {
  const r = await fetch(ALCHEMY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  if (!r.ok) throw new Error(`${method} ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${JSON.stringify(j.error)}`);
  return j.result;
}

async function getServices() {
  try {
    const reg = await (await fetch(REGISTRY_URL)).json();
    const entries = reg.entries ?? [];
    const lists = await Promise.all(
      entries.map(async e => {
        try {
          const cat = await (await fetch(e.catalog_url)).json();
          return (cat.services ?? []).map(s => ({
            ...s,
            publisher: cat.catalog?.publisher ?? '(no publisher)',
          }));
        } catch {
          return [];
        }
      }),
    );
    return lists.flat();
  } catch {
    return [];
  }
}

async function signalsFor(payTo) {
  const result = await rpc('alchemy_getAssetTransfers', [
    {
      fromBlock: '0x0',
      toBlock: 'latest',
      toAddress: payTo,
      contractAddresses: [JPYC],
      category: ['erc20'],
      excludeZeroValue: true,
      withMetadata: false,
      maxCount: '0x' + MAX.toString(16),
      order: 'desc',
    },
  ]);
  const transfers = result?.transfers ?? [];
  const froms = new Set();
  let vol = 0n;
  for (const t of transfers) {
    if (t.from) froms.add(String(t.from).toLowerCase());
    const raw = t.rawContract?.value;
    if (typeof raw === 'string' && raw.startsWith('0x')) {
      try {
        vol += BigInt(raw);
      } catch {
        /* skip */
      }
    }
  }
  return { txCount: transfers.length, uniqueWallets: froms.size, volumeRaw: vol.toString() };
}

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function main() {
  const now = new Date();

  const [supplyHex, blockHex] = await Promise.all([
    rpc('eth_call', [{ to: JPYC, data: '0x18160ddd' }, 'latest']), // totalSupply()
    rpc('eth_blockNumber', []),
  ]);
  const chain = {
    measured: true,
    totalSupplyRaw: BigInt(supplyHex).toString(),
    blockNumber: parseInt(blockHex, 16),
  };

  const services = await getServices();
  const jpyc = services.filter(s =>
    s.accepts?.some(a => a.network === NET && a.asset?.toLowerCase() === JPYC),
  );

  const stats = [];
  for (const s of jpyc) {
    const accept = s.accepts.find(a => a.network === NET && a.asset?.toLowerCase() === JPYC);
    try {
      const sig = await signalsFor(accept.payTo);
      stats.push({ label: s.publisher, ...sig, measured: true });
    } catch {
      stats.push({ label: s.publisher, txCount: 0, uniqueWallets: 0, volumeRaw: '0', measured: false });
    }
  }

  const measured = stats.filter(x => x.measured);
  const totalTx = measured.reduce((a, b) => a + b.txCount, 0);
  const totalVol = measured.reduce((a, b) => a + BigInt(b.volumeRaw || '0'), 0n);

  const snapshot = {
    generatedAt: now.toISOString(),
    chain,
    serviceCount: jpyc.length,
    measuredCount: measured.length,
    totalTx,
    totalVolumeRaw: totalVol.toString(),
    perService: measured
      .filter(x => x.volumeRaw !== '0')
      .map(({ label, txCount, volumeRaw }) => ({ label, txCount, volumeRaw }))
      .sort((a, b) => Number(BigInt(b.volumeRaw) - BigInt(a.volumeRaw))),
  };

  const pub = path.join(process.cwd(), 'public');
  await mkdir(pub, { recursive: true });
  await writeFile(path.join(pub, 'snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');

  // history: ISO 週ごとに 1 点（同週は上書き）→ 週次トレンド用
  const histPath = path.join(pub, 'history.json');
  let hist = [];
  try {
    hist = JSON.parse(await readFile(histPath, 'utf8'));
  } catch {
    /* 初回 */
  }
  const wk = isoWeek(now);
  const point = {
    week: wk,
    date: now.toISOString(),
    totalSupplyRaw: chain.totalSupplyRaw,
    totalTx,
    totalVolumeRaw: totalVol.toString(),
  };
  const idx = hist.findIndex(p => p.week === wk);
  if (idx >= 0) hist[idx] = point;
  else hist.push(point);
  hist = hist.slice(-104); // 最大 2 年分
  await writeFile(histPath, JSON.stringify(hist, null, 2) + '\n');

  console.log(
    `snapshot OK: supply=${chain.totalSupplyRaw} block=${chain.blockNumber} services=${jpyc.length} measured=${measured.length} totalTx=${totalTx} week=${wk}`,
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
