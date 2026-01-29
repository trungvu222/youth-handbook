"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, Clock, MapPin, Users, QrCode, MessageSquare, Star, Send, UserCheck } from "lucide-react"

interface MeetingDetailProps {
  meeting: {
    id: string
    title: string
    date: string
    time: string
    location: string
    description: string
    organizer: string
    currentParticipants: number
    maxParticipants?: number
    isRegistered: boolean
    requiresRegistration: boolean
  }
  onBack: () => void
  onCheckIn: () => void
}

export function MeetingDetail({ meeting, onBack, onCheckIn }: MeetingDetailProps) {
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState(0)

  const attendees = [
    { id: "1", name: "Nguyễn Văn An", avatar: "", role: "Thành viên", checkedIn: true },
    { id: "2", name: "Trần Thị Bình", avatar: "", role: "Thành viên", checkedIn: true },
    { id: "3", name: "Lê Văn Cường", avatar: "", role: "Phó Bí thư", checkedIn: false },
    { id: "4", name: "Phạm Thị Dung", avatar: "", role: "Thành viên", checkedIn: true },
    { id: "5", name: "Hoàng Văn Em", avatar: "", role: "Thành viên", checkedIn: false },
  ]

  const isUpcoming = new Date(meeting.date) > new Date()
  const isToday = new Date(meeting.date).toDateString() === new Date().toDateString()

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Chi tiết cuộc họp</h1>
      </div>

      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{meeting.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{meeting.description}</p>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{new Date(meeting.date).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{meeting.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>
                {meeting.currentParticipants}
                {meeting.maxParticipants && `/${meeting.maxParticipants}`} người tham gia
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Tổ chức bởi</p>
              <p className="font-medium">{meeting.organizer}</p>
            </div>
            {isToday && meeting.isRegistered && (
              <Button onClick={onCheckIn} className="gap-2">
                <QrCode className="h-4 w-4" />
                Check-in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Status */}
      {meeting.requiresRegistration && (
        <Card>
          <CardContent className="p-4">
            {meeting.isRegistered ? (
              <div className="flex items-center gap-2 text-green-600">
                <UserCheck className="h-5 w-5" />
                <span className="font-medium">Bạn đã đăng ký tham gia cuộc họp này</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Đăng ký tham gia</p>
                  <p className="text-sm text-muted-foreground">Cuộc họp này yêu cầu đăng ký trước</p>
                </div>
                <Button>Đăng ký</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách tham gia ({attendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendees.map((attendee) => (
              <div key={attendee.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={attendee.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{attendee.name}</p>
                  <p className="text-sm text-muted-foreground">{attendee.role}</p>
                </div>
                <Badge variant={attendee.checkedIn ? "default" : "secondary"}>
                  {attendee.checkedIn ? "Đã check-in" : "Chưa check-in"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section (for completed meetings) */}
      {!isUpcoming && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Đánh giá cuộc họp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Đánh giá chất lượng</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Nhận xét</p>
              <Textarea
                placeholder="Chia sẻ nhận xét của bạn về cuộc họp..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <Button className="w-full gap-2">
              <Send className="h-4 w-4" />
              Gửi đánh giá
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
