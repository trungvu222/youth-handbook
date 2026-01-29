"use client"

import { useState, useEffect } from "react"
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
  ChevronRight,
  Edit,
} from "lucide-react"

const mockUser = {
  name: "Nguyễn Văn Admin",
  role: "Quản trị viên",
  unit: "Chi đoàn",
  joinDate: "2023-09-01",
  phone: "0123456789",
  email: "admin@youth.com",
  address: "Chưa cập nhật",
  points: 1000,
  rank: "Xuất sắc",
  avatar: "",
}

interface MeScreenMobileProps {
  onLogout?: () => void
}

export default function MeScreenMobile({ onLogout }: MeScreenMobileProps) {
  const [activeSection, setActiveSection] = useState<"profile" | "edit" | "rating" | "suggestions" | "notes">("profile")
  const [user, setUser] = useState(mockUser)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { profileApi, getStoredUser } = await import('@/lib/api')
        const profileResult = await profileApi.getMyProfile()
        
        let userData = null
        if (profileResult.success && profileResult.data) {
          userData = profileResult.data
        } else {
          userData = getStoredUser()
        }
        
        if (userData) {
          setUser({
            name: userData.fullName || 'Người dùng',
            role: userData.role === 'ADMIN' ? 'Quản trị viên' : 
                  userData.role === 'LEADER' ? 'Bí thư Chi đoàn' : 'Đoàn viên',
            unit: userData.unitId || 'Chưa có Chi đoàn',
            joinDate: userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString('vi-VN') : '2023-09-01',
            phone: userData.phone || 'Chưa cập nhật',
            email: userData.email || 'Chưa cập nhật',
            address: userData.address || 'Chưa cập nhật',
            points: userData.points || 1000,
            rank: (userData.points || 1000) >= 130 ? 'Xuất sắc' : 
                  (userData.points || 0) >= 110 ? 'Khá' : 
                  (userData.points || 0) >= 90 ? 'Trung bình' : 'Yếu',
            avatar: userData.avatarUrl || '',
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
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

  // ===== INLINE STYLES =====
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    paddingBottom: '100px', // Extra space for scrolling past bottom nav
  }

  const menuSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '12px',
  }

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    width: '100%',
    border: 'none',
    textAlign: 'left',
  }

  const menuIconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    color: '#6b7280',
  }

  const menuTextStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
    fontWeight: 400,
  }

  const chevronStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    color: '#9ca3af',
  }

  // Profile Card
  const profileCardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '24px 16px',
    marginBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  }

  const avatarContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
  }

  const avatarStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '12px',
    border: '3px solid #fbbf24',
  }

  const profileNameStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  }

  const profileRoleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '2px',
  }

  const profileUnitStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '12px',
  }

  const badgeContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  }

  const pointsBadgeStyle: React.CSSProperties = {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
  }

  const rankBadgeStyle: React.CSSProperties = {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
  }

  // Contact Info
  const contactSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '16px',
    marginBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const contactItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  }

  const contactIconStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    color: '#9ca3af',
    marginRight: '12px',
  }

  const contactTextStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#374151',
  }

  // Stats
  const statsContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    marginBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  }

  const statIconStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    margin: '0 auto 8px',
  }

  const statValueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
  }

  // Logout Button
  const logoutButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'calc(100% - 32px)',
    margin: '16px',
    padding: '14px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  const menuItems = [
    { id: "profile", label: "Xem hồ sơ", icon: User },
    { id: "edit", label: "Chỉnh sửa hồ sơ", icon: Edit },
    { id: "rating", label: "Tự đánh giá", icon: Star },
    { id: "suggestions", label: "Góp ý kiến", icon: MessageSquare },
    { id: "notes", label: "Ghi chú cá nhân", icon: StickyNote },
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div style={containerStyle}>
      {/* Menu Section */}
      <div style={menuSectionStyle}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              style={{
                ...menuItemStyle,
                backgroundColor: activeSection === item.id ? '#fef3c7' : '#ffffff',
              }}
            >
              <Icon style={menuIconStyle} />
              <span style={menuTextStyle}>{item.label}</span>
              <ChevronRight style={chevronStyle} />
            </button>
          )
        })}
      </div>

      {/* Profile Card */}
      <div style={profileCardStyle}>
        <div style={avatarContainerStyle}>
          <div style={avatarStyle}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div style={profileNameStyle}>{user.name}</div>
          <div style={profileRoleStyle}>{user.role}</div>
          <div style={profileUnitStyle}>{user.unit}</div>
          <div style={badgeContainerStyle}>
            <span style={pointsBadgeStyle}>{user.points} điểm</span>
            <span style={rankBadgeStyle}>{user.rank}</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div style={contactSectionStyle}>
        <div style={sectionTitleStyle}>
          <Phone style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          Thông tin liên hệ
        </div>
        
        <div style={contactItemStyle}>
          <Phone style={contactIconStyle} />
          <span style={contactTextStyle}>{user.phone}</span>
        </div>
        
        <div style={contactItemStyle}>
          <Mail style={contactIconStyle} />
          <span style={contactTextStyle}>{user.email}</span>
        </div>
        
        <div style={contactItemStyle}>
          <MapPin style={contactIconStyle} />
          <span style={contactTextStyle}>{user.address}</span>
        </div>
        
        <div style={contactItemStyle}>
          <Calendar style={contactIconStyle} />
          <span style={contactTextStyle}>Gia nhập: {user.joinDate}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <Award style={{ ...statIconStyle, color: '#f59e0b' }} />
          <div style={statValueStyle}>{user.points}</div>
          <div style={statLabelStyle}>Điểm tích lũy</div>
        </div>
        
        <div style={statCardStyle}>
          <Star style={{ ...statIconStyle, color: '#10b981' }} />
          <div style={statValueStyle}>4.8</div>
          <div style={statLabelStyle}>Đánh giá TB</div>
        </div>
      </div>

      {/* Logout */}
      <button style={logoutButtonStyle} onClick={handleLogout}>
        <LogOut style={{ width: '18px', height: '18px', marginRight: '8px' }} />
        Đăng xuất
      </button>
    </div>
  )
}
