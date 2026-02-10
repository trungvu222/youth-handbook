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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
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
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [notificationDocument, setNotificationDocument] = useState<Document | null>(null)
  const [notificationType, setNotificationType] = useState<'all' | 'specific'>('all')
  const [selectedNotificationUserId, setSelectedNotificationUserId] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

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
    notificationType: 'all' as 'all' | 'specific',
    selectedUserIds: [] as string[],
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
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      // Using backend API with correct URL
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const API_URL = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')
        ? 'http://localhost:3001'
        : 'https://youth-handbook.onrender.com'
      
      const response = await fetch(`${API_URL}/api/users?role=MEMBER&limit=500`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[loadUsers] Response:', data)
        // Backend returns { success, users } not { success, data }
        if (data.success && data.users) {
          setUsers(data.users.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            unitName: u.unit?.name || ''
          })))
          console.log('[loadUsers] Loaded', data.users.length, 'users')
        }
      } else {
        console.error('[loadUsers] Response not ok:', response.status)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentApi.getDocuments()

      if (response.success && response.data) {
        // Sắp xếp văn bản mới nhất lên đầu
        const sortedDocuments = [...(response.data as unknown as Document[])].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setDocuments(sortedDocuments)
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
      notificationType: 'all',
      selectedUserIds: [],
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

    // Validate notification settings
    if (formData.sendNotification && formData.notificationType === 'specific' && formData.selectedUserIds.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một đoàn viên để gửi thông báo',
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
            : 'Đã tạo văn bản mới',
          variant: 'success'
        })
        
        // Send notification if enabled
        if (formData.sendNotification && response.data?.id) {
          const notificationData = {
            type: formData.notificationType,
            userIds: formData.notificationType === 'specific' ? formData.selectedUserIds : undefined
          }
          
          const notifResponse = await documentApi.sendNotification(
            response.data.id, 
            notificationData
          )
          
          if (notifResponse.success) {
            // Find selected user name for specific notification
            const responseData = notifResponse.data as any
            let notificationMessage = ''
            if (formData.notificationType === 'all') {
              const totalMembers = responseData?.sentCount || users.length
              notificationMessage = `Đã gửi thông báo đến tất cả ${totalMembers} đoàn viên`
            } else {
              const selectedUser = users.find(u => u.id === formData.selectedUserIds[0])
              notificationMessage = selectedUser 
                ? `Đã gửi thông báo đến đoàn viên: ${selectedUser.fullName}`
                : `Đã gửi thông báo đến ${formData.selectedUserIds.length} đoàn viên`
            }
            
            toast({
              title: '✅ Thông báo đã gửi thành công',
              description: notificationMessage,
              className: 'bg-green-50 border-green-500 text-green-900',
              duration: 5000
            })
          } else {
            toast({
              title: '⚠️ Cảnh báo',
              description: 'Văn bản đã lưu nhưng gửi thông báo thất bại: ' + (notifResponse.error || 'Lỗi không xác định'),
              variant: 'destructive',
              duration: 5000
            })
          }
        }
        
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
      notificationType: 'all',
      selectedUserIds: [],
      file: null
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (document: Document) => {
    setDocumentToDelete(document)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await documentApi.deleteDocument(documentToDelete.id)

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
    } finally {
      setShowDeleteDialog(false)
      setDocumentToDelete(null)
    }
  }

  const openNotificationDialog = (document: Document) => {
    setNotificationDocument(document)
    setNotificationType('all')
    setSelectedNotificationUserId('')
    setShowNotificationDialog(true)
  }

  const handleSendNotificationFromDialog = async () => {
    if (!notificationDocument) return
    
    if (notificationType === 'specific' && !selectedNotificationUserId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn đoàn viên để gửi thông báo',
        variant: 'destructive'
      })
      return
    }

    setSendingNotification(true)
    try {
      const notificationData = {
        type: notificationType,
        userIds: notificationType === 'specific' ? [selectedNotificationUserId] : undefined
      }
      
      const response = await documentApi.sendNotification(notificationDocument.id, notificationData)

      if (response.success) {
        // Get recipient info for toast
        const responseData = response.data as any
        let message = ''
        if (notificationType === 'all') {
          const count = responseData?.sentCount || responseData?.recipientCount || 0
          message = `Đã gửi thông báo đến tất cả ${count} đoàn viên`
        } else {
          const selectedUser = users.find(u => u.id === selectedNotificationUserId)
          message = `Đã gửi thông báo đến đoàn viên: ${selectedUser?.fullName || 'N/A'}`
        }
        
        toast({
          title: 'Gửi thông báo thành công',
          description: message,
          variant: 'success',
          duration: 5000
        })
        setShowNotificationDialog(false)
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
    } finally {
      setSendingNotification(false)
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header với gradient đẹp */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6bTAtMjBjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quản lý văn bản</h1>
                <p className="text-blue-100 mt-1">
                  Tạo, chỉnh sửa và quản lý các văn bản điều hành
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tạo văn bản mới
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md rounded-xl p-1.5 h-auto">
          <TabsTrigger 
            value="documents" 
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 font-semibold transition-all duration-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Danh sách văn bản
          </TabsTrigger>
          <TabsTrigger 
            value="stats"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 font-semibold transition-all duration-300"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filters với design đẹp hơn */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Tìm kiếm theo tên, số văn bản..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 focus:border-blue-500 rounded-xl transition-all"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-56 h-12 border-2 rounded-xl">
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
                  <SelectTrigger className="w-full sm:w-48 h-12 border-2 rounded-xl">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
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

          {/* Documents List với design mới */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0"></div>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
                    <FileText className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Không tìm thấy văn bản phù hợp'
                      : 'Chưa có văn bản nào'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Thử tìm kiếm với từ khóa khác'
                      : 'Bắt đầu bằng cách tạo văn bản đầu tiên'}
                  </p>
                  {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo văn bản mới
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((document, index) => (
                <Card 
                  key={document.id} 
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={`${getStatusColor(document.status)} px-3 py-1 text-xs font-semibold rounded-full`}>
                            {statusTypes.find(s => s.value === document.status)?.label || document.status}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-md">
                            {getDocumentTypeLabel(document.documentType)}
                          </Badge>
                          {document.documentNumber && (
                            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold border-2">
                              Số: {document.documentNumber}
                            </Badge>
                          )}
                          {!document.isNotificationSent && document.status === 'PUBLISHED' && (
                            <Badge className="bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold rounded-full">
                              Chưa gửi thông báo
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-xl mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                          {document.title}
                        </h3>

                        {/* Description */}
                        {document.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {document.description}
                          </p>
                        )}

                        {/* Issuer & Date Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                          {document.issuer && (
                            <div className="flex items-center gap-2 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg px-3 py-2">
                              <Edit className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs text-gray-500 font-medium">Ban hành</div>
                                <div className="text-sm font-bold text-gray-900 truncate">{document.issuer}</div>
                              </div>
                            </div>
                          )}
                          
                          {document.issuedDate && (
                            <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-3 py-2">
                              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Ngày ban hành</div>
                                <div className="text-sm font-bold text-gray-900">{formatDate(document.issuedDate)}</div>
                              </div>
                            </div>
                          )}
                          
                          {document.fileSize && (
                            <div className="flex items-center gap-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg px-3 py-2">
                              <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Dung lượng</div>
                                <div className="text-sm font-bold text-gray-900">{formatFileSize(document.fileSize)}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        <div className="flex flex-wrap gap-4 text-sm p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-100">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{document.viewCount}</span>
                            <span className="text-gray-600">lượt xem</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4 text-indigo-600" />
                            <span className="font-semibold text-gray-900">{document.downloadCount}</span>
                            <span className="text-gray-600">tải xuống</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {document.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openNotificationDialog(document)}
                            title="Gửi thông báo"
                            className={document.isNotificationSent ? 'hover:bg-green-50 hover:text-green-600' : 'hover:bg-blue-50 hover:text-blue-600'}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(document)}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa"
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

        <TabsContent value="stats" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Header */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                Thống kê văn bản
              </CardTitle>
              <CardDescription className="text-blue-50 font-medium mt-2">
                Tổng quan về tình hình quản lý văn bản điều hành
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Statistics Cards with Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-5 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold drop-shadow-lg">{stats?.totalDocuments || 0}</div>
                    <div className="text-xs font-semibold text-white/90 uppercase">Văn bản</div>
                  </div>
                </div>
                <div className="font-bold text-base">Tổng văn bản</div>
              </CardContent>
            </Card>

            <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-5 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold drop-shadow-lg">{stats?.publishedDocuments || 0}</div>
                    <div className="text-xs font-semibold text-white/90 uppercase">Văn bản</div>
                  </div>
                </div>
                <div className="font-bold text-base">Đã ban hành</div>
              </CardContent>
            </Card>

            <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-5 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Edit className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold drop-shadow-lg">{stats?.draftDocuments || 0}</div>
                    <div className="text-xs font-semibold text-white/90 uppercase">Văn bản</div>
                  </div>
                </div>
                <div className="font-bold text-base">Dự thảo</div>
              </CardContent>
            </Card>

            <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-5 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold drop-shadow-lg">{stats?.totalViews?.toLocaleString() || 0}</div>
                    <div className="text-xs font-semibold text-white/90 uppercase">Lượt</div>
                  </div>
                </div>
                <div className="font-bold text-base">Tổng lượt xem</div>
              </CardContent>
            </Card>

            <Card className="group relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="relative p-5 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold drop-shadow-lg">{stats?.totalDownloads?.toLocaleString() || 0}</div>
                    <div className="text-xs font-semibold text-white/90 uppercase">Lượt</div>
                  </div>
                </div>
                <div className="font-bold text-base">Tổng tải xuống</div>
              </CardContent>
            </Card>
          </div>

          {/* Document Type Distribution */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Filter className="h-6 w-6" />
                </div>
                Phân loại theo loại văn bản
              </CardTitle>
              <CardDescription className="text-cyan-50 font-medium mt-2">
                Thống kê văn bản theo từng loại hình
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const typeStats = documents.reduce((acc, doc) => {
                  const type = doc.documentType || 'OTHER'
                  if (!acc[type]) {
                    acc[type] = { count: 0, views: 0, downloads: 0 }
                  }
                  acc[type].count++
                  acc[type].views += doc.viewCount || 0
                  acc[type].downloads += doc.downloadCount || 0
                  return acc
                }, {} as Record<string, { count: number; views: number; downloads: number }>)

                const typeLabels: Record<string, { label: string; gradient: string; icon: string }> = {
                  'CIRCULAR': { label: 'Thông tư', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', icon: '📜' },
                  'DECISION': { label: 'Quyết định', gradient: 'bg-gradient-to-br from-green-500 to-green-700', icon: '📋' },
                  'DIRECTIVE': { label: 'Chỉ thị', gradient: 'bg-gradient-to-br from-purple-500 to-purple-700', icon: '📌' },
                  'INSTRUCTION': { label: 'Hướng dẫn', gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700', icon: '📖' },
                  'REGULATION': { label: 'Quy định', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700', icon: '📑' },
                  'NOTICE': { label: 'Thông báo', gradient: 'bg-gradient-to-br from-yellow-500 to-orange-600', icon: '📢' },
                  'LETTER': { label: 'Công văn', gradient: 'bg-gradient-to-br from-teal-500 to-teal-700', icon: '✉️' },
                  'GUIDELINE': { label: 'Cẩm nang', gradient: 'bg-gradient-to-br from-pink-500 to-pink-700', icon: '📚' },
                  'FORM': { label: 'Biểu mẫu', gradient: 'bg-gradient-to-br from-gray-500 to-gray-700', icon: '📝' },
                  'OTHER': { label: 'Khác', gradient: 'bg-gradient-to-br from-slate-500 to-slate-700', icon: '📄' }
                }

                if (Object.keys(typeStats).length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có văn bản nào</p>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.entries(typeStats).map(([type, stats]) => {
                      const config = typeLabels[type] || typeLabels['OTHER']
                      return (
                        <Card key={type} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                          <div className={`absolute inset-0 ${config.gradient} opacity-90`}></div>
                          <CardContent className="relative p-4 text-white">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-2xl">{config.icon}</div>
                              <div className="text-right">
                                <div className="text-2xl font-extrabold drop-shadow-lg">{stats.count}</div>
                                <div className="text-xs font-semibold text-white/90">Văn bản</div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm">{config.label}</div>
                              <div className="flex items-center gap-3 text-xs bg-white/20 rounded-lg px-2 py-1.5 backdrop-blur-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {stats.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" /> {stats.downloads.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Detailed Document Statistics Table */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="h-6 w-6" />
                </div>
                Chi tiết từng văn bản
              </CardTitle>
              <CardDescription className="text-indigo-50 font-medium mt-2">
                Danh sách tất cả văn bản và thống kê tương tác
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có văn bản nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => {
                    const typeLabels: Record<string, string> = {
                      'CIRCULAR': 'Thông tư',
                      'DECISION': 'Quyết định',
                      'DIRECTIVE': 'Chỉ thị',
                      'INSTRUCTION': 'Hướng dẫn',
                      'REGULATION': 'Quy định',
                      'NOTICE': 'Thông báo',
                      'LETTER': 'Công văn',
                      'GUIDELINE': 'Cẩm nang',
                      'FORM': 'Biểu mẫu',
                      'OTHER': 'Khác'
                    }

                    const statusConfig: Record<string, { label: string; className: string }> = {
                      'PUBLISHED': { label: 'Đã ban hành', className: 'bg-green-100 text-green-800 border-green-300' },
                      'DRAFT': { label: 'Dự thảo', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                      'ARCHIVED': { label: 'Lưu trữ', className: 'bg-gray-100 text-gray-800 border-gray-300' },
                      'EXPIRED': { label: 'Hết hiệu lực', className: 'bg-red-100 text-red-800 border-red-300' }
                    }

                    return (
                      <div key={doc.id} className="border-2 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all border-b">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-900 mb-1">{doc.title}</div>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                {doc.documentNumber && (
                                  <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                    <FileText className="h-3.5 w-3.5" /> {doc.documentNumber}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                  <Filter className="h-3.5 w-3.5" /> {typeLabels[doc.documentType] || 'Khác'}
                                </span>
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                  <Eye className="h-3.5 w-3.5" /> {doc.viewCount?.toLocaleString() || 0} lượt xem
                                </span>
                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                  <Download className="h-3.5 w-3.5" /> {doc.downloadCount?.toLocaleString() || 0} tải xuống
                                </span>
                                {doc.issuedDate && (
                                  <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                    <Calendar className="h-3.5 w-3.5" /> {new Date(doc.issuedDate).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`font-semibold shadow-sm border-2 ${statusConfig[doc.status]?.className || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                              {statusConfig[doc.status]?.label || doc.status}
                            </Badge>
                            {doc.isNotificationSent && (
                              <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-300 font-semibold shadow-sm">
                                <Send className="h-3 w-3 mr-1" /> Đã gửi TB
                              </Badge>
                            )}
                          </div>
                        </div>
                        {doc.description && (
                          <div className="p-4 bg-gray-50 text-sm text-gray-600">
                            <p className="line-clamp-2">{doc.description}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
              <Label htmlFor="file">File đính kèm (PDF, Word, Excel - tối đa 10MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
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
            <div className="space-y-
4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sendNotification"
                  checked={formData.sendNotification}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendNotification: checked }))}
                />
                <Label htmlFor="sendNotification">
                  Gửi thông báo đến đoàn viên khi tạo/cập nhật
                </Label>
              </div>

              {formData.sendNotification && (
                <div className="ml-8 space-y-3 border-l-2 border-blue-200 pl-4">
                  <RadioGroup
                    value={formData.notificationType}
                    onValueChange={(value: 'all' | 'specific') => 
                      setFormData(prev => ({ ...prev, notificationType: value, selectedUserIds: [] }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="notif-all" />
                      <Label htmlFor="notif-all" className="cursor-pointer font-normal">
                        Gửi đến tất cả đoàn viên
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="notif-specific" />
                      <Label htmlFor="notif-specific" className="cursor-pointer font-normal">
                        Gửi đến cá nhân đoàn viên cụ thể
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.notificationType === 'specific' && (
                    <div className="mt-3">
                      <Label>Chọn đoàn viên nhận thông báo *</Label>
                      <Select
                        value={formData.selectedUserIds[0] || ''}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          selectedUserIds: value ? [value] : [] 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn 1 đoàn viên..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} {user.unitName ? `(${user.unitName})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.selectedUserIds.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Đã chọn {formData.selectedUserIds.length} đoàn viên
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
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

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Gửi thông báo văn bản
            </DialogTitle>
            <DialogDescription>
              {notificationDocument?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Chọn đối tượng nhận thông báo:</Label>
              <RadioGroup
                value={notificationType}
                onValueChange={(value: 'all' | 'specific') => {
                  setNotificationType(value)
                  if (value === 'all') {
                    setSelectedNotificationUserId('')
                  }
                }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="all" id="notify-all" />
                  <Label htmlFor="notify-all" className="flex-1 cursor-pointer">
                    <span className="font-medium">Gửi đến tất cả đoàn viên</span>
                    <span className="block text-sm text-gray-500">
                      {users.length} đoàn viên sẽ nhận được thông báo
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="specific" id="notify-specific" />
                  <Label htmlFor="notify-specific" className="flex-1 cursor-pointer">
                    <span className="font-medium">Gửi đến cá nhân cụ thể</span>
                    <span className="block text-sm text-gray-500">
                      Chọn một đoàn viên để gửi thông báo
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {notificationType === 'specific' && (
              <div className="space-y-2">
                <Label>Chọn đoàn viên:</Label>
                <Select
                  value={selectedNotificationUserId}
                  onValueChange={setSelectedNotificationUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Chọn đoàn viên --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {users.map((user, index) => (
                      <SelectItem key={user.id} value={user.id}>
                        {index + 1}. {user.fullName} {user.unitName ? `- ${user.unitName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNotificationDialog(false)}
              disabled={sendingNotification}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendNotificationFromDialog}
              disabled={sendingNotification || (notificationType === 'specific' && !selectedNotificationUserId)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingNotification ? (
                <>Đang gửi...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi thông báo
                </>
              )}
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
              Xác nhận xóa văn bản
            </DialogTitle>
            <DialogDescription className="text-left">
              Bạn có chắc chắn muốn xóa văn bản <strong>"{documentToDelete?.title}"</strong>?<br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa văn bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

