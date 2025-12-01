"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, Download, Copy } from "lucide-react"

export function QRGenerator() {
  const [qrType, setQrType] = useState("")
  const [eventId, setEventId] = useState("")
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)

  const events = [
    { id: "1", name: "Cuộc họp Chi Đoàn tháng 12", type: "meeting" },
    { id: "2", name: "Hoạt động tình nguyện", type: "activity" },
    { id: "3", name: "Thi tìm hiểu lịch sử Đảng", type: "exam" },
  ]

  const handleGenerateQR = () => {
    if (qrType && eventId) {
      // Simulate QR generation
      const qrData = `${qrType}:${eventId}:${Date.now()}`
      setGeneratedQR(qrData)
    }
  }

  const handleDownloadQR = () => {
    console.log("Download QR code")
  }

  const handleCopyQR = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tạo mã QR</h2>

      <Card>
        <CardHeader>
          <CardTitle>Tạo mã QR cho sự kiện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qrType">Loại sự kiện</Label>
            <Select value={qrType} onValueChange={setQrType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại sự kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Cuộc họp</SelectItem>
                <SelectItem value="activity">Hoạt động</SelectItem>
                <SelectItem value="exam">Kiểm tra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="event">Chọn sự kiện</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn sự kiện cụ thể" />
              </SelectTrigger>
              <SelectContent>
                {events
                  .filter((event) => !qrType || event.type === qrType)
                  .map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateQR} disabled={!qrType || !eventId} className="w-full gap-2">
            <QrCode className="h-4 w-4" />
            Tạo mã QR
          </Button>
        </CardContent>
      </Card>

      {generatedQR && (
        <Card>
          <CardHeader>
            <CardTitle>Mã QR đã tạo</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Mã QR cho {events.find((e) => e.id === eventId)?.name}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleDownloadQR} variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Tải xuống
              </Button>
              <Button onClick={handleCopyQR} variant="outline" className="gap-2 bg-transparent">
                <Copy className="h-4 w-4" />
                Sao chép
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Mã QR gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Cuộc họp Chi Đoàn tháng 12</p>
                <p className="text-sm text-muted-foreground">Tạo: 15/12/2024 - 14:30</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Xem
                </Button>
                <Button variant="outline" size="sm">
                  Tải
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Hoạt động tình nguyện</p>
                <p className="text-sm text-muted-foreground">Tạo: 10/12/2024 - 09:15</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Xem
                </Button>
                <Button variant="outline" size="sm">
                  Tải
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
