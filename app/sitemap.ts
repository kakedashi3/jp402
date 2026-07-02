// 静的な公開ページの sitemap。robots.ts が参照する。
// 機械可読の本線（/api/services・/api/resolve）は sitemap でなく llms.txt 側で案内する
// （API は「クロールして索引する」対象でなく「エージェントが叩く」対象のため）。
import type { MetadataRoute } from 'next';

const BASE = 'https://jp402.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/x402', '/use-cases', '/faq', '/terms', '/privacy'];
  return paths.map(p => ({
    url: `${BASE}${p}`,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.6,
  }));
}
