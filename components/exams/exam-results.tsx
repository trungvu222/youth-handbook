'use client'

import { useState, useEffect } from 'react'
import { examApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Star,
  BarChart3
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category?: string;
  points: number;
}

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
  answers?: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent?: number;
  }[];
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
  questions?: ExamQuestion[];
  myAttempts?: ExamAttempt[];
  canRetake?: boolean;
}

interface ExamResultsProps {
  exam: Exam;
  attempt: ExamAttempt;
  onBack: () => void;
}

export function ExamResults({ exam, attempt, onBack }: ExamResultsProps) {
  const [loading, setLoading] = useState(true)
  const [detailedAttempt, setDetailedAttempt] = useState<ExamAttempt | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])

  useEffect(() => {
    loadAttemptDetails()
  }, [attempt.id])

  const loadAttemptDetails = async () => {
    try {
      setLoading(true)
      const response = await examApi.getExamAttempt(attempt.id)

      if (response.success && response.data) {
        setDetailedAttempt(response.data)
        
        // Load exam details to get questions if allowed to review
        if (exam.allowReview) {
          const examResponse = await examApi.getExam(exam.id)
          if (examResponse.success && examResponse.data?.questions) {
            setQuestions(examResponse.data.questions)
          }
        }
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải chi tiết kết quả',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading attempt details:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết kết quả',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins} phút`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-600'
    if (score >= passingScore * 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Xuất sắc', color: 'bg-purple-100 text-purple-800', icon: Star }
    if (score >= 80) return { label: 'Giỏi', color: 'bg-blue-100 text-blue-800', icon: Trophy }
    if (score >= 70) return { label: 'Khá', color: 'bg-green-100 text-green-800', icon: Medal }
    if (score >= 50) return { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800', icon: BarChart3 }
    return { label: 'Yếu', color: 'bg-red-100 text-red-800', icon: XCircle }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Dễ'
      case 'MEDIUM': return 'Trung bình' 
      case 'HARD': return 'Khó'
      default: return difficulty
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuestionResult = (questionId: string) => {
    return detailedAttempt?.answers?.find(a => a.questionId === questionId)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải kết quả...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayAttempt = detailedAttempt || attempt
  const performance = getPerformanceLevel(displayAttempt.score)
  const PerformanceIcon = performance.icon

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Kết quả kỳ thi</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      {/* Results Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Tổng kết</CardTitle>
              <CardDescription>
                Hoàn thành lúc {formatDate(displayAttempt.completedAt || displayAttempt.startedAt)}
              </CardDescription>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(displayAttempt.score, exam.passingScore)}`}>
                {displayAttempt.score}%
              </div>
              <Badge className={performance.color}>
                <PerformanceIcon className="h-3 w-3 mr-1" />
                {performance.label}
              </Badge>
            </div>
          </div>

          <Progress 
            value={displayAttempt.score} 
            className="mt-4"
          />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {displayAttempt.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Câu đúng</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {displayAttempt.totalQuestions - displayAttempt.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Câu sai</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {formatDuration(displayAttempt.timeSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Thời gian</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${displayAttempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {displayAttempt.pointsEarned}
              </div>
              <div className="text-sm text-muted-foreground">Điểm thưởng</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-center gap-4">
            {displayAttempt.isPassed ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Đã đạt yêu cầu ({exam.passingScore}%)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Chưa đạt yêu cầu ({exam.passingScore}%)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review */}
      {exam.allowReview && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Chi tiết từng câu hỏi
            </CardTitle>
            <CardDescription>
              Xem lại các câu hỏi và đáp án của bạn
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const result = getQuestionResult(question.id)
              if (!result) return null

              const isCorrect = result.isCorrect
              const selectedAnswer = result.selectedAnswer
              const correctAnswer = question.correctAnswer

              return (
                <div key={question.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Câu {index + 1}</Badge>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {getDifficultyLabel(question.difficulty)}
                      </Badge>
                      <Badge variant="secondary">
                        {question.points} điểm
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đúng
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sai
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-medium mb-4 text-gray-900 leading-relaxed">
                    {question.question}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswer === optionIndex
                      const isCorrectOption = correctAnswer === optionIndex
                      
                      let className = "p-3 rounded-lg border "
                      if (isSelected && isCorrect) {
                        className += "border-green-500 bg-green-50 text-green-900"
                      } else if (isSelected && !isCorrect) {
                        className += "border-red-500 bg-red-50 text-red-900"
                      } else if (isCorrectOption) {
                        className += "border-green-500 bg-green-50 text-green-900"
                      } else {
                        className += "border-gray-200 bg-gray-50 text-gray-700"
                      }

                      return (
                        <div key={optionIndex} className={className}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span>{option}</span>
                            {isSelected && (
                              <span className="ml-auto text-xs font-medium">
                                Bạn chọn
                              </span>
                            )}
                            {isCorrectOption && !isSelected && (
                              <span className="ml-auto text-xs font-medium text-green-600">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-900 mb-2">
                        Giải thích:
                      </div>
                      <div className="text-sm text-blue-800 leading-relaxed">
                        {question.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center mt-6">
        <Button onClick={onBack} size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách kỳ thi
        </Button>
      </div>
    </div>
  )
}

