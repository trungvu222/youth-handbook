'use client'

import { useState, useEffect } from 'react'
import { examApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Search, Trophy, Clock, Brain, ChevronRight, Medal, BarChart3 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ExamTaking } from '../exams/exam-taking'
import { ExamResults } from '../exams/exam-results'
import { ExamLeaderboard } from '../exams/exam-leaderboard'

interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  isPassed: boolean;
  pointsEarned: number;
  startedAt: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
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
  myAttempts?: ExamAttempt[];
  canRetake?: boolean;
}

export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'taking' | 'results' | 'leaderboard'>('list')
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null)

  const categories = [
    'Lý luận chính trị',
    'Kỹ năng lãnh đạo', 
    'Kiến thức chuyên môn',
    'Pháp luật',
    'Văn hóa - Xã hội',
    'Khác'
  ]

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    filterExams()
  }, [exams, searchTerm, categoryFilter])

  const loadExams = async () => {
    try {
      setLoading(true)
      const response = await examApi.getExams({
        status: 'PUBLISHED'
      })

      if (response.success && response.data) {
        setExams(response.data)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải danh sách kỳ thi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading exams:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách kỳ thi',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterExams = () => {
    let filtered = exams

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(search) ||
        exam.description?.toLowerCase().includes(search) ||
        exam.category.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exam => exam.category === categoryFilter)
    }

    setFilteredExams(filtered)
  }

  const handleStartExam = async (exam: Exam) => {
    // Check if exam is available
    const now = new Date()
    if (exam.startDate && new Date(exam.startDate) > now) {
      toast({
        title: 'Chưa thể tham gia',
        description: 'Kỳ thi chưa bắt đầu',
        variant: 'destructive'
      })
      return
    }

    if (exam.endDate && new Date(exam.endDate) < now) {
      toast({
        title: 'Không thể tham gia',
        description: 'Kỳ thi đã kết thúc',
        variant: 'destructive'
      })
      return
    }

    // Check attempts limit
    const attemptCount = exam.myAttempts?.length || 0
    if (attemptCount >= exam.maxAttempts && !exam.canRetake) {
      toast({
        title: 'Không thể tham gia',
        description: `Bạn đã sử dụng hết ${exam.maxAttempts} lần thi`,
        variant: 'destructive'
      })
      return
    }

    setSelectedExam(exam)
    setCurrentView('taking')
  }

  const handleViewResults = (exam: Exam, attempt: ExamAttempt) => {
    setSelectedExam(exam)
    setSelectedAttempt(attempt)
    setCurrentView('results')
  }

  const handleViewLeaderboard = (exam: Exam) => {
    setSelectedExam(exam)
    setCurrentView('leaderboard')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedExam(null)
    setSelectedAttempt(null)
    // Reload exams to get updated attempts
    loadExams()
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getBestAttempt = (attempts?: ExamAttempt[]) => {
    if (!attempts || attempts.length === 0) return null
    return attempts
      .filter(a => a.status === 'COMPLETED')
      .sort((a, b) => b.score - a.score)[0]
  }

  const getAttemptStatusColor = (attempt: ExamAttempt) => {
    if (attempt.isPassed) return 'bg-green-100 text-green-800'
    return 'bg-red-100 text-red-800'
  }

  if (currentView === 'taking' && selectedExam) {
    return (
      <ExamTaking
        exam={selectedExam}
        onComplete={handleBackToList}
        onBack={handleBackToList}
      />
    )
  }

  if (currentView === 'results' && selectedExam && selectedAttempt) {
    return (
      <ExamResults
        exam={selectedExam}
        attempt={selectedAttempt}
        onBack={handleBackToList}
      />
    )
  }

  if (currentView === 'leaderboard' && selectedExam) {
    return (
      <ExamLeaderboard
        exam={selectedExam}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kỳ thi trực tuyến</h1>
          <p className="text-muted-foreground">
            Tham gia các kỳ thi trắc nghiệm và kiểm tra kiến thức
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm kỳ thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredExams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Không tìm thấy kỳ thi phù hợp'
                  : 'Chưa có kỳ thi nào'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExams.map(exam => {
            const bestAttempt = getBestAttempt(exam.myAttempts)
            const attemptCount = exam.myAttempts?.length || 0
            const canTakeExam = attemptCount < exam.maxAttempts || exam.canRetake

            return (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{exam.category}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {exam.totalQuestions} câu
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          +{exam.pointsReward} điểm
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {exam.title}
                      </h3>

                      {exam.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(exam.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Điểm đạt: {exam.passingScore}%
                        </span>
                        <span>Tối đa: {exam.maxAttempts} lần</span>
                        {exam.startDate && (
                          <span>Bắt đầu: {formatDate(exam.startDate)}</span>
                        )}
                        {exam.endDate && (
                          <span>Kết thúc: {formatDate(exam.endDate)}</span>
                        )}
                      </div>

                      {/* Attempt History */}
                      {exam.myAttempts && exam.myAttempts.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">
                            Lịch sử thi ({attemptCount}/{exam.maxAttempts})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {exam.myAttempts
                              .filter(a => a.status === 'COMPLETED')
                              .sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime())
                              .slice(0, 3)
                              .map(attempt => (
                                <Button
                                  key={attempt.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewResults(exam, attempt)}
                                  className="h-auto p-2 text-xs"
                                >
                                  <Badge className={getAttemptStatusColor(attempt)}>
                                    {attempt.score}% 
                                    {attempt.isPassed && <Medal className="h-3 w-3 ml-1" />}
                                  </Badge>
                                </Button>
                              ))}
                            {bestAttempt && (
                              <div className="text-xs text-muted-foreground">
                                Điểm cao nhất: {bestAttempt.score}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {canTakeExam && (
                        <Button onClick={() => handleStartExam(exam)}>
                          {attemptCount > 0 ? 'Thi lại' : 'Bắt đầu thi'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewLeaderboard(exam)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Bảng xếp hạng
                      </Button>

                      {!canTakeExam && (
                        <Badge variant="secondary">
                          Đã hết lượt thi
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
