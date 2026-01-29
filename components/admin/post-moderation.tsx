"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, X, Eye, Calendar, User, RefreshCw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com"

interface Post {
  id: string
  title: string
  content: string
  status: string
  postType: string
  createdAt: string
  author?: { fullName: string }
}

export function PostModeration() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [moderationNote, setModerationNote] = useState("")

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.data || data.posts || data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleModerate = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast({ title: status === "APPROVED" ? "Đã duyệt" : "Đã từ chối" })
        fetchPosts()
        setShowDetailDialog(false)
      }
    } catch (error) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: "secondary", label: "Nháp" },
      PENDING: { variant: "warning", label: "Chờ duyệt" },
      APPROVED: { variant: "default", label: "Đã duyệt" },
      REJECTED: { variant: "destructive", label: "Từ chối" }
    }
    const s = map[status] || { variant: "outline", label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      ANNOUNCEMENT: "Thông báo", NEWS: "Tin tức", SUGGESTION: "Góp ý"
    }
    return <Badge variant="outline">{map[type] || type}</Badge>
  }

  const pendingPosts = posts.filter(p => p.status === "PENDING")

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Duyệt bài viết</h2>
          <p className="text-muted-foreground">{pendingPosts.length} bài chờ duyệt</p>
        </div>
        <Button variant="outline" onClick={fetchPosts}><RefreshCw className="h-4 w-4 mr-2" />Làm mới</Button>
      </div>

      {pendingPosts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-orange-600">Chờ duyệt ({pendingPosts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pendingPosts.map(post => (
              <div key={post.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.title}</h3>
                      {getTypeBadge(post.postType)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author?.fullName || "Ẩn danh"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedPost(post); setShowDetailDialog(true) }}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="default" onClick={() => handleModerate(post.id, "APPROVED")}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleModerate(post.id, "REJECTED")}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Tất cả bài viết ({posts.length})</CardTitle></CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có bài viết nào</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.author?.fullName} • {new Date(post.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedPost(post); setShowDetailDialog(true) }}><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Chi tiết bài viết</DialogTitle></DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedPost.postType)}
                {getStatusBadge(selectedPost.status)}
              </div>
              <h3 className="text-xl font-bold">{selectedPost.title}</h3>
              <div className="text-sm text-muted-foreground">
                Tác giả: {selectedPost.author?.fullName || "Ẩn danh"} • {new Date(selectedPost.createdAt).toLocaleString("vi-VN")}
              </div>
              <div className="p-4 bg-muted rounded-lg max-h-60 overflow-auto">
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              {selectedPost.status === "PENDING" && (
                <Textarea placeholder="Ghi chú (tùy chọn)" value={moderationNote} onChange={e => setModerationNote(e.target.value)} />
              )}
            </div>
          )}
          <DialogFooter>
            {selectedPost?.status === "PENDING" && (
              <>
                <Button variant="destructive" onClick={() => handleModerate(selectedPost.id, "REJECTED")}><X className="h-4 w-4 mr-2" />Từ chối</Button>
                <Button onClick={() => handleModerate(selectedPost.id, "APPROVED")}><Check className="h-4 w-4 mr-2" />Duyệt</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
