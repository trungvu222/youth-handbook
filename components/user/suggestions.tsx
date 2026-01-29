"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from "lucide-react"

const suggestionTypes = [
  { id: "activity", label: "Hoạt động Đoàn", color: "bg-blue-100 text-blue-800" },
  { id: "study", label: "Học tập", color: "bg-green-100 text-green-800" },
  { id: "facility", label: "Cơ sở vật chất", color: "bg-purple-100 text-purple-800" },
  { id: "other", label: "Khác", color: "bg-gray-100 text-gray-800" },
]

const mockSuggestions = [
  {
    id: 1,
    title: "Tổ chức thêm hoạt động ngoại khóa",
    content: "Đề xuất tổ chức thêm các hoạt động thể thao, văn nghệ để đoàn viên tham gia nhiều hơn.",
    type: "activity",
    status: "replied",
    createdAt: "2024-01-15",
    adminReply: "Cảm ơn góp ý của bạn. Chúng tôi sẽ xem xét tổ chức giải bóng đá và hội thi văn nghệ trong tháng tới.",
    repliedAt: "2024-01-16",
  },
  {
    id: 2,
    title: "Cải thiện chất lượng âm thanh phòng họp",
    content: "Âm thanh trong phòng họp chính thường bị vọng, ảnh hưởng đến chất lượng buổi sinh hoạt.",
    type: "facility",
    status: "pending",
    createdAt: "2024-01-20",
  },
]

export default function Suggestions() {
  const [activeTab, setActiveTab] = useState<"list" | "new">("list")
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    content: "",
    type: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newSuggestion.title || !newSuggestion.content || !newSuggestion.type) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)

    // Reset form and switch to list
    setNewSuggestion({ title: "", content: "", type: "" })
    setActiveTab("list")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "replied":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-amber-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "replied":
        return "Đã phản hồi"
      case "pending":
        return "Đang xử lý"
      default:
        return "Chưa xử lý"
    }
  }

  const getTypeInfo = (type: string) => {
    return suggestionTypes.find((t) => t.id === type) || suggestionTypes[3]
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Góp ý kiến</h2>
        <p className="text-gray-600 mt-2">Chia sẻ ý kiến để cải thiện hoạt động Đoàn</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Danh sách góp ý
        </button>
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "new" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Góp ý mới
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-4">
          {mockSuggestions.map((suggestion) => {
            const typeInfo = getTypeInfo(suggestion.type)
            return (
              <Card key={suggestion.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getStatusIcon(suggestion.status)}
                          {getStatusText(suggestion.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{suggestion.content}</p>

                  {suggestion.adminReply && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Phản hồi từ Ban Chấp hành</span>
                      </div>
                      <p className="text-amber-700">{suggestion.adminReply}</p>
                      <p className="text-xs text-amber-600 mt-2">{suggestion.repliedAt}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">Gửi ngày: {suggestion.createdAt}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-600" />
              Gửi góp ý mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề góp ý..."
                value={newSuggestion.title}
                onChange={(e) => setNewSuggestion((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label>Loại góp ý</Label>
              <RadioGroup
                value={newSuggestion.type}
                onValueChange={(value) => setNewSuggestion((prev) => ({ ...prev, type: value }))}
                className="mt-2"
              >
                {suggestionTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <Label htmlFor={type.id}>{type.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="content">Nội dung góp ý</Label>
              <Textarea
                id="content"
                placeholder="Mô tả chi tiết góp ý của bạn..."
                value={newSuggestion.content}
                onChange={(e) => setNewSuggestion((prev) => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px] mt-2"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newSuggestion.title || !newSuggestion.content || !newSuggestion.type}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi góp ý"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
