"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Users } from "lucide-react"

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const firstName = formData.get('firstName') as string
      const lastName = formData.get('lastName') as string
      const emailValue = (formData.get('email') as string)?.trim()
      const phoneValue = (formData.get('phone') as string)?.trim()
      
      // Allow registration with email OR phone (at least one required)
      if (!emailValue && !phoneValue) {
        alert('Vui lòng nhập email hoặc số điện thoại')
        setIsLoading(false)
        return
      }

      const identifier = emailValue || phoneValue
      
      const userData = {
        username: identifier, // Use email or phone as username
        email: emailValue || undefined,
        password: formData.get('password') as string,
        fullName: `${firstName} ${lastName}`,
        phone: phoneValue || undefined,
      }

      const { authApi } = await import('@/lib/api')
      const response = await authApi.register(userData)

      if (response.success) {
        onSuccess()
      } else {
        alert(response.error || 'Đăng ký thất bại')
      }
    } catch (error) {
      console.error('Register error:', error)
      alert('Có lỗi xảy ra khi đăng ký')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Users className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Đăng ký tài khoản</CardTitle>
        <CardDescription>Tạo tài khoản mới để tham gia hoạt động Đoàn</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input id="firstName" name="firstName" type="text" placeholder="Nhập họ" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input id="lastName" name="lastName" type="text" placeholder="Nhập tên" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(hoặc SĐT)</span></Label>
            <Input id="email" name="email" type="email" placeholder="Nhập email (không bắt buộc)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại <span className="text-muted-foreground text-xs">(hoặc Email)</span></Label>
            <Input id="phone" name="phone" type="tel" placeholder="Nhập số điện thoại (không bắt buộc)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Đơn vị</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unit1">Đơn vị 1</SelectItem>
                <SelectItem value="unit2">Đơn vị 2</SelectItem>
                <SelectItem value="unit3">Đơn vị 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chidoan">Chi Đoàn</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn Chi Đoàn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chidoan1">Chi Đoàn A</SelectItem>
                <SelectItem value="chidoan2">Chi Đoàn B</SelectItem>
                <SelectItem value="chidoan3">Chi Đoàn C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" required />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Đã có tài khoản? </span>
          <Button variant="link" className="p-0 h-auto font-normal" onClick={onSwitchToLogin}>
            Đăng nhập ngay
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
