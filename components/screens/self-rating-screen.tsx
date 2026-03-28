'use client'

import { useState, useEffect } from 'react'
import { ratingApi } from '../../lib/api'
import { SelfRatingForm } from '../rating/self-rating-form'
import {
  Trophy, Calendar, TrendingUp, Star, Clock, CheckCircle,
  XCircle, AlertCircle, RefreshCw, BarChart2, ChevronRight,
  Award, Trash2, FileText, Target, Zap
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface RatingPeriod {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  criteria: { id: string; name: string; description: string; isRequired: boolean }[]
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  targetAudience: 'ALL' | 'UNIT_SPECIFIC' | 'ROLE_SPECIFIC'
  totalSubmissions?: number
}

interface SelfRating {
  id: string
  periodId: string
  userId: string
  suggestedRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'
  selfAssessment?: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  finalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'
  adminNotes?: string
  pointsAwarded?: number
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  period: { id: string; title: string }
}

const RATING_CFG: Record<string, { label: string; short: string; color: string; bg: string; gradient: string }> = {
  EXCELLENT: { label: 'Hoàn thành xuất sắc', short: 'Xuất sắc', color: '#7c3aed', bg: '#f5f3ff', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  GOOD:      { label: 'Hoàn thành tốt',       short: 'Khá',      color: '#2563eb', bg: '#eff6ff', gradient: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
  AVERAGE:   { label: 'Hoàn thành nhiệm vụ',  short: 'TB',       color: '#059669', bg: '#ecfdf5', gradient: 'linear-gradient(135deg,#059669,#10b981)' },
  POOR:      { label: 'Không hoàn thành',     short: 'Yếu',      color: '#dc2626', bg: '#fff1f1', gradient: 'linear-gradient(135deg,#dc2626,#ef4444)' },
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Bản nháp',  color: '#64748b', bg: '#f1f5f9', icon: <FileText style={{ width: 12, height: 12 }} /> },
  SUBMITTED:      { label: 'Đã gửi',   color: '#2563eb', bg: '#dbeafe', icon: <Clock style={{ width: 12, height: 12 }} /> },
  APPROVED:       { label: 'Đã duyệt', color: '#059669', bg: '#dcfce7', icon: <CheckCircle style={{ width: 12, height: 12 }} /> },
  REJECTED:       { label: 'Từ chối',  color: '#dc2626', bg: '#fee2e2', icon: <XCircle style={{ width: 12, height: 12 }} /> },
  NEEDS_REVISION: { label: 'Cần sửa',  color: '#d97706', bg: '#fef3c7', icon: <AlertCircle style={{ width: 12, height: 12 }} /> },
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(67,56,202,0.15)', borderTopColor: '#4338ca',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Đang tải...</p>
    </div>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '36px 24px', textAlign: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)', animation: 'fadeIn 0.4s ease'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        {icon}
      </div>
      <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</p>
      <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

function PeriodCard({
  period, timeStatus, myRating, hasSubmitted, canStart, needsRevision, onStart, formatDate, idx
}: {
  period: RatingPeriod; timeStatus: 'NOT_STARTED' | 'ONGOING' | 'ENDED'; myRating?: SelfRating; hasSubmitted: boolean
  canStart: boolean; needsRevision: boolean; onStart: () => void; formatDate: (d: string) => string; idx: number
}) {
  const isActive = timeStatus === 'ONGOING'
  const isEnded = timeStatus === 'ENDED'
  const accentColor = isActive ? '#4338ca' : isEnded ? '#ef4444' : '#94a3b8'

  // Cấu hình màu sắc và text cho từng trạng thái
  const statusConfig = {
    NOT_STARTED: { bg: '#f1f5f9', color: '#64748b', dotColor: '#94a3b8', label: 'Chưa bắt đầu' },
    ONGOING: { bg: '#dcfce7', color: '#15803d', dotColor: '#22c55e', label: 'Đang diễn ra' },
    ENDED: { bg: '#fee2e2', color: '#dc2626', dotColor: '#ef4444', label: 'Đã kết thúc' }
  }

  const statusStyle = statusConfig[timeStatus]

  return (
    <div
      className="period-card"
      style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: isActive ? '0 4px 20px rgba(67,56,202,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        opacity: !isActive ? 0.75 : 1,
        animationDelay: `${idx * 0.06}s`, animation: 'fadeInUp 0.4s ease both',
        border: isActive ? '1px solid rgba(67,56,202,0.1)' : '1px solid #f1f5f9'
      }}
    >
      {/* Accent top stripe */}
      <div style={{
        height: 4,
        background: isActive
          ? 'linear-gradient(90deg, #4338ca, #6366f1, #818cf8)'
          : 'linear-gradient(90deg, #cbd5e1, #e2e8f0)'
      }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {/* Period status */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: statusStyle.bg,
            color: statusStyle.color,
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: statusStyle.dotColor,
              display: 'inline-block'
            }} />
            {statusStyle.label}
          </span>

          {/* My submission status */}
          {myRating && STATUS_CFG[myRating.status] && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: STATUS_CFG[myRating.status].bg,
              color: STATUS_CFG[myRating.status].color,
              borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600
            }}>
              {STATUS_CFG[myRating.status].icon}
              {STATUS_CFG[myRating.status].label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, marginBottom: 8, lineHeight: 1.4 }}>
          {period.title}
        </h3>

        {period.description && (
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 10, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {period.description}
          </p>
        )}

        {/* Info chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#475569'
          }}>
            <Calendar style={{ width: 12, height: 12, color: accentColor }} />
            {formatDate(period.startDate)} – {formatDate(period.endDate)}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#475569'
          }}>
            <Target style={{ width: 12, height: 12, color: accentColor }} />
            {period.criteria?.length || 0} tiêu chí
          </span>
          {(period.totalSubmissions || 0) > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#475569'
            }}>
              <Award style={{ width: 12, height: 12, color: accentColor }} />
              {period.totalSubmissions} người đã gửi
            </span>
          )}
        </div>

        {/* Final result if approved */}
        {myRating?.finalRating && RATING_CFG[myRating.finalRating] && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
            background: RATING_CFG[myRating.finalRating].bg,
            borderRadius: 12, padding: '10px 14px'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: RATING_CFG[myRating.finalRating].gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Trophy style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>Kết quả xếp loại</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: RATING_CFG[myRating.finalRating].color }}>
                {RATING_CFG[myRating.finalRating].label}
                {myRating.pointsAwarded ? ` · +${myRating.pointsAwarded} điểm` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Admin notes if rejected */}
        {myRating?.adminNotes && myRating.status === 'REJECTED' && (
          <div style={{
            background: '#fff1f1', border: '1px solid #fecaca',
            borderRadius: 10, padding: '10px 12px', marginBottom: 14
          }}>
            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 2 }}>Ghi chú từ ban quản trị:</p>
            <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>{myRating.adminNotes}</p>
          </div>
        )}

        {/* CTA Button */}
        {canStart && (
          <button
            onClick={onStart}
            style={{
              width: '100%', padding: '12px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(67,56,202,0.35)',
              transition: 'opacity 0.2s'
            }}
          >
            <Zap style={{ width: 16, height: 16 }} />
            Bắt đầu xếp loại
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        )}

        {needsRevision && (
          <button
            onClick={onStart}
            style={{
              width: '100%', padding: '12px', borderRadius: 14, border: '2px solid #d97706',
              background: '#fffbeb', color: '#d97706', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <AlertCircle style={{ width: 16, height: 16 }} />
            Chỉnh sửa đánh giá
          </button>
        )}

        {hasSubmitted && !needsRevision && !myRating?.finalRating && (
          <div style={{
            textAlign: 'center', padding: '10px', background: '#f0fdf4',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <CheckCircle style={{ width: 16, height: 16, color: '#16a34a' }} />
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Đã gửi — đang chờ xét duyệt</span>
          </div>
        )}

        {!isActive && !hasSubmitted && !isEnded && (
          <div style={{
            textAlign: 'center', padding: '10px', background: '#f8fafc',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <Clock style={{ width: 16, height: 16, color: '#94a3b8' }} />
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Chưa trong thời gian xếp loại</span>
          </div>
        )}

        {isEnded && !hasSubmitted && (
          <div style={{
            textAlign: 'center', padding: '10px', background: '#fff1f1',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <XCircle style={{ width: 16, height: 16, color: '#dc2626' }} />
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Kỳ xếp loại đã kết thúc</span>
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryCard({ rating, onDelete, formatDate, idx }: {
  rating: SelfRating; onDelete: (id: string) => void; formatDate: (d: string) => string; idx: number
}) {
  const statusCfg = STATUS_CFG[rating.status]
  const finalCfg = rating.finalRating ? RATING_CFG[rating.finalRating] : null
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      animation: 'fadeInUp 0.35s ease both', animationDelay: `${idx * 0.05}s`
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Colored left bar */}
        <div style={{
          width: 4, flexShrink: 0,
          background: finalCfg ? finalCfg.gradient : statusCfg ? `linear-gradient(180deg, ${statusCfg.color}, ${statusCfg.color}88)` : '#e2e8f0'
        }} />
        <div style={{ flex: 1, padding: '14px 14px 14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>
                {rating.period.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: statusCfg?.bg, color: statusCfg?.color,
                  borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 600
                }}>
                  {statusCfg?.icon}
                  {statusCfg?.label}
                </span>
                {finalCfg && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: finalCfg.bg, color: finalCfg.color,
                    borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 700
                  }}>
                    <Trophy style={{ width: 11, height: 11 }} />
                    {finalCfg.short}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {rating.pointsAwarded ? (
                <div style={{
                  background: 'linear-gradient(135deg, #4338ca, #818cf8)',
                  color: '#fff', borderRadius: 10, padding: '4px 10px',
                  fontSize: 13, fontWeight: 800
                }}>
                  +{rating.pointsAwarded}đ
                </div>
              ) : null}
              <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                {rating.submittedAt ? formatDate(rating.submittedAt) : formatDate(rating.createdAt)}
              </p>
            </div>
          </div>
          {rating.adminNotes && (
            <p style={{
              marginTop: 8, fontSize: 12, color: '#64748b',
              background: '#f8fafc', borderRadius: 8, padding: '6px 10px', lineHeight: 1.5
            }}>
              💬 {rating.adminNotes}
            </p>
          )}
          {rating.status === 'DRAFT' && (
            <button
              onClick={() => onDelete(rating.id)}
              style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#fff1f1', border: 'none', borderRadius: 8, padding: '5px 10px',
                color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              Xóa bản nháp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatsTab({ stats }: { stats: any }) {
  const distTotal = Object.values(stats.distribution || {}).reduce((a: any, b: any) => a + b, 0) as number
  const bars = [
    { key: 'EXCELLENT', label: 'Xuất sắc', color: '#7c3aed', bg: '#f5f3ff' },
    { key: 'GOOD',      label: 'Khá',      color: '#2563eb', bg: '#eff6ff' },
    { key: 'AVERAGE',   label: 'TB',       color: '#059669', bg: '#ecfdf5' },
    { key: 'POOR',      label: 'Yếu',      color: '#dc2626', bg: '#fff1f1' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.4s ease' }}>
      {/* Quick stats 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Kỳ tham gia', value: stats.totalParticipated || 0, color: '#4338ca', bg: '#ede9fe', icon: <Calendar style={{ width: 18, height: 18, color: '#4338ca' }} /> },
          { label: 'Đã duyệt',    value: stats.totalApproved || 0,     color: '#059669', bg: '#dcfce7', icon: <CheckCircle style={{ width: 18, height: 18, color: '#059669' }} /> },
          { label: 'Điểm TB',     value: Math.round((stats.avgPoints || 0) * 10) / 10, color: '#7c3aed', bg: '#f5f3ff', icon: <Star style={{ width: 18, height: 18, color: '#7c3aed' }} /> },
          { label: 'Tổng điểm',   value: stats.totalPoints || 0,       color: '#d97706', bg: '#fef3c7', icon: <Trophy style={{ width: 18, height: 18, color: '#d97706' }} /> },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 18, padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            animation: 'fadeInUp 0.4s ease both', animationDelay: `${i * 0.07}s`
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10
            }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution bars */}
      {distTotal > 0 && (
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          animation: 'fadeInUp 0.4s ease 0.28s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trophy style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Phân bổ xếp loại</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bars.map(b => {
              const count = stats.distribution?.[b.key] || 0
              const pct = distTotal > 0 ? Math.round((count / distTotal) * 100) : 0
              return (
                <div key={b.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: b.bg, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: b.color,
                      borderRadius: 99, transition: 'width 0.8s ease',
                      minWidth: pct > 0 ? 8 : 0
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent ratings */}
      {stats.recentRatings?.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          animation: 'fadeInUp 0.4s ease 0.35s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Kết quả gần đây</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recentRatings.map((r: any, i: number) => {
              const cfg = r.finalRating ? RATING_CFG[r.finalRating] : null
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: '#f8fafc', borderRadius: 12
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: cfg ? cfg.gradient : 'linear-gradient(135deg,#94a3b8,#cbd5e1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Trophy style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: '#0f172a', fontWeight: 600, fontSize: 13,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {r.period.title}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 1 }}>
                      {new Date(r.period.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {cfg && (
                      <span style={{
                        background: cfg.bg, color: cfg.color,
                        borderRadius: 10, padding: '3px 9px', fontSize: 12, fontWeight: 700
                      }}>
                        {cfg.short}
                      </span>
                    )}
                    {r.pointsAwarded > 0 && (
                      <div style={{ color: '#4338ca', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                        +{r.pointsAwarded}đ
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SelfRatingScreen() {
  const [periods, setPeriods] = useState<RatingPeriod[]>([])
  const [myRatings, setMyRatings] = useState<SelfRating[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<RatingPeriod | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'history' | 'stats'>('available')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const [periodsRes, historyRes, statsRes] = await Promise.all([
        ratingApi.getRatingPeriods('ACTIVE'),
        ratingApi.getMyRatingHistory(),
        ratingApi.getMyRatingStats()
      ])
      if (periodsRes.success && periodsRes.data) setPeriods(periodsRes.data)
      if (historyRes.success && historyRes.data) setMyRatings(historyRes.data)
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
    } catch (error) {
      console.error('Error loading rating data:', error)
      toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu xếp loại', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRatingComplete = () => {
    setSelectedPeriod(null)
    loadData(true)
    toast({ title: 'Thành công', description: 'Đã gửi đánh giá, chờ xét duyệt!' })
  }

  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản nháp này?')) return
    try {
      const response = await ratingApi.deleteRating(ratingId)
      if (response.success) {
        toast({ title: 'Đã xóa', description: 'Bản nháp đã được xóa' })
        loadData(true)
      } else {
        toast({ title: 'Lỗi', description: response.error || 'Không thể xóa', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa bản nháp', variant: 'destructive' })
    }
  }

  const isWithinPeriod = (period: RatingPeriod) => {
    const now = new Date()
    return now >= new Date(period.startDate) && now <= new Date(period.endDate)
  }

  // Xác định trạng thái hiển thị dựa vào thời gian
  const getPeriodTimeStatus = (period: RatingPeriod): 'NOT_STARTED' | 'ONGOING' | 'ENDED' => {
    const now = new Date()
    const startDate = new Date(period.startDate)
    const endDate = new Date(period.endDate)

    if (now < startDate) {
      return 'NOT_STARTED'  // Chưa bắt đầu
    } else if (now >= startDate && now <= endDate) {
      return 'ONGOING'      // Đang diễn ra
    } else {
      return 'ENDED'         // Đã kết thúc
    }
  }

  const getRatingForPeriod = (id: string) => myRatings.find(r => r.periodId === id)
  const hasSubmittedForPeriod = (id: string) =>
    myRatings.some(r => r.periodId === id && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(r.status))

  const filteredRatings = myRatings.filter(r => statusFilter === 'all' || r.status === statusFilter)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const TABS = [
    { id: 'available' as const, label: 'Kỳ xếp loại', icon: Star },
    { id: 'history'   as const, label: 'Lịch sử',     icon: TrendingUp, badge: myRatings.length },
    { id: 'stats'     as const, label: 'Thống kê',    icon: BarChart2 },
  ]

  if (selectedPeriod) {
    return (
      <SelfRatingForm
        period={selectedPeriod}
        onComplete={handleRatingComplete}
        onCancel={() => setSelectedPeriod(null)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f5f3ff', paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes spin     { to   { transform:rotate(360deg); } }
        .period-card  { transition: box-shadow 0.2s ease, transform 0.15s ease; }
        .period-card:active { transform: scale(0.985); }
        .tab-btn      { transition: all 0.2s ease; }
        .filter-chip  { transition: all 0.18s ease; }
      `}</style>

      {/* ── GRADIENT HEADER ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        paddingBottom: 56,
        paddingLeft: 20, paddingRight: 20,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:0,  left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.04)', zIndex:0 }} />
        <div style={{ position:'absolute', top:30,  left:'50%', width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.03)', zIndex:0, transform:'translateX(-50%)' }} />

        {/* Title row */}
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:46, height:46, borderRadius:15,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid rgba(255,255,255,0.2)'
            }}>
              <Trophy style={{ width:22, height:22, color:'#fbbf24' }} />
            </div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, fontWeight:500, marginBottom:2 }}>ĐOÀN TNCS HỒ CHÍ MINH</div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:800, lineHeight:1.2 }}>Xếp loại chất lượng</div>
            </div>
          </div>
          <button
            onClick={() => loadData(true)}
            style={{
              width:38, height:38, borderRadius:12, border:'none',
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            } as any}
          >
            <RefreshCw style={{ width:16, height:16, color:'#fff', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Glassmorphism stats strip */}
        <div style={{
          position:'relative', zIndex:1,
          background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)', borderRadius:18,
          padding:'14px 8px', display:'flex', justifyContent:'space-around', alignItems:'center'
        }}>
          {[
            { label:'Đang mở',   value: loading ? '—' : periods.length,             color:'#fff' },
            { label:'Đã duyệt',  value: loading ? '—' : (stats?.totalApproved || 0), color:'#86efac' },
            { label:'Tổng điểm', value: loading ? '—' : (stats?.totalPoints || 0),  color:'#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap: i < 2 ? 0 : 0 }}>
              {i > 0 && <div style={{ width:1, height:36, background:'rgba(255,255,255,0.15)', marginRight: 0 }} />}
              <div style={{ textAlign:'center', flex:1, paddingLeft: i > 0 ? 0 : 0 }}>
                <div style={{ color: s.color, fontSize:22, fontWeight:800, lineHeight:1 }}>{s.value}</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, marginTop:4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR (floating) ── */}
      <div style={{
        margin: '-18px 16px 0', position:'relative', zIndex:10,
        background:'#fff', borderRadius:18,
        boxShadow:'0 4px 24px rgba(67,56,202,0.13)',
        padding:6, display:'flex', gap:4
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              className="tab-btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                gap:5, padding:'10px 4px', borderRadius:13, border:'none', cursor:'pointer',
                fontSize:12, fontWeight: isActive ? 700 : 500,
                background: isActive ? 'linear-gradient(135deg, #4338ca, #6366f1)' : 'transparent',
                color: isActive ? '#fff' : '#94a3b8',
                boxShadow: isActive ? '0 3px 10px rgba(67,56,202,0.3)' : 'none'
              }}
            >
              <Icon style={{ width:14, height:14 }} />
              {tab.label}
              {'badge' in tab && (tab.badge || 0) > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: isActive ? '#fff' : '#475569',
                  borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding:'20px 16px 0' }}>

        {/* TAB: KỲ XẾP LOẠI */}
        {activeTab === 'available' && (
          <div>
            {loading ? <LoadingSpinner /> : periods.length === 0 ? (
              <EmptyState
                icon={<Calendar style={{ width:44, height:44, color:'#818cf8' }} />}
                title="Chưa có kỳ xếp loại"
                description="Hiện tại không có kỳ xếp loại nào đang mở. Bạn sẽ được thông báo khi có kỳ mới."
              />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {periods.map((period, idx) => {
                  const timeStatus = getPeriodTimeStatus(period)
                  const isActive = timeStatus === 'ONGOING'
                  const myRating = getRatingForPeriod(period.id)
                  const hasSubmitted = hasSubmittedForPeriod(period.id)
                  return (
                    <PeriodCard
                      key={period.id} idx={idx}
                      period={period} timeStatus={timeStatus}
                      myRating={myRating} hasSubmitted={hasSubmitted}
                      canStart={isActive && !hasSubmitted}
                      needsRevision={myRating?.status === 'NEEDS_REVISION'}
                      onStart={() => setSelectedPeriod(period)}
                      formatDate={formatDate}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: LỊCH SỬ */}
        {activeTab === 'history' && (
          <div>
            {/* Filter chips */}
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:14, WebkitOverflowScrolling:'touch' as any }}>
              {[
                { value:'all',           label:'Tất cả' },
                { value:'SUBMITTED',     label:'Đã gửi' },
                { value:'APPROVED',      label:'Đã duyệt' },
                { value:'REJECTED',      label:'Từ chối' },
                { value:'NEEDS_REVISION',label:'Cần sửa' },
                { value:'DRAFT',         label:'Bản nháp' },
              ].map(f => {
                const isActive = statusFilter === f.value
                return (
                  <button
                    key={f.value}
                    className="filter-chip"
                    onClick={() => setStatusFilter(f.value)}
                    style={{
                      flexShrink:0, padding:'7px 16px', borderRadius:20, border:'none',
                      fontSize:13, fontWeight: isActive ? 700 : 500, cursor:'pointer',
                      background: isActive ? 'linear-gradient(135deg, #4338ca, #6366f1)' : '#fff',
                      color: isActive ? '#fff' : '#64748b',
                      boxShadow: isActive ? '0 3px 10px rgba(67,56,202,0.3)' : '0 1px 4px rgba(0,0,0,0.07)'
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            {loading ? <LoadingSpinner /> : filteredRatings.length === 0 ? (
              <EmptyState
                icon={<TrendingUp style={{ width:44, height:44, color:'#818cf8' }} />}
                title="Chưa có lịch sử"
                description="Bạn chưa tham gia kỳ xếp loại nào trong danh mục này."
              />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredRatings.map((rating, idx) => (
                  <HistoryCard key={rating.id} rating={rating} onDelete={handleDeleteRating} formatDate={formatDate} idx={idx} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: THỐNG KÊ */}
        {activeTab === 'stats' && (
          loading ? <LoadingSpinner /> : stats ? (
            <StatsTab stats={stats} />
          ) : (
            <EmptyState
              icon={<BarChart2 style={{ width:44, height:44, color:'#818cf8' }} />}
              title="Chưa có thống kê"
              description="Tham gia xếp loại để xem thống kê cá nhân của bạn."
            />
          )
        )}
      </div>
    </div>
  )
}
