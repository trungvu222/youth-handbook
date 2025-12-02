'use client';

import dynamic from 'next/dynamic';
import { Shield } from 'lucide-react';

// Import LoginForm với no SSR để tránh hydration error
const LoginForm = dynamic(() => import('./login-form'), {
  ssr: false,
  loading: () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Đang tải...</p>
    </div>
  )
});

export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo và tiêu đề */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Hệ thống quản lý Đoàn thanh niên
          </p>
        </div>

        {/* Form đăng nhập */}
        <LoginForm />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 Hệ thống quản lý Đoàn thanh niên</p>
          <p className="mt-1">Phiên bản Admin Dashboard v1.0</p>
        </div>
      </div>
    </div>
  );
}