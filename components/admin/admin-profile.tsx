"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Calendar, Save, RefreshCw, Edit, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com"

interface AdminProfileProps {
  currentUser: any
  onUpdate: () => void
}

export function AdminProfile({ currentUser, onUpdate }: AdminProfileProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  
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
        // Update localStorage
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
          title: "Thành công",
          description: "Đã cập nhật thông tin cá nhân"
        })
        setEditMode(false)
        onUpdate()
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
          title: "Thành công",
          description: "Đã đổi mật khẩu thành công"
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hồ sơ cá nhân</h2>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
        </div>
        {!editMode && (
          <Button onClick={() => setEditMode(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="text-2xl bg-red-100 text-red-600">
                  {currentUser?.fullName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{currentUser?.fullName}</h3>
              <p className="text-muted-foreground">{currentUser?.email}</p>
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                Quản trị viên
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  <User className="h-4 w-4 inline mr-2" />
                  Họ và tên
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!editMode}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editMode}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Ngày sinh
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youthPosition">
                  <User className="h-4 w-4 inline mr-2" />
                  Chức vụ Đoàn
                </Label>
                <Input
                  id="youthPosition"
                  value={formData.youthPosition}
                  onChange={(e) => setFormData({ ...formData, youthPosition: e.target.value })}
                  disabled={!editMode}
                  placeholder="VD: Ban chấp hành Đoàn Cơ sở"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Địa chỉ
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                  placeholder="Nhập địa chỉ"
                  rows={2}
                />
              </div>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lưu thay đổi
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditMode(false)
                  setFormData({
                    fullName: currentUser?.fullName || "",
                    email: currentUser?.email || "",
                    phone: currentUser?.phone || "",
                    address: currentUser?.address || "",
                    dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : ""
                  })
                }}>
                  Hủy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                Đổi mật khẩu
              </Button>
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Đổi mật khẩu
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                  }}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
