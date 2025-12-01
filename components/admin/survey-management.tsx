"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, BarChart3, Users, Calendar } from "lucide-react"

type Survey = {
  id: string
  title: string
  description: string
  questions: number
  responses: number
  status: "draft" | "active" | "closed"
  createdDate: string
  endDate: string
  isAnonymous: boolean
}

export function SurveyManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    isAnonymous: false,
    endDate: "",
  })
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const handleEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey)
    setNewSurvey({
      title: survey.title,
      description: survey.description,
      isAnonymous: survey.isAnonymous,
      endDate: survey.endDate,
    })
    setShowCreateForm(true)
  }

  const handleDeleteSurvey = (surveyId: string) => {
    setShowDeleteConfirm(surveyId)
  }

  const confirmDeleteSurvey = () => {
    console.log('Deleting survey:', showDeleteConfirm)
    setShowDeleteConfirm(null)
  }

  const surveys: Survey[] = [
    {
      id: "1",
      title: "Đánh giá chất lượng hoạt động Đoàn",
      description: "Khảo sát ý kiến về chất lượng các hoạt động của Đoàn trong tháng qua",
      questions: 10,
      responses: 45,
      status: "active",
      createdDate: "2024-12-01",
      endDate: "2024-12-31",
      isAnonymous: true,
    },
    {
      id: "2",
      title: "Góp ý cải thiện sinh hoạt Chi Đoàn",
      description: "Thu thập ý kiến đóng góp để cải thiện chất lượng sinh hoạt Chi Đoàn",
      questions: 8,
      responses: 23,
      status: "active",
      createdDate: "2024-11-15",
      endDate: "2024-12-25",
      isAnonymous: false,
    },
    {
      id: "3",
      title: "Khảo sát nhu cầu đào tạo",
      description: "Tìm hiểu nhu cầu đào tạo và phát triển kỹ năng của đoàn viên",
      questions: 12,
      responses: 67,
      status: "closed",
      createdDate: "2024-10-01",
      endDate: "2024-11-30",
      isAnonymous: true,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Bản nháp"
      case "active":
        return "Đang mở"
      case "closed":
        return "Đã đóng"
      default:
        return status
    }
  }

  const handleCreateSurvey = () => {
    console.log("Create survey:", newSurvey)
    setNewSurvey({ title: "", description: "", isAnonymous: false, endDate: "" })
    setShowCreateForm(false)
  }

  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Tạo khảo sát mới</h2>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Hủy
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề khảo sát</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề khảo sát"
                value={newSurvey.title}
                onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả khảo sát"
                value={newSurvey.description}
                onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={newSurvey.endDate}
                onChange={(e) => setNewSurvey({ ...newSurvey, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={newSurvey.isAnonymous}
                onCheckedChange={(checked) => setNewSurvey({ ...newSurvey, isAnonymous: checked })}
              />
              <Label htmlFor="anonymous">Khảo sát ẩn danh</Label>
            </div>
            <Button onClick={handleCreateSurvey} className="w-full">
              Tạo khảo sát
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý khảo sát</h2>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo khảo sát
        </Button>
      </div>

      <div className="space-y-3">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{survey.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{survey.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(survey.status)}>{getStatusText(survey.status)}</Badge>
                  {survey.isAnonymous && <Badge variant="outline">Ẩn danh</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{survey.questions} câu hỏi</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{survey.responses} phản hồi</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Đến {new Date(survey.endDate).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Tạo: {new Date(survey.createdDate).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <BarChart3 className="h-4 w-4" />
                    Kết quả
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-transparent"
                    onClick={() => handleEditSurvey(survey)}
                  >
                    <Edit className="h-4 w-4" />
                    Sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDeleteSurvey(survey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
