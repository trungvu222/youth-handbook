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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
              ← Quay lại
            </button>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Thông báo</h1>
          {unreadCount > 0 && (
            <span style={{ background: '#fff', color: '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {unreadCount} mới
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32 }}>⏳</div>
            <p style={{ color: '#6b7280', marginTop: 8 }}>Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48 }}>🔔</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginTop: 12 }}>Không có thông báo</h3>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>Bạn sẽ nhận thông báo khi có hoạt động mới</p>
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
                  borderRadius: 12,
                  border: notification.isRead ? '1px solid #e5e7eb' : '1px solid #93c5fd',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {!notification.isRead && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24 }}>{getTypeIcon(notification.type)}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                      {notification.title}
                    </h3>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
                      {notification.message}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
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
