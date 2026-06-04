// チェーン全体のマクロ指標（registry 非依存・常に実数）。
// JPYC コントラクトの totalSupply() と現在ブロックを Alchemy RPC で取得。
// 登録 payTo が 0 件でも「Polygon 上の JPYC 流通規模」を実数で出せる。

import { JPYC_POLYGON } from './registry';

export interface ChainStats {
  measured: boolean; // Alchemy 接続で実数が取れたか
  totalSupplyRaw: string | null; // JPYC 総供給量（18dec の最小単位）
  blockNumber: number | null;
}

export const NO_CHAIN: ChainStats = { measured: false, totalSupplyRaw: null, blockNumber: null };

const TTL_MS = 5 * 60 * 1000;
let cache: { exp: number; data: ChainStats } | null = null;

export async function getChainStats(): Promise<ChainStats> {
  const url = process.env.ALCHEMY_POLYGON_URL;
  if (!url) return NO_CHAIN;
  if (cache && cache.exp > Date.now()) return cache.data;

  const rpc = async (method: string, params: unknown[]) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
      next: { revalidate: 300 },
    });
    if (!r.ok) throw new Error(`rpc ${method} ${r.status}`);
    return r.json();
  };

  try {
    const [supplyR, blockR] = await Promise.all([
      // totalSupply() = 0x18160ddd
      rpc('eth_call', [{ to: JPYC_POLYGON, data: '0x18160ddd' }, 'latest']),
      rpc('eth_blockNumber', []),
    ]);
    const totalSupplyRaw =
      typeof supplyR?.result === 'string' && supplyR.result !== '0x'
        ? BigInt(supplyR.result).toString()
        : null;
    const blockNumber =
      typeof blockR?.result === 'string' ? parseInt(blockR.result, 16) : null;

    const data: ChainStats = { measured: totalSupplyRaw !== null, totalSupplyRaw, blockNumber };
    cache = { exp: Date.now() + TTL_MS, data };
    return data;
  } catch {
    return NO_CHAIN;
  }
}
