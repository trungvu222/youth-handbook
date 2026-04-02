"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  QrCode,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Award,
  ArrowLeft,
  User,
  Star
} from "lucide-react"

interface ActivityDetailProps {
  activityId: string
  onBack?: () => void
}

export default function ActivityDetail({ activityId, onBack }: ActivityDetailProps) {
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQRForm, setShowQRForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [location, setLocation] = useState<{latitude?: number, longitude?: number}>({})
  const [feedback, setFeedback] = useState({
    content: '',
    type: 'SUGGESTION',
    isAnonymous: false
  })
  const [submitting, setSubmitting] = useState(false)

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.getActivity(activityId)
      
      if (result.success && result.data) {
        setActivity(result.data)
      }
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activityId) {
      loadActivity()
    }
  }, [activityId])

  useEffect(() => {
    // Get user location if required
    if (activity?.requiresLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [activity])

  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      alert('Vui lòng nhập mã QR')
      return
    }

    setSubmitting(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.checkInActivity(activityId, {
        qrCode: qrCode.trim(),
        ...location
      })
      
      if (result.success) {
        alert(`Điểm danh thành công! Bạn được ${result.data.pointsEarned} điểm.`)
        setShowQRForm(false)
        setQrCode('')
        await loadActivity() // Reload to update status
      } else {
        alert(result.error || 'Có lỗi xảy ra khi điểm danh')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Có lỗi xảy ra khi điểm danh')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedback.content.trim()) {
      alert('Vui lòng nhập nội dung góp ý')
      return
    }

    setSubmitting(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const result = await activityApi.submitFeedback(activityId, feedback)
      
      if (result.success) {
        alert('Gửi góp ý thành công!')
        setShowFeedbackForm(false)
        setFeedback({
          content: '',
          type: 'SUGGESTION',
          isAnonymous: false
        })
        await loadActivity() // Reload to update feedback count
      } else {
        alert(result.error || 'Có lỗi xảy ra khi gửi góp ý')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Có lỗi xảy ra khi gửi góp ý')
    } finally {
      setSubmitting(false)
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
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN')
  }

  const canCheckIn = () => {
    if (!activity || !activity.userParticipation) return false
    if (activity.userParticipation.status === 'CHECKED_IN') return false
    
    const now = new Date()
    const checkInStart = new Date(activity.checkInStartTime || activity.startTime)
    const checkInEnd = activity.checkInEndTime ? new Date(activity.checkInEndTime) : null
    
    return now >= checkInStart && (!checkInEnd || now <= checkInEnd)
  }

  const isCheckedIn = () => {
    return activity?.userParticipation?.status === 'CHECKED_IN'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activity) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy thông tin sinh hoạt.</p>
        </CardContent>
      </Card>
    )
  }

  const typeDisplay = getActivityTypeDisplay(activity.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="bg-transparent">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết sinh hoạt</h1>
      </div>

      {/* Activity Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{activity.title}</h2>
                  <Badge className={typeDisplay.color}>
                    {typeDisplay.text}
                  </Badge>
                  {activity.userParticipation && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Đã đăng ký
                    </Badge>
                  )}
                  {isCheckedIn() && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <QrCode className="w-3 h-3 mr-1" />
                      Đã điểm danh
                    </Badge>
                  )}
                </div>
                
                {activity.description && (
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Thời gian bắt đầu</p>
                      <p className="text-gray-600">{formatDateTime(activity.startTime)}</p>
                    </div>
                  </div>
                  
                  {activity.endTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Thời gian kết thúc</p>
                        <p className="text-gray-600">{formatDateTime(activity.endTime)}</p>
                      </div>
                    </div>
                  )}
                  
                  {activity.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Địa điểm</p>
                        <p className="text-gray-600">{activity.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Số lượng tham gia</p>
                      <p className="text-gray-600">
                        {activity.participants?.length || 0}
                        {activity.maxParticipants && ` / ${activity.maxParticipants}`} người
                      </p>
                    </div>
                  </div>
                  
                  {activity.unit && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Chi đoàn</p>
                        <p className="text-gray-600">{activity.unit.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Điểm thưởng</p>
                      <p className="text-gray-600">
                        Đúng giờ: +{activity.onTimePoints} | Trễ: +{activity.latePoints} | Vắng: {activity.missedPoints}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {activity.userParticipation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-in */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                Điểm danh
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCheckedIn() ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-green-800 font-medium">Đã điểm danh thành công</p>
                  <p className="text-gray-600 text-sm">
                    Thời gian: {formatDateTime(activity.userParticipation.checkInTime)}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Điểm nhận được: +{activity.userParticipation.pointsEarned}
                  </p>
                </div>
              ) : canCheckIn() ? (
                <div className="space-y-4">
                  {!showQRForm ? (
                    <Button
                      onClick={() => setShowQRForm(true)}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Điểm danh ngay
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="qrCode">Nhập mã QR:</Label>
                      <Input
                        id="qrCode"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Quét hoặc nhập mã QR..."
                      />
                      {activity.requiresLocation && (
                        <p className="text-xs text-gray-600">
                          📍 Vị trí địa lý sẽ được ghi nhận
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCheckIn}
                          disabled={submitting}
                          className="flex-1 bg-amber-600 hover:bg-amber-700"
                        >
                          {submitting ? 'Đang xử lý...' : 'Xác nhận điểm danh'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowQRForm(false)}
                          className="bg-transparent"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Chưa đến giờ điểm danh</p>
                  {activity.checkInStartTime && (
                    <p className="text-gray-500 text-sm">
                      Mở từ: {formatDateTime(activity.checkInStartTime)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {activity.allowFeedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  Góp ý kiến nghị
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showFeedbackForm ? (
                  <Button
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Gửi góp ý
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="feedbackType">Loại góp ý:</Label>
                      <Select
                        value={feedback.type}
                        onValueChange={(value) => setFeedback(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUGGESTION">Kiến nghị</SelectItem>
                          <SelectItem value="COMPLAINT">Khiếu nại</SelectItem>
                          <SelectItem value="PRAISE">Khen ngợi</SelectItem>
                          <SelectItem value="QUESTION">Câu hỏi</SelectItem>
                          <SelectItem value="OTHER">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="feedbackContent">Nội dung:</Label>
                      <Textarea
                        id="feedbackContent"
                        value={feedback.content}
                        onChange={(e) => setFeedback(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Nhập nội dung góp ý..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous"
                        checked={feedback.isAnonymous}
                        onCheckedChange={(checked) => setFeedback(prev => ({ ...prev, isAnonymous: !!checked }))}
                      />
                      <Label htmlFor="anonymous" className="text-sm">Gửi ẩn danh</Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={submitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? 'Đang gửi...' : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Gửi góp ý
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackForm(false)}
                        className="bg-transparent"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Participants List */}
      {activity.participants?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Danh sách tham gia ({activity.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activity.participants.map((participant: any) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={participant.user.avatarUrl} />
                    <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                      {participant.user.fullName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{participant.user.fullName}</p>
                    <p className="text-xs text-gray-600">
                      {participant.user.role === 'LEADER' && participant.user.unit
                        ? `Bí thư ${participant.user.unit.name}`
                        : participant.user.youthPosition || 'Đoàn viên'}
                    </p>
                  </div>
                  {participant.status === 'CHECKED_IN' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}