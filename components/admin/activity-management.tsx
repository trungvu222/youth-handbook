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
import { Calendar, Plus, Users, Edit, Trash2, Eye, RefreshCw, MapPin, Clock, AlertTriangle, MoreVertical, ClipboardList, FileText, CheckCircle2, XCircle, Clock3, FileCheck, Upload, X, Send, Bell, Copy, Ban, PlayCircle, ChevronLeft, ChevronRight, Award, Megaphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BACKEND_URL } from "@/lib/config"

const RAW_API_URL = BACKEND_URL;
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
  lateThresholdMinutes?: number
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
  const [attendancePage, setAttendancePage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [conclusionText, setConclusionText] = useState("")
  const [conclusionFiles, setConclusionFiles] = useState<File[]>([])
  const [savingConclusion, setSavingConclusion] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [sendNotification, setSendNotification] = useState(false)
  const [notifyAll, setNotifyAll] = useState(true)
  const [notifyUserIds, setNotifyUserIds] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [currentPage, setCurrentPage] = useState(1)
  const ACTIVITIES_PER_PAGE = 10

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "MEETING",
    startTime: "",
    endTime: "",
    location: "",
    pointsReward: 10,
    lateThresholdMinutes: 15,  // Ngưỡng tính trễ (phút)
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
    setAttendancePage(1) // Reset to first page
    setShowAttendanceDialog(true)
    await fetchActivityStats(activity.id)
  }

  // Open conclusion dialog (to add/edit conclusion)
  const openConclusionDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setConclusionText(activity.conclusion || "")
    setConclusionFiles([])
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
      
      // Upload files first if any
      let attachmentUrls: any[] = []
      if (conclusionFiles.length > 0) {
        const formData = new FormData()
        conclusionFiles.forEach(file => formData.append('files', file))
        
        const uploadRes = await fetch(`${API_URL}/api/activities/upload-attachment`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          attachmentUrls = uploadData.data.files
        } else {
          toast({ title: "Lỗi", description: "Không thể upload file đính kèm", variant: "destructive" })
          return
        }
      }
      
      // Merge with existing attachments
      const existingAttachments = selectedActivity.attachments ? 
        (Array.isArray(selectedActivity.attachments) ? selectedActivity.attachments : []) : []
      const allAttachments = [...existingAttachments, ...attachmentUrls]
      
      // Update activity with conclusion, attachments, and mark as COMPLETED
      const res = await fetch(`${API_URL}/api/activities/${selectedActivity.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          conclusion: conclusionText,
          attachments: allAttachments,
          status: 'COMPLETED'
        })
      })
      
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã lưu kết luận và tài liệu đính kèm" })
        setShowConclusionDialog(false)
        setConclusionFiles([])
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
          
          const uploadRes = await fetch(`${API_URL}/api/activities/upload-attachment`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataFiles
          })
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            // Update activity with uploaded file URLs
            await fetch(`${API_URL}/api/activities/${result.data.id}`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ attachments: uploadData.data.files })
            })
          }
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
      lateThresholdMinutes: 15,
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

  // Change activity status
  const handleStatusChange = async (activity: Activity, newStatus: string) => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        const statusLabels: Record<string, string> = { ACTIVE: "Đang diễn ra", COMPLETED: "Đã kết thúc", CANCELLED: "Đã hủy" }
        toast({ title: "Thành công", description: `Đã chuyển trạng thái sang "${statusLabels[newStatus] || newStatus}"` })
        fetchActivities()
      } else {
        toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
    }
  }

  // Duplicate activity
  const handleDuplicate = async (activity: Activity) => {
    try {
      const token = localStorage.getItem("accessToken")
      const duplicateData = {
        title: `${activity.title} (bản sao)`,
        description: activity.description || "",
        type: activity.type,
        startTime: activity.startTime,
        endTime: activity.endTime || undefined,
        location: activity.location || "",
        pointsReward: activity.pointsReward,
        hostUnit: activity.hostUnit || "",
        materials: activity.materials || ""
      }
      const res = await fetch(`${API_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(duplicateData)
      })
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã nhân bản hoạt động" })
        setCurrentPage(1)
        fetchActivities()
      } else {
        toast({ title: "Lỗi", description: "Không thể nhân bản", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" })
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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ACTIVITIES_PER_PAGE)
  const paginatedActivities = filtered.slice(
    (currentPage - 1) * ACTIVITIES_PER_PAGE,
    currentPage * ACTIVITIES_PER_PAGE
  )

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

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

  if (loading) return (
    <div className="flex justify-center items-center p-16">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  )

  // Status color config
  const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string; gradient: string }> = {
    DRAFT: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-l-sky-400', dot: 'bg-sky-400', label: 'Sắp diễn ra', gradient: 'from-sky-500 to-blue-500' },
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-400', label: 'Đang diễn ra', gradient: 'from-emerald-500 to-teal-500' },
    COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-l-slate-300', dot: 'bg-slate-400', label: 'Đã kết thúc', gradient: 'from-slate-400 to-gray-400' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-l-red-300', dot: 'bg-red-400', label: 'Đã hủy', gradient: 'from-red-400 to-rose-400' },
  }

  const typeConfig: Record<string, { icon: string; bg: string; text: string; label: string }> = {
    MEETING: { icon: '📋', bg: 'bg-violet-50 ring-1 ring-violet-200/60', text: 'text-violet-700', label: 'Sinh hoạt' },
    VOLUNTEER: { icon: '🤝', bg: 'bg-pink-50 ring-1 ring-pink-200/60', text: 'text-pink-700', label: 'Tình nguyện' },
    STUDY: { icon: '📚', bg: 'bg-amber-50 ring-1 ring-amber-200/60', text: 'text-amber-700', label: 'Học tập' },
    TASK: { icon: '✅', bg: 'bg-cyan-50 ring-1 ring-cyan-200/60', text: 'text-cyan-700', label: 'Nhiệm vụ' },
    SOCIAL: { icon: '🎉', bg: 'bg-orange-50 ring-1 ring-orange-200/60', text: 'text-orange-700', label: 'Giao lưu' },
    CONFERENCE: { icon: '🎤', bg: 'bg-indigo-50 ring-1 ring-indigo-200/60', text: 'text-indigo-700', label: 'Hội nghị' },
  }

  // Stats summary
  const statsActive = activities.filter(a => a.status === 'ACTIVE').length
  const statsCompleted = activities.filter(a => a.status === 'COMPLETED').length
  const statsDraft = activities.filter(a => a.status === 'DRAFT').length

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 p-6 shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMjBoNnYxNGgtNnYtNmg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Megaphone className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Quản lý hoạt động</h2>
            </div>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {statsActive} đang diễn ra
              </span>
              <span>·</span>
              <span>{statsDraft} sắp tới</span>
              <span>·</span>
              <span>{statsCompleted} hoàn thành</span>
              <span>·</span>
              <span className="font-medium text-white">{activities.length} tổng cộng</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44 h-9 bg-white/15 backdrop-blur-sm border-white/20 text-white hover:bg-white/25 [&>svg]:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="DRAFT">Sắp diễn ra</SelectItem>
                <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/15" onClick={fetchActivities}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="h-9 bg-white text-indigo-700 hover:bg-white/90 shadow-md font-semibold" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" />Tạo mới
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="space-y-3">
        {paginatedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-5 shadow-sm">
              <Calendar className="h-9 w-9 text-indigo-300" />
            </div>
            <h3 className="font-semibold text-lg text-slate-700">Không có hoạt động nào</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">Thử thay đổi bộ lọc hoặc tạo hoạt động mới</p>
            <Button className="mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" />Tạo hoạt động
            </Button>
          </div>
        ) : paginatedActivities.map((activity) => {
          const sc = statusConfig[activity.status] || statusConfig.DRAFT
          const tc = typeConfig[activity.type] || typeConfig.MEETING
          return (
            <div
              key={activity.id}
              className="group relative rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/40 shadow-sm hover:shadow-lg transition-all duration-300 ease-out overflow-hidden"
            >
              {/* Status indicator stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${sc.gradient}`}></div>
              
              <div className="pl-5 pr-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left content */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-slate-800 leading-snug">{activity.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${tc.bg} ${tc.text}`}>
                        <span className="text-xs">{tc.icon}</span> {tc.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${activity.status === 'ACTIVE' ? 'animate-pulse' : ''}`}></span>
                        {sc.label}
                      </span>
                      {activity.conclusion && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                          <FileCheck className="h-2.5 w-2.5" /> Có kết luận
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {activity.description && (
                      <p className="text-[13px] text-slate-500 line-clamp-1 leading-relaxed">{activity.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3.5 text-[12px]">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        {new Date(activity.startTime).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      {activity.location && (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                          <MapPin className="h-3 w-3 text-rose-400" />
                          <span className="truncate max-w-[140px]">{activity.location}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                        <Users className="h-3 w-3 text-emerald-400" />
                        {activity._count?.participants || 0} người
                      </span>
                      {activity.pointsReward > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50/70 px-2 py-0.5 rounded-md font-medium">
                          <Award className="h-3 w-3" />
                          +{activity.pointsReward} điểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                    {(activity.status === "COMPLETED" || activity.status === "ACTIVE") && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConclusionDialog(activity)}
                        className="h-8 rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-xs font-medium shadow-sm"
                      >
                        <FileCheck className="h-3.5 w-3.5 mr-1" />
                        Kết luận
                      </Button>
                    )}
                    
                    {activity.status === "ACTIVE" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAttendanceDialog(activity)}
                        className="h-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-xs font-medium shadow-sm"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />
                        Điểm danh
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={() => openDetailDialog(activity)}>
                      <Eye className="h-4 w-4 text-slate-400" />
                    </Button>
                    
                    {/* Enhanced dropdown menu */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={5} className="z-[9999] w-52 bg-white shadow-xl border rounded-xl p-1.5">
                        {/* View & Edit */}
                        <DropdownMenuItem onClick={() => openDetailDialog(activity)} className="cursor-pointer rounded-lg h-9">
                          <Eye className="h-4 w-4 mr-2 text-slate-400" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { openDetailDialog(activity); setTimeout(() => enableEditMode(), 100); }} className="cursor-pointer rounded-lg h-9">
                          <Edit className="h-4 w-4 mr-2 text-blue-500" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        {/* Status changes */}
                        {activity.status !== "ACTIVE" && activity.status !== "COMPLETED" && activity.status !== "CANCELLED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(activity, 'ACTIVE')} className="cursor-pointer rounded-lg h-9">
                            <PlayCircle className="h-4 w-4 mr-2 text-emerald-500" />
                            Bắt đầu hoạt động
                          </DropdownMenuItem>
                        )}
                        {activity.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(activity, 'COMPLETED')} className="cursor-pointer rounded-lg h-9">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500" />
                            Hoàn thành
                          </DropdownMenuItem>
                        )}
                        {activity.status !== "CANCELLED" && activity.status !== "COMPLETED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(activity, 'CANCELLED')} className="cursor-pointer rounded-lg h-9 text-orange-600">
                            <Ban className="h-4 w-4 mr-2" />
                            Hủy hoạt động
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        {/* Attendance & Conclusion */}
                        {activity.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => openAttendanceDialog(activity)} className="cursor-pointer rounded-lg h-9">
                            <ClipboardList className="h-4 w-4 mr-2 text-emerald-500" />
                            Điểm danh
                          </DropdownMenuItem>
                        )}
                        {(activity.status === "COMPLETED" || activity.status === "ACTIVE") && (
                          <DropdownMenuItem onClick={() => openConclusionDialog(activity)} className="cursor-pointer rounded-lg h-9">
                            <FileCheck className="h-4 w-4 mr-2 text-amber-500" />
                            Viết kết luận
                          </DropdownMenuItem>
                        )}
                        {activity.conclusion && (
                          <DropdownMenuItem onClick={() => openViewConclusionDialog(activity)} className="cursor-pointer rounded-lg h-9">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            Xem kết luận
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        {/* Duplicate & Delete */}
                        <DropdownMenuItem onClick={() => handleDuplicate(activity)} className="cursor-pointer rounded-lg h-9">
                          <Copy className="h-4 w-4 mr-2 text-violet-500" />
                          Nhân bản
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(activity)} className="cursor-pointer rounded-lg h-9 text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa hoạt động
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50/70 border border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            Hiện <span className="font-semibold text-slate-700">{(currentPage - 1) * ACTIVITIES_PER_PAGE + 1}–{Math.min(currentPage * ACTIVITIES_PER_PAGE, filtered.length)}</span> / {filtered.length} hoạt động
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 7) return true
                if (page === 1 || page === totalPages) return true
                if (Math.abs(page - currentPage) <= 1) return true
                return false
              })
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-1 text-muted-foreground text-xs">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-0 text-xs rounded-lg ${currentPage === page ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md border-0' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </span>
              ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
            
            {/* Ngưỡng tính trễ */}
            <div>
              <Label>
                Ngưỡng tính trễ (phút) 
                <span className="text-xs ml-2 text-gray-500">
                  (Sau bao nhiêu phút kể từ giờ bắt đầu được tính là trễ? Mặc định: 15)
                </span>
              </Label>
              <Input 
                type="number"
                min="1"
                max="120"
                value={formData.lateThresholdMinutes || 15} 
                onChange={e => setFormData({...formData, lateThresholdMinutes: parseInt(e.target.value) || 15})} 
                placeholder="15"
              />
              <p className="text-xs text-muted-foreground mt-1">
                VD: Nhập 10 → Check-in sau 10 phút tính trễ. Nhập 30 → Check-in sau 30 phút tính trễ.
              </p>
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

              {/* Ngưỡng tính trễ */}
              <div>
                <Label className="text-muted-foreground">
                  Ngưỡng tính trễ (phút) 
                  <span className="text-xs ml-2 text-gray-500">
                    (Số phút sau giờ bắt đầu được tính là trễ, mặc định 15 phút)
                  </span>
                </Label>
                {isEditMode ? (
                  <Input 
                    type="number"
                    min="1"
                    max="120"
                    value={editFormData.lateThresholdMinutes || 15} 
                    onChange={e => setEditFormData({...editFormData, lateThresholdMinutes: parseInt(e.target.value) || 15})}
                    placeholder="15"
                  />
                ) : (
                  <p>{selectedActivity.lateThresholdMinutes || 15} phút (Check-in sau {
                    new Date(new Date(selectedActivity.startTime).getTime() + (selectedActivity.lateThresholdMinutes || 15) * 60000)
                      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  } tính là trễ)</p>
                )}
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

              {/* Người tham gia */}
              <div>
                <Label className="text-muted-foreground">Người tham gia</Label>
                <p className="font-semibold text-lg text-blue-600 cursor-pointer hover:underline" onClick={() => openAttendanceDialog(selectedActivity)}>
                  {selectedActivity._count?.participants || 0} người 
                  <span className="text-sm text-muted-foreground ml-2">(Nhấn để xem chi tiết)</span>
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
        <DialogContent className="w-[98vw] max-w-none h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              Danh sách điểm danh
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="flex-1 overflow-y-auto px-6 space-y-4">
              {/* Activity Info */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-lg">{selectedActivity.title}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Thời gian:</span> {new Date(selectedActivity.startTime).toLocaleString("vi-VN", { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                  {selectedActivity.endTime && ` - ${new Date(selectedActivity.endTime).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', hour12: false })}`}
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{activityStats.totalRegistered}</p>
                      <p className="text-xs text-muted-foreground">Đăng ký</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">{activityStats.checkedIn}</p>
                      <p className="text-xs text-muted-foreground">Đã điểm danh</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{activityStats.onTime || 0}</p>
                      <p className="text-xs text-muted-foreground">Đúng giờ</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">{activityStats.late || 0}</p>
                      <p className="text-xs text-muted-foreground">Đến trễ</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{activityStats.absent || 0}</p>
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
                          <TableHead className="w-20 text-center">STT</TableHead>
                          <TableHead className="w-[200px]">Họ và tên</TableHead>
                          <TableHead className="w-[280px]">Email</TableHead>
                          <TableHead className="w-[180px]">Trạng thái</TableHead>
                          <TableHead className="w-[220px]">Thời gian điểm danh</TableHead>
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
                          (() => {
                            const startIndex = (attendancePage - 1) * ITEMS_PER_PAGE;
                            const endIndex = startIndex + ITEMS_PER_PAGE;
                            const paginatedParticipants = activityStats.participants.slice(startIndex, endIndex);
                            
                            return paginatedParticipants.map((p, index) => (
                              <TableRow key={p.id}>
                                <TableCell className="text-center">{startIndex + index + 1}</TableCell>
                                <TableCell className="font-medium">{p.user.fullName}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{p.user.email}</TableCell>
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
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                {p.checkInTime ? new Date(p.checkInTime).toLocaleString("vi-VN", {
                                  year: 'numeric',
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : <span className="text-gray-400">-</span>}
                              </TableCell>
                            </TableRow>
                          ));
                          })()
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {activityStats.participants.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-muted-foreground">
                        Hiển thị {Math.min((attendancePage - 1) * ITEMS_PER_PAGE + 1, activityStats.participants.length)} - {Math.min(attendancePage * ITEMS_PER_PAGE, activityStats.participants.length)} / {activityStats.participants.length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendancePage(p => Math.max(1, p - 1))}
                          disabled={attendancePage === 1}
                        >
                          ← Trước
                        </Button>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">Trang {attendancePage} / {Math.ceil(activityStats.participants.length / ITEMS_PER_PAGE)}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendancePage(p => Math.min(Math.ceil(activityStats.participants.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={attendancePage >= Math.ceil(activityStats.participants.length / ITEMS_PER_PAGE)}
                        >
                          Sau →
                        </Button>
                      </div>
                    </div>
                  )}

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
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0">
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
              
              {/* File attachments */}
              <div className="space-y-2">
                <Label>Tài liệu đính kèm</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setConclusionFiles(prev => [...prev, ...files])
                    }}
                    className="hidden"
                    id="conclusion-file-input"
                  />
                  <label htmlFor="conclusion-file-input" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click để chọn file hoặc kéo thả vào đây
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ: JPG, PNG, PDF, PPT, DOC, XLS (tối đa 20MB/file)
                    </p>
                  </label>
                </div>
                
                {/* Selected files list */}
                {conclusionFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Đã chọn {conclusionFiles.length} file:</p>
                    {conclusionFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConclusionFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Existing attachments */}
                {selectedActivity.attachments && Array.isArray(selectedActivity.attachments) && selectedActivity.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Tài liệu đã lưu:</p>
                    <div className="space-y-2">
                      {selectedActivity.attachments.map((file: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <a 
                            href={`${API_URL}${file.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {file.originalName || file.url.split('/').pop()}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
