"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw } from "lucide-react"
import ActivityListMobile from "@/components/activities/activity-list-mobile"
import ActivityDetailMobile from "@/components/activities/activity-detail-mobile"
import { activityApi, getStoredUser } from "@/lib/api"

export default function ActivitiesScreen() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [stats, setStats] = useState({ total: 0, joined: 0, points: 0 })

  useEffect(() => {
    setIsReady(true)
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const result = await activityApi.getActivities({ limit: 100 })
      const user = getStoredUser()
      if (result.success && result.data) {
        const activities = Array.isArray(result.data) ? result.data : (result.data as any).data || []
        const total = activities.length
        const joined = activities.filter((a: any) => 
          a.participants?.some((p: any) => p.userId === user?.id || p.id === user?.id)
        ).length
        setStats({ total, joined, points: user?.points || 0 })
      }
    } catch (err) {
      const user = getStoredUser()
      setStats({ total: 0, joined: 0, points: user?.points || 0 })
    }
  }

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity.id)
  }

  const handleBack = () => {
    setSelectedActivity(null)
  }

  // Inline styles for mobile
  const containerStyle: React.CSSProperties = {
    minHeight: '100%',
    backgroundColor: '#f8fafc',
    paddingBottom: '100px', // Extra space for scrolling past bottom nav
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #0ea5e9 100%)',
    padding: '20px',
    color: '#ffffff',
  }

  const headerTopStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    textAlign: 'center',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  }

  const statsCardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '16px',
    marginTop: '16px',
    backdropFilter: 'blur(10px)',
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center',
  }

  const statItemStyle: React.CSSProperties = {
    flex: 1,
  }

  const statNumberStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
  }

  const contentStyle: React.CSSProperties = {
    padding: '20px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const loadingStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  }

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  }

  if (!isReady) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle} />
        <p style={{ color: '#ffffff', fontSize: '14px' }}>Đang tải...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (selectedActivity) {
    return (
      <div style={{ height: '100%' }}>
        <ActivityDetailMobile activityId={selectedActivity} onBack={handleBack} />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerTopStyle}>
          <Calendar style={{ width: '28px', height: '28px' }} />
          <h1 style={titleStyle}>Sổ tay Đoàn viên</h1>
        </div>
        <p style={subtitleStyle}>Theo dõi và tham gia các hoạt động Đoàn</p>

        {/* Stats Card */}
        <div style={statsCardStyle}>
          <div style={statsRowStyle}>
            <div style={statItemStyle}>
              <div style={statNumberStyle}>{stats.total}</div>
              <div style={statLabelStyle}>Hoạt động</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={statItemStyle}>
              <div style={statNumberStyle}>{stats.joined}</div>
              <div style={statLabelStyle}>Đã tham gia</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={statItemStyle}>
              <div style={statNumberStyle}>{stats.points}</div>
              <div style={statLabelStyle}>Điểm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <div style={sectionTitleStyle}>
          <Calendar style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
          Hoạt động sắp tới
        </div>
        <ActivityListMobile onActivitySelect={handleActivitySelect} />
      </div>
    </div>
  )
}