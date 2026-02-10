'use client'

import { useState, useEffect, useMemo } from 'react'
import { surveyApi, notificationApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  ListChecks,
  Send,
  X as XIcon,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '../ui/toaster'

interface Survey {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  startDate?: string;
  endDate?: string;
  pointsReward?: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName: string;
  };
  _count?: {
    questions: number;
    responses: number;
  };
}

interface SurveyQuestion {
  id?: string;
  questionText: string;
  questionType: 'TEXT' | 'MULTIPLE_CHOICE' | 'RATING' | 'YES_NO';
  options?: string[];
  isRequired: boolean;
}

interface SurveyStats {
  totalSurveys: number;
  activeSurveys: number;
  draftSurveys: number;
  closedSurveys: number;
  totalResponses: number;
  completionRate: number;
  avgResponseTime: number | null;
}

export function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null)
  const { toast } = useToast()
  
  // Statistics state
  const [expandedSurveys, setExpandedSurveys] = useState<Set<string>>(new Set())
  const [surveyResponsesData, setSurveyResponsesData] = useState<{[key: string]: any[]}>({})
  const [loadingResponses, setLoadingResponses] = useState<{[key: string]: boolean}>({})

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'CLOSED',
    startDate: '',
    endDate: '',
    pointsReward: 10,
    questions: [] as SurveyQuestion[]
  })
  
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [newSurveyId, setNewSurveyId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const statusTypes = [
    { value: 'DRAFT', label: 'Dự thảo', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ACTIVE', label: 'Đang hoạt động', color: 'bg-green-100 text-green-800' },
    { value: 'CLOSED', label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    loadSurveys()
    loadStats()
  }, [])

  const loadSurveys = async () => {
    try {
      setLoading(true)
      const response = await surveyApi.getSurveys()

      if (response.success && response.data) {
        setSurveys(response.data)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải danh sách khảo sát',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading surveys:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách khảo sát',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await surveyApi.getSurveyStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading survey stats:', error)
    }
  }

  const loadSurveyResponses = async (surveyId: string) => {
    setLoadingResponses(prev => ({ ...prev, [surveyId]: true }))
    try {
      const response = await surveyApi.getSurveyResponses(surveyId)
      if (response.success && response.data) {
        setSurveyResponsesData(prev => ({ ...prev, [surveyId]: response.data || [] }))
      }
    } catch (error) {
      console.error('Error loading survey responses:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách phản hồi',
        variant: 'destructive'
      })
    } finally {
      setLoadingResponses(prev => ({ ...prev, [surveyId]: false }))
    }
  }

  const toggleSurveyExpansion = async (surveyId: string) => {
    const newExpanded = new Set(expandedSurveys)
    if (newExpanded.has(surveyId)) {
      newExpanded.delete(surveyId)
    } else {
      newExpanded.add(surveyId)
      // Load responses if not already loaded
      if (!surveyResponsesData[surveyId]) {
        await loadSurveyResponses(surveyId)
      }
    }
    setExpandedSurveys(newExpanded)
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề khảo sát',
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

    try {
      const surveyData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        pointsReward: formData.pointsReward,
        questions: formData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || [],
          isRequired: q.isRequired
        }))
      }

      const response = await surveyApi.createSurvey(surveyData)
      
      if (response.success && response.data) {
        toast({
          title: 'Thành công',
          description: 'Tạo khảo sát mới thành công',
          duration: 4000
        })
        setShowCreateDialog(false)
        setNewSurveyId(response.data.id)
        setShowNotificationDialog(true)
        resetForm()
        loadSurveys()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tạo khảo sát',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating survey:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo khảo sát',
        variant: 'destructive'
      })
    }
  }

  const handleSendNotification = async () => {
    if (!newSurveyId) return

    try {
      const response = await notificationApi.sendNotification({
        title: 'Khảo sát ý kiến mới',
        message: `Có khảo sát mới cần bạn tham gia. Vui lòng hoàn thành để nhận điểm thưởng.`,
        type: 'SURVEY',
        relatedId: newSurveyId,
        recipients: 'all'
      })

      if (response.success) {
        const sentCount = response.data?.sent || 0
        toast({
          title: 'Thành công',
          description: `Đã gửi thông báo đến ${sentCount} đoàn viên`,
          duration: 4000
        })
        setShowNotificationDialog(false)
        setNewSurveyId(null)
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi thông báo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi thông báo',
        variant: 'destructive'
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedSurvey) return

    if (!formData.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề khảo sát',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await surveyApi.updateSurvey(selectedSurvey.id, formData)
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Cập nhật khảo sát thành công',
          duration: 4000
        })
        setShowEditDialog(false)
        setSelectedSurvey(null)
        resetForm()
        loadSurveys()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể cập nhật khảo sát',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating survey:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật khảo sát',
        variant: 'destructive'
      })
    }
  }

  const openDeleteDialog = (survey: Survey) => {
    setSurveyToDelete(survey)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!surveyToDelete) return

    try {
      const response = await surveyApi.deleteSurvey(surveyToDelete.id)
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa khảo sát',
          duration: 4000
        })
        setShowDeleteDialog(false)
        setSurveyToDelete(null)
        loadSurveys()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể xóa khảo sát',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting survey:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa khảo sát',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'DRAFT',
      startDate: '',
      endDate: '',
      pointsReward: 10,
      questions: []
    })
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          questionType: 'TEXT',
          isRequired: true,
          options: []
        }
      ]
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const openEditDialog = (survey: Survey) => {
    setSelectedSurvey(survey)
    setFormData({
      title: survey.title,
      description: survey.description || '',
      status: survey.status,
      startDate: survey.startDate ? new Date(survey.startDate).toISOString().split('T')[0] : '',
      endDate: survey.endDate ? new Date(survey.endDate).toISOString().split('T')[0] : '',
      pointsReward: survey.pointsReward || 10,
      questions: [] // Load from API if needed
    })
    setShowEditDialog(true)
  }

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredSurveys.length / ITEMS_PER_PAGE)
  const paginatedSurveys = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredSurveys.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredSurveys, currentPage, ITEMS_PER_PAGE])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Quản lý khảo sát ý kiến</h2>
            <p className="text-muted-foreground mt-1">
              Tạo và quản lý các khảo sát ý kiến đoàn viên
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                loadSurveys()
                loadStats()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo khảo sát mới
            </Button>
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Tổng khảo sát */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-8 -mt-8" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-800">Tổng khảo sát</span>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-1">{stats?.totalSurveys || 0}</div>
                <p className="text-xs text-blue-600/80">Tổng số khảo sát đã tạo</p>
              </CardContent>
            </Card>

            {/* Đang hoạt động */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -mr-8 -mt-8" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-800">Đang hoạt động</span>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-700 mb-1">{stats?.activeSurveys || 0}</div>
                <p className="text-xs text-green-600/80">Khảo sát đang mở</p>
              </CardContent>
            </Card>

            {/* Dự thảo */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -mr-8 -mt-8" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-amber-800">Dự thảo</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-700 mb-1">{stats?.draftSurveys || 0}</div>
                <p className="text-xs text-amber-600/80">Chưa xuất bản</p>
              </CardContent>
            </Card>

            {/* Tổng phản hồi */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -mr-8 -mt-8" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-800">Tổng phản hồi</span>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-1">{stats?.totalResponses || 0}</div>
                <p className="text-xs text-purple-600/80">Lượt đoàn viên phản hồi</p>
              </CardContent>
            </Card>

            {/* Tỷ lệ hoàn thành */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/30 rounded-full -mr-8 -mt-8" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-orange-800">Tỷ lệ hoàn thành</span>
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-orange-700 mb-1">
                  {stats?.completionRate ? `${Math.round(stats.completionRate)}%` : '0%'}
                </div>
                <p className="text-xs text-orange-600/80">Tỷ lệ trung bình</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Surveys */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Khảo sát gần đây
              </CardTitle>
              <CardDescription>5 khảo sát được tạo mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {surveys.slice(0, 5).map((survey) => (
                  <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold">{survey.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {survey.description || 'Không có mô tả'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className={statusTypes.find(s => s.value === survey.status)?.color}>
                          {statusTypes.find(s => s.value === survey.status)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {survey._count?.responses || 0} phản hồi
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(survey)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDeleteDialog(survey)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {surveys.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Chưa có khảo sát nào</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST TAB */}
        <TabsContent value="list" className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search Row */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                {/* Search Input */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-primary/60" />
                    </div>
                    <Input
                      placeholder="Tìm kiếm khảo sát theo tiêu đề..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-base bg-white border-0 shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="w-full lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 w-full lg:w-[200px] bg-white border-0 shadow-sm rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <SelectValue placeholder="Trạng thái" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          Tất cả trạng thái
                        </span>
                      </SelectItem>
                      {statusTypes.map(status => (
                        <SelectItem key={status.value} value={status.value} className="rounded-lg">
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              status.value === 'active' ? 'bg-green-500' :
                              status.value === 'draft' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></span>
                            {status.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Quick Stats & Result Count */}
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{filteredSurveys.length}</span>
                  <span className="text-sm text-gray-600">khảo sát</span>
                </div>
                {searchTerm && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Tìm: "{searchTerm}"
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-2 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {statusTypes.find(s => s.value === statusFilter)?.label}
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className="ml-2 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
              
              {/* Quick Filter Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-1">Lọc nhanh:</span>
                {statusTypes.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(statusFilter === status.value ? 'all' : status.value)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      statusFilter === status.value
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Survey List */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paginatedSurveys.map((survey, index) => (
              <Card 
                key={survey.id} 
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  survey.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  survey.status === 'DRAFT' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
                }`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {survey.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2 text-sm">
                        {survey.description || 'Không có mô tả'}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={`shrink-0 ${
                        survey.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : survey.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {statusTypes.find(s => s.value === survey.status)?.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50/80 rounded-lg mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-blue-100">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{survey._count?.responses || 0}</p>
                      <p className="text-xs text-muted-foreground">Phản hồi</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-purple-100">
                        <ListChecks className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{survey._count?.questions || 0}</p>
                      <p className="text-xs text-muted-foreground">Câu hỏi</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-orange-100">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(survey.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground">Tạo lúc</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                      onClick={() => openEditDialog(survey)}
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Chỉnh sửa
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDeleteDialog(survey)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {filteredSurveys.length > ITEMS_PER_PAGE && (
            <Card className="border-0 shadow-md mt-6">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị <span className="font-semibold text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSurveys.length)}</span> trong tổng số <span className="font-semibold text-primary">{filteredSurveys.length}</span> khảo sát
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-9 px-3 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          className={`w-9 h-9 p-0 font-medium ${
                            currentPage === page 
                              ? 'bg-primary text-white shadow-md' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-9 px-3 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSurveys.length === 0 && (
            <Card className="border-0 shadow-md bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <ClipboardList className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700">Không tìm thấy khảo sát</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn'
                    : 'Bắt đầu bằng cách tạo khảo sát đầu tiên'}
                </p>
                {!(searchTerm || statusFilter !== 'all') && (
                  <Button className="mt-6" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo khảo sát mới
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* STATISTICS TAB */}
        <TabsContent value="stats" className="space-y-6">
          {/* Stats Summary Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card className="shadow-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-600">{stats?.totalSurveys || 0}</div>
                <p className="text-sm font-medium text-gray-600 mt-1">Tổng khảo sát</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-green-600">{stats?.activeSurveys || 0}</div>
                <p className="text-sm font-medium text-gray-600 mt-1">Đang hoạt động</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-purple-600">{stats?.totalResponses || 0}</div>
                <p className="text-sm font-medium text-gray-600 mt-1">Lượt phản hồi</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-orange-600">
                  {stats?.completionRate ? `${Math.round(stats.completionRate)}%` : '0%'}
                </div>
                <p className="text-sm font-medium text-gray-600 mt-1">Tỷ lệ hoàn thành</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-indigo-600">
                  {stats?.avgResponseTime ? `${stats.avgResponseTime} phút` : '- phút'}
                </div>
                <p className="text-sm font-medium text-gray-600 mt-1">Thời gian TB</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Surveys Statistics Table */}
          {surveys.length > 0 && (
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Chi tiết từng khảo sát
                </CardTitle>
                <CardDescription className="text-indigo-50 font-medium mt-2">
                  Danh sách tất cả khảo sát và thống kê phản hồi đoàn viên
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {surveys.map((survey, index) => (
                    <div key={survey.id} className="border-2 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* Survey Header - Clickable to expand */}
                      <div
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 cursor-pointer transition-all border-b-2"
                        onClick={() => toggleSurveyExpansion(survey.id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg shadow-md">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900 mb-1">{survey.title}</div>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <MessageSquare className="h-3.5 w-3.5" /> {survey._count?.responses || 0} phản hồi
                              </span>
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <ListChecks className="h-3.5 w-3.5" /> {survey._count?.questions || 0} câu hỏi
                              </span>
                              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                <Clock className="h-3.5 w-3.5" /> {new Date(survey.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`font-semibold shadow-sm ${
                              survey.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                              survey.status === 'DRAFT' 
                                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                            }`}
                          >
                            {statusTypes.find(s => s.value === survey.status)?.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900 hover:bg-white/80 font-medium"
                          >
                            {expandedSurveys.has(survey.id) ? (
                              <><ChevronUp className="h-5 w-5 mr-1" /> Thu gọn</>
                            ) : (
                              <><ChevronDown className="h-5 w-5 mr-1" /> Xem chi tiết</>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Content - Responses Table */}
                      {expandedSurveys.has(survey.id) && (
                        <div className="p-6 bg-gray-50">
                          {loadingResponses[survey.id] ? (
                            <div className="flex justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                              </div>
                            </div>
                          ) : surveyResponsesData[survey.id]?.length > 0 ? (
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
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[200px]">Khảo sát</th>
                                      <th className="py-4 px-4 text-center font-bold text-gray-700 w-32">Phản hồi</th>
                                      <th className="py-4 px-4 text-left font-bold text-gray-700 min-w-[180px]">Thời gian</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {surveyResponsesData[survey.id].map((response, idx) => (
                                      <tr 
                                        key={response.id} 
                                        className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        }`}
                                      >
                                        <td className="py-4 px-4 text-gray-700 font-medium">{idx + 1}</td>
                                        <td className="py-4 px-4 font-semibold text-gray-900">{response.fullName}</td>
                                        <td className="py-4 px-4 text-gray-700">{response.militaryRank || '-'}</td>
                                        <td className="py-4 px-4 text-gray-700">{response.youthPosition || 'Đoàn viên'}</td>
                                        <td className="py-4 px-4 text-gray-700">{response.unitName}</td>
                                        <td className="py-4 px-4 text-gray-700">{survey.title}</td>
                                        <td className="py-4 px-4 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold border-2 shadow-sm bg-blue-100 text-blue-800 border-blue-400">
                                              <CheckCircle2 className="h-4 w-4" />
                                              Đã nộp
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-700 text-sm">
                                          {new Date(response.submittedAt).toLocaleString('vi-VN', {
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
                                      Tổng cộng: <span className="font-bold text-gray-900 text-lg ml-1">{surveyResponsesData[survey.id].length}</span> phản hồi
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-gray-600">
                                      Tỷ lệ hoàn thành: <span className="font-bold text-green-700 text-lg ml-1">100%</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    <span className="text-sm text-gray-600">
                                      Tham gia: <span className="font-bold text-orange-700 text-lg ml-1">
                                        {surveyResponsesData[survey.id].length}
                                      </span> đoàn viên
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                  <MessageSquare className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">Chưa có phản hồi nào</p>
                                <p className="text-sm text-gray-400">Dữ liệu sẽ hiển thị khi có đoàn viên hoàn thành khảo sát</p>
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

          {surveys.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Chưa có dữ liệu thống kê</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tạo khảo sát đầu tiên để xem thống kê
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Survey Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
          setSelectedSurvey(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedSurvey ? 'Chỉnh sửa khảo sát' : 'Tạo khảo sát mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho khảo sát ý kiến đoàn viên
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Thông tin khảo sát */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Thông tin khảo sát</h3>
              
              <div>
                <Label htmlFor="title">Tiêu đề khảo sát *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề khảo sát"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về mục đích và nội dung khảo sát"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pointsReward">Điểm thưởng</Label>
                  <Input
                    id="pointsReward"
                    type="number"
                    min="0"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsReward: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusTypes.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Câu hỏi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Câu hỏi (user tự nhập câu trả lời)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm câu hỏi
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 text-sm">Chưa có câu hỏi nào</p>
                  <p className="text-gray-400 text-xs mt-1">Nhấn "Thêm câu hỏi" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <Label className="font-semibold">Câu {index + 1}:</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={question.questionText}
                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                        placeholder="Nhập nội dung câu hỏi (VD: Bạn muốn hoạt động nào trong tháng 8?)"
                        className="mb-2"
                      />
                      <div className="flex gap-2 items-center">
                        <Select
                          value={question.questionType}
                          onValueChange={(value) => updateQuestion(index, 'questionType', value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEXT">Văn bản tự do</SelectItem>
                            <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
                            <SelectItem value="RATING">Đánh giá (1-5)</SelectItem>
                            <SelectItem value="YES_NO">Có/Không</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.isRequired}
                            onChange={(e) => updateQuestion(index, 'isRequired', e.target.checked)}
                            className="rounded"
                          />
                          Bắt buộc
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                setSelectedSurvey(null)
                resetForm()
              }}
            >
              Hủy
            </Button>
            <Button onClick={selectedSurvey ? handleUpdate : handleCreate}>
              {selectedSurvey ? 'Cập nhật' : 'Tạo khảo sát'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi thông báo đến đoàn viên</DialogTitle>
            <DialogDescription>
              Khảo sát đã được tạo thành công! Bạn có muốn gửi thông báo đến tất cả đoàn viên trên mobile không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNotificationDialog(false)
                setNewSurveyId(null)
              }}
            >
              Bỏ qua
            </Button>
            <Button onClick={handleSendNotification}>
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
              Xác nhận xóa khảo sát
            </DialogTitle>
            <DialogDescription className="text-left">
              Bạn có chắc chắn muốn xóa khảo sát <strong>"{surveyToDelete?.title}"</strong>?<br />
              Hành động này không thể hoàn tác và sẽ xóa tất cả câu trả lời liên quan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa khảo sát
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
