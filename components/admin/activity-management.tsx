"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Plus, Users, Edit, Trash2, Eye, RefreshCw, MapPin, Clock, AlertTriangle, MoreVertical, ClipboardList, FileText, CheckCircle2, XCircle, Clock3, FileCheck, Upload, X, Send, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

// Allowed file types and max size
const ALLOWED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.pptx', '.doc', '.docx', '.xls', '.xlsx']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

interface Activity {
  id: string
  title: string
  description?: string
  type: string
  status: string
  startTime: string
  endTime?: string
  location?: string
  pointsReward: number
  organizer?: { fullName: string }
  unit?: { name: string }
  _count?: { participants: number }
  conclusion?: string
  hostUnit?: string
  manager?: { id: string; fullName: string }
  materials?: string
  attachments?: string[]
}

interface Participant {
  id: string
  userId: string
  status: string
  checkInTime?: string
  user: {
    id: string
    fullName: string
    email: string
    studentId?: string
  }
}

interface ActivityStats {
  totalRegistered: number
  checkedIn: number
  onTime: number
  late: number
  absent: number
  feedbackCount: number
  attendanceRate: string
  onTimeRate: string
  participants: Participant[]
  nonParticipants: any[]
}

export default function ActivityManagement() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [showConclusionDialog, setShowConclusionDialog] = useState(false)
  const [showViewConclusionDialog, setShowViewConclusionDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [conclusionText, setConclusionText] = useState("")
  const [savingConclusion, setSavingConclusion] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [sendNotification, setSendNotification] = useState(false)
  const [notifyAll, setNotifyAll] = useState(true)
  const [notifyUserIds, setNotifyUserIds] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "MEETING",
    startTime: "",
    endTime: "",
    location: "",
    pointsReward: 10,
    hostUnit: "",          // Đơn vị chủ trì
    managerId: "",         // Phụ trách
    materials: "",         // Vật chất
  })

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      console.log("[ActivityManagement] Token:", token ? "exists" : "MISSING!")
      
      if (!token) {
        console.error("[ActivityManagement] No token found!")
        toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập lại", variant: "destructive" })
        return
      }
      
      console.log("[ActivityManagement] Fetching activities...")
      const res = await fetch(`${API_URL}/api/activities`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        }
      })
      console.log("[ActivityManagement] Response:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("[ActivityManagement] Activities count:", data.data?.length || data.activities?.length || 0)
        setActivities(data.data || data.activities || data || [])
      } else {
        console.error("[ActivityManagement] API failed:", res.status)
      }
    } catch (error) {
      console.error("[ActivityManagement] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users for selection
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || data.users || data || [])
      }
    } catch (error) {
      console.error("[ActivityManagement] Error fetching users:", error)
    }
  }

  useEffect(() => { 
    fetchActivities()
    fetchUsers()
  }, [])

  // Fetch attendance stats for an activity
  const fetchActivityStats = async (activityId: string) => {
    setLoadingStats(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities/${activityId}/stats`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        }
      })
      if (res.ok) {
        const data = await res.json()
        setActivityStats(data.data)
      } else {
        toast({ title: "Lỗi", description: "Không thể tải thống kê điểm danh", variant: "destructive" })
      }
    } catch (error) {
      console.error("[ActivityManagement] Error fetching stats:", error)
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
    } finally {
      setLoadingStats(false)
    }
  }

  // Open attendance dialog
  const openAttendanceDialog = async (activity: Activity) => {
    setSelectedActivity(activity)
    setShowAttendanceDialog(true)
    await fetchActivityStats(activity.id)
  }

  // Open conclusion dialog (to add/edit conclusion)
  const openConclusionDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setConclusionText(activity.conclusion || "")
    setShowConclusionDialog(true)
  }

  // Open view conclusion dialog
  const openViewConclusionDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowViewConclusionDialog(true)
  }

  // Save conclusion
  const handleSaveConclusion = async () => {
    if (!selectedActivity) return
    setSavingConclusion(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities/${selectedActivity.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ conclusion: conclusionText })
      })
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã lưu kết luận cuộc họp" })
        setShowConclusionDialog(false)
        fetchActivities()
      } else {
        toast({ title: "Lỗi", description: "Không thể lưu kết luận", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
    } finally {
      setSavingConclusion(false)
    }
  }

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!ALLOWED_FILE_TYPES.includes(ext)) {
        toast({ 
          title: "Lỗi", 
          description: `File ${file.name} không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_FILE_TYPES.join(', ')}`, 
          variant: "destructive" 
        })
        continue
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          title: "Lỗi", 
          description: `File ${file.name} vượt quá 20MB`, 
          variant: "destructive" 
        })
        continue
      }
      
      validFiles.push(file)
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleNotifyUser = (userId: string) => {
    setNotifyUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.startTime) {
      toast({ title: "Lỗi", description: "Vui lòng điền tiêu đề và thời gian", variant: "destructive" })
      return
    }
    try {
      const token = localStorage.getItem("accessToken")
      
      // Build the activity data
      const activityData = {
        ...formData,
        attendeeIds: selectedAttendees,
        sendNotification,
        notifyAll,
        notifyUserIds: notifyAll ? [] : notifyUserIds
      }
      
      const res = await fetch(`${API_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(activityData)
      })
      if (res.ok) {
        const result = await res.json()
        
        // Upload files if any
        if (selectedFiles.length > 0 && result.data?.id) {
          const formDataFiles = new FormData()
          selectedFiles.forEach(file => formDataFiles.append('files', file))
          
          await fetch(`${API_URL}/api/activities/${result.data.id}/attachments`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataFiles
          })
        }
        
        toast({ title: "Thành công", description: "Đã tạo hoạt động mới" })
        setShowCreateDialog(false)
        resetForm()
        fetchActivities()
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tạo hoạt động", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ 
      title: "", 
      description: "", 
      type: "MEETING", 
      startTime: "", 
      endTime: "", 
      location: "", 
      pointsReward: 10,
      hostUnit: "",
      managerId: "",
      materials: ""
    })
    setSelectedFiles([])
    setSelectedAttendees([])
    setSendNotification(false)
    setNotifyAll(true)
    setNotifyUserIds([])
  }

  // Open detail dialog
  const openDetailDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setEditFormData({
      title: activity.title,
      description: activity.description || "",
      type: activity.type,
      startTime: activity.startTime ? new Date(activity.startTime).toISOString().slice(0, 16) : "",
      endTime: activity.endTime ? new Date(activity.endTime).toISOString().slice(0, 16) : "",
      location: activity.location || "",
      pointsReward: activity.pointsReward,
      hostUnit: activity.hostUnit || "",
      managerId: activity.manager?.id || "",
      materials: activity.materials || ""
    })
    setIsEditMode(false)
    setShowDetailDialog(true)
  }

  // Enable edit mode
  const enableEditMode = () => {
    setIsEditMode(true)
  }

  // Cancel edit mode
  const cancelEdit = () => {
    if (selectedActivity) {
      setEditFormData({
        title: selectedActivity.title,
        description: selectedActivity.description || "",
        type: selectedActivity.type,
        startTime: selectedActivity.startTime ? new Date(selectedActivity.startTime).toISOString().slice(0, 16) : "",
        endTime: selectedActivity.endTime ? new Date(selectedActivity.endTime).toISOString().slice(0, 16) : "",
        location: selectedActivity.location || "",
        pointsReward: selectedActivity.pointsReward,
        hostUnit: selectedActivity.hostUnit || "",
        managerId: selectedActivity.manager?.id || "",
        materials: selectedActivity.materials || ""
      })
    }
    setIsEditMode(false)
  }

  // Save edited activity
  const handleSaveEdit = async () => {
    if (!selectedActivity) return
    
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities/${selectedActivity.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editFormData)
      })
      
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã cập nhật hoạt động" })
        setIsEditMode(false)
        setShowDetailDialog(false)
        fetchActivities()
      } else {
        toast({ title: "Lỗi", description: "Không thể cập nhật hoạt động", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
    }
  }

  const openDeleteDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!selectedActivity) return
    
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities/${selectedActivity.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast({ 
          title: "Thành công",
          description: "Đã xóa sinh hoạt"
        })
        setShowDeleteDialog(false)
        setSelectedActivity(null)
        fetchActivities()
      } else {
        toast({ 
          title: "Lỗi", 
          description: "Không thể xóa sinh hoạt",
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Lỗi", 
        description: "Có lỗi xảy ra",
        variant: "destructive" 
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "secondary", 
      ACTIVE: "default", 
      COMPLETED: "outline", 
      CANCELLED: "destructive",
      UPCOMING: "secondary",
      ENDED: "outline"
    }
    const labels: Record<string, string> = {
      DRAFT: "Sắp diễn ra", 
      ACTIVE: "Đang diễn ra", 
      COMPLETED: "Đã kết thúc", 
      CANCELLED: "Đã hủy",
      UPCOMING: "Sắp diễn ra",
      ENDED: "Đã kết thúc"
    }
    return <Badge variant={colors[status] as any}>{labels[status] || status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      MEETING: "Sinh hoạt", 
      VOLUNTEER: "Tình nguyện", 
      STUDY: "Học tập", 
      TASK: "Nhiệm vụ", 
      SOCIAL: "Giao lưu",
      CONFERENCE: "Hội nghị"
    }
    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  const filtered = activities.filter(a => filterStatus === "all" || a.status === filterStatus)

  // Helper function to get status display based on time
  const getActivityStatusDisplay = (activity: Activity) => {
    const now = new Date()
    const startTime = new Date(activity.startTime)
    const endTime = activity.endTime ? new Date(activity.endTime) : null

    if (activity.status === "COMPLETED" || activity.status === "CANCELLED") {
      return activity.status
    }
    
    if (now < startTime) {
      return "UPCOMING" // Sắp diễn ra
    } else if (endTime && now > endTime) {
      return "ENDED" // Đã kết thúc
    } else {
      return "ACTIVE" // Đang diễn ra
    }
  }

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý hoạt động</h2>
          <p className="text-muted-foreground">Tổng: {activities.length} hoạt động</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Sắp diễn ra</SelectItem>
              <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchActivities}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 mr-2" />Tạo mới</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Không có hoạt động nào</CardContent></Card>
        ) : filtered.map(activity => (
          <Card key={activity.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                    {getTypeBadge(activity.type)}
                    {getStatusBadge(activity.status)}
                  </div>
                  {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(activity.startTime).toLocaleString("vi-VN")}</span>
                    {activity.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{activity.location}</span>}
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{activity._count?.participants || 0} người</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Nút Kết luận - hiển thị khi hoạt động hoàn thành hoặc đang diễn ra */}
                  {(activity.status === "COMPLETED" || activity.status === "ACTIVE") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openConclusionDialog(activity)}
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      <FileCheck className="h-4 w-4 mr-1" />
                      Kết luận
                    </Button>
                  )}
                  
                  {/* Nút Danh sách điểm danh - chỉ hiển thị khi trạng thái Đang diễn ra */}
                  {activity.status === "ACTIVE" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAttendanceDialog(activity)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Danh sách điểm danh
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" onClick={() => openDetailDialog(activity)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {/* Menu dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {activity.status === "ACTIVE" && (
                        <>
                          <DropdownMenuItem onClick={() => openAttendanceDialog(activity)}>
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Danh sách điểm danh
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => openDetailDialog(activity)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem báo cáo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(activity)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { openDetailDialog(activity); setTimeout(() => enableEditMode(), 100); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      {activity.conclusion && (
                        <DropdownMenuItem onClick={() => openViewConclusionDialog(activity)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Xem kết luận cuộc họp
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tạo hoạt động mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Tiêu đề */}
            <div>
              <Label>Tiêu đề *</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Nhập tiêu đề hoạt động"
              />
            </div>
            
            {/* Mô tả */}
            <div>
              <Label>Mô tả</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Nhập mô tả chi tiết..."
                rows={3}
              />
            </div>
            
            {/* Loại & Điểm thưởng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEETING">Sinh hoạt</SelectItem>
                    <SelectItem value="VOLUNTEER">Tình nguyện</SelectItem>
                    <SelectItem value="STUDY">Học tập</SelectItem>
                    <SelectItem value="SOCIAL">Giao lưu</SelectItem>
                    <SelectItem value="CONFERENCE">Hội nghị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Điểm thưởng</Label>
                <Input 
                  type="number" 
                  value={formData.pointsReward} 
                  onChange={e => setFormData({...formData, pointsReward: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>
            
            {/* Thời gian */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bắt đầu *</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.startTime} 
                  onChange={e => setFormData({...formData, startTime: e.target.value})} 
                />
              </div>
              <div>
                <Label>Kết thúc</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.endTime} 
                  onChange={e => setFormData({...formData, endTime: e.target.value})} 
                />
              </div>
            </div>
            
            {/* Đơn vị chủ trì */}
            <div>
              <Label>Đơn vị chủ trì</Label>
              <Input 
                value={formData.hostUnit} 
                onChange={e => setFormData({...formData, hostUnit: e.target.value})} 
                placeholder="VD: Đoàn cơ sở, Chi đoàn ABC..."
              />
            </div>
            
            {/* Phụ trách */}
            <div>
              <Label>Phụ trách</Label>
              <Select value={formData.managerId} onValueChange={v => setFormData({...formData, managerId: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn người phụ trách" /></SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} {user.role === 'ADMIN' && '(Admin)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Đại biểu tham dự */}
            <div>
              <Label>Đại biểu tham dự</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Đang tải danh sách...</p>
                ) : (
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`attendee-${user.id}`}
                          checked={selectedAttendees.includes(user.id)}
                          onCheckedChange={() => toggleAttendee(user.id)}
                        />
                        <label htmlFor={`attendee-${user.id}`} className="text-sm cursor-pointer">
                          {user.fullName}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedAttendees.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Đã chọn: {selectedAttendees.length} người
                </p>
              )}
            </div>
            
            {/* Địa điểm */}
            <div>
              <Label>Địa điểm</Label>
              <Input 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                placeholder="Nhập địa điểm tổ chức"
              />
            </div>
            
            {/* Vật chất */}
            <div>
              <Label>Vật chất cần thiết</Label>
              <Input 
                value={formData.materials} 
                onChange={e => setFormData({...formData, materials: e.target.value})} 
                placeholder="VD: Sổ tay, Sổ học tập, Máy chiếu..."
              />
            </div>
            
            {/* Tệp đính kèm */}
            <div>
              <Label>Tệp đính kèm</Label>
              <div className="space-y-2">
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nhấn để chọn file hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ: {ALLOWED_FILE_TYPES.join(', ')} - Tối đa 20MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground mx-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Thông báo mời họp */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="send-notification"
                  checked={sendNotification}
                  onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                />
                <label htmlFor="send-notification" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Gửi thông báo mời họp
                </label>
              </div>
              
              {sendNotification && (
                <div className="pl-6 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="notify-all" 
                        name="notify-type"
                        checked={notifyAll}
                        onChange={() => setNotifyAll(true)}
                      />
                      <label htmlFor="notify-all" className="text-sm cursor-pointer">
                        Gửi đến tất cả đoàn viên
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="notify-selected" 
                        name="notify-type"
                        checked={!notifyAll}
                        onChange={() => setNotifyAll(false)}
                      />
                      <label htmlFor="notify-selected" className="text-sm cursor-pointer">
                        Gửi đến cá nhân được chọn
                      </label>
                    </div>
                  </div>
                  
                  {!notifyAll && (
                    <div className="border rounded p-2 max-h-32 overflow-y-auto">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center space-x-2 py-1">
                          <Checkbox 
                            id={`notify-${user.id}`}
                            checked={notifyUserIds.includes(user.id)}
                            onCheckedChange={() => toggleNotifyUser(user.id)}
                          />
                          <label htmlFor={`notify-${user.id}`} className="text-sm cursor-pointer">
                            {user.fullName}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>Hủy</Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo hoạt động
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={(open) => { setShowDetailDialog(open); if (!open) { setIsEditMode(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hoạt động</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              {/* Tiêu đề */}
              <div>
                <Label className="text-muted-foreground">Tiêu đề</Label>
                {isEditMode ? (
                  <Input 
                    value={editFormData.title} 
                    onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                  />
                ) : (
                  <p className="font-medium">{selectedActivity.title}</p>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <Label className="text-muted-foreground">Mô tả</Label>
                {isEditMode ? (
                  <Textarea 
                    value={editFormData.description} 
                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p>{selectedActivity.description || "Không có"}</p>
                )}
              </div>

              {/* Loại & Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Loại</Label>
                  {isEditMode ? (
                    <Select value={editFormData.type} onValueChange={v => setEditFormData({...editFormData, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEETING">Sinh hoạt</SelectItem>
                        <SelectItem value="VOLUNTEER">Tình nguyện</SelectItem>
                        <SelectItem value="STUDY">Học tập</SelectItem>
                        <SelectItem value="SOCIAL">Giao lưu</SelectItem>
                        <SelectItem value="CONFERENCE">Hội nghị</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getTypeBadge(selectedActivity.type)}</div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div>{getStatusBadge(selectedActivity.status)}</div>
                </div>
              </div>

              {/* Thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Thời gian bắt đầu</Label>
                  {isEditMode ? (
                    <Input 
                      type="datetime-local" 
                      value={editFormData.startTime} 
                      onChange={e => setEditFormData({...editFormData, startTime: e.target.value})}
                    />
                  ) : (
                    <p>{new Date(selectedActivity.startTime).toLocaleString("vi-VN")}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Thời gian kết thúc</Label>
                  {isEditMode ? (
                    <Input 
                      type="datetime-local" 
                      value={editFormData.endTime} 
                      onChange={e => setEditFormData({...editFormData, endTime: e.target.value})}
                    />
                  ) : (
                    <p>{selectedActivity.endTime ? new Date(selectedActivity.endTime).toLocaleString("vi-VN") : "Chưa xác định"}</p>
                  )}
                </div>
              </div>

              {/* Đơn vị chủ trì */}
              <div>
                <Label className="text-muted-foreground">Đơn vị chủ trì</Label>
                {isEditMode ? (
                  <Input 
                    value={editFormData.hostUnit} 
                    onChange={e => setEditFormData({...editFormData, hostUnit: e.target.value})}
                  />
                ) : (
                  <p>{selectedActivity.hostUnit || "Chưa xác định"}</p>
                )}
              </div>

              {/* Phụ trách */}
              <div>
                <Label className="text-muted-foreground">Phụ trách</Label>
                {isEditMode ? (
                  <Select value={editFormData.managerId} onValueChange={v => setEditFormData({...editFormData, managerId: v})}>
                    <SelectTrigger><SelectValue placeholder="Chọn người phụ trách" /></SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{selectedActivity.manager?.fullName || "Chưa xác định"}</p>
                )}
              </div>

              {/* Đại biểu tham dự - Link to view */}
              <div>
                <Label className="text-muted-foreground">Đại biểu tham dự</Label>
                <p className="text-blue-600 cursor-pointer hover:underline" onClick={() => openAttendanceDialog(selectedActivity)}>
                  Xem danh sách người tham gia
                </p>
              </div>

              {/* Địa điểm */}
              <div>
                <Label className="text-muted-foreground">Địa điểm</Label>
                {isEditMode ? (
                  <Input 
                    value={editFormData.location} 
                    onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                  />
                ) : (
                  <p>{selectedActivity.location || "Chưa xác định"}</p>
                )}
              </div>

              {/* Vật chất */}
              <div>
                <Label className="text-muted-foreground">Vật chất</Label>
                {isEditMode ? (
                  <Input 
                    value={editFormData.materials} 
                    onChange={e => setEditFormData({...editFormData, materials: e.target.value})}
                  />
                ) : (
                  <p>{selectedActivity.materials || "Chưa xác định"}</p>
                )}
              </div>

              {/* Điểm thưởng */}
              <div>
                <Label className="text-muted-foreground">Điểm thưởng</Label>
                {isEditMode ? (
                  <Input 
                    type="number" 
                    value={editFormData.pointsReward} 
                    onChange={e => setEditFormData({...editFormData, pointsReward: parseInt(e.target.value) || 0})}
                  />
                ) : (
                  <p className="font-bold text-lg">{selectedActivity.pointsReward} điểm</p>
                )}
              </div>

              {/* Số người tham gia */}
              <div>
                <Label className="text-muted-foreground">Số người tham gia</Label>
                <p className="font-semibold text-lg text-blue-600 cursor-pointer hover:underline" onClick={() => openAttendanceDialog(selectedActivity)}>
                  {selectedActivity._count?.participants || 0} người 
                  <span className="text-sm text-muted-foreground ml-2">(Nhấn để xem chi tiết)</span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={cancelEdit}>Hủy</Button>
                <Button onClick={handleSaveEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Đóng</Button>
                <Button onClick={enableEditMode}>
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Xóa sinh hoạt
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedActivity && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-sm mb-1">Hoạt động:</p>
                <p className="font-medium">{selectedActivity.title}</p>
                {selectedActivity.startTime && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(selectedActivity.startTime).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <p className="font-medium">Bạn có chắc chắn muốn xóa sinh hoạt?</p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Lưu ý: Xóa xong không thể khôi phục lại được
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setSelectedActivity(null)
            }}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance List Dialog - Danh sách điểm danh */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              Danh sách điểm danh
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              {/* Activity Info */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold">{selectedActivity.title}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {new Date(selectedActivity.startTime).toLocaleString("vi-VN")}
                  {selectedActivity.endTime && ` - ${new Date(selectedActivity.endTime).toLocaleString("vi-VN")}`}
                </p>
                {selectedActivity.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedActivity.location}
                  </p>
                )}
              </div>

              {/* Statistics */}
              {loadingStats ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : activityStats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{activityStats.totalRegistered}</p>
                      <p className="text-xs text-muted-foreground">Đăng ký</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{activityStats.checkedIn}</p>
                      <p className="text-xs text-muted-foreground">Đã điểm danh</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">{activityStats.late}</p>
                      <p className="text-xs text-muted-foreground">Đến trễ</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{activityStats.absent}</p>
                      <p className="text-xs text-muted-foreground">Vắng mặt</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <span>Tỷ lệ điểm danh: <strong className="text-green-600">{activityStats.attendanceRate}%</strong></span>
                    <span>Đúng giờ: <strong className="text-blue-600">{activityStats.onTimeRate}%</strong></span>
                  </div>

                  {/* Participant Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">STT</TableHead>
                          <TableHead>Họ và tên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thời gian điểm danh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityStats.participants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Chưa có người đăng ký
                            </TableCell>
                          </TableRow>
                        ) : (
                          activityStats.participants.map((p, index) => (
                            <TableRow key={p.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{p.user.fullName}</TableCell>
                              <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                              <TableCell>
                                {p.status === "CHECKED_IN" ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Đã điểm danh
                                  </Badge>
                                ) : p.status === "REGISTERED" ? (
                                  <Badge variant="secondary">
                                    <Clock3 className="h-3 w-3 mr-1" />
                                    Chưa điểm danh
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Vắng
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {p.checkInTime ? new Date(p.checkInTime).toLocaleString("vi-VN") : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Non-participants */}
                  {activityStats.nonParticipants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Chưa đăng ký ({activityStats.nonParticipants.length} người):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activityStats.nonParticipants.map(np => (
                          <Badge key={np.id} variant="outline" className="text-xs">
                            {np.fullName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">Không có dữ liệu</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conclusion Dialog - Nhập/sửa kết luận */}
      <Dialog open={showConclusionDialog} onOpenChange={setShowConclusionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-600" />
              Kết luận cuộc họp
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold">{selectedActivity.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedActivity.startTime).toLocaleString("vi-VN")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Nội dung kết luận</Label>
                <Textarea 
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  placeholder="Nhập nội dung kết luận cuộc họp..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Ghi lại các quyết định, nhiệm vụ được giao và các nội dung quan trọng của cuộc họp.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConclusionDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveConclusion} disabled={savingConclusion}>
              {savingConclusion ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu kết luận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Conclusion Dialog - Xem kết luận */}
      <Dialog open={showViewConclusionDialog} onOpenChange={setShowViewConclusionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Kết luận cuộc họp
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold">{selectedActivity.title}</h4>
                <div className="flex gap-2 mt-1">
                  {getTypeBadge(selectedActivity.type)}
                  {getStatusBadge(selectedActivity.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(selectedActivity.startTime).toLocaleString("vi-VN")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nội dung kết luận</Label>
                <div className="p-4 bg-muted/50 rounded-lg border min-h-[150px] whitespace-pre-wrap">
                  {selectedActivity.conclusion || "Chưa có kết luận"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewConclusionDialog(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              setShowViewConclusionDialog(false)
              openConclusionDialog(selectedActivity!)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
