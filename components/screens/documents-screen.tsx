'use client'

import { useState, useEffect } from 'react'
import { documentApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Search, FileText, Download, Heart, Calendar, Eye, ChevronRight, Filter } from 'lucide-react'
import { toast } from '../ui/use-toast'
import { DocumentViewer } from '../documents/document-viewer'

interface YouthDocument {
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

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<YouthDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<YouthDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('PUBLISHED')
  const [selectedDocument, setSelectedDocument] = useState<YouthDocument | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

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
    loadDocuments()
    loadFavorites()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, documentTypeFilter, statusFilter, showFavoritesOnly, favorites])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocuments({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: documentTypeFilter !== 'all' ? documentTypeFilter : undefined
      })

      if (response.success && response.data) {
        setDocuments(response.data as unknown as YouthDocument[])
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải danh sách văn bản',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách văn bản',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    try {
      const response = await documentApi.getFavorites()
      if (response.success && response.data) {
        setFavorites(response.data.map(doc => doc.id))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(search) ||
        doc.documentNumber?.toLowerCase().includes(search) ||
        doc.description?.toLowerCase().includes(search) ||
        doc.issuer?.toLowerCase().includes(search) ||
        doc.tags?.toLowerCase().includes(search)
      )
    }

    // YouthDocument type filter
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === documentTypeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(doc => favorites.includes(doc.id))
    }

    setFilteredDocuments(filtered)
  }

  const handleDocumentClick = (document: YouthDocument) => {
    setSelectedDocument(document)
    setShowViewer(true)
  }

  const handleDownload = async (document: YouthDocument) => {
    try {
      const response = await documentApi.downloadDocument(document.id)
      if (response.success && response.data) {
        // Create download link
        const link = window.document.createElement('a')
        link.href = response.data.fileUrl
        link.download = response.data.fileName || document.title
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)

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

  const handleToggleFavorite = async (document: YouthDocument, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await documentApi.toggleFavorite(document.id)
      if (response.success) {
        const isFavorited = favorites.includes(document.id)
        const newFavorites = isFavorited
          ? favorites.filter(id => id !== document.id)
          : [...favorites, document.id]
        setFavorites(newFavorites)

        toast({
          title: 'Thành công',
          description: !isFavorited 
            ? 'Đã thêm vào danh sách yêu thích'
            : 'Đã xóa khỏi danh sách yêu thích'
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
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
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getYouthDocumentTypeLabel = (type: string) => {
    const typeObj = documentTypes.find(t => t.value === type)
    return typeObj?.label || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Văn bản điều hành</h1>
          <p className="text-muted-foreground">
            Kho lưu trữ các văn bản, quy định, hướng dẫn của tổ chức
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
        <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
                placeholder="Tìm kiếm văn bản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

            {/* YouthDocument Type Filter */}
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Loại văn bản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
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

            {/* Favorites Toggle */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="w-full sm:w-auto"
            >
              <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Yêu thích
            </Button>
      </div>
              </CardContent>
            </Card>

      {/* YouthDocuments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
            <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || documentTypeFilter !== 'all' || showFavoritesOnly
                  ? 'Không tìm thấy văn bản phù hợp'
                  : 'Chưa có văn bản nào'}
              </p>
              </CardContent>
            </Card>
        ) : (
          filteredDocuments.map(document => (
            <Card
              key={document.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleDocumentClick(document)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(document.status)}>
                        {statusTypes.find(s => s.value === document.status)?.label || document.status}
                      </Badge>
                      <Badge variant="outline">
                        {getYouthDocumentTypeLabel(document.documentType)}
                      </Badge>
                      {document.documentNumber && (
                        <span className="text-sm text-muted-foreground">
                          Số: {document.documentNumber}
                        </span>
                      )}
          </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {document.title}
                    </h3>

                    {document.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {document.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {document.issuer && (
                        <span>Ban hành: {document.issuer}</span>
                      )}
                      {document.issuedDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(document.issuedDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {document.viewCount} lượt xem
                      </span>
                      {document.fileSize && (
                        <span>{formatFileSize(document.fileSize)}</span>
                      )}
                    </div>

                    {document.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {document.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                      </div>

                  <div className="flex flex-col items-center gap-2">
                          <Button
                      variant="ghost"
                            size="sm"
                      onClick={(e) => handleToggleFavorite(document, e)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(document.id) 
                            ? 'fill-current text-red-500' 
                            : ''
                        }`}
                      />
                          </Button>

                    {document.fileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(document)
                        }}
                      >
                            <Download className="h-4 w-4" />
                          </Button>
                    )}

                    <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false)
            setSelectedDocument(null)
          }}
          onFavoriteToggle={() => {
            if (selectedDocument) {
              handleToggleFavorite(selectedDocument, {} as React.MouseEvent)
            }
          }}
          isFavorited={favorites.includes(selectedDocument.id)}
        />
      )}
    </div>
  )
}