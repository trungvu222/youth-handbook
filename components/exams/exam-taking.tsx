'use client'

import { useState, useEffect, useRef } from 'react'
import { examApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Timer
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
  myAttempts?: any[];
  canRetake?: boolean;
}

interface ExamTakingProps {
  exam: Exam;
  onComplete: () => void;
  onBack: () => void;
}

export function ExamTaking({ exam, onComplete, onBack }: ExamTakingProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60) // Convert to seconds
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    startExam()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam(true) // Auto submit when time is up
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startExam = async () => {
    try {
      setLoading(true)
      const response = await examApi.startExam(exam.id)

      if (response.success && response.data) {
        setAttemptId(response.data.attemptId)
        setQuestions(response.data.questions)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể bắt đầu kỳ thi',
          variant: 'destructive'
        })
        onBack()
      }
    } catch (error) {
      console.error('Error starting exam:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể bắt đầu kỳ thi',
        variant: 'destructive'
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = async (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))

    // Submit answer immediately
    try {
      await examApi.submitAnswer(attemptId, questionId, answerIndex)
    } catch (error) {
      console.error('Error submitting answer:', error)
      // Don't show error to user as it might be a network issue
      // The answer is still stored locally
    }
  }

  const handleSubmitExam = async (autoSubmit = false) => {
    try {
      setSubmitting(true)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      const response = await examApi.completeExam(attemptId)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: autoSubmit 
            ? 'Hết giờ! Bài thi đã được nộp tự động'
            : 'Đã nộp bài thi thành công'
        })
        onComplete()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể nộp bài thi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể nộp bài thi',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    const percentage = (timeLeft / (exam.duration * 60)) * 100
    if (percentage <= 10) return 'text-red-500'
    if (percentage <= 25) return 'text-orange-500'
    return 'text-green-600'
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Dễ'
      case 'MEDIUM': return 'Trung bình'
      case 'HARD': return 'Khó'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang chuẩn bị kỳ thi...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p>Không thể tải câu hỏi. Vui lòng thử lại.</p>
            <Button onClick={onBack} className="mt-4">
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{exam.title}</CardTitle>
              <CardDescription className="mt-1">
                Câu {currentQuestionIndex + 1} / {questions.length}
              </CardDescription>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                <Timer className="h-5 w-5 inline mr-2" />
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground">
                Đã trả lời: {getAnsweredCount()}/{questions.length}
              </div>
            </div>
          </div>

          <Progress 
            value={(currentQuestionIndex + 1) / questions.length * 100} 
            className="mt-4"
          />
        </CardHeader>
      </Card>

      {/* Time Warning */}
      {timeLeft <= 300 && ( // 5 minutes warning
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Chú ý: Chỉ còn {formatTime(timeLeft)} để hoàn thành bài thi!
          </AlertDescription>
        </Alert>
      )}

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                {getDifficultyLabel(currentQuestion.difficulty)}
              </Badge>
              <Badge variant="outline">
                {currentQuestion.points} điểm
              </Badge>
              {currentQuestion.category && (
                <Badge variant="secondary">
                  {currentQuestion.category}
                </Badge>
              )}
            </div>
            
            {answers[currentQuestion.id] !== undefined && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </CardHeader>

        <CardContent>
          <h3 className="text-lg font-medium mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === index
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`${isSelected ? 'text-primary font-medium' : 'text-gray-700'}`}>
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Câu trước
        </Button>

        <div className="flex items-center gap-2">
          {/* Question Navigation Dots */}
          <div className="flex gap-1 overflow-x-auto max-w-xs">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-white'
                    : answers[questions[index].id] !== undefined
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              Câu sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Xác nhận nộp bài</CardTitle>
              <CardDescription>
                Bạn có chắc chắn muốn nộp bài không?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div>Đã trả lời: {getAnsweredCount()}/{questions.length} câu</div>
                    <div>Thời gian còn lại: {formatTime(timeLeft)}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmSubmit(false)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={() => handleSubmitExam()}
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Đang nộp...' : 'Nộp bài'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

