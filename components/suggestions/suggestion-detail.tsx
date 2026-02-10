'use client'

import { useState, useEffect } from 'react'
import { suggestionApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  ArrowLeft,
  MessageSquare,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  Tag,
  Paperclip,
  Send,
  FileText,
  Image as ImageIcon,
  ExternalLink
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
  responses?: SuggestionResponse[];
  viewCount: number;
}

interface SuggestionResponse {
  id: string;
  suggestionId: string;
  content: string;
  isPublic: boolean;
  responderId: string;
  createdAt: string;
  responder: {
    id: string;
    fullName: string;
    role: string;
  };
}

interface SuggestionDetailProps {
  suggestion: Suggestion;
  onBack: () => void;
  onUpdate: () => void;
}

export function SuggestionDetail({ suggestion: initialSuggestion, onBack, onUpdate }: SuggestionDetailProps) {
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const [loading, setLoading] = useState(false)
  const [newResponse, setNewResponse] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadSuggestionDetail()
  }, [])

  const loadSuggestionDetail = async () => {
    try {
      setLoading(true)
      const response = await suggestionApi.getSuggestion(suggestion.id)
      
      if (response.success && response.data) {
        setSuggestion(response.data)
      }
    } catch (error) {
      console.error('Error loading suggestion detail:', error)
    } finally {
      setLoading(false)
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-600" />
    } else {
      return <Paperclip className="h-4 w-4" />
    }
  }

  const getFileName = (url: string) => {
    return url.split('/').pop()?.split('?')[0] || 'file'
  }

  const handleDownloadFile = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết kiến nghị</h1>
          <p className="text-muted-foreground">
            ID: {suggestion.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Suggestion Content */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={getCategoryColor(suggestion.category)}>
                  {getCategoryLabel(suggestion.category)}
                </Badge>
                
                <Badge className={getStatusColor(suggestion.status)}>
                  {getStatusLabel(suggestion.status)}
                </Badge>
                
                <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                  {getPriorityLabel(suggestion.priority)}
                </Badge>

                {suggestion.isAnonymous && (
                  <Badge variant="secondary" className="text-xs">
                    Ẩn danh
                  </Badge>
                )}
              </div>

              <CardTitle className="text-xl">
                {suggestion.title}
              </CardTitle>

              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(suggestion.submittedAt)}
                </span>

                {suggestion.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {suggestion.viewCount} lượt xem
                  </span>
                )}

                {!suggestion.isAnonymous && suggestion.user && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {suggestion.user.fullName}
                    {suggestion.user.unitName && ` (${suggestion.user.unitName})`}
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {suggestion.content}
                </div>
              </div>

              {/* Tags */}
              {suggestion.tags && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Tag className="h-3 w-3" />
                    <span className="text-xs font-medium text-muted-foreground">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {suggestion.fileUrls && suggestion.fileUrls.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Paperclip className="h-3 w-3" />
                    <span className="text-xs font-medium text-muted-foreground">
                      File đính kèm ({suggestion.fileUrls.length}):
                    </span>
                  </div>
                  <div className="space-y-2">
                    {suggestion.fileUrls.map((url, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(url)}
                          <span className="text-sm font-medium">
                            {getFileName(url)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(url)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(url)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.resolvedAt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    Đã giải quyết
                  </div>
                  <div className="text-xs text-green-700">
                    {formatDate(suggestion.resolvedAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Phản hồi ({suggestion.responses?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !suggestion.responses || suggestion.responses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có phản hồi nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestion.responses.map((response) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {response.responder.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {response.responder.fullName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {response.responder.role}
                            </Badge>
                            {!response.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Riêng tư
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            {formatDate(response.createdAt)}
                          </div>
                          
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {response.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge className={getStatusColor(suggestion.status)}>
                    {getStatusLabel(suggestion.status)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ưu tiên:</span>
                  <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                    {getPriorityLabel(suggestion.priority)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Danh mục:</span>
                  <span>{getCategoryLabel(suggestion.category)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gửi lúc:</span>
                  <span>{formatDate(suggestion.submittedAt)}</span>
                </div>
                
                {suggestion.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giải quyết:</span>
                    <span>{formatDate(suggestion.resolvedAt)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lượt xem:</span>
                  <span>{suggestion.viewCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Author Info (if not anonymous) */}
          {!suggestion.isAnonymous && suggestion.user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Người gửi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {suggestion.user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">
                      {suggestion.user.fullName}
                    </div>
                    {suggestion.user.unitName && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {suggestion.user.unitName}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phản hồi:</span>
                  <span className="font-medium">{suggestion.responses?.length || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File đính kèm:</span>
                  <span className="font-medium">{suggestion.fileUrls?.length || 0}</span>
                </div>
                
                {suggestion.tags && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags:</span>
                    <span className="font-medium">
                      {suggestion.tags.split(',').length}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






