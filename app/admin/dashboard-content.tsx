'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  Trophy,
  UserCheck,
  TrendingUp,
  Calendar,
  FileText,
  Star,
  RefreshCw,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';

const API_URL = BACKEND_URL.replace(/\/api\/?$/, '');

interface DashboardStats {
  overview: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    totalActivities: number;
    upcomingActivities: number;
    completedActivities: number;
    totalPoints: number;
  };
}

export default function DashboardContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    overview: {
      totalMembers: 0,
      activeMembers: 0,
      newMembersThisMonth: 0,
      totalActivities: 0,
      upcomingActivities: 0,
      completedActivities: 0,
      totalPoints: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchStats();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const statsData = data.data || data;
        setStats({
          overview: {
            totalMembers: statsData.overview?.totalMembers ?? 0,
            activeMembers: statsData.overview?.activeMembers ?? 0,
            newMembersThisMonth: statsData.overview?.newMembersThisMonth ?? 0,
            totalActivities: statsData.overview?.totalActivities ?? 0,
            upcomingActivities: statsData.overview?.upcomingActivities ?? 0,
            completedActivities: statsData.overview?.completedActivities ?? 0,
            totalPoints: statsData.overview?.totalPoints ?? 0,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-6 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6bTAtMjBjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="h-8 w-8" viewBox="0 0 100 100" fill="currentColor">
                  <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">HỆ THỐNG QUẢN LÝ TRUNG ĐOÀN 196</h1>
                <p className="text-red-100 text-sm lg:text-base">
                  Chào mừng, <span className="font-semibold text-white">{currentUser?.fullName}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchStats}
              className="group bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform" />
              <span className="font-medium">Làm mới</span>
            </button>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
              <div className="text-2xl font-bold tabular-nums">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-red-100 text-sm">
                {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tổng số đoàn viên */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full group-hover:bg-white/20 transition-colors">
                <TrendingUp className="h-3 w-3 text-green-600 group-hover:text-white" />
                <span className="text-xs font-semibold text-green-600 group-hover:text-white">
                  +{stats.overview.newMembersThisMonth}
                </span>
              </div>
            </div>
            <div className="mt-4 group-hover:text-white transition-colors">
              <p className="text-sm text-gray-500 group-hover:text-blue-100">Tổng số đoàn viên</p>
              <p className="text-3xl font-bold mt-1">{stats.overview.totalMembers}</p>
            </div>
          </div>
        </div>

        {/* Đoàn viên hoạt động */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="text-xs font-semibold text-emerald-600 group-hover:text-white">
                  {stats.overview.totalMembers > 0 ? ((stats.overview.activeMembers / stats.overview.totalMembers) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
            <div className="mt-4 group-hover:text-white transition-colors">
              <p className="text-sm text-gray-500 group-hover:text-green-100">Đang hoạt động</p>
              <p className="text-3xl font-bold mt-1">{stats.overview.activeMembers}</p>
            </div>
          </div>
        </div>

        {/* Tổng hoạt động */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full group-hover:bg-white/20 transition-colors">
                <Calendar className="h-3 w-3 text-purple-600 group-hover:text-white" />
                <span className="text-xs font-semibold text-purple-600 group-hover:text-white">
                  {stats.overview.upcomingActivities} sắp tới
                </span>
              </div>
            </div>
            <div className="mt-4 group-hover:text-white transition-colors">
              <p className="text-sm text-gray-500 group-hover:text-purple-100">Tổng hoạt động</p>
              <p className="text-3xl font-bold mt-1">{stats.overview.totalActivities}</p>
            </div>
          </div>
        </div>

        {/* Tổng điểm rèn luyện */}
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:bg-white/20 transition-all duration-500">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="text-xs font-semibold text-amber-600 group-hover:text-white">
                  TB: {stats.overview.totalMembers > 0 ? Math.round((stats.overview.totalPoints ?? 0) / stats.overview.totalMembers) : 0}
                </span>
              </div>
            </div>
            <div className="mt-4 group-hover:text-white transition-colors">
              <p className="text-sm text-gray-500 group-hover:text-amber-100">Tổng điểm rèn luyện</p>
              <p className="text-3xl font-bold mt-1">{(stats.overview.totalPoints ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/admin/members')}
          className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-blue-600">Quản lý đoàn viên</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/activities')}
          className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-purple-600">Sinh hoạt đoàn</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/ratings')}
          className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-red-600">Xếp loại chất lượng</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/reports')}
          className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-emerald-600">Báo cáo thống kê</span>
          </div>
        </button>
      </div>
    </div>
  );
}
