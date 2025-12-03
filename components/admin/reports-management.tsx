"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, Calendar, Award, TrendingUp, Download, RefreshCw } from "lucide-react"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

interface UnitData {
  id: string;
  name: string;
  memberCount?: number;
}

interface ActivityData {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime?: string;
}

export function ReportsManagement() {
  const [stats, setStats] = useState({ users: 0, activities: 0, units: 0, totalPoints: 0 })
  const [unitData, setUnitData] = useState<UnitData[]>([])
  const [activityData, setActivityData] = useState<{month: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      
      if (!token) {
        console.error("[ReportsManagement] No token found!")
        return
      }
      
      const headers = { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      }
      
      const [usersRes, activitiesRes, unitsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/activities`, { headers }),
        fetch(`${API_URL}/api/units`, { headers })
      ])
      
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

      // Process unit data for chart
      if (Array.isArray(unitList)) {
        const unitsWithCount = unitList.map((unit: any) => ({
          id: unit.id,
          name: unit.name,
          memberCount: Array.isArray(userList) ? userList.filter((u: any) => u.unitId === unit.id).length : 0
        }))
        setUnitData(unitsWithCount)
      }

      // Process activity data by month
      if (Array.isArray(activityList)) {
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
        const monthCounts = months.map((month, idx) => ({
          month,
          count: activityList.filter((a: any) => {
            const date = new Date(a.startTime || a.createdAt)
            return date.getMonth() === idx
          }).length
        }))
        setActivityData(monthCounts)
      }
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

  // Simple bar chart component
  const SimpleBarChart = ({ data, labelKey, valueKey, color }: { data: any[], labelKey: string, valueKey: string, color: string }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey]), 1)
    return (
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-16 text-sm text-gray-600 truncate">{item[labelKey]}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-full ${color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max((item[valueKey] / maxValue) * 100, 5)}%` }}
              >
                <span className="text-white text-xs font-medium">{item[valueKey]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Hoạt động theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : activityData.length > 0 ? (
              <SimpleBarChart 
                data={activityData.filter(d => d.count > 0).length > 0 ? activityData : [{month: 'T12', count: stats.activities}]} 
                labelKey="month" 
                valueKey="count" 
                color="bg-green-500" 
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Phân bố đoàn viên theo chi đoàn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : unitData.length > 0 ? (
              <SimpleBarChart 
                data={unitData} 
                labelKey="name" 
                valueKey="memberCount" 
                color="bg-blue-500" 
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
