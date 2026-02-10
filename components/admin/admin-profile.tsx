"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, Mail, Phone, MapPin, Calendar, Save, RefreshCw, Edit, Key, 
  Shield, Award, Sparkles, CheckCircle2, X, Eye, EyeOff, Camera
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BACKEND_URL } from "@/lib/config"

const API_URL = BACKEND_URL

interface AdminProfileProps {
  currentUser: any
}

// Custom event for profile updates
const PROFILE_UPDATE_EVENT = 'admin-profile-updated'

export function AdminProfile({ currentUser }: AdminProfileProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    youthPosition: ""
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    setAnimateIn(true)
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : "",
        youthPosition: currentUser.youthPosition || ""
      })
    }
  }, [currentUser])

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Lỗi",
        description: "Họ và tên không được để trống",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          youthPosition: formData.youthPosition || undefined
        })
      })

      if (res.ok) {
        const updatedUser = await res.json()
        const stored = localStorage.getItem("currentUser")
        if (stored) {
          const userData = JSON.parse(stored)
          userData.fullName = formData.fullName
          userData.phone = formData.phone
          userData.address = formData.address
          userData.dateOfBirth = formData.dateOfBirth
          userData.youthPosition = formData.youthPosition
          localStorage.setItem("currentUser", JSON.stringify(userData))
        }
        
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin cá nhân đã được lưu",
          variant: "success"
        })
        setEditMode(false)
        // Dispatch event to notify parent of update
        window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT))
      } else {
        const error = await res.json()
        throw new Error(error.message || "Không thể cập nhật thông tin")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users/${currentUser.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (res.ok) {
        toast({
          title: "Đổi mật khẩu thành công",
          description: "Mật khẩu mới đã được cập nhật",
          variant: "success"
        })
        setShowPasswordForm(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        const error = await res.json()
        throw new Error(error.message || "Không thể đổi mật khẩu")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [formData.fullName, formData.email, formData.phone, formData.address, formData.dateOfBirth, formData.youthPosition]
    const filled = fields.filter(f => f && f.trim() !== "").length
    return Math.round((filled / fields.length) * 100)
  }

  const completion = calculateCompletion()

  return (
    <div className={`space-y-6 transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-6 text-white shadow-xl">
        {/* Animated background patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar with ring effect */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
            <Avatar className="relative h-28 w-28 ring-4 ring-white/50 shadow-2xl">
              <AvatarImage src={currentUser?.avatarUrl || "/placeholder-user.jpg"} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-red-600 to-rose-600 text-white font-bold">
                {currentUser?.fullName?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-red-500 hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h2 className="text-3xl font-bold">{currentUser?.fullName || "Admin"}</h2>
              <CheckCircle2 className="h-6 w-6 text-yellow-300" />
            </div>
            <p className="text-white/80 flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4" />
              {currentUser?.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                <Shield className="h-4 w-4" />
                Quản trị viên
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/30 backdrop-blur-sm text-sm font-medium">
                <Award className="h-4 w-4" />
                {currentUser?.youthPosition || "Bí thư Đoàn trường"}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {!editMode && (
            <Button 
              onClick={() => setEditMode(true)}
              className="bg-white text-red-500 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>

        {/* Profile Completion Bar */}
        <div className="relative z-10 mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/80">Hoàn thiện hồ sơ</span>
            <span className="text-sm font-bold">{completion}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 transition-colors">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Họ và tên</p>
                    <p className="font-semibold text-gray-900">{formData.fullName || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 transition-colors">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">{formData.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 transition-colors">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="font-semibold text-gray-900">
                      {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 transition-colors">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold text-gray-900 line-clamp-1">{formData.address || "Chưa cập nhật"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
                  <Key className="h-4 w-4" />
                </div>
                Bảo mật tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showPasswordForm ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">Mật khẩu hiện tại</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="shrink-0 h-9 w-9"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">Mật khẩu mới</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="shrink-0 h-9 w-9"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="shrink-0 h-9 w-9"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Lưu
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card className={`lg:col-span-2 overflow-hidden border-0 shadow-lg transition-all duration-500 ${editMode ? 'ring-2 ring-red-200 shadow-red-100' : ''}`}>
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Thông tin chi tiết
              {editMode && (
                <span className="ml-auto text-sm font-normal text-red-500 animate-pulse">
                  Đang chỉnh sửa...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2 group">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium group-focus-within:text-red-500 transition-colors">
                  <User className="h-4 w-4" />
                  Họ và tên
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!editMode}
                  placeholder="Nhập họ và tên"
                  className={`transition-all duration-300 ${editMode ? 'border-red-200 focus:border-red-400 focus:ring-red-100' : 'bg-gray-50'}`}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  Email
                  <span className="ml-auto text-xs text-gray-400 italic">Không thể thay đổi</span>
                </Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2 group">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium group-focus-within:text-red-500 transition-colors">
                  <Phone className="h-4 w-4" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editMode}
                  placeholder="0901234567"
                  className={`transition-all duration-300 ${editMode ? 'border-red-200 focus:border-red-400 focus:ring-red-100' : 'bg-gray-50'}`}
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2 group">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-sm font-medium group-focus-within:text-red-500 transition-colors">
                  <Calendar className="h-4 w-4" />
                  Ngày sinh
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={!editMode}
                  className={`transition-all duration-300 ${editMode ? 'border-red-200 focus:border-red-400 focus:ring-red-100' : 'bg-gray-50'}`}
                />
              </div>

              {/* Youth Position */}
              <div className="space-y-2 group">
                <Label htmlFor="youthPosition" className="flex items-center gap-2 text-sm font-medium group-focus-within:text-red-500 transition-colors">
                  <Award className="h-4 w-4" />
                  Chức vụ Đoàn
                </Label>
                <Input
                  id="youthPosition"
                  value={formData.youthPosition}
                  onChange={(e) => setFormData({ ...formData, youthPosition: e.target.value })}
                  disabled={!editMode}
                  placeholder="VD: Bí thư Đoàn trường"
                  className={`transition-all duration-300 ${editMode ? 'border-red-200 focus:border-red-400 focus:ring-red-100' : 'bg-gray-50'}`}
                />
              </div>

              {/* Address - Full width */}
              <div className="space-y-2 md:col-span-2 group">
                <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium group-focus-within:text-red-500 transition-colors">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                  placeholder="Nhập địa chỉ chi tiết..."
                  rows={3}
                  className={`resize-none transition-all duration-300 ${editMode ? 'border-red-200 focus:border-red-400 focus:ring-red-100' : 'bg-gray-50'}`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {editMode && (
              <div className="flex gap-3 pt-6 mt-6 border-t animate-in slide-in-from-bottom-2 duration-300">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 md:flex-none bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu thay đổi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(false)
                    setFormData({
                      fullName: currentUser?.fullName || "",
                      email: currentUser?.email || "",
                      phone: currentUser?.phone || "",
                      address: currentUser?.address || "",
                      dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : "",
                      youthPosition: currentUser?.youthPosition || ""
                    })
                  }}
                  className="flex-1 md:flex-none hover:bg-gray-100 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy bỏ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
