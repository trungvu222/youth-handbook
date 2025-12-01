"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Newspaper, 
  Search,
  Calendar,
  User,
  MessageSquare,
  Eye,
  Megaphone,
  FileText,
  ChevronRight,
  Clock,
  Users
} from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  postType: string
  status: string
  publishedAt?: string
  createdAt: string
  author: {
    id: string
    fullName: string
    role: string
  }
  unit?: {
    id: string
    name: string
  }
}

export default function NewsScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    postType: 'all'
  })

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { postApi } = await import('@/lib/api')
      const result = await postApi.getPosts({
        postType: filters.postType === 'all' ? undefined : filters.postType,
        search: filters.search || undefined,
        limit: 50
      })

      if (result.success && result.data) {
        // Handle different data access patterns
        let postsData = [];
        if (Array.isArray(result.data)) {
          postsData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          postsData = result.data.data;
        } else if (result.data.posts && Array.isArray(result.data.posts)) {
          postsData = result.data.posts;
        }
        
        setPosts(postsData)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('❌ NewsScreen: Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [filters])

  // Load posts when component mounts and when auth changes
  useEffect(() => {
    const checkAndLoad = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        if (token) {
          loadPosts()
        }
      }
    }
    
    checkAndLoad()
    
    // Listen for storage changes (when login happens)
    const handleStorageChange = () => {
      checkAndLoad()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Listen for auth changes
    window.addEventListener('auth_changed', handleStorageChange)
    // Also listen for focus event to refresh on page focus
    window.addEventListener('focus', checkAndLoad)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth_changed', handleStorageChange)
      window.removeEventListener('focus', checkAndLoad)
    }
  }, [])

  const getPostTypeDisplay = (type: string) => {
    const types = {
      'ANNOUNCEMENT': { text: 'Thông báo', color: 'bg-red-100 text-red-800', icon: Megaphone },
      'NEWS': { text: 'Tin tức', color: 'bg-blue-100 text-blue-800', icon: Newspaper },
      'SUGGESTION': { text: 'Kiến nghị', color: 'bg-green-100 text-green-800', icon: MessageSquare }
    }
    return types[type as keyof typeof types] || { text: type, color: 'bg-gray-100 text-gray-800', icon: FileText }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (selectedPost) {
    return (
      <div className="h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedPost(null)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              ← Quay lại
            </Button>
            <Newspaper className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Chi tiết bài viết</h1>
          </div>
        </div>

        {/* Post Detail */}
        <div className="px-6 py-6 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Post Meta */}
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const typeDisplay = getPostTypeDisplay(selectedPost.postType)
                    const TypeIcon = typeDisplay.icon
                    return (
                      <>
                        <Badge className={typeDisplay.color}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeDisplay.text}
                        </Badge>
                        {selectedPost.unit && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {selectedPost.unit.name}
                          </Badge>
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedPost.title}
                </h1>

                {/* Author & Date */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                        {selectedPost.author.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedPost.author.fullName}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedPost.author.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatDateTime(selectedPost.publishedAt || selectedPost.createdAt).date} lúc{' '}
                      {formatDateTime(selectedPost.publishedAt || selectedPost.createdAt).time}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <Newspaper className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Bảng tin</h1>
          <div className="w-6 h-6" /> {/* Spacer */}
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Tin tức và thông báo</h2>
              <p className="text-purple-100 text-sm">
                Cập nhật thông tin mới nhất từ Chi đoàn
              </p>
            </div>
            <Newspaper className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select 
                value={filters.postType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, postType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Loại bài viết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Thông báo</SelectItem>
                  <SelectItem value="NEWS">Tin tức</SelectItem>
                  <SelectItem value="SUGGESTION">Kiến nghị</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Posts List */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có bài viết nào được tìm thấy.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const typeDisplay = getPostTypeDisplay(post.postType)
              const TypeIcon = typeDisplay.icon
              const dateTime = formatDateTime(post.publishedAt || post.createdAt)
              
              return (
                <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Post Type & Unit */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={typeDisplay.color}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeDisplay.text}
                          </Badge>
                          {post.unit && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {post.unit.name}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {truncateContent(post.content)}
                        </p>

                        {/* Author & Date */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>{post.author.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{dateTime.date} {dateTime.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                        className="bg-transparent ml-4"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

