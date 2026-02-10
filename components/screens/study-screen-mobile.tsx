'use client'

import { useState, useEffect } from 'react'

export default function StudyScreenMobile() {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')

  // Load topics from API with fallback to mock data
  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    setLoading(true)
    try {
      const { studyApi } = await import('@/lib/api')
      const result: any = await studyApi.getStudyTopics()

      if (result.success && result.data) {
        let topicsData: any[] = []
        if (Array.isArray(result.data)) {
          topicsData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          topicsData = result.data.data
        } else if (result.data.topics && Array.isArray(result.data.topics)) {
          topicsData = result.data.topics
        }
        
        setTopics(topicsData)
      } else {
        setTopics([])
      }
    } catch (error) {
      console.error('Error loading topics:', error)
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    paddingBottom: '100px', // Extra space for scrolling past bottom nav
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    padding: '20px 16px',
    color: '#ffffff',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #6366f1' : '3px solid transparent',
    color: isActive ? '#6366f1' : '#6b7280',
    fontWeight: isActive ? 600 : 500,
    fontSize: '14px',
    cursor: 'pointer',
  })

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '12px 16px',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
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
    marginRight: '6px',
  })

  const chatContainerStyle: React.CSSProperties = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
  }

  const welcomeStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
  }

  const chatInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
  }

  const chatInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
  }

  const sendButtonStyle: React.CSSProperties = {
    padding: '12px 20px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '24px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const getCategoryColor = (category: string) => {
    if (category === 'Nghị quyết') return { bg: '#fee2e2', color: '#dc2626' }
    if (category === 'Pháp luật') return { bg: '#dbeafe', color: '#2563eb' }
    if (category === 'Kỹ năng') return { bg: '#d1fae5', color: '#059669' }
    return { bg: '#f3f4f6', color: '#374151' }
  }

  const getStatusText = (status: string) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'IN_PROGRESS') return 'Đang học'
    return 'Chưa bắt đầu'
  }

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return { bg: '#d1fae5', color: '#059669' }
    if (status === 'IN_PROGRESS') return { bg: '#fef3c7', color: '#d97706' }
    return { bg: '#f3f4f6', color: '#6b7280' }
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Trợ lý ảo</span>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
          Hỏi đáp và học tập cùng AI
        </p>
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button style={getTabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
          <span style={{ fontSize: '14px' }}>💬</span>
          Trò chuyện
        </button>
        <button style={getTabStyle(activeTab === 'topics')} onClick={() => setActiveTab('topics')}>
          <span style={{ fontSize: '14px' }}>📚</span>
          Chuyên đề
        </button>
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div style={chatContainerStyle}>
          <div style={welcomeStyle}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#e9d5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
            }}>
              🤖
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              Xin chào! 👋
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              Tôi là trợ lý ảo của bạn. Hãy hỏi tôi bất cứ điều gì về hoạt động Đoàn!
            </p>
            
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>Gợi ý câu hỏi:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Điều lệ Đoàn TNCS Hồ Chí Minh?', 'Cách tính điểm rèn luyện?', 'Quy trình kết nạp Đoàn viên?'].map((q, i) => (
                  <button
                    key={i}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => setMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={chatInputContainerStyle}>
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              style={chatInputStyle}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button style={sendButtonStyle}>Gửi</button>
          </div>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <div style={{ color: '#6b7280' }}>Đang tải...</div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {topics.map((topic) => {
            const catColor = getCategoryColor(topic.category)
            const statusColor = getStatusColor(topic.status)

            return (
              <div key={topic.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', flex: 1, marginRight: '8px' }}>
                    {topic.title}
                  </h3>
                  <span style={badgeStyle(catColor.bg, catColor.color)}>
                    {topic.category}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                  {topic.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <span>📄 {topic.totalMaterials} tài liệu</span>
                    {topic.hasQuiz && <span>✅ Quiz</span>}
                  </div>

                  <span style={badgeStyle(statusColor.bg, statusColor.color)}>
                    {getStatusText(topic.status)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
