"use client"

import { useState } from "react"
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
  Calendar
} from "lucide-react"

interface Member {
  id: string;
  name: string;
  unit: string;
  currentPoints: number;
  rank: string;
}

interface PointHistory {
  id: string;
  memberName: string;
  memberUnit: string;
  action: 'add' | 'subtract';
  points: number;
  reason: string;
  category: string;
  date: string;
  adminName: string;
}

export function PointsManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMember, setSelectedMember] = useState("")
  const [pointsAmount, setPointsAmount] = useState("")
  const [reason, setReason] = useState("")
  const [category, setCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")

  // Mock data - thành viên
  const members: Member[] = [
    { id: "1", name: "Nguyễn Văn An", unit: "Chi đoàn Công nghệ", currentPoints: 850, rank: "XUAT_SAC" },
    { id: "2", name: "Trần Thị Bình", unit: "Chi đoàn Kinh tế", currentPoints: 720, rank: "KHA" },
    { id: "3", name: "Lê Văn Cường", unit: "Chi đoàn Y khoa", currentPoints: 580, rank: "TRUNG_BINH" },
    { id: "4", name: "Phạm Thị Dung", unit: "Chi đoàn Sư phạm", currentPoints: 920, rank: "XUAT_SAC" },
    { id: "5", name: "Hoàng Văn Em", unit: "Chi đoàn Kỹ thuật", currentPoints: 450, rank: "YEU" },
  ]

  // Mock data - lịch sử điểm
  const pointsHistory: PointHistory[] = [
    {
      id: "1",
      memberName: "Nguyễn Văn An",
      memberUnit: "Chi đoàn Công nghệ",
      action: "add",
      points: 10,
      reason: "Tham gia hoạt động tình nguyện mùa đông",
      category: "Hoạt động tình nguyện",
      date: "2024-12-15",
      adminName: "Nguyễn Văn Admin",
    },
    {
      id: "2",
      memberName: "Trần Thị Bình",
      memberUnit: "Chi đoàn Kinh tế",
      action: "subtract",
      points: 5,
      reason: "Vắng mặt sinh hoạt không phép",
      category: "Vi phạm nội quy",
      date: "2024-12-14",
      adminName: "Nguyễn Văn Admin",
    },
    {
      id: "3",
      memberName: "Lê Văn Cường",
      memberUnit: "Chi đoàn Y khoa",
      action: "add",
      points: 15,
      reason: "Hoàn thành xuất sắc nhiệm vụ được giao",
      category: "Thành tích học tập",
      date: "2024-12-13",
      adminName: "Nguyễn Văn Admin",
    },
  ]

  const pointCategories = [
    { value: "hoat_dong", label: "Hoạt động tình nguyện" },
    { value: "hoc_tap", label: "Thành tích học tập" },
    { value: "thi_dua", label: "Thành tích thi đua" },
    { value: "sinh_hoat", label: "Tham gia sinh hoạt" },
    { value: "vi_pham", label: "Vi phạm nội quy" },
    { value: "khac", label: "Khác" },
  ]

  const units = [
    "Chi đoàn Công nghệ",
    "Chi đoàn Kinh tế",
    "Chi đoàn Y khoa",
    "Chi đoàn Sư phạm",
    "Chi đoàn Kỹ thuật"
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

  const handleAddPoints = () => {
    if (!selectedMember || !pointsAmount || !reason) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    console.log("Add points:", { selectedMember, pointsAmount, reason, category })
    alert(`Đã cộng ${pointsAmount} điểm thành công!`);
    setSelectedMember("")
    setPointsAmount("")
    setReason("")
    setCategory("")
  }

  const handleSubtractPoints = () => {
    if (!selectedMember || !pointsAmount || !reason) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    console.log("Subtract points:", { selectedMember, pointsAmount, reason, category })
    alert(`Đã trừ ${pointsAmount} điểm thành công!`);
    setSelectedMember("")
    setPointsAmount("")
    setReason("")
    setCategory("")
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'all' || member.unit === filterUnit;
    return matchesSearch && matchesUnit;
  });

  // Tính tổng điểm
  const totalPoints = members.reduce((sum, m) => sum + m.currentPoints, 0);
  const avgPoints = Math.round(totalPoints / members.length);
  const maxPoints = Math.max(...members.map(m => m.currentPoints));
  const excellentCount = members.filter(m => m.rank === 'XUAT_SAC').length;

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
          <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng điểm</p>
              <p className="text-3xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
            </div>
            <Trophy className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm trung bình</p>
              <p className="text-3xl font-bold text-gray-900">{avgPoints}</p>
            </div>
            <Target className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm cao nhất</p>
              <p className="text-3xl font-bold text-gray-900">{maxPoints}</p>
            </div>
            <Star className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Xuất sắc</p>
              <p className="text-3xl font-bold text-gray-900">{excellentCount}</p>
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
          {/* Filters */}
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
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bảng xếp hạng */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 text-red-600 mr-2" />
                Bảng xếp hạng điểm rèn luyện
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
                  {filteredMembers.sort((a, b) => b.currentPoints - a.currentPoints).map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-red-600 font-semibold">{member.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-bold text-gray-900">{member.currentPoints}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRankColor(member.rank)}`}>
                          {getRankText(member.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} className="text-green-600 hover:text-green-900" title="Cộng điểm">
                            <Plus className="h-5 w-5" />
                          </button>
                          <button onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} className="text-red-600 hover:text-red-900" title="Trừ điểm">
                            <Minus className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                        {member.name} - {member.unit} ({member.currentPoints} điểm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points">Số điểm *</Label>
                <Input id="points" type="number" min="1" placeholder="Nhập số điểm" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} className="mt-1" />
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
                <Textarea id="reason" placeholder="Nhập lý do cộng/trừ điểm chi tiết..." value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" rows={4} />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={handleAddPoints} className="bg-green-600 hover:bg-green-700 flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Cộng điểm
              </Button>
              <Button onClick={handleSubtractPoints} variant="outline" className="bg-transparent border-red-500 text-red-600 hover:bg-red-50 flex-1">
                <Minus className="h-4 w-4 mr-2" />
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
              {pointsHistory.map((entry) => (
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
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{new Date(entry.date).toLocaleDateString("vi-VN")}</span>
                        <span>Bởi: {entry.adminName}</span>
                        <Badge variant="outline">{entry.category}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <div><Label>Điểm khởi điểm hàng tháng</Label><Input type="number" defaultValue="100" className="mt-1" /></div>
                  <div><Label>Điểm tối đa</Label><Input type="number" defaultValue="200" className="mt-1" /></div>
                  <div><Label>Điểm tối thiểu</Label><Input type="number" defaultValue="0" className="mt-1" /></div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Ngưỡng xếp loại</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><Label>Xuất sắc (≥)</Label><Input type="number" defaultValue="90" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Khá (≥)</Label><Input type="number" defaultValue="70" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Trung bình (≥)</Label><Input type="number" defaultValue="50" className="w-24" /></div>
                  <div className="flex items-center justify-between"><Label>Yếu (&lt;)</Label><Input type="number" defaultValue="50" className="w-24" /></div>
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
