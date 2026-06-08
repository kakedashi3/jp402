import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';

import { Footer } from './_components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'jp402 — JPYC × x402 ディスカバリーレイヤー',
    template: '%s | jp402',
  },
  description:
    'JPYC（Polygon）で支払える x402 リソースを発見・選別する。jp402-registry の準拠台帳を読み、オンチェーン実測で信頼を可視化する discovery scanner。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6c5ce7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
