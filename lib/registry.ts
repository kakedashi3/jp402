// jp402-registry の registry.json（opt-in 台帳）と各売り手の x-jp402 カタログを読む。
// DB は持たず、registry.json を真実の源とする（ハイブリッド設計：登録/標準は registry 側、
// scan はそれを読んで見せる/探させる側）。

import { safeFetch } from './safe-fetch';

export const REGISTRY_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL ??
  'https://raw.githubusercontent.com/kakedashi3/jp402-registry/main/registry.json';

// JPYC on Polygon（MVP 対象トークン・decimals 18）
export const JPYC_POLYGON = '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29';
export const POLYGON_NETWORK = 'eip155:137';

export interface Accept {
  scheme: string;
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired?: string;
}

export interface Invoice {
  qualifiedIssuer?: boolean;
  registrationNumber?: string;
}

export interface Service {
  resource: string;
  accepts: Accept[];
  'x-jp402'?: { currency?: string; invoice?: Invoice };
}

export interface Catalog {
  catalog: { spec: string; baseSpec: string; publisher?: string; updated?: string };
  services: Service[];
}

export interface ResolvedService extends Service {
  publisher: string;
  catalogUrl: string;
  id: string; // resource を base64url 化した安定キー
  // 具体 resource(必須パラメータ無し・非テンプレート)= live 402 probe 可能か。
  // false の場合は宣言ベース(最終真実は purchase 時の runtime 402)。
  probeable?: boolean;
}

// runtime 402 確定: 具体 resource を叩いて 402 が返るか確認(5分キャッシュ)。
// 宣言と runtime の一致確認。param/テンプレ resource は呼び出し側で null 扱いにする。
const probeCache = new Map<string, { exp: number; ok: boolean | null }>();

export async function confirm402(resource: string): Promise<boolean | null> {
  const hit = probeCache.get(resource);
  if (hit && hit.exp > Date.now()) return hit.ok;
  let ok: boolean | null = null;
  try {
    // SSRF ガード付き(private/loopback/metadata 宛てを拒否・リダイレクト再検証)
    const r = await safeFetch(resource, { method: 'GET' });
    ok = r.status === 402;
  } catch {
    ok = null;
  }
  probeCache.set(resource, { exp: Date.now() + 5 * 60 * 1000, ok });
  return ok;
}

// registry エントリ。OpenAPI(x402scan spec) 正典に pivot。後方互換で catalog_url も受容。
//  - openapi_url: OpenAPI ドキュメントの直 URL（最優先）
//  - url: 発行者オリジン。/openapi.json を優先し、無ければ /.well-known/x402-catalog.json
//  - catalog_url: 旧 Bazaar カタログ（後方互換）
interface RegistryEntry {
  openapi_url?: string;
  url?: string;
  catalog_url?: string;
}

interface RegistryFile {
  _meta?: { updated?: string };
  entries?: RegistryEntry[];
}

const REVALIDATE = 300; // 5分

export function serviceId(resource: string): string {
  return Buffer.from(resource).toString('base64url');
}

// entry 由来 URL(permissionless)は SSRF ガード付きで取得。
async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const r = await safeFetch(url, { next: { revalidate: REVALIDATE } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function parseCatalog(cat: Catalog, sourceUrl: string): ResolvedService[] {
  return (cat.services ?? []).map(s => ({
    ...s,
    publisher: cat.catalog?.publisher ?? '(no publisher)',
    catalogUrl: sourceUrl,
    id: serviceId(s.resource),
    probeable: !/\{[^}]+\}/.test(s.resource), // テンプレートでなければ probe 可
  }));
}

// 多形式 reader（Postel の法則）: OpenAPI 優先 → Bazaar カタログ → 後方互換 catalog_url。
// 宣言の正典は OpenAPI、最終真実は runtime 402（呼び出し側で確定）。
export async function resolveEntry(e: RegistryEntry): Promise<ResolvedService[]> {
  const { parseOpenApi } = await import('./openapi');

  if (e.openapi_url) {
    const doc = await fetchJson(e.openapi_url);
    if (doc) return parseOpenApi(doc, e.openapi_url);
  }

  if (e.url) {
    const base = e.url.replace(/\/+$/, '');
    const oapi = await fetchJson(`${base}/openapi.json`);
    if (oapi) return parseOpenApi(oapi, `${base}/openapi.json`);
    const cat = await fetchJson(`${base}/.well-known/x402-catalog.json`);
    if (cat) return parseCatalog(cat as Catalog, `${base}/.well-known/x402-catalog.json`);
    return [];
  }

  if (e.catalog_url) {
    const cat = await fetchJson(e.catalog_url);
    if (cat) return parseCatalog(cat as Catalog, e.catalog_url);
  }

  return [];
}

// テスト用: 1 個の入力（オリジン or openapi.json/catalog の URL）を解決する。登録はしない。
export async function resolveOrigin(input: string): Promise<ResolvedService[]> {
  const s = input.trim().replace(/\/+$/, '');
  if (s.endsWith('/openapi.json')) return resolveEntry({ openapi_url: s });
  if (s.endsWith('.well-known/x402-catalog.json')) return resolveEntry({ catalog_url: s });
  return resolveEntry({ url: s }); // オリジン → /openapi.json 優先・無ければ .well-known
}

export async function fetchRegistry(): Promise<RegistryFile> {
  const r = await fetch(REGISTRY_URL, { next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`registry fetch failed: ${r.status}`);
  return (await r.json()) as RegistryFile;
}

/** registry.json の entries を辿り、各発行者の宣言を解決して全 service を返す。 */
export async function fetchServices(): Promise<ResolvedService[]> {
  let reg: RegistryFile;
  try {
    reg = await fetchRegistry();
  } catch {
    return [];
  }
  const lists = await Promise.all((reg.entries ?? []).map(e => resolveEntry(e)));
  return lists.flat();
}

export async function fetchServiceById(id: string): Promise<ResolvedService | null> {
  const all = await fetchServices();
  return all.find(s => s.id === id) ?? null;
}
