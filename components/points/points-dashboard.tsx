"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Trophy, Medal, Crown, Award, Clock, ArrowLeft, Loader2 } from "lucide-react"
import { pointsApi, getStoredUser } from "@/lib/api"

interface LeaderboardUser {
  id: string
  fullName: string
  points: number
  rank: string
  unitName: string
  avatarUrl?: string
}

interface PointsHistoryItem {
  id: string
  memberName: string
  memberUnit: string
  action: string
  points: number
  reason: string
  type: string
  date: string
  activityName?: string
}

function getRankLabel(rank: string) {
  switch (rank) {
    case 'XUAT_SAC': return { label: 'Xuất sắc', color: 'bg-green-100 text-green-800' }
    case 'KHA': return { label: 'Khá', color: 'bg-blue-100 text-blue-800' }
    case 'TRUNG_BINH': return { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' }
    case 'YEU': return { label: 'Yếu', color: 'bg-red-100 text-red-800' }
    default: return { label: 'Chưa xếp hạng', color: 'bg-gray-100 text-gray-800' }
  }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PointsDashboard({ onBack }: { onBack?: () => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const currentUser = getStoredUser()
  const myPoints = currentUser?.points || 0

  // Calculate user rank
  const myRank = myPoints >= 800 ? 'XUAT_SAC' : myPoints >= 600 ? 'KHA' : myPoints >= 400 ? 'TRUNG_BINH' : 'YEU'
  const myRankInfo = getRankLabel(myRank)

  // Find user position in leaderboard
  const myPosition = leaderboard.findIndex(u => u.id === currentUser?.id) + 1

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [leaderboardRes, historyRes] = await Promise.all([
        pointsApi.getLeaderboard({ sortBy: 'points', sortOrder: 'desc' }),
        pointsApi.getHistory({ userId: currentUser?.id, limit: 10 }),
      ])

      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data)
        if ((leaderboardRes as any).stats) {
          setStats((leaderboardRes as any).stats)
        }
      }

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data)
      }
    } catch (err) {
      console.error('[Points] Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button onClick={onBack} className="p-1">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <h1 className="text-xl font-bold flex-1">Điểm rèn luyện</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold">{myPoints}</p>
            <p className="text-amber-100">điểm hiện tại</p>
            <Badge className={`mt-1 ${myRankInfo.color}`}>{myRankInfo.label}</Badge>
          </div>
          <div className="ml-auto text-right">
            {myPosition > 0 && (
              <>
                <p className="text-2xl font-bold">#{myPosition}</p>
                <p className="text-amber-100">xếp hạng</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Tổng quan</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">Bảng xếp hạng</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1">Thành tích</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.avgPoints || 0}</p>
                    <p className="text-xs text-gray-600">Điểm TB</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.excellentCount || 0}</p>
                    <p className="text-xs text-gray-600">Xuất sắc</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Lịch sử điểm gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có lịch sử điểm</p>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.reason}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-600">
                              {new Date(item.date).toLocaleDateString('vi-VN')}
                            </p>
                            {item.activityName && (
                              <Badge variant="outline" className="text-xs">{item.activityName}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={item.action === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {item.action === 'add' ? '+' : '-'}{item.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
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
                      <p className="text-xs font-medium text-green-800">≥ 800 điểm: Xuất sắc</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-800">≥ 600 điểm: Khá</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs font-medium text-yellow-800">≥ 400 điểm: Trung bình</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-800">&lt; 400 điểm: Yếu</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Bảng xếp hạng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 20).map((user, index) => {
                      const rankInfo = getRankLabel(user.rank)
                      const isCurrentUser = user.id === currentUser?.id
                      const isTop3 = index < 3
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-4 p-4 rounded-lg ${
                            isTop3
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                              : isCurrentUser
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          {index === 0 ? (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          ) : index < 3 ? (
                            <Medal className="w-5 h-5 text-gray-400" />
                          ) : (
                            <span className="w-5 text-center text-sm font-bold text-gray-500">{index + 1}</span>
                          )}
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-semibold text-amber-800 text-sm">
                            {getInitials(user.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.fullName} {isCurrentUser && '(Bạn)'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600 truncate">{user.unitName}</p>
                              <Badge className={`text-xs ${rankInfo.color}`}>{rankInfo.label}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{user.points}</p>
                            <p className="text-sm text-gray-600">điểm</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Thống kê cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{myPoints}</p>
                    <p className="text-sm text-blue-600">Điểm hiện tại</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{history.length}</p>
                    <p className="text-sm text-green-600">Lần thay đổi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Xếp loại hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🏆</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{myRankInfo.label}</h3>
                      <p className="text-sm text-gray-600">Điểm hiện tại: {myPoints}</p>
                      {myRank !== 'XUAT_SAC' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Tiến độ đến mức tiếp theo</span>
                            <span>{myPoints}/{myRank === 'YEU' ? 400 : myRank === 'TRUNG_BINH' ? 600 : 800}</span>
                          </div>
                          <Progress
                            value={
                              myRank === 'YEU' ? (myPoints / 400) * 100
                              : myRank === 'TRUNG_BINH' ? ((myPoints - 400) / 200) * 100
                              : ((myPoints - 600) / 200) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full History */}
                {history.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-gray-900">Lịch sử thay đổi điểm</h4>
                    {history.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                        <div>
                          <span className="text-gray-700">{item.reason}</span>
                          <span className="text-gray-400 ml-2">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <span className={item.action === 'add' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {item.action === 'add' ? '+' : '-'}{item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}




