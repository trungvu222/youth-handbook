'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { Lock, User, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    selectedRole: '' as '' | 'ADMIN' | 'LEADER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Must select a role first
    if (!formData.selectedRole) {
      setError('Vui lòng chọn quyền đăng nhập (Quản trị viên hoặc Bí thư).');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.adminLogin({
        username: formData.email,
        password: formData.password
      });

      if (response.success && response.user) {
        const user = response.user;

        // Validate selected role matches actual role
        if (user.role !== formData.selectedRole) {
          const selectedLabel = formData.selectedRole === 'ADMIN' ? 'Quản trị viên' : 'Bí thư chi đoàn';
          const actualLabel = user.role === 'ADMIN' ? 'Quản trị viên' : 'Bí thư chi đoàn';
          setError(`Quyền không khớp. Bạn đã chọn "${selectedLabel}" nhưng tài khoản này là "${actualLabel}". Vui lòng chọn đúng quyền.`);
          // Clear saved auth since we reject this login
          localStorage.clear();
          document.cookie = 'accessToken=; path=/; max-age=0';
          setLoading(false);
          return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/admin';
        router.push(redirect);
      } else {
        setError(response.error || 'Email hoặc mật khẩu không đúng hoặc tài khoản không có quyền truy cập.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Quản trị viên', desc: 'Toàn quyền hệ thống' },
    { value: 'LEADER', label: 'Bí thư chi đoàn', desc: 'Quản lý chi đoàn của mình' },
  ] as const;

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin để truy cập trang quản trị
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email hoặc tên đăng nhập</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@youth.com hoặc username"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <Label>Đăng nhập với quyền</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectedRole: opt.value }))}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                    formData.selectedRole === opt.value
                      ? opt.value === 'ADMIN'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-purple-600 bg-purple-50 text-purple-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs opacity-70 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
            {!formData.selectedRole && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Vui lòng chọn quyền trước khi đăng nhập
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang đăng nhập...
              </div>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}



