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
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    paddingBottom: '100px', // Extra space for scrolling past bottom nav
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
    cursor: 'pointer',
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
    marginRight: '8px',
    marginBottom: '8px',
  })

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '12px',
    fontSize: '18px',
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

  const filteredDocs = documents.filter(doc => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return doc.title.toLowerCase().includes(search) ||
           doc.documentNumber.toLowerCase().includes(search) ||
           doc.description.toLowerCase().includes(search)
  })

  // Document Detail View
  if (selectedDoc) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button style={backButtonStyle} onClick={() => setSelectedDoc(null)}>
            ←
          </button>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>Chi tiết văn bản</span>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>📄</span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Tài liệu</span>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
          Kho lưu trữ văn bản, quy định, hướng dẫn
        </p>
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
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📄</span>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Không có văn bản nào.</p>
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
