'use client'

import { useState } from 'react'
import { suggestionApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { 
  ArrowLeft,
  Upload,
  X,
  FileText,
  Image,
  Paperclip,
  AlertTriangle,
  Lock,
  Eye
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SuggestionFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function SuggestionForm({ onComplete, onCancel }: SuggestionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'IMPROVEMENT' as 'IMPROVEMENT' | 'COMPLAINT' | 'IDEA' | 'QUESTION' | 'OTHER',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    isAnonymous: false,
    tags: ''
  })

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    for (const file of Array.from(files)) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Lỗi',
          description: `File "${file.name}" quá lớn. Kích thước tối đa là 10MB.`,
          variant: 'destructive'
        })
        continue
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Lỗi',
          description: `File "${file.name}" không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, PDF, DOC, TXT.`,
          variant: 'destructive'
        })
        continue
      }

      try {
        setUploading(true)
        setUploadProgress(0)

        const response = await suggestionApi.uploadSuggestionFile(file, (progress) => {
          setUploadProgress(progress)
        })

        if (response.success && response.data) {
          const newFile: UploadedFile = {
            name: response.data.fileName || file.name,
            url: response.data.fileUrl,
            size: response.data.fileSize || file.size,
            type: file.type
          }
          
          setUploadedFiles(prev => [...prev, newFile])
          toast({
            title: 'Thành công',
            description: `Đã tải lên "${file.name}"`
          })
        } else {
          toast({
            title: 'Lỗi',
            description: response.error || `Không thể tải lên "${file.name}"`,
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: 'Lỗi',
          description: `Lỗi khi tải lên "${file.name}"`,
          variant: 'destructive'
        })
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ tiêu đề và nội dung',
        variant: 'destructive'
      })
      return
    }

    try {
      setSubmitting(true)

      const suggestionData = {
        ...formData,
        fileUrls: uploadedFiles.map(f => f.url),
        tags: formData.tags.trim() || undefined
      }

      const response = await suggestionApi.createSuggestion(suggestionData)

      if (response.success) {
        onComplete()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi kiến nghị',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi kiến nghị',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return 'Đề xuất cải tiến quy trình, phương pháp làm việc'
      case 'COMPLAINT': return 'Phản ánh vấn đề, sự cố cần được giải quyết'
      case 'IDEA': return 'Ý tưởng mới cho hoạt động, dự án'
      case 'QUESTION': return 'Câu hỏi, thắc mắc cần được giải đáp'
      case 'OTHER': return 'Các kiến nghị khác không thuộc danh mục trên'
      default: return ''
    }
  }

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Cần xử lý ngay lập tức'
      case 'HIGH': return 'Ưu tiên cao, xử lý trong vài ngày'
      case 'MEDIUM': return 'Ưu tiên trung bình, xử lý trong tuần'
      case 'LOW': return 'Ưu tiên thấp, có thể xử lý sau'
      default: return ''
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-600" />
    } else {
      return <Paperclip className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gửi kiến nghị</h1>
          <p className="text-muted-foreground">
            Chia sẻ góp ý, ý tưởng hoặc phản ánh của bạn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Điền thông tin chính về kiến nghị của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Tóm tắt ngắn gọn nội dung kiến nghị..."
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200 ký tự
                </div>
              </div>

              <div>
                <Label htmlFor="content">Nội dung chi tiết *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Mô tả chi tiết về kiến nghị, bao gồm vấn đề gặp phải và giải pháp đề xuất..."
                  rows={6}
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.content.length}/2000 ký tự
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMPROVEMENT">Cải tiến</SelectItem>
                      <SelectItem value="COMPLAINT">Phản ánh</SelectItem>
                      <SelectItem value="IDEA">Ý tưởng</SelectItem>
                      <SelectItem value="QUESTION">Thắc mắc</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getCategoryDescription(formData.category)}
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Mức độ ưu tiên</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Thấp</SelectItem>
                      <SelectItem value="MEDIUM">Trung bình</SelectItem>
                      <SelectItem value="HIGH">Cao</SelectItem>
                      <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getPriorityDescription(formData.priority)}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Thẻ tags (tuỳ chọn)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Ví dụ: công nghệ, quy trình, đào tạo (cách nhau bằng dấu phẩy)"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Giúp phân loại và tìm kiếm kiến nghị dễ dàng hơn
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>File đính kèm</CardTitle>
              <CardDescription>
                Đính kèm hình ảnh, tài liệu hỗ trợ (tối đa 10MB/file)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click để chọn file hoặc kéo thả vào đây
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, PDF, DOC, TXT - Tối đa 10MB
                    </p>
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Đang tải lên...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>File đã tải lên:</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Privacy Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tuỳ chọn riêng tư</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleInputChange('isAnonymous', checked)}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="anonymous" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Gửi ẩn danh
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tên của bạn sẽ không hiển thị công khai
                  </p>
                </div>
              </div>

              {formData.isAnonymous ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Kiến nghị của bạn sẽ được gửi ẩn danh. Chỉ Admin có thể xem thông tin người gửi để phản hồi.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Tên và đơn vị của bạn sẽ hiển thị công khai cùng với kiến nghị.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Viết tiêu đề ngắn gọn, dễ hiểu</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Mô tả chi tiết vấn đề và giải pháp đề xuất</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Đính kèm hình ảnh, tài liệu minh hoạ nếu có</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Chọn danh mục và mức độ ưu tiên phù hợp</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Bạn sẽ nhận được thông báo khi có phản hồi</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="w-full"
            >
              {submitting ? 'Đang gửi...' : 'Gửi kiến nghị'}
            </Button>
            
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="w-full"
            >
              Hủy
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}






