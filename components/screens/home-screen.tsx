"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Calendar,
  FileText,
  BookOpen,
  Activity,
  Award,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  User,
  Target,
  Trophy,
  Clipboard,
  PieChart,
  Star,
} from "lucide-react"

interface HomeScreenProps {
  onShowPoints?: () => void
  onShowAdmin?: () => void
}

export default function HomeScreen({ onShowPoints, onShowAdmin }: HomeScreenProps) {
  return (
    <div className="h-full">
      <div className="h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5B2EFF] to-[#0F62FF] px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Search className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Sổ tay đoàn viên</h1>
            <Bell className="h-6 w-6" />
          </div>
        </div>

        <div className="px-6 -mt-4 pb-6 space-y-4">
          {/* Profile Card */}
          <Card className="bg-white rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">QT</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Quản trị viên hệ thống</h3>
                    <p className="text-sm text-gray-600">Quản trị viên</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Chưa có Chi đoàn</p>
                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                        Trung bình
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-500">100</div>
                  <p className="text-xs text-gray-500">Điểm tích lũy</p>
                  <p className="text-xs text-gray-400">2025-01</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="bg-white rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Chủ Nhật</p>
                  <p className="text-lg font-bold text-red-600">07-09</p>
                  <p className="text-xs text-gray-500">0 hoạt động tháng này</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Lịch sinh hoạt &gt;
                </div>
                <div className="text-xs text-gray-400">Chưa có hoạt động nào gần đây</div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Danh mục tính năng</h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <button className="flex flex-col items-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-2">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Hồ sơ đoàn viên</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Lịch sinh hoạt</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Hoạt động đoàn</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Học tập</span>
              </button>

              {/* Row 2 */}
              <button className="flex flex-col items-center p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Văn bản</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors">
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Kỳ thi</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Xếp loại</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-2">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Kiến nghị</span>
              </button>

              {/* Row 3 */}
              <button className="flex flex-col items-center p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center mb-2">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Khảo sát</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mb-2">
                  <Clipboard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Ghi chú</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Đăng tin</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center mb-2">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Bảo tàng số</span>
              </button>

              {/* Row 4 */}
              <button
                className="flex flex-col items-center p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                onClick={onShowAdmin}
              >
                <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center mb-2">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Nhiệm vụ</span>
              </button>

              <button
                className="flex flex-col items-center p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                onClick={onShowPoints}
              >
                <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">Điểm tích lũy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

