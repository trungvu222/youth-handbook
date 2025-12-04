"use client"

import { useState, useEffect } from "react"

// Mock posts - fallback when API fails
const MOCK_POSTS = [
  {
    id: '1',
    title: 'Thông báo về Đại hội Đoàn cấp cơ sở năm 2024',
    content: 'Ban Thường vụ Đoàn trường thông báo kế hoạch tổ chức Đại hội Đoàn cấp Chi đoàn và cấp Liên chi đoàn năm 2024.\n\nThời gian: Từ ngày 15/03 đến 30/04/2024\n\nCác Chi đoàn hoàn thành hồ sơ và nộp về Văn phòng Đoàn trường trước ngày 10/03/2024.',
    postType: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    publishedAt: '2024-03-01T10:00:00Z',
    createdAt: '2024-03-01T09:00:00Z',
    author: { id: '1', fullName: 'Nguyễn Văn Admin', role: 'ADMIN' }
  },
  {
    id: '2',
    title: 'Kết quả Cuộc thi Ý tưởng sáng tạo trẻ 2024',
    content: 'Chúc mừng các đội thi đã đạt giải trong Cuộc thi Ý tưởng sáng tạo trẻ năm 2024!\n\n🥇 Giải Nhất: Đội "Green Future" - Liên chi đoàn Khoa CNTT\n🥈 Giải Nhì: Đội "Smart City" - Liên chi đoàn Khoa Điện tử\n🥉 Giải Ba: Đội "Eco Life" - Liên chi đoàn Khoa Môi trường',
    postType: 'NEWS',
    status: 'PUBLISHED',
    publishedAt: '2024-02-28T14:30:00Z',
    createdAt: '2024-02-28T14:00:00Z',
    author: { id: '2', fullName: 'Trần Thị Bình', role: 'LEADER' }
  },
  {
    id: '3',
    title: 'Đăng ký tham gia chiến dịch Mùa hè xanh 2024',
    content: 'Đoàn trường mở đợt đăng ký tham gia chiến dịch tình nguyện Mùa hè xanh 2024.\n\n📍 Địa điểm: Các xã vùng sâu, vùng xa tỉnh Quảng Ngãi\n⏰ Thời gian: 01/07 - 31/07/2024\n📝 Đăng ký: Trước 15/05/2024\n\nQuyền lợi:\n- Được cấp giấy chứng nhận\n- Cộng điểm rèn luyện\n- Hỗ trợ đi lại, ăn ở',
    postType: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    publishedAt: '2024-02-25T08:00:00Z',
    createdAt: '2024-02-25T07:30:00Z',
    author: { id: '1', fullName: 'Nguyễn Văn Admin', role: 'ADMIN' }
  },
  {
    id: '4',
    title: 'Hội nghị đối thoại giữa lãnh đạo và Đoàn viên',
    content: 'Đoàn trường tổ chức Hội nghị đối thoại giữa Ban Giám hiệu với Đoàn viên, sinh viên.\n\n📅 Thời gian: 14h00 ngày 20/03/2024\n📍 Địa điểm: Hội trường A, Tầng 3\n\nNội dung:\n- Giải đáp thắc mắc về học tập\n- Cơ sở vật chất, ký túc xá\n- Hoạt động ngoại khóa\n- Việc làm, thực tập',
    postType: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    publishedAt: '2024-03-10T09:00:00Z',
    createdAt: '2024-03-10T08:30:00Z',
    author: { id: '3', fullName: 'Lê Văn Cường', role: 'LEADER' }
  },
  {
    id: '5',
    title: 'Khai mạc Tháng Thanh niên 2024',
    content: 'Đoàn trường long trọng tổ chức Lễ khai mạc Tháng Thanh niên năm 2024 với chủ đề "Tuổi trẻ tiên phong - Xung kích - Sáng tạo".\n\nCác hoạt động chính:\n🌟 Ngày hội hiến máu nhân đạo\n🌟 Chiến dịch làm sạch môi trường\n🌟 Cuộc thi sáng tạo công nghệ\n🌟 Giải bóng đá sinh viên',
    postType: 'NEWS',
    status: 'PUBLISHED',
    publishedAt: '2024-03-05T07:00:00Z',
    createdAt: '2024-03-05T06:00:00Z',
    author: { id: '1', fullName: 'Nguyễn Văn Admin', role: 'ADMIN' }
  },
  {
    id: '6',
    title: 'Tuyển tình nguyện viên hỗ trợ thi THPT Quốc gia',
    content: 'Đoàn trường tuyển 200 tình nguyện viên hỗ trợ kỳ thi THPT Quốc gia 2024.\n\n📋 Yêu cầu:\n- Sinh viên năm 2, 3, 4\n- Có tinh thần trách nhiệm cao\n- Sức khỏe tốt\n\n🎁 Quyền lợi:\n- Giấy chứng nhận\n- Cộng 5 điểm rèn luyện\n- Hỗ trợ ăn trưa',
    postType: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    publishedAt: '2024-05-01T10:00:00Z',
    createdAt: '2024-05-01T09:00:00Z',
    author: { id: '2', fullName: 'Trần Thị Bình', role: 'LEADER' }
  },
  {
    id: '7',
    title: 'Giải bóng đá Đoàn viên mở rộng 2024',
    content: 'Đoàn trường phối hợp Trung tâm TDTT tổ chức Giải bóng đá Đoàn viên mở rộng năm 2024.\n\n⚽ Thể thức: Sân 7 người\n📅 Thời gian: 01/04 - 30/04/2024\n🏆 Giải thưởng:\n- Vô địch: 5.000.000đ\n- Á quân: 3.000.000đ\n- Hạng 3: 2.000.000đ',
    postType: 'NEWS',
    status: 'PUBLISHED',
    publishedAt: '2024-03-20T08:00:00Z',
    createdAt: '2024-03-20T07:30:00Z',
    author: { id: '4', fullName: 'Phạm Minh Đức', role: 'MEMBER' }
  },
  {
    id: '8',
    title: 'Chương trình học bổng "Thắp sáng ước mơ" 2024',
    content: 'Quỹ học bổng "Thắp sáng ước mơ" tiếp nhận hồ sơ xét cấp học bổng năm 2024.\n\n💰 Mức học bổng: 5-10 triệu đồng/suất\n📝 Đối tượng: Sinh viên có hoàn cảnh khó khăn, học tập tốt\n📅 Hạn nộp: 15/04/2024\n\nHồ sơ gồm:\n- Đơn xin học bổng\n- Bảng điểm\n- Xác nhận hoàn cảnh',
    postType: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    publishedAt: '2024-03-15T14:00:00Z',
    createdAt: '2024-03-15T13:30:00Z',
    author: { id: '1', fullName: 'Nguyễn Văn Admin', role: 'ADMIN' }
  },
  {
    id: '9',
    title: 'Lễ kết nạp Đoàn viên mới đợt 26/3',
    content: 'Nhân kỷ niệm 93 năm ngày thành lập Đoàn TNCS Hồ Chí Minh, Đoàn trường tổ chức Lễ kết nạp Đoàn viên mới.\n\n📅 Thời gian: 19h00 ngày 26/03/2024\n📍 Địa điểm: Sân vận động trường\n\n🎉 Chào mừng 150 Đoàn viên mới!',
    postType: 'NEWS',
    status: 'PUBLISHED',
    publishedAt: '2024-03-26T20:00:00Z',
    createdAt: '2024-03-26T19:00:00Z',
    author: { id: '3', fullName: 'Lê Văn Cường', role: 'LEADER' }
  },
  {
    id: '10',
    title: 'Workshop "Kỹ năng phỏng vấn xin việc"',
    content: 'CLB Kỹ năng mềm tổ chức Workshop "Chinh phục nhà tuyển dụng".\n\n👨‍💼 Diễn giả: Anh Nguyễn Hoàng - HR Manager FPT Software\n📅 Thời gian: 14h00 ngày 05/04/2024\n📍 Địa điểm: Phòng B201\n\nNội dung:\n- Chuẩn bị CV ấn tượng\n- Kỹ năng trả lời phỏng vấn\n- Đàm phán lương thưởng',
    postType: 'NEWS',
    status: 'PUBLISHED',
    publishedAt: '2024-04-01T09:00:00Z',
    createdAt: '2024-04-01T08:30:00Z',
    author: { id: '5', fullName: 'Hoàng Thị Mai', role: 'MEMBER' }
  }
]

export default function NewsScreenMobile() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [searchText, setSearchText] = useState('')

  // Load posts from API with fallback to mock data
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
        
        // Use API data if available, otherwise fallback to mock
        setPosts(postsData.length > 0 ? postsData : MOCK_POSTS)
      } else {
        setPosts(MOCK_POSTS)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts(MOCK_POSTS) // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  // ===== INLINE STYLES =====
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    paddingBottom: '100px', // Extra space for scrolling past bottom nav
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
    padding: '20px 16px',
    color: '#ffffff',
  }

  const searchContainerStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '12px 16px',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
  }

  const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: bg,
    color: color,
    marginRight: '8px',
    marginBottom: '8px',
  })

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '12px',
    fontSize: '18px',
  }

  const getPostTypeDisplay = (type: string) => {
    if (type === 'ANNOUNCEMENT') return { text: 'Thông báo', bg: '#fee2e2', color: '#dc2626', icon: '📢' }
    if (type === 'NEWS') return { text: 'Tin tức', bg: '#dbeafe', color: '#2563eb', icon: '📰' }
    if (type === 'SUGGESTION') return { text: 'Kiến nghị', bg: '#d1fae5', color: '#059669', icon: '💬' }
    return { text: type || 'Khác', bg: '#f3f4f6', color: '#374151', icon: '📄' }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ color: '#6b7280' }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  const filteredPosts = posts.filter(post => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return post.title.toLowerCase().includes(search) ||
           post.content.toLowerCase().includes(search)
  })

  // Post Detail View
  if (selectedPost) {
    const typeDisplay = getPostTypeDisplay(selectedPost.postType)
    const dateTime = formatDateTime(selectedPost.publishedAt || selectedPost.createdAt)
    
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button style={backButtonStyle} onClick={() => setSelectedPost(null)}>
            ←
          </button>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>Chi tiết bài viết</span>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '12px' }}>
            <span style={badgeStyle(typeDisplay.bg, typeDisplay.color)}>
              {typeDisplay.icon} {typeDisplay.text}
            </span>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '16px', lineHeight: 1.4 }}>
            {selectedPost.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#e9d5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                color: '#7c3aed',
              }}>
                {selectedPost.author.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </div>
              <span style={{ color: '#374151', fontWeight: 500 }}>{selectedPost.author.fullName}</span>
            </div>
            <span>🕐 {dateTime.date} {dateTime.time}</span>
          </div>

          <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {selectedPost.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>📰</span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Bảng tin</span>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Tin tức và thông báo</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                Cập nhật thông tin mới nhất
              </p>
            </div>
            <span style={{ fontSize: '32px', opacity: 0.6 }}>📰</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📰</span>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Không có bài viết nào.</p>
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {filteredPosts.map((post) => {
            const typeDisplay = getPostTypeDisplay(post.postType)
            const dateTime = formatDateTime(post.publishedAt || post.createdAt)
            
            return (
              <div key={post.id} style={cardStyle} onClick={() => setSelectedPost(post)}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={badgeStyle(typeDisplay.bg, typeDisplay.color)}>
                    {typeDisplay.icon} {typeDisplay.text}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>
                  {post.title}
                </h3>
                
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                  {truncateContent(post.content)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                  <span>👤 {post.author.fullName}</span>
                  <span>📅 {dateTime.date}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
