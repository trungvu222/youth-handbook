'use client'

import { useState, useEffect } from 'react'
import { documentApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Download,
  Eye,
  Send,
  Upload,
  Calendar,
  BarChart3,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from '../ui/use-toast'

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

interface DocumentStats {
  totalDocuments: number;
  publishedDocuments: number;
  draftDocuments: number;
  totalViews: number;
  totalDownloads: number;
  recentDocuments: Document[];
}

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    documentNumber: '',
    documentType: 'NOTICE',
    issuer: '',
    description: '',
    content: '',
    issuedDate: '',
    effectiveDate: '',
    expiryDate: '',
    tags: '',
    sendNotification: false,
    file: null as File | null
  })

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
    { value: 'DRAFT', label: 'Dự thảo' },
    { value: 'PUBLISHED', label: 'Đã ban hành' },
    { value: 'ARCHIVED', label: 'Đã lưu trữ' },
    { value: 'EXPIRED', label: 'Hết hiệu lực' }
  ]

  useEffect(() => {
    loadDocuments()
    loadStats()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocuments()

      if (response.success && response.data) {
        setDocuments(response.data)
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

  const loadStats = async () => {
    try {
      const response = await documentApi.getDocumentStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading document stats:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      documentNumber: '',
      documentType: 'NOTICE',
      issuer: '',
      description: '',
      content: '',
      issuedDate: '',
      effectiveDate: '',
      expiryDate: '',
      tags: '',
      sendNotification: false,
      file: null
    })
    setSelectedDocument(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Lỗi',
          description: 'File không được vượt quá 10MB',
          variant: 'destructive'
        })
        return
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Lỗi',
          description: 'Chỉ hỗ trợ file PDF và Word',
          variant: 'destructive'
        })
        return
      }

      setFormData(prev => ({ ...prev, file }))
    }
  }

  const uploadFile = async (file: File): Promise<{fileUrl: string; fileName: string; fileSize: number} | null> => {
    try {
      setUploading(true)
      setUploadProgress(0)

      const response = await documentApi.uploadDocumentFile(file, (progress) => {
        setUploadProgress(progress)
      })

      if (response.success && response.data) {
        return response.data
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể tải lên file',
          variant: 'destructive'
        })
        return null
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lên file',
        variant: 'destructive'
      })
      return null
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề văn bản',
        variant: 'destructive'
      })
      return
    }

    try {
      let fileData = null

      // Upload file if provided
      if (formData.file) {
        fileData = await uploadFile(formData.file)
        if (!fileData) return // Upload failed
      }

      const documentData = {
        title: formData.title,
        documentNumber: formData.documentNumber || undefined,
        documentType: formData.documentType,
        issuer: formData.issuer || undefined,
        description: formData.description || undefined,
        content: formData.content || undefined,
        issuedDate: formData.issuedDate || undefined,
        effectiveDate: formData.effectiveDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        tags: formData.tags || undefined,
        sendNotification: formData.sendNotification,
        ...fileData
      }

      const response = selectedDocument
        ? await documentApi.updateDocument(selectedDocument.id, documentData)
        : await documentApi.createDocument(documentData)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: selectedDocument 
            ? 'Đã cập nhật văn bản'
            : 'Đã tạo văn bản mới'
        })
        
        setShowCreateDialog(false)
        setShowEditDialog(false)
        resetForm()
        loadDocuments()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể lưu văn bản',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving document:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu văn bản',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (document: Document) => {
    setSelectedDocument(document)
    setFormData({
      title: document.title,
      documentNumber: document.documentNumber || '',
      documentType: document.documentType,
      issuer: document.issuer || '',
      description: document.description || '',
      content: document.content || '',
      issuedDate: document.issuedDate || '',
      effectiveDate: document.effectiveDate || '',
      expiryDate: document.expiryDate || '',
      tags: document.tags || '',
      sendNotification: false,
      file: null
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (document: Document) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa văn bản "${document.title}"?`)) {
      return
    }

    try {
      const response = await documentApi.deleteDocument(document.id)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa văn bản'
        })
        loadDocuments()
        loadStats()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể xóa văn bản',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa văn bản',
        variant: 'destructive'
      })
    }
  }

  const handleSendNotification = async (document: Document) => {
    try {
      const response = await documentApi.sendNotification(document.id)

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã gửi thông báo về văn bản'
        })
        loadDocuments()
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

  const filteredDocuments = documents.filter(doc => {
    const matchSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchType = typeFilter === 'all' || doc.documentType === typeFilter
    const matchStatus = statusFilter === 'all' || doc.status === statusFilter

    return matchSearch && matchType && matchStatus
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
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

  const getDocumentTypeLabel = (type: string) => {
    const typeObj = documentTypes.find(t => t.value === type)
    return typeObj?.label || type
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý văn bản</h1>
          <p className="text-muted-foreground">
            Tạo, chỉnh sửa và quản lý các văn bản điều hành
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo văn bản mới
        </Button>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Danh sách văn bản</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm văn bản..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
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

          {/* Documents List */}
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
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Không tìm thấy văn bản phù hợp'
                      : 'Chưa có văn bản nào'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map(document => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(document.status)}>
                            {statusTypes.find(s => s.value === document.status)?.label || document.status}
                          </Badge>
                          <Badge variant="outline">
                            {getDocumentTypeLabel(document.documentType)}
                          </Badge>
                          {document.documentNumber && (
                            <span className="text-sm text-muted-foreground">
                              Số: {document.documentNumber}
                            </span>
                          )}
                          {!document.isNotificationSent && document.status === 'PUBLISHED' && (
                            <Badge variant="secondary" className="text-xs">
                              Chưa gửi thông báo
                            </Badge>
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
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {document.downloadCount} tải xuống
                          </span>
                          {document.fileSize && (
                            <span>{formatFileSize(document.fileSize)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {document.status === 'PUBLISHED' && !document.isNotificationSent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendNotification(document)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document)}
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
                    {stats.totalDocuments}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng văn bản
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.publishedDocuments}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Đã ban hành
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.draftDocuments}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Dự thảo
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalViews}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng lượt xem
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalDownloads}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tổng tải xuống
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Document Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? 'Chỉnh sửa văn bản' : 'Tạo văn bản mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho văn bản
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề văn bản"
                />
              </div>

              <div>
                <Label htmlFor="documentNumber">Số/Ký hiệu</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Ví dụ: 01/TB-UBND"
                />
              </div>

              <div>
                <Label htmlFor="documentType">Loại văn bản</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="issuer">Đơn vị ban hành</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="Tên cơ quan ban hành"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issuedDate">Ngày ban hành</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="effectiveDate">Ngày có hiệu lực</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Ngày hết hiệu lực</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Description and Content */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn gọn về nội dung văn bản"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">Nội dung văn bản</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Nội dung chi tiết của văn bản (có thể để trống nếu có file đính kèm)"
                rows={6}
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Từ khóa</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Các từ khóa cách nhau bằng dấu phẩy"
              />
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file">File đính kèm (PDF, Word - tối đa 10MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              {formData.file && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Đã chọn: {formData.file.name} ({formatFileSize(formData.file.size)})
                </div>
              )}
              {uploading && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Switch
                id="sendNotification"
                checked={formData.sendNotification}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendNotification: checked }))}
              />
              <Label htmlFor="sendNotification">
                Gửi thông báo đến tất cả thành viên khi tạo/cập nhật
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                resetForm()
              }}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || !formData.title.trim()}
            >
              {uploading ? 'Đang tải lên...' : (selectedDocument ? 'Cập nhật' : 'Tạo văn bản')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

