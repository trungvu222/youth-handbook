'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Không hiện trên trang admin
    if (window.location.pathname.startsWith('/admin')) return

    // Đăng ký Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker đã đăng ký:', reg.scope)
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Có bản cập nhật mới!')
              }
            })
          })
        })
        .catch((err) => console.warn('[PWA] Đăng ký thất bại:', err))
    }

    // ── Android: lắng nghe sự kiện cài app ──────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // Chỉ hiện banner nếu chưa từng bấm "Không cài"
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Ẩn banner nếu người dùng đã cài app
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setInstallPrompt(null)
      localStorage.removeItem('pwa-banner-dismissed')
      console.log('[PWA] App đã được cài đặt!')
    })

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('[PWA] Người dùng đã chấp nhận cài app')
    }
    setShowBanner(false)
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Ẩn banner trong 7 ngày
    localStorage.setItem('pwa-banner-dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }

  if (!showBanner) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(220,38,38,0.4)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Icon */}
      <img
        src="/Icon-App-Chua-tach-nen.jpg"
        alt="logo"
        style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}
      />
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
          Cài ứng dụng miễn phí!
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
          Sổ Tay Đoàn Viên — nhanh hơn, tiện hơn
        </div>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: '#fff',
            color: '#dc2626',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Cài ngay
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '4px 14px',
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Không cần
        </button>
      </div>
    </div>
  )
}
