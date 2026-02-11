"use client"

import { useState, useEffect } from "react"

const documentTypes: Record<string, string> = {
  'CIRCULAR': 'Thông tư',
  'DECISION': 'Quyết định',
  'DIRECTIVE': 'Chỉ thị',
  'INSTRUCTION': 'Hướng dẫn',
  'REGULATION': 'Quy định',
  'NOTICE': 'Thông báo',
  'LETTER': 'Công văn',
  'GUIDELINE': 'Tài liệu hướng dẫn',
  'FORM': 'Mẫu biểu',
  'OTHER': 'Khác'
}

export default function DocumentsScreenMobile() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])

  // Load documents from API with fallback to mock data
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { documentApi } = await import('@/lib/api')
      const result: any = await documentApi.getDocuments({ limit: 50 })

      if (result.success && result.data) {
        let docsData: any[] = []
        if (Array.isArray(result.data)) {
          docsData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          docsData = result.data.data
        } else if (result.data.documents && Array.isArray(result.data.documents)) {
          docsData = result.data.documents
        }
        
        // Use API data if available, otherwise fallback to mock
        setDocuments(docsData)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
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
    background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)',
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
    cursor: 'pointer',
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

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    marginRight: '12px',
    fontSize: '16px',
    color: '#475569',
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const toggleFavorite = (docId: string) => {
    setFavorites(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: '#64748b', fontSize: '14px' }}>Đang tải tài liệu...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const filteredDocs = documents.filter(doc => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return (doc.title || '').toLowerCase().includes(search) ||
           (doc.documentNumber || '').toLowerCase().includes(search) ||
           (doc.description || '').toLowerCase().includes(search)
  })

  // Document Detail View
  if (selectedDoc) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 16px',
          backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <button style={backButtonStyle} onClick={() => setSelectedDoc(null)}>←</button>
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>Chi tiết văn bản</span>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '12px' }}>
            <span style={badgeStyle('#d1fae5', '#065f46')}>Đã ban hành</span>
            <span style={badgeStyle('#f3f4f6', '#374151')}>
              {documentTypes[selectedDoc.documentType] || selectedDoc.documentType}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
            Số: {selectedDoc.documentNumber}
          </p>

          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px', lineHeight: 1.4 }}>
            {selectedDoc.title}
          </h1>

          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
            {selectedDoc.description}
          </p>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <span>🏢 {selectedDoc.issuer}</span>
            <span>📅 {formatDate(selectedDoc.issuedDate)}</span>
            <span>👁️ {selectedDoc.viewCount} lượt xem</span>
          </div>

          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {selectedDoc.content}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => toggleFavorite(selectedDoc.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: favorites.includes(selectedDoc.id) ? '#fef2f2' : '#f9fafb',
                color: favorites.includes(selectedDoc.id) ? '#dc2626' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {favorites.includes(selectedDoc.id) ? '❤️' : '🤍'} Yêu thích
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.3px', marginBottom: '4px' }}>Tài liệu</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Kho lưu trữ văn bản, quy định & hướng dẫn</p>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '14px 16px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{documents.length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Văn bản</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>{favorites.length}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Yêu thích</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={searchContainerStyle}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm văn bản..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📄</span>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>Chưa có văn bản nào</p>
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {filteredDocs.map((doc) => (
            <div key={doc.id} style={cardStyle} onClick={() => setSelectedDoc(doc)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={badgeStyle('#d1fae5', '#065f46')}>Đã ban hành</span>
                    <span style={badgeStyle('#f3f4f6', '#374151')}>
                      {documentTypes[doc.documentType] || doc.documentType}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    Số: {doc.documentNumber}
                  </p>

                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>
                    {doc.title}
                  </h3>
                  
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                    {doc.description}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                    <span>📅 {formatDate(doc.issuedDate)}</span>
                    <span>👁️ {doc.viewCount} lượt xem</span>
                  </div>
                </div>

                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginLeft: '12px',
                    fontSize: '18px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(doc.id)
                  }}
                >
                  {favorites.includes(doc.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
