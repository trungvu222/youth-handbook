'use client'

import { useState, useEffect } from 'react'
import { ratingApi } from '../../lib/api'
import {
  ArrowLeft, CheckCircle, Star, Trophy,
  AlertTriangle, Info, Calendar, Send, Shield
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface RatingCriteria {
  id: string
  name: string
  description: string
  isRequired: boolean
}

interface RatingPeriod {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  criteria: RatingCriteria[]
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

interface SelfRatingFormProps {
  period: RatingPeriod
  onComplete: () => void
  onCancel: () => void
}

const RATING_CFG: Record<string, { label: string; color: string; bg: string; border: string; gradient: string; desc: string }> = {
  EXCELLENT: { label: 'Hoàn thành xuất sắc', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', desc: 'Xuất sắc' },
  GOOD:      { label: 'Hoàn thành tốt',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', gradient: 'linear-gradient(135deg,#2563eb,#3b82f6)', desc: 'Khá' },
  AVERAGE:   { label: 'Hoàn thành nhiệm vụ',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', gradient: 'linear-gradient(135deg,#059669,#10b981)', desc: 'Trung bình' },
  POOR:      { label: 'Không hoàn thành',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', gradient: 'linear-gradient(135deg,#dc2626,#ef4444)', desc: 'Yếu' },
}

export function SelfRatingForm({ period, onComplete, onCancel }: SelfRatingFormProps) {
  const [criteriaResponses, setCriteriaResponses] = useState<Record<string, string>>({})
  const [selfAssessment, setSelfAssessment] = useState('')
  const [suggestedRating, setSuggestedRating] = useState<'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'>('GOOD')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingRating, setExistingRating] = useState<any>(null)

  useEffect(() => { loadExistingRating() }, [period.id])

  const loadExistingRating = async () => {
    try {
      setLoading(true)
      const response = await ratingApi.getMyRating(period.id)
      if (response.success && response.data) {
        const rating = response.data
        setExistingRating(rating)

        // Load criteria responses as text
        const map: Record<string, string> = {}
        rating.criteriaResponses?.forEach((r: any) => {
          map[r.criteriaId] = r.response || ''
        })
        setCriteriaResponses(map)
        setSelfAssessment(rating.selfAssessment || '')
        setSuggestedRating(rating.suggestedRating || 'GOOD')
      }
    } catch (e) {
      console.error('Error loading existing rating:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCriteriaResponseChange = (criteriaId: string, response: string) => {
    setCriteriaResponses(prev => ({
      ...prev,
      [criteriaId]: response
    }))
  }

  const handleSubmit = async () => {
    // Check required criteria have responses
    const missingRequired = period.criteria.filter(c => c.isRequired && !criteriaResponses[c.id]?.trim())
    if (missingRequired.length > 0) {
      toast({
        title: 'Thiếu câu trả lời bắt buộc',
        description: `Vui lòng điền câu trả lời cho: ${missingRequired.map(c => c.name).join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    if (!selfAssessment.trim()) {
      toast({
        title: 'Thiếu kết luận tự đánh giá',
        description: 'Vui lòng nhập kết luận tự đánh giá của bạn',
        variant: 'destructive'
      })
      return
    }

    try {
      setSubmitting(true)
      const ratingData = {
        periodId: period.id,
        criteriaResponses: period.criteria.map(c => ({
          criteriaId: c.id,
          response: criteriaResponses[c.id] || ''
        })),
        selfAssessment: selfAssessment.trim(),
        suggestedRating: suggestedRating
      }
      const response = existingRating?.status === 'DRAFT'
        ? await ratingApi.updateRating(existingRating.id, ratingData)
        : await ratingApi.submitRating(ratingData)

      if (response.success) onComplete()
      else toast({ title: 'Lỗi', description: response.error || 'Không thể gửi đánh giá', variant: 'destructive' })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể gửi đánh giá', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) {
    return (
      <div style={{
        minHeight: '100%', background: '#f8faff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: '3px solid #e0e7ff', borderTopColor: '#4338ca',
          animation: 'spin 0.75s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Đang tải biểu mẫu...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#f8faff', paddingBottom: 100 }}>
      <style>{`
        @keyframes spin     { to   { transform: rotate(360deg); } }
        @keyframes slideIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        .c-card  { transition: border-color .2s, box-shadow .2s; }
        .c-card:active { transform: scale(0.995); }
        .note-btn { transition: background .15s, color .15s; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(150deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)',
        paddingTop: 'calc(env(safe-area-inset-top,0px) + 14px)',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 24,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Back */}
          <button onClick={onCancel} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10, padding: '6px 12px', color: '#c7d2fe',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 18
          }}>
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Quay lại
          </button>

          {/* Title block */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield style={{ width: 20, height: 20, color: '#a5b4fc' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
                TỰ XẾP LOẠI CHẤT LƯỢNG
              </p>
              <h1 style={{
                color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {period.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Calendar style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.45)' }} />
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                  {formatDate(period.startDate)} – {formatDate(period.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ padding: '20px 16px 0' }}>

        {/* ── 1. BANNERS ── */}
        {existingRating?.status === 'NEEDS_REVISION' && existingRating?.adminNotes && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
            padding: '12px 14px', display: 'flex', gap: 10, marginBottom: 12, animation: 'fadeIn 0.3s ease'
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Cần chỉnh sửa:</p>
              <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{existingRating.adminNotes}</p>
            </div>
          </div>
        )}

        {period.description && (
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14,
            padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12
          }}>
            <Info style={{ width: 15, height: 15, color: '#2563eb', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#1d4ed8', lineHeight: 1.5 }}>{period.description}</p>
          </div>
        )}

        {/* ── 2. CRITERIA ── */}
        <div style={{ marginBottom: 16 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#4338ca,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Các tiêu chí đánh giá</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Trả lời câu hỏi cho từng tiêu chí</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {period.criteria.map((criteria, index) => {
              const responseVal = criteriaResponses[criteria.id] || ''

              return (
                <div
                  key={criteria.id}
                  className="c-card"
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: responseVal ? '1.5px solid #bfdbfe' : '1.5px solid #f1f5f9',
                    boxShadow: responseVal ? '0 2px 12px rgba(37,99,235,0.08)' : '0 1px 6px rgba(0,0,0,0.05)',
                    padding: '16px',
                    animation: 'slideIn 0.35s ease both',
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  {/* Criteria header */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                      {/* Index badge */}
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: responseVal ? '#dbeafe' : '#f1f5f9',
                        color: responseVal ? '#2563eb' : '#94a3b8',
                        fontSize: 11, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, flex: 1 }}>
                        {criteria.name}
                      </span>
                      {criteria.isRequired && (
                        <span style={{
                          background: '#fee2e2', color: '#dc2626',
                          borderRadius: 6, padding: '2px 7px',
                          fontSize: 10, fontWeight: 700, flexShrink: 0
                        }}>
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginLeft: 29 }}>
                      {criteria.description}
                    </p>
                  </div>

                  {/* Response textarea */}
                  <div style={{ marginLeft: 0 }}>
                    <textarea
                      placeholder="Nhập câu trả lời của bạn..."
                      value={responseVal}
                      onChange={e => handleCriteriaResponseChange(criteria.id, e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        padding: '10px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit',
                        resize: 'vertical', outline: 'none', background: '#f8fafc',
                        boxSizing: 'border-box', lineHeight: 1.5, transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. SELF ASSESSMENT (Kết luận) ── */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: '16px',
          border: '1.5px solid #f1f5f9',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          marginBottom: 14,
          animation: 'slideIn 0.35s ease 0.15s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Star style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Kết luận tự đánh giá</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Bắt buộc — Tổng kết đánh giá của bạn</p>
            </div>
          </div>
          <textarea
            placeholder="Nhập kết luận tự đánh giá tổng quan của bạn về chất lượng thực hiện nhiệm vụ trong kỳ này..."
            value={selfAssessment}
            onChange={e => setSelfAssessment(e.target.value)}
            rows={4}
            style={{
              width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0',
              padding: '10px 12px', fontSize: 14, color: '#0f172a', fontFamily: 'inherit',
              resize: 'vertical', outline: 'none', background: '#f8fafc',
              boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color 0.2s'
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
            onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
          <p style={{ textAlign: 'right', fontSize: 11, marginTop: 5, color: selfAssessment.length > 480 ? '#ef4444' : '#94a3b8' }}>
            {selfAssessment.length}/500
          </p>
        </div>

        {/* ── 4. CHOOSE RATING ── */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: '16px',
          border: '1.5px solid #f1f5f9',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          marginBottom: 14,
          animation: 'slideIn 0.35s ease 0.2s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trophy style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Xếp loại đề xuất</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Chọn mức xếp loại bạn cho là phù hợp</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'] as const).map((rating, idx) => {
              const cfg = RATING_CFG[rating]
              const selected = suggestedRating === rating
              return (
                <button
                  key={rating}
                  onClick={() => setSuggestedRating(rating)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    border: selected ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
                    background: selected ? cfg.bg : '#fff',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s ease',
                    animation: 'fadeIn 0.3s ease both',
                    animationDelay: `${idx * 0.05}s`
                  }}
                  onMouseEnter={e => {
                    if (!selected) e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={e => {
                    if (!selected) e.currentTarget.style.background = '#fff'
                  }}
                >
                  {/* Radio button */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selected ? cfg.color : '#cbd5e1'}`,
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {selected && (
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: cfg.gradient
                      }} />
                    )}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: selected ? cfg.gradient : cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <Trophy style={{ width: 18, height: 18, color: selected ? '#fff' : cfg.color }} />
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{
                      fontSize: 15, fontWeight: 700,
                      color: selected ? cfg.color : '#0f172a',
                      marginBottom: 2, lineHeight: 1.2
                    }}>
                      {cfg.label}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>
                      {cfg.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 5. DISCLAIMER ── */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
          animation: 'fadeIn 0.4s ease 0.2s both'
        }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#d97706', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            Đây là xếp loại <strong>tự đề xuất</strong>. Kết quả chính thức sẽ do Admin/Lãnh đạo xét duyệt.
          </p>
        </div>

        {/* ── 6. ACTIONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'slideIn 0.35s ease 0.25s both' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: 16, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#4338ca,#6366f1)',
              color: '#fff', fontSize: 15, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(67,56,202,0.35)',
              transition: 'opacity 0.2s, transform 0.15s'
            }}
          >
            {submitting
              ? <>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.75s linear infinite' }} />
                  Đang gửi...
                </>
              : <><Send style={{ width: 16, height: 16 }} />Gửi đánh giá</>
            }
          </button>

          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              width: '100%', padding: '13px', borderRadius: 16,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Huỷ bỏ
          </button>
        </div>

      </div>
    </div>
  )
}
