"use client"

import { useState, useEffect } from "react"
import { notificationApi } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { 
  Calendar, 
  Star, 
  ClipboardList, 
  FileText, 
  Megaphone, 
  QrCode, 
  Bell, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink,
  Clock,
  Sparkles,
  Info
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type?: string
  isRead: boolean
  createdAt: string
  relatedId?: string
}

interface NotificationsScreenMobileProps {
  onBack?: () => void
  onOpenDocument?: (docId: string) => void
}

// Normalize notification message timestamps to Vietnam Time (Asia/Ho_Chi_Minh - UTC+7)
function formatNotificationMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return ''
  // Match patterns like "vào lúc 02:00:00 16/8/2026" or "vào lúc 00:00:00 25/8/2026"
  return msg.replace(/vào lúc\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi, (match, hourStr, minStr, secStr, dayStr, monthStr, yearStr) => {
    if (secStr !== undefined) {
      // Server formatted in UTC without offset -> convert UTC to Vietnam Time (+7 hours)
      const h = parseInt(hourStr, 10)
      const m = parseInt(minStr, 10)
      const d = parseInt(dayStr, 10)
      const mo = parseInt(monthStr, 10) - 1
      const y = parseInt(yearStr, 10)
      const utcDate = new Date(Date.UTC(y, mo, d, h, m))
      const vnDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000)
      const localH = String(vnDate.getUTCHours()).padStart(2, '0')
      const localM = String(vnDate.getUTCMinutes()).padStart(2, '0')
      const localD = String(vnDate.getUTCDate()).padStart(2, '0')
      const localMo = String(vnDate.getUTCMonth() + 1).padStart(2, '0')
      const localY = vnDate.getUTCFullYear()
      return `vào lúc ${localH}:${localM} ${localD}/${localMo}/${localY}`
    }
    return `vào lúc ${hourStr.padStart(2, '0')}:${minStr} ${dayStr.padStart(2, '0')}/${monthStr.padStart(2, '0')}/${yearStr}`
  })
}

export default function NotificationsScreenMobile({ onBack, onOpenDocument }: NotificationsScreenMobileProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadNotifications(true))

  async function loadNotifications(silent = false) {
    if (!silent) setLoading(true)
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

  function renderTypeIcon(type?: string) {
    switch (type) {
      case 'ACTIVITY':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 20, height: 20, color: '#2563eb' }} />
          </div>
        )
      case 'POINTS':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star style={{ width: 20, height: 20, color: '#d97706' }} />
          </div>
        )
      case 'SURVEY':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList style={{ width: 20, height: 20, color: '#16a34a' }} />
          </div>
        )
      case 'DOCUMENT':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText style={{ width: 20, height: 20, color: '#7c3aed' }} />
          </div>
        )
      case 'ANNOUNCEMENT':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone style={{ width: 20, height: 20, color: '#e11d48' }} />
          </div>
        )
      case 'CHECKIN_CODE':
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QrCode style={{ width: 20, height: 20, color: '#15803d' }} />
          </div>
        )
      default:
        return (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell style={{ width: 20, height: 20, color: '#d97706' }} />
          </div>
        )
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
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #ef4444 100%)', padding: '24px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft style={{ width: 20, height: 20, color: '#fff' }} />
            </button>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell style={{ width: 22, height: 22 }} />
            Thông báo
          </h1>
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
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Bell style={{ width: 28, height: 28, color: '#f59e0b' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginTop: 12 }}>Không có thông báo</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Bạn sẽ nhận thông báo khi có hoạt động mới</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) handleMarkRead(notification.id)
                  if (notification.type === 'DOCUMENT' && notification.relatedId && onOpenDocument) {
                    onOpenDocument(notification.relatedId)
                  }
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 16,
                  background: notification.type === 'CHECKIN_CODE'
                    ? (notification.isRead ? '#f0fdf4' : '#dcfce7')
                    : (notification.isRead ? '#fff' : '#eff6ff'),
                  borderRadius: 14,
                  border: notification.type === 'CHECKIN_CODE'
                    ? (notification.isRead ? '1px solid #bbf7d0' : '1px solid #86efac')
                    : (notification.isRead ? '1px solid #f1f5f9' : '1px solid #93c5fd'),
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {!notification.isRead && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: notification.type === 'CHECKIN_CODE' ? '#16a34a' : '#2563eb' }} />
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {renderTypeIcon(notification.type)}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      {notification.title.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim()}
                    </h3>

                    {notification.type === 'CHECKIN_CODE' && notification.relatedId ? (
                      <div>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>
                          Mã điểm danh của bạn:
                        </p>
                        <div style={{ background: '#fff', border: '2px dashed #16a34a', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: '#15803d', fontFamily: 'monospace' }}>
                            {notification.relatedId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(notification.relatedId!).then(() => {
                                setCopiedId(notification.id)
                                setTimeout(() => setCopiedId(null), 2000)
                              })
                              if (!notification.isRead) handleMarkRead(notification.id)
                            }}
                            style={{ 
                              background: copiedId === notification.id ? '#16a34a' : '#f0fdf4', 
                              border: '1px solid #86efac', 
                              borderRadius: 8, 
                              padding: '6px 12px', 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: copiedId === notification.id ? '#fff' : '#16a34a', 
                              cursor: 'pointer', 
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {copiedId === notification.id ? (
                              <>
                                <Check style={{ width: 14, height: 14 }} />
                                Đã sao chép!
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 14, height: 14 }} />
                                Sao chép
                              </>
                            )}
                          </button>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>
                          Sao chép mã rồi vào <strong>Sinh hoạt → Điểm danh ngay</strong> → chọn Nhập mã
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        {formatNotificationMessage(notification.message)}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: '#94a3b8', fontSize: 11 }}>
                      <Clock style={{ width: 12, height: 12 }} />
                      <span>{timeAgo(notification.createdAt)}</span>
                    </div>

                    {notification.type === 'DOCUMENT' && notification.relatedId && onOpenDocument && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 6 }}>
                        <FileText style={{ width: 13, height: 13 }} />
                        Nhấn để xem tài liệu →
                      </span>
                    )}
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
