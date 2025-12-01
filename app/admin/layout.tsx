import '../globals.css';

export const metadata = {
  title: 'Admin Dashboard - Hệ thống quản lý Đoàn thanh niên',
  description: 'Trang quản trị hệ thống Đoàn thanh niên',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}

