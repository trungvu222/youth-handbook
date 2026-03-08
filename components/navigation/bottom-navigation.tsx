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

// Per-tab accent colors
const TAB_COLOR: Record<string, string> = {
  home:       '#dc2626',
  activities: '#16a34a',
  docs:       '#2563eb',
  study:      '#7c3aed',
  me:         '#0891b2',
}

const TAB_BG: Record<string, string> = {
  home:       '#fef2f2',
  activities: '#f0fdf4',
  docs:       '#eff6ff',
  study:      '#f5f3ff',
  me:         '#ecfeff',
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 -2px 20px rgba(0,0,0,0.08)',
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  }

  const navContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '5px 2px 6px 2px',
    maxWidth: '500px',
    margin: '0 auto',
  }

  const getTabStyle = (tab: typeof tabs[0], isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 4px 4px',
    minWidth: '52px',
    flex: 1,
    background: isActive ? TAB_BG[tab.id] : 'transparent',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: isActive ? `0 2px 8px ${TAB_COLOR[tab.id]}22` : 'none',
  })

  const getIndicatorStyle = (tab: typeof tabs[0], isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: isActive ? '24px' : '0',
    height: '3px',
    borderRadius: '0 0 3px 3px',
    backgroundColor: TAB_COLOR[tab.id],
    transition: 'width 0.25s ease',
  })

  const getIconWrapStyle = (tab: typeof tabs[0], isActive: boolean): React.CSSProperties => ({
    width: '34px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    marginBottom: '2px',
  })

  const getIconStyle = (tab: typeof tabs[0], isActive: boolean): React.CSSProperties => ({
    width: '21px',
    height: '21px',
    color: isActive ? TAB_COLOR[tab.id] : '#94a3b8',
    strokeWidth: isActive ? 2.3 : 1.8,
    transition: 'all 0.15s ease',
    transform: isActive ? 'scale(1.1)' : 'scale(1)',
  })

  const getLabelStyle = (tab: typeof tabs[0], isActive: boolean): React.CSSProperties => ({
    fontSize: '10px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? TAB_COLOR[tab.id] : '#94a3b8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: isActive ? '0.2px' : '0',
    transition: 'color 0.2s ease',
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
              style={getTabStyle(tab, isActive)}
            >
              {/* Top accent indicator */}
              <div style={getIndicatorStyle(tab, isActive)} />

              <div style={getIconWrapStyle(tab, isActive)}>
                <Icon style={getIconStyle(tab, isActive)} />
              </div>
              <span style={getLabelStyle(tab, isActive)}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
