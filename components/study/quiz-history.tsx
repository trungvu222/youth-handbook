"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Star, RotateCcw, Eye } from "lucide-react"

export function QuizHistory() {
  const quizHistory = [
    {
      id: "1",
      title: "Kiểm tra: Lịch sử Đảng",
      date: "2024-12-15",
      time: "14:30",
      score: 85,
      duration: "25 phút",
      questions: 20,
      correctAnswers: 17,
      status: "completed",
    },
    {
      id: "2",
      title: "Kiểm tra: Tư tưởng Hồ Chí Minh",
      date: "2024-12-10",
      time: "16:00",
      score: 92,
      duration: "35 phút",
      questions: 25,
      correctAnswers: 23,
      status: "completed",
    },
    {
      id: "3",
      title: "Kiểm tra: Lịch sử Đảng (Lần 1)",
      date: "2024-12-08",
      time: "15:15",
      score: 78,
      duration: "28 phút",
      questions: 20,
      correctAnswers: 15,
      status: "completed",
    },
    {
      id: "4",
      title: "Kiểm tra: Đường lối cách mạng",
      date: "2024-12-05",
      time: "10:30",
      score: 88,
      duration: "22 phút",
      questions: 15,
      correctAnswers: 13,
      status: "completed",
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 80) return "bg-blue-100 text-blue-800 border-blue-200"
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử bài kiểm tra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizHistory.map((quiz) => (
            <Card key={quiz.id} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(quiz.date).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getScoreBadge(quiz.score)}>{quiz.score}/100</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Thời gian làm bài:</span>
                    <span className="ml-2 font-medium">{quiz.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Số câu đúng:</span>
                    <span className="ml-2 font-medium">
                      {quiz.correctAnswers}/{quiz.questions}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className={`font-semibold ${getScoreColor(quiz.score)}`}>{quiz.score} điểm</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Eye className="h-4 w-4" />
                      Xem chi tiết
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <RotateCcw className="h-4 w-4" />
                      Làm lại
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
