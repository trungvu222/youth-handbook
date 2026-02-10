'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import AdminDashboard with no SSR to avoid hydration error
const AdminDashboard = dynamic(() => import('./admin-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Đang tải Dashboard...</p>
      </div>
    </div>
  )
});

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}