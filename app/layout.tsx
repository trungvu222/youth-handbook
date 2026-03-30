import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { PWARegister } from '@/components/pwa-register'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sổ Tay Đoàn Viên',
  description: 'Ứng dụng Sổ Tay Đoàn Viên Điện Tử - Trung Đoàn 196',
  generator: 'Youth Handbook App',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: '#dc2626',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sổ Tay Đoàn',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/Icon-App-192.png',
    apple: [
      { url: '/Icon-App-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

// Script to detect Capacitor and add class to body
const capacitorDetectionScript = `
  (function() {
    // Không apply mobile styles cho admin pages
    var isAdminPage = window.location.pathname.startsWith('/admin');
    
    if (window.Capacitor) {
      document.body.classList.add('capacitor-app');
      console.log('[App] Running in Capacitor');
    }
    
    // Chỉ thêm mobile-app class nếu không phải admin page
    if (!isAdminPage) {
      document.body.classList.add('mobile-app');
    }
  })();
`;

// Critical CSS cho mobile app
const criticalCSS = `
  * { box-sizing: border-box; }

  html, body {
    width: 100%;
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Animation */
  @keyframes spin { to { transform: rotate(360deg); } }
  .animate-spin { animation: spin 1s linear infinite !important; }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <head>
        {/* PWA cho Android (không có trong metadata API) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'self' https://youth-handbook.onrender.com; img-src * 'self' data: blob: https:; style-src * 'self' 'unsafe-inline';" />
        {/* Critical CSS for mobile app */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        {/* NOTE: manifest, theme-color, apple-meta, icons do metadata API tự sinh
             → child layouts (admin) có thể override qua metadata export */}
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: capacitorDetectionScript }} />
        {children}
        <Toaster />
        <Analytics />
        <PWARegister />
      </body>
    </html>
  )
}
