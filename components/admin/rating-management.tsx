'use client'

import { useState, useEffect } from 'react'
import { ratingApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Send,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from '../ui/use-toast'

interface RatingPeriod {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  criteria: {
    id: string;
    name: string;
    description: string;
    isRequired: boolean;
  }[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalSubmissions?: number;
  pendingApprovals?: number;
  createdAt: string;
  author: {
    fullName: string;
  };
}

interface SelfRating {
  id: string;
  suggestedRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  selfAssessment?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  finalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  adminNotes?: string;
  pointsAwarded?: number;
  submittedAt?: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    unitName?: string;
  };
  period: {
    id: string;
    title: string;
  };
}

export default function RatingManagement() {
  const [activeTab, setActiveTab] = useState('periods')
  const [periods, setPeriods] = useState<RatingPeriod[]>([])
  const [pendingRatings, setPendingRatings] = useState<SelfRating[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<RatingPeriod | null>(null)
  const [selectedRating, setSelectedRating] = useState<SelfRating | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<RatingPeriod | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Handlers for edit and delete period
  const handleEditPeriod = (period: RatingPeriod) => {
    setEditingPeriod(period)
    setFormData({
      title: period.title,
      description: period.description || '',
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      criteria: period.criteria.length > 0 
        ? period.criteria.map(c => ({ name: c.name, description: c.description, isRequired: c.isRequired }))
        : [{ name: '', description: '', isRequired: true }]
    })
    setShowCreateDialog(true)
  }

  const handleDeletePeriod = (periodId: string) => {
    setShowDeleteConfirm(periodId)
  }

  const confirmDeletePeriod = async () => {
    if (!showDeleteConfirm) return
    try {
      toast({
        title: 'Thành công',
        description: 'Đã xóa kỳ xếp loại'
      })
      setShowDeleteConfirm(null)
      loadData()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa kỳ xếp loại',
        variant: 'destructive'
      })
    }
  }

  // Form state for creating periods
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    criteria: [
      { name: '', description: '', isRequired: true }
    ]
  })

  // Approval form state
  const [approvalData, setApprovalData] = useState({
    finalRating: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR',
    adminNotes: '',
    pointsAwarded: 0,
    action: 'APPROVE' as 'APPROVE' | 'REJECT'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load rating periods
      const periodsResponse = await ratingApi.getRatingPeriods()
      if (periodsResponse.success && periodsResponse.data) {
        setPeriods(periodsResponse.data)
      }

      // Load pending ratings
      const pendingResponse = await ratingApi.getPendingRatings()
      if (pendingResponse.success && pendingResponse.data) {
        setPendingRatings(pendingResponse.data)
      }

      // Load stats
      const statsResponse = await ratingApi.getRatingStats()
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

    } catch (error) {
      console.error('Error loading rating management data:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu quản lý xếp loại',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePeriod = async () => {
    if (!formData.title.trim() || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive'
      })
      return
    }

    if (formData.criteria.some(c => !c.name.trim() || !c.description.trim())) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin cho tất cả tiêu chí',
        variant: 'destructive'
      })
      return
    }

    try {
      const periodData = {
        title: formData.title,
        description: formData.description || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        criteria: formData.criteria.map((c, index) => ({
          id: `criteria_${index}`,
          ...c
        })),
        targetAudience: 'ALL' as const
      }

      const response = await ratingApi.createRatingPeriod(periodData)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã tạo kỳ xếp loại mới'
        })
        setShowCreateDialog(false)
        resetForm()
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tạo kỳ xếp loại',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating rating period:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo kỳ xếp loại',
        variant: 'destructive'
      })
    }
  }

  const handleApproveRating = async () => {
    if (!selectedRating) return

    try {
      const response = approvalData.action === 'APPROVE'
        ? await ratingApi.approveRating(selectedRating.id, {
            finalRating: approvalData.finalRating,
            adminNotes: approvalData.adminNotes || undefined,
            pointsAwarded: approvalData.pointsAwarded
          })
        : await ratingApi.rejectRating(selectedRating.id, approvalData.adminNotes)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: approvalData.action === 'APPROVE' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá'
        })
        setShowApprovalDialog(false)
        setSelectedRating(null)
        resetApprovalForm()
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể xử lý đánh giá',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing rating:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể xử lý đánh giá',
        variant: 'destructive'
      })
    }
  }

  const handleSendReminder = async (periodId: string) => {
    try {
      const response = await ratingApi.sendRatingReminder(periodId)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã gửi thông báo nhắc nhở'
        })
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi thông báo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi thông báo',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      criteria: [
        { name: '', description: '', isRequired: true }
      ]
    })
  }

  const resetApprovalForm = () => {
    setApprovalData({
      finalRating: 'GOOD',
      adminNotes: '',
      pointsAwarded: 0,
      action: 'APPROVE'
    })
  }

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, { name: '', description: '', isRequired: true }]
    }))
  }

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }))
  }

  const updateCriteria = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-purple-600'
      case 'GOOD': return 'text-blue-600'
      case 'AVERAGE': return 'text-green-600'
      case 'POOR': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'Xuất sắc'
      case 'GOOD': return 'Khá'
      case 'AVERAGE': return 'Trung bình'
      case 'POOR': return 'Yếu'
      default: return rating
    }
  }

  const getPointsByRating = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 10
      case 'GOOD': return 5
      case 'AVERAGE': return 2
      case 'POOR': return 1
      default: return 0
    }
  }

  // Update points when rating changes
  useEffect(() => {
    setApprovalData(prev => ({
      ...prev,
      pointsAwarded: getPointsByRating(prev.finalRating)
    }))
  }, [approvalData.finalRating])

  const filteredPeriods = periods.filter(period => 
    !searchTerm || period.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý xếp loại chất lượng</h1>
          <p className="text-muted-foreground">
            Tạo kỳ xếp loại, duyệt đánh giá và theo dõi tiến độ
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo kỳ xếp loại
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kỳ xếp loại ({periods.length})
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Chờ duyệt ({pendingRatings.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm kỳ xếp loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Periods List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPeriods.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có kỳ xếp loại nào</p>
                </CardContent>
              </Card>
            ) : (
              filteredPeriods.map(period => (
                <Card key={period.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(period.status)}>
                            {period.status === 'ACTIVE' ? 'Đang diễn ra' :
                             period.status === 'DRAFT' ? 'Dự thảo' :
                             period.status === 'COMPLETED' ? 'Đã kết thúc' : 'Đã hủy'}
                          </Badge>
                          {period.pendingApprovals && period.pendingApprovals > 0 && (
                            <Badge className="bg-orange-100 text-orange-800">
                              {period.pendingApprovals} chờ duyệt
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg mb-2">
                          {period.title}
                        </h3>

                        {period.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {period.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span>{period.criteria?.length || 0} tiêu chí</span>
                          {period.totalSubmissions && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {period.totalSubmissions} đã gửi
                            </span>
                          )}
                          <span>Tạo: {period.author.fullName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {period.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendReminder(period.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPeriod(period)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePeriod(period.id)}
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

        <TabsContent value="approvals" className="space-y-4">
          {/* Pending Ratings */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingRatings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có đánh giá nào chờ duyệt</p>
                </CardContent>
              </Card>
            ) : (
              pendingRatings.map(rating => (
                <Card key={rating.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            Chờ duyệt
                          </Badge>
                          <Badge className={`${getRatingColor(rating.suggestedRating)} bg-opacity-10 border-current`}>
                            Đề xuất: {getRatingLabel(rating.suggestedRating)}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-lg mb-1">
                          {rating.user.fullName}
                        </h3>
                        
                        <p className="text-muted-foreground mb-3">
                          {rating.period.title}
                        </p>

                        {rating.selfAssessment && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-xs font-medium text-gray-500 mb-1">Tự đánh giá:</div>
                            <div className="text-sm text-gray-700 line-clamp-2">
                              {rating.selfAssessment}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Gửi: {new Date(rating.submittedAt || rating.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          {rating.user.unitName && (
                            <span>{rating.user.unitName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRating(rating)
                            setApprovalData(prev => ({
                              ...prev,
                              finalRating: rating.suggestedRating,
                              action: 'APPROVE'
                            }))
                            setShowApprovalDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem & Duyệt
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalPeriods || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng kỳ xếp loại
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalSubmissions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng đánh giá
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.pendingApprovals || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Chờ duyệt
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.avgRating * 100) / 100 || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Điểm TB
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Period Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo kỳ xếp loại mới</DialogTitle>
            <DialogDescription>
              Thiết lập thông tin và tiêu chí cho kỳ xếp loại
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ví dụ: Xếp loại chất lượng Quý 1/2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về mục đích và nội dung của kỳ xếp loại"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Criteria */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Tiêu chí đánh giá *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm tiêu chí
                </Button>
              </div>

              <div className="space-y-3">
                {formData.criteria.map((criteria, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Tiêu chí {index + 1}</h4>
                        {formData.criteria.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriteria(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Input
                        placeholder="Tên tiêu chí"
                        value={criteria.name}
                        onChange={(e) => updateCriteria(index, 'name', e.target.value)}
                      />

                      <Textarea
                        placeholder="Mô tả chi tiết tiêu chí"
                        value={criteria.description}
                        onChange={(e) => updateCriteria(index, 'description', e.target.value)}
                        rows={2}
                      />

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={criteria.isRequired}
                          onChange={(e) => updateCriteria(index, 'isRequired', e.target.checked)}
                        />
                        <Label htmlFor={`required-${index}`} className="text-sm">
                          Tiêu chí bắt buộc
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreatePeriod}>
              Tạo kỳ xếp loại
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duyệt đánh giá xếp loại</DialogTitle>
            <DialogDescription>
              {selectedRating && `Đánh giá của ${selectedRating.user.fullName} - ${selectedRating.period.title}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRating && (
            <div className="space-y-4">
              {/* Current Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đánh giá hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Mức đề xuất: </span>
                    <span className={`font-semibold ${getRatingColor(selectedRating.suggestedRating)}`}>
                      {getRatingLabel(selectedRating.suggestedRating)}
                    </span>
                  </div>
                  
                  {selectedRating.selfAssessment && (
                    <div>
                      <div className="text-sm font-medium mb-1">Tự đánh giá:</div>
                      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                        {selectedRating.selfAssessment}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Approval Action */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={approvalData.action === 'APPROVE' ? 'default' : 'outline'}
                  onClick={() => setApprovalData(prev => ({ ...prev, action: 'APPROVE' }))}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Duyệt
                </Button>
                <Button
                  variant={approvalData.action === 'REJECT' ? 'destructive' : 'outline'}
                  onClick={() => setApprovalData(prev => ({ ...prev, action: 'REJECT' }))}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
              </div>

              {approvalData.action === 'APPROVE' && (
                <>
                  <div>
                    <Label htmlFor="finalRating">Mức xếp loại cuối cùng</Label>
                    <Select 
                      value={approvalData.finalRating} 
                      onValueChange={(value) => setApprovalData(prev => ({ 
                        ...prev, 
                        finalRating: value as any 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXCELLENT">Xuất sắc</SelectItem>
                        <SelectItem value="GOOD">Khá</SelectItem>
                        <SelectItem value="AVERAGE">Trung bình</SelectItem>
                        <SelectItem value="POOR">Yếu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pointsAwarded">Điểm thưởng</Label>
                    <Input
                      id="pointsAwarded"
                      type="number"
                      min="0"
                      value={approvalData.pointsAwarded}
                      onChange={(e) => setApprovalData(prev => ({ 
                        ...prev, 
                        pointsAwarded: Number(e.target.value) 
                      }))}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="adminNotes">
                  {approvalData.action === 'APPROVE' ? 'Góp ý từ Admin' : 'Lý do từ chối *'}
                </Label>
                <Textarea
                  id="adminNotes"
                  value={approvalData.adminNotes}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder={approvalData.action === 'APPROVE' 
                    ? "Góp ý hoặc lời khen ngợi (tuỳ chọn)..."
                    : "Nêu rõ lý do từ chối để đoàn viên hiểu và cải thiện..."
                  }
                  rows={3}
                />
              </div>

              {approvalData.action === 'REJECT' && !approvalData.adminNotes.trim() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Vui lòng nêu rõ lý do từ chối để đoàn viên có thể cải thiện.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false)
                setSelectedRating(null)
                resetApprovalForm()
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleApproveRating}
              disabled={approvalData.action === 'REJECT' && !approvalData.adminNotes.trim()}
              className={approvalData.action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalData.action === 'APPROVE' ? 'Duyệt đánh giá' : 'Từ chối đánh giá'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

