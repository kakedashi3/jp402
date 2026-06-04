// 経済データの取得口。CI(週次 cron / 登録 dispatch)が commit した public/snapshot.json を優先し、
// 無ければ live（Alchemy 直叩き）にフォールバック。これで本番は Alchemy キーを runtime に置かず、
// dev は snapshot 未生成でも live で動く。

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getEconomySnapshot, type EconomySnapshot } from './analytics';
import type { ResolvedService } from './registry';

export interface EconomyResult {
  data: EconomySnapshot;
  source: 'snapshot' | 'live';
  generatedAt?: string;
}

export async function getEconomy(services: ResolvedService[]): Promise<EconomyResult> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'public', 'snapshot.json'), 'utf8');
    const snap = JSON.parse(raw);
    if (snap?.chain) {
      return {
        data: {
          chain: snap.chain,
          serviceCount: snap.serviceCount ?? 0,
          measuredCount: snap.measuredCount ?? 0,
          totalTx: snap.totalTx ?? 0,
          totalVolumeRaw: snap.totalVolumeRaw ?? '0',
          perService: snap.perService ?? [],
        },
        source: 'snapshot',
        generatedAt: snap.generatedAt,
      };
    }
  } catch {
    /* snapshot 無し → live */
  }
  return { data: await getEconomySnapshot(services), source: 'live' };
}
