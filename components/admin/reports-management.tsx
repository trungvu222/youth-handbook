'use client';

import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Activity,
  Star,
  Trophy,
  Target,
  Clock
} from 'lucide-react';

interface ReportData {
  memberStats: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    byRank: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
  activityStats: {
    total: number;
    completed: number;
    upcoming: number;
    averageParticipation: number;
  };
  pointsStats: {
    totalPoints: number;
    averagePoints: number;
    highestPoints: number;
    lowestPoints: number;
  };
  unitStats: Array<{
    name: string;
    members: number;
    avgPoints: number;
    activities: number;
  }>;
}

export default function ReportsManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data
  const reportData: ReportData = {
    memberStats: {
      total: 156,
      active: 142,
      inactive: 14,
      newThisMonth: 8,
      byRank: {
        excellent: 45,
        good: 67,
        average: 32,
        poor: 12
      }
    },
    activityStats: {
      total: 24,
      completed: 19,
      upcoming: 5,
      averageParticipation: 78.5
    },
    pointsStats: {
      totalPoints: 12450,
      averagePoints: 79.8,
      highestPoints: 156,
      lowestPoints: 23
    },
    unitStats: [
      { name: 'Chi đoàn Công nghệ', members: 28, avgPoints: 85.2, activities: 6 },
      { name: 'Chi đoàn Kinh tế', members: 32, avgPoints: 78.4, activities: 5 },
      { name: 'Chi đoàn Y khoa', members: 24, avgPoints: 82.1, activities: 4 },
      { name: 'Chi đoàn Sư phạm', members: 35, avgPoints: 76.8, activities: 5 },
      { name: 'Chi đoàn Kỹ thuật', members: 37, avgPoints: 74.3, activities: 4 }
    ]
  };

  const monthlyTrend = [
    { month: 'T1', members: 140, points: 10200, activities: 3 },
    { month: 'T2', members: 142, points: 10450, activities: 2 },
    { month: 'T3', members: 145, points: 10800, activities: 4 },
    { month: 'T4', members: 148, points: 11200, activities: 3 },
    { month: 'T5', members: 150, points: 11600, activities: 4 },
    { month: 'T6', members: 152, points: 11900, activities: 3 },
    { month: 'T7', members: 154, points: 12100, activities: 2 },
    { month: 'T8', members: 155, points: 12250, activities: 3 },
    { month: 'T9', members: 156, points: 12450, activities: 4 },
  ];

  const handleExportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="h-8 w-8 mr-3" />
              Báo cáo thống kê
            </h1>
            <p className="text-red-100 mt-2">
              Tổng hợp và phân tích dữ liệu hoạt động đoàn
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExportReport('excel')}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={() => handleExportReport('pdf')}
              className="bg-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-900 transition-colors flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kỳ báo cáo</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="overview">Tổng quan</option>
                <option value="members">Đoàn viên</option>
                <option value="activities">Hoạt động</option>
                <option value="points">Điểm rèn luyện</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setLoading(true)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tổng đoàn viên</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.memberStats.total}</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{reportData.memberStats.newThisMonth} tháng này
              </div>
            </div>
            <Users className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Hoạt động</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.activityStats.total}</p>
              <div className="flex items-center text-blue-600 text-sm mt-1">
                <Target className="h-4 w-4 mr-1" />
                {reportData.activityStats.upcoming} sắp diễn ra
              </div>
            </div>
            <Activity className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Điểm trung bình</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.pointsStats.averagePoints}</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +2.3% so với tháng trước
              </div>
            </div>
            <Trophy className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tỷ lệ tham gia</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.activityStats.averageParticipation}%</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5.2% so với tháng trước
              </div>
            </div>
            <Star className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-6 w-6 text-red-600 mr-2" />
            Phân bố xếp loại đoàn viên
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Xuất sắc</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-red-200 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full" 
                    style={{ width: `${(reportData.memberStats.byRank.excellent / reportData.memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{reportData.memberStats.byRank.excellent}</span>
                <span className="text-gray-500 text-sm w-12">({((reportData.memberStats.byRank.excellent / reportData.memberStats.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Khá</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-green-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full" 
                    style={{ width: `${(reportData.memberStats.byRank.good / reportData.memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{reportData.memberStats.byRank.good}</span>
                <span className="text-gray-500 text-sm w-12">({((reportData.memberStats.byRank.good / reportData.memberStats.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Trung bình</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-yellow-200 rounded-full h-3">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full" 
                    style={{ width: `${(reportData.memberStats.byRank.average / reportData.memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{reportData.memberStats.byRank.average}</span>
                <span className="text-gray-500 text-sm w-12">({((reportData.memberStats.byRank.average / reportData.memberStats.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Yếu</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gray-500 h-3 rounded-full" 
                    style={{ width: `${(reportData.memberStats.byRank.poor / reportData.memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{reportData.memberStats.byRank.poor}</span>
                <span className="text-gray-500 text-sm w-12">({((reportData.memberStats.byRank.poor / reportData.memberStats.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 text-red-600 mr-2" />
            Xu hướng theo tháng
          </h3>
          <div className="space-y-3">
            {monthlyTrend.slice(-5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="font-semibold text-gray-900">{item.month}/2024</span>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Đoàn viên</p>
                    <p className="font-bold text-blue-600">{item.members}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Điểm TB</p>
                    <p className="font-bold text-green-600">{(item.points / item.members).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Hoạt động</p>
                    <p className="font-bold text-red-600">{item.activities}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Performance Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 text-red-600 mr-2" />
            Hiệu suất theo Chi đoàn
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi đoàn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số đoàn viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm TB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoạt động
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xếp hạng
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.unitStats
                .sort((a, b) => b.avgPoints - a.avgPoints)
                .map((unit, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{unit.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 font-medium">{unit.members}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-bold text-green-600">{unit.avgPoints}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2 ml-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(unit.avgPoints / 100) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{unit.activities}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index === 0 && (
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        🥇 Hạng nhất
                      </span>
                    )}
                    {index === 1 && (
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        🥈 Hạng nhì
                      </span>
                    )}
                    {index === 2 && (
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        🥉 Hạng ba
                      </span>
                    )}
                    {index > 2 && (
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-600">
                        Hạng {index + 1}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            Hoạt động sắp tới
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-gray-900">Sinh hoạt chi đoàn tháng 12</p>
              <p className="text-sm text-gray-600">15/12/2024 - 14:00</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-gray-900">Hoạt động tình nguyện mùa đông</p>
              <p className="text-sm text-gray-600">20/12/2024 - 08:00</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-gray-900">Tổng kết công tác đoàn năm 2024</p>
              <p className="text-sm text-gray-600">28/12/2024 - 09:00</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 text-yellow-600 mr-2" />
            Top đoàn viên xuất sắc
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-3">🥇</span>
                <span className="font-medium">Nguyễn Văn An</span>
              </div>
              <span className="font-bold text-yellow-600">156 điểm</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-3">🥈</span>
                <span className="font-medium">Trần Thị Bình</span>
              </div>
              <span className="font-bold text-gray-600">148 điểm</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-3">🥉</span>
                <span className="font-medium">Lê Văn Cường</span>
              </div>
              <span className="font-bold text-orange-600">142 điểm</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            Mục tiêu tháng này
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Đoàn viên mới</span>
                <span className="font-medium">8/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Hoạt động</span>
                <span className="font-medium">4/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tỷ lệ tham gia</span>
                <span className="font-medium">78%/85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
