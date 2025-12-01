"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User, Lock, BookOpen, HelpCircle, Phone } from "lucide-react"

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const credentials = {
        username: formData.get('username') as string,
        password: formData.get('password') as string,
      }

      const { authApi } = await import('@/lib/api')
      const response = await authApi.login(credentials)

      if (response.success) {
        onSuccess()
      } else {
        alert(response.error || 'Đăng nhập thất bại')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Có lỗi xảy ra khi đăng nhập')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dong-son-pattern flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-45dBaXjOFmJL3PNpO7UAJpFLpiByiT.png"
              alt="Youth Union Logo"
              className="w-24 h-24 mx-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-primary-gradient mb-2">SỔ TAY ĐOÀN VIÊN ĐIỆN TỬ</h1>
          <h2 className="text-lg font-semibold text-primary-gradient">TRUNG ĐOÀN 196</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Username Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              className="h-12 pl-12 pr-4 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              className="h-12 pl-12 pr-12 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
            </Button>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#5B2EFF] to-[#0F62FF] hover:from-[#4A25E6] hover:to-[#0E58E6] text-white font-semibold text-base shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
          </Button>

          {/* Forgot Password */}
          <div className="text-center mt-4">
            <button type="button" className="text-gray-600 text-sm hover:text-gray-800" onClick={() => {}}>
              Quên mật khẩu ?
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Action Tiles */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <button className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <BookOpen className="h-6 w-6 text-gray-700 mb-1" />
            <span className="text-xs text-gray-700 text-center leading-tight">
              Hướng dẫn
              <br />
              sử dụng
            </span>
          </button>
          <button className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <HelpCircle className="h-6 w-6 text-gray-700 mb-1" />
            <span className="text-xs text-gray-700 text-center leading-tight">
              Câu hỏi
              <br />
              thường gặp
            </span>
          </button>
          <button className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <Phone className="h-6 w-6 text-gray-700 mb-1" />
            <span className="text-xs text-gray-700 text-center leading-tight">
              Hotline
              <br />
              hỗ trợ
            </span>
          </button>
        </div>

        {/* Version */}
        <div className="text-center">
          <span className="text-xs text-gray-500">Phiên bản 1.0.0</span>
        </div>
      </div>
    </div>
  )
}
