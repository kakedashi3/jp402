// machine-first posture: エージェント/LLM クローラを明示的に「許可」する。
// jpyc-info.com（非公式 JPYC ダッシュボード）は robots で ClaudeBot/GPTBot/CCBot/
// Google-Extended 等を全遮断（ai-train=no）しつつ「JPYC-AGENT」を名乗る = 機械不読。
// jp402 は逆張り: 索引の目的そのものが「エージェントに読ませて発見させる」ため、
// AI クローラを歓迎し、機械可読の入口（llms.txt / /api/services）へ誘導する。
import type { MetadataRoute } from 'next';

const BASE = 'https://jp402.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 汎用 + 主要 AI クローラを明示 allow（jpyc-info の denylist と対称的な allowlist）。
      {
        userAgent: [
          '*',
          'ClaudeBot',
          'anthropic-ai',
          'Claude-Web',
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'CCBot',
          'Google-Extended',
          'PerplexityBot',
          'Applebot-Extended',
          'meta-externalagent',
          'Bytespider',
        ],
        allow: '/',
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
