'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { 
  Lock, User, AlertCircle, Eye, EyeOff, 
  ArrowLeft, Mail, Phone, KeyRound, CheckCircle2,
  Sparkles
} from 'lucide-react';

type ViewMode = 'login' | 'forgot-choose' | 'forgot-email' | 'forgot-phone' | 'verify-otp' | 'reset-password' | 'success';

export default function AdminLogin() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewMode>('login');
  
  // Login state
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState(''); // username/email for phone method
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [devOtp, setDevOtp] = useState(''); // Dev mode: show OTP on screen
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.adminLogin({
        username: formData.email,
        password: formData.password
      });

      if (response.success && response.user) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/admin';
        router.push(redirect);
      } else {
        setError(response.error || 'Email hoặc mật khẩu không đúng hoặc bạn không có quyền admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const method = view === 'forgot-email' ? 'email' : 'phone';
      const contact = method === 'email' ? forgotEmail : forgotPhone;

      if (!contact) {
        setForgotError(method === 'email' ? 'Vui lòng nhập email' : 'Vui lòng nhập số điện thoại');
        setForgotLoading(false);
        return;
      }

      // For phone method, also need identifier (username/email) to find account
      if (method === 'phone' && !forgotIdentifier) {
        setForgotError('Vui lòng nhập tên đăng nhập hoặc email');
        setForgotLoading(false);
        return;
      }

      const requestBody: any = { method, contact };
      if (method === 'phone') {
        requestBody.identifier = forgotIdentifier;
      }

      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken || '');
        if (data.devOtp) setDevOtp(data.devOtp); // Capture dev OTP
        setForgotSuccess(data.message || 'Mã OTP đã được gửi');
        setCountdown(60);
        setView('verify-otp');
      } else {
        setForgotError(data.error || 'Không tìm thấy tài khoản');
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    setForgotLoading(true);

    const code = otpCode.join('');
    if (code.length !== 6) {
      setForgotError('Vui lòng nhập đủ 6 số OTP');
      setForgotLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code, resetToken })
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken || resetToken);
        setView('reset-password');
      } else {
        setForgotError(data.error || 'Mã OTP không đúng');
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError('');

    if (newPassword.length < 6) {
      setForgotError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Mật khẩu xác nhận không khớp');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setView('success');
      } else {
        setForgotError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otpCode];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newOtp[i] = pasted[i];
      }
      setOtpCode(newOtp);
      const focusIdx = Math.min(pasted.length, 5);
      document.getElementById(`otp-${focusIdx}`)?.focus();
    }
  };

  const resetForgotState = () => {
    setForgotEmail('');
    setForgotPhone('');
    setForgotIdentifier('');
    setOtpCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setResetToken('');
    setDevOtp('');
    setCountdown(0);
    setView('login');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
      
      {/* Animated orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* ========== LOGIN VIEW ========== */}
        {view === 'login' && (
          <div className="space-y-6">
            {/* Logo Section */}
            <div className="text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-red-500/15 rounded-full blur-2xl" />
                <img 
                  src="/Huy_Hieu_Doan.png" 
                  alt="Đoàn TNCS Hồ Chí Minh" 
                  className="relative w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] select-none pointer-events-none"
                  draggable={false}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-blue-200/70 text-sm mt-2 tracking-wide uppercase">
                  Hệ thống quản lý đoàn viên Trung đoàn 196
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-purple-500/50 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-500" />
              <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
                {/* Top border glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Đăng nhập</h2>
                    <p className="text-blue-200/50 text-sm mt-1">Nhập thông tin để truy cập trang quản trị</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                      <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-200/80 text-sm font-medium">Email</Label>
                      <div className="relative group/input">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 h-4 w-4 group-focus-within/input:text-blue-400 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="admin@youth.com"
                          className="pl-10 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-blue-400/50 focus:ring-blue-400/20 focus:bg-white/[0.08] transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-blue-200/80 text-sm font-medium">Mật khẩu</Label>
                      <div className="relative group/input">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 h-4 w-4 group-focus-within/input:text-blue-400 transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="••••••••"
                          className="pl-10 pr-11 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-blue-400/50 focus:ring-blue-400/20 focus:bg-white/[0.08] transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot password link */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setView('forgot-choose')}
                        className="text-sm text-blue-300/60 hover:text-blue-300 transition-colors duration-300"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 border-0 relative overflow-hidden group/btn"
                      disabled={loading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          <span>Đang đăng nhập...</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Đăng nhập
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="text-center space-y-1">
              <p className="text-blue-200/30 text-xs">
                © 2026 Hệ thống quản lý đoàn viên Trung đoàn 196
              </p>
              <p className="text-blue-200/20 text-xs">
                Admin Dashboard v2.0
              </p>
            </div>
          </div>
        )}

        {/* ========== FORGOT PASSWORD - CHOOSE METHOD ========== */}
        {view === 'forgot-choose' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Quên mật khẩu?</h2>
              <p className="text-blue-200/50 text-sm">Chọn phương thức khôi phục tài khoản</p>
            </div>

            <div className="space-y-3">
              {/* Email option */}
              <button
                onClick={() => { setView('forgot-email'); setForgotError(''); setForgotSuccess(''); }}
                className="w-full group"
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
                  <div className="relative flex items-center gap-4 p-5 bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:bg-white/[0.12] transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">Gửi mã qua Email</p>
                      <p className="text-blue-200/40 text-sm">Nhận mã OTP qua địa chỉ email đã đăng ký</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Phone option */}
              <button
                onClick={() => { setView('forgot-phone'); setForgotError(''); setForgotSuccess(''); }}
                className="w-full group"
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/40 to-emerald-500/40 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
                  <div className="relative flex items-center gap-4 p-5 bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:bg-white/[0.12] transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">Gửi mã qua SMS</p>
                      <p className="text-blue-200/40 text-sm">Nhận mã OTP qua số điện thoại đã đăng ký</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={resetForgotState}
              className="flex items-center gap-2 text-blue-300/60 hover:text-blue-300 transition-colors mx-auto text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </button>
          </div>
        )}

        {/* ========== FORGOT - EMAIL FORM ========== */}
        {view === 'forgot-email' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Khôi phục qua Email</h2>
              <p className="text-blue-200/50 text-sm">Nhập email đã đăng ký để nhận mã OTP</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-2xl blur opacity-40" />
              <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                <CardContent className="p-6 space-y-4">
                  {forgotError && (
                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">{forgotError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="text-blue-200/80 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 h-4 w-4" />
                      <Input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@youth.com"
                        className="pl-10 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-blue-400/50"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleForgotSubmit}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-blue-500/25 border-0"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Đang gửi...
                      </div>
                    ) : 'Gửi mã OTP'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <button
              onClick={() => setView('forgot-choose')}
              className="flex items-center gap-2 text-blue-300/60 hover:text-blue-300 transition-colors mx-auto text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Chọn phương thức khác
            </button>
          </div>
        )}

        {/* ========== FORGOT - PHONE FORM ========== */}
        {view === 'forgot-phone' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Khôi phục qua SMS</h2>
              <p className="text-blue-200/50 text-sm">Nhập tài khoản và số điện thoại để nhận mã OTP</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-2xl blur opacity-40" />
              <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
                <CardContent className="p-6 space-y-4">
                  {forgotError && (
                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">{forgotError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="text-blue-200/80 text-sm">Tên đăng nhập hoặc Email</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-300/40 h-4 w-4" />
                      <Input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="admin hoặc admin@youth.com"
                        className="pl-10 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-green-400/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-200/80 text-sm">Số điện thoại nhận OTP <span className="text-green-400/60">(nhập SĐT bất kỳ)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-300/40 h-4 w-4" />
                      <Input
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="Nhập SĐT cá nhân của bạn"
                        className="pl-10 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-green-400/50"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleForgotSubmit}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/25 border-0"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Đang gửi...
                      </div>
                    ) : 'Gửi mã OTP'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <button
              onClick={() => setView('forgot-choose')}
              className="flex items-center gap-2 text-blue-300/60 hover:text-blue-300 transition-colors mx-auto text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Chọn phương thức khác
            </button>
          </div>
        )}

        {/* ========== VERIFY OTP ========== */}
        {view === 'verify-otp' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Nhập mã OTP</h2>
              <p className="text-blue-200/50 text-sm">
                Mã xác thực đã được gửi đến {forgotEmail || forgotPhone}
              </p>
            </div>

            {/* DEV MODE: Show OTP directly */}
            {devOtp && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/40 to-orange-500/40 rounded-xl blur opacity-60 animate-pulse" />
                <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                  <p className="text-amber-300/80 text-xs font-medium mb-1">⚠️ CHẾ ĐỘ PHÁT TRIỂN - Mã OTP của bạn:</p>
                  <p className="text-3xl font-bold text-amber-300 tracking-[0.5em] font-mono">{devOtp}</p>
                  <p className="text-amber-400/50 text-xs mt-1">Nhập mã này vào ô bên dưới</p>
                </div>
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-2xl blur opacity-40" />
              <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                <CardContent className="p-6 space-y-5">
                  {forgotError && (
                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">{forgotError}</AlertDescription>
                    </Alert>
                  )}

                  {forgotSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">{forgotSuccess}</AlertDescription>
                    </Alert>
                  )}

                  {/* OTP Inputs */}
                  <div className="flex justify-center gap-2.5">
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-bold text-white bg-white/[0.08] border border-white/[0.12] rounded-xl focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 focus:outline-none transition-all"
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl shadow-lg shadow-violet-500/25 border-0"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Đang xác thực...
                      </div>
                    ) : 'Xác nhận OTP'}
                  </Button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-blue-200/40 text-sm">Gửi lại sau {countdown}s</p>
                    ) : (
                      <button
                        onClick={() => {
                          setView(forgotEmail ? 'forgot-email' : 'forgot-phone');
                          handleForgotSubmit();
                        }}
                        className="text-sm text-violet-300/70 hover:text-violet-300 transition-colors"
                      >
                        Gửi lại mã OTP
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <button
              onClick={resetForgotState}
              className="flex items-center gap-2 text-blue-300/60 hover:text-blue-300 transition-colors mx-auto text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </button>
          </div>
        )}

        {/* ========== RESET PASSWORD ========== */}
        {view === 'reset-password' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Đặt mật khẩu mới</h2>
              <p className="text-blue-200/50 text-sm">Tạo mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-2xl blur opacity-40" />
              <Card className="relative border-0 bg-white/[0.07] backdrop-blur-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                <CardContent className="p-6 space-y-4">
                  {forgotError && (
                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">{forgotError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="text-blue-200/80 text-sm">Mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/40 h-4 w-4" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="pl-10 pr-11 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-emerald-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-200/80 text-sm">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/40 h-4 w-4" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="pl-10 h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-blue-200/30 rounded-xl focus:border-emerald-400/50"
                      />
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              newPassword.length >= level * 3
                                ? level <= 1 ? 'bg-red-400' : level <= 2 ? 'bg-amber-400' : level <= 3 ? 'bg-blue-400' : 'bg-emerald-400'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-blue-200/40">
                        {newPassword.length < 6 ? 'Yếu - cần ít nhất 6 ký tự' : newPassword.length < 8 ? 'Trung bình' : newPassword.length < 12 ? 'Mạnh' : 'Rất mạnh'}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleResetPassword}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 border-0"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Đang cập nhật...
                      </div>
                    ) : 'Cập nhật mật khẩu'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========== SUCCESS VIEW ========== */}
        {view === 'success' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Thành công!</h2>
              <p className="text-blue-200/60 text-sm">Mật khẩu đã được cập nhật thành công.<br/>Bạn có thể đăng nhập với mật khẩu mới.</p>
            </div>

            <Button
              onClick={resetForgotState}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg border-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đăng nhập
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}