"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, User, Lock, BookOpen, HelpCircle, Phone, AlertCircle, X, Mail, ArrowLeft, KeyRound, CheckCircle2, ChevronDown, ChevronUp, Shield, Smartphone, ClipboardList, MessageCircle, Star, Users } from "lucide-react"
import { BACKEND_URL } from "@/lib/config"

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

type ViewState = 'login' | 'forgot-choose' | 'forgot-email' | 'forgot-phone' | 'verify-otp' | 'reset-password' | 'forgot-success' | 'guide' | 'faq' | 'hotline'

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [failCount, setFailCount] = useState(0)
  const [view, setView] = useState<ViewState>('login')
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPhone, setForgotPhone] = useState('')
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const autoResendOtp = async () => {
    try {
      const method = forgotEmail ? 'email' : 'phone'
      const contact = method === 'email' ? forgotEmail : forgotPhone
      const requestBody: any = { method, contact }
      if (method === 'phone') requestBody.identifier = forgotIdentifier
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const data = await response.json()
      if (data.success) {
        setResetToken(data.resetToken || '')
        if (data.devOtp) setDevOtp(data.devOtp)
        setOtpCode(['', '', '', '', '', ''])
        setCountdown(60)
        setForgotSuccess('Mã OTP mới đã được gửi')
      }
    } catch (err) { /* silent */ }
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && view === 'verify-otp' && (forgotEmail || forgotPhone)) {
      autoResendOtp()
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
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
        const newCount = failCount + 1
        setFailCount(newCount)
        setErrorMsg(response.error || 'Thông tin tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại')
      }
    } catch (error) {
      console.error('Login error:', error)
      const newCount = failCount + 1
      setFailCount(newCount)
      setErrorMsg('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== FORGOT PASSWORD HANDLERS =====
  const handleForgotSubmit = async () => {
    setForgotError('')
    setForgotSuccess('')
    setForgotLoading(true)
    try {
      const method = view === 'forgot-email' ? 'email' : 'phone'
      const contact = method === 'email' ? forgotEmail : forgotPhone
      if (!contact) {
        setForgotError(method === 'email' ? 'Vui lòng nhập email' : 'Vui lòng nhập số điện thoại')
        setForgotLoading(false)
        return
      }
      if (method === 'phone' && !forgotIdentifier) {
        setForgotError('Vui lòng nhập tên đăng nhập hoặc email')
        setForgotLoading(false)
        return
      }
      const requestBody: any = { method, contact }
      if (method === 'phone') requestBody.identifier = forgotIdentifier
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const data = await response.json()
      if (data.success) {
        setResetToken(data.resetToken || '')
        if (data.devOtp) setDevOtp(data.devOtp)
        setForgotSuccess(data.message || 'Mã OTP đã được gửi')
        setCountdown(60)
        setView('verify-otp')
      } else {
        setForgotError(data.error || 'Không tìm thấy tài khoản')
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setForgotError('')
    setForgotLoading(true)
    const code = otpCode.join('')
    if (code.length !== 6) {
      setForgotError('Vui lòng nhập đủ 6 số OTP')
      setForgotLoading(false)
      return
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code, resetToken })
      })
      const data = await response.json()
      if (data.success) {
        setResetToken(data.resetToken || resetToken)
        setView('reset-password')
      } else {
        setForgotError(data.error || 'Mã OTP không đúng')
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setForgotError('')
    if (newPassword.length < 6) { setForgotError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (newPassword !== confirmPassword) { setForgotError('Mật khẩu xác nhận không khớp'); return }
    setForgotLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      })
      const data = await response.json()
      if (data.success) {
        setView('forgot-success')
      } else {
        setForgotError(data.error || 'Có lỗi xảy ra')
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpCode]
    newOtp[index] = value
    setOtpCode(newOtp)
    if (value && index < 5) document.getElementById(`motp-${index + 1}`)?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`motp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newOtp = [...otpCode]
      for (let i = 0; i < pasted.length && i < 6; i++) newOtp[i] = pasted[i]
      setOtpCode(newOtp)
      document.getElementById(`motp-${Math.min(pasted.length, 5)}`)?.focus()
    }
  }

  const resetForgotState = () => {
    setForgotEmail(''); setForgotPhone(''); setForgotIdentifier('')
    setOtpCode(['', '', '', '', '', ''])
    setNewPassword(''); setConfirmPassword('')
    setForgotError(''); setForgotSuccess(''); setResetToken(''); setDevOtp('')
    setCountdown(0); setView('login')
  }

  // ===== STYLES =====
  const tileStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '16px 8px', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(220,38,38,0.1)', cursor: 'pointer', minHeight: '80px',
    transition: 'all 0.2s ease',
  }

  // ===== MODAL OVERLAY =====
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px',
    animation: 'mFadeIn 0.25s ease',
  }
  const modalStyle: React.CSSProperties = {
    width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto',
    background: '#fff', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    animation: 'mSlideUp 0.3s ease',
  }
  const modalHeaderStyle = (gradient: string): React.CSSProperties => ({
    background: gradient, padding: '24px 20px 20px', position: 'relative', borderRadius: '20px 20px 0 0',
  })
  const modalCloseBtn: React.CSSProperties = {
    position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.2)',
    border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
  }
  const modalInputStyle: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 16px', paddingLeft: '44px',
    borderRadius: '14px', border: '1.5px solid #e5e7eb', boxShadow: 'none',
    fontSize: '15px', outline: 'none', background: '#f9fafb', color: '#1f2937',
    boxSizing: 'border-box',
  }
  const modalBtnStyle = (bg: string): React.CSSProperties => ({
    width: '100%', height: '48px', borderRadius: '14px', background: bg,
    color: '#fff', fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s',
  })

  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #7f1d1d 0%, #dc2626 60%, #fca5a5 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ===== FORGOT PASSWORD MODAL VIEWS =====
  const renderForgotModal = () => {
    if (!['forgot-choose', 'forgot-email', 'forgot-phone', 'verify-otp', 'reset-password', 'forgot-success'].includes(view)) return null

    const errorBox = forgotError ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '12px' }}>
        <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '13px', color: '#dc2626', lineHeight: 1.4 }}>{forgotError}</span>
      </div>
    ) : null

    const successBox = forgotSuccess ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '12px' }}>
        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '13px', color: '#16a34a', lineHeight: 1.4 }}>{forgotSuccess}</span>
      </div>
    ) : null

    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) resetForgotState() }}>
        <div style={modalStyle}>
          {/* ===== CHOOSE METHOD ===== */}
          {view === 'forgot-choose' && (
            <>
              <div style={modalHeaderStyle('linear-gradient(135deg, #f59e0b, #f97316)')}>
                <button style={modalCloseBtn} onClick={resetForgotState}><X style={{ width: 16, height: 16 }} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                    <KeyRound style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Quên mật khẩu?</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Chọn phương thức khôi phục tài khoản</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <button onClick={() => { setView('forgot-email'); setForgotError(''); setForgotSuccess('') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s' }}>
                  <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px', margin: 0 }}>Gửi mã qua Email</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0' }}>Nhận mã OTP qua email đã đăng ký</p>
                  </div>
                </button>
                <button onClick={() => { setView('forgot-phone'); setForgotError(''); setForgotSuccess('') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #22c55e, #10b981)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px', margin: 0 }}>Gửi mã qua SMS</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0' }}>Nhận mã OTP qua số điện thoại</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ===== EMAIL FORM ===== */}
          {view === 'forgot-email' && (
            <>
              <div style={modalHeaderStyle('linear-gradient(135deg, #3b82f6, #06b6d4)')}>
                <button style={modalCloseBtn} onClick={resetForgotState}><X style={{ width: 16, height: 16 }} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                    <Mail style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Khôi phục qua Email</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Nhập email đã đăng ký để nhận mã OTP</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                {errorBox}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Nhập email của bạn" style={modalInputStyle} />
                </div>
                <button onClick={handleForgotSubmit} disabled={forgotLoading} style={{ ...modalBtnStyle('linear-gradient(135deg, #3b82f6, #06b6d4)'), opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
                <button onClick={() => setView('forgot-choose')} style={{ width: '100%', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ArrowLeft style={{ width: 14, height: 14 }} /> Chọn phương thức khác
                </button>
              </div>
            </>
          )}

          {/* ===== PHONE FORM ===== */}
          {view === 'forgot-phone' && (
            <>
              <div style={modalHeaderStyle('linear-gradient(135deg, #22c55e, #10b981)')}>
                <button style={modalCloseBtn} onClick={resetForgotState}><X style={{ width: 16, height: 16 }} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                    <Phone style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Khôi phục qua SMS</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Nhập tài khoản và SĐT để nhận mã OTP</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                {errorBox}
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Tên đăng nhập hoặc Email</label>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input type="text" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} placeholder="Nhập tên đăng nhập" style={modalInputStyle} />
                </div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Số điện thoại nhận OTP</label>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input type="tel" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} placeholder="Nhập SĐT của bạn" style={modalInputStyle} />
                </div>
                <button onClick={handleForgotSubmit} disabled={forgotLoading} style={{ ...modalBtnStyle('linear-gradient(135deg, #22c55e, #10b981)'), opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
                <button onClick={() => setView('forgot-choose')} style={{ width: '100%', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ArrowLeft style={{ width: 14, height: 14 }} /> Chọn phương thức khác
                </button>
              </div>
            </>
          )}

          {/* ===== VERIFY OTP ===== */}
          {view === 'verify-otp' && (
            <>
              <div style={modalHeaderStyle('linear-gradient(135deg, #8b5cf6, #a855f7)')}>
                <button style={modalCloseBtn} onClick={resetForgotState}><X style={{ width: 16, height: 16 }} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                    <KeyRound style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Nhập mã OTP</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Mã đã gửi đến {forgotEmail || forgotPhone}</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                {errorBox}
                {successBox}
                {devOtp && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, margin: 0 }}>Mã OTP</p>
                      {countdown > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: countdown <= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, color: countdown <= 10 ? '#ef4444' : '#d97706', animation: countdown <= 10 ? 'errorShake 0.5s ease' : 'none' }}>
                          ⏱ {countdown}s
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#d97706', letterSpacing: '8px', fontFamily: 'monospace', margin: 0 }}>{devOtp}</p>
                    {/* Progress bar */}
                    <div style={{ marginTop: '10px', height: '4px', background: 'rgba(245,158,11,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: '100%',
                          background: countdown <= 10 ? '#ef4444' : 'linear-gradient(90deg, #f59e0b, #f97316)',
                          transform: `scaleX(${Math.max(0, Math.min(1, countdown / 60))})`,
                          transformOrigin: 'left center',
                          transition: 'transform 1s linear',
                          willChange: 'transform',
                        }}
                      />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
                  {otpCode.map((digit, i) => (
                    <input key={i} id={`motp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 700, border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', background: '#fafafa', transition: 'all 0.2s' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  ))}
                </div>
                <button onClick={handleVerifyOtp} disabled={forgotLoading} style={{ ...modalBtnStyle('linear-gradient(135deg, #8b5cf6, #a855f7)'), opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Đang xác thực...' : 'Xác nhận OTP'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  {countdown > 0 ? (
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>Mã mới sẽ tự động gửi sau {countdown}s</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                      Đang gửi mã OTP mới...
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===== RESET PASSWORD ===== */}
          {view === 'reset-password' && (
            <>
              <div style={modalHeaderStyle('linear-gradient(135deg, #10b981, #14b8a6)')}>
                <button style={modalCloseBtn} onClick={resetForgotState}><X style={{ width: 16, height: 16 }} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                    <Lock style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Đặt mật khẩu mới</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Tạo mật khẩu mới cho tài khoản</p>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                {errorBox}
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" style={{ ...modalInputStyle, paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    {showNewPassword ? <EyeOff style={{ width: 16, height: 16, color: '#9ca3af' }} /> : <Eye style={{ width: 16, height: 16, color: '#9ca3af' }} />}
                  </button>
                </div>
                {newPassword && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} style={{ flex: 1, height: '4px', borderRadius: '2px', background: newPassword.length >= level * 3 ? level <= 1 ? '#ef4444' : level <= 2 ? '#f59e0b' : level <= 3 ? '#3b82f6' : '#22c55e' : '#e5e7eb', transition: 'all 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{newPassword.length < 6 ? 'Yếu - cần ít nhất 6 ký tự' : newPassword.length < 8 ? 'Trung bình' : newPassword.length < 12 ? 'Mạnh' : 'Rất mạnh'}</p>
                  </div>
                )}
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '6px' }}>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" style={modalInputStyle} />
                </div>
                <button onClick={handleResetPassword} disabled={forgotLoading} style={{ ...modalBtnStyle('linear-gradient(135deg, #10b981, #14b8a6)'), opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </>
          )}

          {/* ===== SUCCESS ===== */}
          {view === 'forgot-success' && (
            <>
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>Thành công!</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, margin: '0 0 24px' }}>Mật khẩu đã được cập nhật thành công.<br/>Bạn có thể đăng nhập với mật khẩu mới.</p>
                <button onClick={resetForgotState} style={modalBtnStyle('linear-gradient(135deg, #3b82f6, #6366f1)')}>
                  Quay lại đăng nhập
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ===== GUIDE MODAL =====
  const guideSteps = [
    { icon: <User style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #3b82f6, #6366f1)', title: 'Đăng nhập tài khoản', desc: 'Sử dụng tên đăng nhập, email hoặc số điện thoại đã được quản trị viên cấp để đăng nhập vào ứng dụng.' },
    { icon: <ClipboardList style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #f59e0b, #f97316)', title: 'Xem hoạt động & Điểm danh', desc: 'Theo dõi lịch hoạt động của đơn vị, đăng ký tham gia và điểm danh trực tiếp qua ứng dụng.' },
    { icon: <BookOpen style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #22c55e, #10b981)', title: 'Tài liệu & Học tập', desc: 'Truy cập kho tài liệu, bài giảng và nội dung học tập được chia sẻ bởi quản trị viên.' },
    { icon: <Star style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #8b5cf6, #a855f7)', title: 'Thi trắc nghiệm', desc: 'Tham gia các bài thi trắc nghiệm online để kiểm tra kiến thức và nhận điểm thưởng.' },
    { icon: <MessageCircle style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #ec4899, #f43f5e)', title: 'Bảng tin & Góp ý', desc: 'Đọc các bài viết mới nhất, đăng bài chia sẻ và gửi góp ý đến ban quản trị.' },
    { icon: <Shield style={{ width: 20, height: 20, color: '#fff' }} />, color: 'linear-gradient(135deg, #14b8a6, #06b6d4)', title: 'Hồ sơ cá nhân', desc: 'Cập nhật thông tin cá nhân, xem điểm rèn luyện và lịch sử hoạt động của bạn.' },
  ]

  const renderGuideModal = () => {
    if (view !== 'guide') return null
    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setView('login') }}>
        <div style={modalStyle}>
          <div style={modalHeaderStyle('linear-gradient(135deg, #3b82f6, #6366f1)')}>
            <button style={modalCloseBtn} onClick={() => setView('login')}><X style={{ width: 16, height: 16 }} /></button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                <BookOpen style={{ width: 26, height: 26, color: '#fff' }} />
              </div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Hướng dẫn sử dụng</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Sổ tay Đoàn viên Điện tử - Trung đoàn 196 Hải quân</p>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            {guideSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: i < guideSteps.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: '42px', height: '42px', background: step.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '20px', height: '20px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{i + 1}</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>{step.title}</h3>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.06))', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.12)' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                💡 <strong style={{ color: '#374151' }}>Mẹo:</strong> Nếu gặp khó khăn trong quá trình sử dụng, hãy liên hệ quản trị viên hoặc gọi <strong style={{ color: '#3b82f6' }}>Hotline hỗ trợ</strong> để được giúp đỡ.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== FAQ MODAL =====
  const faqItems = [
    { q: 'Làm thế nào để đăng nhập vào ứng dụng?', a: 'Bạn sử dụng tên đăng nhập, email hoặc số điện thoại được quản trị viên cung cấp cùng với mật khẩu đã được cấp. Nếu chưa có tài khoản, vui lòng liên hệ quản trị viên đơn vị.' },
    { q: 'Tôi quên mật khẩu, phải làm sao?', a: 'Bấm vào nút "Quên mật khẩu" trên màn hình đăng nhập, sau đó chọn phương thức khôi phục qua Email hoặc SMS. Hệ thống sẽ gửi mã OTP để bạn đặt lại mật khẩu mới.' },
    { q: 'Làm sao để điểm danh hoạt động?', a: 'Sau khi đăng nhập, vào mục "Hoạt động", chọn hoạt động bạn tham gia và bấm nút "Điểm danh". Lưu ý: chỉ điểm danh được khi hoạt động đang diễn ra và bạn đã đăng ký tham gia.' },
    { q: 'Điểm rèn luyện được tính như thế nào?', a: 'Điểm rèn luyện được tính dựa trên: tham gia hoạt động, điểm danh đúng giờ, hoàn thành bài thi trắc nghiệm, và các đóng góp khác. Chi tiết điểm có thể xem trong mục "Hồ sơ cá nhân".' },
    { q: 'Tôi có thể đăng bài viết không?', a: 'Có! Bạn có thể đăng bài viết chia sẻ tại mục "Bảng tin". Bài viết sẽ được quản trị viên duyệt trước khi hiển thị công khai.' },
    { q: 'Ứng dụng có hoạt động offline không?', a: 'Hiện tại ứng dụng cần kết nối internet để hoạt động. Một số nội dung đã xem trước đó có thể được lưu tạm trong bộ nhớ cache của trình duyệt.' },
    { q: 'Làm sao liên hệ quản trị viên?', a: 'Bạn có thể gửi góp ý trực tiếp trong ứng dụng hoặc gọi Hotline hỗ trợ. Thông tin liên hệ có trong mục "Hotline hỗ trợ" trên màn hình đăng nhập.' },
  ]

  const renderFaqModal = () => {
    if (view !== 'faq') return null
    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setView('login') }}>
        <div style={modalStyle}>
          <div style={modalHeaderStyle('linear-gradient(135deg, #f59e0b, #f97316)')}>
            <button style={modalCloseBtn} onClick={() => setView('login')}><X style={{ width: 16, height: 16 }} /></button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                <HelpCircle style={{ width: 26, height: 26, color: '#fff' }} />
              </div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Câu hỏi thường gặp</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>{faqItems.length} câu hỏi phổ biến</p>
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {faqItems.map((item, i) => (
              <div key={i} style={{ borderBottom: i < faqItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                    <span style={{ width: '22px', height: '22px', background: openFaq === i ? 'linear-gradient(135deg, #f59e0b, #f97316)' : '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: openFaq === i ? '#fff' : '#9ca3af', flexShrink: 0, marginTop: '1px', transition: 'all 0.2s' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: openFaq === i ? 600 : 500, color: openFaq === i ? '#1f2937' : '#374151', lineHeight: 1.4, transition: 'all 0.2s' }}>{item.q}</span>
                  </div>
                  {openFaq === i ? <ChevronUp style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 0 14px 32px', animation: 'mFadeIn 0.2s ease' }}>
                    <p style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.6, margin: 0, background: '#f9fafb', padding: '10px 14px', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===== HOTLINE MODAL =====
  const renderHotlineModal = () => {
    if (view !== 'hotline') return null
    const hotlines = [
      { name: 'Ban Quản lý Đoàn viên', phone: '0369 888 196', role: 'Hỗ trợ chung & Tài khoản', color: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
      { name: 'Phòng Kỹ thuật', phone: '0912 345 678', role: 'Hỗ trợ kỹ thuật & Ứng dụng', color: 'linear-gradient(135deg, #22c55e, #10b981)' },
    ]
    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setView('login') }}>
        <div style={modalStyle}>
          <div style={modalHeaderStyle('linear-gradient(135deg, #22c55e, #10b981)')}>
            <button style={modalCloseBtn} onClick={() => setView('login')}><X style={{ width: 16, height: 16 }} /></button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                <Phone style={{ width: 26, height: 26, color: '#fff' }} />
              </div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Hotline hỗ trợ</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' }}>Liên hệ để được hỗ trợ nhanh nhất</p>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            {hotlines.map((h, i) => (
              <div key={i} style={{ padding: '18px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', marginBottom: i < hotlines.length - 1 ? '12px' : '0', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: h.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937', margin: 0 }}>{h.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{h.role}</p>
                  </div>
                </div>
                <a href={`tel:${h.phone.replace(/\s/g, '')}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: h.color, borderRadius: '12px', textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '16px', letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                  <Phone style={{ width: 18, height: 18 }} />
                  {h.phone}
                </a>
              </div>
            ))}
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(34,197,94,0.06)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.12)' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                📞 Thời gian hỗ trợ: <strong style={{ color: '#374151' }}>7:00 - 21:00</strong> hàng ngày<br/>(kể cả Thứ 7, Chủ Nhật và Ngày lễ)
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #7f1d1d 0%, #991b1b 35%, #b91c1c 65%, #dc2626 100%)', padding: '32px 16px 24px', position: 'relative', overflow: 'hidden', width: '100%' }}>

      {/* ===== Animated background orbs ===== */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '320px', height: '320px', background: 'rgba(239,68,68,0.28)', borderRadius: '50%', filter: 'blur(70px)', animation: 'orbPulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '45%', left: '-100px', width: '280px', height: '280px', background: 'rgba(127,29,29,0.35)', borderRadius: '50%', filter: 'blur(80px)', animation: 'orbPulse 5s ease-in-out infinite', animationDelay: '1.5s' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '15%', width: '240px', height: '240px', background: 'rgba(220,38,38,0.2)', borderRadius: '50%', filter: 'blur(60px)', animation: 'orbPulse 6s ease-in-out infinite', animationDelay: '3s' }} />
        <div style={{ position: 'absolute', top: '20%', left: '55%', width: '160px', height: '160px', background: 'rgba(253,164,175,0.1)', borderRadius: '50%', filter: 'blur(50px)', animation: 'orbPulse 7s ease-in-out infinite', animationDelay: '2s' }} />
      </div>

      {/* ===== Grid pattern overlay ===== */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.035, backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none', zIndex: 0 }} />

      {/* ===== Main content ===== */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

        {/* ===== Logo + Title ===== */}
        <div style={{ textAlign: 'center', animation: 'fadeDown 0.6s ease' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '18px' }}>
            <div style={{ position: 'absolute', inset: '-18px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(24px)', animation: 'orbPulse 3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: '-6px', background: 'rgba(255,200,200,0.08)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} />
            <img
              src="/Huy_Hieu_Doan.png"
              alt="Youth Union Logo"
              style={{ position: 'relative', width: '108px', height: '108px', objectFit: 'contain', filter: 'drop-shadow(0 6px 28px rgba(0,0,0,0.45)) drop-shadow(0 0 18px rgba(255,255,255,0.25))', display: 'block' }}
            />
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '0.8px', margin: '0 0 6px', textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>
            SỔ TAY ĐOÀN VIÊN ĐIỆN TỬ
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, margin: 0, letterSpacing: '1.2px', textShadow: '0 1px 8px rgba(0,0,0,0.25)', textTransform: 'uppercase' }}>
            Trung đoàn 196 Hải quân
          </p>
        </div>

        {/* ===== Login card ===== */}
        <div style={{ width: '100%', position: 'relative', animation: 'slideUp 0.55s ease 0.1s both' }}>
          {/* Glow ring */}
          <div style={{ position: 'absolute', inset: '-2px', background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(239,68,68,0.4), rgba(255,255,255,0.2))', borderRadius: '26px', filter: 'blur(8px)', opacity: 0.75 }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', padding: '32px 24px 24px', overflow: 'hidden' }}>
            {/* Top shine */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)' }} />

            <h3 style={{ fontSize: '21px', fontWeight: 700, textAlign: 'center', color: '#1f2937', margin: '0 0 4px' }}>Đăng nhập</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '0 0 24px' }}>Nhập thông tin để truy cập tài khoản</p>

            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', animation: 'errorShake 0.4s ease', marginBottom: '16px' }}>
                  <AlertCircle style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: '13px', color: '#dc2626', lineHeight: 1.5 }}>
                    {errorMsg}
                    {failCount >= 3 && <span style={{ display: 'block', marginTop: '4px', fontWeight: 600 }}>Vui lòng liên hệ quản trị viên của bạn</span>}
                  </div>
                </div>
              )}

              {/* Username */}
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: '#d1d5db', zIndex: 10 }} />
                <input
                  type="text" name="username"
                  placeholder="Email, SĐT hoặc tên đăng nhập"
                  style={{ width: '100%', height: '52px', paddingLeft: '44px', paddingRight: '16px', borderRadius: '14px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#1f2937', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)'; e.currentTarget.style.backgroundColor = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = '#f9fafb' }}
                  required
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: '#d1d5db', zIndex: 10 }} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  placeholder="Mật khẩu"
                  style={{ width: '100%', height: '52px', paddingLeft: '44px', paddingRight: '50px', borderRadius: '14px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#1f2937', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)'; e.currentTarget.style.backgroundColor = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = '#f9fafb' }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                  {showPassword ? <EyeOff style={{ width: 17, height: 17, color: '#9ca3af' }} /> : <Eye style={{ width: 17, height: 17, color: '#9ca3af' }} />}
                </button>
              </div>

              {/* Forgot Password */}
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button type="button" style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                  onClick={() => setView('forgot-choose')}>
                  Quên mật khẩu?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                style={{ width: '100%', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(153,27,27,0.45)', letterSpacing: '1.5px', transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden' }}
                disabled={isLoading}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(153,27,27,0.55)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(153,27,27,0.45)' }}
              >
                <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)', animation: 'shimmer 2.5s infinite', pointerEvents: 'none' }} />
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    ĐANG XỬ LÝ...
                  </span>
                ) : '✦ ĐĂNG NHẬP'}
              </button>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes errorShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
                @keyframes mFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes mSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes orbPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
                @keyframes shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
              `}</style>
            </form>
          </div>
        </div>

        {/* ===== Bottom Action Tiles (glass style) ===== */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', animation: 'slideUp 0.6s ease 0.2s both' }}>
          {[
            { icon: <BookOpen style={{ width: 22, height: 22, color: '#fff' }} />, label: 'Hướng dẫn\nsử dụng', action: () => setView('guide') },
            { icon: <HelpCircle style={{ width: 22, height: 22, color: '#fff' }} />, label: 'Câu hỏi\nthường gặp', action: () => setView('faq') },
            { icon: <Phone style={{ width: 22, height: 22, color: '#fff' }} />, label: 'Hotline\nhỗ trợ', action: () => setView('hotline') },
          ].map((tile, i) => (
            <button key={i} onClick={tile.action}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', background: 'rgba(255,255,255,0.12)', borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer', minHeight: '80px', transition: 'all 0.22s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
            >
              <div style={{ marginBottom: 8 }}>{tile.icon}</div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line', fontWeight: 500 }}>{tile.label}</span>
            </button>
          ))}
        </div>

        {/* Version */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, animation: 'slideUp 0.6s ease 0.3s both' }}>© 2026 Trung đoàn 196 Hải quân · Phiên bản 1.0.0</p>
      </div>

      {/* MODALS */}
      {renderForgotModal()}
      {renderGuideModal()}
      {renderFaqModal()}
      {renderHotlineModal()}
    </div>
  )
}
