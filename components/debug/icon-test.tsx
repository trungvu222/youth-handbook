"use client"

import { 
  User, Calendar, FileText, BookOpen, Activity, Award, 
  MessageSquare, BarChart3, Settings, Search, Target, 
  Trophy, Clipboard, PieChart, Star, Bell,
  Crown, Medal, TrendingUp, Clock
} from "lucide-react"

export function IconTest() {
  const icons = [
    { name: "User", icon: User },
    { name: "Calendar", icon: Calendar },
    { name: "FileText", icon: FileText },
    { name: "BookOpen", icon: BookOpen },
    { name: "Activity", icon: Activity },
    { name: "Award", icon: Award },
    { name: "MessageSquare", icon: MessageSquare },
    { name: "BarChart3", icon: BarChart3 },
    { name: "Settings", icon: Settings },
    { name: "Search", icon: Search },
    { name: "Target", icon: Target },
    { name: "Trophy", icon: Trophy },
    { name: "Clipboard", icon: Clipboard },
    { name: "PieChart", icon: PieChart },
    { name: "Star", icon: Star },
    { name: "Bell", icon: Bell },
    { name: "Crown", icon: Crown },
    { name: "Medal", icon: Medal },
    { name: "TrendingUp", icon: TrendingUp },
    { name: "Clock", icon: Clock },
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Icon Test</h2>
      <div className="grid grid-cols-4 gap-4">
        {icons.map(({ name, icon: Icon }) => (
          <div key={name} className="flex flex-col items-center p-3 border rounded">
            <Icon className="w-8 h-8 mb-2" />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}



