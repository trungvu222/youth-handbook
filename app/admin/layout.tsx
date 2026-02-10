import '../globals.css';
import { AdminLayoutClient } from './admin-layout-client';

export const metadata = {
  title: 'Admin Dashboard - HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN TRUNG ĐOÀN 196',
  description: 'Trang quản trị hệ thống Đoàn thanh niên',
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
    </div>
  );
}

