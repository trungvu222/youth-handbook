"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, CheckCircle, X, Trophy, RotateCcw } from "lucide-react"

interface QuizFlowProps {
  quiz: {
    id: string
    title: string
    questions: number
    duration: string
  }
  onComplete: (score: number) => void
  onExit: () => void
}

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export function QuizFlow({ quiz, onComplete, onExit }: QuizFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const questions: Question[] = [
    {
      id: "1",
      question: "Đảng Cộng sản Việt Nam được thành lập vào năm nào?",
      options: ["1925", "1930", "1935", "1940"],
      correctAnswer: 1,
      explanation: "Đảng Cộng sản Việt Nam được thành lập ngày 3/2/1930 tại Hồng Kông.",
    },
    {
      id: "2",
      question: "Ai là người sáng lập Đảng Cộng sản Việt Nam?",
      options: ["Hồ Chí Minh", "Phạm Văn Đồng", "Võ Nguyên Giáp", "Trường Chinh"],
      correctAnswer: 0,
      explanation: "Chủ tịch Hồ Chí Minh (tên thật Nguyễn Sinh Cung) là người sáng lập Đảng Cộng sản Việt Nam.",
    },
    {
      id: "3",
      question: "Tên đầu tiên của Đảng Cộng sản Việt Nam là gì?",
      options: ["Đảng Cộng sản Đông Dương", "Đảng Lao động Việt Nam", "Đảng Cộng sản Việt Nam", "Việt Minh"],
      correctAnswer: 0,
      explanation: "Ban đầu Đảng có tên là Đảng Cộng sản Đông Dương, sau đó đổi thành Đảng Cộng sản Việt Nam.",
    },
    {
      id: "4",
      question: "Cách mạng tháng Tám năm 1945 diễn ra trong bao nhiêu ngày?",
      options: ["15 ngày", "19 ngày", "25 ngày", "30 ngày"],
      correctAnswer: 1,
      explanation: "Cách mạng tháng Tám diễn ra từ ngày 13 đến 31 tháng 8 năm 1945, kéo dài 19 ngày.",
    },
    {
      id: "5",
      question: "Nước Việt Nam Dân chủ Cộng hòa được tuyên bố độc lập vào ngày nào?",
      options: ["30/4/1975", "2/9/1945", "19/5/1890", "3/2/1930"],
      correctAnswer: 1,
      explanation:
        "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.",
    },
  ]

  useEffect(() => {
    if (!showResults && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0) {
      handleSubmit()
    }
  }, [timeLeft, showResults])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    let correctAnswers = 0
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++
      }
    })
    const finalScore = Math.round((correctAnswers / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (showResults) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Kết quả bài kiểm tra</h1>
        </div>

        {/* Score Card */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-2">{score}/100</h2>
            <p className="text-lg font-medium mb-1">
              {score >= 80 ? "Xuất sắc!" : score >= 70 ? "Tốt!" : score >= 60 ? "Đạt!" : "Cần cố gắng thêm!"}
            </p>
            <p className="text-muted-foreground">
              Bạn trả lời đúng {questions.filter((q) => answers[q.id] === q.correctAnswer).length}/{questions.length}{" "}
              câu hỏi
            </p>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết kết quả</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = userAnswer === question.correctAnswer
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Bạn chọn:</span>
                          <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                            {userAnswer !== undefined ? question.options[userAnswer] : "Không trả lời"}
                          </span>
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </p>
                        {!isCorrect && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Đáp án đúng:</span>
                            <span className="text-green-600">{question.options[question.correctAnswer]}</span>
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => onComplete(score)} className="flex-1">
            Hoàn thành
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentQuestion(0)
              setAnswers({})
              setShowResults(false)
              setTimeLeft(1800)
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </Button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span className={timeLeft < 300 ? "text-red-600 font-medium" : ""}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>
              Câu {currentQuestion + 1} / {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Câu {currentQuestion + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium">{currentQ.question}</p>
          <RadioGroup
            value={answers[currentQ.id]?.toString() || ""}
            onValueChange={(value) => handleAnswerSelect(currentQ.id, Number.parseInt(value))}
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
          Câu trước
        </Button>
        <div className="flex gap-2">
          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleSubmit}>Nộp bài</Button>
          ) : (
            <Button onClick={handleNext}>Câu tiếp</Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Điều hướng câu hỏi</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={
                  currentQuestion === index
                    ? "default"
                    : answers[questions[index].id] !== undefined
                      ? "secondary"
                      : "outline"
                }
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className="aspect-square"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
