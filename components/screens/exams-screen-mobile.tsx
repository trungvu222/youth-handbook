'use client'

import { useState, useEffect } from 'react'
import { ExamTaking } from '../exams/exam-taking'
import { examApi } from '../../lib/api'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'

export default function ExamsScreenMobile() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [takingExam, setTakingExam] = useState(false)
  const [error, setError] = useState<string>('')
  const [viewingResult, setViewingResult] = useState<any>(null)
  const [examPage, setExamPage] = useState(1)

  // Load exams from API
  useEffect(() => {
    loadExams()
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadExams(true))

  const loadExams = async (silent = false) => {
    if (!silent) setLoading(true)
    if (!silent) setError('')
    try {
      const result = await examApi.getExams()
      
      console.log('Exam API Response:', result) // Debug log

      if (result.success && result.data) {
        let examsData: any[] = []
        
        // Handle different response structures
        if (Array.isArray(result.data)) {
          examsData = result.data
        } else if ((result.data as any).data && Array.isArray((result.data as any).data)) {
          examsData = (result.data as any).data
        } else if ((result.data as any).exams && Array.isArray((result.data as any).exams)) {
          examsData = (result.data as any).exams
        }
        
        console.log('Processed exams data:', examsData) // Debug log
        
        if (examsData.length > 0) {
          setExams(examsData)
        } else {
          setError('Chưa có kỳ thi nào được tạo. Vui lòng liên hệ admin.')
        }
      } else {
        setError(result.error || 'Không thể tải danh sách kỳ thi')
      }
    } catch (error) {
      console.error('Error loading exams:', error)
      setError('Lỗi kết nối đến server. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }
  // ===== INLINE STYLES =====
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

  const searchContainerStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px 11px 42px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '6px 16px',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
  }

  const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: bg,
    color: color,
    marginRight: '6px',
    marginBottom: '6px',
  })

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '11px 16px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
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

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam)
    setShowConfirmDialog(true)
  }

  const handleConfirmStart = () => {
    setShowConfirmDialog(false)
    setTakingExam(true)
  }

  const handleExamComplete = () => {
    setTakingExam(false)
    setSelectedExam(null)
    loadExams() // Reload exams to update attempt counts
  }

  const handleBackFromExam = () => {
    setTakingExam(false)
    setSelectedExam(null)
  }

  // If taking exam, show exam taking component
  if (takingExam && selectedExam) {
    return (
      <ExamTaking 
        exam={selectedExam}
        onComplete={handleExamComplete}
        onBack={handleBackFromExam}
      />
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: '#64748b', fontSize: '14px' }}>Đang tải kỳ thi...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', marginBottom: '4px' }}>Kỳ thi trực tuyến</h1>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Tham gia các kỳ thi và kiểm tra kiến thức</p>
        </div>
        
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '1.5px solid #fecaca', 
            borderRadius: '14px', 
            padding: '24px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>!</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
              {error}
            </div>
            <button
              onClick={() => loadExams()}
              style={{
                marginTop: '16px',
                padding: '11px 24px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  const filteredExams = exams.filter((exam) => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    const category = exam.category || ''
    return exam.title.toLowerCase().includes(search) || 
           (exam.description || '').toLowerCase().includes(search) ||
           category.toLowerCase().includes(search)
  })

  const EXAM_PER_PAGE = 5
  const totalExamPages = Math.ceil(filteredExams.length / EXAM_PER_PAGE)
  const safeExamPage = Math.min(examPage, Math.max(1, totalExamPages))
  const paginatedExams = filteredExams.slice((safeExamPage - 1) * EXAM_PER_PAGE, safeExamPage * EXAM_PER_PAGE)

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3px', marginBottom: '4px' }}>Kỳ thi trực tuyến</h1>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Tham gia các kỳ thi và kiểm tra kiến thức</p>
      </div>

      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm kỳ thi..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setExamPage(1) }}
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1.5px dashed #cbd5e1', 
            borderRadius: '14px', 
            padding: '32px 16px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>📝</div>
            <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              {searchText ? 'Không tìm thấy kỳ thi phù hợp' : 'Chưa có kỳ thi nào'}
            </p>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              {searchText ? 'Thử tìm kiếm với từ khóa khác' : 'Admin chưa tạo kỳ thi. Vui lòng quay lại sau.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {paginatedExams.map((exam) => {
            const attemptCount = exam.userAttempts || exam.attemptCount || 0
            const canTakeExam = attemptCount < exam.maxAttempts
            const category = exam.category || 'Chưa phân loại'

            return (
              <div key={exam.id} style={cardStyle}>
                {/* Badges */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={badgeStyle('#f3f4f6', '#374151')}>{category}</span>
                  <span style={badgeStyle('#dbeafe', '#1e40af')}>{exam.totalQuestions} câu</span>
                  <span style={badgeStyle('#e9d5ff', '#6b21a8')}>+{exam.pointsReward || exam.pointsAwarded || 0} điểm</span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>
                  {exam.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', lineHeight: 1.5 }}>
                  {exam.description}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  <span>⏱️ {formatDuration(exam.duration)}</span>
                  <span>🏆 Điểm đạt: {exam.passingScore}%</span>
                  <span>📊 Tối đa: {exam.maxAttempts} lần</span>
                </div>

                {/* Attempts info + Xem điểm */}
                {attemptCount > 0 && (
                  <div style={{
                    padding: '10px 12px',
                    backgroundColor: exam.lastAttempt?.isGraded ? '#f5f3ff' : '#f1f5f9',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ color: exam.lastAttempt?.isGraded ? '#5b21b6' : '#64748b', fontWeight: 500 }}>
                      Đã thi: {attemptCount}/{exam.maxAttempts} lần
                      {exam.lastAttempt?.isGraded && exam.lastAttempt?.score !== null && exam.lastAttempt?.score !== undefined && (
                        <span style={{ marginLeft: '8px', color: exam.lastAttempt.isPassed ? '#15803d' : '#dc2626' }}>
                          &bull; {exam.lastAttempt.isPassed ? '✓' : '✗'} {Math.round(exam.lastAttempt.score)}%
                        </span>
                      )}
                    </span>
                    {exam.lastAttempt?.isGraded ? (
                      <button
                        onClick={() => setViewingResult(exam)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #7c3aed',
                          backgroundColor: 'white',
                          color: '#7c3aed',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Xem điểm
                      </button>
                    ) : (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#e2e8f0',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        ⏳ Đang chấm điểm
                      </span>
                    )}
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
                      handleStartExam({...exam, attemptCount})
                    }
                  }}
                >
                  {!canTakeExam ? 'Đã hết lượt thi' : attemptCount > 0 ? 'Thi lại ▶' : 'Bắt đầu thi ▶'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== PHÂN TRANG ===== */}
      {totalExamPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 16px 16px' }}>
          <button onClick={() => setExamPage(p => Math.max(1, p - 1))} disabled={safeExamPage <= 1}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeExamPage <= 1 ? '#f8fafc' : 'white', color: safeExamPage <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeExamPage <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Trước
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', minWidth: 90, textAlign: 'center' }}>
            Trang {safeExamPage} / {totalExamPages}
          </span>
          <button onClick={() => setExamPage(p => Math.min(totalExamPages, p + 1))} disabled={safeExamPage >= totalExamPages}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeExamPage >= totalExamPages ? '#f8fafc' : 'white', color: safeExamPage >= totalExamPages ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeExamPage >= totalExamPages ? 'not-allowed' : 'pointer' }}>
            Sau →
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && selectedExam && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
              padding: '24px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              color: '#ffffff',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
                Xác nhận bắt đầu thi
              </div>
              <div style={{ fontSize: '13px', opacity: 0.85 }}>
                Vui lòng đọc kỹ thông tin trước khi bắt đầu
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Title & Category */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                  TÊN KỲ THI
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                  {selectedExam.title}
                </div>
                {selectedExam.category && (
                  <span style={badgeStyle('#f3f4f6', '#374151')}>
                    {selectedExam.category}
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedExam.description && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                    MÔ TẢ
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                    {selectedExam.description}
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '14px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                    THỜI GIAN
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                    {formatDuration(selectedExam.duration)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                    SỐ CÂU HỎI
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>
                    {selectedExam.totalQuestions} câu
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                    ĐIỂM ĐẠT
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
                    {selectedExam.passingScore}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                    ĐIỂM THƯỞNG
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                    +{selectedExam.pointsReward || selectedExam.pointsAwarded || 0} điểm
                  </div>
                </div>
              </div>

              {/* Attempts Info */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: (selectedExam.attemptCount || 0) > 0 ? '#fef3c7' : '#dbeafe',
                borderRadius: '8px',
                marginBottom: '20px',
                border: (selectedExam.attemptCount || 0) > 0 ? '1px solid #fbbf24' : '1px solid #60a5fa',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {(selectedExam.attemptCount || 0) > 0 
                    ? `⚠️ Đây là lần thi thứ ${(selectedExam.attemptCount || 0) + 1}/${selectedExam.maxAttempts}`
                    : `✨ Đây là lần thi đầu tiên của bạn`
                  }
                </div>
              </div>

              {/* Important Notes */}
              <div style={{
                padding: '16px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fca5a5',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
                  ⚠️ LƯU Ý QUAN TRỌNG
                </div>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '20px', 
                  fontSize: '12px', 
                  color: '#7f1d1d',
                  lineHeight: '1.6' 
                }}>
                  <li>Hãy đảm bảo kết nối internet ổn định</li>
                  <li>Không thoát hoặc làm mới trang khi đang làm bài</li>
                  <li>Bài thi sẽ tự động nộp khi hết thời gian</li>
                  <li>Bạn chỉ có {selectedExam.maxAttempts} lần làm bài</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowConfirmDialog(false)
                    setSelectedExam(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ❌ Hủy
                </button>
                <button
                  onClick={handleConfirmStart}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(124, 58, 237, 0.25)',
                  }}
                >
                  ✅ Bắt đầu thi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {viewingResult && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
        }} onClick={() => setViewingResult(null)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
              padding: '20px 24px',
              color: 'white',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '17px', fontWeight: 700 }}>Kết quả lần thi gần nhất</div>
              <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>{viewingResult.title}</div>
            </div>

            {/* Score */}
            <div style={{ padding: '28px 24px' }}>
              {viewingResult.lastAttempt ? (() => {
                const attempt = viewingResult.lastAttempt
                const score = attempt.score !== null ? Math.round(attempt.score) : null
                const isPassed = attempt.isPassed
                return (
                  <>
                    {/* Score */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div style={{ fontSize: '52px', fontWeight: 800, color: isPassed ? '#15803d' : '#dc2626', lineHeight: 1, marginBottom: '8px' }}>
                        {score !== null ? `${score}%` : 'N/A'}
                      </div>
                      <div style={{ color: isPassed ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: '15px' }}>
                        {isPassed ? '✓ Đạt yêu cầu' : '✗ Chưa đạt'}
                      </div>
                    </div>

                    {/* Info rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Lần thi số</span>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>#{attempt.attemptNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Điểm đạt yêu cầu</span>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{viewingResult.passingScore}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng số lần đã thi</span>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{viewingResult.userAttempts}/{viewingResult.maxAttempts}</span>
                      </div>
                      {attempt.submittedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                          <span style={{ color: '#64748b', fontSize: '13px' }}>Nộp bài lúc</span>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>
                            {new Date(attempt.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {attempt.gradedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#ecfdf5', borderRadius: '10px' }}>
                          <span style={{ color: '#64748b', fontSize: '13px' }}>Đã chấm điểm lúc</span>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#15803d' }}>
                            {new Date(attempt.gradedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )
              })() : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  Chưa có kết quả nào
                </div>
              )}

              <button
                onClick={() => setViewingResult(null)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
