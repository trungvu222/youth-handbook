"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Star,
  MessageSquare,
  StickyNote,
  Settings,
  LogOut,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import SelfRatingScreen from "@/components/screens/self-rating-screen"
import SuggestionsScreen from "@/components/screens/suggestions-screen"
import PrivateNotes from "@/components/user/private-notes"
import ProfileForm from "@/components/user/profile-form"

const mockUser = {
  name: "Nguyễn Văn An",
  role: "Đoàn viên",
  unit: "Chi đoàn Khoa CNTT",
  joinDate: "2023-09-01",
  phone: "0901234567",
  email: "an.nguyen@example.com",
  address: "Hà Nội",
  points: 850,
  rank: "Xuất sắc",
  avatar: "/placeholder.svg?height=80&width=80",
}

interface MeScreenProps {
  onLogout?: () => void
}

export default function MeScreen({ onLogout }: MeScreenProps) {
  const [activeSection, setActiveSection] = useState<"profile" | "edit" | "rating" | "suggestions" | "notes">("profile")
  const [user, setUser] = useState(mockUser)
  const [fullUserData, setFullUserData] = useState<any>(null)

  useEffect(() => {
    // Load user data from API
    const loadUserData = async () => {
      try {
        const { authApi, profileApi, getStoredUser } = await import('@/lib/api')
        
        // Try to get fresh profile data
        const profileResult = await profileApi.getMyProfile()
        
        let userData = null
        if (profileResult.success && profileResult.data) {
          userData = profileResult.data
        } else {
          // Fallback to stored user
          userData = getStoredUser()
        }
        
        if (userData) {
          setFullUserData(userData)
          setUser({
            name: userData.fullName,
            role: userData.role === 'ADMIN' ? 'Quản trị viên' : 
                  userData.role === 'LEADER' ? 'Bí thư Chi đoàn' : 'Đoàn viên',
            unit: userData.unitId || 'Chưa có Chi đoàn',
            joinDate: userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString('vi-VN') : '2023-09-01',
            phone: userData.phone || 'Chưa cập nhật',
            email: userData.email,
            address: userData.address || 'Chưa cập nhật',
            points: userData.points || 0,
            rank: (userData.points || 0) >= 130 ? 'Xuất sắc' : 
                  (userData.points || 0) >= 110 ? 'Khá' : 
                  (userData.points || 0) >= 90 ? 'Trung bình' : 'Yếu',
            avatar: userData.avatarUrl || '/placeholder.svg?height=80&width=80',
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        // Fallback to stored user on error
        const { getStoredUser } = await import('@/lib/api')
        const storedUser = getStoredUser()
        if (storedUser) {
          setFullUserData(storedUser)
          setUser({
            name: storedUser.fullName,
            role: storedUser.role === 'ADMIN' ? 'Quản trị viên' : 
                  storedUser.role === 'LEADER' ? 'Bí thư Chi đoàn' : 'Đoàn viên',
            unit: storedUser.unitId || 'Chưa có Chi đoàn',
            joinDate: '2023-09-01',
            phone: storedUser.phone || 'Chưa cập nhật',
            email: storedUser.email,
            address: 'Chưa cập nhật',
            points: storedUser.points || 0,
            rank: (storedUser.points || 0) >= 130 ? 'Xuất sắc' : 
                  (storedUser.points || 0) >= 110 ? 'Khá' : 
                  (storedUser.points || 0) >= 90 ? 'Trung bình' : 'Yếu',
            avatar: storedUser.avatarUrl || '/placeholder.svg?height=80&width=80',
          })
        }
      }
    }

    loadUserData()
  }, [])

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.logout()
      onLogout?.()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { id: "profile", label: "Xem hồ sơ", icon: User },
    { id: "edit", label: "Chỉnh sửa hồ sơ", icon: Settings },
    { id: "rating", label: "Tự đánh giá", icon: Star },
    { id: "suggestions", label: "Góp ý kiến", icon: MessageSquare },
    { id: "notes", label: "Ghi chú cá nhân", icon: StickyNote },
  ]

  const handleProfileSave = async (profileData: any) => {
    try {
      const { profileApi } = await import('@/lib/api')
      const result = await profileApi.updateProfile(profileData)
      
      if (result.success && result.data) {
        // Update user state with new data
        setUser({
          name: result.data.fullName,
          role: result.data.role === 'ADMIN' ? 'Quản trị viên' : 
                result.data.role === 'LEADER' ? 'Bí thư Chi đoàn' : 'Đoàn viên',
          unit: result.data.unitId || 'Chưa có Chi đoàn',
          joinDate: result.data.dateJoined ? new Date(result.data.dateJoined).toLocaleDateString('vi-VN') : '2023-09-01',
          phone: result.data.phone || 'Chưa cập nhật',
          email: result.data.email,
          address: result.data.address || 'Chưa cập nhật',
          points: result.data.points || 0,
          rank: (result.data.points || 0) >= 130 ? 'Xuất sắc' : 
                (result.data.points || 0) >= 110 ? 'Khá' : 
                (result.data.points || 0) >= 90 ? 'Trung bình' : 'Yếu',
          avatar: result.data.avatarUrl || '/placeholder.svg?height=80&width=80',
        })
        setFullUserData(result.data)
        
        // Switch back to profile view
        setActiveSection("profile")
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật hồ sơ')
      }
    } catch (error) {
      throw error
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "edit":
        return (
          <ProfileForm 
            initialData={fullUserData ? {
              fullName: fullUserData.fullName,
              email: fullUserData.email,
              phone: fullUserData.phone || '',
              dateOfBirth: fullUserData.dateOfBirth ? new Date(fullUserData.dateOfBirth).toISOString().split('T')[0] : '',
              birthPlace: fullUserData.birthPlace || '',
              address: fullUserData.address || '',
              province: fullUserData.province || '',
              district: fullUserData.district || '',
              ward: fullUserData.ward || '',
              title: fullUserData.title || '',
              dateJoined: fullUserData.dateJoined ? new Date(fullUserData.dateJoined).toISOString().split('T')[0] : '',
              workPlace: fullUserData.workPlace || '',
              ethnicity: fullUserData.ethnicity || 'Kinh',
              religion: fullUserData.religion || '',
              educationLevel: fullUserData.educationLevel || '',
              majorLevel: fullUserData.majorLevel || '',
              itLevel: fullUserData.itLevel || '',
              languageLevel: fullUserData.languageLevel || '',
              politicsLevel: fullUserData.politicsLevel || '',
              youthPosition: fullUserData.youthPosition || 'Đoàn viên'
            } : {}}
            onSave={handleProfileSave}
          />
        )
      case "rating":
        return <SelfRatingScreen />
      case "suggestions":
        return <SuggestionsScreen />
      case "notes":
        return <PrivateNotes />
      default:
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-lg font-semibold bg-amber-100 text-amber-800">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.role}</p>
                    <p className="text-sm text-gray-500">{user.unit}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-amber-100 text-amber-800">{user.points} điểm</Badge>
                      <Badge className="bg-green-100 text-green-800">{user.rank}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Gia nhập: {user.joinDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{user.points}</p>
                  <p className="text-sm text-gray-600">Điểm tích lũy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                  <p className="text-sm text-gray-600">Đánh giá TB</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Settings className="w-4 h-4 mr-3" />
                Cài đặt tài khoản
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Đăng xuất
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
