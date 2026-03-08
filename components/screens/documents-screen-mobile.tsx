"use client"

import { useState, useEffect, useCallback } from "react"
import { documentApi } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { BACKEND_URL } from "@/lib/config"

// ===== CONSTANTS =====
const DOC_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  CIRCULAR:    { label: 'Thông tư',          color: '#0284c7', bg: '#e0f2fe', icon: '📋' },
  DECISION:    { label: 'Quyết định',         color: '#7c3aed', bg: '#ede9fe', icon: '⚖️' },
  DIRECTIVE:   { label: 'Chỉ thị',            color: '#dc2626', bg: '#fee2e2', icon: '📢' },
  INSTRUCTION: { label: 'Hướng dẫn',          color: '#059669', bg: '#d1fae5', icon: '📌' },
  REGULATION:  { label: 'Quy định',           color: '#d97706', bg: '#fef3c7', icon: '📜' },
  NOTICE:      { label: 'Thông báo',          color: '#0891b2', bg: '#cffafe', icon: '🔔' },
  LETTER:      { label: 'Công văn',           color: '#4f46e5', bg: '#e0e7ff', icon: '✉️' },
  GUIDELINE:   { label: 'Tài liệu hướng dẫn', color: '#0d9488', bg: '#ccfbf1', icon: '📚' },
  FORM:        { label: 'Mẫu biểu',           color: '#db2777', bg: '#fce7f3', icon: '📝' },
  OTHER:       { label: 'Khác',               color: '#64748b', bg: '#f1f5f9', icon: '📄' },
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: 'Đã ban hành', color: '#065f46', bg: '#d1fae5' },
  ARCHIVED:  { label: 'Lưu trữ',    color: '#374151', bg: '#f3f4f6' },
  EXPIRED:   { label: 'Hết hiệu lực', color: '#9a3412', bg: '#ffedd5' },
  DRAFT:     { label: 'Nháp',        color: '#1e40af', bg: '#dbeafe' },
}

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const formatFileSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const isNewDoc = (doc: any) => {
  const date = new Date(doc.issuedDate || doc.createdAt || 0)
  return (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000
}

interface DocumentsScreenMobileProps {
  initialDocumentId?: string
  onDocumentOpened?: () => void
}

export default function DocumentsScreenMobile({ initialDocumentId, onDocumentOpened }: DocumentsScreenMobileProps = {}) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' })
  const [detailLoading, setDetailLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [togglingFav, setTogglingFav] = useState(false)
  const [docPage, setDocPage] = useState(1)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }, [])

  const loadDocuments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await documentApi.getDocuments({ limit: 100 })
      if (result.success && result.data) {
        let docs: any[] = []
        if (Array.isArray(result.data)) docs = result.data
        else if ((result.data as any).data) docs = (result.data as any).data
        else if ((result.data as any).documents) docs = (result.data as any).documents
        setDocuments(docs)
      }
    } catch { /* silent */ }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // Auto-refresh: poll every 30s + refresh on visibility/focus (same as other screens)
  useAutoRefresh(() => loadDocuments(true))

  // Deep-link: open specific document from notification
  useEffect(() => {
    if (!initialDocumentId || documents.length === 0) return
    const doc = documents.find(d => d.id === initialDocumentId)
    if (doc) { openDetail(doc); onDocumentOpened?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocumentId, documents])

  // Reset trang khi đổi bộ lọc, tìm kiếm, sắp xếp
  useEffect(() => { setDocPage(1) }, [activeTab, searchText, sortBy])

  // ===== OPEN DETAIL (increments viewCount via API) =====
  const openDetail = async (doc: any) => {
    setSelectedDoc(doc)
    setDetailLoading(true)
    try {
      const res = await documentApi.getDocument(doc.id)
      if (res.success && res.data) {
        setSelectedDoc(res.data)
        // Update in list too
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, viewCount: (res.data as any).viewCount } : d))
      }
    } catch { /* use cached */ }
    finally { setDetailLoading(false) }
  }

  // ===== TOGGLE FAVORITE =====
  const toggleFavorite = async (doc: any, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (togglingFav) return
    setTogglingFav(true)
    const prev = doc.isFavorited
    // Optimistic
    setDocuments(d => d.map(x => x.id === doc.id ? { ...x, isFavorited: !prev } : x))
    if (selectedDoc?.id === doc.id) setSelectedDoc((s: any) => s ? { ...s, isFavorited: !prev } : s)
    try {
      const res = await documentApi.toggleFavorite(doc.id)
      if (!res.success) throw new Error()
      showToast(prev ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích', 'success')
    } catch {
      // Revert
      setDocuments(d => d.map(x => x.id === doc.id ? { ...x, isFavorited: prev } : x))
      if (selectedDoc?.id === doc.id) setSelectedDoc((s: any) => s ? { ...s, isFavorited: prev } : s)
      showToast('Không thể cập nhật yêu thích', 'error')
    } finally { setTogglingFav(false) }
  }

  // ===== DOWNLOAD =====
  const handleDownload = async (doc: any) => {
    if (!doc.fileUrl && !doc.fileName) { showToast('Tài liệu không có file đính kèm', 'info'); return }
    setDownloading(true)
    try {
      const res = await documentApi.downloadDocument(doc.id)
      if (res.success && (res.data as any)?.fileUrl) {
        const relativeUrl: string = (res.data as any).fileUrl
        const fileName: string = (res.data as any).fileName || doc.fileName || 'document'
        // Ghép BACKEND_URL nếu là đường dẫn tương đối (/uploads/...)
        const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `${BACKEND_URL}${relativeUrl}`
        // Dùng thẻ <a download> để ép trình duyệt/app tải file thay vì mở
        const a = document.createElement('a')
        a.href = fullUrl
        a.download = fileName
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        showToast(`Đang tải: ${fileName}`, 'success')
        setDocuments(d => d.map(x => x.id === doc.id ? { ...x, downloadCount: (x.downloadCount || 0) + 1 } : x))
        if (selectedDoc?.id === doc.id) setSelectedDoc((s: any) => s ? { ...s, downloadCount: (s.downloadCount || 0) + 1 } : s)
      } else {
        showToast('Không thể tải file này', 'error')
      }
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setDownloading(false) }
  }

  // ===== FILTER + SORT =====
  const filteredDocs = documents
    .filter(doc => {
      if (activeTab === 'favorites') return doc.isFavorited
      if (activeTab !== 'all') return doc.documentType === activeTab
      return true
    })
    .filter(doc => {
      if (!searchText) return true
      const s = searchText.toLowerCase()
      return (doc.title || '').toLowerCase().includes(s) ||
             (doc.documentNumber || '').toLowerCase().includes(s) ||
             (doc.description || '').toLowerCase().includes(s) ||
             (doc.issuer || '').toLowerCase().includes(s)
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0)
      return new Date(b.issuedDate || b.createdAt || 0).getTime() - new Date(a.issuedDate || a.createdAt || 0).getTime()
    })

  const DOC_ITEMS_PER_PAGE = 5
  const totalDocPages = Math.ceil(filteredDocs.length / DOC_ITEMS_PER_PAGE)
  const safeDocPage = Math.min(docPage, Math.max(1, totalDocPages))
  const paginatedDocs = filteredDocs.slice((safeDocPage - 1) * DOC_ITEMS_PER_PAGE, safeDocPage * DOC_ITEMS_PER_PAGE)

  const typeCounts = documents.reduce<Record<string, number>>((acc, d) => { acc[d.documentType] = (acc[d.documentType] || 0) + 1; return acc }, {})
  const favCount = documents.filter(d => d.isFavorited).length

  const toastBg = toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6'
  const toastIcon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'

  // ===== LOADING =====
  if (loading) return (
    <div style={{ backgroundColor: '#f0f4ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '4px solid #bfdbfe', borderTopColor: '#0284c7', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Đang tải tài liệu...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )

  // ===== DETAIL VIEW =====
  if (selectedDoc) {
    const typeInfo = DOC_TYPES[selectedDoc.documentType] || DOC_TYPES.OTHER
    const statusInfo = STATUS_LABELS[selectedDoc.status] || STATUS_LABELS.PUBLISHED
    return (
      <div style={{ backgroundColor: '#eff6ff', minHeight: '100%', paddingBottom: '32px', animation: 'fadeIn 0.2s ease' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

        {/* Toast */}
        {toast.show && (
          <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: toastBg, color: '#fff', padding: '11px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease', minWidth: '220px', justifyContent: 'center' }}>
            <span>{toastIcon}</span><span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}cc 100%)`, padding: '16px 16px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSelectedDoc(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Chi tiết văn bản</div>
              <div style={{ fontSize: '15px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDoc.title}</div>
            </div>
            <button onClick={() => toggleFavorite(selectedDoc)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selectedDoc.isFavorited ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {/* Type + Status badges */}
        <div style={{ backgroundColor: 'white', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, backgroundColor: typeInfo.bg, color: typeInfo.color }}>{typeInfo.icon} {typeInfo.label}</span>
          <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, backgroundColor: statusInfo.bg, color: statusInfo.color }}>● {statusInfo.label}</span>
          {detailLoading && <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>⏳ Đang tải...</span>}
        </div>

        {/* Meta card */}
        <div style={{ margin: '12px 16px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          {selectedDoc.documentNumber && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Số hiệu</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedDoc.documentNumber}</span>
            </div>
          )}
          {selectedDoc.issuer && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Cơ quan ban hành</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{selectedDoc.issuer}</span>
            </div>
          )}
          {selectedDoc.issuedDate && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Ngày ban hành</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{formatDate(selectedDoc.issuedDate)}</span>
            </div>
          )}
          {selectedDoc.effectiveDate && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Hiệu lực từ</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{formatDate(selectedDoc.effectiveDate)}</span>
            </div>
          )}
          {selectedDoc.expiryDate && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Hết hiệu lực</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>{formatDate(selectedDoc.expiryDate)}</span>
            </div>
          )}
          <div style={{ padding: '10px 16px', display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>{selectedDoc.viewCount || 0}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Lượt xem</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>{selectedDoc.downloadCount || 0}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tải xuống</div>
            </div>
            {selectedDoc.author && (
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDoc.author.fullName}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Người đăng</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {selectedDoc.description && (
          <div style={{ margin: '0 16px 12px', backgroundColor: 'white', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Mô tả</div>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{selectedDoc.description}</p>
          </div>
        )}

        {/* Content */}
        {selectedDoc.content && (
          <div style={{ margin: '0 16px 12px', backgroundColor: 'white', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Nội dung</div>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedDoc.content}</div>
          </div>
        )}

        {/* Tags */}
        {selectedDoc.tags && (
          <div style={{ margin: '0 16px 12px', backgroundColor: 'white', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Từ khoá</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedDoc.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                <span key={tag} style={{ padding: '4px 12px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '99px', fontSize: '12px', fontWeight: 500 }}>🏷️ {tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ margin: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(selectedDoc.fileUrl || selectedDoc.fileName) ? (
            <button
              onClick={() => handleDownload(selectedDoc)}
              disabled={downloading}
              style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', fontSize: '15px', fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)', opacity: downloading ? 0.8 : 1 }}>
              {downloading ? '⏳ Đang tải xuống...' : `📥 Tải xuống ${selectedDoc.fileName ? `(${selectedDoc.fileName.split('.').pop()?.toUpperCase()})` : 'văn bản'}`}
            </button>
          ) : (
            <button disabled style={{ width: '100%', padding: '13px', borderRadius: '14px', border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              📎 Chưa có file đính kèm
            </button>
          )}
          <button onClick={() => toggleFavorite(selectedDoc)}
            style={{ width: '100%', padding: '13px', borderRadius: '14px', border: `2px solid ${selectedDoc.isFavorited ? '#fecdd3' : '#e2e8f0'}`, backgroundColor: selectedDoc.isFavorited ? '#fff1f2' : 'white', color: selectedDoc.isFavorited ? '#dc2626' : '#64748b', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {selectedDoc.isFavorited ? '❤️ Đã yêu thích' : '🤍 Thêm vào yêu thích'}
          </button>
        </div>
      </div>
    )
  }

  // ===== MAIN LIST VIEW =====
  return (
    <div style={{ backgroundColor: '#eff6ff', minHeight: '100%', paddingBottom: '32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} input[placeholder]::placeholder{color:#94a3b8} input::placeholder{color:#94a3b8}`}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: toastBg, color: '#fff', padding: '11px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease', minWidth: '220px', justifyContent: 'center' }}>
          <span>{toastIcon}</span><span>{toast.message}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #3b82f6 100%)', padding: '20px 16px 24px', color: 'white', position: 'sticky', top: 0, zIndex: 10, overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -10, left: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.2px', margin: 0 }}>📂 Tài liệu</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: '3px 0 0' }}>Kho văn bản, quy định & hướng dẫn</p>
          </div>
          <button onClick={() => loadDocuments(true)} style={{ padding: '7px 12px', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>🔄 Tải lại</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{documents.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Văn bản</div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{favCount}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Yêu thích</div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{Object.keys(typeCounts).length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Loại</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: '14px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', zIndex: 1 }}>🔍</span>
          <input type="text" placeholder="Tìm kiếm văn bản, số hiệu, cơ quan..." value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%', padding: '13px 40px 13px 44px', borderRadius: '14px', border: '2px solid transparent', backgroundColor: 'white', color: '#0f172a', fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }} />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── TYPE FILTER TABS ── */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', padding: '10px 12px', gap: '8px', width: 'max-content' }}>
          {[
            { key: 'all', label: 'Tất cả', count: documents.length, icon: '📂', color: '#0284c7', bg: '#e0f2fe' },
            { key: 'favorites', label: 'Yêu thích', count: favCount, icon: '❤️', color: '#dc2626', bg: '#fee2e2' },
            ...Object.entries(DOC_TYPES)
              .filter(([k]) => typeCounts[k] > 0)
              .map(([k, v]) => ({ key: k, label: v.label, count: typeCounts[k] || 0, icon: v.icon, color: v.color, bg: v.bg }))
          ].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '20px', border: isActive ? `1.5px solid ${tab.color}` : '1.5px solid #e2e8f0', backgroundColor: isActive ? tab.bg : 'white', color: isActive ? tab.color : '#64748b', fontSize: '13px', fontWeight: isActive ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && <span style={{ backgroundColor: isActive ? tab.color : '#e2e8f0', color: isActive ? 'white' : '#64748b', borderRadius: '99px', fontSize: '10px', fontWeight: 700, padding: '1px 6px', minWidth: '16px', textAlign: 'center' }}>{tab.count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SORT BAR ── */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginRight: '4px' }}>Sắp xếp:</span>
        {[{ key: 'newest', label: '📅 Mới nhất' }, { key: 'popular', label: '🔥 Xem nhiều' }].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key as any)}
            style={{ padding: '5px 12px', borderRadius: '8px', border: sortBy === s.key ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0', backgroundColor: sortBy === s.key ? '#e0f2fe' : 'white', color: sortBy === s.key ? '#0284c7' : '#64748b', fontSize: '12px', fontWeight: sortBy === s.key ? 700 : 500, cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{filteredDocs.length} văn bản</span>
      </div>

      {/* ── LIST ── */}
      {filteredDocs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 16px' }}>
          <span style={{ fontSize: '52px', display: 'block', marginBottom: '14px' }}>{activeTab === 'favorites' ? '❤️' : '📄'}</span>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{activeTab === 'favorites' ? 'Chưa có văn bản yêu thích' : 'Không tìm thấy văn bản'}</p>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>{activeTab === 'favorites' ? 'Nhấn ❤️ trên văn bản để thêm vào đây' : 'Thử thay đổi bộ lọc hoặc từ khóa'}</p>
        </div>
      ) : (
        <div style={{ padding: '10px 0 20px' }}>
          {paginatedDocs.map((doc, idx) => {
            const typeInfo = DOC_TYPES[doc.documentType] || DOC_TYPES.OTHER
            const statusInfo = STATUS_LABELS[doc.status] || STATUS_LABELS.PUBLISHED
            return (
              <div key={doc.id} onClick={() => openDetail(doc)}
                style={{ margin: '0 16px 10px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', cursor: 'pointer', animation: 'fadeIn 0.2s ease', animationDelay: `${idx * 0.03}s`, animationFillMode: 'both' }}>
                {/* Color accent top line */}
                <div style={{ height: '3px', background: `linear-gradient(90deg, ${typeInfo.color}, ${typeInfo.color}80)` }} />
                <div style={{ padding: '13px 14px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, backgroundColor: typeInfo.bg, color: typeInfo.color }}>{typeInfo.icon} {typeInfo.label}</span>
                      <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: statusInfo.bg, color: statusInfo.color }}>● {statusInfo.label}</span>
                      {isNewDoc(doc) && <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>🆕 Mới</span>}
                      {doc.isNotificationSent && <span style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ede9fe', color: '#7c3aed' }}>📢 Đã thông báo</span>}
                    </div>
                    <button onClick={(e) => toggleFavorite(doc, e)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: doc.isFavorited ? '#fff1f2' : '#f8fafc', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '8px' }}>
                      {doc.isFavorited ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Doc number */}
                  {doc.documentNumber && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px', fontWeight: 500 }}>Số: {doc.documentNumber}</p>}

                  {/* Title */}
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.title}</h3>

                  {/* Description */}
                  {doc.description && <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.description}</p>}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                      {doc.issuedDate && <span>📅 {formatDate(doc.issuedDate)}</span>}
                      <span>👁️ {doc.viewCount || 0}</span>
                      {doc.fileUrl && <span style={{ color: typeInfo.color, fontWeight: 600 }}>📥 Có file</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: typeInfo.color, fontWeight: 600 }}>Xem →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== PHÂN TRANG ===== */}
      {totalDocPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 16px 16px' }}>
          <button onClick={() => setDocPage(p => Math.max(1, p - 1))} disabled={safeDocPage <= 1}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeDocPage <= 1 ? '#f8fafc' : 'white', color: safeDocPage <= 1 ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeDocPage <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Trước
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', minWidth: 90, textAlign: 'center' }}>
            Trang {safeDocPage} / {totalDocPages}
          </span>
          <button onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))} disabled={safeDocPage >= totalDocPages}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: safeDocPage >= totalDocPages ? '#f8fafc' : 'white', color: safeDocPage >= totalDocPages ? '#cbd5e1' : '#1e293b', fontSize: 13, fontWeight: 600, cursor: safeDocPage >= totalDocPages ? 'not-allowed' : 'pointer' }}>
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
