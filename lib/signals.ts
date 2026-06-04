// 信頼シグナル（透明・載る≠信頼）。
// P5: ALCHEMY_POLYGON_URL があれば alchemy_getAssetTransfers で payTo への JPYC 着金を
// 走査し txCount / uniqueWallets / volume を算出する（重い sync stack でなく Alchemy 走査）。
// 未設定なら「未計測」を返す（ゼロ実績は隠さず明示する方針）。

import { JPYC_POLYGON } from './registry';

export interface TrustSignals {
  txCount: number | null;
  uniqueWallets: number | null;
  volumeRaw: string | null; // JPYC 最小単位(18dec)の着金合計
  measured: boolean;
  capped?: boolean; // maxCount 到達 = フロア値（実数はこれ以上）
}

export const UNMEASURED: TrustSignals = {
  txCount: null,
  uniqueWallets: null,
  volumeRaw: null,
  measured: false,
};

const MAX_COUNT = 1000; // alchemy_getAssetTransfers の上限
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { exp: number; data: TrustSignals }>();

export async function getSignals(payTo: string): Promise<TrustSignals> {
  const url = process.env.ALCHEMY_POLYGON_URL;
  if (!url || !payTo) return UNMEASURED;

  const key = payTo.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;

  try {
    const body = {
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [
        {
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: payTo,
          contractAddresses: [JPYC_POLYGON],
          category: ['erc20'],
          excludeZeroValue: true,
          withMetadata: false,
          maxCount: '0x' + MAX_COUNT.toString(16),
          order: 'desc',
        },
      ],
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 300 },
    });
    if (!r.ok) return UNMEASURED;
    const j = await r.json();
    const transfers: Array<{ from?: string; rawContract?: { value?: string } }> =
      j?.result?.transfers ?? [];

    const froms = new Set<string>();
    let volume = 0n;
    for (const t of transfers) {
      if (t.from) froms.add(String(t.from).toLowerCase());
      const raw = t.rawContract?.value;
      if (typeof raw === 'string' && raw.startsWith('0x')) {
        try {
          volume += BigInt(raw);
        } catch {
          /* skip malformed */
        }
      }
    }

    const data: TrustSignals = {
      txCount: transfers.length,
      uniqueWallets: froms.size,
      volumeRaw: volume.toString(),
      measured: true,
      capped: transfers.length >= MAX_COUNT,
    };
    cache.set(key, { exp: Date.now() + TTL_MS, data });
    return data;
  } catch {
    return UNMEASURED;
  }
}
