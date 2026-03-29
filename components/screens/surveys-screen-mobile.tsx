"use client"

import { useState, useEffect } from "react"
import { surveyApi } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"

interface SurveyQuestion {
  id?: string
  questionText: string
  text?: string  // Alias for questionText
  questionType: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'YES_NO'
  type?: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'YES_NO'  // Alias for questionType
  options?: string[]
  isRequired?: boolean
  required?: boolean  // Alias for isRequired
}

interface Survey {
  id: string
  title: string
  description?: string
  status: string
  startDate: string
  endDate: string
  pointsReward: number
  isAnonymous: boolean
  questions: SurveyQuestion[]
  hasResponded: boolean
  _count: { responses: number; questions: number }
  creator?: { fullName: string }
}

export default function SurveysScreenMobile({ onBack }: { onBack?: () => void }) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)

  useEffect(() => {
    loadSurveys()
  }, [])

  // Auto-refresh: poll every 30s + refresh on visibility/focus
  useAutoRefresh(() => loadSurveys(true))

  async function loadSurveys(silent = false) {
    if (!silent) setLoading(true)
    try {
      // Don't filter by status - let backend handle it
      // Backend will show ACTIVE surveys to regular users, all surveys to admin
      const result = await surveyApi.getSurveys({})
      if (result.success && result.data) {
        console.log('[Surveys] Loaded surveys:', result.data)
        // Normalize question fields for compatibility
        const normalizedSurveys = (Array.isArray(result.data) ? result.data : []).map(survey => ({
          ...survey,
          questions: (survey.questions || []).map((q: any) => ({
            ...q,
            id: q.id || `q-${Math.random()}`,
            text: q.text || q.questionText,
            type: q.type || q.questionType,
            required: q.required !== undefined ? q.required : q.isRequired
          }))
        }))
        console.log('[Surveys] Normalized surveys:', normalizedSurveys)
        setSurveys(normalizedSurveys)
      } else {
        console.error('[Surveys] Load failed:', result.error)
      }
    } catch (err) {
      console.error('[Surveys] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!selectedSurvey) return
    setSubmitting(true)
    setSubmitResult(null)

    const answerArray = selectedSurvey.questions.map((q: SurveyQuestion, index: number) => {
      const questionId = q.id || `q-${index}`
      return {
        questionId: questionId,
        answer: answers[questionId] || ''
      }
    })

    console.log('[Surveys] Submitting answers:', answerArray)

    try {
      const result = await surveyApi.submitResponse(selectedSurvey.id, answerArray)
      if (result.success) {
        setSubmitResult('success')
        // Update survey list to mark as responded
        setSurveys(prev => prev.map(s => 
          s.id === selectedSurvey.id ? { ...s, hasResponded: true } : s
        ))
        // Reload surveys to get updated data
        setTimeout(() => {
          loadSurveys(true)
          setSelectedSurvey(null)
          setAnswers({})
          setSubmitResult(null)
        }, 2000)
      } else {
        setSubmitResult(result.error || 'Có lỗi xảy ra')
      }
    } catch (err) {
      console.error('[Surveys] Submit error:', err)
      setSubmitResult('Không thể gửi khảo sát')
    } finally {
      setSubmitting(false)
    }
  }

  // Survey detail / answer view
  if (selectedSurvey) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', paddingBottom: 100 }}>
        {/* Header with back button */}
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%)', padding: '16px', color: '#fff', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setSelectedSurvey(null); setAnswers({}); setSubmitResult(null) }}
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              ←
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Chi tiết khảo sát</h1>
          </div>
        </div>

        {/* Survey Info Card */}
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>{selectedSurvey.title}</h2>
            
            {selectedSurvey.description && (
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #8b5cf6' }}>
                {selectedSurvey.description}
              </p>
            )}

            {/* Survey metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Thời gian bắt đầu</p>
                  <p style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{formatDate(selectedSurvey.startDate)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⏰</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Thời gian kết thúc</p>
                  <p style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{formatDate(selectedSurvey.endDate)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Điểm thưởng</p>
                  <p style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>+{selectedSurvey.pointsReward} điểm</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📝</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Số câu hỏi</p>
                  <p style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{selectedSurvey.questions?.length || 0} câu hỏi</p>
                </div>
              </div>

              {selectedSurvey.creator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>👤</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Người tạo</p>
                    <p style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{selectedSurvey.creator.fullName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedSurvey.hasResponded ? (
            <div style={{ padding: 24, textAlign: 'center', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Bạn đã hoàn thành khảo sát này</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>Cảm ơn bạn đã tham gia!</p>
            </div>
          ) : (
            <>
              {submitResult === 'success' ? (
                <div style={{ padding: 24, textAlign: 'center', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>🎉</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Gửi khảo sát thành công!</h3>
                  <p style={{ color: '#64748b', fontSize: 14 }}>+{selectedSurvey.pointsReward} điểm</p>
                </div>
              ) : (
                <>
                  {/* Questions section header */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 4, height: 20, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', borderRadius: 2 }}></span>
                      Câu hỏi khảo sát
                    </h3>
                  </div>

                  {selectedSurvey.questions && selectedSurvey.questions.length > 0 ? (
                    selectedSurvey.questions.map((q: SurveyQuestion, index: number) => {
                      const questionText = q.text || q.questionText || ''
                      const questionType = q.type || q.questionType || 'TEXT'
                      const isRequired = q.required !== undefined ? q.required : q.isRequired
                      const questionId = q.id || `q-${index}`
                      
                      return (
                        <div key={questionId} style={{ marginBottom: 16, padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6', minWidth: 24 }}>{index + 1}.</span>
                            <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 15, flex: 1, lineHeight: 1.5 }}>
                              {questionText} {isRequired && <span style={{ color: '#ef4444', fontSize: 16 }}>*</span>}
                            </p>
                          </div>

                          {questionType === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 32 }}>
                              {q.options.map((opt, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: answers[questionId] === opt ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)' : '#f8fafc', borderRadius: 10, cursor: 'pointer', border: answers[questionId] === opt ? '2px solid #8b5cf6' : '1.5px solid #e2e8f0', transition: 'all 0.2s' }}>
                                  <input type="radio" name={questionId} checked={answers[questionId] === opt}
                                    onChange={() => setAnswers(prev => ({ ...prev, [questionId]: opt }))}
                                    style={{ accentColor: '#8b5cf6', width: 18, height: 18 }} />
                                  <span style={{ fontSize: 14, color: '#334155', flex: 1 }}>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {questionType === 'TEXT' && (
                            <div style={{ marginLeft: 32 }}>
                              <textarea
                                placeholder="Nhập câu trả lời của bạn..."
                                value={answers[questionId] || ''}
                                onChange={e => setAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                                style={{ width: '100%', padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, minHeight: 100, resize: 'vertical', backgroundColor: '#f8fafc', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              />
                            </div>
                          )}

                          {questionType === 'RATING' && (
                            <div style={{ display: 'flex', gap: 10, marginLeft: 32, justifyContent: 'center', padding: '8px 0' }}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setAnswers(prev => ({ ...prev, [questionId]: n }))}
                                  style={{ width: 48, height: 48, borderRadius: '50%', border: answers[questionId] === n ? '2.5px solid #8b5cf6' : '1.5px solid #cbd5e1', background: answers[questionId] === n ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#fff', color: answers[questionId] === n ? '#fff' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 17, transition: 'all 0.2s', boxShadow: answers[questionId] === n ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none' }}>
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}

                          {questionType === 'YES_NO' && (
                            <div style={{ display: 'flex', gap: 12, marginLeft: 32 }}>
                              {['Có', 'Không'].map(opt => (
                                <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [questionId]: opt }))}
                                  style={{ flex: 1, padding: '14px 0', borderRadius: 10, border: answers[questionId] === opt ? '2px solid #8b5cf6' : '1.5px solid #cbd5e1', background: answers[questionId] === opt ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)' : '#fff', color: answers[questionId] === opt ? '#8b5cf6' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s' }}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                      <p style={{ color: '#64748b', fontSize: 14 }}>Khảo sát này chưa có câu hỏi nào</p>
                    </div>
                  )}

                  {submitResult && submitResult !== 'success' && (
                    <div style={{ padding: 14, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: 12, color: '#dc2626', marginBottom: 16, fontSize: 14, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>⚠️</span>
                      <span>{submitResult}</span>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={submitting || !selectedSurvey.questions || selectedSurvey.questions.length === 0}
                    style={{ width: '100%', padding: '16px 0', background: submitting ? '#a78bfa' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: (submitting || !selectedSurvey.questions || selectedSurvey.questions.length === 0) ? 'not-allowed' : 'pointer', opacity: (submitting || !selectedSurvey.questions || selectedSurvey.questions.length === 0) ? 0.6 : 1, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', transition: 'all 0.2s' }}>
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
                        Đang gửi...
                      </span>
                    ) : 'Gửi khảo sát'}
                  </button>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Survey list view
  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%)', padding: '24px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ←
            </button>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Khảo sát</h1>
        </div>
        <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Tham gia khảo sát để nhận điểm thưởng</p>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Đang tải...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px' }}>📋</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginTop: 12 }}>Chưa có khảo sát nào</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Các khảo sát mới sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {surveys.map(survey => (
              <button key={survey.id} onClick={() => setSelectedSurvey(survey)}
                style={{ width: '100%', textAlign: 'left', padding: 16, background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', flex: 1 }}>{survey.title}</h3>
                  {survey.hasResponded ? (
                    <span style={{ fontSize: 12, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>Đã trả lời</span>
                  ) : (
                    <span style={{ fontSize: 12, padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa trả lời</span>
                  )}
                </div>
                {survey.description && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>{survey.description}</p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    📝 {survey._count?.questions || 0} câu hỏi
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    👥 {survey._count?.responses || 0} lượt trả lời
                  </span>
                  <span style={{ fontSize: 12, color: '#f59e0b' }}>
                    ⭐ +{survey.pointsReward} điểm
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
