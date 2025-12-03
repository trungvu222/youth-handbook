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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Eye, Edit, Trash2, Plus, Users, UserCheck, UserX, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  id: string
  name: string
}

interface Member {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  unitId?: string
  unit?: Unit
  points: number
  avatarUrl?: string
  address?: string
  isActive: boolean
  dateJoined?: string
  createdAt: string
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

export function MemberManagement() {
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "MEMBER",
    unitId: "",
    address: "",
    isActive: true
  })

  // Fetch members and units
  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      console.log("[MemberManagement] Token:", token ? "exists" : "MISSING!")
      
      if (!token) {
        console.error("[MemberManagement] No token found!")
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

      // Fetch members
      console.log("[MemberManagement] Fetching users...")
      const membersRes = await fetch(`${API_URL}/api/users`, { headers })
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.users || data || [])
      }

      // Fetch units
      const unitsRes = await fetch(`${API_URL}/api/units`, { headers })
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json()
        setUnits(unitsData.units || unitsData || [])
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

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm))
    
    const matchUnit = filterUnit === "all" || 
      (member.unitId && member.unitId.toString() === filterUnit)
    
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && member.isActive) ||
      (filterStatus === "inactive" && !member.isActive)

    return matchSearch && matchUnit && matchStatus
  })

  // Stats
  const totalMembers = members.length
  const activeMembers = members.filter(m => m.isActive).length
  const inactiveMembers = members.filter(m => !m.isActive).length

  // Handle add member
  const handleAddMember = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ họ tên, email và mật khẩu.",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.email.split("@")[0] + "_" + Date.now().toString(36),
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          unitId: formData.unitId || undefined
        })
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã thêm thành viên mới."
        })
        setShowAddDialog(false)
        resetForm()
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.message || "Không thể thêm thành viên.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Handle edit member
  const handleEditMember = async () => {
    if (!selectedMember) return

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users/${selectedMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          role: formData.role,
          unitId: formData.unitId || undefined,
          address: formData.address || undefined,
          isActive: formData.isActive
        })
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin thành viên."
        })
        setShowEditDialog(false)
        resetForm()
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.message || "Không thể cập nhật thành viên.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating member:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!selectedMember) return

    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users/${selectedMember.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa thành viên."
        })
        setShowDeleteDialog(false)
        setSelectedMember(null)
        fetchData()
      } else {
        const error = await res.json()
        toast({
          title: "Lỗi",
          description: error.message || "Không thể xóa thành viên.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting member:", error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Toggle member status
  const handleToggleStatus = async (member: Member) => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/users/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !member.isActive
        })
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: `Đã ${member.isActive ? "vô hiệu hóa" : "kích hoạt"} thành viên.`
        })
        fetchData()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái.",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "MEMBER",
      unitId: "",
      address: "",
      isActive: true
    })
  }

  const openEditDialog = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone || "",
      password: "",
      role: member.role,
      unitId: member.unitId || "",
      address: member.address || "",
      isActive: member.isActive
    })
    setShowEditDialog(true)
  }

  const openDetailDialog = (member: Member) => {
    setSelectedMember(member)
    setShowDetailDialog(true)
  }

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member)
    setShowDeleteDialog(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>
      case "LEADER":
        return <Badge variant="default">Chi đoàn trưởng</Badge>
      case "SECRETARY":
        return <Badge variant="secondary">Bí thư</Badge>
      default:
        return <Badge variant="outline">Đoàn viên</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
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
          <h2 className="text-2xl font-bold">Quản lý đoàn viên</h2>
          <p className="text-muted-foreground">Quản lý thông tin và trạng thái đoàn viên</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm thành viên
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng số</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">{activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <UserX className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Không hoạt động</p>
                <p className="text-2xl font-bold">{inactiveMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Lọc theo chi đoàn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi đoàn</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đoàn viên ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy đoàn viên nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Đoàn viên</th>
                    <th className="text-left py-3 px-2">Liên hệ</th>
                    <th className="text-left py-3 px-2">Chi đoàn</th>
                    <th className="text-left py-3 px-2">Vai trò</th>
                    <th className="text-left py-3 px-2">Điểm</th>
                    <th className="text-left py-3 px-2">Trạng thái</th>
                    <th className="text-center py-3 px-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.fullName}</p>
                            <p className="text-sm text-muted-foreground">ID: {member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-sm">{member.email}</p>
                        <p className="text-sm text-muted-foreground">{member.phone || "N/A"}</p>
                      </td>
                      <td className="py-3 px-2">
                        {member.unit?.name || "Chưa phân công"}
                      </td>
                      <td className="py-3 px-2">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-medium">{member.points || 0}</span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDetailDialog(member)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(member)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(member)}
                            title="Xóa"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm thành viên mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0123456789"
              />
            </div>
            <div>
              <Label htmlFor="role">Vai trò</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Đoàn viên</SelectItem>
                  <SelectItem value="LEADER">Chi đoàn trưởng</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Chi đoàn</Label>
              <Select value={formData.unitId} onValueChange={(v) => setFormData({...formData, unitId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddMember}>
              Thêm thành viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Họ và tên</Label>
              <Input
                id="edit-name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
            </div>
            <div>
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Đoàn viên</SelectItem>
                  <SelectItem value="LEADER">Chi đoàn trưởng</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-unit">Chi đoàn</Label>
              <Select value={formData.unitId} onValueChange={(v) => setFormData({...formData, unitId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi đoàn" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-address">Địa chỉ</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
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
            <Button onClick={handleEditMember}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin đoàn viên</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.avatarUrl} />
                  <AvatarFallback className="text-xl">{selectedMember.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.fullName}</h3>
                  {getRoleBadge(selectedMember.role)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedMember.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chi đoàn</p>
                  <p className="font-medium">{selectedMember.unit?.name || "Chưa phân công"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Điểm hoạt động</p>
                  <p className="font-medium text-lg">{selectedMember.points || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={selectedMember.isActive ? "default" : "secondary"}>
                    {selectedMember.isActive ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                  <p className="font-medium">{formatDate(selectedMember.dateJoined || selectedMember.createdAt)}</p>
                </div>
                {selectedMember.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{selectedMember.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              setShowDetailDialog(false)
              if (selectedMember) openEditDialog(selectedMember)
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
            Bạn có chắc chắn muốn xóa thành viên <strong>{selectedMember?.fullName}</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
