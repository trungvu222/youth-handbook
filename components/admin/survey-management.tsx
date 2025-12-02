"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, BarChart3, Users, Calendar, RefreshCw, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com"

interface Survey {
  id: string
  title: string
  description?: string
  status: string
  isAnonymous: boolean
  startDate: string
  endDate: string
  _count?: { responses: number }
}

export function SurveyManagement() {
  const { toast } = useToast()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "", description: "", isAnonymous: false, endDate: ""
  })

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/api/surveys`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.data || data.surveys || data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSurveys() }, [])

  const handleCreate = async () => {
    if (!formData.title) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tiêu đề", variant: "destructive" })
      return
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          startDate: new Date().toISOString(),
          endDate: formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questions: "[]"
        })
      })
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã tạo khảo sát mới" })
        setShowCreateDialog(false)
        setFormData({ title: "", description: "", isAnonymous: false, endDate: "" })
        fetchSurveys()
      }
    } catch (error) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa?")) return
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/surveys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      toast({ title: "Đã xóa" })
      fetchSurveys()
    } catch (error) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: "secondary", label: "Nháp" },
      ACTIVE: { variant: "default", label: "Đang mở" },
      CLOSED: { variant: "outline", label: "Đã đóng" }
    }
    const s = map[status] || { variant: "outline", label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý khảo sát</h2>
          <p className="text-muted-foreground">Tổng: {surveys.length} khảo sát</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSurveys}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 mr-2" />Tạo mới</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {surveys.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Chưa có khảo sát nào</CardContent></Card>
        ) : surveys.map(survey => (
          <Card key={survey.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{survey.title}</h3>
                    {getStatusBadge(survey.status)}
                    {survey.isAnonymous && <Badge variant="outline">Ẩn danh</Badge>}
                  </div>
                  {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{survey._count?.responses || 0} phản hồi</span>
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Hết hạn: {new Date(survey.endDate).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon"><BarChart3 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(survey.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo khảo sát mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tiêu đề *</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Mô tả</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div><Label>Ngày kết thúc</Label><Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isAnonymous} onCheckedChange={v => setFormData({...formData, isAnonymous: v})} />
              <Label>Cho phép trả lời ẩn danh</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
