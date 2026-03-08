import '../globals.css';
import { AdminLayoutClient } from './admin-layout-client';
import { PWARegisterAdmin } from '@/components/pwa-register-admin';

export const metadata = {
  title: 'Sổ Tay Đoàn Viên - Quản Trị',
  description: 'Trang quản trị hệ thống Sổ Tay Đoàn Viên - Trung Đoàn 196',
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

