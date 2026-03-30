"use client"

import { useState, useEffect, useRef } from "react"
import { bookApi, authApi } from "@/lib/api"
import { X, Camera, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import jsQR from "jsqr"

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
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanningRef = useRef<boolean>(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Get current user ID
    authApi.getMe().then(response => {
      if (response.success && response.data) {
        setCurrentUserId(response.data.id)
      }
    })

    // Start camera
    startCamera()

    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      console.log('[QR Scanner] Starting camera...')
      setCameraError(null)
      
      // Try environment camera first (mobile back camera), fallback to any camera (desktop)
      let stream: MediaStream | null = null
      
      try {
        // Try back camera first (mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      } catch (err) {
        console.log('[QR Scanner] Back camera not available, trying any camera...')
        // Fallback to any available camera (desktop)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      }
      
      if (!stream) {
        throw new Error('Không thể truy cập camera')
      }
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('[QR Scanner] Camera started successfully')
              setCameraStarted(true)
              
              // Start scanning for QR codes
              scanningRef.current = true
              requestAnimationFrame(scanQRCode)
            }).catch((err) => {
              console.error('[QR Scanner] Play error:', err)
              setCameraError('Không thể phát video từ camera')
            })
          }
        }
      }
    } catch (err: any) {
      console.error('[QR Scanner] Camera error:', err)
      setCameraError(err.message || "Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera.")
      setCameraStarted(false)
    }
  }

  const scanQRCode = () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data and scan for QR code
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code && code.data) {
      console.log('[QR Scanner] QR Code detected:', code.data)
      scanningRef.current = false // Stop scanning
      handleQRCodeScanned(code.data)
    } else {
      // Continue scanning
      requestAnimationFrame(scanQRCode)
    }
  }

  const stopCamera = async () => {
    try {
      console.log('[QR Scanner] Stopping camera...')
      scanningRef.current = false
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      
      console.log('[QR Scanner] Camera stopped')
    } catch (err) {
      console.error('[QR Scanner] Error stopping camera:', err)
    }
  }

  const handleQRCodeScanned = async (qrCode: string) => {
    if (!qrCode.trim()) return

    console.log('[QR Scanner] Processing QR code:', qrCode)

    try {
      setProcessing(true)
      setError(null)
      setResult(null)

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
        // Restart camera after error
        setTimeout(() => {
          setError(null)
          startCamera()
        }, 2000)
      }
    } catch (err: any) {
      console.error('[QR Scanner] Exception:', err)
      setError(err.message || "Có lỗi xảy ra")
      setResult(null)
      // Restart camera after error
      setTimeout(() => {
        setError(null)
        startCamera()
      }, 2000)
    } finally {
      setProcessing(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log('[QR Scanner] Showing toast:', message, type)
    setToast({ show: true, message, type })
    setTimeout(() => {
      console.log('[QR Scanner] Hiding toast')
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Manual input fallback
  const handleManualInput = async (qrCode: string) => {
    if (!qrCode.trim()) return
    stopCamera()
    handleQRCodeScanned(qrCode.trim())
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



  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "#000", zIndex: 99999,
      display: "flex", flexDirection: "column",
      isolation: "isolate",
      padding: 'max(env(safe-area-inset-top), 16px) 16px max(env(safe-area-inset-bottom), 16px)'
    }}>
      {/* Toast Notification - Portal style to ensure it's on top */}
      {toast.show && (
        <div style={{
          position: "fixed", 
          bottom: 'max(env(safe-area-inset-bottom), 20px)', 
          left: 20,
          right: 20,
          zIndex: 999999, 
          minWidth: 'min(280px, calc(100vw - 40px))', 
          maxWidth: 'min(400px, calc(100vw - 40px))',
          margin: '0 auto',
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
        justifyContent: "space-between", background: "#000",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
          Quét mã QR
        </h2>
        <button
          onClick={onClose}
          style={{
            minWidth: 44, minHeight: 44, width: 44, height: 44, borderRadius: "50%",
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
            maxWidth: 'min(400px, calc(100vw - 40px))', width: "100%"
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
                width: "100%", minHeight: 44, padding: "12px 0", borderRadius: 12,
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
            {/* Camera View */}
            <div style={{ 
              width: '100%', 
              maxWidth: 'min(400px, calc(100vw - 40px))', 
              marginBottom: 24, 
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              background: '#000'
            }}>
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  display: cameraStarted && !cameraError ? 'block' : 'none'
                }}
              />
              
              {/* Hidden canvas for QR scanning */}
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
              
              {/* Loading overlay */}
              {!cameraStarted && !cameraError && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.8)',
                  zIndex: 10
                }}>
                  <div style={{ textAlign: "center" }}>
                    <Camera style={{ width: 48, height: 48, color: "#fff", margin: "0 auto 12px" }} />
                    <p style={{ color: "#fff", fontSize: 14 }}>Đang khởi động camera...</p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {cameraError && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.9)',
                  zIndex: 10,
                  padding: 24
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <AlertCircle style={{ width: 48, height: 48, color: "#ef4444", margin: "0 auto 12px" }} />
                    <p style={{ color: "#fff", fontSize: 14, marginBottom: 12 }}>{cameraError}</p>
                    <button
                      onClick={startCamera}
                      style={{
                        padding: "10px 20px", borderRadius: 10,
                        border: "none", background: "#fff",
                        color: "#1e293b", fontSize: 14, fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Thử lại
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Input (fallback) */}
            <div style={{ width: "100%", maxWidth: 'min(400px, calc(100vw - 40px))' }}>
              <input
                type="text"
                placeholder="Hoặc nhập mã QR thủ công..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualInput((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
                style={{
                  width: "100%", minHeight: 44, padding: "12px 16px", borderRadius: 12,
                  border: "2px solid #667eea", background: "#fff",
                  color: "#1e293b", fontSize: 14, outline: "none"
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                Nhấn Enter để tìm kiếm
              </p>
            </div>

            {error && (
              <div style={{
                marginTop: 16, padding: "12px 16px", background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: 12,
                color: "#fff", fontSize: 14, display: "flex", alignItems: "center", gap: 8,
                maxWidth: 'min(400px, calc(100vw - 40px))'
              }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                {error}
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: "#fff", borderRadius: 20, padding: 24,
            maxWidth: 'min(400px, calc(100vw - 40px))', width: "100%"
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
                      width: "100%",
                      maxWidth: "100%",
                      padding: "12px", 
                      borderRadius: 12,
                      border: "2px solid #e2e8f0", 
                      fontSize: 14, 
                      outline: "none",
                      boxSizing: "border-box",
                      display: "block"
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
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
                      flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
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
                      flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
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
                    flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
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
