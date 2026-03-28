'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Award,
  Activity,
  TrendingUp,
  Calendar,
  FileText,
  Star,
  Target,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Flag,
  Heart,
  Home,
  UserCheck,
  Trophy,
  Clock,
  PieChart,
  BarChart3,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingDown,
  UserX,
  Newspaper,
  Library
} from 'lucide-react';

// Import components quản lý đoàn viên
import { MemberManagement } from '@/components/admin/member-management';
import UnitManagement from '@/components/admin/unit-management';
import ActivityManagement from '@/components/admin/activity-management';
import RatingManagement from '@/components/admin/rating-management';
import { PointsManagement } from '@/components/admin/points-management';
import { DocumentManagement } from '@/components/admin/document-management';
import { ExamManagement } from '@/components/admin/exam-management';
import SuggestionManagement from '@/components/admin/suggestion-management';
import { SurveyManagement } from '@/components/admin/survey-management';
import { ReportsManagement } from '@/components/admin/reports-management';
import { AdminProfile } from '@/components/admin/admin-profile';
import { PostModeration } from '@/components/admin/post-moderation';
import { BookManagement } from '@/components/admin/book-management';
import { BACKEND_URL } from '@/lib/config';

// Đảm bảo API_URL không có /api ở cuối
const RAW_API_URL = BACKEND_URL;
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '');

// Interface cho dashboard stats
interface DashboardStats {
  overview: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    excellentMembers: number;
    totalActivities: number;
    upcomingActivities: number;
    completedActivities: number;
    totalPoints: number;
  };
  membersByRank: {
    xuatSac: number;
    kha: number;
    trungBinh: number;
    yeu: number;
  };
  membersByUnit: Array<{
    unitId: string;
    unitName: string;
    memberCount: number;
    activeCount: number;
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    participants: number;
  }>;
  systemInfo: {
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

// Interface cho current user
interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  youthPosition?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Filter states for navigation
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string | null>(null);

  // Read tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Function to change tab and update URL
  const changeTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    // Update URL without full page reload
    if (tabId === 'dashboard') {
      router.push('/admin', { scroll: false });
    } else {
      router.push(`/admin?tab=${tabId}`, { scroll: false });
    }
  }, [router]);

  // Handler để navigate đến trang members với filter
  const handleUnitClick = (unitId: string, unitName: string) => {
    setSelectedUnitFilter(unitId);
    setSelectedRatingFilter(null);
    changeTab('members');
  };

  const handleRatingClick = (rating: string) => {
    setSelectedRatingFilter(rating);
    setSelectedUnitFilter(null);
    changeTab('ratings');
  };

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mobile detection – run once on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // open on desktop, closed on mobile
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch real stats from API
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      setFetchError(null);
      const token = localStorage.getItem('accessToken');
      console.log('🔐 Token:', token ? 'exists (' + token.substring(0, 20) + '...)' : 'MISSING!');
      
      if (!token) {
        setFetchError('Không tìm thấy token. Vui lòng đăng nhập lại.');
        router.push('/admin/login');
        return;
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      console.log('📡 Fetching dashboard stats from:', API_URL);

      // Fetch dashboard stats from dedicated endpoint
      const statsRes = await fetch(`${API_URL}/api/dashboard/stats`, { headers });

      console.log('📊 Dashboard stats response status:', statsRes.status);

      // Kiểm tra nếu có lỗi 401 thì redirect về login
      if (statsRes.status === 401) {
        console.log('❌ Token expired or invalid, redirecting to login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        router.push('/admin/login');
        return;
      }

      if (!statsRes.ok) {
        throw new Error(`API Error: ${statsRes.status}`);
      }

      const statsData = await statsRes.json();
      console.log('📦 Dashboard stats received:', statsData);

      if (statsData.success && statsData.data) {
        setStats({
          ...statsData.data,
          systemInfo: {
            uptime: 3600,
            nodeVersion: 'v18.0.0',
            platform: 'linux'
          }
        });
        console.log('✅ Dashboard stats loaded successfully!');
      } else {
        throw new Error('Invalid stats response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error);
      setFetchError(`Lỗi tải dữ liệu: ${error.message || 'Unknown error'}`);
      // Set default empty stats on error
      setStats({
        overview: {
          totalMembers: 0,
          activeMembers: 0,
          newMembersThisMonth: 0,
          excellentMembers: 0,
          totalActivities: 0,
          upcomingActivities: 0,
          completedActivities: 0,
          totalPoints: 0
        },
        membersByRank: { xuatSac: 0, kha: 0, trungBinh: 0, yeu: 0 },
        membersByUnit: [],
        recentActivities: [],
        systemInfo: { uptime: 0, nodeVersion: 'N/A', platform: 'N/A' }
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    // Đảm bảo component mounted và có localStorage
    if (typeof window !== 'undefined') {
      setMounted(true);
      
      // Kiểm tra authentication
      const user = localStorage.getItem('currentUser');
      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      try {
        const userData = JSON.parse(user);
        if (userData.role !== 'ADMIN') {
          router.push('/admin/login');
          return;
        }
        
        setCurrentUser(userData);
        
        // Fetch real stats from API
        fetchDashboardStats();
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/admin/login');
      }
    }
  }, [router]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      const user = localStorage.getItem('currentUser');
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    };
    
    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('admin-profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      router.push('/admin/login');
    }
  };

  // Loading state
  if (!mounted || !currentUser || !stats) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-700">Đang tải HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN TRUNG ĐOÀN 196...</p>
        </div>
      </div>
    );
  }

  // Menu items cho quản lý đoàn viên
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/admin' },
    { id: 'members', label: 'Quản lý đoàn viên', icon: Users, path: '/admin/members' },
    { id: 'units', label: 'Quản lý chi đoàn', icon: Flag, path: '/admin/units' },
    { id: 'activities', label: 'Sinh hoạt đoàn', icon: Activity, path: '/admin/activities' },
    { id: 'ratings', label: 'Xếp loại chất lượng đoàn', icon: Star, path: '/admin/ratings' },
    { id: 'points', label: 'Điểm rèn luyện', icon: Trophy, path: '/admin/points' },
    { id: 'documents', label: 'Tài liệu đoàn', icon: FileText, path: '/admin/documents' },
    { id: 'library', label: 'Phòng HCM', icon: Library, path: '/admin/library' },
    { id: 'exams', label: 'Kiểm tra tìm hiểu', icon: BookOpen, path: '/admin/exams' },
    { id: 'suggestions', label: 'Kiến nghị', icon: MessageSquare, path: '/admin/suggestions' },
    { id: 'news', label: 'Bảng tin', icon: Newspaper, path: '/admin/news' },
    { id: 'surveys', label: 'Khảo sát ý kiến', icon: ClipboardList, path: '/admin/surveys' },
    { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3, path: '/admin/reports' },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: Settings, path: '/admin/profile' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header với background gradient đẹp */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-6 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6bTAtMjBjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative flex flex-col gap-3">
          {/* Top row: icon + title */}
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
              <img
                src="/logo-admin.png"
                alt="Logo"
                className="h-6 w-6 md:h-8 md:w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
                HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN TRUNG ĐOÀN 196
              </h1>
              <p className="text-red-100 text-xs md:text-sm truncate">
                Chào mừng, <span className="font-semibold text-white">{currentUser?.fullName}</span>, <span className="font-semibold text-white">Ban chấp hành Đoàn Cơ sở</span>
              </p>
            </div>
          </div>
          {/* Bottom row: refresh + clock */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchDashboardStats()}
              className="group bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-shrink-0"
              disabled={loadingStats}
            >
              <RefreshCw className={`h-4 w-4 transition-transform ${loadingStats ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="font-medium text-sm">{loadingStats ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
            <div className="flex-1 text-right bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 min-w-0">
              <div className="text-lg md:text-2xl font-bold tabular-nums">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-red-100 text-xs">{currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="p-2 bg-red-100 rounded-full">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">{fetchError}</p>
            <p className="text-sm text-red-600">Nhấn "Làm mới" để thử lại hoặc đăng nhập lại.</p>
          </div>
        </div>
      )}

      {/* Stats Cards - Modern design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {/* Tổng số đoàn viên */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-4 overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full group-hover:bg-white/20 transition-colors">
                <TrendingUp className="h-3 w-3 text-green-600 group-hover:text-white" />
                <span className="text-xs font-semibold text-green-600 group-hover:text-white">+{stats.overview.newMembersThisMonth}</span>
              </div>
            </div>
            <div className="mt-3 group-hover:text-white transition-colors">
              <p className="text-xs text-gray-500 group-hover:text-blue-100">Tổng đoàn viên</p>
              <p className="text-2xl font-bold mt-0.5">{stats.overview.totalMembers}</p>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden group-hover:bg-white/20">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Đoàn viên hoạt động */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-4 overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="text-xs font-semibold text-emerald-600 group-hover:text-white">
                  {stats.overview.totalMembers > 0 ? ((stats.overview.activeMembers / stats.overview.totalMembers) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
            <div className="mt-3 group-hover:text-white transition-colors">
              <p className="text-xs text-gray-500 group-hover:text-green-100">Đang hoạt động</p>
              <p className="text-2xl font-bold mt-0.5">{stats.overview.activeMembers}</p>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden group-hover:bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full" 
                style={{ width: `${stats.overview.totalMembers > 0 ? (stats.overview.activeMembers / stats.overview.totalMembers) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tổng hoạt động */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-4 overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="text-xs font-semibold text-purple-600 group-hover:text-white">{stats.overview.upcomingActivities} sắp</span>
              </div>
            </div>
            <div className="mt-3 group-hover:text-white transition-colors">
              <p className="text-xs text-gray-500 group-hover:text-purple-100">Tổng hoạt động</p>
              <p className="text-2xl font-bold mt-0.5">{stats.overview.totalActivities}</p>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden group-hover:bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full" 
                style={{ width: `${stats.overview.totalActivities > 0 ? (stats.overview.completedActivities / stats.overview.totalActivities) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tổng điểm rèn luyện */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-4 overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="text-xs font-semibold text-amber-600 group-hover:text-white">
                  TB:{stats.overview.totalMembers > 0 ? Math.round(stats.overview.totalPoints / stats.overview.totalMembers) : 0}
                </span>
              </div>
            </div>
            <div className="mt-3 group-hover:text-white transition-colors">
              <p className="text-xs text-gray-500 group-hover:text-amber-100">Tổng điểm RL</p>
              <p className="text-2xl font-bold mt-0.5">{stats.overview.totalPoints.toLocaleString()}</p>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden group-hover:bg-white/20">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Xếp loại chất lượng đoàn - Circular Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xếp loại chất lượng đoàn</h3>
            </div>
            <span className="text-sm text-gray-500">{stats.overview.totalMembers} đoàn viên</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Xuất sắc */}
            <div 
              onClick={() => handleRatingClick('EXCELLENT')}
              className="group p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl hover:from-red-100 hover:to-pink-100 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-700">Xuất sắc</span>
                <Award className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.membersByRank.xuatSac}</p>
              <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overview.totalMembers > 0 ? (stats.membersByRank.xuatSac / stats.overview.totalMembers) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-red-600 mt-1">
                {stats.overview.totalMembers > 0 ? ((stats.membersByRank.xuatSac / stats.overview.totalMembers) * 100).toFixed(1) : 0}%
              </p>
            </div>

            {/* Khá */}
            <div 
              onClick={() => handleRatingClick('GOOD')}
              className="group p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-700">Khá</span>
                <Star className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.membersByRank.kha}</p>
              <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overview.totalMembers > 0 ? (stats.membersByRank.kha / stats.overview.totalMembers) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stats.overview.totalMembers > 0 ? ((stats.membersByRank.kha / stats.overview.totalMembers) * 100).toFixed(1) : 0}%
              </p>
            </div>

            {/* Trung bình */}
            <div 
              onClick={() => handleRatingClick('AVERAGE')}
              className="group p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl hover:from-amber-100 hover:to-yellow-100 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-700">Trung bình</span>
                <Target className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-bold text-amber-600">{stats.membersByRank.trungBinh}</p>
              <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overview.totalMembers > 0 ? (stats.membersByRank.trungBinh / stats.overview.totalMembers) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                {stats.overview.totalMembers > 0 ? ((stats.membersByRank.trungBinh / stats.overview.totalMembers) * 100).toFixed(1) : 0}%
              </p>
            </div>

            {/* Yếu */}
            <div 
              onClick={() => handleRatingClick('POOR')}
              className="group p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl hover:from-gray-100 hover:to-slate-100 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Yếu</span>
                <TrendingDown className="h-5 w-5 text-gray-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-bold text-gray-600">{stats.membersByRank.yeu}</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gray-500 to-slate-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overview.totalMembers > 0 ? (stats.membersByRank.yeu / stats.overview.totalMembers) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.overview.totalMembers > 0 ? ((stats.membersByRank.yeu / stats.overview.totalMembers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Đoàn viên theo chi đoàn */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <Flag className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Đoàn viên theo chi đoàn</h3>
            </div>
            <span className="text-sm text-gray-500">{stats.membersByUnit.length} chi đoàn</span>
          </div>
          
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.membersByUnit.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Flag className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Chưa có dữ liệu chi đoàn</p>
              </div>
            ) : (
              stats.membersByUnit.map((unit, index) => (
                <div 
                  key={unit.unitId || index}
                  onClick={() => handleUnitClick(unit.unitId, unit.unitName)}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-indigo-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{unit.unitName}</p>
                      <p className="text-xs text-gray-500">{unit.activeCount}/{unit.memberCount} hoạt động</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-indigo-600">{unit.memberCount}</p>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${unit.memberCount > 0 ? (unit.activeCount / unit.memberCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Hoạt động sinh hoạt gần đây</h3>
          </div>
          <button 
            onClick={() => changeTab('activities')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 flex-shrink-0"
          >
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {stats.recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm leading-tight">{activity.title}</p>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activity.type === 'MEETING' ? 'bg-blue-100 text-blue-700' :
                    activity.type === 'VOLUNTEER' ? 'bg-green-100 text-green-700' :
                    activity.type === 'TRAINING' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {activity.type === 'MEETING' ? 'Sinh hoạt' :
                     activity.type === 'VOLUNTEER' ? 'Tình nguyện' :
                     activity.type === 'TRAINING' ? 'Đào tạo' : 'Khác'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>📅 {new Date(activity.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  <span>👥 {activity.participants}/{stats.overview.totalMembers} tham gia</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => changeTab('members')}
          className="group p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-200"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors text-center">Quản lý đoàn viên</span>
          </div>
        </button>
        
        <button 
          onClick={() => changeTab('activities')}
          className="group p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-purple-200"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Sinh hoạt đoàn</span>
          </div>
        </button>
        
        <button 
          onClick={() => changeTab('ratings')}
          className="group p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-amber-200"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors">Xếp loại</span>
          </div>
        </button>
        
        <button 
          onClick={() => changeTab('reports')}
          className="group p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-green-200"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">Báo cáo</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'members':
        return <MemberManagement initialUnitFilter={selectedUnitFilter} />;
      case 'units':
        return <UnitManagement />;
      case 'activities':
        return <ActivityManagement />;
      case 'ratings':
        return <RatingManagement initialRatingFilter={selectedRatingFilter} />;
      case 'points':
        return <PointsManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'library':
        return <BookManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'suggestions':
        return <SuggestionManagement />;
      case 'news':
        return <PostModeration />;
      case 'surveys':
        return <SurveyManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'profile':
        return <AdminProfile currentUser={currentUser} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-red-50">
      <div className="flex h-screen relative">
        {/* Mobile backdrop overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <div className={`bg-white shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`
        }`}>
          <div className="px-4 pt-4 pb-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                <img src="/placeholder-user.jpg" alt="Admin" className="w-full h-full object-cover" />
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h2 className="font-bold text-gray-900 truncate">Đoàn Thanh Niên</h2>
                  <p className="text-xs text-gray-500 truncate">Quản trị viên</p>
                </div>
              )}
            </div>
          </div>

          <nav className="mt-8 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { changeTab(item.id); if (isMobile) setSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-red-50 transition-colors ${
                    activeTab === item.id ? 'bg-red-100 border-r-4 border-red-600 text-red-700' : 'text-gray-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === item.id ? 'text-red-600' : 'text-gray-500'}`} />
                  {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout Button - Fixed at bottom */}
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
        <div className="flex-1 flex flex-col" style={{ background: "#f8fafc" }}>
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Tổng quan'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-2 md:space-x-4">
                <div 
                  className="hidden md:block text-right cursor-pointer hover:opacity-80"
                  onClick={() => changeTab('profile')}
                >
                  <p className="font-medium text-gray-900">{currentUser?.fullName}</p>
                  <p className="text-sm text-gray-500">Ban chấp hành Đoàn Cơ sở</p>
                </div>
                <div 
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                  onClick={() => changeTab('profile')}
                >
                  <img src="/placeholder-user.jpg" alt="Admin" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-3 md:p-6 flex flex-col" style={{ background: "#f8fafc", minHeight: 0 }}>
            <div className="flex-1">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}