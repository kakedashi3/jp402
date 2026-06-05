// OpenAPI discovery（x402scan spec 準拠）パーサ。
// /openapi.json の paths から「JPYC（Polygon）で支払える有料 operation」を抽出して
// ResolvedService に変換する。宣言の正典 = OpenAPI、最終真実 = runtime 402（呼び出し側で確定）。
// 参照: https://www.x402scan.com/discovery/spec / サンプル: examples/newsletter.openapi.json

import {
  JPYC_POLYGON,
  POLYGON_NETWORK,
  serviceId,
  type Accept,
  type Invoice,
  type ResolvedService,
} from './registry';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface XPaymentInfo {
  price?: { mode?: string; currency?: string; amount?: string; min?: string; max?: string };
  protocols?: Array<Record<string, { network?: string; asset?: string; payTo?: string }>>;
}

// JPYC 建て金額（"500" / "0.5"）→ 18dec の最小単位文字列
function jpycToRaw(amount?: string): string | undefined {
  if (!amount) return undefined;
  const [int, frac = ''] = String(amount).split('.');
  const fracPad = (frac + '0'.repeat(18)).slice(0, 18);
  try {
    return (BigInt(int || '0') * 10n ** 18n + BigInt(fracPad || '0')).toString();
  } catch {
    return undefined;
  }
}

function resolveBase(doc: any, sourceUrl: string): string {
  const server = Array.isArray(doc?.servers) ? doc.servers[0]?.url : undefined;
  if (typeof server === 'string' && /^https?:\/\//i.test(server)) return server.replace(/\/+$/, '');
  try {
    return new URL(sourceUrl).origin;
  } catch {
    return '';
  }
}

/** OpenAPI doc → JPYC(Polygon) 有料 operation の ResolvedService[]。 */
export function parseOpenApi(doc: any, sourceUrl: string): ResolvedService[] {
  if (!doc || typeof doc !== 'object' || !doc.paths || typeof doc.paths !== 'object') return [];

  const publisher = doc.info?.title ?? '(no publisher)';
  const infoJp = doc.info?.['x-jp402'] ?? {};
  const base = resolveBase(doc, sourceUrl);

  const out: ResolvedService[] = [];

  for (const [pathKey, ops] of Object.entries<any>(doc.paths)) {
    if (!ops || typeof ops !== 'object') continue;

    for (const method of METHODS) {
      const op = ops[method];
      if (!op || typeof op !== 'object') continue;

      // listing 対象 = 有料 operation のみ（SIWX / free / 未分類は JPYC 購入対象でない）
      const xp: XPaymentInfo | undefined = op['x-payment-info'];
      if (!xp) continue;

      // x402 プロトコルオブジェクトを拾う
      const x402 = Array.isArray(xp.protocols)
        ? xp.protocols.map(p => p?.x402).find(Boolean)
        : undefined;
      const asset = (x402?.asset ?? '').toLowerCase();
      const network = x402?.network ?? '';

      // jp402 は JPYC / Polygon 専用。それ以外は載せない
      if (network !== POLYGON_NETWORK || asset !== JPYC_POLYGON) continue;

      const raw =
        xp.price?.mode === 'fixed' ? jpycToRaw(xp.price?.amount) : jpycToRaw(xp.price?.max);

      const accept: Accept = {
        scheme: 'exact',
        network: POLYGON_NETWORK,
        asset: JPYC_POLYGON,
        payTo: x402?.payTo ?? '',
        maxAmountRequired: raw,
      };

      const resource = `${base}${pathKey}`;
      const opJp = (op['x-jp402'] ?? {}) as { invoice?: Invoice };
      const invoice = opJp.invoice ?? (infoJp as { invoice?: Invoice }).invoice;

      // 具体 resource か(テンプレート or 必須パラメータ有りは probe 不可 = 宣言ベース)
      type OAParam = { name?: string; in?: string; required?: boolean };
      const rawParams: OAParam[] = [
        ...((ops as { parameters?: OAParam[] }).parameters ?? []),
        ...((op as { parameters?: OAParam[] }).parameters ?? []),
      ];
      const hasRequiredParam = rawParams.some(p => p?.required);
      const probeable = !/\{[^}]+\}/.test(resource) && !hasRequiredParam;
      // buyer がURLを組み立てるためのパラメータヒント(name/in/required)。
      const parameters = rawParams
        .filter(p => p?.name)
        .map(p => ({ name: String(p.name), in: p.in ?? 'query', required: !!p.required }));

      out.push({
        resource,
        accepts: [accept],
        'x-jp402': { currency: (infoJp as { currency?: string }).currency ?? 'JPYC', invoice },
        probeable,
        parameters,
        publisher,
        catalogUrl: sourceUrl,
        id: serviceId(resource),
      });
    }
  }

  return out;
}
