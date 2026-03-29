"use client"

import { useState, useEffect } from "react"
import { bookApi } from "@/lib/api"
import { Book, Search, Calendar, User, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react"

interface BookItem {
  id: string
  title: string
  author?: string
  publisher?: string
  qrCode: string
  isBorrowed?: boolean
  currentBorrower?: { id: string; fullName: string } | null
  borrowedAt?: string | null
  expectedReturnDate?: string | null
}

export default function BooksScreenMobile({ onBack }: { onBack?: () => void }) {
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "borrowed">("all")

  useEffect(() => {
    loadBooks()
    
    // Auto-polling every 3 seconds for near real-time updates
    const intervalId = setInterval(() => {
      loadBooks(true) // Silent refresh
    }, 3000)
    
    return () => clearInterval(intervalId)
  }, [])

  async function loadBooks(silent = false) {
    try {
      if (!silent) {
        setLoading(true)
      }
      const response = await bookApi.getBooks({ search: searchTerm })
      if (response.success && response.data) {
        setBooks(response.data)
      }
    } catch (error) {
      console.error("Error loading books:", error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true)
      const response = await bookApi.getBooks({ search: searchTerm })
      if (response.success && response.data) {
        setBooks(response.data)
      }
    } catch (error) {
      console.error("Error refreshing books:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleRefresh()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const filteredBooks = books.filter(book => {
    if (filterStatus === "available") return !book.isBorrowed
    if (filterStatus === "borrowed") return book.isBorrowed
    return true
  })

  const isOverdue = (expectedReturnDate: string | null) => {
    if (!expectedReturnDate) return false
    return new Date(expectedReturnDate) < new Date()
  }

  return (
    <div style={{ backgroundColor: "#f5f6fa", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        padding: "24px 16px 20px", 
        color: "#fff" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ 
              width: 36, height: 36, background: "rgba(255,255,255,0.15)", 
              border: "none", color: "#fff", fontSize: 16, cursor: "pointer", 
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" 
            }}>
              <ArrowLeft style={{ width: 20, height: 20 }} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Sách</h1>
            <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Danh sách sách từ Phòng HCM</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ padding: "16px" }}>
        {/* Search and Refresh */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ 
            flex: 1, background: "#fff", borderRadius: 14, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            <Search style={{ width: 18, height: 18, color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, color: "#1e293b"
              }}
            />
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              width: 44, height: 44, borderRadius: 14, border: "none",
              background: "#fff", cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw 
              style={{ 
                width: 20, height: 20, color: "#667eea",
                animation: refreshing ? "spin 0.8s linear infinite" : "none"
              }} 
            />
          </button>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { value: "all", label: "Tất cả" },
            { value: "available", label: "Sẵn sàng" },
            { value: "borrowed", label: "Đang mượn" }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
                fontSize: 13, fontWeight: filterStatus === filter.value ? 700 : 500,
                cursor: "pointer",
                background: filterStatus === filter.value 
                  ? "linear-gradient(135deg, #667eea, #764ba2)" 
                  : "#fff",
                color: filterStatus === filter.value ? "#fff" : "#64748b",
                boxShadow: filterStatus === filter.value 
                  ? "0 3px 10px rgba(102, 126, 234, 0.3)" 
                  : "0 1px 4px rgba(0,0,0,0.07)"
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books List */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ 
              width: "40px", height: "40px", border: "3px solid #ede9fe", 
              borderTopColor: "#7c3aed", borderRadius: "50%", 
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px" 
            }} />
            <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
            <style>{`
              @keyframes spin { 
                to { transform: rotate(360deg); } 
              }
            `}</style>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ 
              width: "56px", height: "56px", borderRadius: "50%", 
              background: "linear-gradient(135deg, #ede9fe, #f5f3ff)", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              margin: "0 auto 12px", fontSize: "24px" 
            }}>📚</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginTop: 12 }}>
              Không tìm thấy sách
            </h3>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredBooks.map(book => (
              <div
                key={book.id}
                style={{
                  background: "#fff", borderRadius: 14, padding: 16,
                  border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", flex: 1 }}>
                    {book.title}
                  </h3>
                  {book.isBorrowed ? (
                    <span style={{ 
                      fontSize: 11, padding: "4px 8px", background: "#fee2e2", 
                      color: "#dc2626", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" 
                    }}>
                      Đang mượn
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: 11, padding: "4px 8px", background: "#dcfce7", 
                      color: "#16a34a", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" 
                    }}>
                      Sẵn sàng
                    </span>
                  )}
                </div>

                {book.author && (
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                    Tác giả: {book.author}
                  </p>
                )}

                {book.publisher && (
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                    NXB: {book.publisher}
                  </p>
                )}

                {book.isBorrowed && book.currentBorrower && (
                  <div style={{ 
                    marginTop: 8, padding: 8, background: "#f8fafc", 
                    borderRadius: 8, fontSize: 12, color: "#475569" 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User style={{ width: 14, height: 14 }} />
                      <span>Đang mượn: {book.currentBorrower.fullName}</span>
                    </div>
                    {book.borrowedAt && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <Calendar style={{ width: 14, height: 14 }} />
                        <span>
                          Từ: {new Date(book.borrowedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                    {book.expectedReturnDate && (
                      <div style={{ 
                        display: "flex", alignItems: "center", gap: 6, marginTop: 4,
                        color: isOverdue(book.expectedReturnDate) ? "#dc2626" : "#475569",
                        fontWeight: isOverdue(book.expectedReturnDate) ? 600 : 400
                      }}>
                        <Calendar style={{ width: 14, height: 14 }} />
                        <span>
                          Dự kiến trả: {new Date(book.expectedReturnDate).toLocaleString("vi-VN")}
                        </span>
                        {isOverdue(book.expectedReturnDate) && (
                          <span style={{ 
                            fontSize: 10, padding: "2px 6px", background: "#fee2e2", 
                            color: "#dc2626", borderRadius: 4, fontWeight: 600, marginLeft: 4 
                          }}>
                            Quá hạn
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
