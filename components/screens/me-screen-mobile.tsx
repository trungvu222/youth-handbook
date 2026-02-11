"use client"

import { useState, useEffect } from "react"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
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
  ChevronLeft,
  Edit,
  Bell,
  ClipboardList,
  Save,
  Loader2,
} from "lucide-react"

interface MeScreenMobileProps {
  onLogout?: () => void
}

type SectionType = "profile" | "edit" | "rating" | "suggestions" | "notifications" | "surveys"

export default function MeScreenMobile({ onLogout }: MeScreenMobileProps) {
  const [activeSection, setActiveSection] = useState<SectionType>("profile")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadUserData(true))

  const loadUserData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const { profileApi, getStoredUser } = await import('@/lib/api')
      const profileResult = await profileApi.getMyProfile()
      
      let userData = null
      if (profileResult.success && profileResult.data) {
        userData = profileResult.data
      } else {
        userData = getStoredUser()
      }
      
      if (userData) {
        setUser(userData)
        setEditForm({
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          email: userData.email || '',
          address: userData.address || '',
          dateOfBirth: userData.dateOfBirth || '',
          birthPlace: userData.birthPlace || '',
          workPlace: userData.workPlace || '',
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      const { getStoredUser } = await import('@/lib/api')
      const stored = getStoredUser()
      if (stored) setUser(stored)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const { profileApi } = await import('@/lib/api')
      const result = await profileApi.updateProfile(editForm)
      if (result.success) {
        await loadUserData()
        setActiveSection('profile')
        alert('Cập nhật hồ sơ thành công!')
      } else {
        alert(result.error || 'Cập nhật thất bại')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.logout()
      onLogout?.()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getUserName = () => user?.fullName || 'Người dùng'
  const getUserRole = () => {
    if (user?.role === 'ADMIN') return 'Quản trị viên'
    if (user?.role === 'LEADER') return 'Bí thư Chi đoàn'
    return 'Đoàn viên'
  }
  const getUserPoints = () => user?.points || 0
  const getUserRank = () => {
    const p = getUserPoints()
    if (p >= 130) return 'Xuất sắc'
    if (p >= 110) return 'Khá'
    if (p >= 90) return 'Trung bình'
    return 'Yếu'
  }
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  // Sub-screen: Back button
  const renderBackButton = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
      <button onClick={() => setActiveSection('profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', color: '#334155', padding: 0 }}>
        <ChevronLeft style={{ width: '18px', height: '18px' }} />
      </button>
      <span style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 600, color: '#0f172a', marginRight: '36px' }}>{title}</span>
    </div>
  )

  // ===== RENDER EDIT PROFILE =====
  const renderEditProfile = () => {
    const fieldStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', marginBottom: '12px', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' }
    const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }
    
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: '100px' }}>
        {renderBackButton('Chỉnh sửa hồ sơ')}
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <label style={labelStyle}>Họ và tên</label>
            <input style={fieldStyle} value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} placeholder="Nhập họ và tên" />
            
            <label style={labelStyle}>Số điện thoại</label>
            <input style={fieldStyle} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Nhập số điện thoại" />
            
            <label style={labelStyle}>Email</label>
            <input style={fieldStyle} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Nhập email" type="email" />
            
            <label style={labelStyle}>Địa chỉ</label>
            <input style={fieldStyle} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Nhập địa chỉ" />
            
            <label style={labelStyle}>Ngày sinh</label>
            <input style={fieldStyle} value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} type="date" />
            
            <label style={labelStyle}>Nơi sinh</label>
            <input style={fieldStyle} value={editForm.birthPlace} onChange={e => setEditForm({...editForm, birthPlace: e.target.value})} placeholder="Nhập nơi sinh" />
            
            <label style={labelStyle}>Nơi làm việc / học tập</label>
            <input style={fieldStyle} value={editForm.workPlace} onChange={e => setEditForm({...editForm, workPlace: e.target.value})} placeholder="Nhập nơi làm việc" />
            
            <button onClick={handleSaveProfile} disabled={saving} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '18px', height: '18px' }} />}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== RENDER SELF RATING =====
  const renderSelfRating = () => {
    const SelfRatingScreen = require('./self-rating-screen').default
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100%', paddingBottom: '100px' }}>
        {renderBackButton('Tự đánh giá')}
        <SelfRatingScreen />
      </div>
    )
  }

  // ===== RENDER SUGGESTIONS =====
  const renderSuggestions = () => {
    const SuggestionsScreen = require('./suggestions-screen').default
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100%', paddingBottom: '100px' }}>
        {renderBackButton('Góp ý kiến')}
        <SuggestionsScreen />
      </div>
    )
  }

  // Route to sub-screens
  if (activeSection === 'edit') return renderEditProfile()
  if (activeSection === 'rating') return renderSelfRating()
  if (activeSection === 'suggestions') return renderSuggestions()
  if (activeSection === 'surveys') {
    const SurveysScreen = require('./surveys-screen-mobile').default
    return <SurveysScreen onBack={() => setActiveSection('profile')} />
  }
  if (activeSection === 'notifications') {
    const NotificationsScreen = require('./notifications-screen-mobile').default
    return <NotificationsScreen onBack={() => setActiveSection('profile')} />
  }

  // ===== MAIN PROFILE VIEW =====
  const containerStyle: React.CSSProperties = { backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: '100px' }

  const menuItems = [
    { id: "profile" as SectionType, label: "Xem hồ sơ", icon: User },
    { id: "edit" as SectionType, label: "Chỉnh sửa hồ sơ", icon: Edit },
    { id: "rating" as SectionType, label: "Tự đánh giá", icon: Star },
    { id: "suggestions" as SectionType, label: "Góp ý kiến", icon: MessageSquare },
    { id: "surveys" as SectionType, label: "Khảo sát", icon: ClipboardList },
    { id: "notifications" as SectionType, label: "Thông báo", icon: Bell },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', backgroundColor: '#f5f6fa' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: '#dc2626', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Profile Card */}
      <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', padding: '28px 16px 24px', marginBottom: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#dc2626', marginBottom: '12px', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={getUserName()} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(getUserName())
            )}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{getUserName()}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>{getUserRole()}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>{user?.unit?.name || user?.unitId || 'Chưa có Chi đoàn'}</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(4px)' }}>{getUserPoints()} điểm</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(4px)' }}>{getUserRank()}</span>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: index < menuItems.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer',
                backgroundColor: '#ffffff',
                width: '100%', border: 'none', textAlign: 'left',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <Icon style={{ width: '18px', height: '18px', color: '#64748b' }} />
              </div>
              <span style={{ flex: 1, fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{item.label}</span>
              <ChevronRight style={{ width: '16px', height: '16px', color: '#cbd5e1' }} />
            </button>
          )
        })}
      </div>

      {/* Contact Info */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', marginBottom: '8px', border: '1px solid #f1f5f9', margin: '0 0 8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone style={{ width: '16px', height: '16px', color: '#dc2626' }} />
          Thông tin liên hệ
        </div>
        {[
          { icon: Phone, text: user?.phone || 'Chưa cập nhật' },
          { icon: Mail, text: user?.email || 'Chưa cập nhật' },
          { icon: MapPin, text: user?.address || 'Chưa cập nhật' },
          { icon: Calendar, text: `Gia nhập: ${user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString('vi-VN') : 'Chưa rõ'}` },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <item.icon style={{ width: '16px', height: '16px', color: '#94a3b8', marginRight: '12px' }} />
            <span style={{ fontSize: '13px', color: '#334155' }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px', backgroundColor: '#ffffff', marginBottom: '8px' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <Award style={{ width: '28px', height: '28px', color: '#f59e0b', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{getUserPoints()}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Điểm tích lũy</div>
        </div>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <Star style={{ width: '28px', height: '28px', color: '#10b981', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{getUserRank()}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Xếp loại</div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'calc(100% - 32px)', margin: '16px', padding: '14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
        <LogOut style={{ width: '18px', height: '18px', marginRight: '8px' }} />
        Đăng xuất
      </button>
    </div>
  )
}
