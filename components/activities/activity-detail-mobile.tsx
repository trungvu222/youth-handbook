"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  QrCode,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Award,
  ArrowLeft,
  User,
} from "lucide-react"

interface ActivityDetailMobileProps {
  activityId: string
  onBack?: () => void
}

export default function ActivityDetailMobile({ activityId, onBack }: ActivityDetailMobileProps) {
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivity(activityId)
      
      if (result.success && result.data) {
        setActivity(result.data)
      } else {
        // Mock data nếu không có API
        setActivity({
          id: activityId,
          title: 'Sinh hoạt Chi đoàn tháng 12',
          description: 'Tổng kết hoạt động và triển khai phương hướng mới',
          type: 'MEETING',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Hội trường A1',
          onTimePoints: 5,
          latePoints: 2,
          missedPoints: -3,
          participants: [],
          maxParticipants: 50,
        })
      }
    } catch (error) {
      console.error('Error loading activity:', error)
      // Mock fallback
      setActivity({
        id: activityId,
        title: 'Sinh hoạt Chi đoàn',
        description: 'Chi tiết sinh hoạt',
        type: 'MEETING',
        startTime: new Date().toISOString(),
        location: 'Hội trường',
        onTimePoints: 5,
        latePoints: 2,
        missedPoints: -3,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activityId) {
      loadActivity()
    }
  }, [activityId])

  // ===== INLINE STYLES =====
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '12px',
  }

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '12px 16px',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '8px',
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    marginRight: '8px',
    marginBottom: '12px',
  }

  const descriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: 1.5,
  }

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #f3f4f6',
  }

  const infoIconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    color: '#9ca3af',
    marginRight: '12px',
    flexShrink: 0,
  }

  const infoContentStyle: React.CSSProperties = {
    flex: 1,
  }

  const infoLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: 500,
  }

  const infoValueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#111827',
    fontWeight: 500,
  }

  const loadingStyle: React.CSSProperties = {
    padding: '40px 16px',
    textAlign: 'center',
  }

  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#e5e7eb',
    borderRadius: '8px',
    animation: 'pulse 2s infinite',
  }

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 16px',
  }

  const errorIconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    color: '#9ca3af',
    margin: '0 auto 16px',
  }

  const getActivityTypeDisplay = (type: string) => {
    const types: Record<string, { text: string; bg: string; color: string }> = {
      'MEETING': { text: 'Sinh hoạt', bg: '#dbeafe', color: '#1e40af' },
      'VOLUNTEER': { text: 'Tình nguyện', bg: '#d1fae5', color: '#065f46' },
      'STUDY': { text: 'Học tập', bg: '#e9d5ff', color: '#6b21a8' },
      'TASK': { text: 'Nhiệm vụ', bg: '#fed7aa', color: '#c2410c' },
      'SOCIAL': { text: 'Xã hội', bg: '#fce7f3', color: '#be185d' }
    }
    return types[type] || { text: type || 'Khác', bg: '#f3f4f6', color: '#374151' }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backButtonStyle} onClick={onBack}>
            <ArrowLeft style={{ width: '20px', height: '20px', color: '#374151' }} />
          </button>
          <span style={headerTitleStyle}>Chi tiết sinh hoạt</span>
        </div>
        <div style={loadingStyle}>
          <div style={{ ...skeletonStyle, height: '24px', width: '70%', margin: '0 auto 12px' }}></div>
          <div style={{ ...skeletonStyle, height: '16px', width: '50%', margin: '0 auto 24px' }}></div>
          <div style={{ ...skeletonStyle, height: '80px', width: '100%', marginBottom: '12px' }}></div>
          <div style={{ ...skeletonStyle, height: '80px', width: '100%', marginBottom: '12px' }}></div>
          <div style={{ ...skeletonStyle, height: '80px', width: '100%' }}></div>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backButtonStyle} onClick={onBack}>
            <ArrowLeft style={{ width: '20px', height: '20px', color: '#374151' }} />
          </button>
          <span style={headerTitleStyle}>Chi tiết sinh hoạt</span>
        </div>
        <div style={errorStyle}>
          <AlertCircle style={errorIconStyle} />
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Không tìm thấy thông tin sinh hoạt.</p>
        </div>
      </div>
    )
  }

  const typeDisplay = getActivityTypeDisplay(activity.type)

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          <ArrowLeft style={{ width: '20px', height: '20px', color: '#374151' }} />
        </button>
        <span style={headerTitleStyle}>Chi tiết sinh hoạt</span>
      </div>

      {/* Activity Info Card */}
      <div style={cardStyle}>
        <div style={titleStyle}>{activity.title}</div>
        
        <span style={{ 
          ...badgeStyle, 
          backgroundColor: typeDisplay.bg, 
          color: typeDisplay.color 
        }}>
          {typeDisplay.text}
        </span>

        {activity.userParticipation && (
          <span style={{ 
            ...badgeStyle, 
            backgroundColor: '#d1fae5', 
            color: '#065f46',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <CheckCircle style={{ width: '12px', height: '12px', marginRight: '4px' }} />
            Đã đăng ký
          </span>
        )}

        {activity.description && (
          <p style={descriptionStyle}>{activity.description}</p>
        )}
      </div>

      {/* Info Items */}
      <div style={{ padding: '0 16px' }}>
        {/* Time Start */}
        <div style={infoRowStyle}>
          <Calendar style={infoIconStyle} />
          <div style={infoContentStyle}>
            <div style={infoLabelStyle}>Thời gian bắt đầu</div>
            <div style={infoValueStyle}>{formatDateTime(activity.startTime)}</div>
          </div>
        </div>

        {/* Time End */}
        {activity.endTime && (
          <div style={infoRowStyle}>
            <Clock style={infoIconStyle} />
            <div style={infoContentStyle}>
              <div style={infoLabelStyle}>Thời gian kết thúc</div>
              <div style={infoValueStyle}>{formatDateTime(activity.endTime)}</div>
            </div>
          </div>
        )}

        {/* Location */}
        {activity.location && (
          <div style={infoRowStyle}>
            <MapPin style={infoIconStyle} />
            <div style={infoContentStyle}>
              <div style={infoLabelStyle}>Địa điểm</div>
              <div style={infoValueStyle}>{activity.location}</div>
            </div>
          </div>
        )}

        {/* Participants */}
        <div style={infoRowStyle}>
          <Users style={infoIconStyle} />
          <div style={infoContentStyle}>
            <div style={infoLabelStyle}>Số lượng tham gia</div>
            <div style={infoValueStyle}>
              {activity.participants?.length || 0}
              {activity.maxParticipants && ` / ${activity.maxParticipants}`} người
            </div>
          </div>
        </div>

        {/* Points */}
        <div style={infoRowStyle}>
          <Award style={infoIconStyle} />
          <div style={infoContentStyle}>
            <div style={infoLabelStyle}>Điểm thưởng</div>
            <div style={infoValueStyle}>
              Đúng giờ: +{activity.onTimePoints || 5} | Trễ: +{activity.latePoints || 2} | Vắng: {activity.missedPoints || -3}
            </div>
          </div>
        </div>

        {/* Unit */}
        {activity.unit && (
          <div style={infoRowStyle}>
            <User style={infoIconStyle} />
            <div style={infoContentStyle}>
              <div style={infoLabelStyle}>Chi đoàn</div>
              <div style={infoValueStyle}>{activity.unit.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Check-in Section */}
      {activity.userParticipation && (
        <div style={cardStyle}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}>
            <QrCode style={{ width: '20px', height: '20px', marginRight: '8px', color: '#f59e0b' }} />
            Điểm danh
          </div>

          {activity.userParticipation.status === 'CHECKED_IN' ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 12px' }} />
              <p style={{ color: '#065f46', fontWeight: 600, marginBottom: '8px' }}>Đã điểm danh thành công</p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                Điểm nhận được: +{activity.userParticipation.pointsEarned || 5}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Clock style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 12px' }} />
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Chờ điểm danh từ quản trị viên</p>
            </div>
          )}
        </div>
      )}

      {/* Participants List */}
      {activity.participants?.length > 0 && (
        <div style={cardStyle}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}>
            <Users style={{ width: '20px', height: '20px', marginRight: '8px', color: '#f59e0b' }} />
            Danh sách tham gia ({activity.participants.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activity.participants.slice(0, 5).map((participant: any, index: number) => (
              <div 
                key={participant.id || index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #f3f4f6',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#92400e',
                  marginRight: '10px',
                }}>
                  {participant.user?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                    {participant.user?.fullName || 'Người dùng'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {participant.user?.youthPosition || 'Đoàn viên'}
                  </div>
                </div>
                {participant.status === 'CHECKED_IN' && (
                  <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
