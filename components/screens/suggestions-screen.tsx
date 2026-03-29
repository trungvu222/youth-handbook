'use client'

import { useState, useEffect } from 'react'
import { suggestionApi } from '../../lib/api'
import { SuggestionForm } from '../suggestions/suggestion-form'
import { SuggestionDetail } from '../suggestions/suggestion-detail'
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  Send,
  ChevronRight
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Suggestion {
  id: string
  title: string
  content: string
  category: 'IMPROVEMENT' | 'COMPLAINT' | 'IDEA' | 'QUESTION' | 'OTHER'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  isAnonymous: boolean
  userId?: string
  fileUrls?: string[]
  tags?: string
  submittedAt: string
  resolvedAt?: string
  user?: {
    id: string
    fullName: string
    unitName?: string
  }
  responses?: number | any[]  // Can be count (number) or array of responses
  viewCount: number
}

const CATEGORY_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  IMPROVEMENT: { label: 'Cải tiến',  color: '#2563eb', bg: '#dbeafe', icon: <AlertTriangle style={{ width: 12, height: 12 }} /> },
  COMPLAINT:   { label: 'Phản ánh', color: '#dc2626', bg: '#fee2e2', icon: <XCircle style={{ width: 12, height: 12 }} /> },
  IDEA:        { label: 'Ý tưởng',  color: '#059669', bg: '#dcfce7', icon: <Lightbulb style={{ width: 12, height: 12 }} /> },
  QUESTION:    { label: 'Thắc mắc', color: '#d97706', bg: '#fef3c7', icon: <MessageSquare style={{ width: 12, height: 12 }} /> },
  OTHER:       { label: 'Khác',     color: '#64748b', bg: '#f1f5f9', icon: <FileText style={{ width: 12, height: 12 }} /> },
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  SUBMITTED:    { label: 'Đã gửi',      color: '#64748b', bg: '#f1f5f9', dotColor: '#94a3b8' },
  UNDER_REVIEW: { label: 'Đang xét',    color: '#d97706', bg: '#fef3c7', dotColor: '#f59e0b' },
  IN_PROGRESS:  { label: 'Đang xử lý',  color: '#2563eb', bg: '#dbeafe', dotColor: '#3b82f6' },
  RESOLVED:     { label: 'Đã giải quyết', color: '#059669', bg: '#dcfce7', dotColor: '#10b981' },
  REJECTED:     { label: 'Từ chối',     color: '#dc2626', bg: '#fee2e2', dotColor: '#ef4444' },
}

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: 'Khẩn cấp',  color: '#dc2626', bg: '#fee2e2' },
  HIGH:   { label: 'Cao',       color: '#f59e0b', bg: '#fef3c7' },
  MEDIUM: { label: 'Trung bình', color: '#3b82f6', bg: '#dbeafe' },
  LOW:    { label: 'Thấp',      color: '#64748b', bg: '#f1f5f9' },
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

function EmptyState({ icon, title, description, actionLabel, onAction }: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
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
      <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: actionLabel ? 20 : 0 }}>{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #4338ca, #6366f1)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(67,56,202,0.35)'
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Initial load
  useEffect(() => {
    loadData(false, false)
  }, [])

  // Reload when filters change
  useEffect(() => {
    if (!initialLoadDone) return
    
    const timeoutId = setTimeout(() => {
      loadData(false, false)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [activeTab, searchTerm, categoryFilter, statusFilter, initialLoadDone])

  const loadData = async (isRefresh = false, silent = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('[Suggestions] Loading data, tab:', activeTab)

      if (activeTab === 'my') {
        const response = await suggestionApi.getMySuggestions()
        console.log('[Suggestions] My suggestions response:', response)
        if (response.success && response.data) {
          console.log('[Suggestions] Setting my suggestions:', response.data.length, 'items')
          setMySuggestions(response.data)
        } else {
          console.error('[Suggestions] Failed to load my suggestions:', response.error)
          if (!silent) {
            toast({
              title: 'Lỗi',
              description: response.error || 'Không thể tải kiến nghị của bạn',
              variant: 'destructive'
            })
          }
        }
      } else {
        const params: any = {}
        if (searchTerm) params.search = searchTerm
        if (categoryFilter !== 'all') params.category = categoryFilter
        if (statusFilter !== 'all') params.status = statusFilter
        params.limit = 50

        const response = await suggestionApi.getSuggestions(params)
        console.log('[Suggestions] All suggestions response:', response)
        if (response.success && response.data) {
          const suggestions = response.data.data || response.data
          console.log('[Suggestions] Setting all suggestions:', suggestions.length, 'items')
          setSuggestions(suggestions)
        } else {
          console.error('[Suggestions] Failed to load suggestions:', response.error)
          if (!silent) {
            toast({
              title: 'Lỗi',
              description: response.error || 'Không thể tải danh sách kiến nghị',
              variant: 'destructive'
            })
          }
        }
      }
      
      setInitialLoadDone(true)
    } catch (error) {
      console.error('Error loading suggestions:', error)
      if (!silent) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách kiến nghị',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSuggestionCreated = async () => {
    setShowCreateForm(false)
    // Switch to "My" tab to show the newly created suggestion
    setActiveTab('my')
    // Reload data immediately
    await loadData(true, false)
    toast({
      title: 'Thành công',
      description: 'Đã gửi kiến nghị thành công'
    })
  }

  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
  }

  const handleBackFromDetail = () => {
    setSelectedSuggestion(null)
    // Reload data when coming back from detail view
    loadData(true, true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentSuggestions = activeTab === 'my' ? mySuggestions : suggestions
  const TABS = [
    { id: 'all' as const, label: 'Tất cả', icon: MessageSquare, badge: suggestions.length },
    { id: 'my' as const, label: 'Của tôi', icon: FileText, badge: mySuggestions.length },
  ]

  if (showCreateForm) {
    return (
      <SuggestionForm
        onComplete={handleSuggestionCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  if (selectedSuggestion) {
    return (
      <SuggestionDetail
        suggestion={selectedSuggestion}
        onBack={handleBackFromDetail}
        onUpdate={() => loadData(true, false)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f5f3ff', paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes spin     { to   { transform:rotate(360deg); } }
        .suggestion-card  { transition: box-shadow 0.2s ease, transform 0.15s ease; }
        .suggestion-card:active { transform: scale(0.985); }
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
              <MessageSquare style={{ width:22, height:22, color:'#fbbf24' }} />
            </div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, fontWeight:500, marginBottom:2 }}>ĐOÀN TNCS HỒ CHÍ MINH</div>
              <div style={{ color:'#fff', fontSize:18, fontWeight:800, lineHeight:1.2 }}>Kiến nghị cá nhân</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => loadData(true)}
              style={{
                width:38, height:38, borderRadius:12, border:'none',
                background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <RefreshCw style={{ width:16, height:16, color:'#fff', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                height:38, borderRadius:12, border:'none', padding: '0 16px',
                background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)',
                cursor:'pointer', display:'flex', alignItems:'center', gap: 6,
                fontWeight: 700, fontSize: 14, color: '#4338ca'
              }}
            >
              <Plus style={{ width:16, height:16 }} />
              Gửi góp ý
            </button>
          </div>
        </div>

        {/* Glassmorphism stats strip */}
        <div style={{
          position:'relative', zIndex:1,
          background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)', borderRadius:18,
          padding:'14px 8px', display:'flex', justifyContent:'space-around', alignItems:'center'
        }}>
          {[
            { label:'Tất cả',    value: loading ? '—' : suggestions.length,        color:'#fff' },
            { label:'Của tôi',   value: loading ? '—' : mySuggestions.length,      color:'#86efac' },
            { label:'Đã xử lý',  value: loading ? '—' : suggestions.filter(s => s.status === 'RESOLVED').length, color:'#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center' }}>
              {i > 0 && <div style={{ width:1, height:36, background:'rgba(255,255,255,0.15)', marginRight: 0 }} />}
              <div style={{ textAlign:'center', flex:1 }}>
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
              {tab.badge > 0 && (
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

      {/* ── SEARCH & FILTERS ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Search style={{ width: 18, height: 18, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm kiến nghị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, color: '#1e293b'
              }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:14, WebkitOverflowScrolling:'touch' as any }}>
          {/* Category filters */}
          <button
            className="filter-chip"
            onClick={() => setCategoryFilter('all')}
            style={{
              flexShrink:0, padding:'7px 14px', borderRadius:20, border:'none',
              fontSize:12, fontWeight: categoryFilter === 'all' ? 700 : 500, cursor:'pointer',
              background: categoryFilter === 'all' ? 'linear-gradient(135deg, #4338ca, #6366f1)' : '#fff',
              color: categoryFilter === 'all' ? '#fff' : '#64748b',
              boxShadow: categoryFilter === 'all' ? '0 3px 10px rgba(67,56,202,0.3)' : '0 1px 4px rgba(0,0,0,0.07)'
            }}
          >
            Tất cả
          </button>
          {Object.entries(CATEGORY_CFG).map(([key, cfg]) => (
            <button
              key={key}
              className="filter-chip"
              onClick={() => setCategoryFilter(key)}
              style={{
                flexShrink:0, padding:'7px 14px', borderRadius:20, border:'none',
                fontSize:12, fontWeight: categoryFilter === key ? 700 : 500, cursor:'pointer',
                background: categoryFilter === key ? cfg.bg : '#fff',
                color: categoryFilter === key ? cfg.color : '#64748b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              {cfg.icon}
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:14, WebkitOverflowScrolling:'touch' as any }}>
          <button
            className="filter-chip"
            onClick={() => setStatusFilter('all')}
            style={{
              flexShrink:0, padding:'6px 12px', borderRadius:16, border:'none',
              fontSize:11, fontWeight: statusFilter === 'all' ? 700 : 500, cursor:'pointer',
              background: statusFilter === 'all' ? '#f1f5f9' : 'transparent',
              color: statusFilter === 'all' ? '#475569' : '#94a3b8',
              border: '1px solid ' + (statusFilter === 'all' ? '#cbd5e1' : 'transparent')
            }}
          >
            Tất cả
          </button>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <button
              key={key}
              className="filter-chip"
              onClick={() => setStatusFilter(key)}
              style={{
                flexShrink:0, padding:'6px 12px', borderRadius:16,
                fontSize:11, fontWeight: statusFilter === key ? 700 : 500, cursor:'pointer',
                background: statusFilter === key ? cfg.bg : 'transparent',
                color: statusFilter === key ? cfg.color : '#94a3b8',
                border: '1px solid ' + (statusFilter === key ? cfg.dotColor : 'transparent'),
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              {statusFilter === key && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: cfg.dotColor,
                  display: 'inline-block'
                }} />
              )}
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding:'0 16px' }}>
        {loading ? <LoadingSpinner /> : currentSuggestions.length === 0 ? (
          <EmptyState
            icon={<MessageSquare style={{ width:44, height:44, color:'#818cf8' }} />}
            title={activeTab === 'my' ? 'Chưa có kiến nghị' : 'Không tìm thấy'}
            description={activeTab === 'my'
              ? 'Bạn chưa gửi kiến nghị nào. Hãy chia sẻ ý kiến của bạn!'
              : 'Không tìm thấy kiến nghị phù hợp với bộ lọc.'
            }
            actionLabel={activeTab === 'my' ? 'Gửi kiến nghị đầu tiên' : undefined}
            onAction={activeTab === 'my' ? () => setShowCreateForm(true) : undefined}
          />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {currentSuggestions.map((suggestion, idx) => {
              const categoryCfg = CATEGORY_CFG[suggestion.category]
              const statusCfg = STATUS_CFG[suggestion.status]
              const priorityCfg = PRIORITY_CFG[suggestion.priority]

              return (
                <div
                  key={suggestion.id}
                  className="suggestion-card"
                  onClick={() => handleViewSuggestion(suggestion)}
                  style={{
                    background: '#fff', borderRadius: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    overflow: 'hidden', cursor: 'pointer',
                    animation: 'fadeInUp 0.35s ease both', animationDelay: `${idx * 0.05}s`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Colored left bar */}
                    <div style={{
                      width: 4, flexShrink: 0,
                      background: `linear-gradient(180deg, ${categoryCfg.color}, ${categoryCfg.color}88)`
                    }} />
                    <div style={{ flex: 1, padding: '14px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: categoryCfg.bg, color: categoryCfg.color,
                          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600
                        }}>
                          {categoryCfg.icon}
                          {categoryCfg.label}
                        </span>

                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: statusCfg.bg, color: statusCfg.color,
                          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: statusCfg.dotColor,
                            display: 'inline-block'
                          }} />
                          {statusCfg.label}
                        </span>

                        {suggestion.priority !== 'LOW' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            background: priorityCfg.bg, color: priorityCfg.color,
                            borderRadius: 16, padding: '2px 8px', fontSize: 10, fontWeight: 700
                          }}>
                            {priorityCfg.label}
                          </span>
                        )}

                        {suggestion.isAnonymous && (
                          <span style={{
                            background: '#f1f5f9', color: '#64748b',
                            borderRadius: 16, padding: '2px 8px', fontSize: 10, fontWeight: 600
                          }}>
                            Ẩn danh
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{
                        color: '#0f172a', fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {suggestion.title}
                      </h3>

                      {/* Content preview */}
                      <p style={{
                        color: '#64748b', fontSize: 13, marginBottom: 10, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {suggestion.content}
                      </p>

                      {/* Meta info - Simple text display */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#64748b', marginTop: 8 }}>
                        {/* Response count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare style={{ width: 16, height: 16 }} />
                          <span>{typeof suggestion.responses === 'number' ? suggestion.responses : (Array.isArray(suggestion.responses) ? suggestion.responses.length : 0)} phản hồi</span>
                        </div>

                        {/* Created date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock style={{ width: 16, height: 16 }} />
                          <span>{new Date(suggestion.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {suggestion.tags && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {suggestion.tags.split(',').slice(0, 3).map((tag, i) => (
                            <span key={i} style={{
                              background: '#f8fafc', color: '#64748b',
                              borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 500
                            }}>
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}






