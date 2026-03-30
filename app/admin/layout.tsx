import '../globals.css';
import { AdminLayoutClient } from './admin-layout-client';
import { PWARegisterAdmin } from '@/components/pwa-register-admin';

export const metadata = {
  title: 'Sổ Tay Đoàn Viên - Quản Trị',
  description: 'Trang quản trị hệ thống Sổ Tay Đoàn Viên - Trung Đoàn 196',
  // Override manifest → trình duyệt đọc đúng bản admin khi "Add to Home Screen"
  manifest: '/admin-manifest.json',
  themeColor: '#1e3a5f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent' as const,
    title: 'Sổ Tay Quản Trị',
  },
  icons: {
    icon: '/Icon-App-192.png',
    apple: [{ url: '/Icon-App-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout" style={{ minHeight: '100vh', height: 'auto' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Override global styles for admin layout */
        body:has(.admin-layout),
        html:has(.admin-layout) {
          height: auto !important;
          min-height: 100vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          position: static !important;
        }
        
        /* Ensure admin content fits mobile viewport */
        .admin-layout {
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        
        /* Mobile responsive fixes for admin */
        @media (max-width: 767px) {
          .admin-layout * {
            max-width: 100% !important;
          }
          
          /* Fix grid layouts on mobile */
          .admin-layout .grid {
            grid-template-columns: 1fr !important;
          }
          
          /* Fix text overflow */
          .admin-layout h1,
          .admin-layout h2,
          .admin-layout h3 {
            font-size: clamp(1rem, 4vw, 1.5rem) !important;
            word-wrap: break-word !important;
          }
          
          /* Fix padding on mobile */
          .admin-layout > div {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}} />
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
      <PWARegisterAdmin />
    </div>
  );
}

