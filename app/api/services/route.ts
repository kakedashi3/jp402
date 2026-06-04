// 買い手エージェント向け list API。registry を読み JPYC(Polygon) サービスを
// signals で enrich し、registered / verified / trust でランクして JSON 返す。
// DB なし・registry が真実の源。yen402-mcp の discover_jpyc_resources 参照先。

import { NextResponse } from 'next/server';

import { confirm402, fetchServices, JPYC_POLYGON, POLYGON_NETWORK } from '@/lib/registry';
import { getSignals } from '@/lib/signals';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function rawToJpyc(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const v = BigInt(raw);
    const d = 10n ** 18n;
    const frac = (v % d).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 2);
    return `${(v / d).toString()}${frac ? '.' + frac : ''}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const all = await fetchServices();
  const jpyc = all.filter(s =>
    s.accepts?.some(a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON),
  );

  const services = await Promise.all(
    jpyc.map(async s => {
      const accept =
        s.accepts.find(a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON) ??
        s.accepts[0];
      const sig = accept?.payTo ? await getSignals(accept.payTo) : null;
      const inv = s['x-jp402']?.invoice;
      // runtime 402 確定: 具体 resource のみ probe(param/テンプレは null=宣言ベース・purchase 時に確定)
      const live402 = s.probeable ? await confirm402(s.resource) : null;

      // registered = registry 掲載済（PR opt-in）。verified = T番号 NTA 裏取り（未実装→false）。
      const registered = true;
      const verified = false;
      // ランク用 trust（demo-grade）: verified > registered > 実測実績。
      const measured = sig?.measured ?? false;
      const trustScore =
        (verified ? 50 : 0) +
        (registered ? 10 : 0) +
        (measured ? (sig?.txCount ?? 0) + (sig?.uniqueWallets ?? 0) * 2 : 0);

      return {
        id: s.id,
        publisher: s.publisher,
        resource: s.resource,
        chain: POLYGON_NETWORK,
        scheme: accept?.scheme ?? null,
        payTo: accept?.payTo ?? null,
        price: { raw: accept?.maxAmountRequired ?? null, jpyc: rawToJpyc(accept?.maxAmountRequired) },
        invoice: inv?.registrationNumber
          ? { registrationNumber: inv.registrationNumber, qualifiedIssuer: inv.qualifiedIssuer ?? null }
          : null,
        registered,
        verified,
        live402, // true=402 確認済 / false=402 以外 / null=宣言ベース(param・テンプレ。purchase 時に runtime 402 が真実)
        signals: {
          measured,
          txCount: sig?.txCount ?? null,
          uniqueWallets: sig?.uniqueWallets ?? null,
          volumeRaw: sig?.volumeRaw ?? null,
        },
        trustScore,
      };
    }),
  );

  // registered & verified & 高trust を上位に（PageRank ポジション）。
  services.sort((a, b) => b.trustScore - a.trustScore);

  return NextResponse.json(
    {
      spec: 'jp402-scan/0.1',
      updated: new Date().toISOString(),
      asset: { symbol: 'JPYC', address: JPYC_POLYGON, decimals: 18, chain: POLYGON_NETWORK },
      count: services.length,
      services,
    },
    { headers: { ...CORS, 'cache-control': 'public, max-age=60' } },
  );
}
