"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Phone,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Download,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { activityApi } from "@/lib/api"
import { BACKEND_URL } from "@/lib/config"

const RAW_API_URL = BACKEND_URL;
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

interface ActivityDetailAdminProps {
  activityId: string
  onBack?: () => void
  onEdit?: (activity: any) => void
  onDelete?: (activity: any) => void
}

interface Participant {
  id: string
  userId: string
  status: 'REGISTERED' | 'CHECKED_IN' | 'ABSENT' | 'COMPLETED'
  checkInTime?: string
  absentReason?: string
  pointsEarned: number
  user: {
    id: string
    fullName: string
    phone?: string
    email?: string
    avatarUrl?: string
    youthPosition?: string
    unit?: { name: string }
  }
}

interface AttendanceStats {
  total: number
  checkedIn: number
  onTime: number
  late: number
  registered: number
  absent: number
  completed: number
  attendanceRate: string
  onTimeRate: string
}

export default function ActivityDetailAdmin({ activityId, onBack, onEdit, onDelete }: ActivityDetailAdminProps) {
  const { toast } = useToast()
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")
  
  // Attendance state
  const [participants, setParticipants] = useState<Participant[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [absentReason, setAbsentReason] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Load activity details
  const loadActivity = async () => {
    setLoading(true)
    try {
      const result = await activityApi.getActivity(activityId)
      if (result.success && result.data) {
        setActivity(result.data)
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể tải thông tin hoạt động",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading activity:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải thông tin",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load attendance list
  const loadAttendance = async () => {
    setLoadingAttendance(true)
    try {
      const params: any = {}
      if (filterStatus !== "all") {
        params.status = filterStatus
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const result = await activityApi.getAttendanceList(activityId, params)
      console.log('[DEBUG] Attendance API result:', result)
      console.log('[DEBUG] Stats:', result.data?.stats)
      if (result.success && result.data) {
        setParticipants(result.data.participants || [])
        setAttendanceStats(result.data.stats || null)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  useEffect(() => {
    console.log('[DEBUG] Component mounted/activityId changed:', activityId)
    if (activityId) {
      loadActivity()
    }
  }, [activityId])

  useEffect(() => {
    console.log('[DEBUG] useEffect triggered - activeTab:', activeTab, 'activityId:', activityId, 'filterStatus:', filterStatus)
    console.log('[DEBUG] Condition check:', activeTab === "attendance", '&&', !!activityId, '=', activeTab === "attendance" && activityId)
    if (activeTab === "attendance" && activityId) {
      console.log('[DEBUG] Calling loadAttendance...')
      loadAttendance()
    }
  }, [activeTab, activityId, filterStatus])

  // Handle search with debounce
  useEffect(() => {
    if (activeTab === "attendance") {
      const timer = setTimeout(() => {
        loadAttendance()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  // Update participant status
  const handleUpdateStatus = async () => {
    if (!selectedParticipant || !newStatus) return
    
    setUpdatingStatus(true)
    try {
      const result = await activityApi.updateAttendanceStatus(
        activityId, 
        selectedParticipant.id,
        {
          status: newStatus,
          absentReason: newStatus === 'ABSENT' ? absentReason : undefined
        }
      )
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái điểm danh"
        })
        setShowStatusDialog(false)
        setSelectedParticipant(null)
        setNewStatus("")
        setAbsentReason("")
        loadAttendance()
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể cập nhật trạng thái",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Đã điểm danh</Badge>
      case 'REGISTERED':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chưa điểm danh</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Báo vắng</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Hoàn thành</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get activity type display
  const getActivityTypeDisplay = (type: string) => {
    const types: Record<string, { text: string; color: string }> = {
      'MEETING': { text: 'Sinh hoạt', color: 'bg-blue-100 text-blue-800' },
      'VOLUNTEER': { text: 'Tình nguyện', color: 'bg-green-100 text-green-800' },
      'STUDY': { text: 'Học tập', color: 'bg-purple-100 text-purple-800' },
      'TASK': { text: 'Nhiệm vụ', color: 'bg-orange-100 text-orange-800' },
      'SOCIAL': { text: 'Xã hội', color: 'bg-pink-100 text-pink-800' },
      'CONFERENCE': { text: 'Hội nghị', color: 'bg-indigo-100 text-indigo-800' }
    }
    return types[type] || { text: type, color: 'bg-gray-100 text-gray-800' }
  }

  // Get activity status display
  const getActivityStatusDisplay = (status: string) => {
    const statuses: Record<string, { text: string; color: string }> = {
      'DRAFT': { text: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      'ACTIVE': { text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800' },
      'CANCELLED': { text: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    }
    return statuses[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  // Filter participants
  const filteredParticipants = participants.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        p.user.fullName.toLowerCase().includes(search) ||
        p.user.phone?.includes(search) ||
        p.user.email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} disabled>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin hoạt động.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typeDisplay = getActivityTypeDisplay(activity.type)
  const statusDisplay = getActivityStatusDisplay(activity.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết {activity.title}</h1>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(activity)}>
              <Edit className="w-4 h-4 mr-2" />
              Sửa
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" className="text-red-600" onClick={() => onDelete(activity)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          )}
        </div>
      </div>

      {/* Activity Header Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={typeDisplay.color}>{typeDisplay.text}</Badge>
            <Badge className={statusDisplay.color}>{statusDisplay.text}</Badge>
            <span className="text-gray-500">
              <Calendar className="w-4 h-4 inline mr-1" />
              {formatDateTime(activity.startTime)} - {activity.endTime ? formatDateTime(activity.endTime) : 'Chưa xác định'}
            </span>
          </div>
          
          {activity.description && (
            <p className="text-gray-600 mb-4">{activity.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('[DEBUG] Tab changed from', activeTab, 'to', value)
        setActiveTab(value)
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="attendance">Danh sách điểm danh</TabsTrigger>
        </TabsList>

        {/* Tab: Thông tin */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Activity Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nội dung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{activity.description || 'Không có mô tả'}</p>
                </CardContent>
              </Card>

              {/* Attachments */}
              {activity.attachments && activity.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tài liệu đính kèm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>STT</TableHead>
                          <TableHead>File tài liệu</TableHead>
                          <TableHead>Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activity.attachments.map((file: string, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{file.split('/').pop()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Conclusion */}
              {activity.conclusion && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kết luận cuộc họp</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{activity.conclusion}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Statistics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Đơn vị tổ chức</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{activity.unit?.name || activity.hostUnit || 'Chưa xác định'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thống kê điểm danh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Đúng giờ
                    </span>
                    <span className="font-bold text-green-600">{attendanceStats?.onTime || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-orange-600" />
                      Đến trễ
                    </span>
                    <span className="font-bold text-orange-600">{attendanceStats?.late || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-blue-600" />
                      Chưa điểm danh
                    </span>
                    <span className="font-bold text-blue-600">{attendanceStats?.registered || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Vắng mặt
                    </span>
                    <span className="font-bold text-red-600">{attendanceStats?.absent || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Chart */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#10b981"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(attendanceStats?.checkedIn || 0) / (attendanceStats?.total || 1) * 352} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {attendanceStats?.checkedIn || 0}/{attendanceStats?.total || 0}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Đoàn viên đã điểm danh/ Tổng số Đoàn viên
                    </p>
                    <p className="text-xs text-blue-600 font-semibold">
                      Tỷ lệ điểm danh: {attendanceStats?.attendanceRate || '0.0'}%
                    </p>
                    <p className="text-xs text-green-600">
                      Đúng giờ: {attendanceStats?.onTimeRate || '0.0'}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Danh sách điểm danh */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đúng giờ</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats?.onTime || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{attendanceStats?.onTimeRate || '0.0'}% đã điểm danh</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đến trễ</p>
                    <p className="text-2xl font-bold text-orange-600">{attendanceStats?.late || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{attendanceStats?.attendanceRate || '0.0'}% tổng</p>
                  </div>
                  <Clock3 className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chưa điểm danh</p>
                    <p className="text-2xl font-bold text-blue-600">{attendanceStats?.registered || 0}</p>
                  </div>
                  <Clock3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vắng mặt</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Trạng thái điểm danh --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="CHECKED_IN">Đã điểm danh</SelectItem>
                      <SelectItem value="REGISTERED">Chưa điểm danh</SelectItem>
                      <SelectItem value="ABSENT">Báo vắng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Họ và tên, Số điện thoại, Số thẻ Đảng"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={loadAttendance}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tải lại
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Badges */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-gray-600">Tổng số: {attendanceStats?.total || 0} đoàn viên</span>
            <Badge className="bg-green-100 text-green-800">{attendanceStats?.checkedIn || 0} Đã điểm danh</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">{attendanceStats?.registered || 0} Chưa điểm danh</Badge>
            <Badge className="bg-red-100 text-red-800">{attendanceStats?.absent || 0} Báo vắng</Badge>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardContent className="pt-4">
              {loadingAttendance ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Đang tải...</p>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Không có đoàn viên nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">STT</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Trạng thái điểm danh</TableHead>
                      <TableHead>Thời gian điểm danh</TableHead>
                      <TableHead>Lý do báo vắng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-20">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={participant.user.avatarUrl} />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {participant.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{participant.user.fullName}</p>
                              {participant.user.phone && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {participant.user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(participant.status)}</TableCell>
                        <TableCell>
                          {participant.checkInTime 
                            ? formatDateTime(participant.checkInTime)
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {participant.absentReason || '-'}
                        </TableCell>
                        <TableCell>
                          {participant.status === 'CHECKED_IN' && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Hoàn thành
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedParticipant(participant)
                              setNewStatus(participant.status)
                              setAbsentReason(participant.absentReason || '')
                              setShowStatusDialog(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái điểm danh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParticipant && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedParticipant.user.avatarUrl} />
                  <AvatarFallback>
                    {selectedParticipant.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedParticipant.user.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedParticipant.user.phone}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái mới</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTERED">Chưa điểm danh</SelectItem>
                  <SelectItem value="CHECKED_IN">Đã điểm danh</SelectItem>
                  <SelectItem value="ABSENT">Báo vắng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'ABSENT' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Lý do vắng</label>
                <Textarea
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  placeholder="Nhập lý do vắng..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={updatingStatus || !newStatus}
            >
              {updatingStatus ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
