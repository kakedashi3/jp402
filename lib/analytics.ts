// 経済スナップショット。2 軸で構成:
//  (1) チェーン全体（registry 非依存・常に実数）= totalSupply 等 → lib/chain.ts
//  (2) サービス別の実測 = 登録 payTo ごとの JPYC 着金を signals で集計
// 登録 payTo が 0 件なら、サービス別は「実績ゼロ」を正直に表示する（fake sample は出さない）。

import { getSignals } from './signals';
import { getChainStats, type ChainStats } from './chain';
import { JPYC_POLYGON, POLYGON_NETWORK, type ResolvedService } from './registry';

export interface ServiceStat {
  label: string;
  txCount: number;
  volumeRaw: string; // JPYC 18dec
}

export interface EconomySnapshot {
  chain: ChainStats; // チェーン全体（実数 or 未接続）
  serviceCount: number; // registry の JPYC サービス数
  measuredCount: number; // うち実測が取れた数
  totalTx: number;
  totalVolumeRaw: string;
  perService: ServiceStat[]; // 実測のあるサービスのみ（空なら []）
}

export async function getEconomySnapshot(
  services: ResolvedService[],
): Promise<EconomySnapshot> {
  const chain = await getChainStats();

  const jpyc = services.filter(s =>
    s.accepts?.some(
      a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON,
    ),
  );

  const stats = await Promise.all(
    jpyc.map(async s => {
      const accept = s.accepts.find(
        a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON,
      );
      const sig = accept?.payTo ? await getSignals(accept.payTo) : null;
      return {
        label: s.publisher,
        txCount: sig?.txCount ?? 0,
        volumeRaw: sig?.volumeRaw ?? '0',
        measured: sig?.measured ?? false,
      };
    }),
  );

  const measured = stats.filter(x => x.measured);
  const totalTx = measured.reduce((a, b) => a + b.txCount, 0);
  const totalVol = measured.reduce((a, b) => a + BigInt(b.volumeRaw || '0'), 0n);

  return {
    chain,
    serviceCount: jpyc.length,
    measuredCount: measured.length,
    totalTx,
    totalVolumeRaw: totalVol.toString(),
    // 流通量 > 0 のサービスのみ円グラフ対象に（実績ゼロは正直に空扱い）
    perService: measured
      .filter(x => x.volumeRaw !== '0')
      .map(({ label, txCount, volumeRaw }) => ({ label, txCount, volumeRaw }))
      .sort((a, b) => Number(BigInt(b.volumeRaw) - BigInt(a.volumeRaw))),
  };
}
