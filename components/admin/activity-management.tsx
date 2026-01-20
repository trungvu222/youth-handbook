"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Plus, Users, Edit, Trash2, Eye, RefreshCw, MapPin, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

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
}

export default function ActivityManagement() {
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "MEETING",
    startTime: "",
    endTime: "",
    location: "",
    pointsReward: 10
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

  useEffect(() => { fetchActivities() }, [])

  const handleCreate = async () => {
    if (!formData.title || !formData.startTime) {
      toast({ title: "Lỗi", description: "Vui lòng điền tiêu đề và thời gian", variant: "destructive" })
      return
    }
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã tạo hoạt động mới" })
        setShowCreateDialog(false)
        setFormData({ title: "", description: "", type: "MEETING", startTime: "", endTime: "", location: "", pointsReward: 10 })
        fetchActivities()
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tạo hoạt động", variant: "destructive" })
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
      DRAFT: "secondary", ACTIVE: "default", COMPLETED: "outline", CANCELLED: "destructive"
    }
    const labels: Record<string, string> = {
      DRAFT: "Nháp", ACTIVE: "Đang diễn ra", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy"
    }
    return <Badge variant={colors[status] as any}>{labels[status] || status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      MEETING: "Họp", VOLUNTEER: "Tình nguyện", STUDY: "Học tập", TASK: "Nhiệm vụ", SOCIAL: "Giao lưu"
    }
    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  const filtered = activities.filter(a => filterStatus === "all" || a.status === filterStatus)

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
              <SelectItem value="DRAFT">Nháp</SelectItem>
              <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedActivity(activity); setShowDetailDialog(true) }}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => openDeleteDialog(activity)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo hoạt động mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tiêu đề *</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Mô tả</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Loại</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEETING">Họp</SelectItem>
                    <SelectItem value="VOLUNTEER">Tình nguyện</SelectItem>
                    <SelectItem value="STUDY">Học tập</SelectItem>
                    <SelectItem value="SOCIAL">Giao lưu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Điểm thưởng</Label><Input type="number" value={formData.pointsReward} onChange={e => setFormData({...formData, pointsReward: parseInt(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bắt đầu *</Label><Input type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
              <div><Label>Kết thúc</Label><Input type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
            </div>
            <div><Label>Địa điểm</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết hoạt động</DialogTitle></DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div><Label className="text-muted-foreground">Tiêu đề</Label><p className="font-medium">{selectedActivity.title}</p></div>
              <div><Label className="text-muted-foreground">Mô tả</Label><p>{selectedActivity.description || "Không có"}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Loại</Label>{getTypeBadge(selectedActivity.type)}</div>
                <div><Label className="text-muted-foreground">Trạng thái</Label>{getStatusBadge(selectedActivity.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Thời gian</Label><p>{new Date(selectedActivity.startTime).toLocaleString("vi-VN")}</p></div>
                <div><Label className="text-muted-foreground">Địa điểm</Label><p>{selectedActivity.location || "Chưa xác định"}</p></div>
              </div>
              <div><Label className="text-muted-foreground">Điểm thưởng</Label><p className="font-bold text-lg">{selectedActivity.pointsReward} điểm</p></div>
            </div>
          )}
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
    </div>
  )
}
