"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  UserPlus,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from "lucide-react"

interface Activity {
  id: string
  title: string
  description?: string
  type: string
  startTime: string
  endTime?: string
  location?: string
  maxParticipants?: number
  status: string
  organizer: {
    id: string
    fullName: string
  }
  unit?: {
    id: string
    name: string
  }
  participants: any[]
  userParticipation?: any
  _count: {
    participants: number
    feedbacks: number
  }
}

interface ActivityListMobileProps {
  onActivitySelect?: (activity: Activity) => void
}

export default function ActivityListMobile({ onActivitySelect }: ActivityListMobileProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinLoading, setJoinLoading] = useState<string | null>(null)

  const loadActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivities({ status: 'ACTIVE', limit: 20 })

      if (result.success && result.data) {
        let activitiesData = [];
        if (Array.isArray(result.data)) {
          activitiesData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          activitiesData = result.data.data;
        }
        setActivities(activitiesData)
      } else {
        setActivities([])
        if (result.error) setError(result.error)
      }
    } catch (err) {
      console.error('Error loading activities:', err)
      setError('Không thể tải danh sách. Vui lòng thử lại.')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadActivities, 200)
    return () => clearTimeout(timer)
  }, [])

  const handleJoinActivity = async (activityId: string) => {
    setJoinLoading(activityId)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.joinActivity(activityId)
      if (result.success) {
        await loadActivities()
      } else {
        alert(result.error || 'Có lỗi xảy ra')
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi đăng ký')
    } finally {
      setJoinLoading(null)
    }
  }

  const getTypeInfo = (type: string) => {
    const types: Record<string, { text: string; bg: string; color: string }> = {
      'MEETING': { text: 'Sinh hoạt', bg: '#dbeafe', color: '#1e40af' },
      'VOLUNTEER': { text: 'Tình nguyện', bg: '#dcfce7', color: '#166534' },
      'STUDY': { text: 'Học tập', bg: '#f3e8ff', color: '#7c3aed' },
      'TASK': { text: 'Nhiệm vụ', bg: '#ffedd5', color: '#c2410c' },
      'SOCIAL': { text: 'Xã hội', bg: '#fce7f3', color: '#be185d' }
    }
    return types[type] || { text: type, bg: '#f3f4f6', color: '#374151' }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  }

  const cardHeaderStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
  }

  const cardBodyStyle: React.CSSProperties = {
    padding: '16px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '8px',
    lineHeight: 1.4,
  }

  const descStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: 1.5,
  }

  const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: bg,
    color: color,
    marginRight: '8px',
  })

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  }

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  }

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginTop: '12px',
  }

  const joinButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
  }

  const viewButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }

  const registeredBadgeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: '13px',
    fontWeight: 500,
    marginTop: '12px',
  }

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  }

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  }

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải dữ liệu...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...emptyStyle, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#dc2626', margin: '0 auto 16px' }} />
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={loadActivities}
          style={{ ...buttonStyle, backgroundColor: '#dc2626', color: '#fff', width: 'auto', padding: '10px 24px' }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          Thử lại
        </button>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div style={emptyStyle}>
        <Calendar style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Chưa có hoạt động nào</p>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>Các hoạt động mới sẽ hiển thị ở đây</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {activities.map((activity) => {
        const typeInfo = getTypeInfo(activity.type)
        const dateTime = formatDateTime(activity.startTime)
        const isRegistered = !!activity.userParticipation
        const isFull = activity.maxParticipants && activity._count.participants >= activity.maxParticipants
        const canJoin = activity.status === 'ACTIVE' && !isRegistered && !isFull

        return (
          <div key={activity.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span style={badgeStyle(typeInfo.bg, typeInfo.color)}>{typeInfo.text}</span>
                <span style={badgeStyle('#dcfce7', '#166534')}>Đang mở</span>
              </div>
              <h3 style={titleStyle}>{activity.title}</h3>
              {activity.description && (
                <p style={descStyle}>{activity.description}</p>
              )}
            </div>

            <div style={cardBodyStyle}>
              <div style={infoRowStyle}>
                <Calendar style={iconStyle} />
                <span>{dateTime.date} lúc {dateTime.time}</span>
              </div>

              {activity.location && (
                <div style={infoRowStyle}>
                  <MapPin style={iconStyle} />
                  <span>{activity.location}</span>
                </div>
              )}

              <div style={infoRowStyle}>
                <Users style={iconStyle} />
                <span>
                  {activity._count.participants}
                  {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ''} người tham gia
                </span>
              </div>

              {isRegistered ? (
                <div style={registeredBadgeStyle}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} />
                  Đã đăng ký tham gia
                </div>
              ) : canJoin ? (
                <button
                  onClick={() => handleJoinActivity(activity.id)}
                  disabled={joinLoading === activity.id}
                  style={{
                    ...joinButtonStyle,
                    opacity: joinLoading === activity.id ? 0.7 : 1,
                  }}
                >
                  {joinLoading === activity.id ? (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <UserPlus style={{ width: '16px', height: '16px' }} />
                      Đăng ký tham gia
                    </>
                  )}
                </button>
              ) : isFull ? (
                <div style={{ ...registeredBadgeStyle, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                  Đã đủ số lượng
                </div>
              ) : null}

              <button
                onClick={() => onActivitySelect?.(activity)}
                style={viewButtonStyle}
              >
                Xem chi tiết
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        )
      })}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
