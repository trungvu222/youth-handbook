"use client"

import { Home, Calendar, FileText, User, MessageSquare } from "lucide-react"
import type { TabType } from "@/components/main-app"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: "home" as TabType, label: "Bảng tin", icon: Home },
  { id: "activities" as TabType, label: "Sổ tay", icon: Calendar },
  { id: "docs" as TabType, label: "Tài liệu", icon: FileText },
  { id: "study" as TabType, label: "Học tập", icon: MessageSquare },
  { id: "me" as TabType, label: "Cá nhân", icon: User },
]

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.08)',
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  }

  const navContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '6px 4px 8px 4px',
    maxWidth: '500px',
    margin: '0 auto',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px',
    minWidth: '52px',
    flex: 1,
    color: isActive ? '#dc2626' : '#94a3b8',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  })

  const getIconWrapStyle = (isActive: boolean): React.CSSProperties => ({
    width: '36px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    backgroundColor: isActive ? '#fef2f2' : 'transparent',
    transition: 'all 0.2s ease',
    marginBottom: '2px',
  })

  const getIconStyle = (isActive: boolean): React.CSSProperties => ({
    width: '20px',
    height: '20px',
    color: isActive ? '#dc2626' : '#94a3b8',
    strokeWidth: isActive ? 2.2 : 1.8,
  })

  const getLabelStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: '10px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#dc2626' : '#94a3b8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: isActive ? '0.2px' : '0',
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
              <div style={getIconWrapStyle(isActive)}>
                <Icon style={getIconStyle(isActive)} />
              </div>
              <span style={getLabelStyle(isActive)}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
