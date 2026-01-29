"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, BarChart3, FileText, MessageSquare, Star, Lightbulb } from "lucide-react"
import { MemberManagement } from "@/components/admin/member-management"
import { PointsManagement } from "@/components/admin/points-management"
import { PostModeration } from "@/components/admin/post-moderation"
import { SurveyManagement } from "@/components/admin/survey-management"
import { QRGenerator } from "@/components/admin/qr-generator"
import RatingManagement from "@/components/admin/rating-management"
import SuggestionManagement from "@/components/admin/suggestion-management"

interface AdminPanelProps {
  onBack: () => void
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Bảng điều khiển quản trị</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="members">Thành viên</TabsTrigger>
          <TabsTrigger value="points">Điểm số</TabsTrigger>
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="surveys">Khảo sát</TabsTrigger>
          <TabsTrigger value="rating">Xếp loại</TabsTrigger>
          <TabsTrigger value="suggestions">Kiến nghị</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Tổng thành viên</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-muted-foreground">Chi Đoàn</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">23</div>
                    <div className="text-sm text-muted-foreground">Bài viết chờ duyệt</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-muted-foreground">Góp ý mới</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Nguyễn Văn An đã đăng ký tham gia cuộc họp</p>
                    <p className="text-xs text-muted-foreground">5 phút trước</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Bài viết mới cần được duyệt</p>
                    <p className="text-xs text-muted-foreground">15 phút trước</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Trần Thị Bình đã hoàn thành bài kiểm tra</p>
                    <p className="text-xs text-muted-foreground">30 phút trước</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MemberManagement />
        </TabsContent>

        <TabsContent value="points" className="mt-4">
          <PointsManagement />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <PostModeration />
        </TabsContent>

        <TabsContent value="surveys" className="mt-4">
          <SurveyManagement />
        </TabsContent>

        <TabsContent value="rating" className="mt-4">
          <RatingManagement />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <SuggestionManagement />
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <QRGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
