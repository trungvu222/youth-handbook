"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Plus, 
  Users, 
  BarChart3,
  MessageSquare,
  QrCode,
  Download,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Award,
  TrendingUp
} from "lucide-react"

interface ActivityManagementProps {
  currentUserRole: 'ADMIN' | 'LEADER' | 'MEMBER'
  currentUserUnitId?: string
}

export default function ActivityManagement({ 
  currentUserRole, 
  currentUserUnitId 
}: ActivityManagementProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [activities, setActivities] = useState<any[]>([])
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MEETING',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    checkInStartTime: '',
    checkInEndTime: '',
    requiresLocation: false,
    allowFeedback: true,
    onTimePoints: 15,
    latePoints: 5,
    missedPoints: -10,
    feedbackPoints: 5
  })

  // Check permissions
  if (currentUserRole === 'MEMBER') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quyền truy cập bị hạn chế
          </h3>
          <p className="text-gray-600">
            Chỉ Admin và Leader mới có thể quản lý sinh hoạt.
          </p>
        </CardContent>
      </Card>
    )
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivities({
        unitId: currentUserRole === 'LEADER' ? currentUserUnitId : undefined,
        limit: 50
      })

      if (result.success && result.data) {
        setActivities(result.data.data || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityStats = async (activityId: string) => {
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivityStats(activityId)
      
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading activity stats:', error)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  const handleCreateActivity = async () => {
    try {
      const { activityApi } = await import('@/lib/api')
      
      const data = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        checkInStartTime: formData.checkInStartTime ? new Date(formData.checkInStartTime).toISOString() : null,
        checkInEndTime: formData.checkInEndTime ? new Date(formData.checkInEndTime).toISOString() : null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        unitId: currentUserRole === 'LEADER' ? currentUserUnitId : null
      }

      const result = await activityApi.createActivity(data)
      
      if (result.success) {
        alert('Tạo sinh hoạt thành công!')
        setShowCreateForm(false)
        setFormData({
          title: '',
          description: '',
          type: 'MEETING',
          startTime: '',
          endTime: '',
          location: '',
          maxParticipants: '',
          checkInStartTime: '',
          checkInEndTime: '',
          requiresLocation: false,
          allowFeedback: true,
          onTimePoints: 15,
          latePoints: 5,
          missedPoints: -10,
          feedbackPoints: 5
        })
        await loadActivities()
      } else {
        alert(result.error || 'Có lỗi xảy ra khi tạo sinh hoạt')
      }
    } catch (error) {
      console.error('Error creating activity:', error)
      alert('Có lỗi xảy ra khi tạo sinh hoạt')
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sinh hoạt</h2>
          <p className="text-gray-600 mt-1">
            {currentUserRole === 'ADMIN' 
              ? 'Quản lý tất cả sinh hoạt trong hệ thống' 
              : 'Quản lý sinh hoạt Chi đoàn của bạn'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo sinh hoạt mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Danh sách sinh hoạt</TabsTrigger>
          <TabsTrigger value="statistics">Thống kê</TabsTrigger>
          <TabsTrigger value="feedback">Quản lý góp ý</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Create Activity Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Tạo sinh hoạt mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề sinh hoạt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Loại sinh hoạt *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEETING">Sinh hoạt</SelectItem>
                        <SelectItem value="VOLUNTEER">Tình nguyện</SelectItem>
                        <SelectItem value="STUDY">Học tập</SelectItem>
                        <SelectItem value="TASK">Nhiệm vụ</SelectItem>
                        <SelectItem value="SOCIAL">Xã hội</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startTime">Thời gian bắt đầu *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Thời gian kết thúc</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Địa điểm</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Nhập địa điểm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Số lượng tối đa</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Nhập mô tả sinh hoạt"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInStartTime">Thời gian mở điểm danh</Label>
                    <Input
                      id="checkInStartTime"
                      type="datetime-local"
                      value={formData.checkInStartTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInStartTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInEndTime">Thời gian đóng điểm danh</Label>
                    <Input
                      id="checkInEndTime"
                      type="datetime-local"
                      value={formData.checkInEndTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInEndTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="onTimePoints">Điểm đúng giờ</Label>
                    <Input
                      id="onTimePoints"
                      type="number"
                      value={formData.onTimePoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, onTimePoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="latePoints">Điểm trễ</Label>
                    <Input
                      id="latePoints"
                      type="number"
                      value={formData.latePoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, latePoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="missedPoints">Điểm vắng</Label>
                    <Input
                      id="missedPoints"
                      type="number"
                      value={formData.missedPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, missedPoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedbackPoints">Điểm góp ý</Label>
                    <Input
                      id="feedbackPoints"
                      type="number"
                      value={formData.feedbackPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, feedbackPoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresLocation"
                      checked={formData.requiresLocation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresLocation: !!checked }))}
                    />
                    <Label htmlFor="requiresLocation">Yêu cầu vị trí GPS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowFeedback"
                      checked={formData.allowFeedback}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowFeedback: !!checked }))}
                    />
                    <Label htmlFor="allowFeedback">Cho phép góp ý</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateActivity} className="bg-amber-600 hover:bg-amber-700">
                    Tạo sinh hoạt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-transparent"
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activities List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Danh sách sinh hoạt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có sinh hoạt nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const typeDisplay = getActivityTypeDisplay(activity.type)
                    return (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                            <Badge className={typeDisplay.color}>
                              {typeDisplay.text}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {activity._count.participants} người tham gia
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateTime(activity.startTime)}</span>
                            </div>
                            {activity.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{activity.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <QrCode className="w-4 h-4" />
                              <span className="font-mono text-xs">{activity.qrCode}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity)
                              loadActivityStats(activity.id)
                              setActiveTab("statistics")
                            }}
                            className="bg-transparent"
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Thống kê
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          {selectedActivity && stats ? (
            <div className="space-y-6">
              {/* Activity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedActivity.title} - Thống kê</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">{stats.totalRegistered}</p>
                      <p className="text-sm text-blue-600">Đã đăng ký</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-900">{stats.checkedIn}</p>
                      <p className="text-sm text-green-600">Đã điểm danh</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-amber-900">{stats.onTime}</p>
                      <p className="text-sm text-amber-600">Đúng giờ</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-900">{stats.feedbackCount}</p>
                      <p className="text-sm text-purple-600">Góp ý</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Tỷ lệ tham dự</h4>
                      <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Tỷ lệ đúng giờ</h4>
                      <p className="text-2xl font-bold text-blue-600">{stats.onTimeRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách tham gia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.participants?.map((participant: any) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={participant.user.avatarUrl} />
                            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                              {participant.user.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.user.fullName}</p>
                            <p className="text-sm text-gray-600">{participant.user.youthPosition || 'Đoàn viên'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.status === 'CHECKED_IN' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Đã điểm danh
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Chưa điểm danh
                            </Badge>
                          )}
                          {participant.pointsEarned > 0 && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Award className="w-3 h-3 mr-1" />
                              +{participant.pointsEarned}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chọn một sinh hoạt để xem thống kê</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tính năng quản lý góp ý đang được phát triển</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

