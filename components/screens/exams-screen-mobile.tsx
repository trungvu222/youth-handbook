'use client'

import { useState, useEffect } from 'react'

// Mock exams - fallback when API fails
const MOCK_EXAMS = [
  {
    id: '1',
    title: 'Kiểm tra Điều lệ Đoàn',
    description: 'Bài kiểm tra kiến thức về Điều lệ Đoàn TNCS Hồ Chí Minh',
    category: 'Nghị quyết',
    duration: 30,
    totalQuestions: 20,
    passingScore: 70,
    maxAttempts: 3,
    pointsReward: 50,
    attemptCount: 0
  },
  {
    id: '2',
    title: 'Kiểm tra Luật Thanh niên',
    description: 'Bài kiểm tra về quyền và nghĩa vụ của thanh niên theo Luật Thanh niên 2020',
    category: 'Pháp luật',
    duration: 45,
    totalQuestions: 30,
    passingScore: 60,
    maxAttempts: 2,
    pointsReward: 80,
    attemptCount: 1
  },
  {
    id: '3',
    title: 'Kỹ năng mềm cơ bản',
    description: 'Đánh giá các kỹ năng giao tiếp, làm việc nhóm và thuyết trình',
    category: 'Kỹ năng',
    duration: 20,
    totalQuestions: 15,
    passingScore: 50,
    maxAttempts: 5,
    pointsReward: 30,
    attemptCount: 2
  },
  {
    id: '4',
    title: 'Lịch sử Đoàn TNCS Hồ Chí Minh',
    description: 'Kiểm tra kiến thức về lịch sử hình thành và phát triển của Đoàn',
    category: 'Nghị quyết',
    duration: 40,
    totalQuestions: 25,
    passingScore: 65,
    maxAttempts: 3,
    pointsReward: 60,
    attemptCount: 0
  },
  {
    id: '5',
    title: 'Kiểm tra Luật Lao động',
    description: 'Bài kiểm tra về quyền lợi và nghĩa vụ của người lao động',
    category: 'Pháp luật',
    duration: 35,
    totalQuestions: 20,
    passingScore: 60,
    maxAttempts: 3,
    pointsReward: 55,
    attemptCount: 0
  },
  {
    id: '6',
    title: 'Kỹ năng lãnh đạo',
    description: 'Đánh giá năng lực lãnh đạo và điều hành công việc',
    category: 'Kỹ năng',
    duration: 25,
    totalQuestions: 18,
    passingScore: 55,
    maxAttempts: 4,
    pointsReward: 45,
    attemptCount: 1
  },
  {
    id: '7',
    title: 'Nghị quyết Đại hội Đoàn XII',
    description: 'Kiểm tra hiểu biết về phương hướng công tác Đoàn 2022-2027',
    category: 'Nghị quyết',
    duration: 30,
    totalQuestions: 20,
    passingScore: 70,
    maxAttempts: 2,
    pointsReward: 70,
    attemptCount: 0
  },
  {
    id: '8',
    title: 'Kiểm tra Luật Giáo dục',
    description: 'Bài kiểm tra về quyền và nghĩa vụ của người học',
    category: 'Pháp luật',
    duration: 30,
    totalQuestions: 20,
    passingScore: 60,
    maxAttempts: 3,
    pointsReward: 50,
    attemptCount: 0
  },
  {
    id: '9',
    title: 'Kỹ năng quản lý thời gian',
    description: 'Đánh giá khả năng sắp xếp và quản lý thời gian hiệu quả',
    category: 'Kỹ năng',
    duration: 15,
    totalQuestions: 12,
    passingScore: 50,
    maxAttempts: 5,
    pointsReward: 25,
    attemptCount: 0
  },
  {
    id: '10',
    title: 'Tổng hợp kiến thức Đoàn viên',
    description: 'Bài kiểm tra tổng hợp dành cho Đoàn viên mới',
    category: 'Nghị quyết',
    duration: 60,
    totalQuestions: 40,
    passingScore: 65,
    maxAttempts: 2,
    pointsReward: 100,
    attemptCount: 0
  }
]

export default function ExamsScreenMobile() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  // Load exams from API with fallback to mock data
  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    setLoading(true)
    try {
      const { examApi } = await import('@/lib/api')
      const result: any = await examApi.getExams()

      if (result.success && result.data) {
        let examsData: any[] = []
        if (Array.isArray(result.data)) {
          examsData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          examsData = result.data.data
        } else if (result.data.exams && Array.isArray(result.data.exams)) {
          examsData = result.data.exams
        }
        
        // Use API data if available, otherwise fallback to mock
        setExams(examsData.length > 0 ? examsData : MOCK_EXAMS)
      } else {
        setExams(MOCK_EXAMS)
      }
    } catch (error) {
      console.error('Error loading exams:', error)
      setExams(MOCK_EXAMS) // Fallback to mock data
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
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
    marginBottom: '8px',
  })

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return minutes + ' phút'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? hours + 'h ' + mins + 'm' : hours + 'h'
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

  const filteredExams = exams.filter((exam) => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return exam.title.toLowerCase().includes(search) || 
           exam.description.toLowerCase().includes(search) ||
           exam.category.toLowerCase().includes(search)
  })

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🏆</span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Kỳ thi trực tuyến</span>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
          Tham gia các kỳ thi và kiểm tra kiến thức
        </p>
      </div>

      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm kỳ thi..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {searchText ? 'Không tìm thấy kỳ thi phù hợp' : 'Chưa có kỳ thi nào'}
          </p>
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {filteredExams.map((exam) => {
            const canTakeExam = exam.attemptCount < exam.maxAttempts

            return (
              <div key={exam.id} style={cardStyle}>
                {/* Badges */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={badgeStyle('#f3f4f6', '#374151')}>{exam.category}</span>
                  <span style={badgeStyle('#dbeafe', '#1e40af')}>{exam.totalQuestions} câu</span>
                  <span style={badgeStyle('#e9d5ff', '#6b21a8')}>+{exam.pointsReward} điểm</span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>
                  {exam.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                  {exam.description}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  <span>⏱️ {formatDuration(exam.duration)}</span>
                  <span>🏆 Điểm đạt: {exam.passingScore}%</span>
                  <span>📊 Tối đa: {exam.maxAttempts} lần</span>
                </div>

                {/* Attempts info */}
                {exam.attemptCount > 0 && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#374151', fontWeight: 500 }}>
                      Đã thi: {exam.attemptCount}/{exam.maxAttempts} lần
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: canTakeExam ? '#7c3aed' : '#9ca3af',
                    opacity: canTakeExam ? 1 : 0.7,
                  }}
                  disabled={!canTakeExam}
                  onClick={() => {
                    if (canTakeExam) {
                      alert('Chức năng thi đang được phát triển. Vui lòng thử lại sau!')
                    }
                  }}
                >
                  {!canTakeExam ? 'Đã hết lượt thi' : exam.attemptCount > 0 ? 'Thi lại ▶' : 'Bắt đầu thi ▶'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
