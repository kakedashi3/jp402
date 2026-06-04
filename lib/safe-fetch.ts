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
