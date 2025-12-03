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

// Critical CSS for mobile app - ensures basic styles work even if Tailwind fails to load
const criticalCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { background: linear-gradient(135deg, #fef7f0 0%, #fff5eb 50%, #fef7f0 100%); color: #1f2937; }
  
  /* Flexbox utilities */
  .flex { display: flex !important; }
  .flex-col { flex-direction: column !important; }
  .flex-1 { flex: 1 !important; }
  .items-center { align-items: center !important; }
  .justify-center { justify-content: center !important; }
  .justify-between { justify-content: space-between !important; }
  .space-y-4 > * + * { margin-top: 1rem !important; }
  
  /* Sizing */
  .w-full { width: 100% !important; }
  .h-full { height: 100% !important; }
  .min-h-screen { min-height: 100vh !important; }
  .max-w-md { max-width: 28rem !important; }
  
  /* Spacing */
  .p-4 { padding: 1rem !important; }
  .p-6 { padding: 1.5rem !important; }
  .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
  .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
  .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
  .py-6 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
  .pb-16 { padding-bottom: 4rem !important; }
  .mb-2 { margin-bottom: 0.5rem !important; }
  .mb-4 { margin-bottom: 1rem !important; }
  .mb-6 { margin-bottom: 1.5rem !important; }
  .mt-4 { margin-top: 1rem !important; }
  .gap-2 { gap: 0.5rem !important; }
  .gap-4 { gap: 1rem !important; }
  
  /* Colors */
  .bg-white { background-color: #ffffff !important; }
  .bg-gray-50 { background-color: #f9fafb !important; }
  .bg-gray-100 { background-color: #f3f4f6 !important; }
  .text-white { color: #ffffff !important; }
  .text-gray-500 { color: #6b7280 !important; }
  .text-gray-600 { color: #4b5563 !important; }
  .text-gray-700 { color: #374151 !important; }
  .text-gray-900 { color: #111827 !important; }
  .text-blue-600 { color: #2563eb !important; }
  
  /* Typography */
  .text-xs { font-size: 0.75rem !important; }
  .text-sm { font-size: 0.875rem !important; }
  .text-base { font-size: 1rem !important; }
  .text-lg { font-size: 1.125rem !important; }
  .text-xl { font-size: 1.25rem !important; }
  .text-2xl { font-size: 1.5rem !important; }
  .font-medium { font-weight: 500 !important; }
  .font-semibold { font-weight: 600 !important; }
  .font-bold { font-weight: 700 !important; }
  .text-center { text-align: center !important; }
  
  /* Borders & Shadows */
  .rounded { border-radius: 0.25rem !important; }
  .rounded-lg { border-radius: 0.5rem !important; }
  .rounded-xl { border-radius: 0.75rem !important; }
  .rounded-full { border-radius: 9999px !important; }
  .border { border-width: 1px !important; }
  .border-gray-200 { border-color: #e5e7eb !important; }
  .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important; }
  .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
  
  /* Position */
  .relative { position: relative !important; }
  .absolute { position: absolute !important; }
  .fixed { position: fixed !important; }
  .bottom-0 { bottom: 0 !important; }
  .left-0 { left: 0 !important; }
  .right-0 { right: 0 !important; }
  
  /* Overflow */
  .overflow-auto { overflow: auto !important; }
  .overflow-hidden { overflow: hidden !important; }
  
  /* Grid */
  .grid { display: grid !important; }
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  
  /* Gradients */
  .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)) !important; }
  .bg-gradient-to-b { background: linear-gradient(to bottom, var(--tw-gradient-stops)) !important; }
  .from-purple-600 { --tw-gradient-from: #9333ea; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
  .to-blue-600 { --tw-gradient-to: #2563eb; }
  
  /* Animation */
  @keyframes spin { to { transform: rotate(360deg); } }
  .animate-spin { animation: spin 1s linear infinite !important; }
  
  /* Card styles */
  .card { background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  
  /* Button base */
  button { cursor: pointer; border: none; background: none; }
  
  /* Input base */
  input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 1rem; }
  input:focus { outline: none; border-color: #2563eb; }
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
        {/* Critical CSS for mobile app */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: capacitorDetectionScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
