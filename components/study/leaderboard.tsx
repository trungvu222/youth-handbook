"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"

export function Leaderboard() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Nguyễn Văn An",
      avatar: "",
      unit: "Chi Đoàn A",
      totalScore: 950,
      completedQuizzes: 12,
      averageScore: 92,
    },
    {
      rank: 2,
      name: "Trần Thị Bình",
      avatar: "",
      unit: "Chi Đoàn B",
      totalScore: 920,
      completedQuizzes: 11,
      averageScore: 89,
    },
    {
      rank: 3,
      name: "Lê Văn Cường",
      avatar: "",
      unit: "Chi Đoàn A",
      totalScore: 890,
      completedQuizzes: 10,
      averageScore: 87,
    },
    {
      rank: 4,
      name: "Phạm Thị Dung",
      avatar: "",
      unit: "Chi Đoàn C",
      totalScore: 875,
      completedQuizzes: 10,
      averageScore: 85,
    },
    {
      rank: 5,
      name: "Hoàng Văn Em",
      avatar: "",
      unit: "Chi Đoàn B",
      totalScore: 860,
      completedQuizzes: 9,
      averageScore: 84,
    },
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bảng xếp hạng học tập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboardData.map((user) => (
            <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-lg border ${getRankColor(user.rank)}`}>
              <div className="flex items-center justify-center w-8 h-8">{getRankIcon(user.rank)}</div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.unit}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-lg">{user.totalScore}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {user.completedQuizzes} bài
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    TB: {user.averageScore}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
