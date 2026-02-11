"use client"

import { useState, useEffect } from "react"
import { Trophy } from "lucide-react"

interface NewsScreenMobileProps {
  onShowPoints?: () => void
}

export default function NewsScreenMobile({ onShowPoints }: NewsScreenMobileProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { postApi } = await import('@/lib/api')
      const result = await postApi.getPosts({ limit: 50 })

      if (result.success && result.data) {
        let postsData: any[] = []
        if (Array.isArray(result.data)) {
          postsData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          postsData = result.data.data
        } else if ((result.data as any).posts && Array.isArray((result.data as any).posts)) {
          postsData = (result.data as any).posts
        }
        setPosts(postsData)
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

  const getPostTypeDisplay = (type: string) => {
    if (type === 'ANNOUNCEMENT') return { text: 'Thông báo', bg: '#fef2f2', color: '#dc2626', icon: '📢' }
    if (type === 'NEWS') return { text: 'Tin tức', bg: '#eff6ff', color: '#2563eb', icon: '📰' }
    if (type === 'SUGGESTION') return { text: 'Kiến nghị', bg: '#f0fdf4', color: '#16a34a', icon: '💬' }
    return { text: type || 'Khác', bg: '#f8fafc', color: '#475569', icon: '📄' }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #fee2e2', borderTopColor: '#dc2626',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ color: '#64748b', fontSize: '14px' }}>Đang tải bảng tin...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const filteredPosts = posts.filter(post => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return post.title?.toLowerCase().includes(search) || post.content?.toLowerCase().includes(search)
  })

  // Post Detail View
  if (selectedPost) {
    const typeDisplay = getPostTypeDisplay(selectedPost.postType)
    const dateTime = formatDateTime(selectedPost.publishedAt || selectedPost.createdAt)
    
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: '100px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 16px',
          backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <button onClick={() => setSelectedPost(null)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
            marginRight: '12px', fontSize: '16px', color: '#475569',
          }}>←</button>
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>Chi tiết bài viết</span>
        </div>

        <div style={{
          backgroundColor: '#ffffff', margin: '12px 16px', borderRadius: '16px',
          padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
              borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              backgroundColor: typeDisplay.bg, color: typeDisplay.color,
            }}>{typeDisplay.icon} {typeDisplay.text}</span>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', lineHeight: 1.5 }}>
            {selectedPost.title}
          </h1>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            color: '#94a3b8', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #fecaca, #fde68a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#991b1b',
            }}>
              {selectedPost.author?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
            <span style={{ color: '#334155', fontWeight: 500 }}>{selectedPost.author?.fullName}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span>{dateTime.date}</span>
          </div>

          <div style={{ fontSize: '15px', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {selectedPost.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
        padding: '24px 16px 20px', color: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.3px' }}>Bảng tin</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Tin tức & thông báo mới nhất</p>
          </div>
          {onShowPoints && (
            <button onClick={onShowPoints} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px',
              color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              <Trophy style={{ width: '16px', height: '16px' }} />
              Điểm
            </button>
          )}
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '14px',
          padding: '14px 16px', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{posts.length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Bài viết</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{posts.filter(p => p.postType === 'ANNOUNCEMENT').length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Thông báo</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{posts.filter(p => p.postType === 'NEWS').length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Tin tức</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 42px',
              border: '1.5px solid #e2e8f0', borderRadius: '12px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
              backgroundColor: '#f8fafc', color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📰</span>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>Chưa có bài viết nào</p>
        </div>
      ) : (
        <div style={{ padding: '8px 0 20px' }}>
          {filteredPosts.map((post) => {
            const typeDisplay = getPostTypeDisplay(post.postType)
            const dateTime = formatDateTime(post.publishedAt || post.createdAt)
            
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} style={{
                backgroundColor: '#ffffff', margin: '6px 16px', borderRadius: '14px',
                padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #f1f5f9', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                    borderRadius: '16px', fontSize: '11px', fontWeight: 600,
                    backgroundColor: typeDisplay.bg, color: typeDisplay.color,
                  }}>{typeDisplay.icon} {typeDisplay.text}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>{dateTime.date}</span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.5 }}>
                  {post.title}
                </h3>
                
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', lineHeight: 1.6 }}>
                  {truncateContent(post.content)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fecaca, #fde68a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, color: '#991b1b',
                  }}>
                    {post.author?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <span style={{ color: '#64748b' }}>{post.author?.fullName}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
