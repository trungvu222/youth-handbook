"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Eye, Users, Flag, RefreshCw, AlertTriangle, Building2, ChevronLeft, ChevronRight, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Leader {
  id: string
  fullName: string
  email: string
  phone?: string
  role?: string
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

// Pagination config
const ITEMS_PER_PAGE = 10

import { BACKEND_URL } from "@/lib/config"
const RAW_API_URL = BACKEND_URL;
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

export default function UnitManagement() {
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [availableLeaders, setAvailableLeaders] = useState<Leader[]>([])
  const [stats, setStats] = useState<UnitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  
  // Transfer members state for delete
  const [transferUnitId, setTransferUnitId] = useState<string>("")
  const [membersToTransfer, setMembersToTransfer] = useState<any[]>([])
  
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

      // Fetch available users for leaders - get ALL users with high limit
      const usersRes = await fetch(`${API_URL}/api/users?limit=500`, { headers })
      if (usersRes.ok) {
        const data = await usersRes.json()
        const users = data.users || []
        // Filter users who can be leaders (LEADER, ADMIN roles, or already assigned as unit leader)
        const potentialLeaders = users.filter((u: any) => 
          u.role === "LEADER" || 
          u.role === "ADMIN" ||
          u.role === "MEMBER" // Allow members to be promoted to leader
        )
        console.log("[UnitManagement] Total users:", users.length, "Potential leaders:", potentialLeaders.length)
        setAvailableLeaders(potentialLeaders)
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // Filter units
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const matchSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.leader?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = filterStatus === "all" ||
        (filterStatus === "active" && unit.isActive) ||
        (filterStatus === "inactive" && !unit.isActive)

      return matchSearch && matchStatus
    })
  }, [units, searchTerm, filterStatus])

  // Pagination logic
  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE)
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUnits.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredUnits, currentPage])

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

    // Check if unit has members
    if (selectedUnit.memberCount > 0) {
      if (!transferUnitId) {
        toast({
          title: "Không thể xóa",
          description: "Bạn cần chuyển thành viên sang chi đoàn khác trước khi xóa.",
          variant: "destructive"
        })
        return
      }

      // Transfer members first
      try {
        const token = localStorage.getItem("accessToken")
        
        // Transfer all members to new unit
        for (const member of membersToTransfer) {
          await fetch(`${API_URL}/api/users/${member.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              unitId: transferUnitId
            })
          })
        }

        toast({
          title: "Thành công",
          description: `Đã chuyển ${membersToTransfer.length} thành viên sang chi đoàn khác.`
        })
      } catch (error) {
        console.error("Error transferring members:", error)
        toast({
          title: "Lỗi",
          description: "Không thể chuyển thành viên. Vui lòng thử lại.",
          variant: "destructive"
        })
        return
      }
    }

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
        setTransferUnitId("")
        setMembersToTransfer([])
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

  const openDeleteDialog = async (unit: Unit) => {
    setSelectedUnit(unit)
    setTransferUnitId("")
    
    // Fetch members of this unit
    if (unit.memberCount > 0) {
      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch(`${API_URL}/api/users?unitId=${unit.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setMembersToTransfer(data.users || [])
        }
      } catch (error) {
        console.error("Error fetching members:", error)
      }
    }
    
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
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quản lý chi đoàn
          </h2>
          <p className="text-muted-foreground mt-1">Quản lý các chi đoàn trong tổ chức</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchData} className="flex-1 sm:flex-none hover:bg-gray-100 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button 
            onClick={() => { resetForm(); setShowAddDialog(true) }}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm chi đoàn
          </Button>
        </div>
      </div>

      {/* Stats - Improved Design */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Tổng chi đoàn</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <Flag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-green-700">{stats.activeUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Tổng đoàn viên</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600">Chưa có trưởng</p>
                  <p className="text-3xl font-bold text-amber-700">{stats.unitsWithoutLeaders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter - Enhanced */}
      <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên chi đoàn, chi đoàn trưởng..."
                className="pl-10 h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] h-11 border-gray-200">
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

      {/* Units List - Enhanced with Pagination */}
      <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg font-semibold">
              Danh sách chi đoàn 
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredUnits.length} kết quả)
              </span>
            </CardTitle>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Trang {currentPage}/{totalPages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredUnits.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Chưa có chi đoàn nào</p>
              <p className="text-sm mt-1">Bắt đầu bằng cách thêm chi đoàn mới</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedUnits.map(unit => (
                  <Card 
                    key={unit.id} 
                    className="group hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 bg-gradient-to-br from-white to-gray-50/50"
                  >
                    <CardContent className="pt-5 pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {unit.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                            <p className="text-sm text-muted-foreground truncate">
                              {unit.leader?.fullName || "Chưa có chi đoàn trưởng"}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={unit.isActive ? "default" : "secondary"}
                          className={`ml-2 shrink-0 text-xs ${
                            unit.isActive 
                              ? "bg-green-100 text-green-700 hover:bg-green-100" 
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {unit.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-4 mb-4 py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{unit.memberCount}</span>
                          <span className="text-gray-400">thành viên</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDetailDialog(unit)}
                          title="Xem chi tiết"
                          className="h-8 px-2 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(unit)}
                          title="Chỉnh sửa"
                          className="h-8 px-2 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDeleteDialog(unit)}
                          title="Xóa"
                          className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUnits.length)} trong số {filteredUnits.length} chi đoàn
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-9 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current, and adjacent pages
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1
                        })
                        .map((page, idx, arr) => (
                          <div key={page} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-1 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-9 w-9 p-0 ${
                                currentPage === page 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-9 px-3"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Dialog - Enhanced */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              Thêm chi đoàn mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Tên chi đoàn <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên chi đoàn"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leader" className="text-sm font-medium">Chi đoàn trưởng</Label>
              <Select value={formData.leaderId} onValueChange={(v) => setFormData({...formData, leaderId: v})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn chi đoàn trưởng" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableLeaders.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Không có người phù hợp
                    </div>
                  ) : (
                    availableLeaders.map(leader => (
                      <SelectItem key={leader.id} value={leader.id}>
                        <div className="flex items-center gap-2">
                          <span>{leader.fullName}</span>
                          <span className="text-xs text-muted-foreground">({leader.email})</span>
                          {leader.role && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {leader.role === 'ADMIN' ? 'Admin' : leader.role === 'LEADER' ? 'Leader' : 'Thành viên'}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Có {availableLeaders.length} người có thể được chọn làm chi đoàn trưởng</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentUnit" className="text-sm font-medium">Chi đoàn cấp trên</Label>
              <Select value={formData.parentUnitId} onValueChange={(v) => setFormData({...formData, parentUnitId: v})}>
                <SelectTrigger className="h-11">
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
          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="px-6">
              Hủy
            </Button>
            <Button 
              onClick={handleAddUnit}
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm chi đoàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog - Enhanced */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Edit className="h-5 w-5 text-amber-600" />
              </div>
              Chỉnh sửa chi đoàn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Tên chi đoàn</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leader" className="text-sm font-medium">Chi đoàn trưởng</Label>
              <Select value={formData.leaderId || "none"} onValueChange={(v) => setFormData({...formData, leaderId: v === "none" ? "" : v})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn chi đoàn trưởng" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Không có</span>
                  </SelectItem>
                  {availableLeaders.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      <div className="flex items-center gap-2">
                        <span>{leader.fullName}</span>
                        <span className="text-xs text-muted-foreground">({leader.email})</span>
                        {leader.role && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {leader.role === 'ADMIN' ? 'Admin' : leader.role === 'LEADER' ? 'Leader' : 'Thành viên'}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Có {availableLeaders.length} người có thể được chọn làm chi đoàn trưởng</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parentUnit" className="text-sm font-medium">Chi đoàn cấp trên</Label>
              <Select value={formData.parentUnitId || "none"} onValueChange={(v) => setFormData({...formData, parentUnitId: v === "none" ? "" : v})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn chi đoàn cấp trên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Không có</span>
                  </SelectItem>
                  {units.filter(u => u.id !== selectedUnit?.id).map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <Label htmlFor="edit-active" className="font-medium cursor-pointer">Đang hoạt động</Label>
                <p className="text-xs text-muted-foreground">Chi đoàn hoạt động sẽ hiển thị trong danh sách chọn</p>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="px-6">
              Hủy
            </Button>
            <Button 
              onClick={handleEditUnit}
              className="px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Enhanced */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              Thông tin chi đoàn
            </DialogTitle>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-5 py-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900">{selectedUnit.name}</h3>
                <Badge 
                  variant={selectedUnit.isActive ? "default" : "secondary"}
                  className={selectedUnit.isActive 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-gray-100 text-gray-600"
                  }
                >
                  {selectedUnit.isActive ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Chi đoàn trưởng</span>
                  </div>
                  <p className="font-semibold text-gray-900">{selectedUnit.leader?.fullName || "Chưa phân công"}</p>
                  {selectedUnit.leader?.email && (
                    <p className="text-sm text-muted-foreground">{selectedUnit.leader.email}</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Số thành viên</span>
                  </div>
                  <p className="font-bold text-2xl text-blue-600">{selectedUnit.memberCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Flag className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Số hoạt động</span>
                  </div>
                  <p className="font-bold text-2xl text-purple-600">{selectedUnit.activityCount || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Ngày tạo</span>
                  </div>
                  <p className="font-semibold text-gray-900">{formatDate(selectedUnit.createdAt)}</p>
                </div>
              </div>

              {selectedUnit.members && selectedUnit.members.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Danh sách thành viên ({selectedUnit.members.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedUnit.members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{member.fullName}</span>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="px-6">
              Đóng
            </Button>
            <Button 
              onClick={() => {
                setShowDetailDialog(false)
                if (selectedUnit) openEditDialog(selectedUnit)
              }}
              className="px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Enhanced */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-red-600">Xác nhận xóa</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xóa chi đoàn <strong className="text-gray-900">{selectedUnit?.name}</strong>?
            </p>
            
            {selectedUnit && selectedUnit.memberCount > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900">
                        Chi đoàn này có {selectedUnit.memberCount} thành viên
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Bạn cần chuyển họ sang chi đoàn khác trước khi xóa.
                      </p>
                    </div>
                  </div>
                </div>

                {membersToTransfer.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Danh sách thành viên ({membersToTransfer.length}):</Label>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-1">
                      {membersToTransfer.map(member => (
                        <div key={member.id} className="text-sm flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-50">
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="h-3 w-3 text-gray-500" />
                          </div>
                          <span className="font-medium">{member.fullName}</span>
                          <span className="text-xs text-muted-foreground">({member.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="transferUnit" className="text-sm font-medium">
                    Chuyển sang chi đoàn: <span className="text-red-500">*</span>
                  </Label>
                  <Select value={transferUnitId} onValueChange={setTransferUnitId}>
                    <SelectTrigger id="transferUnit" className="h-11">
                      <SelectValue placeholder="Chọn chi đoàn đích" />
                    </SelectTrigger>
                    <SelectContent>
                      {units
                        .filter(u => u.id !== selectedUnit.id && u.isActive)
                        .map(unit => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.memberCount || 0} thành viên)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {!transferUnitId && (
                    <p className="text-xs text-amber-600">
                      Vui lòng chọn chi đoàn để chuyển thành viên trước khi xóa
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {selectedUnit && selectedUnit.memberCount === 0 && (
              <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                Hành động này không thể hoàn tác.
              </p>
            )}
          </div>
          <DialogFooter className="pt-4 border-t gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false)
                setTransferUnitId("")
                setMembersToTransfer([])
              }}
              className="px-6"
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUnit}
              disabled={!!(selectedUnit && selectedUnit.memberCount > 0 && !transferUnitId)}
              className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {selectedUnit && selectedUnit.memberCount > 0 ? "Chuyển & Xóa" : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

