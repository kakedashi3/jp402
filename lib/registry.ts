// jp402-registry の registry.json（opt-in 台帳）と各売り手の x-jp402 カタログを読む。
// DB は持たず、registry.json を真実の源とする（ハイブリッド設計：登録/標準は registry 側、
// scan はそれを読んで見せる/探させる側）。

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
}

interface RegistryFile {
  _meta?: { updated?: string };
  entries?: { catalog_url: string }[];
}

const REVALIDATE = 300; // 5分

export function serviceId(resource: string): string {
  return Buffer.from(resource).toString('base64url');
}

export async function fetchRegistry(): Promise<RegistryFile> {
  const r = await fetch(REGISTRY_URL, { next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`registry fetch failed: ${r.status}`);
  return (await r.json()) as RegistryFile;
}

/** registry.json の entries を辿り、全 catalog の services を解決して返す。 */
export async function fetchServices(): Promise<ResolvedService[]> {
  let reg: RegistryFile;
  try {
    reg = await fetchRegistry();
  } catch {
    return [];
  }
  const entries = reg.entries ?? [];
  const lists = await Promise.all(
    entries.map(async (e): Promise<ResolvedService[]> => {
      try {
        const r = await fetch(e.catalog_url, { next: { revalidate: REVALIDATE } });
        if (!r.ok) return [];
        const cat = (await r.json()) as Catalog;
        return (cat.services ?? []).map(s => ({
          ...s,
          publisher: cat.catalog?.publisher ?? '(no publisher)',
          catalogUrl: e.catalog_url,
          id: serviceId(s.resource),
        }));
      } catch {
        return [];
      }
    })
  );
  return lists.flat();
}

export async function fetchServiceById(id: string): Promise<ResolvedService | null> {
  const all = await fetchServices();
  return all.find(s => s.id === id) ?? null;
}
