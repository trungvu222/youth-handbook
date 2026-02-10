"use client"

import { useState, useEffect } from "react"
import { surveyApi } from "@/lib/api"

interface SurveyQuestion {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'YES_NO'
  options?: string[]
  required?: boolean
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

  async function loadSurveys() {
    setLoading(true)
    try {
      const result = await surveyApi.getSurveys({ status: 'ACTIVE' })
      if (result.success && result.data) {
        setSurveys(Array.isArray(result.data) ? result.data : [])
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

    const answerArray = selectedSurvey.questions.map((q: SurveyQuestion) => ({
      questionId: q.id,
      answer: answers[q.id] || ''
    }))

    try {
      const result = await surveyApi.submitResponse(selectedSurvey.id, answerArray)
      if (result.success) {
        setSubmitResult('success')
        // Update survey list to mark as responded
        setSurveys(prev => prev.map(s => 
          s.id === selectedSurvey.id ? { ...s, hasResponded: true } : s
        ))
        setTimeout(() => {
          setSelectedSurvey(null)
          setAnswers({})
          setSubmitResult(null)
        }, 2000)
      } else {
        setSubmitResult(result.error || 'Có lỗi xảy ra')
      }
    } catch (err) {
      setSubmitResult('Không thể gửi khảo sát')
    } finally {
      setSubmitting(false)
    }
  }

  // Survey detail / answer view
  if (selectedSurvey) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100%', paddingBottom: 100 }}>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', padding: '20px 16px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setSelectedSurvey(null); setAnswers({}); setSubmitResult(null) }}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
              ← Quay lại
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>{selectedSurvey.title}</h1>
          </div>
          {selectedSurvey.description && (
            <p style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>{selectedSurvey.description}</p>
          )}
        </div>

        {selectedSurvey.hasResponded ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#16a34a' }}>Bạn đã hoàn thành khảo sát này</h3>
            <p style={{ color: '#6b7280', marginTop: 8 }}>Cảm ơn bạn đã tham gia!</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {submitResult === 'success' ? (
              <div style={{ padding: 20, textAlign: 'center', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#16a34a' }}>Gửi khảo sát thành công!</h3>
                <p style={{ color: '#6b7280', marginTop: 8 }}>+{selectedSurvey.pointsReward} điểm</p>
              </div>
            ) : (
              <>
                {selectedSurvey.questions.map((q: SurveyQuestion, index: number) => (
                  <div key={q.id || index} style={{ marginBottom: 20, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <p style={{ fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
                      {index + 1}. {q.text} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </p>

                    {q.type === 'MULTIPLE_CHOICE' && q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: answers[q.id] === opt ? '#ede9fe' : '#f9fafb', borderRadius: 8, cursor: 'pointer', border: answers[q.id] === opt ? '2px solid #7c3aed' : '1px solid #e5e7eb' }}>
                            <input type="radio" name={q.id} checked={answers[q.id] === opt}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              style={{ accentColor: '#7c3aed' }} />
                            <span style={{ fontSize: 14 }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'TEXT' && (
                      <textarea
                        placeholder="Nhập câu trả lời..."
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, minHeight: 80, resize: 'vertical' }}
                      />
                    )}

                    {q.type === 'RATING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: n }))}
                            style={{ width: 44, height: 44, borderRadius: '50%', border: answers[q.id] === n ? '2px solid #7c3aed' : '1px solid #d1d5db', background: answers[q.id] === n ? '#7c3aed' : '#fff', color: answers[q.id] === n ? '#fff' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'YES_NO' && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        {['Có', 'Không'].map(opt => (
                          <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: answers[q.id] === opt ? '2px solid #7c3aed' : '1px solid #d1d5db', background: answers[q.id] === opt ? '#ede9fe' : '#fff', color: answers[q.id] === opt ? '#7c3aed' : '#374151', fontWeight: 600, cursor: 'pointer' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {submitResult && submitResult !== 'success' && (
                  <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, color: '#dc2626', marginBottom: 12, fontSize: 14 }}>
                    {submitResult}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={submitting}
                  style={{ width: '100%', padding: '14px 0', background: submitting ? '#a78bfa' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: submitting ? 'default' : 'pointer' }}>
                  {submitting ? 'Đang gửi...' : 'Gửi khảo sát'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Survey list view
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
              ← Quay lại
            </button>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Khảo sát</h1>
        </div>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>Tham gia khảo sát để nhận điểm thưởng</p>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32 }}>⏳</div>
            <p style={{ color: '#6b7280', marginTop: 8 }}>Đang tải...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48 }}>📋</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginTop: 12 }}>Chưa có khảo sát nào</h3>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>Các khảo sát mới sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {surveys.map(survey => (
              <button key={survey.id} onClick={() => setSelectedSurvey(survey)}
                style={{ width: '100%', textAlign: 'left', padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', flex: 1 }}>{survey.title}</h3>
                  {survey.hasResponded ? (
                    <span style={{ fontSize: 12, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>Đã trả lời</span>
                  ) : (
                    <span style={{ fontSize: 12, padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa trả lời</span>
                  )}
                </div>
                {survey.description && (
                  <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{survey.description}</p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    📝 {survey._count?.questions || 0} câu hỏi
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
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
