"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  Award
} from "lucide-react"
import ProfileForm from "@/components/user/profile-form"

interface User {
  id: string
  fullName: string
  email: string
  role: 'ADMIN' | 'LEADER' | 'MEMBER'
  unitId?: string
  points?: number
  phone?: string
  youthPosition?: string
  isActive: boolean
  createdAt: string
}

interface ProfileManagementProps {
  currentUserRole: 'ADMIN' | 'LEADER' | 'MEMBER'
  currentUserUnitId?: string
}

export default function ProfileManagement({ 
  currentUserRole, 
  currentUserUnitId 
}: ProfileManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    unitId: currentUserRole === 'LEADER' ? currentUserUnitId : 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Check permissions
  if (currentUserRole === 'MEMBER') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quyền truy cập bị hạn chế
          </h3>
          <p className="text-gray-600">
            Chỉ Admin và Leader mới có thể xem quản lý hồ sơ thành viên.
          </p>
        </CardContent>
      </Card>
    )
  }

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { userApi } = await import('@/lib/api')
      const result = await userApi.getUsers({
        search: filters.search || undefined,
        role: filters.role === 'all' ? undefined : filters.role,
        unitId: filters.unitId === 'all' ? undefined : filters.unitId,
        page: pagination.page,
        limit: pagination.limit
      })

      if (result.success && result.data) {
        setUsers(result.data.data || [])
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination?.total || 0,
          pages: result.data.pagination?.pages || 0
        }))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filters, pagination.page])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRoleFilter = (value: string) => {
    setFilters(prev => ({ ...prev, role: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleViewUser = async (userId: string) => {
    try {
      const { userApi } = await import('@/lib/api')
      const result = await userApi.getUserById(userId)
      
      if (result.success && result.data) {
        setSelectedUser(result.data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const handleEditUser = async (userId: string) => {
    try {
      const { userApi } = await import('@/lib/api')
      const result = await userApi.getUserById(userId)
      
      if (result.success && result.data) {
        setSelectedUser(result.data)
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const handleSaveUser = async (profileData: any) => {
    if (!selectedUser) return

    try {
      const { userApi } = await import('@/lib/api')
      const result = await userApi.updateUser(selectedUser.id, profileData)
      
      if (result.success) {
        setSelectedUser(null)
        setIsEditing(false)
        await loadUsers() // Reload the list
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật hồ sơ')
      }
    } catch (error) {
      throw error
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return { text: 'Admin', color: 'bg-red-100 text-red-800' }
      case 'LEADER': return { text: 'Leader', color: 'bg-blue-100 text-blue-800' }
      case 'MEMBER': return { text: 'Thành viên', color: 'bg-green-100 text-green-800' }
      default: return { text: role, color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUser(null)
              setIsEditing(false)
            }}
            className="bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? `Chỉnh sửa hồ sơ: ${selectedUser.fullName}` : `Hồ sơ: ${selectedUser.fullName}`}
          </h2>
        </div>

        {isEditing ? (
          <ProfileForm
            initialData={{
              fullName: selectedUser.fullName,
              email: selectedUser.email,
              phone: selectedUser.phone || '',
              dateOfBirth: selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toISOString().split('T')[0] : '',
              birthPlace: selectedUser.birthPlace || '',
              address: selectedUser.address || '',
              province: selectedUser.province || '',
              district: selectedUser.district || '',
              ward: selectedUser.ward || '',
              title: selectedUser.title || '',
              dateJoined: selectedUser.dateJoined ? new Date(selectedUser.dateJoined).toISOString().split('T')[0] : '',
              workPlace: selectedUser.workPlace || '',
              ethnicity: selectedUser.ethnicity || 'Kinh',
              religion: selectedUser.religion || '',
              educationLevel: selectedUser.educationLevel || '',
              majorLevel: selectedUser.majorLevel || '',
              itLevel: selectedUser.itLevel || '',
              languageLevel: selectedUser.languageLevel || '',
              politicsLevel: selectedUser.politicsLevel || '',
              youthPosition: selectedUser.youthPosition || 'Đoàn viên'
            }}
            onSave={handleSaveUser}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Thông tin chi tiết</span>
                  <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  initialData={{
                    fullName: selectedUser.fullName,
                    email: selectedUser.email,
                    phone: selectedUser.phone || '',
                    dateOfBirth: selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toISOString().split('T')[0] : '',
                    birthPlace: selectedUser.birthPlace || '',
                    address: selectedUser.address || '',
                    province: selectedUser.province || '',
                    district: selectedUser.district || '',
                    ward: selectedUser.ward || '',
                    title: selectedUser.title || '',
                    dateJoined: selectedUser.dateJoined ? new Date(selectedUser.dateJoined).toISOString().split('T')[0] : '',
                    workPlace: selectedUser.workPlace || '',
                    ethnicity: selectedUser.ethnicity || 'Kinh',
                    religion: selectedUser.religion || '',
                    educationLevel: selectedUser.educationLevel || '',
                    majorLevel: selectedUser.majorLevel || '',
                    itLevel: selectedUser.itLevel || '',
                    languageLevel: selectedUser.languageLevel || '',
                    politicsLevel: selectedUser.politicsLevel || '',
                    youthPosition: selectedUser.youthPosition || 'Đoàn viên'
                  }}
                  readonly={true}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý hồ sơ thành viên</h2>
          <p className="text-gray-600 mt-1">
            {currentUserRole === 'ADMIN' 
              ? 'Quản lý tất cả thành viên trong hệ thống' 
              : 'Quản lý thành viên trong Chi đoàn của bạn'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên, email, SĐT..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.role} onValueChange={handleRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {currentUserRole === 'ADMIN' && <SelectItem value="ADMIN">Admin</SelectItem>}
                <SelectItem value="LEADER">Leader</SelectItem>
                <SelectItem value="MEMBER">Thành viên</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              Tổng cộng: {pagination.total} thành viên
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Đang tải danh sách thành viên...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có thành viên nào được tìm thấy.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const roleDisplay = getRoleDisplay(user.role)
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback className="bg-amber-100 text-amber-800">
                          {user.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={roleDisplay.color}>
                            {roleDisplay.text}
                          </Badge>
                          {user.youthPosition && (
                            <Badge variant="outline" className="text-xs">
                              {user.youthPosition}
                            </Badge>
                          )}
                          {user.points !== undefined && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Award className="w-3 h-3 mr-1" />
                              {user.points} điểm
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user.id)}
                        className="bg-transparent"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user.id)}
                        className="bg-transparent"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Trang {pagination.page} / {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

