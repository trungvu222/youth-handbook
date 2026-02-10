'use client'

import { useState, useEffect } from 'react'
import { suggestionApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SuggestionForm } from '../suggestions/suggestion-form'
import { SuggestionDetail } from '../suggestions/suggestion-detail'
import { 
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Eye,
  Filter
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'IMPROVEMENT' | 'COMPLAINT' | 'IDEA' | 'QUESTION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  isAnonymous: boolean;
  userId?: string;
  fileUrls?: string[];
  tags?: string;
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

export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab, searchTerm, categoryFilter, statusFilter, priorityFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'my') {
        // Load my suggestions
        const response = await suggestionApi.getMySuggestions()
        if (response.success && response.data) {
          setMySuggestions(response.data)
        }
      } else {
        // Load all suggestions with filters
        const params: any = {}
        if (searchTerm) params.search = searchTerm
        if (categoryFilter !== 'all') params.category = categoryFilter
        if (statusFilter !== 'all') params.status = statusFilter
        if (priorityFilter !== 'all') params.priority = priorityFilter
        params.limit = 20

        const response = await suggestionApi.getSuggestions(params)
        if (response.success && response.data) {
          setSuggestions(response.data.data || response.data)
        }
      }

    } catch (error) {
      console.error('Error loading suggestions:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách kiến nghị',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionCreated = () => {
    setShowCreateForm(false)
    loadData()
    toast({
      title: 'Thành công',
      description: 'Đã gửi kiến nghị thành công'
    })
  }

  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return <AlertTriangle className="h-3 w-3" />
      case 'COMPLAINT': return <XCircle className="h-3 w-3" />
      case 'IDEA': return <Lightbulb className="h-3 w-3" />
      case 'QUESTION': return <MessageSquare className="h-3 w-3" />
      case 'OTHER': return <FileText className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
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

  const currentSuggestions = activeTab === 'my' ? mySuggestions : suggestions

  if (showCreateForm) {
    return (
      <SuggestionForm
        onComplete={handleSuggestionCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  if (selectedSuggestion) {
    return (
      <SuggestionDetail
        suggestion={selectedSuggestion}
        onBack={() => setSelectedSuggestion(null)}
        onUpdate={loadData}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kiến nghị cá nhân</h1>
          <p className="text-muted-foreground">
            Gửi góp ý, kiến nghị và theo dõi phản hồi
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Gửi kiến nghị
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Tất cả kiến nghị ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Kiến nghị của tôi ({mySuggestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm kiến nghị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : currentSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Không tìm thấy kiến nghị nào' 
                    : 'Chưa có kiến nghị nào'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {currentSuggestions.map(suggestion => (
                <Card 
                  key={suggestion.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewSuggestion(suggestion)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(suggestion.category)}>
                            {getCategoryIcon(suggestion.category)}
                            <span className="ml-1">{getCategoryLabel(suggestion.category)}</span>
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

                          {suggestion.fileUrls && suggestion.fileUrls.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {suggestion.fileUrls.length} file đính kèm
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
                          <span>
                            Gửi: {formatDate(suggestion.submittedAt)}
                          </span>
                          
                          {!suggestion.isAnonymous && suggestion.user && (
                            <span>
                              Bởi: {suggestion.user.fullName}
                              {suggestion.user.unitName && ` (${suggestion.user.unitName})`}
                            </span>
                          )}

                          {suggestion.responses && suggestion.responses.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {suggestion.responses.length} phản hồi
                            </span>
                          )}

                          {suggestion.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {suggestion.viewCount} lượt xem
                            </span>
                          )}

                          {suggestion.resolvedAt && (
                            <span>
                              Giải quyết: {formatDate(suggestion.resolvedAt)}
                            </span>
                          )}
                        </div>

                        {suggestion.tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {suggestion.tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mySuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Bạn chưa gửi kiến nghị nào
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gửi kiến nghị đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mySuggestions.map(suggestion => (
                <Card 
                  key={suggestion.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewSuggestion(suggestion)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(suggestion.category)}>
                            {getCategoryIcon(suggestion.category)}
                            <span className="ml-1">{getCategoryLabel(suggestion.category)}</span>
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
                          <span>
                            Gửi: {formatDate(suggestion.submittedAt)}
                          </span>
                          
                          {suggestion.responses && suggestion.responses.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <MessageSquare className="h-3 w-3" />
                              {suggestion.responses.length} phản hồi mới
                            </span>
                          )}

                          {suggestion.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {suggestion.viewCount} lượt xem
                            </span>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}






