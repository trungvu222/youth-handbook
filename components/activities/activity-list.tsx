"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Filter,
  ChevronRight
} from "lucide-react"

interface Activity {
  id: string
  title: string
  description?: string
  type: string
  startTime: string
  endTime?: string
  location?: string
  maxParticipants?: number
  status: string
  organizer: {
    id: string
    fullName: string
  }
  unit?: {
    id: string
    name: string
  }
  participants: any[]
  userParticipation?: any
  _count: {
    participants: number
    feedbacks: number
  }
}

interface ActivityListProps {
  onActivitySelect?: (activity: Activity) => void
}

export default function ActivityList({ onActivitySelect }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'ACTIVE'
  })
  const [joinLoading, setJoinLoading] = useState<string | null>(null)

  const loadActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[ActivityList] Loading activities...')
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivities({
        type: filters.type === 'all' ? undefined : filters.type,
        status: filters.status === 'all' ? undefined : filters.status,
        search: filters.search || undefined,
        limit: 20
      })

      console.log('[ActivityList] API result:', result)

      if (result.success && result.data) {
        // Handle different data access patterns
        let activitiesData = [];
        if (Array.isArray(result.data)) {
          activitiesData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          activitiesData = result.data.data;
        } else if (result.data.activities && Array.isArray(result.data.activities)) {
          activitiesData = result.data.activities;
        }
        
        console.log('[ActivityList] Activities loaded:', activitiesData.length)
        setActivities(activitiesData)
      } else {
        console.log('[ActivityList] No data or error:', result.error)
        setActivities([])
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (error) {
      console.error('❌ ActivityList: Error loading activities:', error)
      setError('Không thể tải danh sách sinh hoạt. Vui lòng kiểm tra kết nối mạng.')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load with delay for Capacitor
    const timer = setTimeout(() => {
      loadActivities()
    }, 100)
    return () => clearTimeout(timer)
  }, [filters])

  // Load activities when component mounts and when auth changes
  useEffect(() => {
    const checkAndLoad = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token')
        console.log('[ActivityList] Token check:', token ? 'exists' : 'missing')
        if (token) {
          loadActivities()
        }
      }
    }
    
    // Delay for Capacitor initialization
    const timer = setTimeout(checkAndLoad, 200)
    
    // Listen for storage changes (when login happens)
    const handleStorageChange = () => {
      checkAndLoad()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Listen for auth changes
    window.addEventListener('auth_changed', handleStorageChange)
    // Also listen for focus event to refresh on page focus
    window.addEventListener('focus', checkAndLoad)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth_changed', handleStorageChange)
      window.removeEventListener('focus', checkAndLoad)
    }
  }, [])

  const handleJoinActivity = async (activityId: string) => {
    setJoinLoading(activityId)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.joinActivity(activityId)
      
      if (result.success) {
        // Reload activities to update participation status
        await loadActivities()
      } else {
        alert(result.error || 'Có lỗi xảy ra khi đăng ký')
      }
    } catch (error) {
      console.error('Error joining activity:', error)
      alert('Có lỗi xảy ra khi đăng ký')
    } finally {
      setJoinLoading(null)
    }
  }

  const getActivityTypeDisplay = (type: string) => {
    const types = {
      'MEETING': { text: 'Sinh hoạt', color: 'bg-blue-100 text-blue-800' },
      'VOLUNTEER': { text: 'Tình nguyện', color: 'bg-green-100 text-green-800' },
      'STUDY': { text: 'Học tập', color: 'bg-purple-100 text-purple-800' },
      'TASK': { text: 'Nhiệm vụ', color: 'bg-orange-100 text-orange-800' },
      'SOCIAL': { text: 'Xã hội', color: 'bg-pink-100 text-pink-800' }
    }
    return types[type as keyof typeof types] || { text: type, color: 'bg-gray-100 text-gray-800' }
  }

  const getStatusDisplay = (status: string) => {
    const statuses = {
      'DRAFT': { text: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      'ACTIVE': { text: 'Đang mở', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { text: 'Đã kết thúc', color: 'bg-blue-100 text-blue-800' },
      'CANCELLED': { text: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    }
    return statuses[status as keyof typeof statuses] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const isActivityFull = (activity: Activity) => {
    return activity.maxParticipants && activity._count.participants >= activity.maxParticipants
  }

  const isRegistrationOpen = (activity: Activity) => {
    return activity.status === 'ACTIVE' && !isActivityFull(activity)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadActivities} variant="outline">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm sinh hoạt..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Loại sinh hoạt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="MEETING">Sinh hoạt</SelectItem>
                <SelectItem value="VOLUNTEER">Tình nguyện</SelectItem>
                <SelectItem value="STUDY">Học tập</SelectItem>
                <SelectItem value="TASK">Nhiệm vụ</SelectItem>
                <SelectItem value="SOCIAL">Xã hội</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Đang mở</SelectItem>
                <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* Activities List */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có sinh hoạt nào được tìm thấy.</p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => {
            const typeDisplay = getActivityTypeDisplay(activity.type)
            const statusDisplay = getStatusDisplay(activity.status)
            const startDateTime = formatDateTime(activity.startTime)
            const isRegistered = !!activity.userParticipation
            const canRegister = isRegistrationOpen(activity) && !isRegistered

            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {activity.title}
                        </h3>
                        <Badge className={typeDisplay.color}>
                          {typeDisplay.text}
                        </Badge>
                        <Badge className={statusDisplay.color}>
                          {statusDisplay.text}
                        </Badge>
                      </div>
                      
                      {activity.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{startDateTime.date} lúc {startDateTime.time}</span>
                        </div>
                        
                        {activity.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{activity.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {activity._count.participants}
                            {activity.maxParticipants && ` / ${activity.maxParticipants}`} người tham gia
                          </span>
                        </div>
                        
                        {activity.unit && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.unit.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {isRegistered ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã đăng ký
                        </Badge>
                      ) : canRegister ? (
                        <Button
                          size="sm"
                          onClick={() => handleJoinActivity(activity.id)}
                          disabled={joinLoading === activity.id}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {joinLoading === activity.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          Đăng ký
                        </Button>
                      ) : isActivityFull(activity) ? (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Đã đầy
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Đã đóng
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActivitySelect?.(activity)}
                        className="bg-transparent"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

