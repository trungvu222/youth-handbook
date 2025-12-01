"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { MainApp } from "@/components/main-app"
import { ApiTest } from "@/components/debug/api-test"
import { IconTest } from "@/components/debug/icon-test"
import LoginTest from "@/components/debug/login-test"
import DataDebug from "@/components/debug/data-debug"
import { isAuthenticated } from "@/lib/api"

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showIconTest, setShowIconTest] = useState(false)
  const [showLoginTest, setShowLoginTest] = useState(false)
  const [showDataDebug, setShowDataDebug] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthSuccess = () => {
    setIsAuth(true)
  }

  const handleLogout = () => {
    setIsAuth(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (isAuth) {
    return <MainApp onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Debug Toggle */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm block w-full"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
        <button 
          onClick={() => setShowIconTest(!showIconTest)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm block w-full"
        >
          {showIconTest ? 'Hide Icons' : 'Test Icons'}
        </button>
        <button 
          onClick={() => setShowLoginTest(!showLoginTest)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm block w-full"
        >
          {showLoginTest ? 'Hide Login Test' : 'Test Login'}
        </button>
        <button 
          onClick={() => setShowDataDebug(!showDataDebug)}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm block w-full"
        >
          {showDataDebug ? 'Hide Data Debug' : 'Data Debug'}
        </button>
      </div>

      {showDebug ? (
        <ApiTest />
      ) : showIconTest ? (
        <IconTest />
      ) : showLoginTest ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <LoginTest />
        </div>
      ) : showDataDebug ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <DataDebug />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {showRegister ? (
              <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSuccess={handleAuthSuccess} onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
