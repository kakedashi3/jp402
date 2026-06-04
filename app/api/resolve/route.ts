// テスト用ディスカバリ。origin を受け取り jp402 が何を解決するかを返す（登録はしない）。
// x402scan の "Test your API" 相当。SSRF ガードは lib/registry の safeFetch 経由。
import { NextResponse } from 'next/server';

import {
  confirm402,
  resolveOrigin,
  JPYC_POLYGON,
  POLYGON_NETWORK,
  type ResolvedService,
} from '@/lib/registry';

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

export async function GET(req: Request) {
  const origin = new URL(req.url).searchParams.get('origin')?.trim();
  if (!origin) {
    return NextResponse.json({ error: 'origin パラメータが必要です' }, { status: 400, headers: CORS });
  }
  if (!/^https?:\/\//.test(origin)) {
    return NextResponse.json(
      { error: 'origin は https://… で指定してください' },
      { status: 400, headers: CORS },
    );
  }

  let resolved: ResolvedService[];
  try {
    resolved = await resolveOrigin(origin);
  } catch {
    resolved = [];
  }

  const services = await Promise.all(
    resolved.map(async s => {
      const accept =
        s.accepts.find(a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON) ??
        s.accepts[0];
      const live402 = s.probeable ? await confirm402(s.resource) : null;
      return {
        publisher: s.publisher,
        resource: s.resource,
        chain: accept?.network ?? null,
        payTo: accept?.payTo ?? null,
        price: { raw: accept?.maxAmountRequired ?? null, jpyc: rawToJpyc(accept?.maxAmountRequired) },
        invoice: s['x-jp402']?.invoice ?? null,
        probeable: s.probeable ?? false,
        live402, // true=402確認済 / false=非402 / null=宣言ベース（param・テンプレ）
      };
    }),
  );

  // 客観的な気づき（登録時に詰まりやすい点）
  const issues: string[] = [];
  if (services.length === 0) {
    issues.push(
      'JPYC(Polygon) の有料 operation が見つかりませんでした。/openapi.json に x-payment-info(JPYC/eip155:137)+ responses.402 があるか確認してください。',
    );
  }
  for (const s of services) {
    if (s.probeable && s.live402 === false) {
      issues.push(`${s.resource} は 402 を返していません（宣言と runtime が不一致）。`);
    }
    if (s.probeable && s.live402 === null) {
      issues.push(`${s.resource} は到達できませんでした（タイムアウト/到達不可）。`);
    }
  }

  return NextResponse.json(
    {
      origin,
      registered: false,
      note: 'これはテストです。登録はされません（Nothing is registered）。',
      count: services.length,
      services,
      issues,
    },
    { headers: CORS },
  );
}
