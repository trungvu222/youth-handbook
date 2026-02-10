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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
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
  Trash2,
  Trophy
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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

interface RatingManagementProps {
  initialRatingFilter?: string | null;
}

// Pagination component - moved outside main component
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Trước
      </Button>
      
      {getPageNumbers().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2">...</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page as number)}
            className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {page}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau
      </Button>
    </div>
  );
}

export default function RatingManagement({ initialRatingFilter }: RatingManagementProps = {}) {
  const [activeTab, setActiveTab] = useState(initialRatingFilter ? 'list' : 'periods')
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
  
  // New states for list tab
  const [allRatings, setAllRatings] = useState<any[]>([])
  const [selectedPeriodForList, setSelectedPeriodForList] = useState<string>('')
  const [loadingAllRatings, setLoadingAllRatings] = useState(false)
  const [filterFinalRating, setFilterFinalRating] = useState<string>(initialRatingFilter || 'all')
  
  // New states for period-specific stats
  const [selectedPeriodForStats, setSelectedPeriodForStats] = useState<string>('')
  const [periodStats, setPeriodStats] = useState<any>(null)
  const [loadingPeriodStats, setLoadingPeriodStats] = useState(false)
  const [periodRatings, setPeriodRatings] = useState<any[]>([])
  const [loadingPeriodRatings, setLoadingPeriodRatings] = useState(false)
  
  // New state for all periods stats
  const [allPeriodsStats, setAllPeriodsStats] = useState<{ periodId: string; period: RatingPeriod; stats: any }[]>([])
  const [loadingAllStats, setLoadingAllStats] = useState(false)
  
  // New state for all periods ratings list
  const [allPeriodsRatings, setAllPeriodsRatings] = useState<{ periodId: string; period: RatingPeriod; ratings: any[] }[]>([])
  const [loadingAllPeriodsRatings, setLoadingAllPeriodsRatings] = useState(false)
  
  // Pagination states
  const [currentPagePeriods, setCurrentPagePeriods] = useState(1)
  const [currentPageApprovals, setCurrentPageApprovals] = useState(1)
  const [currentPageStats, setCurrentPageStats] = useState(1)
  const [currentPageList, setCurrentPageList] = useState(1)
  const itemsPerPage = 10

  // Handlers for edit and delete period
  const handleEditPeriod = (period: RatingPeriod) => {
    setSelectedPeriod(period)
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
      const response = await ratingApi.deletePeriod(showDeleteConfirm)
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa kỳ xếp loại'
        })
        setShowDeleteConfirm(null)
        
        // Reset pagination to page 1
        setCurrentPagePeriods(1)
        setCurrentPageList(1)
        setCurrentPageStats(1)
        
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể xóa kỳ xếp loại',
          variant: 'destructive'
        })
      }
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
    targetRating: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR',
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

  // Sync filter when prop changes
  useEffect(() => {
    if (initialRatingFilter) {
      setFilterFinalRating(initialRatingFilter)
      setActiveTab('list')
    }
  }, [initialRatingFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load rating periods
      const periodsResponse = await ratingApi.getRatingPeriods()
      let loadedPeriods: RatingPeriod[] = []
      if (periodsResponse.success && periodsResponse.data) {
        loadedPeriods = periodsResponse.data
        setPeriods(loadedPeriods)
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
      
      // Load stats for all periods
      if (loadedPeriods.length > 0) {
        loadAllPeriodsStats(loadedPeriods)
        loadAllPeriodsRatings(loadedPeriods)
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
  
  const loadAllPeriodsStats = async (periodsToLoad: RatingPeriod[]) => {
    try {
      setLoadingAllStats(true)
      
      // Load stats for each period in parallel
      const statsPromises = periodsToLoad.map(async (period) => {
        try {
          const response = await ratingApi.getPeriodStats(period.id)
          if (response.success && response.data) {
            return {
              periodId: period.id,
              period,
              stats: response.data
            }
          }
        } catch (error) {
          console.error(`Error loading stats for period ${period.id}:`, error)
        }
        return null
      })
      
      const results = await Promise.all(statsPromises)
      const validStats = results.filter(r => r !== null) as { periodId: string; period: RatingPeriod; stats: any }[]
      setAllPeriodsStats(validStats)
    } catch (error) {
      console.error('Error loading all periods stats:', error)
    } finally {
      setLoadingAllStats(false)
    }
  }
  
  const loadAllPeriodsRatings = async (periodsToLoad: RatingPeriod[]) => {
    try {
      setLoadingAllPeriodsRatings(true)
      
      // Load ratings for each period in parallel
      const ratingsPromises = periodsToLoad.map(async (period) => {
        try {
          const response = await ratingApi.getPeriodRatings(period.id)
          if (response.success && response.data && response.data.ratings) {
            return {
              periodId: period.id,
              period,
              ratings: response.data.ratings
            }
          }
        } catch (error) {
          console.error(`Error loading ratings for period ${period.id}:`, error)
        }
        return null
      })
      
      const results = await Promise.all(ratingsPromises)
      const validRatings = results.filter(r => r !== null) as { periodId: string; period: RatingPeriod; ratings: any[] }[]
      setAllPeriodsRatings(validRatings)
    } catch (error) {
      console.error('Error loading all periods ratings:', error)
    } finally {
      setLoadingAllPeriodsRatings(false)
    }
  }

  const loadAllRatings = async (periodId: string) => {
    if (!periodId) {
      setAllRatings([])
      return
    }

    try {
      setLoadingAllRatings(true)
      const response = await ratingApi.getPeriodAllRatings(periodId)
      if (response.success && response.data) {
        setAllRatings(response.data.ratings || [])
      }
    } catch (error) {
      console.error('Error loading all ratings:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách xếp loại',
        variant: 'destructive'
      })
    } finally {
      setLoadingAllRatings(false)
    }
  }

  const loadPeriodStats = async (periodId: string) => {
    if (!periodId) {
      setPeriodStats(null)
      setPeriodRatings([])
      return
    }

    try {
      setLoadingPeriodStats(true)
      setLoadingPeriodRatings(true)
      
      // Load both stats and detailed ratings
      const [statsResponse, ratingsResponse] = await Promise.all([
        ratingApi.getPeriodStats(periodId),
        ratingApi.getPeriodRatings(periodId)
      ])
      
      if (statsResponse.success && statsResponse.data) {
        setPeriodStats(statsResponse.data)
      }
      
      if (ratingsResponse.success && ratingsResponse.data) {
        setPeriodRatings(ratingsResponse.data.ratings || [])
      }
    } catch (error) {
      console.error('Error loading period stats:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thống kê',
        variant: 'destructive'
      })
    } finally {
      setLoadingPeriodStats(false)
      setLoadingPeriodRatings(false)
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

    if (!formData.targetRating) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn xếp loại mục tiêu',
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
        targetRating: formData.targetRating,
        targetAudience: 'ALL' as const
      }

      const response = selectedPeriod 
        ? await ratingApi.updateRatingPeriod(selectedPeriod.id, periodData)
        : await ratingApi.createRatingPeriod(periodData)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: selectedPeriod ? 'Đã cập nhật kỳ xếp loại' : 'Đã tạo kỳ xếp loại mới'
        })
        setShowCreateDialog(false)
        resetForm()
        
        // Reset pagination to page 1
        setCurrentPagePeriods(1)
        setCurrentPageList(1)
        setCurrentPageStats(1)
        
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || (selectedPeriod ? 'Không thể cập nhật kỳ xếp loại' : 'Không thể tạo kỳ xếp loại'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving rating period:', error)
      toast({
        title: 'Lỗi',
        description: selectedPeriod ? 'Không thể cập nhật kỳ xếp loại' : 'Không thể tạo kỳ xếp loại',
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
        
        // Reset pagination to page 1 for all tabs
        setCurrentPageApprovals(1)
        setCurrentPageList(1)
        setCurrentPageStats(1)
        
        // Reload all data including stats and list tabs
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
      console.log('[Rating] Sending reminder for period:', periodId)
      const response = await ratingApi.sendRatingReminder(periodId)
      console.log('[Rating] Reminder response:', response)

      if (response.success) {
        console.log('[Rating] Showing success toast')
        toast({
          title: '✅ Gửi thành công',
          description: 'Đã gửi thông báo đến tất cả đoàn viên',
          duration: 3000,
          className: 'bg-green-50 border-green-500 text-green-900'
        })
      } else {
        console.log('[Rating] Showing error toast')
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
      targetRating: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR',
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
      case 'EXCELLENT': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'GOOD': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'AVERAGE': return 'bg-green-100 text-green-800 border-green-300'
      case 'POOR': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'Xuất sắc'
      case 'GOOD': return 'Tốt'
      case 'AVERAGE': return 'Đạt'
      case 'POOR': return 'Không đạt'
      default: return rating
    }
  }

  const getRatingFullLabel = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'Hoàn thành xuất sắc nhiệm vụ'
      case 'GOOD': return 'Hoàn thành tốt nhiệm vụ'
      case 'AVERAGE': return 'Hoàn thành nhiệm vụ'
      case 'POOR': return 'Không hoàn thành nhiệm vụ'
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
  
  // Pagination calculations
  const totalPagesPeriods = Math.ceil(filteredPeriods.length / itemsPerPage)
  const paginatedPeriods = filteredPeriods.slice(
    (currentPagePeriods - 1) * itemsPerPage,
    currentPagePeriods * itemsPerPage
  )
  
  const totalPagesApprovals = Math.ceil(pendingRatings.length / itemsPerPage)
  const paginatedApprovals = pendingRatings.slice(
    (currentPageApprovals - 1) * itemsPerPage,
    currentPageApprovals * itemsPerPage
  )
  
  const totalPagesStats = Math.ceil(allPeriodsStats.length / itemsPerPage)
  const paginatedStats = allPeriodsStats.slice(
    (currentPageStats - 1) * itemsPerPage,
    currentPageStats * itemsPerPage
  )
  
  const totalPagesList = Math.ceil(allPeriodsRatings.length / itemsPerPage)
  const paginatedList = allPeriodsRatings.slice(
    (currentPageList - 1) * itemsPerPage,
    currentPageList * itemsPerPage
  )
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header - Modern Gradient Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Quản lý xếp loại chất lượng
              </h1>
            </div>
            <p className="text-indigo-100 text-base ml-14 font-medium">
              Tạo kỳ xếp loại, duyệt đánh giá và theo dõi tiến độ
            </p>
          </div>

          <Button 
            onClick={() => {
              setSelectedPeriod(null)
              setFormData({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                criteria: [{ name: '', description: '', isRequired: true }]
              })
              setShowCreateDialog(true)
            }}
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-bold px-6 py-6 text-base rounded-2xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tạo kỳ xếp loại
          </Button>
        </div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-gray-100">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2 p-0">
            <TabsTrigger 
              value="periods" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-4 font-semibold"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Kỳ xếp loại <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{periods.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-4 font-semibold"
            >
              <Users className="h-4 w-4 mr-2" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger 
              value="approvals" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-4 font-semibold"
            >
              <Clock className="h-4 w-4 mr-2" />
              Chờ duyệt <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{pendingRatings.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-4 font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Thống kê
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="periods" className="space-y-6">
          {/* Search Bar - Enhanced Design */}
          <div className="relative max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="relative flex items-center">
                <div className="absolute left-5 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-300" />
                </div>
                <Input
                  placeholder="Tìm kiếm kỳ xếp loại..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPagePeriods(1) }}
                  className="pl-14 pr-6 py-7 text-base rounded-2xl border-2 border-gray-200 focus:border-transparent focus:ring-4 focus:ring-indigo-500/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm font-medium placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setCurrentPagePeriods(1) }}
                    className="absolute right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Periods List */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 shadow-lg"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-xl animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : filteredPeriods.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                <div className="relative py-20 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-xl">
                      <Calendar className="h-12 w-12 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2">Chưa có kỳ xếp loại nào</p>
                  <p className="text-sm text-gray-500">Bấm <span className="font-semibold text-indigo-600">"Tạo kỳ xếp loại"</span> để bắt đầu</p>
                </div>
              </div>
            ) : (
              paginatedPeriods.map(period => {
                const isActive = period.status === 'ACTIVE'
                const isCompleted = period.status === 'COMPLETED'
                const isDraft = period.status === 'DRAFT'
                
                const borderColor = isActive ? 'border-l-green-500' : isCompleted ? 'border-l-blue-500' : isDraft ? 'border-l-amber-400' : 'border-l-gray-400'
                const statusBg = isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : isCompleted ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : isDraft ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                const glowColor = isActive ? 'shadow-green-500/20' : isCompleted ? 'shadow-blue-500/20' : isDraft ? 'shadow-amber-500/20' : 'shadow-gray-500/20'
                
                return (
                  <div key={period.id} className="group relative">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${isActive ? 'from-green-400 to-emerald-500' : isCompleted ? 'from-blue-400 to-indigo-500' : isDraft ? 'from-amber-400 to-orange-500' : 'from-gray-400 to-gray-500'} rounded-2xl opacity-20 group-hover:opacity-40 blur transition-all duration-300`}></div>
                    <Card className={`relative border-l-4 ${borderColor} hover:shadow-2xl ${glowColor} transition-all duration-300 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm hover:-translate-y-1`}>
                      <CardContent className="p-0">
                      <div className="flex">
                        {/* Main Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`${statusBg} text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5`}>
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-white/70'}`}></span>
                              {isActive ? 'Đang diễn ra' : isCompleted ? 'Đã kết thúc' : isDraft ? 'Dự thảo' : 'Đã hủy'}
                            </span>
                            {period.pendingApprovals && period.pendingApprovals > 0 && (
                              <span className="relative inline-flex">
                                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                                  {period.pendingApprovals} chờ duyệt
                                </span>
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                </span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-2xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                            {period.title}
                          </h3>

                          {period.description && (
                            <p className="text-gray-600 mb-5 line-clamp-2 text-sm leading-relaxed">
                              {period.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-2.5 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-900">
                                {new Date(period.startDate).toLocaleDateString('vi-VN')} → {new Date(period.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </span>
                            <span className="flex items-center gap-2.5 text-sm bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl border border-purple-100 shadow-sm">
                              <Trophy className="h-4 w-4 text-purple-600" />
                              <span className="font-semibold text-purple-900">{period.criteria?.length || 0} tiêu chí</span>
                            </span>
                            {period.totalSubmissions !== undefined && period.totalSubmissions !== null && (
                              <span className="flex items-center gap-2.5 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                                <Users className="h-4 w-4 text-emerald-600" />
                                <span className="font-semibold text-emerald-900">{period.totalSubmissions} đã gửi</span>
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Tạo bởi <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{period.author.fullName}</span>
                            </span>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="flex flex-col items-center justify-center gap-3 px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-100/50 border-l border-gray-200">
                          {period.status === 'ACTIVE' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSendReminder(period.id)}
                              className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-xs px-4 py-2.5 h-auto whitespace-nowrap rounded-xl font-bold overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <Send className="h-4 w-4 mr-2 relative z-10" />
                              <span className="relative z-10">Gửi thông báo</span>
                            </Button>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPeriod(period)}
                              className="h-10 w-10 p-0 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePeriod(period.id)}
                              className="h-10 w-10 p-0 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-200 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                )
              })
            )}
          </div>
          
          {/* Pagination */}
          <Pagination 
            currentPage={currentPagePeriods} 
            totalPages={totalPagesPeriods} 
            onPageChange={setCurrentPagePeriods}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* All Periods Ratings */}
          {loadingAllPeriodsRatings ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600 shadow-lg"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 opacity-20 blur-xl animate-pulse"></div>
                </div>
                <p className="text-gray-600 font-semibold text-lg">Đang tải danh sách...</p>
              </div>
            </div>
          ) : allPeriodsRatings.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5"></div>
              <div className="relative py-20 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shadow-xl">
                    <Users className="h-12 w-12 text-pink-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">Chưa có dữ liệu xếp loại</p>
                <p className="text-sm text-gray-500">Hãy tạo kỳ xếp loại và duyệt đánh giá</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {paginatedList.map((periodData, periodIndex) => {
                const { period, ratings } = periodData
                
                return (
                  <div key={period.id} className="space-y-4">
                    {/* Period Header */}
                    <Card className="border-2 border-blue-200 shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{period.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-3xl font-bold text-blue-600">{ratings.length}</div>
                              <div className="text-xs text-muted-foreground">Đoàn viên</div>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              period.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                              period.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {period.status === 'ACTIVE' ? 'Đang diễn ra' : 
                               period.status === 'COMPLETED' ? 'Đã kết thúc' : 
                               'Nháp'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Ratings Table */}
                    {ratings.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>Chưa có đoàn viên nào được xếp loại trong kỳ này</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-xl border-0 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 text-white py-5">
                          <CardTitle className="flex items-center gap-3 text-lg font-bold">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              <Users className="h-5 w-5" />
                            </div>
                            Danh sách xếp loại
                          </CardTitle>
                          <CardDescription className="text-blue-50 font-medium mt-2">
                            Tổng {ratings.length} đoàn viên đã được xếp loại
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">STT</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Họ và tên</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cấp bậc</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chức vụ</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chi đoàn</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[140px]">Xếp loại</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ratings.map((rating, index) => {
                                  const getRatingLabelShort = (rating: string) => {
                                    switch (rating) {
                                      case 'EXCELLENT': return 'Xuất sắc'
                                      case 'GOOD': return 'Tốt'
                                      case 'AVERAGE': return 'Đạt'
                                      case 'POOR': return 'Không đạt'
                                      default: return ''
                                    }
                                  }
                                  
                                  const getRatingColorBadge = (rating: string) => {
                                    switch (rating) {
                                      case 'EXCELLENT': return 'bg-purple-100 text-purple-800 border-purple-300'
                                      case 'GOOD': return 'bg-blue-100 text-blue-800 border-blue-300'
                                      case 'AVERAGE': return 'bg-green-100 text-green-800 border-green-300'
                                      case 'POOR': return 'bg-red-100 text-red-800 border-red-300'
                                      default: return 'bg-gray-100 text-gray-800 border-gray-300'
                                    }
                                  }

                                  const getRatingIcon = (rating: string) => {
                                    switch (rating) {
                                      case 'EXCELLENT': return '⭐'
                                      case 'GOOD': return '✓'
                                      case 'AVERAGE': return '•'
                                      case 'POOR': return '✗'
                                      default: return ''
                                    }
                                  }
                                  
                                  return (
                                    <tr key={rating.id} className={`border-b hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                      <td className="px-4 py-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                          {index + 1}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="font-semibold text-gray-900">{rating.fullName}</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{rating.militaryRank || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{rating.youthPosition || 'Đoàn viên'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{rating.unitName || '-'}</td>
                                      <td className="px-4 py-3">
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm whitespace-nowrap ${getRatingColorBadge(rating.finalRating)}`}>
                                          <span className="mr-1">{getRatingIcon(rating.finalRating)}</span>
                                          {getRatingLabelShort(rating.finalRating)}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Table Footer */}
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex justify-between items-center text-sm">
                              <div className="text-muted-foreground">
                                Tổng cộng: <span className="font-semibold text-gray-900">{ratings.length}</span> đoàn viên
                              </div>
                              <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">⭐</span>
                                  <span className="font-medium">{ratings.filter(r => r.finalRating === 'EXCELLENT').length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">✓</span>
                                  <span className="font-medium">{ratings.filter(r => r.finalRating === 'GOOD').length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">•</span>
                                  <span className="font-medium">{ratings.filter(r => r.finalRating === 'AVERAGE').length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">✗</span>
                                  <span className="font-medium">{ratings.filter(r => r.finalRating === 'POOR').length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Divider between periods */}
                    {periodIndex < paginatedList.length - 1 && (
                      <div className="border-t-2 border-dashed border-gray-300 my-8"></div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Pagination */}
          <Pagination 
            currentPage={currentPageList} 
            totalPages={totalPagesList} 
            onPageChange={setCurrentPageList}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          {/* Header - Modern Design */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  Đánh giá chờ duyệt
                </h2>
              </div>
              <p className="text-white/90 text-sm ml-11 font-medium">
                {pendingRatings.length > 0 
                  ? `Có ${pendingRatings.length} đánh giá đang chờ xem xét`
                  : 'Tất cả đánh giá đã được xử lý'}
              </p>
            </div>
          </div>

          {/* Pending Ratings */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 shadow-lg"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 opacity-20 blur-xl animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : pendingRatings.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50/50">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                <div className="relative py-20 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-xl">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-700 mb-2">Tất cả đã được xử lý!</p>
                  <p className="text-sm text-green-600">Không có đánh giá nào chờ duyệt</p>
                </div>
              </div>
            ) : (
              paginatedApprovals.map((rating, ratingIndex) => {
                const suggestedColor = rating.suggestedRating === 'EXCELLENT' ? 'from-purple-500 to-indigo-600' :
                  rating.suggestedRating === 'GOOD' ? 'from-blue-500 to-cyan-600' :
                  rating.suggestedRating === 'AVERAGE' ? 'from-green-500 to-emerald-600' :
                  'from-red-500 to-rose-600'
                
                const suggestedBg = rating.suggestedRating === 'EXCELLENT' ? 'bg-purple-100 text-purple-800' :
                  rating.suggestedRating === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                  rating.suggestedRating === 'AVERAGE' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                
                const suggestedIcon = rating.suggestedRating === 'EXCELLENT' ? '⭐' :
                  rating.suggestedRating === 'GOOD' ? '👍' :
                  rating.suggestedRating === 'AVERAGE' ? '📝' : '⚠️'
                
                return (
                  <div key={rating.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-all duration-300"></div>
                    <Card className="relative border-l-4 border-l-orange-500 hover:shadow-2xl shadow-orange-500/10 transition-all duration-300 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm hover:-translate-y-1">
                      <CardContent className="p-0">
                        <div className="flex">
                        {/* User Avatar & Number */}
                        <div className="flex flex-col items-center justify-center px-5 py-6 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-100">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${suggestedColor} text-white flex items-center justify-center text-lg font-bold shadow-lg`}>
                            {rating.user.fullName.charAt(0)}
                          </div>
                          <span className="text-xs text-gray-400 mt-2 font-medium">#{(currentPageApprovals - 1) * itemsPerPage + ratingIndex + 1}</span>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Name & Badge Row */}
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300">
                                  {rating.user.fullName}
                                </h3>
                                <span className={`${suggestedBg} text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm`}>
                                  <span className="text-base">{suggestedIcon}</span>
                                  <span>{getRatingLabel(rating.suggestedRating)}</span>
                                </span>
                              </div>

                              {/* Period Title */}
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-lg bg-indigo-100">
                                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                                <span className="text-sm text-gray-700 font-semibold">{rating.period.title}</span>
                              </div>

                              {/* Self Assessment */}
                              {rating.selfAssessment && (
                                <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-200 shadow-sm">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
                                  <div className="relative">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="text-base">💬</div>
                                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">Tự đánh giá</div>
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                      {rating.selfAssessment}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-2 text-xs bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="font-semibold text-gray-700">{new Date(rating.submittedAt || rating.createdAt).toLocaleDateString('vi-VN')}</span>
                                </span>
                                {rating.user.unitName && (
                                  <span className="flex items-center gap-2 text-xs bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-xl border border-purple-200 shadow-sm">
                                    <Users className="h-3.5 w-3.5 text-purple-600" />
                                    <span className="font-semibold text-purple-900">{rating.user.unitName}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
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
                              className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm px-6 py-3 h-auto rounded-2xl whitespace-nowrap font-bold overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <Eye className="h-4 w-4 mr-2 relative z-10" />
                              <span className="relative z-10">Xem & Duyệt</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
            )}
          </div>
          
          {/* Pagination */}
          <Pagination 
            currentPage={currentPageApprovals} 
            totalPages={totalPagesApprovals} 
            onPageChange={setCurrentPageApprovals}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Stats Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-6 px-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              Thống kê xếp loại chất lượng đoàn viên
            </div>
            <p className="text-indigo-50 font-medium mt-2 ml-[52px]">
              Tổng quan về kết quả xếp loại đoàn viên theo từng kỳ
            </p>
          </div>

          {/* All Periods Statistics */}
          {loadingAllStats ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Đang tải thống kê...</p>
              </div>
            </div>
          ) : allPeriodsStats.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Chưa có dữ liệu thống kê</p>
                  <p className="text-sm mt-2">Hãy tạo kỳ xếp loại và duyệt đánh giá để xem thống kê</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {paginatedStats.map((periodData, periodIndex) => {
                const { period, stats } = periodData
                
                return (
                  <div key={period.id} className="space-y-4">
                    {/* Period Title */}
                    <Card className="border-2 border-indigo-200 shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                              <Calendar className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{period.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            period.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                            period.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {period.status === 'ACTIVE' ? 'Đang diễn ra' : 
                             period.status === 'COMPLETED' ? 'Đã kết thúc' : 
                             'Nháp'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90"></div>
                        <CardContent className="relative p-5 text-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Send className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-extrabold drop-shadow-lg">{stats.totalSubmissions || 0}</div>
                              <div className="text-xs font-semibold text-white/90 uppercase">Đoàn viên</div>
                            </div>
                          </div>
                          <div className="font-bold text-base">Tổng đã gửi</div>
                        </CardContent>
                      </Card>

                      <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 opacity-90"></div>
                        <CardContent className="relative p-5 text-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-extrabold drop-shadow-lg">{stats.totalApproved || 0}</div>
                              <div className="text-xs font-semibold text-white/90 uppercase">Đoàn viên</div>
                            </div>
                          </div>
                          <div className="font-bold text-base">Đã duyệt</div>
                        </CardContent>
                      </Card>

                      <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-90"></div>
                        <CardContent className="relative p-5 text-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Clock className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-extrabold drop-shadow-lg">{stats.pendingApprovals || 0}</div>
                              <div className="text-xs font-semibold text-white/90 uppercase">Đoàn viên</div>
                            </div>
                          </div>
                          <div className="font-bold text-base">Chờ duyệt</div>
                        </CardContent>
                      </Card>

                      <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 opacity-90"></div>
                        <CardContent className="relative p-5 text-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Trophy className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-extrabold drop-shadow-lg">{Math.round((stats.avgPoints || 0) * 100) / 100}</div>
                              <div className="text-xs font-semibold text-white/90 uppercase">Điểm</div>
                            </div>
                          </div>
                          <div className="font-bold text-base">Điểm trung bình</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Distribution Chart */}
                    <Card className="shadow-xl border-0 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white py-5">
                        <CardTitle className="flex items-center gap-3 text-lg font-bold">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          Phân bố xếp loại
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Excellent */}
                          <Card className="relative border-0 shadow-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 opacity-90"></div>
                            <CardContent className="relative p-5 text-white">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">⭐</span>
                                <div className="text-right">
                                  <div className="text-3xl font-extrabold">{stats.distribution?.EXCELLENT || 0}</div>
                                  <div className="text-xs text-white/80">
                                    {stats.totalApproved > 0 ? Math.round((stats.distribution?.EXCELLENT || 0) / stats.totalApproved * 100) : 0}%
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold text-sm">Xuất sắc</div>
                              <div className="text-xs text-white/80 mt-1">Hoàn thành xuất sắc nhiệm vụ</div>
                              <div className="mt-3 w-full bg-white/30 rounded-full h-2">
                                <div 
                                  className="bg-white h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.totalApproved > 0 ? ((stats.distribution?.EXCELLENT || 0) / stats.totalApproved * 100) : 0}%` }}
                                ></div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Good */}
                          <Card className="relative border-0 shadow-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90"></div>
                            <CardContent className="relative p-5 text-white">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">✓</span>
                                <div className="text-right">
                                  <div className="text-3xl font-extrabold">{stats.distribution?.GOOD || 0}</div>
                                  <div className="text-xs text-white/80">
                                    {stats.totalApproved > 0 ? Math.round((stats.distribution?.GOOD || 0) / stats.totalApproved * 100) : 0}%
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold text-sm">Tốt</div>
                              <div className="text-xs text-white/80 mt-1">Hoàn thành tốt nhiệm vụ</div>
                              <div className="mt-3 w-full bg-white/30 rounded-full h-2">
                                <div 
                                  className="bg-white h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.totalApproved > 0 ? ((stats.distribution?.GOOD || 0) / stats.totalApproved * 100) : 0}%` }}
                                ></div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Average */}
                          <Card className="relative border-0 shadow-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 opacity-90"></div>
                            <CardContent className="relative p-5 text-white">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">•</span>
                                <div className="text-right">
                                  <div className="text-3xl font-extrabold">{stats.distribution?.AVERAGE || 0}</div>
                                  <div className="text-xs text-white/80">
                                    {stats.totalApproved > 0 ? Math.round((stats.distribution?.AVERAGE || 0) / stats.totalApproved * 100) : 0}%
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold text-sm">Đạt</div>
                              <div className="text-xs text-white/80 mt-1">Hoàn thành nhiệm vụ</div>
                              <div className="mt-3 w-full bg-white/30 rounded-full h-2">
                                <div 
                                  className="bg-white h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.totalApproved > 0 ? ((stats.distribution?.AVERAGE || 0) / stats.totalApproved * 100) : 0}%` }}
                                ></div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Poor */}
                          <Card className="relative border-0 shadow-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 opacity-90"></div>
                            <CardContent className="relative p-5 text-white">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">✗</span>
                                <div className="text-right">
                                  <div className="text-3xl font-extrabold">{stats.distribution?.POOR || 0}</div>
                                  <div className="text-xs text-white/80">
                                    {stats.totalApproved > 0 ? Math.round((stats.distribution?.POOR || 0) / stats.totalApproved * 100) : 0}%
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold text-sm">Không đạt</div>
                              <div className="text-xs text-white/80 mt-1">Không hoàn thành nhiệm vụ</div>
                              <div className="mt-3 w-full bg-white/30 rounded-full h-2">
                                <div 
                                  className="bg-white h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.totalApproved > 0 ? ((stats.distribution?.POOR || 0) / stats.totalApproved * 100) : 0}%` }}
                                ></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Divider between periods */}
                    {periodIndex < paginatedStats.length - 1 && (
                      <div className="border-t-2 border-dashed border-gray-300 my-8"></div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Pagination */}
          <Pagination 
            currentPage={currentPageStats} 
            totalPages={totalPagesStats} 
            onPageChange={setCurrentPageStats}
          />
        </TabsContent>
      </Tabs>

      {/* Create Period Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) setSelectedPeriod(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPeriod ? 'Chỉnh sửa kỳ xếp loại' : 'Tạo kỳ xếp loại mới'}</DialogTitle>
            <DialogDescription>
              {selectedPeriod ? 'Cập nhật thông tin và tiêu chí cho kỳ xếp loại' : 'Thiết lập thông tin và tiêu chí cho kỳ xếp loại'}
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

            {/* Target Rating Selection */}
            <div>
              <Label>Xếp loại mục tiêu *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Chọn xếp loại mục tiêu cho kỳ đánh giá này. Đoàn viên sẽ nhận được thông báo về xếp loại mục tiêu.
              </p>
              <RadioGroup value={formData.targetRating} onValueChange={(value) => setFormData(prev => ({ ...prev, targetRating: value as any }))}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-purple-200 hover:bg-purple-50 cursor-pointer">
                    <RadioGroupItem value="EXCELLENT" id="target-rating-excellent" />
                    <Label htmlFor="target-rating-excellent" className="flex-1 cursor-pointer font-medium">
                      Hoàn thành xuất sắc nhiệm vụ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-blue-200 hover:bg-blue-50 cursor-pointer">
                    <RadioGroupItem value="GOOD" id="target-rating-good" />
                    <Label htmlFor="target-rating-good" className="flex-1 cursor-pointer font-medium">
                      Hoàn thành tốt nhiệm vụ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-green-200 hover:bg-green-50 cursor-pointer">
                    <RadioGroupItem value="AVERAGE" id="target-rating-average" />
                    <Label htmlFor="target-rating-average" className="flex-1 cursor-pointer font-medium">
                      Hoàn thành nhiệm vụ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-red-300 hover:bg-red-50 cursor-pointer">
                    <RadioGroupItem value="POOR" id="target-rating-poor" />
                    <Label htmlFor="target-rating-poor" className="flex-1 cursor-pointer font-medium">
                      Không hoàn thành nhiệm vụ
                    </Label>
                  </div>
                </div>
              </RadioGroup>
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
              {selectedPeriod ? 'Lưu thay đổi' : 'Tạo kỳ xếp loại'}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa kỳ xếp loại này? Tất cả dữ liệu đánh giá liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePeriod}
            >
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

