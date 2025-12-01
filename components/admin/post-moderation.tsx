"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Eye, Calendar, User } from "lucide-react"

type Post = {
  id: string
  title: string
  content: string
  author: string
  authorAvatar: string
  submitDate: string
  status: "pending" | "approved" | "rejected"
  category: string
  attachments?: string[]
}

export function PostModeration() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [moderationNote, setModerationNote] = useState("")

  const pendingPosts: Post[] = [
    {
      id: "1",
      title: "Chia sẻ kinh nghiệm tham gia hoạt động tình nguyện",
      content: "Trong chuyến đi tình nguyện vừa qua, tôi đã có những trải nghiệm rất ý nghĩa...",
      author: "Nguyễn Văn An",
      authorAvatar: "",
      submitDate: "2024-12-15",
      status: "pending",
      category: "Chia sẻ kinh nghiệm",
    },
    {
      id: "2",
      title: "Đề xuất cải thiện hoạt động sinh hoạt Chi Đoàn",
      content: "Tôi xin đề xuất một số ý kiến để cải thiện chất lượng sinh hoạt Chi Đoàn...",
      author: "Trần Thị Bình",
      authorAvatar: "",
      submitDate: "2024-12-14",
      status: "pending",
      category: "Đề xuất",
    },
    {
      id: "3",
      title: "Báo cáo hoạt động nhóm nghiên cứu",
      content: "Nhóm nghiên cứu của chúng tôi đã hoàn thành dự án về...",
      author: "Lê Văn Cường",
      authorAvatar: "",
      submitDate: "2024-12-13",
      status: "pending",
      category: "Báo cáo",
    },
  ]

  const handleApprove = (postId: string) => {
    console.log("Approve post:", postId, "Note:", moderationNote)
    setModerationNote("")
  }

  const handleReject = (postId: string) => {
    console.log("Reject post:", postId, "Note:", moderationNote)
    setModerationNote("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt"
      case "approved":
        return "Đã duyệt"
      case "rejected":
        return "Từ chối"
      default:
        return status
    }
  }

  if (selectedPost) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
            <Eye className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Chi tiết bài viết</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{selectedPost.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedPost.authorAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedPost.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{selectedPost.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedPost.submitDate).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(selectedPost.status)}>{getStatusText(selectedPost.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Nội dung bài viết</h4>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Danh mục</h4>
              <Badge variant="outline">{selectedPost.category}</Badge>
            </div>

            {selectedPost.status === "pending" && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-2">Ghi chú kiểm duyệt</h4>
                  <Textarea
                    placeholder="Nhập ghi chú cho tác giả (tùy chọn)"
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(selectedPost.id)} className="gap-2">
                    <Check className="h-4 w-4" />
                    Duyệt bài
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedPost.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Kiểm duyệt bài viết</h2>
        <Badge variant="secondary">{pendingPosts.length} bài chờ duyệt</Badge>
      </div>

      <div className="space-y-3">
        {pendingPosts.map((post) => (
          <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                  <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                    <Badge className={getStatusColor(post.status)}>{getStatusText(post.status)}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.submitDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)} className="gap-2">
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Button>
                      {post.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(post.id)} className="gap-2">
                            <Check className="h-4 w-4" />
                            Duyệt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(post.id)}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
