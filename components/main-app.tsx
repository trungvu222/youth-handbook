"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import EnhancedStudyScreen from "@/components/screens/enhanced-study-screen"
import DocumentsScreenMobile from "@/components/screens/documents-screen-mobile"
import MeScreenMobile from "@/components/screens/me-screen-mobile"
import ActivitiesScreen from "@/components/screens/activities-screen"
import NewsScreenMobile from "@/components/screens/news-screen-mobile"
import BooksScreenMobile from "@/components/screens/books-screen-mobile"
import PointsDashboard from "@/components/points/points-dashboard"
import UserManagementEnhanced from "@/components/admin/user-management-enhanced"
import QRScanner from "@/components/qr-scanner"

export type TabType = "home" | "activities" | "books" | "study" | "docs" | "me"

interface MainAppProps {
  onLogout?: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [showPoints, setShowPoints] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [openDocumentId, setOpenDocumentId] = useState<string | undefined>()
  const [booksKey, setBooksKey] = useState(0) // Key to force reload books screen
  const [activitiesKey, setActivitiesKey] = useState(0) // Key to force reload activities screen
  const [qrScanType, setQrScanType] = useState<'book' | 'activity' | null>(null) // Track what was scanned

  // Called from notifications: switch to docs tab and auto-open the document
  const handleOpenDocument = (docId: string) => {
    setOpenDocumentId(docId)
    setActiveTab('docs')
  }

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f6fa',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', // Space for bottom nav + notch
    WebkitOverflowScrolling: 'touch',
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
      return <PointsDashboard onBack={() => setShowPoints(false)} />
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
        return <NewsScreenMobile onShowPoints={() => setShowPoints(true)} />
      case "activities":
        return <ActivitiesScreen key={activitiesKey} />
      case "books":
        return <BooksScreenMobile key={booksKey} />
      case "study":
        return <EnhancedStudyScreen />
      case "docs":
        return <DocumentsScreenMobile initialDocumentId={openDocumentId} onDocumentOpened={() => setOpenDocumentId(undefined)} />
      case "me":
        return <MeScreenMobile onLogout={onLogout} onOpenDocument={handleOpenDocument} />
      default:
        return <NewsScreenMobile onShowPoints={() => setShowPoints(true)} />
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
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onQRScan={() => setShowQRScanner(true)}
        />
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          onClose={() => setShowQRScanner(false)}
          onSuccess={(type) => {
            if (type === 'book') {
              // Force reload books screen
              setBooksKey(prev => prev + 1)
              // Switch to books tab if not already there
              if (activeTab !== "books") {
                setActiveTab("books")
              }
            } else if (type === 'activity') {
              // Force reload activities screen
              setActivitiesKey(prev => prev + 1)
              // Switch to activities tab if not already there
              if (activeTab !== "activities") {
                setActiveTab("activities")
              }
            }
          }}
        />
      )}
    </div>
  )
}

