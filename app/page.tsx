"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { MainApp } from "@/components/main-app"
import { isAuthenticated } from "@/lib/api"

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      setIsLoading(false)
    }

    // Small delay to ensure everything is loaded
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleAuthSuccess = () => {
    setIsAuth(true)
  }

  const handleLogout = () => {
    setIsAuth(false)
  }

  // Inline loading styles for mobile compatibility
  const loadingContainerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fef7f0 0%, #fff5eb 50%, #fef7f0 100%)',
  }

  const spinnerStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#5b2eff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  }

  if (isLoading) {
    return (
      <div style={loadingContainerStyle} className="min-h-screen bg-background flex items-center justify-center">
        <div style={{ textAlign: 'center' }} className="text-center">
          <div style={spinnerStyle} className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: '#6b7280' }} className="text-muted-foreground">Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (isAuth) {
    return <MainApp onLogout={handleLogout} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fef7f0 0%, #fff5eb 50%, #fef7f0 100%)' }} className="min-h-screen bg-background">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px' }} className="flex items-center justify-center min-h-screen p-4">
        <div style={{ width: '100%', maxWidth: '448px' }} className="w-full max-w-md">
          {showRegister ? (
            <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
