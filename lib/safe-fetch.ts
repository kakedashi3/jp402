// SSRF ガード付き fetch。registry は permissionless(誰でも PR 可)なので、
// entry の URL や seller の resource を server から fetch する際は内部/private 宛てを拒否する。
// 各リダイレクト hop を再検証し、private/loopback/link-local に解決される宛先を弾く。
import { lookup } from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true; // this-net / private / loopback
    if (a === 169 && b === 254) return true; // link-local（cloud metadata 169.254.169.254 含む）
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7)); // IPv4-mapped
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA fc00::/7
  if (lower.startsWith('fe80')) return true; // link-local
  return false;
}

// ⚠️ 既知の制約 (DNS rebinding / TOCTOU): ここで lookup() して検証した後、fetch() は
// 別途 DNS を引き直すため、「検証時は公開 IP・接続時は 127.0.0.1」 という rebinding は弾けない。
// 完全対策は解決済み IP へ接続し Host ヘッダを付けるピン留め(undici custom lookup)だが未実装。
// 影響面は呼び出し側のホスト限定(/api/resolve は origin 同一ホストのみ probe)+ probe 上限で縮小済み。
async function assertPublicUrl(raw: string): Promise<void> {
  const u = new URL(raw);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error(`scheme not allowed: ${u.protocol}`);
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error(`host not allowed: ${host}`);
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error(`private ip: ${host}`);
    return;
  }
  const addrs = await lookup(host, { all: true });
  if (addrs.length === 0) throw new Error(`dns empty: ${host}`);
  for (const a of addrs) if (isPrivateIp(a.address)) throw new Error(`resolves to private: ${host} -> ${a.address}`);
}

/** SSRF ガード付き fetch（各 hop を再検証・タイムアウト・最大 3 リダイレクト）。 */
export async function safeFetch(raw: string, opts: RequestInit = {}, maxRedirects = 3): Promise<Response> {
  let url = raw;
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicUrl(url);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(url, { ...opts, redirect: 'manual', signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
    const loc = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (loc) {
      url = new URL(loc, url).toString();
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

// permissionless な origin が巨大 JSON を返して r.json() で OOM させるのを防ぐ。
// content-length を先に検査し、無い場合もストリームを読みながらバイト上限で打ち切る。
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB（openapi.json / catalog の想定上限）

/** SSRF ガード + サイズ上限つきで JSON を取得。!ok は null、上限超過は throw。 */
export async function safeFetchJson(
  raw: string,
  opts: RequestInit = {},
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<unknown | null> {
  const res = await safeFetch(raw, opts);
  if (!res.ok) return null;

  const declared = res.headers.get('content-length');
  if (declared && Number(declared) > maxBytes) {
    throw new Error(`response too large: content-length ${declared} > ${maxBytes}`);
  }

  const reader = res.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error(`response exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }

  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return null;
  }
}
