"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, TrendingUp, Users, BookOpen, Award } from "lucide-react"

const ratingCategories = [
  {
    id: "leadership",
    title: "Khả năng lãnh đạo",
    icon: Users,
    description: "Đánh giá khả năng dẫn dắt và tổ chức hoạt động",
  },
  {
    id: "participation",
    title: "Tham gia hoạt động",
    icon: TrendingUp,
    description: "Mức độ tích cực tham gia các hoạt động Đoàn",
  },
  {
    id: "learning",
    title: "Học tập chính trị",
    icon: BookOpen,
    description: "Tinh thần học tập và nắm vững lý luận chính trị",
  },
  {
    id: "discipline",
    title: "Ý thức kỷ luật",
    icon: Award,
    description: "Chấp hành nội quy và kỷ luật của tổ chức",
  },
]

export default function SelfRating() {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingChange = (category: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [category]: rating }))
  }

  const handleCommentChange = (category: string, comment: string) => {
    setComments((prev) => ({ ...prev, [category]: comment }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    // Show success message
  }

  const renderStars = (category: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => handleRatingChange(category, star)} className="p-1">
            <Star className={`w-6 h-6 ${star <= currentRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Tự đánh giá</h2>
        <p className="text-gray-600 mt-2">Đánh giá bản thân về các hoạt động Đoàn trong tháng</p>
      </div>

      <div className="space-y-4">
        {ratingCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Icon className="w-5 h-5 text-amber-600" />
                  {category.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Điểm đánh giá</Label>
                  <div className="mt-2">{renderStars(category.id, ratings[category.id] || 0)}</div>
                </div>
                <div>
                  <Label htmlFor={`comment-${category.id}`} className="text-sm font-medium">
                    Nhận xét bản thân
                  </Label>
                  <Textarea
                    id={`comment-${category.id}`}
                    placeholder="Chia sẻ suy nghĩ của bạn về mặt này..."
                    value={comments[category.id] || ""}
                    onChange={(e) => handleCommentChange(category.id, e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mục tiêu tháng tới</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Đặt ra mục tiêu cụ thể cho bản thân trong tháng tới..." className="min-h-[100px]" />
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(ratings).length === 0}
        className="w-full bg-amber-600 hover:bg-amber-700"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
      </Button>
    </div>
  )
}
