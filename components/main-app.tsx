"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import HomeScreen from "@/components/screens/home-screen"
import EnhancedStudyScreen from "@/components/screens/enhanced-study-screen"
import DocumentsScreenMobile from "@/components/screens/documents-screen-mobile"
import MeScreenMobile from "@/components/screens/me-screen-mobile"
import ActivitiesScreen from "@/components/screens/activities-screen"
import NewsScreenMobile from "@/components/screens/news-screen-mobile"
import PointsDashboard from "@/components/points/points-dashboard"
import UserManagementEnhanced from "@/components/admin/user-management-enhanced"

export type TabType = "home" | "activities" | "study" | "docs" | "me"

interface MainAppProps {
  onLogout?: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("activities")
  const [showPoints, setShowPoints] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: '70px', // Space for bottom nav
  }

  const navWrapperStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
  }

  const backButtonStyle: React.CSSProperties = {
    color: '#2563eb',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  }

  const renderScreen = () => {
    if (showPoints) {
      return (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button style={backButtonStyle} onClick={() => setShowPoints(false)}>
              ← Quay lại
            </button>
          </div>
          <PointsDashboard />
        </div>
      )
    }

    if (showAdmin) {
      return (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button style={backButtonStyle} onClick={() => setShowAdmin(false)}>
              ← Quay lại
            </button>
          </div>
          <UserManagementEnhanced />
        </div>
      )
    }

    switch (activeTab) {
      case "home":
        return <NewsScreenMobile />
      case "activities":
        return <ActivitiesScreen />
      case "study":
        return <EnhancedStudyScreen />
      case "docs":
        return <DocumentsScreenMobile />
      case "me":
        return <MeScreenMobile onLogout={onLogout} />
      default:
        return <HomeScreen onShowPoints={() => setShowPoints(true)} onShowAdmin={() => setShowAdmin(true)} />
    }
  }

  return (
    <div style={containerStyle}>
      {/* Main Content - scrollable */}
      <main style={mainStyle}>
        {renderScreen()}
      </main>
      
      {/* Bottom Navigation - ALWAYS visible and fixed */}
      <div style={navWrapperStyle}>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}

