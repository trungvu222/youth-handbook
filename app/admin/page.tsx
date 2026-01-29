'use client';

import dynamic from 'next/dynamic';

// Import AdminDashboard với no SSR để tránh hydration error
const AdminDashboard = dynamic(() => import('./admin-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Đang tải Admin Dashboard...</p>
      </div>
    </div>
  )
});

export default function AdminPage() {
  return <AdminDashboard />;
}