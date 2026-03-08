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
    icon: '/Huy_Hieu_Doan.png',
    apple: [{ url: '/Huy_Hieu_Doan.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
      <PWARegisterAdmin />
    </div>
  );
}

