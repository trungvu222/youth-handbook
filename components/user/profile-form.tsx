"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Save, 
  Upload, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap,
  Briefcase,
  Globe,
  Monitor,
  Book
} from "lucide-react"

interface ProfileFormData {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  birthPlace: string
  address: string
  province: string
  district: string
  ward: string
  title: string
  dateJoined: string
  workPlace: string
  ethnicity: string
  religion: string
  educationLevel: string
  majorLevel: string
  itLevel: string
  languageLevel: string
  politicsLevel: string
  youthPosition: string
}

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>
  onSave?: (data: ProfileFormData) => Promise<void>
  readonly?: boolean
}

const educationLevels = [
  "Tiểu học",
  "Trung học cơ sở",
  "Trung học phổ thông",
  "Trung cấp",
  "Cao đẳng",
  "Đại học",
  "Thạc sĩ",
  "Tiến sĩ"
]

const skillLevels = [
  "Chưa có",
  "Cơ bản",
  "Trung bình",
  "Khá",
  "Giỏi",
  "Xuất sắc"
]

const youthPositions = [
  "Đoàn viên",
  "Tổ trưởng",
  "Tổ phó",
  "Bí thư Chi đoàn",
  "Phó Bí thư Chi đoàn",
  "Ủy viên BCH Chi đoàn",
  "Bí thư Đoàn cơ sở",
  "Phó Bí thư Đoàn cơ sở"
]

export default function ProfileForm({ 
  initialData = {}, 
  onSave,
  readonly = false 
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: initialData.fullName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    dateOfBirth: initialData.dateOfBirth || "",
    birthPlace: initialData.birthPlace || "",
    address: initialData.address || "",
    province: initialData.province || "",
    district: initialData.district || "",
    ward: initialData.ward || "",
    title: initialData.title || "",
    dateJoined: initialData.dateJoined || "",
    workPlace: initialData.workPlace || "",
    ethnicity: initialData.ethnicity || "Kinh",
    religion: initialData.religion || "",
    educationLevel: initialData.educationLevel || "",
    majorLevel: initialData.majorLevel || "",
    itLevel: initialData.itLevel || "",
    languageLevel: initialData.languageLevel || "",
    politicsLevel: initialData.politicsLevel || "",
    youthPosition: initialData.youthPosition || "Đoàn viên"
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readonly || !onSave) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      await onSave(formData)
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật hồ sơ' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (
    label: string,
    field: keyof ProfileFormData,
    type: 'text' | 'email' | 'date' | 'tel' | 'textarea' | 'select' = 'text',
    options?: string[],
    icon?: React.ReactNode
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </Label>
      {type === 'textarea' ? (
        <Textarea
          id={field}
          value={formData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          disabled={readonly}
          rows={3}
        />
      ) : type === 'select' ? (
        <Select 
          value={formData[field]} 
          onValueChange={(value) => handleChange(field, value)}
          disabled={readonly}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Chọn ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field}
          type={type}
          value={formData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          disabled={readonly}
        />
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Họ và tên", "fullName", "text", undefined, <User className="w-4 h-4" />)}
            {renderField("Email", "email", "email", undefined, <Mail className="w-4 h-4" />)}
            {renderField("Số điện thoại", "phone", "tel", undefined, <Phone className="w-4 h-4" />)}
            {renderField("Ngày sinh", "dateOfBirth", "date", undefined, <Calendar className="w-4 h-4" />)}
            {renderField("Nơi sinh", "birthPlace", "text", undefined, <MapPin className="w-4 h-4" />)}
            {renderField("Dân tộc", "ethnicity", "text", undefined)}
            {renderField("Tôn giáo", "religion", "text", undefined)}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            Thông tin địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField("Tỉnh/Thành phố", "province", "text")}
            {renderField("Quận/Huyện", "district", "text")}
            {renderField("Phường/Xã", "ward", "text")}
          </div>
          {renderField("Địa chỉ chi tiết", "address", "textarea")}
        </CardContent>
      </Card>

      {/* Youth Union Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-600" />
            Thông tin Đoàn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Chức danh", "title", "text")}
            {renderField("Ngày vào Đoàn", "dateJoined", "date", undefined, <Calendar className="w-4 h-4" />)}
            {renderField("Nơi sinh hoạt", "workPlace", "text", undefined, <MapPin className="w-4 h-4" />)}
            {renderField("Chức vụ Đoàn", "youthPosition", "select", youthPositions)}
          </div>
        </CardContent>
      </Card>

      {/* Education & Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600" />
            Trình độ học vấn & kỹ năng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Trình độ văn hóa", "educationLevel", "select", educationLevels, <Book className="w-4 h-4" />)}
            {renderField("Trình độ chuyên môn", "majorLevel", "select", skillLevels, <Briefcase className="w-4 h-4" />)}
            {renderField("Trình độ tin học", "itLevel", "select", skillLevels, <Monitor className="w-4 h-4" />)}
            {renderField("Trình độ ngoại ngữ", "languageLevel", "select", skillLevels, <Globe className="w-4 h-4" />)}
            {renderField("Trình độ lý luận chính trị", "politicsLevel", "select", skillLevels, <Book className="w-4 h-4" />)}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {!readonly && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

