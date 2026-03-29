"use client"

import { useState, useEffect } from "react"
import { bookApi, authApi } from "@/lib/api"
import { X, Camera, CheckCircle, AlertCircle, Calendar } from "lucide-react"

interface QRScannerProps {
  onClose: () => void
  onSuccess?: () => void
}

interface Toast {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function QRScanner({ onClose, onSuccess }: QRScannerProps) {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState<string>("")
  const [borrowSuccess, setBorrowSuccess] = useState<any>(null)
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    // Get current user ID
    authApi.getMe().then(response => {
      if (response.success && response.data) {
        setCurrentUserId(response.data.id)
      }
    })
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log('[QR Scanner] Showing toast:', message, type)
    setToast({ show: true, message, type })
    setTimeout(() => {
      console.log('[QR Scanner] Hiding toast')
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Simulate QR scan for now - will integrate with Capacitor Camera later
  const handleManualInput = async (qrCode: string) => {
    if (!qrCode.trim()) return

    console.log('[QR Scanner] Scanning QR code:', qrCode)

    try {
      setProcessing(true)
      setError(null)
      setResult(null) // Clear previous result

      // Scan QR code
      const response = await bookApi.scanBookQR(qrCode.trim())
      
      console.log('[QR Scanner] API response:', response)
      
      if (response.success && response.data) {
        console.log('[QR Scanner] Book found:', response.data)
        setResult(response.data)
        setError(null)
      } else {
        console.error('[QR Scanner] Error:', response.error)
        setError(response.error || "Không tìm thấy sách")
        setResult(null)
      }
    } catch (err: any) {
      console.error('[QR Scanner] Exception:', err)
      setError(err.message || "Có lỗi xảy ra")
      setResult(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleBorrow = async () => {
    if (!result) return

    try {
      setProcessing(true)
      setError(null)
      
      // Prepare borrow data with return date if provided
      const borrowData: any = {}
      if (returnDate) {
        borrowData.returnDate = returnDate
      }
      
      const response = await bookApi.borrowBook(result.id, borrowData)
      
      if (response.success) {
        // Show success with borrow details
        setBorrowSuccess({
          bookTitle: result.title,
          borrowedAt: new Date().toISOString(),
          returnDate: returnDate || null,
          message: response.message || "Mượn sách thành công!"
        })
        onSuccess?.()
      } else {
        setError(response.error || "Không thể mượn sách")
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra")
    } finally {
      setProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!result || !result.currentBorrowingId) return

    console.log('[QR Scanner] handleReturn called')
    try {
      setProcessing(true)
      setError(null)
      const response = await bookApi.returnBook(result.currentBorrowingId)
      
      console.log('[QR Scanner] Return response:', response)
      
      if (response.success) {
        console.log('[QR Scanner] Return successful, showing toast')
        showToast(response.message || "Trả sách thành công!", 'success')
        onSuccess?.()
        // Close after showing toast
        setTimeout(() => {
          console.log('[QR Scanner] Closing scanner')
          onClose()
        }, 1500)
      } else {
        console.error('[QR Scanner] Return failed:', response.error)
        setError(response.error || "Không thể trả sách")
      }
    } catch (err: any) {
      console.error('[QR Scanner] Return exception:', err)
      setError(err.message || "Có lỗi xảy ra")
    } finally {
      setProcessing(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.9)", zIndex: 9999,
      display: "flex", flexDirection: "column"
    }}>
      {/* Toast Notification - Portal style to ensure it's on top */}
      {toast.show && (
        <div style={{
          position: "fixed", 
          bottom: 20, 
          right: 20,
          zIndex: 999999, 
          minWidth: 280, 
          maxWidth: 400,
          background: toast.type === 'success' ? "#10b981" : "#ef4444",
          color: "#fff", 
          padding: "16px 20px", 
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          animation: "slideUp 0.3s ease-out",
          pointerEvents: "auto"
        }}>
          {toast.type === 'success' ? (
            <CheckCircle style={{ width: 24, height: 24, flexShrink: 0 }} />
          ) : (
            <AlertCircle style={{ width: 24, height: 24, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: "rgba(0,0,0,0.5)"
      }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
          Quét mã QR
        </h2>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "#fff", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}
        >
          <X style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Scanner Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        {borrowSuccess ? (
          /* Success Screen */
          <div style={{
            background: "#fff", borderRadius: 20, padding: 24,
            maxWidth: 400, width: "100%"
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#16a34a" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>
                {borrowSuccess.message}
              </h3>
            </div>

            <div style={{
              padding: 16, background: "#f8fafc", borderRadius: 12,
              marginBottom: 16, fontSize: 14
            }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Tên sách</p>
                <p style={{ color: "#1e293b", fontWeight: 600 }}>{borrowSuccess.bookTitle}</p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Thời gian mượn</p>
                <p style={{ color: "#1e293b", fontWeight: 600 }}>
                  {formatDateTime(borrowSuccess.borrowedAt)}
                </p>
              </div>
              {borrowSuccess.returnDate && (
                <div>
                  <p style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Dự kiến trả</p>
                  <p style={{ color: "#1e293b", fontWeight: 600 }}>
                    {formatDateTime(borrowSuccess.returnDate)}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 12,
                border: "none", background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Đóng
            </button>
          </div>
        ) : !result ? (
          <>
            <div style={{
              width: 250, height: 250, border: "3px solid #fff",
              borderRadius: 20, position: "relative", marginBottom: 24
            }}>
              <div style={{
                position: "absolute", top: -3, left: -3, width: 40, height: 40,
                borderTop: "6px solid #667eea", borderLeft: "6px solid #667eea",
                borderRadius: "20px 0 0 0"
              }} />
              <div style={{
                position: "absolute", top: -3, right: -3, width: 40, height: 40,
                borderTop: "6px solid #667eea", borderRight: "6px solid #667eea",
                borderRadius: "0 20px 0 0"
              }} />
              <div style={{
                position: "absolute", bottom: -3, left: -3, width: 40, height: 40,
                borderBottom: "6px solid #667eea", borderLeft: "6px solid #667eea",
                borderRadius: "0 0 0 20px"
              }} />
              <div style={{
                position: "absolute", bottom: -3, right: -3, width: 40, height: 40,
                borderBottom: "6px solid #667eea", borderRight: "6px solid #667eea",
                borderRadius: "0 0 20px 0"
              }} />

              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", textAlign: "center"
              }}>
                <Camera style={{ width: 48, height: 48, color: "#fff", margin: "0 auto 12px" }} />
                <p style={{ color: "#fff", fontSize: 14 }}>Đưa mã QR vào khung</p>
              </div>
            </div>

            {/* Manual Input (temporary) */}
            <div style={{ width: "100%", maxWidth: 300 }}>
              <input
                type="text"
                placeholder="Hoặc nhập mã QR thủ công..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualInput((e.target as HTMLInputElement).value)
                  }
                }}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none"
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                Nhấn Enter để tìm kiếm
              </p>
            </div>

            {error && (
              <div style={{
                marginTop: 16, padding: "12px 16px", background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: 12,
                color: "#fff", fontSize: 14, display: "flex", alignItems: "center", gap: 8
              }}>
                <AlertCircle style={{ width: 16, height: 16 }} />
                {error}
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: "#fff", borderRadius: 20, padding: 24,
            maxWidth: 400, width: "100%"
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              {result.isBorrowed ? (
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px", fontSize: 32
                }}>
                  📖
                </div>
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px"
                }}>
                  <CheckCircle style={{ width: 32, height: 32, color: "#16a34a" }} />
                </div>
              )}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                {result.title}
              </h3>
              {result.author && (
                <p style={{ fontSize: 14, color: "#64748b" }}>Tác giả: {result.author}</p>
              )}
              {result.publisher && (
                <p style={{ fontSize: 14, color: "#64748b" }}>NXB: {result.publisher}</p>
              )}
            </div>

            {result.isBorrowed ? (
              result.currentBorrower ? (
                <div style={{
                  padding: 12, background: "#fef3c7", borderRadius: 12,
                  marginBottom: 16, fontSize: 14, color: "#92400e"
                }}>
                  <p><strong>Đang mượn bởi:</strong> {result.currentBorrower.fullName}</p>
                  {result.currentBorrowedAt && (
                    <p style={{ marginTop: 4 }}>
                      <strong>Từ:</strong> {formatDateTime(result.currentBorrowedAt)}
                    </p>
                  )}
                </div>
              ) : null
            ) : (
              <>
                <div style={{
                  padding: 12, background: "#dcfce7", borderRadius: 12,
                  marginBottom: 16, fontSize: 14, color: "#166534", textAlign: "center"
                }}>
                  ✅ Sách đang sẵn sàng để mượn
                </div>

                {/* Return Date Input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, color: "#64748b", marginBottom: 8
                  }}>
                    <Calendar style={{ width: 16, height: 16 }} />
                    Ngày giờ trả dự kiến (tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "2px solid #e2e8f0", fontSize: 14, outline: "none"
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "2px solid #e2e8f0", background: "#fff",
                  color: "#64748b", fontSize: 14, fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
              {result.isBorrowed ? (
                result.currentBorrower?.id === currentUserId ? (
                  <button
                    onClick={handleReturn}
                    disabled={processing}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: 12,
                      border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      cursor: processing ? "not-allowed" : "pointer",
                      opacity: processing ? 0.6 : 1
                    }}
                  >
                    {processing ? "Đang xử lý..." : "Trả sách"}
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: 12,
                      border: "none", background: "#e2e8f0",
                      color: "#94a3b8", fontSize: 14, fontWeight: 700,
                      cursor: "not-allowed"
                    }}
                  >
                    Không thể mượn
                  </button>
                )
              ) : (
                <button
                  onClick={handleBorrow}
                  disabled={processing}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 12,
                    border: "none", background: "linear-gradient(135deg, #667eea, #764ba2)",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.6 : 1
                  }}
                >
                  {processing ? "Đang xử lý..." : "Mượn sách"}
                </button>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 12px", background: "#fee2e2",
                border: "1px solid #fecaca", borderRadius: 10,
                color: "#dc2626", fontSize: 13
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
