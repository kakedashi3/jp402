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
import { rawToJpyc } from '@/lib/format';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// 1 リクエストで confirm402（外部 GET）を撃てる上限。openapi.json に大量パスを並べた
// origin を踏み台にした fan-out / DoS 反射を防ぐ。同一ホスト限定（下記）と二段で抑える。
const MAX_PROBES = 20;

// ベストエフォートのレート制限（per-instance・揮発）。Vercel serverless では
// インスタンス毎なので厳密ではないが、単一インスタンスからの連打抑止にはなる。
// 厳密な制限は外部ストア（Upstash 等）が必要 = 現状は意図的に簡易実装。
const RL = new Map<string, number[]>();
function rateLimited(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (RL.get(ip) ?? []).filter(t => now - t < windowMs);
  if (arr.length >= limit) {
    RL.set(ip, arr);
    return true;
  }
  arr.push(now);
  RL.set(ip, arr);
  return false;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。少し時間をおいてください。' },
      { status: 429, headers: CORS },
    );
  }

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

  const originHost = hostOf(origin);

  let resolved: ResolvedService[];
  try {
    resolved = await resolveOrigin(origin);
  } catch {
    resolved = [];
  }

  // probe 予算（同期的に消費 = Promise.all の map は executor が同期実行されるため安全）。
  let probeBudget = MAX_PROBES;
  let crossHostSkipped = 0;

  const services = await Promise.all(
    resolved.map(async s => {
      const accept =
        s.accepts.find(a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON) ??
        s.accepts[0];
      // confirm402（外部 GET）は「テスト中の origin と同一ホストの resource」 のみ。
      // servers[].url を victim.com に向けた openapi で第三者へ fan-out するのを防ぐ。
      const sameHost = originHost != null && hostOf(s.resource) === originHost;
      let live402: boolean | null = null;
      if (s.probeable && sameHost && probeBudget > 0) {
        probeBudget -= 1;
        live402 = await confirm402(s.resource);
      } else if (s.probeable && !sameHost) {
        crossHostSkipped += 1;
      }
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
      issues.push(`${s.resource} は到達できませんでした（タイムアウト/到達不可、または同一ホスト外のため probe 省略）。`);
    }
  }
  if (crossHostSkipped > 0) {
    issues.push(
      `${crossHostSkipped} 件の resource は origin（${originHost}）と別ホストを指していたため runtime probe を省略しました（宣言ベース表示）。servers[].url が正しいか確認してください。`,
    );
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
