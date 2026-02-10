'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { 
  Download, 
  Heart, 
  Eye, 
  Calendar, 
  FileText, 
  Building,
  User,
  Clock,
  ExternalLink
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { documentApi } from '../../lib/api'

interface Document {
  id: string;
  title: string;
  documentNumber?: string;
  documentType: 'CIRCULAR' | 'DECISION' | 'DIRECTIVE' | 'INSTRUCTION' | 'REGULATION' | 'NOTICE' | 'LETTER' | 'GUIDELINE' | 'FORM' | 'OTHER';
  issuer?: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';
  issuedDate?: string;
  effectiveDate?: string;
  expiryDate?: string;
  authorId: string;
  unitId?: string;
  viewCount: number;
  downloadCount: number;
  tags?: string;
  isNotificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    role: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  isFavorited?: boolean;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onFavoriteToggle: () => void;
  isFavorited: boolean;
}

export function DocumentViewer({ 
  document, 
  onClose, 
  onFavoriteToggle, 
  isFavorited 
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(false)
  const [fullDocument, setFullDocument] = useState<Document | null>(null)

  const documentTypes = [
    { value: 'CIRCULAR', label: 'Thông tư' },
    { value: 'DECISION', label: 'Quyết định' },
    { value: 'DIRECTIVE', label: 'Chỉ thị' },
    { value: 'INSTRUCTION', label: 'Hướng dẫn' },
    { value: 'REGULATION', label: 'Quy định' },
    { value: 'NOTICE', label: 'Thông báo' },
    { value: 'LETTER', label: 'Công văn' },
    { value: 'GUIDELINE', label: 'Tài liệu hướng dẫn' },
    { value: 'FORM', label: 'Mẫu biểu' },
    { value: 'OTHER', label: 'Khác' }
  ]

  const statusTypes = [
    { value: 'PUBLISHED', label: 'Đã ban hành' },
    { value: 'DRAFT', label: 'Dự thảo' },
    { value: 'ARCHIVED', label: 'Đã lưu trữ' },
    { value: 'EXPIRED', label: 'Hết hiệu lực' }
  ]

  useEffect(() => {
    loadDocumentDetails()
  }, [document.id])

  const loadDocumentDetails = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocument(document.id)
      
      if (response.success && response.data) {
        setFullDocument(response.data)
      } else {
        setFullDocument(document)
        toast({
          title: 'Cảnh báo',
          description: 'Không thể tải chi tiết văn bản, hiển thị thông tin cơ bản',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading document details:', error)
      setFullDocument(document)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await documentApi.downloadDocument(document.id)
      if (response.success && response.data) {
        // Create download link
        const link = window.document.createElement('a')
        link.href = response.data.fileUrl
        link.download = response.data.fileName || document.title
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: 'Thành công',
          description: 'Đã tải xuống tài liệu'
        })
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải xuống tài liệu',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải xuống tài liệu',
        variant: 'destructive'
      })
    }
  }

  const handleViewOnline = () => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDocumentTypeLabel = (type: string) => {
    const typeObj = documentTypes.find(t => t.value === type)
    return typeObj?.label || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const displayDoc = fullDocument || document

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight mb-2">
                {displayDoc.title}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={getStatusColor(displayDoc.status)}>
                  {statusTypes.find(s => s.value === displayDoc.status)?.label || displayDoc.status}
                </Badge>
                <Badge variant="outline">
                  {getDocumentTypeLabel(displayDoc.documentType)}
                </Badge>
                {displayDoc.documentNumber && (
                  <Badge variant="secondary">
                    Số: {displayDoc.documentNumber}
                  </Badge>
                )}
              </div>

              {displayDoc.description && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {displayDoc.description}
                </DialogDescription>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onFavoriteToggle}
                className="text-gray-400 hover:text-red-500"
              >
                <Heart
                  className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`}
                />
              </Button>

              {displayDoc.fileUrl && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewOnline}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Document Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Thông tin văn bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayDoc.issuer && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Cơ quan ban hành</div>
                            <div className="text-sm text-muted-foreground">{displayDoc.issuer}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Người đăng</div>
                          <div className="text-sm text-muted-foreground">{displayDoc.author.fullName}</div>
                        </div>
                      </div>

                      {displayDoc.issuedDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Ngày ban hành</div>
                            <div className="text-sm text-muted-foreground">{formatDate(displayDoc.issuedDate)}</div>
                          </div>
                        </div>
                      )}

                      {displayDoc.effectiveDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Ngày có hiệu lực</div>
                            <div className="text-sm text-muted-foreground">{formatDate(displayDoc.effectiveDate)}</div>
                          </div>
                        </div>
                      )}

                      {displayDoc.expiryDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Ngày hết hiệu lực</div>
                            <div className="text-sm text-muted-foreground">{formatDate(displayDoc.expiryDate)}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Lượt xem</div>
                          <div className="text-sm text-muted-foreground">{displayDoc.viewCount}</div>
                        </div>
                      </div>

                      {displayDoc.fileSize && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Kích thước file</div>
                            <div className="text-sm text-muted-foreground">{formatFileSize(displayDoc.fileSize)}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {displayDoc.tags && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Từ khóa</div>
                        <div className="flex flex-wrap gap-1">
                          {displayDoc.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Content */}
                {displayDoc.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nội dung văn bản</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: displayDoc.content }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* File Actions */}
                {displayDoc.fileUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">File đính kèm</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleViewOnline}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Xem trực tuyến
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Tải xuống
                          {displayDoc.fileName && (
                            <span className="text-xs text-muted-foreground">
                              ({displayDoc.fileName})
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}