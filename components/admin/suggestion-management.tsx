'use client'

import { useState, useEffect } from 'react'
import { suggestionApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Checkbox } from '../ui/checkbox'
import { 
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Send,
  Eye,
  User,
  Calendar,
  FileText,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '../ui/toaster'

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'IMPROVEMENT' | 'COMPLAINT' | 'IDEA' | 'QUESTION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  isAnonymous: boolean;
  userId?: string;
  submittedAt: string;
  resolvedAt?: string;
  user?: {
    id: string;
    fullName: string;
    unitName?: string;
  };
  responses?: any[];
  viewCount: number;
}

export default function SuggestionManagement() {
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendingResponse, setSendingResponse] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  
  // Response form state
  const [responseData, setResponseData] = useState({
    content: '',
    isPublic: true,
    newStatus: 'UNDER_REVIEW' as 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
    sendNotification: true
  })

  useEffect(() => {
    loadData()
  }, [searchTerm, categoryFilter, statusFilter, priorityFilter, dateFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Build search params
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (dateFilter !== 'all') {
        const now = new Date()
        switch (dateFilter) {
          case 'today':
            params.dateFrom = new Date(now.setHours(0,0,0,0)).toISOString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            params.dateFrom = weekAgo.toISOString()
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            params.dateFrom = monthAgo.toISOString()
            break
        }
      }
      params.limit = 50

      // Load suggestions
      const suggestionsResponse = await suggestionApi.getAllSuggestions(params)
      if (suggestionsResponse.success && suggestionsResponse.data) {
        setSuggestions(suggestionsResponse.data.data || suggestionsResponse.data)
      }

      // Load stats
      const statsResponse = await suggestionApi.getSuggestionStats()
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

    } catch (error) {
      console.error('Error loading suggestion management data:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu quản lý kiến nghị',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async () => {
    if (!selectedSuggestion || !responseData.content.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung phản hồi',
        variant: 'destructive'
      })
      return
    }

    console.log('📝 Responding to suggestion:', selectedSuggestion.id)
    console.log('📝 Response data:', responseData)

    setSendingResponse(true)
    try {
      const response = await suggestionApi.respondToSuggestion(selectedSuggestion.id, responseData)

      console.log('📥 Response result:', response)

      if (response.success) {
        // Get status label
        const statusLabels: Record<string, string> = {
          'UNDER_REVIEW': 'Đang xem xét',
          'IN_PROGRESS': 'Đang xử lý',
          'RESOLVED': 'Đã giải quyết',
          'REJECTED': 'Bị từ chối'
        }
        const statusLabel = statusLabels[responseData.newStatus] || responseData.newStatus
        const notifSent = response.notificationSent || 0
        
        // Show success toast
        toast({
          title: 'Gửi phản hồi thành công',
          description: notifSent > 0 
            ? `Đã gửi thông báo đến ${notifSent} người dùng. Trạng thái: ${statusLabel}`
            : `Đã cập nhật trạng thái: ${statusLabel}`,
          variant: 'success' as any,
          duration: 4000
        })
        
        // Close dialog and reload
        setShowResponseDialog(false)
        setSelectedSuggestion(null)
        resetResponseForm()
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi phản hồi',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Error responding to suggestion:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi phản hồi',
        variant: 'destructive'
      })
    } finally {
      setSendingResponse(false)
    }
  }

  const handleUpdateStatus = async (suggestionId: string, newStatus: string) => {
    try {
      const response = await suggestionApi.updateSuggestionStatus(suggestionId, newStatus)

      if (response.success) {
        const statusLabels: Record<string, string> = {
          'UNDER_REVIEW': 'Đang xem xét',
          'IN_PROGRESS': 'Đang xử lý',
          'RESOLVED': 'Đã giải quyết',
          'REJECTED': 'Bị từ chối'
        }
        const statusLabel = statusLabels[newStatus] || newStatus
        const notifSent = (response as any).notificationSent || 0
        
        toast({
          title: 'Cập nhật trạng thái thành công',
          description: notifSent > 0 
            ? `Đã gửi thông báo đến ${notifSent} người dùng. Trạng thái: ${statusLabel}`
            : `Đã cập nhật trạng thái: ${statusLabel}`,
          variant: 'success' as any,
          duration: 4000
        })
        loadData()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể cập nhật trạng thái',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive'
      })
    }
  }

  const resetResponseForm = () => {
    setResponseData({
      content: '',
      isPublic: true,
      newStatus: 'UNDER_REVIEW',
      sendNotification: true
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return 'bg-blue-100 text-blue-800'
      case 'COMPLAINT': return 'bg-red-100 text-red-800'
      case 'IDEA': return 'bg-green-100 text-green-800'
      case 'QUESTION': return 'bg-yellow-100 text-yellow-800'
      case 'OTHER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return 'Cải tiến'
      case 'COMPLAINT': return 'Phản ánh'
      case 'IDEA': return 'Ý tưởng'
      case 'QUESTION': return 'Thắc mắc'
      case 'OTHER': return 'Khác'
      default: return category
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-gray-100 text-gray-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Clock className="h-3 w-3" />
      case 'UNDER_REVIEW': return <Eye className="h-3 w-3" />
      case 'IN_PROGRESS': return <AlertTriangle className="h-3 w-3" />
      case 'RESOLVED': return <CheckCircle className="h-3 w-3" />
      case 'REJECTED': return <XCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Đã gửi'
      case 'UNDER_REVIEW': return 'Đang xem xét'
      case 'IN_PROGRESS': return 'Đang xử lý'
      case 'RESOLVED': return 'Đã giải quyết'
      case 'REJECTED': return 'Bị từ chối'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Khẩn cấp'
      case 'HIGH': return 'Cao'
      case 'MEDIUM': return 'Trung bình'
      case 'LOW': return 'Thấp'
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate counts for each tab
  const pendingCount = suggestions.filter(s => ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status)).length
  const processingCount = suggestions.filter(s => s.status === 'IN_PROGRESS').length
  const completedCount = suggestions.filter(s => ['RESOLVED', 'REJECTED'].includes(s.status)).length

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (activeTab === 'pending') {
      return ['SUBMITTED', 'UNDER_REVIEW'].includes(suggestion.status)
    } else if (activeTab === 'processing') {
      return suggestion.status === 'IN_PROGRESS'
    } else if (activeTab === 'completed') {
      return ['RESOLVED', 'REJECTED'].includes(suggestion.status)
    }
    return true
  })

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header - Modern Design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Quản lý kiến nghị</h1>
          </div>
          <p className="text-blue-100 ml-14">
            Xem, phản hồi và theo dõi tiến độ xử lý kiến nghị từ đoàn viên
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 p-1 bg-gray-100/80 rounded-xl h-auto">
          <TabsTrigger value="all" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Tất cả</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">{suggestions.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Chờ xử lý</span>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{pendingCount}</span>
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Đang xử lý</span>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">{processingCount}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Đã xong</span>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">{completedCount}</span>
          </TabsTrigger>
        </TabsList>

        {/* Filters - Modern Style */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm kiến nghị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              <SelectItem value="IMPROVEMENT">Cải tiến</SelectItem>
              <SelectItem value="COMPLAINT">Phản ánh</SelectItem>
              <SelectItem value="IDEA">Ý tưởng</SelectItem>
              <SelectItem value="QUESTION">Thắc mắc</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-50 border-gray-200 hover:bg-white transition-colors">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="SUBMITTED">Đã gửi</SelectItem>
              <SelectItem value="UNDER_REVIEW">Đang xem xét</SelectItem>
              <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="bg-gray-50 border-gray-200 hover:bg-white transition-colors">
              <SelectValue placeholder="Ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức độ</SelectItem>
              <SelectItem value="URGENT">Khẩn cấp</SelectItem>
              <SelectItem value="HIGH">Cao</SelectItem>
              <SelectItem value="MEDIUM">Trung bình</SelectItem>
              <SelectItem value="LOW">Thấp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="bg-gray-50 border-gray-200 hover:bg-white transition-colors">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics - Modern Design */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Tổng kiến nghị */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300/20 rounded-full -ml-8 -mb-8" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-800">Tổng kiến nghị</span>
                  <div className="p-2.5 bg-blue-500/15 rounded-xl backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-1">{stats.total || 0}</div>
                <p className="text-xs text-blue-600/70">Tổng số đã nhận</p>
              </CardContent>
            </Card>

            {/* Chờ xử lý */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-300/20 rounded-full -ml-8 -mb-8" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-amber-800">Chờ xử lý</span>
                  <div className="p-2.5 bg-amber-500/15 rounded-xl backdrop-blur-sm">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-700 mb-1">{stats.pending || 0}</div>
                <p className="text-xs text-amber-600/70">Đang chờ phản hồi</p>
              </CardContent>
            </Card>

            {/* Đang xử lý */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-300/20 rounded-full -ml-8 -mb-8" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-orange-800">Đang xử lý</span>
                  <div className="p-2.5 bg-orange-500/15 rounded-xl backdrop-blur-sm">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-orange-700 mb-1">{stats.inProgress || 0}</div>
                <p className="text-xs text-orange-600/70">Đang tiến hành</p>
              </CardContent>
            </Card>

            {/* Đã giải quyết */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-300/20 rounded-full -ml-8 -mb-8" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-800">Đã giải quyết</span>
                  <div className="p-2.5 bg-green-500/15 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-700 mb-1">{stats.resolved || 0}</div>
                <p className="text-xs text-green-600/70">Hoàn thành xử lý</p>
              </CardContent>
            </Card>

            {/* Tỷ lệ hoàn thành */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-300/20 rounded-full -ml-8 -mb-8" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-800">Tỷ lệ hoàn thành</span>
                  <div className="p-2.5 bg-purple-500/15 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-1">
                  {Math.round((stats.resolved / (stats.total || 1)) * 100)}%
                </div>
                <p className="text-xs text-purple-600/70">Hiệu suất xử lý</p>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value="all" className="space-y-4">
          {/* Suggestions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Không có kiến nghị nào</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Hiện tại không có kiến nghị nào phù hợp với bộ lọc của bạn. Hãy thử thay đổi điều kiện tìm kiếm.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-l-4 border-l-transparent hover:border-l-blue-500 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${getCategoryColor(suggestion.category)} shadow-sm`}>
                            {getCategoryLabel(suggestion.category)}
                          </Badge>

                          <Badge className={`${getStatusColor(suggestion.status)} shadow-sm`}>
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusLabel(suggestion.status)}</span>
                          </Badge>

                          <Badge 
                            variant="outline" 
                            className={`${getPriorityColor(suggestion.priority)} shadow-sm`}
                          >
                            {getPriorityLabel(suggestion.priority)}
                          </Badge>

                          {suggestion.isAnonymous && (
                            <Badge variant="secondary" className="text-xs shadow-sm">
                              Ẩn danh
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-blue-700 transition-colors">
                          {suggestion.title}
                        </h3>

                        {/* Content preview */}
                        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {suggestion.content}
                        </p>

                        {/* Meta info with icons */}
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                          <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(suggestion.submittedAt)}
                          </span>

                          {!suggestion.isAnonymous && suggestion.user && (
                            <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                              <User className="h-3.5 w-3.5" />
                              {suggestion.user.fullName}
                              {suggestion.user.unitName && <span className="text-gray-400">({suggestion.user.unitName})</span>}
                            </span>
                          )}

                          {suggestion.responses && suggestion.responses.length > 0 && (
                            <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {suggestion.responses.length} phản hồi
                            </span>
                          )}

                          <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Eye className="h-3.5 w-3.5" />
                            {suggestion.viewCount} lượt xem
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-3">
                        {/* Status Update */}
                        <Select
                          value={suggestion.status}
                          onValueChange={(value) => handleUpdateStatus(suggestion.id, value)}
                        >
                          <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUBMITTED">Đã gửi</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Đang xem xét</SelectItem>
                            <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                            <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                            <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all"
                          onClick={() => {
                            setSelectedSuggestion(suggestion)
                            setShowResponseDialog(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Phản hồi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Không có kiến nghị chờ xử lý</h3>
                  <p className="text-gray-500">Tất cả kiến nghị đã được tiếp nhận và xử lý</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-l-4 border-l-amber-500 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${getCategoryColor(suggestion.category)} shadow-sm`}>
                            {getCategoryLabel(suggestion.category)}
                          </Badge>
                          <Badge className={`${getStatusColor(suggestion.status)} shadow-sm`}>
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusLabel(suggestion.status)}</span>
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(suggestion.priority)} shadow-sm`}>
                            {getPriorityLabel(suggestion.priority)}
                          </Badge>
                          {suggestion.isAnonymous && (
                            <Badge variant="secondary" className="text-xs shadow-sm">Ẩn danh</Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-amber-700 transition-colors">{suggestion.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{suggestion.content}</p>
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                          <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(suggestion.submittedAt)}
                          </span>
                          {!suggestion.isAnonymous && suggestion.user && (
                            <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                              <User className="h-3.5 w-3.5" />
                              {suggestion.user.fullName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Select value={suggestion.status} onValueChange={(value) => handleUpdateStatus(suggestion.id, value)}>
                          <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUBMITTED">Đã gửi</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Đang xem xét</SelectItem>
                            <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                            <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                            <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all" onClick={() => { setSelectedSuggestion(suggestion); setShowResponseDialog(true); }}>
                          <MessageSquare className="h-4 w-4 mr-1" />Phản hồi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Không có kiến nghị đang xử lý</h3>
                  <p className="text-gray-500">Chưa có kiến nghị nào trong trạng thái đang xử lý</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-l-4 border-l-blue-500 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${getCategoryColor(suggestion.category)} shadow-sm`}>
                            {getCategoryLabel(suggestion.category)}
                          </Badge>
                          <Badge className={`${getStatusColor(suggestion.status)} shadow-sm`}>
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusLabel(suggestion.status)}</span>
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(suggestion.priority)} shadow-sm`}>
                            {getPriorityLabel(suggestion.priority)}
                          </Badge>
                          {suggestion.isAnonymous && (
                            <Badge variant="secondary" className="text-xs shadow-sm">Ẩn danh</Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-blue-700 transition-colors">{suggestion.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{suggestion.content}</p>
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                          <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(suggestion.submittedAt)}
                          </span>
                          {!suggestion.isAnonymous && suggestion.user && (
                            <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                              <User className="h-3.5 w-3.5" />
                              {suggestion.user.fullName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Select value={suggestion.status} onValueChange={(value) => handleUpdateStatus(suggestion.id, value)}>
                          <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUBMITTED">Đã gửi</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Đang xem xét</SelectItem>
                            <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                            <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                            <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all" onClick={() => { setSelectedSuggestion(suggestion); setShowResponseDialog(true); }}>
                          <MessageSquare className="h-4 w-4 mr-1" />Phản hồi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Không có kiến nghị đã hoàn thành</h3>
                  <p className="text-gray-500">Chưa có kiến nghị nào được giải quyết xong</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-l-4 border-l-green-500 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={`${getCategoryColor(suggestion.category)} shadow-sm`}>
                            {getCategoryLabel(suggestion.category)}
                          </Badge>
                          <Badge className={`${getStatusColor(suggestion.status)} shadow-sm`}>
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusLabel(suggestion.status)}</span>
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(suggestion.priority)} shadow-sm`}>
                            {getPriorityLabel(suggestion.priority)}
                          </Badge>
                          {suggestion.isAnonymous && (
                            <Badge variant="secondary" className="text-xs shadow-sm">Ẩn danh</Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-green-700 transition-colors">{suggestion.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{suggestion.content}</p>
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                          <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(suggestion.submittedAt)}
                          </span>
                          {!suggestion.isAnonymous && suggestion.user && (
                            <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                              <User className="h-3.5 w-3.5" />
                              {suggestion.user.fullName}
                            </span>
                          )}
                          {suggestion.resolvedAt && (
                            <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Hoàn thành: {formatDate(suggestion.resolvedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 transition-all" onClick={() => { setSelectedSuggestion(suggestion); setShowResponseDialog(true); }}>
                          <Eye className="h-4 w-4 mr-1" />Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phản hồi kiến nghị</DialogTitle>
            <DialogDescription>
              {selectedSuggestion && `Phản hồi cho: "${selectedSuggestion.title}"`}
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4">
              {/* Suggestion Preview */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm space-y-2">
                    <div><strong>Người gửi:</strong> {selectedSuggestion.isAnonymous ? 'Ẩn danh' : selectedSuggestion.user?.fullName}</div>
                    <div><strong>Danh mục:</strong> {getCategoryLabel(selectedSuggestion.category)}</div>
                    <div><strong>Ưu tiên:</strong> {getPriorityLabel(selectedSuggestion.priority)}</div>
                    <div><strong>Nội dung:</strong></div>
                    <div className="bg-gray-50 p-2 rounded text-xs line-clamp-3">
                      {selectedSuggestion.content}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="responseContent">Nội dung phản hồi *</Label>
                  <Textarea
                    id="responseContent"
                    value={responseData.content}
                    onChange={(e) => setResponseData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Nhập phản hồi chi tiết về kiến nghị này..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newStatus">Cập nhật trạng thái</Label>
                    <Select 
                      value={responseData.newStatus} 
                      onValueChange={(value) => setResponseData(prev => ({ ...prev, newStatus: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNDER_REVIEW">Đang xem xét</SelectItem>
                        <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                        <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                        <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={responseData.isPublic}
                      onCheckedChange={(checked) => setResponseData(prev => ({ ...prev, isPublic: checked as boolean }))}
                    />
                    <Label htmlFor="isPublic" className="text-sm">
                      Phản hồi công khai (hiển thị cho tất cả)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendNotification"
                      checked={responseData.sendNotification}
                      onCheckedChange={(checked) => setResponseData(prev => ({ ...prev, sendNotification: checked as boolean }))}
                    />
                    <Label htmlFor="sendNotification" className="text-sm">
                      Gửi thông báo cho người gửi kiến nghị
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResponseDialog(false)
                setSelectedSuggestion(null)
                resetResponseForm()
              }}
              disabled={sendingResponse}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRespond}
              disabled={!responseData.content.trim() || sendingResponse}
            >
              {sendingResponse ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi phản hồi
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}






