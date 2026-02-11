"use client"

import { useState, useEffect } from "react"
import { notificationApi } from "@/lib/api"

interface Notification {
  id: string
  title: string
  message: string
  type?: string
  isRead: boolean
  createdAt: string
  relatedId?: string
}

export default function NotificationsScreenMobile({ onBack }: { onBack?: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const result = await notificationApi.getNotifications()
      if (result.success && result.data) {
        setNotifications(Array.isArray(result.data) ? result.data : [])
      }
    } catch (err) {
      console.error('[Notifications] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('[Notifications] Mark read error:', err)
    }
  }

  function getTypeIcon(type?: string) {
    switch (type) {
      case 'ACTIVITY': return '📅'
      case 'POINTS': return '⭐'
      case 'SURVEY': return '📋'
      case 'DOCUMENT': return '📄'
      case 'ANNOUNCEMENT': return '📢'
      default: return '🔔'
    }
  }

  function timeAgo(dateStr: string) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays} ngày trước`
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #ef4444 100%)', padding: '24px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ←
            </button>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Thông báo</h1>
          {unreadCount > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              {unreadCount} mới
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #fef3c7', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Đang tải...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px' }}>🔔</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginTop: 12 }}>Không có thông báo</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Bạn sẽ nhận thông báo khi có hoạt động mới</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 16,
                  background: notification.isRead ? '#fff' : '#eff6ff',
                  borderRadius: 14,
                  border: notification.isRead ? '1px solid #f1f5f9' : '1px solid #93c5fd',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {!notification.isRead && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24 }}>{getTypeIcon(notification.type)}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      {notification.title}
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                      {notification.message}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
