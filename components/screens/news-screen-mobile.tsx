"use client"

import { useState, useEffect, useRef } from "react"
import { postApi } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"

interface NewsScreenMobileProps {
  onShowPoints?: () => void
}

const POST_TYPES = {
  ANNOUNCEMENT: { label: 'Thông báo', icon: '📢', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  NEWS:         { label: 'Tin tức',   icon: '📰', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  SUGGESTION:   { label: 'Kiến nghị', icon: '💡', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function initials(name = '') {
  return name.split(' ').map((w: string) => w[0] || '').join('').substring(0, 2).toUpperCase() || '?'
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#fecaca,#fde68a)',
  'linear-gradient(135deg,#bfdbfe,#a5f3fc)',
  'linear-gradient(135deg,#bbf7d0,#d9f99d)',
  'linear-gradient(135deg,#ddd6fe,#fbcfe8)',
  'linear-gradient(135deg,#fed7aa,#fde68a)',
]
function avatarGradient(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}

export default function NewsScreenMobile({ onShowPoints }: NewsScreenMobileProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'ANNOUNCEMENT' | 'NEWS' | 'SUGGESTION' | 'mine'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [myPendingPosts, setMyPendingPosts] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', content: '', postType: 'NEWS' as 'NEWS' | 'SUGGESTION' })
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' })
  const toastTimer = useRef<any>(null)
  const [newsPage, setNewsPage] = useState(1)

  // Reset trang khi đổi filter / tìm kiếm
  useEffect(() => { setNewsPage(1) }, [activeFilter, searchText])

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ show: true, msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  useEffect(() => {
    loadPosts()
    try {
      const stored = JSON.parse(localStorage.getItem('myPendingPosts') || '[]')
      setMyPendingPosts(stored)
    } catch {}
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadPosts(true))

  const loadPosts = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await postApi.getPosts({ limit: 100 })
      if (result.success && result.data) {
        let data: any[] = []
        if (Array.isArray(result.data)) data = result.data
        else if ((result.data as any).data) data = (result.data as any).data
        setPosts(data)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!form.title.trim()) { showToast('Vui lòng nhập tiêu đề', 'error'); return }
    if (!form.content.trim()) { showToast('Vui lòng nhập nội dung', 'error'); return }
    setCreating(true)
    try {
      const res = await postApi.createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        postType: form.postType,
      })
      if (res.success && res.data) {
        if ((res.data as any).status === 'PENDING') {
          const pending = [res.data, ...myPendingPosts].slice(0, 20)
          setMyPendingPosts(pending)
          localStorage.setItem('myPendingPosts', JSON.stringify(pending))
          showToast('Bài đã gửi — đang chờ Admin duyệt ⏳', 'info')
        } else {
          showToast('Đã đăng bài viết thành công!', 'success')
          loadPosts(true)
        }
        setForm({ title: '', content: '', postType: 'NEWS' })
        setShowCreate(false)
      } else {
        showToast((res as any).error || 'Gửi thất bại', 'error')
      }
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setCreating(false) }
  }

  const approvedIds = new Set(posts.map(p => p.id))
  const pendingMine = myPendingPosts.filter(p => !approvedIds.has(p.id))

  const allPosts = activeFilter === 'mine'
    ? pendingMine
    : activeFilter === 'pending'
    ? pendingMine
    : [
        ...pendingMine.filter(p => activeFilter === 'all' || p.postType === activeFilter),
        ...posts.filter(p => activeFilter === 'all' || p.postType === activeFilter),
      ]

  const filteredPosts = allPosts.filter(p => {
    if (!searchText) return true
    const s = searchText.toLowerCase()
    return (p.title || '').toLowerCase().includes(s) || (p.content || '').toLowerCase().includes(s)
  })

  const ITEMS_PER_PAGE = 5
  const totalNewsPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE)
  const safeNewsPage = Math.min(newsPage, Math.max(1, totalNewsPages))
  const paginatedPosts = filteredPosts.slice((safeNewsPage - 1) * ITEMS_PER_PAGE, safeNewsPage * ITEMS_PER_PAGE)

  const counts = {
    ANNOUNCEMENT: posts.filter(p => p.postType === 'ANNOUNCEMENT').length,
    NEWS:         posts.filter(p => p.postType === 'NEWS').length,
    SUGGESTION:   posts.filter(p => p.postType === 'SUGGESTION').length,
    pending:      pendingMine.length,
  }

  const toastBg = toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b'
  const toastIcon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⏳'

  const FILTERS = [
    { key: 'all',          label: 'Tất cả',    icon: '🏠', count: posts.length + pendingMine.length },
    { key: 'ANNOUNCEMENT', label: 'Thông báo',  icon: '📢', count: counts.ANNOUNCEMENT },
    { key: 'NEWS',         label: 'Tin tức',   icon: '📰', count: counts.NEWS },
    { key: 'SUGGESTION',   label: 'Kiến nghị',  icon: '💡', count: counts.SUGGESTION },
    { key: 'pending',      label: 'Chờ duyệt',  icon: '⏳', count: counts.pending },
    { key: 'mine',         label: 'Của tôi',   icon: '👤', count: counts.pending },
  ]

  // ===== LOADING =====
  if (loading) return (
    <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.25)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>Đang tải bảng tin...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ===== DETAIL VIEW =====
  if (selectedPost) {
    const t = POST_TYPES[selectedPost.postType as keyof typeof POST_TYPES] || POST_TYPES.NEWS
    const dt = new Date(selectedPost.publishedAt || selectedPost.createdAt)
    const isPending = selectedPost.status === 'PENDING'
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: 100 }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

        {/* Toast */}
        {toast.show && (
          <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: toastBg, color: '#fff', padding: '11px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease', minWidth: 220, justifyContent: 'center' }}>
            <span>{toastIcon}</span><span>{toast.msg}</span>
          </div>
        )}

        {/* Detail header */}
        <div style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}cc 100%)`, padding: '16px 16px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSelectedPost(null)} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{t.icon} {t.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPost.title}</div>
            </div>
          </div>
        </div>

        {isPending && (
          <div style={{ margin: '12px 16px 0', background: '#fef3c7', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #fde68a' }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Đang chờ Admin duyệt</div>
              <div style={{ fontSize: 12, color: '#b45309' }}>Bài viết sẽ hiển thị sau khi được duyệt</div>
            </div>
          </div>
        )}

        <div style={{ margin: '12px 16px', backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${t.color}, ${t.color}80)` }} />
          <div style={{ padding: '20px 18px' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, backgroundColor: t.bg, color: t.color, border: `1px solid ${t.border}` }}>{t.icon} {t.label}</span>
              {isNew(selectedPost.createdAt) && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>🆕 Mới</span>}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.5, marginBottom: 14 }}>{selectedPost.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid #f1f5f9', marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarGradient(selectedPost.author?.fullName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                {initials(selectedPost.author?.fullName)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{selectedPost.author?.fullName || 'Ẩn danh'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {dt.toLocaleDateString('vi-VN')} lúc {dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {selectedPost.unit && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 99 }}>
                  🏢 {selectedPost.unit.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
              {selectedPost.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN FEED =====
  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: 100 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: toastBg, color: '#fff', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.22)', animation: 'slideDown 0.3s ease', whiteSpace: 'nowrap' }}>
          <span>{toastIcon}</span><span>{toast.msg}</span>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={{ background: 'linear-gradient(155deg, #dc2626 0%, #b91c1c 45%, #7f1d1d 100%)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', paddingLeft: '16px', paddingRight: '16px', paddingBottom: 0, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', top: -10, right: 30, width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, opacity: 0.65, textTransform: 'uppercase', marginBottom: 4 }}>Chi đoàn</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>Bảng tin</h1>
            <p style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Tin tức & thông báo mới nhất</p>
          </div>
          {onShowPoints && (
            <button onClick={onShowPoints} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              🏆 Điểm
            </button>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { n: posts.length,        label: 'Bài viết',  icon: '📋' },
            { n: counts.ANNOUNCEMENT, label: 'Thông báo', icon: '📢' },
            { n: counts.NEWS,         label: 'Tin tức',   icon: '📰' },
            { n: counts.SUGGESTION,   label: 'Kiến nghị', icon: '💡' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '10px 4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{stat.n}</div>
              <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' } as any}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key as any)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'white' : 'rgba(255,255,255,0.15)', color: active ? '#dc2626' : 'rgba(255,255,255,0.9)', flexShrink: 0, transition: 'all 0.15s', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
                {f.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: active ? '#fecaca' : 'rgba(255,255,255,0.25)', color: active ? '#dc2626' : 'white', padding: '1px 6px', borderRadius: 99 }}>{f.count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ background: 'white', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            style={{ width: '100%', padding: '10px 36px 10px 38px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a' }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#e2e8f0', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>
      </div>

      {/* ===== FEED ===== */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{activeFilter === 'mine' ? '✍️' : '📭'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            {activeFilter === 'mine' ? 'Bạn chưa có bài viết nào' : 'Không có bài viết'}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            {activeFilter === 'mine' ? 'Nhấn nút ✏️ bên dưới để đăng bài' : searchText ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có nội dung trong mục này'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 0 16px' }}>
          {paginatedPosts.map((post, idx) => {
            const t = POST_TYPES[post.postType as keyof typeof POST_TYPES] || POST_TYPES.NEWS
            const isPending = post.status === 'PENDING'
            const isAnnouncement = post.postType === 'ANNOUNCEMENT'
            const dateStr = post.publishedAt || post.createdAt

            return (
              <div
                key={post.id}
                onClick={() => { if (!isPending) setSelectedPost(post) }}
                style={{
                  margin: isAnnouncement ? '6px 12px' : '5px 16px',
                  backgroundColor: isPending ? '#f3f4f6' : 'white',
                  borderRadius: isAnnouncement ? 18 : 16,
                  overflow: 'hidden',
                  boxShadow: isPending ? 'none' : (isAnnouncement ? '0 3px 16px rgba(220,38,38,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
                  border: isPending ? '1.5px dashed #d1d5db' : (isAnnouncement ? '1.5px solid #fecaca' : '1px solid #f1f5f9'),
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  animation: `fadeUp 0.2s ease ${Math.min(idx, 8) * 0.04}s both`,
                  position: 'relative' as any,
                }}
              >
                {/* Pending overlay — blocks interaction & blurs content */}
                {isPending && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2.5px)', WebkitBackdropFilter: 'blur(2.5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
                    <span style={{ fontSize: 28 }}>⏳</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '4px 14px', borderRadius: 99, border: '1px solid #fde68a' }}>Đang chờ Admin duyệt</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Bài viết sẽ hiển thị sau khi được duyệt</span>
                  </div>
                )}
                <div style={{ height: isAnnouncement ? 4 : 3, background: isPending ? '#d1d5db' : `linear-gradient(90deg, ${t.color}, ${t.color}60)` }} />
                <div style={{ padding: isAnnouncement ? '14px 16px' : '13px 14px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, backgroundColor: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
                      {t.icon} {t.label}
                    </span>
                    {isNew(post.createdAt) && (
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>🆕</span>
                    )}
                    {isPending && (
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: '#fef3c7', color: '#d97706', animation: 'pulse 2s infinite' }}>⏳ Chờ duyệt</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{timeAgo(dateStr)}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: isAnnouncement ? 16 : 15, fontWeight: isAnnouncement ? 700 : 600, color: '#0f172a', marginBottom: 7, lineHeight: 1.45 }}>
                    {post.title}
                  </h3>

                  {/* Preview */}
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                    {post.content}
                  </p>

                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarGradient(post.author?.fullName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                      {initials(post.author?.fullName)}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{post.author?.fullName || 'Ẩn danh'}</span>
                    {post.unit && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>🏢 {post.unit.name}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== PHÂN TRANG ===== */}
      {totalNewsPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 16px 0' }}>
          <button onClick={() => setNewsPage(p => Math.max(1, p - 1))} disabled={safeNewsPage <= 1}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeNewsPage <= 1 ? '#f8fafc' : 'white', color: safeNewsPage <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeNewsPage <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Trước
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', minWidth: 90, textAlign: 'center' }}>
            Trang {safeNewsPage} / {totalNewsPages}
          </span>
          <button onClick={() => setNewsPage(p => Math.min(totalNewsPages, p + 1))} disabled={safeNewsPage >= totalNewsPages}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeNewsPage >= totalNewsPages ? '#f8fafc' : 'white', color: safeNewsPage >= totalNewsPages ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeNewsPage >= totalNewsPages ? 'not-allowed' : 'pointer' }}>
            Sau →
          </button>
        </div>
      )}

      {/* ===== FAB ===== */}
      <button
        onClick={() => setShowCreate(true)}
        style={{ position: 'fixed', bottom: 86, right: 20, width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 6px 20px rgba(220,38,38,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        ✏️
      </button>

      {/* ===== CREATE POST MODAL ===== */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <div style={{ background: 'white', width: '100%', maxWidth: 540, borderRadius: 24, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', animation: 'fadeUp 0.25s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '24px 24px 0 0' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>✍️ Đăng bài viết</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Bài viết sẽ được Admin xét duyệt trước khi hiển thị</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Post type */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Loại bài viết</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['NEWS', 'SUGGESTION'] as const).map(type => {
                    const info = POST_TYPES[type]
                    const active = form.postType === type
                    return (
                      <button key={type} onClick={() => setForm(f => ({ ...f, postType: type }))} style={{ flex: 1, padding: '10px 8px', borderRadius: 14, border: `2px solid ${active ? info.color : '#e2e8f0'}`, background: active ? info.bg : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 20 }}>{info.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: active ? info.color : '#64748b' }}>{info.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Tiêu đề *</div>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Nhập tiêu đề bài viết..."
                  maxLength={150}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 3 }}>{form.title.length}/150</div>
              </div>

              {/* Content */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Nội dung *</div>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Nhập nội dung bài viết. Hãy mô tả rõ ràng và đầy đủ..."
                  rows={4}
                  maxLength={2000}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', color: '#0f172a', lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 3 }}>{form.content.length}/2000</div>
              </div>

              {/* Info notice */}
              <div style={{ background: '#eff6ff', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>ℹ️</span>
                <div style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
                  Bài viết loại <strong>Tin tức</strong> và <strong>Kiến nghị</strong> sẽ gửi Admin xét duyệt trước khi hiển thị.
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreatePost}
                disabled={creating || !form.title.trim() || !form.content.trim()}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: (creating || !form.title.trim() || !form.content.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: (creating || !form.title.trim() || !form.content.trim()) ? '#94a3b8' : 'white', fontSize: 16, fontWeight: 700, cursor: (creating || !form.title.trim() || !form.content.trim()) ? 'not-allowed' : 'pointer', boxShadow: (creating || !form.title.trim() || !form.content.trim()) ? 'none' : '0 4px 14px rgba(220,38,38,0.3)' }}>
                {creating ? '⏳ Đang gửi...' : '🚀 Gửi bài viết'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

