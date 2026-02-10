'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { AdminShell } from '@/components/admin/admin-shell';
import { authApi } from '@/lib/api';

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Skip shell wrapper for login page and main dashboard (which has its own layout)
  const isLoginPage = pathname === '/admin/login';
  const isMainDashboard = pathname === '/admin';

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      setIsChecking(false);
      setIsAuthorized(true);
      return;
    }

    // Main dashboard handles its own auth
    if (isMainDashboard) {
      setIsChecking(false);
      setIsAuthorized(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const currentUser = localStorage.getItem('currentUser');

        if (!accessToken || !currentUser) {
          // No token, redirect to login
          router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const user = JSON.parse(currentUser);

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          // Not admin, redirect to login
          localStorage.clear();
          document.cookie = 'accessToken=; path=/; max-age=0';
          router.push('/admin/login');
          return;
        }

        // Try to verify token by calling getMe
        const response = await authApi.getMe();

        if (!response.success) {
          // Token expired, try to refresh
          const refreshResponse = await authApi.refreshToken();

          if (!refreshResponse.success) {
            // Refresh failed, redirect to login
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; max-age=0';
            router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    // Auto-refresh token every 25 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await authApi.refreshToken();
      } catch (error) {
        console.error('Auto refresh error:', error);
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(refreshInterval);
  }, [pathname, router, isLoginPage, isMainDashboard]);

  // Show loading state while checking auth
  if (isChecking && !isLoginPage && !isMainDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Only render children if authorized or on login page
  if (!isAuthorized && !isLoginPage && !isMainDashboard) {
    return null;
  }

  // Wrap with AdminShell for all pages except login and main dashboard
  if (isLoginPage || isMainDashboard) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AdminShell>
        {children}
      </AdminShell>
      <Toaster />
    </>
  );
}
