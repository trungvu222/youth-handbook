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
  // Inline styles for mobile compatibility
  const navStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const navContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    minWidth: 0,
    flex: 1,
    color: isActive ? '#2563eb' : '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  })

  const iconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    marginBottom: '4px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <nav style={navStyle} className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div style={navContainerStyle} className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={getTabStyle(isActive)}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon style={iconStyle} className="h-5 w-5 mb-1" />
              <span style={labelStyle} className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
