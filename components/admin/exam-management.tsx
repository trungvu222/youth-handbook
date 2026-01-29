'use client'

import { useState, useEffect } from 'react'
import { examApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
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
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from '../ui/use-toast'

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
    options: ['', '', '', ''],
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
      const examData = {
        ...formData,
        totalQuestions: formData.questions.length,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
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

  const handleDelete = async (exam: Exam) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa kỳ thi "${exam.title}"?`)) {
      return
    }

    try {
      const response = await examApi.deleteExam(exam.id)

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

    const matchCategory = categoryFilter === 'all' || exam.category === categoryFilter
    const matchStatus = statusFilter === 'all' || exam.status === statusFilter

    return matchSearch && matchCategory && matchStatus
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý kỳ thi</h1>
          <p className="text-muted-foreground">
            Tạo, chỉnh sửa và quản lý các kỳ thi trực tuyến
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo kỳ thi mới
        </Button>
      </div>

      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams">Danh sách kỳ thi</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm kỳ thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
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
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Không tìm thấy kỳ thi phù hợp'
                      : 'Chưa có kỳ thi nào'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredExams.map(exam => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(exam.status)}>
                            {statusTypes.find(s => s.value === exam.status)?.label || exam.status}
                          </Badge>
                          <Badge variant="outline">{exam.category}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {exam.totalQuestions} câu
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
                          <span>+{exam.pointsReward} điểm</span>
                          <span>Tối đa: {exam.maxAttempts} lần</span>
                        </div>

                        {(exam.startDate || exam.endDate) && (
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {exam.startDate && (
                              <span>Bắt đầu: {formatDate(exam.startDate)}</span>
                            )}
                            {exam.endDate && (
                              <span>Kết thúc: {formatDate(exam.endDate)}</span>
                            )}
                          </div>
                        )}

                        {exam.totalAttempts !== undefined && (
                          <div className="mt-2 flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {exam.totalAttempts} lượt thi
                            </span>
                            {exam.avgScore && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                Điểm TB: {exam.avgScore}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(exam)}
                          className="text-red-600 hover:text-red-700"
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

        <TabsContent value="stats" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalExams}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng kỳ thi
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.publishedExams}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Đã xuất bản
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.draftExams}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Dự thảo
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalAttempts}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng lượt thi
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(stats.avgPassRate)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tỷ lệ đạt TB
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Câu hỏi ({formData.questions.length})
                </h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImportQuestions(file)
                    }}
                    className="hidden"
                    id="import-questions"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-questions')?.click()}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import
                  </Button>
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
                        <h4 className="font-medium">Câu hỏi {questionIndex + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
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
    </div>
  )
}

