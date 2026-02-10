'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users,
  Activity,
  FileText,
  Star,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  Flag,
  Home,
  Trophy,
  BarChart3,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/admin/login');
  };

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/admin' },
    { id: 'members', label: 'Quản lý đoàn viên', icon: Users, path: '/admin/members' },
    { id: 'units', label: 'Quản lý chi đoàn', icon: Flag, path: '/admin/units' },
    { id: 'activities', label: 'Sinh hoạt đoàn', icon: Activity, path: '/admin/activities' },
    { id: 'ratings', label: 'Xếp loại chất lượng đoàn', icon: Star, path: '/admin/ratings' },
    { id: 'points', label: 'Điểm rèn luyện', icon: Trophy, path: '/admin/points' },
    { id: 'documents', label: 'Tài liệu đoàn', icon: FileText, path: '/admin/documents' },
    { id: 'exams', label: 'Kiểm tra tìm hiểu', icon: BookOpen, path: '/admin/exams' },
    { id: 'suggestions', label: 'Kiến nghị', icon: MessageSquare, path: '/admin/suggestions' },
    { id: 'surveys', label: 'Khảo sát ý kiến', icon: ClipboardList, path: '/admin/surveys' },
    { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3, path: '/admin/reports' },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: Settings, path: '/admin/profile' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
              <svg className="h-6 w-6 text-white" viewBox="0 0 100 100" fill="currentColor">
                <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill="currentColor"/>
              </svg>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden text-white">
                <h2 className="font-bold truncate text-sm">HỆ THỐNG QUẢN LÝ</h2>
                <p className="text-xs text-red-100 truncate">Trung Đoàn 196</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
              {currentUser?.fullName?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-gray-900 truncate text-sm">{currentUser?.fullName || 'Admin'}</h2>
                <p className="text-xs text-gray-500 truncate">Quản trị viên</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-red-50 transition-colors ${
                  isActive ? 'bg-red-100 border-r-4 border-red-600 text-red-700' : 'text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-red-600' : 'text-gray-500'}`} />
                {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium truncate">Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.path === pathname)?.label || 'Tổng quan'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
