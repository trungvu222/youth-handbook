'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Không đăng ký SW cho trang admin
    if (window.location.pathname.startsWith('/admin')) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker đã đăng ký:', reg.scope)

        // Kiểm tra có bản cập nhật mới không
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
  }, [])

  return null
}
