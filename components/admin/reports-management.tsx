"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, Calendar, Award, TrendingUp, Download, RefreshCw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com"

export function ReportsManagement() {
  const [stats, setStats] = useState({ users: 0, activities: 0, units: 0, totalPoints: 0 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      console.log("[ReportsManagement] Token:", token ? "exists" : "MISSING!")
      
      if (!token) {
        console.error("[ReportsManagement] No token found!")
        return
      }
      
      const headers = { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      }
      
      console.log("[ReportsManagement] Fetching stats...")
      const [usersRes, activitiesRes, unitsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/activities`, { headers }),
        fetch(`${API_URL}/api/units`, { headers })
      ])
      console.log("[ReportsManagement] Responses:", usersRes.status, activitiesRes.status, unitsRes.status)
      
      const users = usersRes.ok ? await usersRes.json() : { data: [] }
      const activities = activitiesRes.ok ? await activitiesRes.json() : { data: [] }
      const units = unitsRes.ok ? await unitsRes.json() : { data: [] }
      
      const userList = users.data || users.users || users || []
      const activityList = activities.data || activities.activities || activities || []
      const unitList = units.data || units.units || units || []
      
      setStats({
        users: Array.isArray(userList) ? userList.length : 0,
        activities: Array.isArray(activityList) ? activityList.length : 0,
        units: Array.isArray(unitList) ? unitList.length : 0,
        totalPoints: Array.isArray(userList) ? userList.reduce((sum: number, u: any) => sum + (u.points || 0), 0) : 0
      })
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{loading ? "..." : value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Báo cáo & Thống kê</h2>
          <p className="text-muted-foreground">Tổng quan hoạt động hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats}><RefreshCw className="h-4 w-4" /></Button>
          <Button><Download className="h-4 w-4 mr-2" />Xuất báo cáo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng đoàn viên" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard title="Hoạt động" value={stats.activities} icon={Calendar} color="bg-green-500" />
        <StatCard title="Chi đoàn" value={stats.units} icon={BarChart3} color="bg-purple-500" />
        <StatCard title="Tổng điểm" value={stats.totalPoints.toLocaleString()} icon={Award} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Hoạt động theo tháng</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Biểu đồ thống kê</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Phân bố đoàn viên</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Biểu đồ phân bố</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
