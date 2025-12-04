"use client"

import { Home, Calendar, FileText, User, MessageSquare } from "lucide-react"
import type { TabType } from "@/components/main-app"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: "home" as TabType, label: "Bảng tin", icon: Home },
  { id: "docs" as TabType, label: "Tài liệu", icon: FileText },
  { id: "activities" as TabType, label: "Sổ tay", icon: Calendar },
  { id: "study" as TabType, label: "Trợ lý ảo", icon: MessageSquare },
  { id: "me" as TabType, label: "Cá nhân", icon: User },
]

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  // Inline styles for mobile compatibility - ALWAYS VISIBLE
  const navStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  }

  const navContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0 10px 0',
    maxWidth: '448px',
    margin: '0 auto',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    minWidth: '56px',
    flex: 1,
    color: isActive ? '#2563eb' : '#6b7280',
    background: isActive ? '#eff6ff' : 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  const getIconStyle = (isActive: boolean): React.CSSProperties => ({
    width: '22px',
    height: '22px',
    marginBottom: '4px',
    color: isActive ? '#2563eb' : '#6b7280',
  })

  const getLabelStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: '10px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#2563eb' : '#6b7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })

  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={getTabStyle(isActive)}
            >
              <Icon style={getIconStyle(isActive)} />
              <span style={getLabelStyle(isActive)}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
