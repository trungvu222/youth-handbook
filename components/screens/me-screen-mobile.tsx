"use client"

import { useState, useEffect } from "react"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import {
  User,
  Star,
  MessageSquare,
  LogOut,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  Edit,
  Bell,
  ClipboardList,
  Save,
  Loader2,
  Shield,
  Briefcase,
  GraduationCap,
  Heart,
  Globe,
  Users,
  Cake,
  BookOpen,
  Monitor,
  Languages,
  Flag,
  Landmark,
  Swords,
  CheckCircle,
  AlertCircle,
  Settings,
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
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500)
  }

  useEffect(() => {
    loadUserData()
  }, [])

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
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.substring(0, 10) : '',
          gender: userData.gender || '',
          birthPlace: userData.birthPlace || '',
          permanentAddress: userData.permanentAddress || '',
          ethnicity: userData.ethnicity || '',
          religion: userData.religion || '',
          educationLevel: userData.educationLevel || '',
          majorLevel: userData.majorLevel || '',
          itLevel: userData.itLevel || '',
          languageLevel: userData.languageLevel || '',
          politicsLevel: userData.politicsLevel || '',
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
        showToast('Cập nhật hồ sơ thành công!', 'success')
      } else {
        showToast(result.error || 'Cập nhật thất bại', 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi cập nhật', 'error')
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
  const getRoleBadgeColor = () => {
    if (user?.role === 'ADMIN') return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' }
    if (user?.role === 'LEADER') return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' }
    return { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' }
  }
  const getUserPoints = () => user?.points || 0
  const getUserRank = () => {
    const p = getUserPoints()
    if (p >= 130) return 'Xuất sắc'
    if (p >= 110) return 'Khá'
    if (p >= 90) return 'Trung bình'
    return 'Yếu'
  }
  const getRankColor = () => {
    const p = getUserPoints()
    if (p >= 130) return '#10b981'
    if (p >= 110) return '#3b82f6'
    if (p >= 90) return '#f59e0b'
    return '#ef4444'
  }
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const formatDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('vi-VN') : null
  const renderVal = (v: string | undefined | null) => v || null

  // Sub-screen: Back button
  const renderBackButton = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
      <button onClick={() => setActiveSection('profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', color: '#334155', padding: 0 }}>
        <ChevronLeft style={{ width: '18px', height: '18px' }} />
      </button>
      <span style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#0f172a', marginRight: '34px' }}>{title}</span>
    </div>
  )

  // ===== TOAST =====
  const renderToast = () => {
    if (!toast.show) return null
    const bg = toast.type === 'success' ? '#10b981' : '#ef4444'
    const Icon = toast.type === 'success' ? CheckCircle : AlertCircle
    return (
      <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: bg, color: '#fff', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease' }}>
        <Icon style={{ width: '18px', height: '18px' }} />
        {toast.message}
      </div>
    )
  }

  // ===== RENDER EDIT PROFILE =====
  const renderEditProfile = () => {
    const fieldStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', marginBottom: '4px', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }
    const disabledFieldStyle: React.CSSProperties = { ...fieldStyle, backgroundColor: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }
    const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block', marginTop: '10px' }
    const sectionTitle = (icon: any, title: string, color: string) => {
      const Icon = icon
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #f1f5f9' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: '14px', height: '14px', color }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</span>
        </div>
      )
    }
    
    return (
      <div style={{ backgroundColor: '#f0f2f5', minHeight: '100%', paddingBottom: '100px' }}>
        {renderBackButton('Chỉnh sửa hồ sơ')}
        {renderToast()}

        {/* Notice */}
        <div style={{ margin: '12px 12px 0', padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.4 }}>Một số thông tin chỉ được cập nhật bởi quản trị viên (vai trò, Chi đoàn, chức vụ Đoàn...)</span>
        </div>

        <div style={{ padding: '12px' }}>
          {/* Basic Info */}
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle(User, 'Thông tin cá nhân', '#3b82f6')}
            <label style={labelStyle}>Họ và tên</label>
            <input style={fieldStyle} value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} placeholder="Nhập họ và tên" />
            <label style={labelStyle}>Giới tính</label>
            <select style={{...fieldStyle, appearance: 'auto' as any}} value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
              <option value="">-- Chọn --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
            <label style={labelStyle}>Ngày sinh</label>
            <input style={fieldStyle} value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} type="date" />
            <label style={labelStyle}>Quê quán</label>
            <input style={fieldStyle} value={editForm.birthPlace} onChange={e => setEditForm({...editForm, birthPlace: e.target.value})} placeholder="Nhập quê quán" />
            <label style={labelStyle}>Nơi thường trú</label>
            <input style={fieldStyle} value={editForm.permanentAddress} onChange={e => setEditForm({...editForm, permanentAddress: e.target.value})} placeholder="Nhập nơi thường trú" />
            <label style={labelStyle}>Dân tộc</label>
            <input style={fieldStyle} value={editForm.ethnicity} onChange={e => setEditForm({...editForm, ethnicity: e.target.value})} placeholder="Nhập dân tộc" />
            <label style={labelStyle}>Tôn giáo</label>
            <input style={fieldStyle} value={editForm.religion} onChange={e => setEditForm({...editForm, religion: e.target.value})} placeholder="Nhập tôn giáo" />
          </div>

          {/* Contact */}
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle(Phone, 'Thông tin liên hệ', '#10b981')}
            <label style={labelStyle}>Số điện thoại</label>
            <input style={fieldStyle} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Nhập số điện thoại" />
            <label style={labelStyle}>Email</label>
            <input style={disabledFieldStyle} value={editForm.email} readOnly placeholder="Email" />
            <label style={labelStyle}>Địa chỉ liên hệ</label>
            <input style={fieldStyle} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Nhập địa chỉ liên hệ" />
          </div>

          {/* Education */}
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle(GraduationCap, 'Trình độ', '#8b5cf6')}
            <label style={labelStyle}>Trình độ văn hóa</label>
            <input style={fieldStyle} value={editForm.educationLevel} onChange={e => setEditForm({...editForm, educationLevel: e.target.value})} placeholder="VD: 12/12, 11/12..." />
            <label style={labelStyle}>Trình độ chuyên môn</label>
            <input style={fieldStyle} value={editForm.majorLevel} onChange={e => setEditForm({...editForm, majorLevel: e.target.value})} placeholder="VD: Cử nhân, Thạc sỹ..." />
            <label style={labelStyle}>Trình độ tin học</label>
            <input style={fieldStyle} value={editForm.itLevel} onChange={e => setEditForm({...editForm, itLevel: e.target.value})} placeholder="VD: Chứng chỉ A, B, C..." />
            <label style={labelStyle}>Trình độ ngoại ngữ</label>
            <input style={fieldStyle} value={editForm.languageLevel} onChange={e => setEditForm({...editForm, languageLevel: e.target.value})} placeholder="VD: IELTS 6.5, TOEIC 750..." />
            <label style={labelStyle}>Lý luận chính trị</label>
            <input style={fieldStyle} value={editForm.politicsLevel} onChange={e => setEditForm({...editForm, politicsLevel: e.target.value})} placeholder="VD: Sơ cấp, Trung cấp..." />
          </div>

          <button onClick={handleSaveProfile} disabled={saving} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            {saving ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '18px', height: '18px' }} />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
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

  // ===== HELPERS =====
  const roleBadge = getRoleBadgeColor()
  const rankColor = getRankColor()

  // Info row helper - always show, display 'Chưa cập nhật' for empty
  const infoRow = (icon: any, label: string, value: string | null | undefined, color: string = '#64748b') => {
    const Icon = icon
    const hasValue = !!value
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
          <Icon style={{ width: '14px', height: '14px', color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '13px', color: hasValue ? '#1e293b' : '#cbd5e1', fontWeight: 500, wordBreak: 'break-word', fontStyle: hasValue ? 'normal' : 'italic' }}>{hasValue ? value : 'Chưa cập nhật'}</div>
        </div>
      </div>
    )
  }

  // Section card - always show
  const sectionCard = (icon: any, title: string, color: string, children: React.ReactNode) => {
    const Icon = icon
    return (
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: `linear-gradient(135deg, ${color}20, ${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: '15px', height: '15px', color }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</span>
        </div>
        {children}
      </div>
    )
  }

  // ===== MAIN PROFILE VIEW =====
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', backgroundColor: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100%', paddingBottom: '100px' }}>
      {renderToast()}

      {/* ===== PROFILE HERO ===== */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background gradient */}
        <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)', padding: '32px 16px 60px', position: 'relative' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', top: '20px', left: '30%', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Settings icon top right */}
          <button onClick={() => setActiveSection('edit')} style={{ position: 'absolute', top: '14px', right: '14px', width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Settings style={{ width: '18px', height: '18px', color: '#fff' }} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffffff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#2563eb', border: '4px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={getUserName()} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(getUserName())
                )}
              </div>
              {/* Online indicator */}
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#22c55e', border: '3px solid #2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            </div>

            {/* Name */}
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '6px', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{getUserName()}</div>

            {/* Role badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255,255,255,0.18)', padding: '4px 14px', borderRadius: '20px', marginBottom: '4px', backdropFilter: 'blur(4px)' }}>
              <Shield style={{ width: '12px', height: '12px', color: '#fbbf24' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{getUserRole()}</span>
            </div>

            {/* Unit */}
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '0' }}>{user?.unit?.name || 'Chưa có Chi đoàn'}</div>
          </div>
        </div>

        {/* Floating stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '0 12px', marginTop: '-36px', position: 'relative', zIndex: 2 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', lineHeight: 1.1 }}>{getUserPoints()}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' }}>Tổng điểm</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: rankColor, lineHeight: 1.3 }}>{getUserRank()}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' }}>Xếp loại</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6', lineHeight: 1.1 }}>{user?.pointsHistory?.length || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' }}>Hoạt động</div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div style={{ padding: '14px 12px 6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {[
            { id: 'edit' as SectionType, icon: Edit, label: 'Sửa hồ sơ', color: '#3b82f6' },
            { id: 'rating' as SectionType, icon: Star, label: 'Tự đánh giá', color: '#f59e0b' },
            { id: 'suggestions' as SectionType, icon: MessageSquare, label: 'Góp ý', color: '#10b981' },
            { id: 'surveys' as SectionType, icon: ClipboardList, label: 'Khảo sát', color: '#8b5cf6' },
            { id: 'notifications' as SectionType, icon: Bell, label: 'Thông báo', color: '#ef4444' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: '18px', height: '18px', color: item.color }} />
                </div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== INFO SECTIONS ===== */}
      <div style={{ padding: '0 12px' }}>

        {/* Personal Info - matches admin "Thông tin cá nhân" */}
        {sectionCard(User, 'Thông tin cá nhân', '#3b82f6', [
          infoRow(User, 'Họ và tên', getUserName(), '#3b82f6'),
          infoRow(Heart, 'Giới tính', renderVal(user?.gender), '#ec4899'),
          infoRow(Cake, 'Ngày sinh', formatDate(user?.dateOfBirth), '#f59e0b'),
          infoRow(MapPin, 'Quê quán', renderVal(user?.birthPlace), '#10b981'),
          infoRow(Home, 'Nơi thường trú', renderVal(user?.permanentAddress), '#8b5cf6'),
          infoRow(Globe, 'Dân tộc', renderVal(user?.ethnicity), '#06b6d4'),
          infoRow(Flag, 'Tôn giáo', renderVal(user?.religion), '#f97316'),
        ])}

        {/* Contact - matches admin "Liên hệ" */}
        {sectionCard(Phone, 'Thông tin liên hệ', '#10b981', [
          infoRow(Phone, 'Số điện thoại', renderVal(user?.phone), '#10b981'),
          infoRow(Mail, 'Email', renderVal(user?.email), '#3b82f6'),
          infoRow(MapPin, 'Địa chỉ liên hệ', renderVal(user?.address), '#f59e0b'),
        ])}

        {/* Youth Organization - matches admin "Thông tin Đoàn" */}
        {sectionCard(Users, 'Thông tin Đoàn', '#ef4444', [
          infoRow(Users, 'Nơi sinh hoạt Đoàn', renderVal(user?.unit?.name), '#3b82f6'),
          infoRow(Shield, 'Chức vụ Đoàn', renderVal(user?.youthPosition), '#ef4444'),
          infoRow(Calendar, 'Ngày vào Đoàn', formatDate(user?.dateJoined), '#10b981'),
          infoRow(Flag, 'Ngày vào Đảng', formatDate(user?.partyJoinDate), '#f59e0b'),
          infoRow(Swords, 'Cấp bậc', renderVal(user?.militaryRank), '#64748b'),
          infoRow(Landmark, 'Chức vụ chính quyền', renderVal(user?.governmentPosition), '#06b6d4'),
        ])}

        {/* Education & Skills - matches admin "Trình độ" */}
        {sectionCard(GraduationCap, 'Trình độ', '#8b5cf6', [
          infoRow(GraduationCap, 'Trình độ văn hóa', renderVal(user?.educationLevel), '#8b5cf6'),
          infoRow(BookOpen, 'Trình độ chuyên môn', renderVal(user?.majorLevel), '#3b82f6'),
          infoRow(Monitor, 'Trình độ tin học', renderVal(user?.itLevel), '#10b981'),
          infoRow(Languages, 'Trình độ ngoại ngữ', renderVal(user?.languageLevel), '#06b6d4'),
          infoRow(Flag, 'Lý luận chính trị', renderVal(user?.politicsLevel), '#ef4444'),
        ])}

        {/* Points History */}
        {user?.pointsHistory && user.pointsHistory.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b20, #f59e0b10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Lịch sử điểm gần đây</span>
            </div>
            {user.pointsHistory.slice(0, 5).map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < Math.min(user.pointsHistory.length, 5) - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reason || 'Hoạt động'}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(h.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: h.points > 0 ? '#10b981' : '#ef4444', marginLeft: '8px', flexShrink: 0 }}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== LOGOUT ===== */}
      <div style={{ padding: '6px 12px 16px' }}>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '13px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', gap: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <LogOut style={{ width: '17px', height: '17px' }} />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
