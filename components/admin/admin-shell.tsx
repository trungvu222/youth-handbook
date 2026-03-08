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
  Newspaper,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingPostsCount, setPendingPostsCount] = useState(0);

  // Routes that LEADER is NOT allowed to access (ADMIN only)
  const LEADER_FORBIDDEN_PATHS = [
    '/admin/units',
    '/admin/documents',
    '/admin/exams',
    '/admin/news',
    '/admin/surveys',
    '/admin/reports',
  ];

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      // Redirect LEADER away from forbidden pages
      if (parsed.role === 'LEADER' && LEADER_FORBIDDEN_PATHS.some(p => pathname.startsWith(p))) {
        router.replace('/admin');
      }
    }
    // Fetch pending posts count for badge
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const { BACKEND_URL } = await import('@/lib/config');
        const res = await fetch(`${BACKEND_URL}/api/posts?status=PENDING&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const total = data.pagination?.total ?? (data.data?.length ?? 0);
          setPendingPostsCount(total);
        }
      } catch {}
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/admin/login');
  };

  // All menu items (ADMIN sees all)
  const allMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/admin', roles: ['ADMIN', 'LEADER'] },
    { id: 'members', label: 'Quản lý đoàn viên', icon: Users, path: '/admin/members', roles: ['ADMIN', 'LEADER'] },
    { id: 'units', label: 'Quản lý chi đoàn', icon: Flag, path: '/admin/units', roles: ['ADMIN'] },
    { id: 'activities', label: 'Sinh hoạt đoàn', icon: Activity, path: '/admin/activities', roles: ['ADMIN', 'LEADER'] },
    { id: 'ratings', label: 'Xếp loại chất lượng đoàn', icon: Star, path: '/admin/ratings', roles: ['ADMIN', 'LEADER'] },
    { id: 'points', label: 'Điểm rèn luyện', icon: Trophy, path: '/admin/points', roles: ['ADMIN', 'LEADER'] },
    { id: 'documents', label: 'Tài liệu đoàn', icon: FileText, path: '/admin/documents', roles: ['ADMIN'] },
    { id: 'exams', label: 'Kiểm tra tìm hiểu', icon: BookOpen, path: '/admin/exams', roles: ['ADMIN'] },
    { id: 'suggestions', label: 'Kiến nghị', icon: MessageSquare, path: '/admin/suggestions', roles: ['ADMIN', 'LEADER'] },
    { id: 'news', label: 'Bảng tin', icon: Newspaper, path: '/admin/news', badge: pendingPostsCount, roles: ['ADMIN'] },
    { id: 'surveys', label: 'Khảo sát ý kiến', icon: ClipboardList, path: '/admin/surveys', roles: ['ADMIN'] },
    { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3, path: '/admin/reports', roles: ['ADMIN'] },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: Settings, path: '/admin/profile', roles: ['ADMIN', 'LEADER'] },
  ];

  const userRole = currentUser?.role || 'ADMIN';
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const roleLabel = userRole === 'LEADER' ? 'Bí thư chi đoàn' : 'Quản trị viên';

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
                <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
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
                <div className="relative flex-shrink-0">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-gray-500'}`} />
                  {(item as any).badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {(item as any).badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <span className="ml-3 font-medium flex items-center gap-2">
                    {item.label}
                    {(item as any).badge > 0 && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                        {(item as any).badge}
                      </span>
                    )}
                  </span>
                )}
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
                {allMenuItems.find(item => item.path === pathname)?.label || 'Tổng quan'}
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
