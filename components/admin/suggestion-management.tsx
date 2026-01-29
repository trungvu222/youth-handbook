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
import { toast } from '../ui/use-toast'

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

    try {
      const response = await suggestionApi.respondToSuggestion(selectedSuggestion.id, responseData)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã gửi phản hồi'
        })
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
      console.error('Error responding to suggestion:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi phản hồi',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateStatus = async (suggestionId: string, newStatus: string) => {
    try {
      const response = await suggestionApi.updateSuggestionStatus(suggestionId, newStatus)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật trạng thái'
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

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (activeTab === 'pending') {
      return ['SUBMITTED', 'UNDER_REVIEW'].includes(suggestion.status)
    } else if (activeTab === 'processing') {
      return suggestion.status === 'IN_PROGRESS'
    } else if (activeTab === 'completed') {
      return ['RESOLVED', 'REJECTED'].includes(suggestion.status)
    }
    return true // 'all' tab
  })

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý kiến nghị</h1>
          <p className="text-muted-foreground">
            Xem, phản hồi và theo dõi tiến độ xử lý kiến nghị
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tất cả ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Chờ xử lý ({filteredSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Đang xử lý
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đã xong
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm kiến nghị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tổng kiến nghị
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Chờ xử lý
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.inProgress || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Đang xử lý
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.resolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Đã giải quyết
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((stats.resolved / (stats.total || 1)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Tỷ lệ hoàn thành
                </div>
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
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có kiến nghị nào</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(suggestion.category)}>
                            {getCategoryLabel(suggestion.category)}
                          </Badge>

                          <Badge className={getStatusColor(suggestion.status)}>
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusLabel(suggestion.status)}</span>
                          </Badge>

                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(suggestion.priority)}
                          >
                            {getPriorityLabel(suggestion.priority)}
                          </Badge>

                          {suggestion.isAnonymous && (
                            <Badge variant="secondary" className="text-xs">
                              Ẩn danh
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {suggestion.title}
                        </h3>

                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {suggestion.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(suggestion.submittedAt)}
                          </span>

                          {!suggestion.isAnonymous && suggestion.user && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {suggestion.user.fullName}
                              {suggestion.user.unitName && ` (${suggestion.user.unitName})`}
                            </span>
                          )}

                          {suggestion.responses && suggestion.responses.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {suggestion.responses.length} phản hồi
                            </span>
                          )}

                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {suggestion.viewCount} lượt xem
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Update */}
                        <Select
                          value={suggestion.status}
                          onValueChange={(value) => handleUpdateStatus(suggestion.id, value)}
                        >
                          <SelectTrigger className="w-40">
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

        {/* Other tab contents would be similar but filtered */}
        <TabsContent value="pending">
          {/* Similar to 'all' but filtered for pending suggestions */}
        </TabsContent>

        <TabsContent value="processing">
          {/* Similar to 'all' but filtered for in-progress suggestions */}
        </TabsContent>

        <TabsContent value="completed">
          {/* Similar to 'all' but filtered for completed suggestions */}
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
            >
              Hủy
            </Button>
            <Button
              onClick={handleRespond}
              disabled={!responseData.content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Gửi phản hồi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}






