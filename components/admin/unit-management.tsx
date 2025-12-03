"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Eye, Users, Flag, RefreshCw, AlertTriangle, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Leader {
  id: string
  fullName: string
  email: string
  phone?: string
}

interface Unit {
  id: string
  name: string
  leaderId?: string
  leader?: Leader
  parentUnitId?: string
  parentUnit?: { id: string; name: string }
  isActive: boolean
  memberCount: number
  activityCount: number
  createdAt: string
  members?: { id: string; fullName: string; email: string }[]
}

interface UnitStats {
  totalUnits: number
  activeUnits: number
  inactiveUnits: number
  totalMembers: number
  unitsWithLeaders: number
  unitsWithoutLeaders: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com"

export default function UnitManagement() {
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [availableLeaders, setAvailableLeaders] = useState<Leader[]>([])
  const [stats, setStats] = useState<UnitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    leaderId: "",
    parentUnitId: "",
    isActive: true
  })

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      console.log("[UnitManagement] Token:", token ? "exists" : "MISSING!")
      
      if (!token) {
        console.error("[UnitManagement] No token found!")
        toast({
          title: "Chưa đăng nhập",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive"
        })
        return
      }
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }

      // Fetch units
      console.log("[UnitManagement] Fetching units...")
      const unitsRes = await fetch(`${API_URL}/api/units`, { headers })
      if (unitsRes.ok) {
        const data = await unitsRes.json()
        setUnits(data.units || [])
      }

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/units/stats`, { headers })
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      // Fetch available users for leaders
      const usersRes = await fetch(`${API_URL}/api/users`, { headers })
      if (usersRes.ok) {
        const data = await usersRes.json()
        const users = data.users || []
        setAvailableLeaders(users.filter((u: any) => u.role === "LEADER" || u.role === "ADMIN"))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter units
  const filteredUnits = units.filter(unit => {
    const matchSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.leader?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && unit.isActive) ||
      (filterStatus === "inactive" && !unit.isActive)

    return matchSearch && matchStatus
  })

  // Handle create unit
  const handleAddUnit = async () => {
    if (!formData.name) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên chi đoàn.",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          leaderId: formData.leaderId || undefined,
          parentUnitId: formData.parentUnitId || undefined
        })
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã thêm chi đoàn mới."
        })
        setShowAddDialog(false)
        resetForm()
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể thêm chi đoàn.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding unit:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Handle edit unit
  const handleEditUnit = async () => {
    if (!selectedUnit) return

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/units/${selectedUnit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          leaderId: formData.leaderId || null,
          parentUnitId: formData.parentUnitId || null,
          isActive: formData.isActive
        })
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật chi đoàn."
        })
        setShowEditDialog(false)
        resetForm()
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể cập nhật chi đoàn.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating unit:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Handle delete unit
  const handleDeleteUnit = async () => {
    if (!selectedUnit) return

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/units/${selectedUnit.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa chi đoàn."
        })
        setShowDeleteDialog(false)
        setSelectedUnit(null)
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể xóa chi đoàn.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting unit:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      leaderId: "",
      parentUnitId: "",
      isActive: true
    })
    setSelectedUnit(null)
  }

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setFormData({
      name: unit.name,
      leaderId: unit.leaderId || "",
      parentUnitId: unit.parentUnitId || "",
      isActive: unit.isActive
    })
    setShowEditDialog(true)
  }

  const openDetailDialog = async (unit: Unit) => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/units/${unit.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedUnit(data.unit)
        setShowDetailDialog(true)
      }
    } catch (error) {
      setSelectedUnit(unit)
      setShowDetailDialog(true)
    }
  }

  const openDeleteDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setShowDeleteDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý chi đoàn</h2>
          <p className="text-muted-foreground">Quản lý các chi đoàn trong tổ chức</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm chi đoàn
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng chi đoàn</p>
                  <p className="text-2xl font-bold">{stats.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Flag className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                  <p className="text-2xl font-bold">{stats.activeUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đoàn viên</p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chưa có trưởng</p>
                  <p className="text-2xl font-bold">{stats.unitsWithoutLeaders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên chi đoàn, chi đoàn trưởng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Units List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chi đoàn ({filteredUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUnits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có chi đoàn nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map(unit => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{unit.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {unit.leader?.fullName || "Chưa có chi đoàn trưởng"}
                        </p>
                      </div>
                      <Badge variant={unit.isActive ? "default" : "secondary"}>
                        {unit.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{unit.memberCount} thành viên</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDetailDialog(unit)}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(unit)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteDialog(unit)}
                        title="Xóa"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm chi đoàn mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên chi đoàn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên chi đoàn"
              />
            </div>
            <div>
              <Label htmlFor="leader">Chi đoàn trưởng</Label>
              <Select value={formData.leaderId} onValueChange={(v) => setFormData({...formData, leaderId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn trưởng" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeaders.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.fullName} ({leader.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="parentUnit">Chi đoàn cấp trên</Label>
              <Select value={formData.parentUnitId} onValueChange={(v) => setFormData({...formData, parentUnitId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn cấp trên (nếu có)" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddUnit}>
              Thêm chi đoàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chi đoàn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên chi đoàn</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-leader">Chi đoàn trưởng</Label>
              <Select value={formData.leaderId} onValueChange={(v) => setFormData({...formData, leaderId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn trưởng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không có</SelectItem>
                  {availableLeaders.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.fullName} ({leader.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-parentUnit">Chi đoàn cấp trên</Label>
              <Select value={formData.parentUnitId} onValueChange={(v) => setFormData({...formData, parentUnitId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn cấp trên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không có</SelectItem>
                  {units.filter(u => u.id !== selectedUnit?.id).map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-active">Đang hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditUnit}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thông tin chi đoàn</DialogTitle>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedUnit.name}</h3>
                <Badge variant={selectedUnit.isActive ? "default" : "secondary"}>
                  {selectedUnit.isActive ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Chi đoàn trưởng</p>
                  <p className="font-medium">{selectedUnit.leader?.fullName || "Chưa phân công"}</p>
                  {selectedUnit.leader?.email && (
                    <p className="text-sm text-muted-foreground">{selectedUnit.leader.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số thành viên</p>
                  <p className="font-medium text-lg">{selectedUnit.memberCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số hoạt động</p>
                  <p className="font-medium">{selectedUnit.activityCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{formatDate(selectedUnit.createdAt)}</p>
                </div>
              </div>

              {selectedUnit.members && selectedUnit.members.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Danh sách thành viên</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedUnit.members.map(member => (
                      <div key={member.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{member.fullName}</span>
                        <span className="text-sm text-muted-foreground">({member.email})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              setShowDetailDialog(false)
              if (selectedUnit) openEditDialog(selectedUnit)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <p>
            Bạn có chắc chắn muốn xóa chi đoàn <strong>{selectedUnit?.name}</strong>?
            {selectedUnit && selectedUnit.memberCount > 0 && (
              <span className="block text-destructive mt-2">
                Lưu ý: Chi đoàn này có {selectedUnit.memberCount} thành viên. Bạn cần chuyển họ sang chi đoàn khác trước khi xóa.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteUnit}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

