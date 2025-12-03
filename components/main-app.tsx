"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import HomeScreen from "@/components/screens/home-screen"
import EnhancedStudyScreen from "@/components/screens/enhanced-study-screen"
import DocumentsScreen from "@/components/screens/documents-screen"
import MeScreen from "@/components/screens/me-screen"
import ActivitiesScreen from "@/components/screens/activities-screen"
import NewsScreen from "@/components/screens/news-screen"
import PointsDashboard from "@/components/points/points-dashboard"
import UserManagementEnhanced from "@/components/admin/user-management-enhanced"

export type TabType = "home" | "activities" | "study" | "docs" | "me"

interface MainAppProps {
  onLogout?: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("activities") // Default to activities (Sổ tay) to match home screen
  const [showPoints, setShowPoints] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const appWrapperStyle: React.CSSProperties = {
    maxWidth: '448px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    paddingBottom: '64px',
    overflowY: 'auto',
    overflowX: 'hidden',
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
        <div style={{ padding: '16px' }} className="p-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }} className="flex items-center justify-between mb-4">
            <button style={backButtonStyle} onClick={() => setShowPoints(false)} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Quay lại
            </button>
          </div>
          <PointsDashboard />
        </div>
      )
    }

    if (showAdmin) {
      return (
        <div style={{ padding: '16px' }} className="p-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }} className="flex items-center justify-between mb-4">
            <button style={backButtonStyle} onClick={() => setShowAdmin(false)} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Quay lại
            </button>
          </div>
          <UserManagementEnhanced />
        </div>
      )
    }

    switch (activeTab) {
      case "home":
        return <NewsScreen />
      case "activities":
        return <ActivitiesScreen />
      case "study":
        return <EnhancedStudyScreen />
      case "docs":
        return <DocumentsScreen />
      case "me":
        return <MeScreen onLogout={onLogout} />
      default:
        return <HomeScreen onShowPoints={() => setShowPoints(true)} onShowAdmin={() => setShowAdmin(true)} />
    }
  }

  return (
    <div style={containerStyle} className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
      {/* Mobile container wrapper */}
      <div style={appWrapperStyle} className="max-w-md mx-auto bg-white shadow-lg min-h-screen w-full relative flex flex-col">
        <main style={mainStyle} className="flex-1 pb-16 overflow-auto">{renderScreen()}</main>
        {!showPoints && !showAdmin && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
      </div>
    </div>
  )
}

