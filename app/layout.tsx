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
    maximumScale: 1,
    userScalable: false,
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
    icon: '/Huy_Hieu_Doan.png',
    apple: [
      { url: '/Huy_Hieu_Doan.png', sizes: '180x180', type: 'image/png' },
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

// Critical CSS cho mobile app - CHỈ áp dụng cho .mobile-app class
const criticalCSS = `
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  
  /* Mobile app specific styles - only apply with .mobile-app class */
  body.mobile-app {
    background: linear-gradient(135deg, #fef7f0 0%, #fff5eb 50%, #fef7f0 100%);
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
        {/* Theme color cho browser chrome */}
        <meta name="theme-color" content="#dc2626" />
        {/* PWA cho iPhone/iOS - BẮT BUỘC để chạy như app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sổ Tay Đoàn" />
        {/* PWA cho Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Tắt auto-detect số điện thoại trên iOS */}
        <meta name="format-detection" content="telephone=no" />
        {/* Safe area cho iPhone có notch/Dynamic Island */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'self' https://youth-handbook.onrender.com; img-src * 'self' data: blob: https:; style-src * 'self' 'unsafe-inline';" />
        <link rel="manifest" href="/manifest.json" />
        {/* Apple touch icon - icon hiển thị khi Add to Home Screen */}
        <link rel="apple-touch-icon" href="/Huy_Hieu_Doan.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Huy_Hieu_Doan.png" />
        {/* Critical CSS for mobile app */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
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
