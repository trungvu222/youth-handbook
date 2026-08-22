'use client'

import { useState } from 'react'
import { chatApi } from '@/lib/api'
import { 
  ScrollText, 
  Award, 
  Star, 
  Scale, 
  Users, 
  Lightbulb, 
  MessageCircle, 
  BookOpen, 
  Sparkles, 
  Bot, 
  Clock, 
  ArrowRight, 
  X, 
  Send 
} from 'lucide-react'

// Định nghĩa chuyên đề học tập
const STUDY_TOPICS = [
  {
    id: 1,
    icon: ScrollText,
    title: 'Điều lệ Đoàn TNCS Hồ Chí Minh',
    description: 'Tìm hiểu về Điều lệ Đoàn, quyền và nghĩa vụ của Đoàn viên, cơ cấu tổ chức',
    color: { bg: '#fee2e2', text: '#dc2626', light: '#fef2f2' },
    keywords: 'Điều lệ Đoàn TNCS Hồ Chí Minh, quyền nghĩa vụ đoàn viên, cơ cấu tổ chức đoàn',
    difficulty: 'Cơ bản',
    estimatedTime: '30 phút'
  },
  {
    id: 2,
    icon: Award,
    title: 'Lịch sử Đoàn',
    description: 'Lịch sử hình thành và phát triển của Đoàn qua các giai đoạn cách mạng',
    color: { bg: '#fef3c7', text: '#d97706', light: '#fefce8' },
    keywords: 'Lịch sử Đoàn TNCS Hồ Chí Minh, ngày thành lập đoàn 26/3/1931, truyền thống đoàn',
    difficulty: 'Trung bình',
    estimatedTime: '45 phút'
  },
  {
    id: 3,
    icon: Star,
    title: 'Tư tưởng Hồ Chí Minh',
    description: 'Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh',
    color: { bg: '#dbeafe', text: '#2563eb', light: '#eff6ff' },
    keywords: 'Tư tưởng Hồ Chí Minh, đạo đức Hồ Chí Minh, học tập và làm theo Bác',
    difficulty: 'Trung bình',
    estimatedTime: '40 phút'
  },
  {
    id: 4,
    icon: Scale,
    title: 'Pháp luật về Thanh niên',
    description: 'Các văn bản pháp luật liên quan đến quyền lợi và trách nhiệm của thanh niên',
    color: { bg: '#e0e7ff', text: '#4f46e5', light: '#eef2ff' },
    keywords: 'Luật Thanh niên, quyền lợi thanh niên, trách nhiệm thanh niên, pháp luật',
    difficulty: 'Nâng cao',
    estimatedTime: '50 phút'
  },
  {
    id: 5,
    icon: Users,
    title: 'Kỹ năng lãnh đạo',
    description: 'Rèn luyện kỹ năng lãnh đạo, quản lý và tổ chức hoạt động Đoàn',
    color: { bg: '#d1fae5', text: '#059669', light: '#f0fdf4' },
    keywords: 'Kỹ năng lãnh đạo, quản lý đoàn, tổ chức hoạt động, làm việc nhóm',
    difficulty: 'Nâng cao',
    estimatedTime: '60 phút'
  },
  {
    id: 6,
    icon: Lightbulb,
    title: 'Kỹ năng mềm',
    description: 'Phát triển kỹ năng giao tiếp, làm việc nhóm, thuyết trình và tư duy sáng tạo',
    color: { bg: '#fae8ff', text: '#a855f7', light: '#fdf4ff' },
    keywords: 'Kỹ năng mềm, giao tiếp, thuyết trình, làm việc nhóm, tư duy sáng tạo',
    difficulty: 'Cơ bản',
    estimatedTime: '35 phút'
  }
]

export default function StudyScreenMobile() {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(false) // Changed to false since we use static data
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  
  // Chat state
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isSending, setIsSending] = useState(false)

  // Send message to AI
  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const userMessage = message.trim()
    setMessage('')
    setIsSending(true)

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)

    try {
      // Convert to Gemini history format
      const history = newMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))

      const result = await chatApi.chatWithAI(userMessage, history)

      if (result.success && result.data?.message) {
        setMessages([...newMessages, { role: 'assistant', content: result.data.message }])
      } else {
        console.error('[Chat] API error:', result.error)
        const errorMsg = result.error?.includes('chưa được cấu hình')
          ? 'Trợ lý ảo đang bảo trì. Vui lòng thử lại sau ít phút.'
          : result.error?.includes('giới hạn sử dụng')
          ? 'Trợ lý ảo tạm thời quá tải. Vui lòng thử lại sau vài phút.'
          : 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: errorMsg
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Không thể kết nối với trợ lý ảo. Vui lòng kiểm tra kết nối mạng.' 
      }])
    } finally {
      setIsSending(false)
    }
  }

  // Handle topic click - open modal and ask AI
  const handleTopicClick = async (topic: any) => {
    setSelectedTopic(topic)
    setIsSending(true)
    
    const prompt = `Hãy giảng dạy chi tiết về chuyên đề: "${topic.title}". ${topic.description}. 
    
Yêu cầu:
- Trình bày có hệ thống, dễ hiểu
- Chia thành các phần rõ ràng
- Đưa ra ví dụ thực tế
- Tổng kết những điểm quan trọng nhất

Từ khóa cần tập trung: ${topic.keywords}`

    try {
      const result = await chatApi.chatWithAI(prompt, [])
      
      if (result.success && result.data?.message) {
        setSelectedTopic({
          ...topic,
          aiContent: result.data.message
        })
      } else {
        setSelectedTopic({
          ...topic,
          aiContent: 'Xin lỗi, không thể tải nội dung. Vui lòng thử lại sau.'
        })
      }
    } catch (error) {
      console.error('Topic AI error:', error)
      setSelectedTopic({
        ...topic,
        aiContent: 'Không thể kết nối với trợ lý ảo. Vui lòng kiểm tra kết nối mạng.'
      })
    } finally {
      setIsSending(false)
    }
  }

  // Close topic modal
  const closeTopicModal = () => {
    setSelectedTopic(null)
  }

  // Start new chat
  const handleNewChat = () => {
    setMessages([])
    setMessage('')
  }

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f5f6fa',
    minHeight: '100%',
    paddingBottom: '100px',
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
    padding: '24px 16px 20px',
    color: '#ffffff',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '13px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #7c3aed' : '3px solid transparent',
    color: isActive ? '#7c3aed' : '#94a3b8',
    fontWeight: isActive ? 600 : 500,
    fontSize: '14px',
    cursor: 'pointer',
  })

  const chatContainerStyle: React.CSSProperties = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
  }

  const welcomeStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 20px',
  }

  const chatInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
  }

  const chatInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
  }

  const sendButtonStyle: React.CSSProperties = {
    padding: '12px 20px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '24px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  }

  return (
    <>
      <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 50% { transform: translateX(300%); } 100% { transform: translateX(-100%); } } @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>Trợ lý ảo</h1>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Hỏi đáp và học tập cùng AI</p>
        </div>

        <div style={tabsContainerStyle}>
          <button style={getTabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}><MessageCircle style={{ width: 16, height: 16 }} /> Trò chuyện</button>
          <button style={getTabStyle(activeTab === 'topics')} onClick={() => setActiveTab('topics')}><BookOpen style={{ width: 16, height: 16 }} /> Chuyên đề</button>
        </div>

        {activeTab === 'chat' ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            {messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button onClick={handleNewChat} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)', border: 'none', borderRadius: '24px', fontSize: '13px', fontWeight: 600, color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                  <Sparkles style={{ width: 16, height: 16 }} /> Chat mới
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Bot style={{ width: 32, height: 32, color: '#7c3aed' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Xin chào!</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>Tôi là trợ lý ảo của bạn. Hãy hỏi tôi bất cứ điều gì về hoạt động Đoàn!</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: m.role === 'user' ? '#7c3aed' : '#ffffff', color: m.role === 'user' ? '#ffffff' : '#1f2937', fontSize: '14px', lineHeight: 1.6, border: m.role === 'user' ? 'none' : '1px solid #e5e7eb' }}>
                    {m.content}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <input type="text" style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '24px', fontSize: '14px' }} value={message} onChange={(e) => setMessage(e.target.value)} disabled={isSending} />
              <button style={{ padding: '12px 20px', backgroundColor: '#7c3aed', color: '#ffffff', borderRadius: '24px' }} onClick={handleSendMessage} disabled={isSending}>Gửi</button>
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '20px' }}>
            {STUDY_TOPICS.map(topic => (
              <div key={topic.id} style={{ backgroundColor: '#ffffff', margin: '8px 16px', borderRadius: '16px', padding: '18px', border: `2px solid ${topic.color.bg}`, cursor: 'pointer' }} onClick={() => handleTopicClick(topic)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: topic.color.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <topic.icon style={{ width: 26, height: 26, color: topic.color.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{topic.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: topic.color.bg, color: topic.color.text }}>{topic.difficulty}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}><Clock style={{ width: 12, height: 12 }} /> {topic.estimatedTime}</span>
                    </div>
                  </div>
                  <ArrowRight style={{ width: 18, height: 18, color: topic.color.text }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTopic && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }} onClick={closeTopicModal}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxHeight: '85vh', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${selectedTopic.color.text}` }}>
                  {selectedTopic.icon && <selectedTopic.icon style={{ width: 22, height: 22, color: selectedTopic.color.text }} />}
                </div>
                <h2 style={{ flex: 1, fontSize: '17px', fontWeight: 700 }}>{selectedTopic.title}</h2>
                <button onClick={closeTopicModal} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X style={{ width: 16, height: 16 }} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: '14px', lineHeight: 1.7 }}>
                {isSending ? <div style={{ textAlign: 'center' }}><Bot style={{ margin: '0 auto 16px', width: 28, height: 28, color: '#7c3aed' }} /> Đang tải nội dung...</div> : selectedTopic.aiContent}
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={closeTopicModal} style={{ width: '100%', padding: '12px', backgroundColor: selectedTopic.color.text, color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 600 }}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
