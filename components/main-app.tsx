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

  const renderScreen = () => {
    if (showPoints) {
      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowPoints(false)} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Quay lại
            </button>
          </div>
          <PointsDashboard />
        </div>
      )
    }

    if (showAdmin) {
      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowAdmin(false)} className="text-blue-600 hover:text-blue-700 font-medium">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
      {/* Mobile container wrapper */}
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen w-full relative flex flex-col">
        <main className="flex-1 pb-16 overflow-auto">{renderScreen()}</main>
        {!showPoints && !showAdmin && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
      </div>
    </div>
  )
}

