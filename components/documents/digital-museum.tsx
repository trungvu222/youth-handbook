"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ImageIcon, Video, Calendar, Eye, Download, Play } from "lucide-react"

type MuseumItem = {
  id: string
  title: string
  description: string
  type: "image" | "video"
  category: string
  date: string
  location: string
  photographer: string
  tags: string[]
  thumbnail: string
  url: string
}

export function DigitalMuseum() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const museumItems: MuseumItem[] = [
    {
      id: "1",
      title: "Lễ kỷ niệm 94 năm thành lập Đoàn",
      description: "Hình ảnh từ lễ kỷ niệm 94 năm ngày thành lập Đoàn TNCS Hồ Chí Minh",
      type: "image",
      category: "Sự kiện",
      date: "2024-03-26",
      location: "Hội trường trường",
      photographer: "Ban Truyền thông",
      tags: ["Kỷ niệm", "Đoàn", "Lễ hội"],
      thumbnail: "/museum-anniversary.jpg",
      url: "/museum/anniversary-2024.zip",
    },
    {
      id: "2",
      title: "Hoạt động tình nguyện mùa hè xanh",
      description: "Video ghi lại các hoạt động tình nguyện trong chương trình mùa hè xanh",
      type: "video",
      category: "Tình nguyện",
      date: "2024-07-15",
      location: "Các tỉnh miền núi",
      photographer: "Đội hình tình nguyện",
      tags: ["Tình nguyện", "Mùa hè xanh", "Miền núi"],
      thumbnail: "/museum-volunteer.jpg",
      url: "/museum/summer-volunteer-2024.mp4",
    },
    {
      id: "3",
      title: "Đại hội Chi Đoàn nhiệm kỳ 2024-2027",
      description: "Hình ảnh từ Đại hội Chi Đoàn khóa mới nhiệm kỳ 2024-2027",
      type: "image",
      category: "Đại hội",
      date: "2024-01-20",
      location: "Phòng hội thảo A",
      photographer: "Ban Tổ chức",
      tags: ["Đại hội", "Chi Đoàn", "Nhiệm kỳ mới"],
      thumbnail: "/museum-congress.jpg",
      url: "/museum/congress-2024.zip",
    },
    {
      id: "4",
      title: "Cuộc thi tìm hiểu lịch sử Đảng",
      description: "Video highlights từ cuộc thi tìm hiểu lịch sử Đảng Cộng sản Việt Nam",
      type: "video",
      category: "Thi đấu",
      date: "2024-05-19",
      location: "Hội trường B",
      photographer: "Ban Tuyên giáo",
      tags: ["Thi đấu", "Lịch sử", "Đảng"],
      thumbnail: "/museum-contest.jpg",
      url: "/museum/history-contest-2024.mp4",
    },
  ]

  const categories = ["all", "Sự kiện", "Tình nguyện", "Đại hội", "Thi đấu"]

  const filteredItems = museumItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Bảo tàng số
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Lưu trữ và chia sẻ những khoảnh khắc đáng nhớ trong các hoạt động của Đoàn
          </p>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm trong bảo tàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category === "all" ? "Tất cả" : category}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{museumItems.length}</div>
            <div className="text-sm text-muted-foreground">Tổng mục</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {museumItems.filter((i) => i.type === "image").length}
            </div>
            <div className="text-sm text-muted-foreground">Hình ảnh</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {museumItems.filter((i) => i.type === "video").length}
            </div>
            <div className="text-sm text-muted-foreground">Video</div>
          </CardContent>
        </Card>
      </div>

      {/* Museum Items */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                {item.type === "image" ? (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <div className="relative">
                    <Video className="h-8 w-8 text-muted-foreground" />
                    <Play className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <Badge variant={item.type === "image" ? "secondary" : "default"}>
                    {item.type === "image" ? "Hình ảnh" : "Video"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.date).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍 {item.location}</span>
                  </div>
                  <div className="col-span-2">
                    <span>📸 {item.photographer}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Eye className="h-3 w-3" />
                      Xem
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Download className="h-3 w-3" />
                      Tải
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
