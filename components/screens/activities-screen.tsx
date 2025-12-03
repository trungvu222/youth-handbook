"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, RefreshCw } from "lucide-react"
import ActivityList from "@/components/activities/activity-list"
import ActivityDetail from "@/components/activities/activity-detail"
import { Button } from "@/components/ui/button"

export default function ActivitiesScreen() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Đảm bảo component đã mount trước khi render
    setIsReady(true)
  }, [])

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity.id)
  }

  const handleBack = () => {
    setSelectedActivity(null)
  }

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#f9fafb',
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #5b2eff, #0f62ff)',
    padding: '24px',
    color: '#ffffff',
    marginBottom: '24px',
  }

  const headerTopStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '16px',
  }

  const cardContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '4px',
  }

  const cardDescStyle: React.CSSProperties = {
    color: 'rgba(191, 219, 254, 1)',
    fontSize: '14px',
  }

  const contentStyle: React.CSSProperties = {
    padding: '0 24px 24px',
  }

  const loadingStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom, #5b2eff, #0f62ff)',
  }

  const spinnerStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 8px',
  }

  if (!isReady) {
    return (
      <div style={loadingStyle} className="h-full flex items-center justify-center bg-gradient-to-b from-[#5B2EFF] to-[#0F62FF]">
        <div style={{ textAlign: 'center', color: '#ffffff' }} className="text-center text-white">
          <RefreshCw style={spinnerStyle} className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (selectedActivity) {
    return (
      <div style={{ height: '100%' }} className="h-full">
        <ActivityDetail 
          activityId={selectedActivity} 
          onBack={handleBack}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle} className="h-full bg-gray-50">
      {/* Header */}
      <div style={headerStyle} className="bg-gradient-to-r from-[#5B2EFF] to-[#0F62FF] px-6 py-6 text-white mb-6">
        <div style={headerTopStyle} className="flex items-center justify-between mb-4">
          <Calendar style={{ width: '24px', height: '24px' }} className="h-6 w-6" />
          <h1 style={titleStyle} className="text-lg font-semibold">Sinh hoạt Đoàn</h1>
          <div style={{ width: '24px', height: '24px' }} /> {/* Spacer */}
        </div>
        
        <div style={cardStyle} className="bg-white/10 rounded-lg p-4">
          <div style={cardContentStyle} className="flex items-center justify-between">
            <div>
              <h2 style={cardTitleStyle} className="text-lg font-bold mb-1">Lịch sinh hoạt</h2>
              <p style={cardDescStyle} className="text-blue-100 text-sm">
                Xem danh sách, đăng ký và điểm danh các buổi sinh hoạt
              </p>
            </div>
            <Calendar style={{ width: '32px', height: '32px', color: 'rgba(191, 219, 254, 1)' }} className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle} className="px-6 pb-6">
        <ActivityList onActivitySelect={handleActivitySelect} />
      </div>
    </div>
  )
}