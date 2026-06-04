// 経済スナップショット: registry の JPYC(Polygon) サービス群を Alchemy 走査で集計。
// Alchemy 未接続 / registry 空のときは「サンプル表示」にフォールバック（仮表示・軽量）。
// 重い分析 stack は持たず、signals.ts の Alchemy 走査結果を足し合わせるだけ。

import { getSignals } from './signals';
import { JPYC_POLYGON, POLYGON_NETWORK, type ResolvedService } from './registry';

export interface ServiceStat {
  label: string;
  txCount: number;
  volumeRaw: string; // JPYC 18dec
}

export interface EconomySnapshot {
  measured: boolean; // 1件でも実測(Alchemy)が取れたか
  demo: boolean; // サンプル表示か
  serviceCount: number; // registry の JPYC サービス数（実数）
  measuredCount: number;
  totalTx: number;
  totalVolumeRaw: string;
  perService: ServiceStat[];
}

// 仮表示用サンプル（実測未接続でもデザインを確認できるように）
const yen = (n: number) => (BigInt(n) * 10n ** 18n).toString();
const DEMO_SERVICES: ServiceStat[] = [
  { label: 'JPYC EC', txCount: 128, volumeRaw: yen(512000) },
  { label: 'newsletter (kakedashi3)', txCount: 42, volumeRaw: yen(21000) },
  { label: 'sample shop', txCount: 19, volumeRaw: yen(28500) },
  { label: 'paylog API', txCount: 31, volumeRaw: yen(3100) },
];

function demoSnapshot(serviceCount?: number): EconomySnapshot {
  const totalTx = DEMO_SERVICES.reduce((a, b) => a + b.txCount, 0);
  const totalVol = DEMO_SERVICES.reduce((a, b) => a + BigInt(b.volumeRaw), 0n);
  return {
    measured: false,
    demo: true,
    serviceCount: serviceCount ?? DEMO_SERVICES.length,
    measuredCount: 0,
    totalTx,
    totalVolumeRaw: totalVol.toString(),
    perService: [...DEMO_SERVICES].sort((a, b) => b.txCount - a.txCount),
  };
}

export async function getEconomySnapshot(
  services: ResolvedService[],
): Promise<EconomySnapshot> {
  const jpyc = services.filter(s =>
    s.accepts?.some(
      a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON,
    ),
  );

  // registry が空 → サンプル表示
  if (jpyc.length === 0) return demoSnapshot();

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

  const measuredCount = stats.filter(x => x.measured).length;
  // 登録はあるが Alchemy 未接続 → 実数 serviceCount を保ちつつサンプル数値で描画
  if (measuredCount === 0) return demoSnapshot(jpyc.length);

  const totalTx = stats.reduce((a, b) => a + b.txCount, 0);
  const totalVol = stats.reduce((a, b) => a + BigInt(b.volumeRaw || '0'), 0n);

  return {
    measured: true,
    demo: false,
    serviceCount: jpyc.length,
    measuredCount,
    totalTx,
    totalVolumeRaw: totalVol.toString(),
    perService: stats
      .map(({ label, txCount, volumeRaw }) => ({ label, txCount, volumeRaw }))
      .sort((a, b) => b.txCount - a.txCount),
  };
}
