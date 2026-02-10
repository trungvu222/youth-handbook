'use client'

import { useState, useEffect } from 'react'
import { examApi, notificationApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Plus,
  Search,
  Brain,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  Trophy,
  Users,
  FileUp,
  FileDown,
  ChevronDown,
  ChevronUp,
  Bell,
  Send,
  Star,
  Calendar,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExamQuestion {
  id?: string;
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
  category?: string;
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
  totalAttempts?: number;
  avgScore?: number;
}

interface ExamStats {
  totalExams: number;
  publishedExams: number;
  draftExams: number;
  totalAttempts: number;
  avgPassRate: number;
  recentExams: Exam[];
}

export function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([])
  const [stats, setStats] = useState<ExamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [newExamId, setNewExamId] = useState<string | null>(null)
  const [newExamTitle, setNewExamTitle] = useState('')
  
  // Statistics state
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set())
  const [examAttemptsData, setExamAttemptsData] = useState<{[key: string]: any[]}>({})
  const [loadingAttempts, setLoadingAttempts] = useState<{[key: string]: boolean}>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Lý luận chính trị',
    duration: 60,
    passingScore: 70,
    maxAttempts: 3,
    pointsReward: 10,
    startDate: '',
    endDate: '',
    isRandomOrder: false,
    allowReview: true,
    questions: [] as ExamQuestion[]
  })

  const categories = [
    'Lý luận chính trị',
    'Kỹ năng lãnh đạo', 
    'Kiến thức chuyên môn',
    'Pháp luật',
    'Văn hóa - Xã hội',
    'Khác'
  ]

  const statusTypes = [
    { value: 'DRAFT', label: 'Dự thảo' },
    { value: 'PUBLISHED', label: 'Đã xuất bản' },
    { value: 'ARCHIVED', label: 'Đã lưu trữ' }
  ]

  const difficulties = [
    { value: 'EASY', label: 'Dễ', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HARD', label: 'Khó', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    loadExams()
    loadStats()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const response = await examApi.getExams()

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

  const loadStats = async () => {
    try {
      const response = await examApi.getExamStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading exam stats:', error)
    }
  }

  const loadExamAttempts = async (examId: string) => {
    setLoadingAttempts(prev => ({ ...prev, [examId]: true }))
    try {
      const response = await examApi.getExamAttempts(examId)
      if (response.success && response.data) {
        setExamAttemptsData(prev => ({ ...prev, [examId]: response.data }))
      }
    } catch (error) {
      console.error('Error loading exam attempts:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người thi',
        variant: 'destructive'
      })
    } finally {
      setLoadingAttempts(prev => ({ ...prev, [examId]: false }))
    }
  }

  const toggleExamExpansion = async (examId: string) => {
    const newExpanded = new Set(expandedExams)
    if (newExpanded.has(examId)) {
      newExpanded.delete(examId)
    } else {
      newExpanded.add(examId)
      // Load attempts if not already loaded
      if (!examAttemptsData[examId]) {
        await loadExamAttempts(examId)
      }
    }
    setExpandedExams(newExpanded)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Lý luận chính trị',
      duration: 60,
      passingScore: 70,
      maxAttempts: 3,
      pointsReward: 10,
      startDate: '',
      endDate: '',
      isRandomOrder: false,
      allowReview: true,
      questions: [createEmptyQuestion()]
    })
    setSelectedExam(null)
  }

  const createEmptyQuestion = (): ExamQuestion => ({
    question: '',
    options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'MEDIUM',
    category: '',
    points: 1
  })

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()]
    }))
  }

  const importQuestions = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const questions = JSON.parse(event.target?.result as string)
          
          // Validate format
          if (!Array.isArray(questions)) {
            throw new Error('File phải chứa một mảng câu hỏi')
          }

          // Transform to internal format
          const transformedQuestions = questions.map((q: any) => ({
            question: q.question || q.questionText || '',
            options: q.options || q.answers?.map((a: any) => a.text || a) || ['', '', '', ''],
            correctAnswer: q.correctAnswer !== undefined 
              ? q.correctAnswer 
              : q.answers?.findIndex((a: any) => a.isCorrect) || 0,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'MEDIUM',
            category: q.category || '',
            points: q.points || 1
          }))

          setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, ...transformedQuestions]
          }))

          toast({
            title: 'Thành công',
            description: `Đã import ${transformedQuestions.length} câu hỏi`
          })
        } catch (error) {
          console.error('Import error:', error)
          toast({
            title: 'Lỗi',
            description: error instanceof Error ? error.message : 'File không đúng định dạng',
            variant: 'destructive'
          })
        }
      }
      
      reader.readAsText(file)
    }
    
    input.click()
  }

  const exportQuestions = () => {
    const questionsExport = formData.questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      category: q.category,
      points: q.points
    }))

    const blob = new Blob([JSON.stringify(questionsExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cau-hoi-${formData.title.replace(/\s+/g, '-').toLowerCase() || 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Thành công',
      description: 'Đã export câu hỏi ra file JSON'
    })
  }

  const removeQuestion = (index: number) => {
    if (formData.questions.length <= 1) {
      toast({
        title: 'Lỗi',
        description: 'Kỳ thi phải có ít nhất 1 câu hỏi',
        variant: 'destructive'
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex 
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
          : q
      )
    }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề kỳ thi',
        variant: 'destructive'
      })
      return
    }

    if (formData.questions.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất 1 câu hỏi',
        variant: 'destructive'
      })
      return
    }

    // Validate each question
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i]
      
      if (!q.question.trim()) {
        toast({
          title: 'Lỗi',
          description: `Vui lòng nhập câu hỏi số ${i + 1}`,
          variant: 'destructive'
        })
        return
      }

      if (q.options.some(opt => !opt.trim())) {
        toast({
          title: 'Lỗi',
          description: `Vui lòng điền đầy đủ các phương án cho câu hỏi số ${i + 1}`,
          variant: 'destructive'
        })
        return
      }

      if (!q.options[q.correctAnswer]?.trim()) {
        toast({
          title: 'Lỗi',
          description: `Đáp án đúng cho câu hỏi số ${i + 1} không hợp lệ`,
          variant: 'destructive'
        })
        return
      }
    }

    try {
      // Map frontend format to backend format
      const questionsData = formData.questions.map((q, index) => ({
        questionText: q.question,
        questionType: 'SINGLE_CHOICE',
        answers: q.options.map((option, optIndex) => ({
          text: option,
          isCorrect: optIndex === q.correctAnswer
        })),
        explanation: q.explanation || '',
        points: q.points || 1,
        orderIndex: index + 1
      }))

      const examData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        instructions: `Thời gian làm bài: ${formData.duration} phút. Đạt ${formData.passingScore}% để hoàn thành.`,
        duration: formData.duration,
        passingScore: formData.passingScore,
        maxAttempts: formData.maxAttempts,
        pointsAwarded: formData.pointsReward,
        startTime: formData.startDate || null,
        endTime: formData.endDate || null,
        showResults: formData.allowReview,
        showAnswers: formData.allowReview,
        shuffleQuestions: formData.isRandomOrder,
        shuffleAnswers: false,
        questions: questionsData
      }

      const response = selectedExam
        ? await examApi.updateExam(selectedExam.id, examData)
        : await examApi.createExam(examData)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: selectedExam 
            ? 'Đã cập nhật kỳ thi'
            : 'Đã tạo kỳ thi mới'
        })
        
        setShowCreateDialog(false)
        setShowEditDialog(false)
        
        // Show notification dialog for new exams
        if (!selectedExam && response.data?.id) {
          setNewExamId(response.data.id)
          setNewExamTitle(formData.title)
          setShowNotificationDialog(true)
        }
        
        resetForm()
        loadExams()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể lưu kỳ thi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving exam:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu kỳ thi',
        variant: 'destructive'
      })
    }
  }

  const handleSendNotification = async (examId: string, examTitle: string) => {
    try {
      const response = await notificationApi.sendNotification({
        title: '📝 Kỳ thi mới',
        message: `Có kỳ thi mới: "${examTitle}". Hãy vào kiểm tra ngay!`,
        type: 'EXAM',
        relatedId: examId,
        recipients: 'all'
      })

      if (response.success) {
        toast({
          title: 'Gửi thông báo thành công!',
          description: `Đã gửi thông báo đến ${response.data?.sent || 0} đoàn viên`,
          variant: 'success' as any,
          duration: 4000
        })
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi thông báo',
          variant: 'destructive',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Send notification error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi thông báo',
        variant: 'destructive',
        duration: 4000
      })
    }
  }

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam)
    setFormData({
      title: exam.title,
      description: exam.description || '',
      category: exam.category,
      duration: exam.duration,
      passingScore: exam.passingScore,
      maxAttempts: exam.maxAttempts,
      pointsReward: exam.pointsReward,
      startDate: exam.startDate || '',
      endDate: exam.endDate || '',
      isRandomOrder: exam.isRandomOrder,
      allowReview: exam.allowReview,
      questions: exam.questions || [createEmptyQuestion()]
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (exam: Exam) => {
    setExamToDelete(exam)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!examToDelete) return

    try {
      const response = await examApi.deleteExam(examToDelete.id)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa kỳ thi'
        })
        loadExams()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể xóa kỳ thi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa kỳ thi',
        variant: 'destructive'
      })
    } finally {
      setShowDeleteDialog(false)
      setExamToDelete(null)
    }
  }

  const handleImportQuestions = async (file: File) => {
    try {
      const response = await examApi.importQuestions(file)

      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...response.data]
        }))
        toast({
          title: 'Thành công',
          description: `Đã import ${response.data.length} câu hỏi`
        })
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể import câu hỏi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error importing questions:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể import câu hỏi',
        variant: 'destructive'
      })
    }
  }

  const filteredExams = exams.filter(exam => {
    const matchSearch = !searchTerm || 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = statusFilter === 'all' || exam.status === statusFilter

    return matchSearch && matchStatus
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} phút`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyInfo = (difficulty: string) => {
    return difficulties.find(d => d.value === difficulty) || difficulties[1]
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header với gradient đẹp */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6bTAtMjBjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quản lý kỳ thi</h1>
                <p className="text-indigo-100 mt-1">
                  Tạo, chỉnh sửa và quản lý các kỳ thi trực tuyến
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}
            className="bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tạo kỳ thi mới
          </Button>
        </div>
      </div>

      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md rounded-xl p-1.5 h-auto">
          <TabsTrigger 
            value="exams" 
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 font-semibold transition-all duration-300"
          >
            <Brain className="h-4 w-4 mr-2" />
            Danh sách kỳ thi
          </TabsTrigger>
          <TabsTrigger 
            value="stats"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 font-semibold transition-all duration-300"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filters với design đẹp hơn */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Tìm kiếm theo tên kỳ thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 focus:border-indigo-500 rounded-xl transition-all"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 border-2 rounded-xl">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {statusTypes.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Exams List với design mới */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-indigo-600 absolute top-0"></div>
                </div>
              </div>
            ) : filteredExams.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                    <Brain className="h-16 w-16 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Không tìm thấy kỳ thi phù hợp'
                      : 'Chưa có kỳ thi nào'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Thử tìm kiếm với từ khóa khác'
                      : 'Bắt đầu bằng cách tạo kỳ thi đầu tiên'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button 
                      onClick={() => {
                        resetForm()
                        setShowCreateDialog(true)
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo kỳ thi mới
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredExams.map((exam, index) => (
                <Card 
                  key={exam.id} 
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={`${getStatusColor(exam.status)} px-3 py-1 text-xs font-semibold rounded-full`}>
                            {statusTypes.find(s => s.value === exam.status)?.label || exam.status}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-md">
                            <Brain className="h-3 w-3 mr-1" />
                            {exam.totalQuestions} câu
                          </Badge>
                          {exam.category && (
                            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold border-2">
                              {exam.category}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-xl mb-2 line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {exam.title}
                        </h3>

                        {/* Description */}
                        {exam.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {exam.description}
                          </p>
                        )}

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg px-3 py-2">
                            <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Thời gian</div>
                              <div className="text-sm font-bold text-gray-900">{formatDuration(exam.duration)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg px-3 py-2">
                            <Trophy className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Điểm đạt</div>
                              <div className="text-sm font-bold text-gray-900">{exam.passingScore}%</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg px-3 py-2">
                            <Star className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Thưởng</div>
                              <div className="text-sm font-bold text-gray-900">+{exam.pointsReward} điểm</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg px-3 py-2">
                            <RefreshCw className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Số lần</div>
                              <div className="text-sm font-bold text-gray-900">{exam.maxAttempts}x</div>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        {(exam.startDate || exam.endDate) && (
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                            {exam.startDate && (
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="font-medium">Bắt đầu: {formatDate(exam.startDate)}</span>
                              </div>
                            )}
                            {exam.endDate && (
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="font-medium">Kết thúc: {formatDate(exam.endDate)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Statistics */}
                        {exam.totalAttempts !== undefined && (
                          <div className="flex flex-wrap gap-4 text-sm p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-100">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-indigo-600" />
                              <span className="font-semibold text-gray-900">{exam.totalAttempts}</span>
                              <span className="text-gray-600">lượt thi</span>
                            </div>
                            {exam.avgScore && (
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold text-gray-900">{exam.avgScore}%</span>
                                <span className="text-gray-600">điểm TB</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendNotification(exam.id, exam.title)}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Gửi thông báo"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(exam)}
                          className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(exam)}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6 text-center text-white">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Brain className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                    {stats.totalExams}
                  </div>
                  <div className="text-sm font-semibold text-blue-50 uppercase tracking-wide">
                    Tổng kỳ thi
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6 text-center text-white">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <FileUp className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                    {stats.publishedExams}
                  </div>
                  <div className="text-sm font-semibold text-green-50 uppercase tracking-wide">
                    Đã xuất bản
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6 text-center text-white">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Edit className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                    {stats.draftExams}
                  </div>
                  <div className="text-sm font-semibold text-amber-50 uppercase tracking-wide">
                    Dự thảo
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6 text-center text-white">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Users className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                    {stats.totalAttempts}
                  </div>
                  <div className="text-sm font-semibold text-purple-50 uppercase tracking-wide">
                    Tổng lượt thi
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-red-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6 text-center text-white">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Trophy className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                    {stats.avgPassRate != null && !isNaN(stats.avgPassRate) ? Math.round(stats.avgPassRate) : 0}%
                  </div>
                  <div className="text-sm font-semibold text-rose-50 uppercase tracking-wide">
                    Tỷ lệ đạt TB
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Distribution Section */}
          {exams.length > 0 && (() => {
            // Calculate category distribution
            const categoryStats = exams.reduce((acc, exam) => {
              const category = exam.category || 'Chưa phân loại';
              if (!acc[category]) {
                acc[category] = { count: 0, attempts: 0 };
              }
              acc[category].count += 1;
              acc[category].attempts += exam.totalAttempts || 0;
              return acc;
            }, {} as Record<string, { count: number; attempts: number }>);

            const categoryConfigs = [
              { gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600', icon: '📚' },
              { gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', icon: '📖' },
              { gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', icon: '🎯' },
              { gradient: 'bg-gradient-to-br from-purple-500 to-pink-600', icon: '💡' },
              { gradient: 'bg-gradient-to-br from-rose-500 to-red-600', icon: '🏆' }
            ];

            return (
              <Card className="shadow-xl border-0 overflow-hidden mt-8">
                <CardHeader className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white py-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    Phân bổ theo danh mục
                  </CardTitle>
                  <CardDescription className="text-cyan-50 font-medium mt-2">
                    Thống kê kỳ thi theo từng danh mục kiến thức
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryStats).map(([category, stats], idx) => {
                      const config = categoryConfigs[idx % categoryConfigs.length];
                      return (
                        <Card key={category} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                          <div className={`absolute inset-0 ${config.gradient} opacity-90`}></div>
                          <CardContent className="relative p-5 text-white">
                            <div className="flex items-start justify-between mb-4">
                              <div className="text-3xl mb-2">{config.icon}</div>
                              <div className="text-right">
                                <div className="text-3xl font-extrabold drop-shadow-lg">{stats.count}</div>
                                <div className="text-xs font-semibold text-white/90 uppercase">Kỳ thi</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="font-bold text-base break-words">{category}</div>
                              <div className="flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                                <Users className="h-4 w-4 flex-shrink-0" />
                                <span className="font-semibold">{stats.attempts} lượt thi</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Detailed Exams Statistics Table */}
          {exams.length > 0 && (
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Chi tiết từng kỳ thi
                </CardTitle>
                <CardDescription className="text-indigo-50 font-medium mt-2">
                  Danh sách tất cả kỳ thi và thống kê người thi
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {exams.map((exam, index) => (
                    <div key={exam.id} className="border-2 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* Exam Header - Clickable to expand */}
                      <div
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all border-b-2"
                        onClick={() => toggleExamExpansion(exam.id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900 mb-1">{exam.title}</div>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <Clock className="h-3.5 w-3.5" /> {exam.duration} phút
                              </span>
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <span className="font-semibold">📊</span> Điểm đạt: {exam.passingScore}%
                              </span>
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <Users className="h-3.5 w-3.5" /> {exam.totalAttempts || 0} lượt thi
                              </span>
                              {exam.avgScore !== undefined && (
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                  <Trophy className="h-3.5 w-3.5 text-yellow-600" /> TB: {Math.round(exam.avgScore)}đ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`font-semibold shadow-sm ${
                              exam.status === 'PUBLISHED' 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                              exam.status === 'DRAFT' 
                                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                            }`}
                          >
                            {exam.status === 'PUBLISHED' ? 'Đã xuất bản' :
                             exam.status === 'DRAFT' ? 'Dự thảo' : 'Lưu trữ'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900 hover:bg-white/80 font-medium"
                          >
                            {expandedExams.has(exam.id) ? (
                              <><ChevronUp className="h-5 w-5 mr-1" /> Thu gọn</>
                            ) : (
                              <><ChevronDown className="h-5 w-5 mr-1" /> Xem chi tiết</>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Content - Attempts Table */}
                      {expandedExams.has(exam.id) && (
                        <div className="p-6 bg-gray-50">
                          {loadingAttempts[exam.id] ? (
                            <div className="flex justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                              </div>
                            </div>
                          ) : examAttemptsData[exam.id]?.length > 0 ? (
                            <div className="bg-white rounded-lg border-2 shadow-sm overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 w-16">STT</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[180px]">Họ và tên</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[120px]">Cấp bậc</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[140px]">Chức vụ Đoàn</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[160px]">Chi đoàn</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[200px]">Kỳ thi</th>
                                      <th className="py-4 px-4 text-center font-bold text-gray-700 w-28">Điểm</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[180px]">Thời gian thi</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {examAttemptsData[exam.id].map((attempt, idx) => (
                                      <tr 
                                        key={attempt.id} 
                                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        }`}
                                      >
                                        <td className="py-4 px-4 text-gray-700 font-medium">{idx + 1}</td>
                                        <td className="py-4 px-4 font-semibold text-gray-900">{attempt.fullName}</td>
                                        <td className="py-4 px-4 text-gray-700">{attempt.militaryRank || '-'}</td>
                                        <td className="py-4 px-4 text-gray-700">{attempt.youthPosition || 'Đoàn viên'}</td>
                                        <td className="py-4 px-4 text-gray-700">{attempt.unitName}</td>
                                        <td className="py-4 px-4 text-gray-700">{exam.title}</td>
                                        <td className="py-4 px-4 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold border-2 shadow-sm ${
                                              attempt.isPassed 
                                                ? 'bg-green-100 text-green-800 border-green-400' 
                                                : 'bg-red-100 text-red-800 border-red-400'
                                            }`}>
                                              {Math.round(attempt.score)} 
                                              <span className="text-lg">{attempt.isPassed ? '✓' : '✗'}</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-700 text-sm">
                                          {new Date(attempt.submittedAt).toLocaleString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Table Footer with Statistics */}
                              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                                <div className="flex flex-wrap gap-6 items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm text-gray-600">
                                      Tổng cộng: <span className="font-bold text-gray-900 text-lg ml-1">{examAttemptsData[exam.id].length}</span> lượt thi
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-gray-600">
                                      Tỷ lệ đạt: <span className="font-bold text-green-700 text-lg ml-1">
                                        {Math.round((examAttemptsData[exam.id].filter(a => a.isPassed).length / examAttemptsData[exam.id].length) * 100)}%
                                      </span>
                                      <span className="text-gray-500 ml-2">
                                        ({examAttemptsData[exam.id].filter(a => a.isPassed).length}/{examAttemptsData[exam.id].length})
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-orange-600" />
                                    <span className="text-sm text-gray-600">
                                      Điểm TB: <span className="font-bold text-orange-700 text-lg ml-1">
                                        {Math.round(examAttemptsData[exam.id].reduce((sum, a) => sum + a.score, 0) / examAttemptsData[exam.id].length)}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Users className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">Chưa có ai thi kỳ này</p>
                                <p className="text-sm text-gray-400">Dữ liệu sẽ hiển thị khi có đoàn viên hoàn thành bài thi</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Exam Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExam ? 'Chỉnh sửa kỳ thi' : 'Tạo kỳ thi mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết và câu hỏi cho kỳ thi
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Thông tin kỳ thi</TabsTrigger>
              <TabsTrigger value="questions">Câu hỏi ({formData.questions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Tiêu đề kỳ thi *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tiêu đề kỳ thi"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả về nội dung và mục đích của kỳ thi"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Thời gian (phút)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="passingScore">Điểm đạt (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxAttempts">Số lần thi tối đa</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="pointsReward">Điểm thưởng</Label>
                  <Input
                    id="pointsReward"
                    type="number"
                    min="0"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsReward: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu (tùy chọn)</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Ngày kết thúc (tùy chọn)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRandomOrder"
                    checked={formData.isRandomOrder}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRandomOrder: checked }))}
                  />
                  <Label htmlFor="isRandomOrder">
                    Trộn thứ tự câu hỏi
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowReview"
                    checked={formData.allowReview}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowReview: checked }))}
                  />
                  <Label htmlFor="allowReview">
                    Cho phép xem lại đáp án sau khi thi
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="flex justify-between items-center mb-6 pt-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Câu hỏi ({formData.questions.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={importQuestions}
                    title="Import câu hỏi từ file JSON"
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import JSON
                  </Button>
                  {formData.questions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportQuestions}
                      title="Export câu hỏi ra file JSON"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  )}
                  <Button size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm câu hỏi
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {formData.questions.map((question, questionIndex) => (
                  <Card key={questionIndex} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-semibold text-base">Câu hỏi {questionIndex + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </div>

                      <div>
                        <Label>Nội dung câu hỏi *</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          placeholder="Nhập nội dung câu hỏi"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Độ khó</Label>
                          <Select 
                            value={question.difficulty} 
                            onValueChange={(value) => updateQuestion(questionIndex, 'difficulty', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {difficulties.map(diff => (
                                <SelectItem key={diff.value} value={diff.value}>
                                  {diff.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Số điểm</Label>
                          <Input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => updateQuestion(questionIndex, 'points', Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <Label>Danh mục con</Label>
                          <Input
                            value={question.category || ''}
                            onChange={(e) => updateQuestion(questionIndex, 'category', e.target.value)}
                            placeholder="Ví dụ: Chương 1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Các phương án trả lời *</Label>
                        <div className="space-y-2 mt-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`correct-${questionIndex}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                                className="mt-1"
                              />
                              <span className="font-medium w-6">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <Input
                                value={option}
                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`Phương án ${String.fromCharCode(65 + optionIndex)}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Chọn radio button để đánh dấu đáp án đúng
                        </p>
                      </div>

                      <div>
                        <Label>Giải thích (tùy chọn)</Label>
                        <Textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                          placeholder="Giải thích tại sao đây là đáp án đúng"
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                resetForm()
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || formData.questions.length === 0}
            >
              {selectedExam ? 'Cập nhật' : 'Tạo kỳ thi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog after creating exam */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Tạo kỳ thi thành công!
            </DialogTitle>
            <DialogDescription>
              Kỳ thi "{newExamTitle}" đã được tạo. Bạn có muốn gửi thông báo đến tất cả đoàn viên không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowNotificationDialog(false)
                setNewExamId(null)
                setNewExamTitle('')
              }}
            >
              Bỏ qua
            </Button>
            <Button
              onClick={async () => {
                if (newExamId && newExamTitle) {
                  await handleSendNotification(newExamId, newExamTitle)
                }
                setShowNotificationDialog(false)
                setNewExamId(null)
                setNewExamTitle('')
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Gửi thông báo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa kỳ thi
            </DialogTitle>
            <DialogDescription className="text-left">
              Bạn có chắc chắn muốn xóa kỳ thi <strong>"{examToDelete?.title}"</strong>?<br />
              Hành động này không thể hoàn tác và sẽ xóa tất cả kết quả thi liên quan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa kỳ thi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

