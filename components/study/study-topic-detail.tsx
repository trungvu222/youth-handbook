"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, FileText, BookOpen, Clock, Star, Target, CheckCircle } from "lucide-react"

interface StudyTopicDetailProps {
  topic: {
    id: string
    title: string
    description: string
    type: "video" | "pdf" | "article"
    duration: string
    difficulty: "easy" | "medium" | "hard"
    category: string
    progress: number
    isCompleted: boolean
    hasQuiz: boolean
    quizScore?: number
  }
  onBack: () => void
  onStartQuiz: (quizId: string) => void
}

export function StudyTopicDetail({ topic, onBack, onStartQuiz }: StudyTopicDetailProps) {
  const [isStudying, setIsStudying] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Dễ"
      case "medium":
        return "Trung bình"
      case "hard":
        return "Khó"
      default:
        return difficulty
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-6 w-6" />
      case "pdf":
        return <FileText className="h-6 w-6" />
      case "article":
        return <BookOpen className="h-6 w-6" />
      default:
        return <BookOpen className="h-6 w-6" />
    }
  }

  if (isStudying) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsStudying(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Đang học</h1>
        </div>

        {/* Content Viewer */}
        <Card>
          <CardContent className="p-0">
            {topic.type === "video" ? (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">Video Player</p>
                  <p className="text-sm opacity-75">Đang phát: {topic.title}</p>
                </div>
              </div>
            ) : topic.type === "pdf" ? (
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">PDF Viewer</p>
                  <p className="text-sm text-muted-foreground">Đang xem: {topic.title}</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold mb-4">{topic.title}</h2>
                  <p className="text-muted-foreground mb-6">{topic.description}</p>
                  <div className="space-y-4">
                    <p>
                      Đây là nội dung mẫu cho bài học về {topic.title.toLowerCase()}. Trong phần này, chúng ta sẽ tìm
                      hiểu về các khái niệm cơ bản và ứng dụng thực tế.
                    </p>
                    <p>
                      Nội dung bài học được chia thành nhiều phần nhỏ để dễ dàng theo dõi và học tập. Mỗi phần sẽ có các
                      ví dụ cụ thể và bài tập thực hành.
                    </p>
                    <p>
                      Sau khi hoàn thành bài học, bạn có thể tham gia bài kiểm tra để đánh giá mức độ hiểu biết của mình
                      về chủ đề này.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ học tập</span>
              <span>{topic.progress}%</span>
            </div>
            <Progress value={topic.progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1">Tiếp tục học</Button>
          {topic.hasQuiz && (
            <Button variant="outline" onClick={() => onStartQuiz(topic.id)}>
              Làm bài kiểm tra
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Chi tiết chủ đề</h1>
      </div>

      {/* Topic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
              <p className="text-muted-foreground">{topic.description}</p>
            </div>
            {topic.isCompleted && <CheckCircle className="h-6 w-6 text-green-600" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              {getTypeIcon(topic.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getDifficultyColor(topic.difficulty)}>{getDifficultyText(topic.difficulty)}</Badge>
                <Badge variant="secondary">{topic.category}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{topic.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="capitalize">{topic.type}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ học tập</span>
              <span>{topic.progress}%</span>
            </div>
            <Progress value={topic.progress} className="h-3" />
          </div>

          {topic.quizScore && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Điểm kiểm tra: {topic.quizScore}/100</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mục tiêu học tập</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Hiểu được các khái niệm cơ bản về {topic.title.toLowerCase()}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Nắm vững các nguyên tắc và quy luật chính</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Áp dụng kiến thức vào thực tế</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Đạt điểm tối thiểu 70/100 trong bài kiểm tra</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button onClick={() => setIsStudying(true)} className="w-full" size="lg">
          {topic.progress > 0 ? "Tiếp tục học" : "Bắt đầu học"}
        </Button>
        {topic.hasQuiz && (
          <Button variant="outline" onClick={() => onStartQuiz(topic.id)} className="w-full">
            {topic.quizScore ? "Làm lại bài kiểm tra" : "Làm bài kiểm tra"}
          </Button>
        )}
      </div>
    </div>
  )
}
