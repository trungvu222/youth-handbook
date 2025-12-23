'use client';

import { Shield } from 'lucide-react';
import LoginForm from './login-form';

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
            HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN TRUNG ĐOÀN 196
          </p>
        </div>

        {/* Form đăng nhập */}
        <LoginForm />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN TRUNG ĐOÀN 196</p>
          <p className="mt-1">Phiên bản Admin Dashboard v1.0</p>
        </div>
      </div>
    </div>
  );
}