"use client"

import { useState, useEffect } from "react"
import { Trophy, ArrowLeft, Clock, Award, TrendingUp, Crown, Medal } from "lucide-react"
import { pointsApi, getStoredUser } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"

interface LeaderboardUser {
  id: string
  fullName: string
  points: number
  rank: string
  unitName: string
}

interface PointsHistoryItem {
  id: string
  action: string
  points: number
  reason: string
  type: string
  date: string
  activityName?: string
}

function getRankLabel(rank: string) {
  switch (rank) {
    case 'XUAT_SAC': return { label: 'Xuất sắc', emoji: '🏆', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }
    case 'KHA': return { label: 'Khá', emoji: '🥈', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' }
    case 'TRUNG_BINH': return { label: 'Trung bình', emoji: '🥉', bg: '#fef9c3', color: '#854d0e', border: '#fde68a' }
    case 'YEU': return { label: 'Yếu', emoji: '📉', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
    default: return { label: 'Chưa xếp hạng', emoji: '—', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
  }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PointsDashboard({ onBack }: { onBack?: () => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const currentUser = getStoredUser()
  const myPoints = currentUser?.points || 0
  const myRank = myPoints >= 800 ? 'XUAT_SAC' : myPoints >= 600 ? 'KHA' : myPoints >= 400 ? 'TRUNG_BINH' : 'YEU'
  const myRankInfo = getRankLabel(myRank)
  const myPosition = leaderboard.findIndex(u => u.id === currentUser?.id) + 1

  useEffect(() => { loadData() }, [])
  useAutoRefresh(() => loadData(true))

  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    try {
      const [leaderboardRes, historyRes] = await Promise.all([
        pointsApi.getLeaderboard({ sortBy: 'points', sortOrder: 'desc' }),
        pointsApi.getHistory({ userId: currentUser?.id, limit: 10 }),
      ])
      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data)
        if ((leaderboardRes as any).stats) setStats((leaderboardRes as any).stats)
      }
      if (historyRes.success && historyRes.data) setHistory(historyRes.data)
    } catch (err) {
      console.error('[Points] Error:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const nextTarget = myRank === 'YEU' ? 400 : myRank === 'TRUNG_BINH' ? 600 : myRank === 'KHA' ? 800 : 1000
  const prevTarget = myRank === 'YEU' ? 0 : myRank === 'TRUNG_BINH' ? 400 : myRank === 'KHA' ? 600 : 800
  const progressPct = myRank === 'XUAT_SAC' ? 100 : Math.min(100, ((myPoints - prevTarget) / (nextTarget - prevTarget)) * 100)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: '📊' },
    { id: 'leaderboard', label: 'Xếp hạng', icon: '🏆' },
    { id: 'achievements', label: 'Thành tích', icon: '🎯' },
  ]

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f5f6fa', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        padding: '14px 14px 16px', color: '#fff',
        borderRadius: '0 0 18px 18px',
        boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '10px', padding: '6px', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowLeft style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          <h1 style={{ fontSize: '17px', fontWeight: 700, flex: 1, margin: 0 }}>Điểm rèn luyện</h1>
        </div>

        {/* Score Card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '12px',
          padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
          }}>
            {myRankInfo.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1 }}>{myPoints}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>điểm hiện tại</div>
            <div style={{
              display: 'inline-block', marginTop: '3px', padding: '2px 8px',
              backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px',
              fontSize: '10px', fontWeight: 600,
            }}>
              {myRankInfo.label}
            </div>
          </div>
          {myPosition > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '22px', fontWeight: 800 }}>#{myPosition}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>xếp hạng</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {myRank !== 'XUAT_SAC' && (
          <div style={{ marginTop: '10px', padding: '0 2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
              <span>Tiến đến {getRankLabel(myRank === 'YEU' ? 'TRUNG_BINH' : myRank === 'TRUNG_BINH' ? 'KHA' : 'XUAT_SAC').label}</span>
              <span>{myPoints}/{nextTarget}</span>
            </div>
            <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#fff', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding: '10px 12px 0' }}>
        <div style={{
          display: 'flex', backgroundColor: '#fff', borderRadius: '10px',
          padding: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gap: '3px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                backgroundColor: activeTab === tab.id ? '#f59e0b' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#6b7280',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
              }}
            >
              <span style={{ fontSize: '12px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '10px 12px' }}>
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb' }}>{stats.avgPoints || 0}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Điểm TB toàn đoàn</div>
                </div>
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{stats.excellentCount || 0}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Đoàn viên xuất sắc</div>
                </div>
              </div>
            )}

            {/* Recent History */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Clock style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Lịch sử điểm gần đây</span>
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af' }}>
                  <Clock style={{ width: '28px', height: '28px', margin: '0 auto 6px', opacity: 0.3 }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>Chưa có lịch sử điểm</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {history.slice(0, 5).map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: '10px',
                      border: '1px solid #f3f4f6',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.reason}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {new Date(item.date).toLocaleDateString('vi-VN')}
                          </span>
                          {item.activityName && (
                            <span style={{
                              fontSize: '10px', padding: '1px 6px', backgroundColor: '#eff6ff',
                              color: '#2563eb', borderRadius: '8px', border: '1px solid #bfdbfe',
                            }}>
                              {item.activityName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        padding: '2px 8px', borderRadius: '14px', fontWeight: 700, fontSize: '12px',
                        backgroundColor: item.action === 'add' ? '#dcfce7' : '#fef2f2',
                        color: item.action === 'add' ? '#166534' : '#991b1b',
                        border: `1px solid ${item.action === 'add' ? '#bbf7d0' : '#fecaca'}`,
                        whiteSpace: 'nowrap', marginLeft: '8px',
                      }}>
                        {item.action === 'add' ? '+' : '-'}{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scoring Rules */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Award style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Quy định xếp loại</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {[
                  { label: '≥ 800 điểm: Xuất sắc', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
                  { label: '≥ 600 điểm: Khá', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
                  { label: '≥ 400 điểm: Trung bình', bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
                  { label: '< 400 điểm: Yếu', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
                ].map((rule, i) => (
                  <div key={i} style={{
                    padding: '7px 10px', backgroundColor: rule.bg, borderRadius: '8px',
                    border: `1px solid ${rule.border}`, fontSize: '12px', fontWeight: 600, color: rule.color,
                  }}>
                    {rule.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === LEADERBOARD TAB === */}
        {activeTab === 'leaderboard' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Trophy style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Bảng xếp hạng đoàn viên</span>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af' }}>
                <Trophy style={{ width: '28px', height: '28px', margin: '0 auto 6px', opacity: 0.3 }} />
                <p style={{ fontSize: '12px', margin: 0 }}>Chưa có dữ liệu xếp hạng</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {leaderboard.slice(0, 20).map((user, index) => {
                  const rankInfo = getRankLabel(user.rank)
                  const isMe = user.id === currentUser?.id
                  const isTop3 = index < 3
                  const medalColors = ['#f59e0b', '#9ca3af', '#b45309']
                  return (
                    <div key={user.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      borderRadius: '10px', transition: 'all 0.2s',
                      backgroundColor: isTop3 ? '#fffbeb' : isMe ? '#eff6ff' : '#f9fafb',
                      border: `1px solid ${isTop3 ? '#fde68a' : isMe ? '#bfdbfe' : '#f3f4f6'}`,
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                        backgroundColor: isTop3 ? medalColors[index] : '#e5e7eb',
                        color: isTop3 ? '#fff' : '#6b7280', flexShrink: 0,
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: isTop3 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '11px', color: isTop3 ? '#fff' : '#6b7280', flexShrink: 0,
                      }}>
                        {getInitials(user.fullName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.fullName} {isMe && <span style={{ color: '#2563eb' }}>(Bạn)</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>{user.unitName}</span>
                          <span style={{
                            fontSize: '9px', padding: '1px 5px', borderRadius: '8px',
                            backgroundColor: rankInfo.bg, color: rankInfo.color,
                            border: `1px solid ${rankInfo.border}`, fontWeight: 600,
                          }}>
                            {rankInfo.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: isTop3 ? '#d97706' : '#111827' }}>{user.points}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>điểm</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* === ACHIEVEMENTS TAB === */}
        {activeTab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb' }}>{myPoints}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Điểm hiện tại</div>
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{history.length}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Lần thay đổi</div>
              </div>
            </div>

            {/* Current Rank */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Award style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Xếp loại hiện tại</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: '10px',
                border: '1px solid #fde68a',
              }}>
                <div style={{ fontSize: '28px' }}>{myRankInfo.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{myRankInfo.label}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>Điểm hiện tại: {myPoints}</div>
                  {myRank !== 'XUAT_SAC' && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>
                        <span>Tiến độ đến mức tiếp theo</span>
                        <span>{myPoints}/{nextTarget}</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${progressPct}%`, borderRadius: '3px',
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full History */}
            {history.length > 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <TrendingUp style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Lịch sử thay đổi điểm</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {history.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', backgroundColor: '#f9fafb', borderRadius: '8px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{item.reason}</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '6px' }}>
                          {new Date(item.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: 700, marginLeft: '6px', whiteSpace: 'nowrap',
                        color: item.action === 'add' ? '#16a34a' : '#dc2626',
                      }}>
                        {item.action === 'add' ? '+' : '-'}{item.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}




