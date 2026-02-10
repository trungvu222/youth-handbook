'use client'

import { useState, useEffect } from 'react'
import { examApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  TrendingUp,
  Users
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExamLeaderboard {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  unitName?: string;
  bestScore: number;
  totalAttempts: number;
  averageScore: number;
  totalPoints: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  category: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  pointsReward: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  isRandomOrder: boolean;
  allowReview: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
  };
}

interface ExamLeaderboardProps {
  exam: Exam;
  onBack: () => void;
}

export function ExamLeaderboard({ exam, onBack }: ExamLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<ExamLeaderboard[]>([])
  const [generalLeaderboard, setGeneralLeaderboard] = useState<ExamLeaderboard[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'exam' | 'general'>('exam')
  const [timeRange, setTimeRange] = useState('all')

  useEffect(() => {
    loadLeaderboard()
  }, [exam.id, timeRange])

  useEffect(() => {
    if (view === 'general') {
      loadGeneralLeaderboard()
    }
  }, [view, timeRange])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await examApi.getExamLeaderboard(exam.id)

      if (response.success && response.data) {
        setLeaderboard(response.data)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải bảng xếp hạng',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải bảng xếp hạng',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGeneralLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await examApi.getGeneralLeaderboard(timeRange)

      if (response.success && response.data) {
        setGeneralLeaderboard(response.data)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải bảng xếp hạng tổng',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading general leaderboard:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải bảng xếp hạng tổng',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />
      case 3: return <Medal className="h-5 w-5 text-amber-600" />
      default: return <Award className="h-5 w-5 text-gray-400" />
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const currentLeaderboard = view === 'exam' ? leaderboard : generalLeaderboard

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Bảng xếp hạng</h1>
          <p className="text-muted-foreground">
            {view === 'exam' ? exam.title : 'Tất cả kỳ thi'}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={view === 'exam' ? 'default' : 'outline'}
                onClick={() => setView('exam')}
                size="sm"
              >
                Kỳ thi này
              </Button>
              <Button
                variant={view === 'general' ? 'default' : 'outline'}
                onClick={() => setView('general')}
                size="sm"
              >
                Tổng thể
              </Button>
            </div>

            {view === 'general' && (
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Khoảng thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                  <SelectItem value="week">Tuần này</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải bảng xếp hạng...</p>
          </CardContent>
        </Card>
      ) : currentLeaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có dữ liệu xếp hạng</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Top 3 */}
          {currentLeaderboard.length >= 3 && (
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top 3 xuất sắc nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentLeaderboard.slice(0, 3).map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="text-center p-6 bg-white rounded-lg shadow-sm border"
                    >
                      <div className="flex justify-center mb-4">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={entry.avatarUrl} />
                        <AvatarFallback className="text-lg font-semibold">
                          {getInitials(entry.fullName)}
                        </AvatarFallback>
                      </Avatar>

                      <h3 className="font-semibold text-lg mb-1">
                        {entry.fullName}
                      </h3>
                      
                      {entry.unitName && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {entry.unitName}
                        </p>
                      )}

                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                        #{entry.rank}
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Điểm cao nhất:</span>
                          <span className={`font-medium ${getScoreColor(entry.bestScore)}`}>
                            {entry.bestScore}%
                          </span>
                        </div>
                        {view === 'general' && (
                          <>
                            <div className="flex justify-between">
                              <span>Điểm TB:</span>
                              <span className="font-medium">
                                {Math.round(entry.averageScore)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tổng điểm:</span>
                              <span className="font-medium text-blue-600">
                                {entry.totalPoints}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span>Số lần thi:</span>
                          <span className="font-medium">
                            {entry.totalAttempts}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Bảng xếp hạng đầy đủ
              </CardTitle>
              <CardDescription>
                {view === 'exam' 
                  ? `${currentLeaderboard.length} người tham gia kỳ thi này`
                  : `${currentLeaderboard.length} người tham gia thi`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentLeaderboard.map((entry, index) => (
                  <div key={entry.userId}>
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                          {entry.rank}
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(entry.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {entry.fullName}
                        </div>
                        {entry.unitName && (
                          <div className="text-sm text-muted-foreground">
                            {entry.unitName}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(entry.bestScore)}`}>
                          {entry.bestScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.totalAttempts} lần thi
                        </div>
                      </div>

                      {view === 'general' && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {entry.totalPoints} điểm
                          </div>
                          <div className="text-xs text-muted-foreground">
                            TB: {Math.round(entry.averageScore)}%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {index < currentLeaderboard.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

