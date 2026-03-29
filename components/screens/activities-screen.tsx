"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw } from "lucide-react"
import ActivityListMobile from "@/components/activities/activity-list-mobile"
import ActivityDetailMobile from "@/components/activities/activity-detail-mobile"
import { activityApi, getStoredUser } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"

export default function ActivitiesScreen() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [stats, setStats] = useState({ total: 0, joined: 0, points: 0 })

  useEffect(() => {
    setIsReady(true)
    loadStats()
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadStats())

  async function loadStats() {
    try {
      // Load all activities (not just ACTIVE) to count total
      const result = await activityApi.getActivities({ limit: 100 })
      const user = getStoredUser()
      if (result.success && result.data) {
        const activities = Array.isArray(result.data) ? result.data : (result.data as any).data || []
        const total = activities.length
        const joined = activities.filter((a: any) => 
          a.participants?.some((p: any) => p.userId === user?.id || p.id === user?.id)
        ).length
        setStats({ total, joined, points: user?.points || 0 })
      } else {
        // Don't clear stats on error, just keep existing values
        console.log('[ActivitiesScreen] Failed to load stats, keeping existing:', result.error)
      }
    } catch (err) {
      console.error('[ActivitiesScreen] Error loading stats:', err)
      // Don't clear stats on error, just keep existing values
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
    minHeight: '100vh',
    backgroundColor: '#f0fdf4',
    paddingBottom: '100px',
    overflowY: 'auto',
    overflowX: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #14532d 0%, #15803d 45%, #22c55e 100%)',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingBottom: '20px',
    color: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  }

  const headerTopStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '6px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '0.3px',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  }

  const statsCardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    padding: '14px 16px',
    marginTop: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
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
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '2px',
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.7)',
  }

  const contentStyle: React.CSSProperties = {
    padding: '16px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '14px',
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
    background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
  }

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
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
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -10, left: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={headerTopStyle}>
          <Calendar style={{ width: '24px', height: '24px' }} />
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
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div style={statItemStyle}>
              <div style={statNumberStyle}>{stats.joined}</div>
              <div style={statLabelStyle}>Đã tham gia</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
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
          <Calendar style={{ width: '18px', height: '18px', color: '#16a34a' }} />
          Danh sách hoạt động
        </div>
        <ActivityListMobile onActivitySelect={handleActivitySelect} />
      </div>
    </div>
  )
}