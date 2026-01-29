"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCode, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface QRCheckInProps {
  onClose: () => void
  meetingId: string
}

export function QRCheckIn({ onClose, meetingId }: QRCheckInProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState("")

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          setLocationError("Không thể lấy vị trí hiện tại")
        },
      )
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleCheckIn = () => {
    // Simulate check-in process
    setIsCheckedIn(true)
  }

  if (isCheckedIn) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Check-in thành công</h1>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Check-in thành công!</h2>
            <p className="text-muted-foreground mb-4">
              Bạn đã check-in vào cuộc họp lúc {new Date().toLocaleTimeString("vi-VN")}
            </p>
            {location && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  Vị trí: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={onClose} className="w-full">
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">QR Check-in</h1>
      </div>

      {/* Countdown Timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Thời gian còn lại</span>
            </div>
            <Badge variant={timeLeft > 60 ? "default" : "destructive"} className="text-lg px-3 py-1">
              {formatTime(timeLeft)}
            </Badge>
          </div>
          {timeLeft <= 60 && <p className="text-sm text-red-600 mt-2">Cửa sổ check-in sắp đóng!</p>}
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Quét mã QR để check-in</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-24 w-24 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Đưa camera của bạn vào khung hình để quét mã QR</p>
          <Button onClick={handleCheckIn} className="w-full">
            Mô phỏng Check-in
          </Button>
        </CardContent>
      </Card>

      {/* Location Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Vị trí hiện tại</span>
          </div>
          {location ? (
            <div className="text-sm text-muted-foreground">
              <p>Lat: {location.lat.toFixed(6)}</p>
              <p>Lng: {location.lng.toFixed(6)}</p>
              <Badge variant="outline" className="mt-2">
                Đã xác định vị trí
              </Badge>
            </div>
          ) : locationError ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{locationError}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Đang xác định vị trí...</p>
          )}
        </CardContent>
      </Card>

      {timeLeft === 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Cửa sổ check-in đã đóng</p>
            <p className="text-sm text-muted-foreground">Vui lòng liên hệ ban tổ chức để được hỗ trợ</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
