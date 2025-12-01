"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Calendar, Target, Trophy, ChevronRight, Medal, Crown, Award, Clock } from "lucide-react"

export default function PointsDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="h-full">
      <div className="px-6 py-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hệ thống điểm rèn luyện</h2>
          <p className="text-gray-600 mt-2">Theo dõi và quản lý điểm hoạt động của bạn</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
            <TabsTrigger value="achievements">Thành tích</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Current Points & Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Điểm rèn luyện tháng này
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">100</div>
                  <div className="text-sm text-gray-600">/ 200 điểm mục tiêu</div>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                    Trung bình
                  </Badge>
                </div>
                <Progress value={50} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tiến độ 50%</span>
                  <span>Khởi điểm: 100 điểm</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                  <div>
                    <div className="text-green-600 font-semibold">+30</div>
                    <div className="text-xs text-gray-500">Cộng điểm</div>
                  </div>
                  <div>
                    <div className="text-red-600 font-semibold">-10</div>
                    <div className="text-xs text-gray-500">Trừ điểm</div>
                  </div>
                  <div>
                    <div className="text-blue-600 font-semibold">+0</div>
                    <div className="text-xs text-gray-500">Thưởng</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">4</p>
                  <p className="text-sm text-gray-600">Hoạt động tháng này</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">#5</p>
                  <p className="text-sm text-gray-600">Xếp hạng toàn đoàn</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Nhật ký điểm gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Tham gia sinh hoạt Chi đoàn</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600">22/01/2025</p>
                        <Badge variant="outline" className="text-xs">MEETING</Badge>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+10</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Viết bài tuyên truyền</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600">20/01/2025</p>
                        <Badge variant="outline" className="text-xs">POST</Badge>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+20</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Bảng xếp hạng tháng này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-semibold text-amber-800">
                      QT
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Quản trị viên hệ thống</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Admin</p>
                        <Badge className="text-xs bg-green-100 text-green-800">Xuất sắc</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">150</p>
                      <p className="text-sm text-gray-600">điểm</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                    <Medal className="w-5 h-5 text-gray-400" />
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-semibold text-amber-800">
                      NV
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Nguyễn Văn An</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Leader</p>
                        <Badge className="text-xs bg-blue-100 text-blue-800">Khá</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">120</p>
                      <p className="text-sm text-gray-600">điểm</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Quy định điểm rèn luyện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Khởi điểm: 100 điểm/tháng</p>
                    <p className="text-xs text-blue-600 mt-1">Reset mỗi đầu tháng, lưu lịch sử</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">Sinh hoạt Chi đoàn: +10 điểm</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">Viết bài tuyên truyền: +20 điểm</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">Hoạt động tình nguyện: +10 điểm</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Thống kê điểm theo thời gian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">100</p>
                    <p className="text-sm text-blue-600">Điểm tháng này</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">280</p>
                    <p className="text-sm text-green-600">Điểm quý này</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">1200</p>
                    <p className="text-sm text-purple-600">Điểm năm này</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Thành tích tháng này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏆</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Xếp loại Trung bình</h3>
                        <p className="text-sm text-gray-600">Điểm hiện tại: 100</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💪</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Người tích cực</h3>
                        <p className="text-sm text-gray-600">Tham gia 5+ hoạt động trong tháng</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Tiến độ</span>
                            <span>4/5</span>
                          </div>
                          <Progress value={80} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


