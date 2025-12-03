import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Youth Handbook',
  description: 'Ứng dụng sổ tay thanh niên Việt Nam',
  generator: 'Youth Handbook App',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#1976d2',
  icons: {
    icon: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
}

// Script to detect Capacitor and add class to body
const capacitorDetectionScript = `
  (function() {
    if (window.Capacitor) {
      document.body.classList.add('capacitor-app');
      console.log('[App] Running in Capacitor');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#1976d2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Youth Handbook" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'self' https://youth-handbook.onrender.com; img-src * 'self' data: blob: https:; style-src * 'self' 'unsafe-inline';" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: capacitorDetectionScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
