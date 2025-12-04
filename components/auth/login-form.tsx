"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure styles are loaded
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

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

  // Inline styles for mobile compatibility - optimized for Android
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #fef7f0 0%, #fff5eb 50%, #fef7f0 100%)',
    width: '100%',
    maxWidth: '100vw',
    overflow: 'hidden',
  }

  const formContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 24px',
    width: '100%',
    boxSizing: 'border-box',
  }

  const titleStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #5b2eff, #0f62ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
  }

  const inputContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    marginBottom: '16px',
    boxSizing: 'border-box',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '52px',
    paddingLeft: '48px',
    paddingRight: '16px',
    borderRadius: '26px',
    border: '2px solid #e5e7eb',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: 10,
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '56px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    fontWeight: 700,
    fontSize: '17px',
    border: '3px solid #991b1b',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(185, 28, 28, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
    marginTop: '20px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }

  const buttonHoverStyle: React.CSSProperties = {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 30px rgba(185, 28, 28, 0.6)',
  }

  const tileStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: 'none',
    cursor: 'pointer',
    minHeight: '80px',
  }

  if (!isReady) {
    return (
      <div style={containerStyle}>
        <div style={formContainerStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '3px solid #5b2eff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#6b7280' }}>Đang tải...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={containerStyle} className="min-h-screen bg-dong-son-pattern flex flex-col">
      <div style={formContainerStyle} className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px', width: '100%' }} className="text-center mb-8">
          <div style={{ marginBottom: '20px' }} className="mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-45dBaXjOFmJL3PNpO7UAJpFLpiByiT.png"
              alt="Youth Union Logo"
              style={{ width: '88px', height: '88px', margin: '0 auto', objectFit: 'contain' }}
              className="w-24 h-24 mx-auto"
            />
          </div>
          <h1 style={{ ...titleStyle, fontSize: '18px', letterSpacing: '0.5px' }} className="text-xl font-bold text-primary-gradient mb-2">
            SỔ TAY ĐOÀN VIÊN ĐIỆN TỬ
          </h1>
          <h2 style={{ ...titleStyle, fontSize: '16px', fontWeight: 600 }} className="text-lg font-semibold text-primary-gradient">
            TRUNG ĐOÀN 196
          </h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px', boxSizing: 'border-box' }} className="w-full max-w-sm space-y-4">
          {/* Username Input */}
          <div style={inputContainerStyle} className="relative">
            <div style={iconStyle} className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <User style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              style={inputStyle}
              className="h-12 pl-12 pr-4 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm w-full"
              required
            />
          </div>

          {/* Password Input */}
          <div style={inputContainerStyle} className="relative">
            <div style={iconStyle} className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Lock style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              style={{ ...inputStyle, paddingRight: '52px' }}
              className="h-12 pl-12 pr-12 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm w-full"
              required
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 
                <EyeOff style={{ width: '18px', height: '18px', color: '#9ca3af' }} className="h-4 w-4 text-gray-500" /> : 
                <Eye style={{ width: '18px', height: '18px', color: '#9ca3af' }} className="h-4 w-4 text-gray-500" />
              }
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            style={{ 
              ...buttonStyle, 
              opacity: isLoading ? 0.9 : 1,
              background: isLoading 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                }} />
                ĐANG XỬ LÝ...
              </span>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            button[type="submit"]:active {
              transform: scale(0.98);
            }
          `}</style>

          {/* Forgot Password */}
          <div style={{ textAlign: 'center', marginTop: '16px' }} className="text-center mt-4">
            <button 
              type="button" 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#6b7280', 
                fontSize: '14px',
                cursor: 'pointer'
              }}
              className="text-gray-600 text-sm hover:text-gray-800" 
              onClick={() => {}}
            >
              Quên mật khẩu ?
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Action Tiles */}
      <div style={{ padding: '0 24px 28px', width: '100%', boxSizing: 'border-box' }} className="px-6 pb-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', maxWidth: '320px', margin: '0 auto 16px' }} className="grid grid-cols-3 gap-4 mb-4">
          <button style={tileStyle} className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <BookOpen style={{ width: '22px', height: '22px', color: '#374151', marginBottom: '6px' }} className="h-6 w-6 text-gray-700 mb-1" />
            <span style={{ fontSize: '11px', color: '#374151', textAlign: 'center', lineHeight: '1.3' }} className="text-xs text-gray-700 text-center leading-tight">
              Hướng dẫn<br />sử dụng
            </span>
          </button>
          <button style={tileStyle} className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <HelpCircle style={{ width: '22px', height: '22px', color: '#374151', marginBottom: '6px' }} className="h-6 w-6 text-gray-700 mb-1" />
            <span style={{ fontSize: '11px', color: '#374151', textAlign: 'center', lineHeight: '1.3' }} className="text-xs text-gray-700 text-center leading-tight">
              Câu hỏi<br />thường gặp
            </span>
          </button>
          <button style={tileStyle} className="flex flex-col items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
            <Phone style={{ width: '22px', height: '22px', color: '#374151', marginBottom: '6px' }} className="h-6 w-6 text-gray-700 mb-1" />
            <span style={{ fontSize: '11px', color: '#374151', textAlign: 'center', lineHeight: '1.3' }} className="text-xs text-gray-700 text-center leading-tight">
              Hotline<br />hỗ trợ
            </span>
          </button>
        </div>

        {/* Version */}
        <div style={{ textAlign: 'center' }} className="text-center">
          <span style={{ fontSize: '12px', color: '#9ca3af' }} className="text-xs text-gray-500">Phiên bản 1.0.0</span>
        </div>
      </div>
    </div>
  )
}
