'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Flag,
  Heart,
  Home,
  UserCheck,
  Trophy,
  Clock,
  PieChart,
  BarChart3,
  RefreshCw
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
import { ReportsManagement } from '@/components/admin/reports-management';
import { AdminProfile } from '@/components/admin/admin-profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";

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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

      console.log('📡 Fetching from:', API_URL);

      // Fetch users, units, activities in parallel
      const [usersRes, unitsRes, activitiesRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/units`, { headers }),
        fetch(`${API_URL}/api/activities`, { headers }),
      ]);

      console.log('📊 Response status:', {
        users: usersRes.status,
        units: unitsRes.status,
        activities: activitiesRes.status
      });

      // Kiểm tra nếu có lỗi 401 thì redirect về login
      if (usersRes.status === 401 || unitsRes.status === 401 || activitiesRes.status === 401) {
        console.log('❌ Token expired or invalid, redirecting to login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        router.push('/admin/login');
        return;
      }

      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
      const unitsData = unitsRes.ok ? await unitsRes.json() : { units: [] };
      const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };

      console.log('📦 Data received:', {
        usersCount: usersData?.users?.length || usersData?.length || 0,
        unitsCount: unitsData?.units?.length || unitsData?.length || 0,
        activitiesCount: activitiesData?.activities?.length || activitiesData?.data?.length || 0
      });

      const users = usersData.users || usersData.data || usersData || [];
      const units = unitsData.units || unitsData.data || unitsData || [];
      const activities = activitiesData.activities || activitiesData.data || activitiesData || [];

      // Calculate stats from real data
      const totalMembers = Array.isArray(users) ? users.length : 0;
      const activeMembers = Array.isArray(users) ? users.filter((u: any) => u.isActive !== false).length : 0;
      const totalPoints = Array.isArray(users) ? users.reduce((sum: number, u: any) => sum + (u.points || 0), 0) : 0;
      
      // Calculate members by rank based on points
      const excellentMembers = Array.isArray(users) ? users.filter((u: any) => (u.points || 0) >= 100).length : 0;
      const goodMembers = Array.isArray(users) ? users.filter((u: any) => (u.points || 0) >= 70 && (u.points || 0) < 100).length : 0;
      const averageMembers = Array.isArray(users) ? users.filter((u: any) => (u.points || 0) >= 50 && (u.points || 0) < 70).length : 0;
      const poorMembers = Array.isArray(users) ? users.filter((u: any) => (u.points || 0) < 50).length : 0;

      // Calculate members by unit
      const membersByUnit = Array.isArray(units) ? units.map((unit: any) => {
        const unitMembers = Array.isArray(users) ? users.filter((u: any) => u.unitId === unit.id) : [];
        return {
          unitName: unit.name,
          memberCount: unitMembers.length,
          activeCount: unitMembers.filter((u: any) => u.isActive !== false).length
        };
      }) : [];

      // Get recent activities
      const recentActivities = Array.isArray(activities) 
        ? activities.slice(0, 5).map((a: any) => ({
            id: a.id,
            title: a.title,
            type: a.type || 'MEETING',
            date: a.startTime || a.createdAt,
            participants: a.participantCount || 0
          }))
        : [];

      setStats({
        overview: {
          totalMembers,
          activeMembers,
          newMembersThisMonth: Math.min(totalMembers, 3), // Estimate
          excellentMembers,
          totalActivities: Array.isArray(activities) ? activities.length : 0,
          upcomingActivities: Array.isArray(activities) ? activities.filter((a: any) => a.status === 'ACTIVE').length : 0,
          completedActivities: Array.isArray(activities) ? activities.filter((a: any) => a.status === 'COMPLETED').length : 0,
          totalPoints
        },
        membersByRank: {
          xuatSac: excellentMembers,
          kha: goodMembers,
          trungBinh: averageMembers,
          yeu: poorMembers
        },
        membersByUnit,
        recentActivities,
        systemInfo: {
          uptime: 3600,
          nodeVersion: 'v18.0.0',
          platform: 'linux'
        }
      });
      console.log('✅ Stats loaded successfully!', { totalMembers, totalActivities: activities.length });
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
          <p className="text-red-700">Đang tải hệ thống quản lý...</p>
        </div>
      </div>
    );
  }

  // Menu items cho quản lý đoàn viên
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'members', label: 'Quản lý đoàn viên', icon: Users },
    { id: 'units', label: 'Quản lý chi đoàn', icon: Flag },
    { id: 'activities', label: 'Sinh hoạt đoàn', icon: Activity },
    { id: 'ratings', label: 'Xếp loại đoàn viên', icon: Star },
    { id: 'points', label: 'Điểm rèn luyện', icon: Trophy },
    { id: 'documents', label: 'Tài liệu đoàn', icon: FileText },
    { id: 'exams', label: 'Kiểm tra tìm hiểu', icon: BookOpen },
    { id: 'suggestions', label: 'Kiến nghị', icon: MessageSquare },
    { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3 },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header với background đỏ đặc trưng */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hệ thống quản lý Đoàn thanh niên</h1>
            <p className="text-red-100 mt-2">
              Chào mừng, {currentUser?.fullName} - Bí thư Đoàn trường
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <button 
              onClick={() => fetchDashboardStats()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              disabled={loadingStats}
            >
              <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
              {loadingStats ? 'Đang tải...' : 'Làm mới'}
            </button>
            <div>
              <div className="text-2xl font-bold">{new Date().toLocaleDateString('vi-VN')}</div>
              <div className="text-red-100">Hôm nay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="text-red-600">⚠️</div>
          <div>
            <p className="font-medium text-red-800">{fetchError}</p>
            <p className="text-sm text-red-600">Nhấn "Làm mới" để thử lại hoặc đăng nhập lại.</p>
          </div>
        </div>
      )}

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <strong>🔧 Debug:</strong> Token: {typeof window !== 'undefined' && localStorage.getItem('accessToken') ? '✅ Có' : '❌ Không'} | 
          Stats: {stats?.overview?.totalMembers ?? 'null'} users
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng số đoàn viên</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overview.totalMembers}</p>
              <p className="text-green-600 text-sm">
                +{stats.overview.newMembersThisMonth} tháng này
              </p>
            </div>
            <Users className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Đoàn viên tích cực</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overview.activeMembers}</p>
              <p className="text-green-600 text-sm">
                {((stats.overview.activeMembers / stats.overview.totalMembers) * 100).toFixed(1)}% tổng số
              </p>
            </div>
            <UserCheck className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Đoàn viên xuất sắc</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overview.excellentMembers}</p>
              <p className="text-yellow-600 text-sm">
                {((stats.overview.excellentMembers / stats.overview.totalMembers) * 100).toFixed(1)}% tổng số
              </p>
            </div>
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng điểm rèn luyện</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overview.totalPoints.toLocaleString()}</p>
              <p className="text-blue-600 text-sm">
                TB: {(stats.overview.totalPoints / stats.overview.totalMembers).toFixed(0)} điểm/người
              </p>
            </div>
            <Trophy className="h-12 w-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thống kê xếp loại */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-6 w-6 text-red-600 mr-2" />
            Xếp loại đoàn viên
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-semibold text-red-700">Xuất sắc</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(stats.membersByRank.xuatSac / stats.overview.totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-red-700">{stats.membersByRank.xuatSac}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-semibold text-green-700">Khá</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.membersByRank.kha / stats.overview.totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-green-700">{stats.membersByRank.kha}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-semibold text-yellow-700">Trung bình</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(stats.membersByRank.trungBinh / stats.overview.totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-yellow-700">{stats.membersByRank.trungBinh}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-700">Yếu</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${(stats.membersByRank.yeu / stats.overview.totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-700">{stats.membersByRank.yeu}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê theo chi đoàn */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Flag className="h-6 w-6 text-red-600 mr-2" />
            Đoàn viên theo chi đoàn
          </h3>
          <div className="space-y-3">
            {stats.membersByUnit.map((unit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-semibold text-gray-900">{unit.unitName}</span>
                  <p className="text-sm text-gray-600">{unit.activeCount}/{unit.memberCount} hoạt động</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600">{unit.memberCount}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(unit.activeCount / unit.memberCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="h-6 w-6 text-red-600 mr-2" />
          Hoạt động sinh hoạt gần đây
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-semibold text-gray-700">Tên hoạt động</th>
                <th className="text-left py-3 font-semibold text-gray-700">Loại</th>
                <th className="text-left py-3 font-semibold text-gray-700">Ngày</th>
                <th className="text-left py-3 font-semibold text-gray-700">Số người tham gia</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivities.map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{activity.title}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'MEETING' ? 'bg-blue-100 text-blue-800' :
                      activity.type === 'VOLUNTEER' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {activity.type === 'MEETING' ? 'Sinh hoạt' :
                       activity.type === 'VOLUNTEER' ? 'Tình nguyện' : 'Học tập'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{new Date(activity.date).toLocaleDateString('vi-VN')}</td>
                  <td className="py-3">
                    <span className="font-semibold text-red-600">{activity.participants}</span>
                    <span className="text-gray-500 text-sm">/{stats.overview.totalMembers}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'members':
        return <MemberManagement />;
      case 'units':
        return <UnitManagement />;
      case 'activities':
        return <ActivityManagement currentUserRole="ADMIN" />;
      case 'ratings':
        return <RatingManagement />;
      case 'points':
        return <PointsManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'suggestions':
        return <SuggestionManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'profile':
        return <AdminProfile currentUser={currentUser} onUpdate={() => {
          // Refresh user data after update
          const user = localStorage.getItem('currentUser');
          if (user) setCurrentUser(JSON.parse(user));
        }} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-red-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl transition-all duration-300 flex-shrink-0 flex flex-col relative overflow-hidden`}>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Flag className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h2 className="font-bold text-gray-900 truncate">Đoàn TN</h2>
                  <p className="text-xs text-gray-500 truncate">Admin Panel</p>
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
                  onClick={() => setActiveTab(item.id)}
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
        <div className="flex-1 flex flex-col">
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
                  {menuItems.find(item => item.id === activeTab)?.label || 'Tổng quan'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="text-right cursor-pointer hover:opacity-80"
                  onClick={() => setActiveTab('profile')}
                >
                  <p className="font-medium text-gray-900">{currentUser?.fullName}</p>
                  <p className="text-sm text-gray-500">Bí thư Đoàn trường</p>
                </div>
                <div 
                  className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                  onClick={() => setActiveTab('profile')}
                >
                  <span className="text-white font-medium">
                    {currentUser?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}