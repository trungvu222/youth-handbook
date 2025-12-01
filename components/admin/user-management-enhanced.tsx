"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, Edit, Trash2, Award, TrendingUp, UserCheck, Download, Upload, FileUser, Calendar } from "lucide-react"
import ProfileManagement from "./profile-management"
import ActivityManagement from "./activity-management"

const mockUsers = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    role: "member",
    unit: "Chi đoàn CNTT",
    points: 850,
    status: "active",
    joinDate: "2023-09-01",
    lastActive: "2024-01-22",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "binh.tran@example.com",
    role: "leader",
    unit: "Chi đoàn Kinh tế",
    points: 820,
    status: "active",
    joinDate: "2023-08-15",
    lastActive: "2024-01-21",
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "cuong.le@example.com",
    role: "member",
    unit: "Chi đoàn CNTT",
    points: 780,
    status: "inactive",
    joinDate: "2023-09-10",
    lastActive: "2024-01-10",
  },
]

const mockUnits = [
  {
    id: 1,
    name: "Chi đoàn CNTT",
    leader: "Nguyễn Văn An",
    members: 25,
    avgPoints: 785,
    status: "active",
    createdDate: "2023-08-01",
  },
  {
    id: 2,
    name: "Chi đoàn Kinh tế",
    leader: "Trần Thị Bình",
    members: 30,
    avgPoints: 720,
    status: "active",
    createdDate: "2023-08-01",
  },
]

export default function UserManagementEnhanced() {
  const [activeTab, setActiveTab] = useState("users")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [showDeleteUnitConfirm, setShowDeleteUnitConfirm] = useState<number | null>(null)

  // User handlers
  const handleEditUser = (user: any) => {
    setEditingUser(user)
    console.log('Editing user:', user)
  }

  const handleDeleteUser = (userId: number) => {
    setShowDeleteConfirm(userId)
  }

  const confirmDeleteUser = () => {
    console.log('Deleting user:', showDeleteConfirm)
    setShowDeleteConfirm(null)
  }

  // Unit handlers
  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit)
    console.log('Editing unit:', unit)
  }

  const handleDeleteUnit = (unitId: number) => {
    setShowDeleteUnitConfirm(unitId)
  }

  const confirmDeleteUnit = () => {
    console.log('Deleting unit:', showDeleteUnitConfirm)
    setShowDeleteUnitConfirm(null)
  }

  useEffect(() => {
    // Load current user data
    const loadCurrentUser = async () => {
      try {
        const { getStoredUser } = await import('@/lib/api')
        const userData = getStoredUser()
        setCurrentUser(userData)
      } catch (error) {
        console.error('Error loading current user:', error)
      }
    }
    loadCurrentUser()
  }, [])

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "leader":
        return "bg-blue-100 text-blue-800"
      case "member":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên"
      case "leader":
        return "Bí thư"
      case "member":
        return "Đoàn viên"
      default:
        return role
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động"
      case "inactive":
        return "Không hoạt động"
      case "suspended":
        return "Tạm khóa"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
          <p className="text-gray-600 mt-1">Quản lý thành viên và chi đoàn trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Nhập dữ liệu
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Thành viên</TabsTrigger>
          <TabsTrigger value="profiles">Quản lý hồ sơ</TabsTrigger>
          <TabsTrigger value="activities">Quản lý sinh hoạt</TabsTrigger>
          <TabsTrigger value="units">Chi đoàn</TabsTrigger>
          <TabsTrigger value="analytics">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                    <SelectItem value="leader">Bí thư</SelectItem>
                    <SelectItem value="member">Đoàn viên</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="suspended">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Danh sách thành viên ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <Avatar>
                      <AvatarImage src={`/generic-placeholder-graphic.png?height=40&width=40`} />
                      <AvatarFallback className="bg-amber-100 text-amber-800">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>{getRoleText(user.role)}</Badge>
                        <Badge className={getStatusColor(user.status)}>{getStatusText(user.status)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.unit}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Award className="w-4 h-4 text-amber-600" />
                        {user.points}
                      </div>
                      <p className="text-xs text-gray-500">Hoạt động: {user.lastActive}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          {currentUser && (
            <ProfileManagement 
              currentUserRole={currentUser.role}
              currentUserUnitId={currentUser.unitId}
            />
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          {currentUser && (
            <ActivityManagement 
              currentUserRole={currentUser.role}
              currentUserUnitId={currentUser.unitId}
            />
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Danh sách Chi đoàn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUnits.map((unit) => (
                  <div key={unit.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{unit.name}</h3>
                      <p className="text-sm text-gray-600">Bí thư: {unit.leader}</p>
                      <p className="text-sm text-gray-500">Thành lập: {unit.createdDate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{unit.members}</p>
                      <p className="text-xs text-gray-500">thành viên</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{unit.avgPoints}</p>
                      <p className="text-xs text-gray-500">điểm TB</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUnit(unit.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">127</p>
                <p className="text-sm text-gray-600">Tổng thành viên</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">98</p>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">745</p>
                <p className="text-sm text-gray-600">Điểm TB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="text-sm text-gray-600">Thành tích xuất sắc</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Nguyễn Văn An tham gia sinh hoạt Chi đoàn", time: "2 giờ trước" },
                  { action: "Trần Thị Bình hoàn thành bài kiểm tra", time: "4 giờ trước" },
                  { action: "Lê Văn Cường đăng ký hoạt động tình nguyện", time: "6 giờ trước" },
                  { action: "Chi đoàn CNTT tổ chức sinh hoạt định kỳ", time: "1 ngày trước" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
