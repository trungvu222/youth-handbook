"use client"

import { useState } from "react"
import { Calendar, Plus } from "lucide-react"
import ActivityList from "@/components/activities/activity-list"
import ActivityDetail from "@/components/activities/activity-detail"

export default function ActivitiesScreen() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity.id)
  }

  const handleBack = () => {
    setSelectedActivity(null)
  }

  if (selectedActivity) {
    return (
      <div className="h-full">
        <ActivityDetail 
          activityId={selectedActivity} 
          onBack={handleBack}
        />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5B2EFF] to-[#0F62FF] px-6 py-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <Calendar className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Sinh hoạt Đoàn</h1>
          <div className="w-6 h-6" /> {/* Spacer */}
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Lịch sinh hoạt</h2>
              <p className="text-blue-100 text-sm">
                Xem danh sách, đăng ký và điểm danh các buổi sinh hoạt
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <ActivityList onActivitySelect={handleActivitySelect} />
      </div>
    </div>
  )
}