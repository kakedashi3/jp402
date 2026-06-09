import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';

import { Footer } from './_components/Footer';

const SITE_NAME = 'jp402';
const SITE_TITLE = 'jp402 — JPYC × x402 ディスカバリーレイヤー';
const SITE_DESC =
  'JPYC（Polygon）で支払える x402 リソースを発見・選別する。jp402-registry の準拠台帳を読み、オンチェーン実測で信頼を可視化する discovery scanner。';

export const metadata: Metadata = {
  metadataBase: new URL('https://jp402.com'),
  title: {
    default: SITE_TITLE,
    template: '%s | jp402',
  },
  description: SITE_DESC,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESC,
    // 画像は app/opengraph-image.png のファイル規約で自動付与
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    // 画像は app/twitter-image.png のファイル規約で自動付与
  },
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
