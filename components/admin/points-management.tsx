"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Minus, 
  Settings, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Users,
  Star,
  Search,
  Download,
  Award,
  Target,
  Calendar,
  Loader2,
  RefreshCw
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://youth-handbook.onrender.com/api';

interface Member {
  id: string;
  fullName: string;
  email: string;
  unitName: string;
  points: number;
  rank: string;
}

interface PointHistory {
  id: string;
  memberName: string;
  memberUnit: string;
  action: 'add' | 'subtract';
  points: number;
  reason: string;
  type: string;
  date: string;
}

interface Unit {
  id: string;
  name: string;
}

interface Stats {
  totalPoints: number;
  avgPoints: number;
  maxPoints: number;
  excellentCount: number;
  totalMembers: number;
}

export function PointsManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMember, setSelectedMember] = useState("")
  const [pointsAmount, setPointsAmount] = useState("")
  const [reason, setReason] = useState("")
  const [category, setCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  
  // Data states
  const [members, setMembers] = useState<Member[]>([])
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [stats, setStats] = useState<Stats>({ totalPoints: 0, avgPoints: 0, maxPoints: 0, excellentCount: 0, totalMembers: 0 })
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    }
    return null;
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterUnit && filterUnit !== 'all') params.append('unitId', filterUnit);
      
      const response = await fetch(`${API_BASE_URL}/points/leaderboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data);
        setStats(data.stats);
      } else {
        setError(data.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPointsHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/units`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUnits(data.data);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchHistory();
    fetchUnits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterUnit]);

  const pointCategories = [
    { value: "hoat_dong", label: "Hoạt động tình nguyện" },
    { value: "hoc_tap", label: "Thành tích học tập" },
    { value: "thi_dua", label: "Thành tích thi đua" },
    { value: "sinh_hoat", label: "Tham gia sinh hoạt" },
    { value: "vi_pham", label: "Vi phạm nội quy" },
    { value: "khac", label: "Khác" },
  ]

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'KHA': return 'bg-green-100 text-green-800 border-green-200';
      case 'TRUNG_BINH': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'YEU': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankText = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'Xuất sắc';
      case 'KHA': return 'Khá';
      case 'TRUNG_BINH': return 'Trung bình';
      case 'YEU': return 'Yếu';
      default: return 'Chưa xếp loại';
    }
  };

  const handleAddPoints = async () => {
    if (!selectedMember || !pointsAmount || !reason) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    try {
      setActionLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedMember,
          points: parseInt(pointsAmount),
          reason,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedMember("");
        setPointsAmount("");
        setReason("");
        setCategory("");
        fetchLeaderboard();
        fetchHistory();
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Error adding points:', err);
      alert('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  }

  const handleSubtractPoints = async () => {
    if (!selectedMember || !pointsAmount || !reason) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    try {
      setActionLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/subtract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedMember,
          points: parseInt(pointsAmount),
          reason,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedMember("");
        setPointsAmount("");
        setReason("");
        setCategory("");
        fetchLeaderboard();
        fetchHistory();
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Error subtracting points:', err);
      alert('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3" />
              Quản lý điểm rèn luyện
            </h1>
            <p className="text-red-100 mt-2">
              Quản lý và theo dõi điểm rèn luyện của đoàn viên
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { fetchLeaderboard(); fetchHistory(); }}
              className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </button>
            <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng điểm</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <Trophy className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm trung bình</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgPoints}</p>
            </div>
            <Target className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm cao nhất</p>
              <p className="text-3xl font-bold text-gray-900">{stats.maxPoints}</p>
            </div>
            <Star className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Xuất sắc</p>
              <p className="text-3xl font-bold text-gray-900">{stats.excellentCount}</p>
            </div>
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="add-points">Cộng/Trừ điểm</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          <TabsTrigger value="settings">Cấu hình</TabsTrigger>
        </TabsList>

        {/* Tab Tổng quan */}
        <TabsContent value="overview" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đoàn viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">Tất cả chi đoàn</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 text-red-600 mr-2" />
                Bảng xếp hạng điểm rèn luyện ({members.length} đoàn viên)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đoàn viên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi đoàn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Chưa có đoàn viên nào. Hãy thêm đoàn viên trong mục "Quản lý đoàn viên".
                      </td>
                    </tr>
                  ) : (
                    members.sort((a, b) => b.points - a.points).map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-red-600 font-semibold">{member.fullName?.charAt(0) || '?'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{member.fullName}</span>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.unitName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="font-bold text-gray-900">{member.points}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRankColor(member.rank)}`}>
                            {getRankText(member.rank)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} 
                              className="text-green-600 hover:text-green-900" 
                              title="Cộng điểm"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} 
                              className="text-red-600 hover:text-red-900" 
                              title="Trừ điểm"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab Cộng/Trừ điểm */}
        <TabsContent value="add-points" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-6 w-6 text-green-600 mr-2" />
              Cộng/Trừ điểm đoàn viên
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="member">Chọn đoàn viên *</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn đoàn viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName} - {member.unitName} ({member.points} điểm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points">Số điểm *</Label>
                <Input 
                  id="points" 
                  type="number" 
                  min="1" 
                  placeholder="Nhập số điểm" 
                  value={pointsAmount} 
                  onChange={(e) => setPointsAmount(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {pointCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="reason">Lý do *</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Nhập lý do cộng/trừ điểm chi tiết..." 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="mt-1" 
                  rows={4} 
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button 
                onClick={handleAddPoints} 
                className="bg-green-600 hover:bg-green-700 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Cộng điểm
              </Button>
              <Button 
                onClick={handleSubtractPoints} 
                variant="outline" 
                className="bg-transparent border-red-500 text-red-600 hover:bg-red-50 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Minus className="h-4 w-4 mr-2" />}
                Trừ điểm
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab Lịch sử */}
        <TabsContent value="history" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="h-5 w-5 text-red-600 mr-2" />
                Lịch sử thay đổi điểm
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {pointsHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có lịch sử thay đổi điểm
                </div>
              ) : (
                pointsHistory.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.action === 'add' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {entry.action === "add" ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">{entry.memberName}</span>
                          <span className="text-sm text-gray-500">{entry.memberUnit}</span>
                          <span className={`font-bold ${entry.action === "add" ? "text-green-600" : "text-red-600"}`}>
                            {entry.action === "add" ? "+" : "-"}{entry.points} điểm
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{entry.reason}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(entry.date).toLocaleDateString("vi-VN")}
                          </span>
                          <Badge variant="outline">{entry.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab Cấu hình */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="h-6 w-6 text-red-600 mr-2" />
              Cấu hình điểm rèn luyện
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Điểm cơ bản</h4>
                <div className="space-y-4">
                  <div><Label>Điểm khởi điểm đoàn viên mới</Label><Input type="number" defaultValue="100" className="mt-1" /></div>
                  <div><Label>Điểm tối đa</Label><Input type="number" defaultValue="1000" className="mt-1" /></div>
                  <div><Label>Điểm tối thiểu</Label><Input type="number" defaultValue="0" className="mt-1" /></div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Ngưỡng xếp loại</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><Label>Xuất sắc (≥)</Label><Input type="number" defaultValue="800" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Khá (≥)</Label><Input type="number" defaultValue="600" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Trung bình (≥)</Label><Input type="number" defaultValue="400" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Yếu (&lt;)</Label><Input type="number" defaultValue="400" className="w-24" /></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button className="bg-red-600 hover:bg-red-700">Lưu cấu hình</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
