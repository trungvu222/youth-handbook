'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWARegisterAdmin() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ── Swap manifest → dùng admin manifest ──────────────────
    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (existingManifest) {
      existingManifest.setAttribute('href', '/admin-manifest.json')
    } else {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = '/admin-manifest.json'
      document.head.appendChild(link)
    }

    // ── Cập nhật meta tags iOS cho admin ─────────────────────
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (el) {
        el.content = content
      } else {
        el = document.createElement('meta')
        el.name = name
        el.content = content
        document.head.appendChild(el)
      }
    }

    setMeta('apple-mobile-web-app-title', 'Sổ Tay Đoàn Viên - Quản Trị')
    setMeta('apple-mobile-web-app-capable', 'yes')
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
    setMeta('theme-color', '#1e3a5f')

    // ── Đăng ký Admin Service Worker (scope /admin/) ──────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/admin/sw.js')
        .then((reg) => {
          console.log('[Admin PWA] Service Worker đã đăng ký:', reg.scope)
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing
            if (!nw) return
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Admin PWA] Có bản cập nhật mới!')
              }
            })
          })
        })
        .catch((err) => console.warn('[Admin PWA] Đăng ký thất bại:', err))
    }

    // ── Android: lắng nghe sự kiện cài app ───────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('admin-pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setInstallPrompt(null)
      localStorage.removeItem('admin-pwa-banner-dismissed')
      console.log('[Admin PWA] App đã được cài đặt!')
    })

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('[Admin PWA] Admin đã cài app')
    }
    setShowBanner(false)
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('admin-pwa-banner-dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }

  if (!showBanner) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(30,58,95,0.5)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Icon */}
      <img
        src="/Huy_Hieu_Doan.png"
        alt="logo"
        style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}
      />
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
          Cài bảng quản trị!
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          Quản lý đoàn viên ngay trên điện thoại
        </div>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: '#3b82f6',
            color: '#fff',
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
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.25)',
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
