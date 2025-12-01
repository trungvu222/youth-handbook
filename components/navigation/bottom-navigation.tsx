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
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
