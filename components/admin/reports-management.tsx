"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, Calendar, Award, TrendingUp, Download, RefreshCw, PieChart } from "lucide-react"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://youth-handbook.onrender.com";
const API_URL = RAW_API_URL.replace(/\/api\/?$/, '')

interface UnitData {
  id: string;
  name: string;
  memberCount?: number;
}

// Animated counter hook
function useAnimatedNumber(target: number, duration: number = 1000) {
  const [current, setCurrent] = useState(0)
  
  useEffect(() => {
    if (target === 0) return setCurrent(0)
    
    const startTime = Date.now()
    const startValue = current
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const value = Math.floor(startValue + (target - startValue) * easeOutQuart)
      
      setCurrent(value)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [target, duration])
  
  return current
}

// Gradient colors for charts
const gradientColors = [
  { start: '#667eea', end: '#764ba2' },
  { start: '#f093fb', end: '#f5576c' },
  { start: '#4facfe', end: '#00f2fe' },
  { start: '#43e97b', end: '#38f9d7' },
  { start: '#fa709a', end: '#fee140' },
]

export function ReportsManagement() {
  const [stats, setStats] = useState({ users: 0, activities: 0, units: 0, totalPoints: 0 })
  const [unitData, setUnitData] = useState<UnitData[]>([])
  const [activityData, setActivityData] = useState<{month: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [animateCharts, setAnimateCharts] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredPie, setHoveredPie] = useState<number | null>(null)
  
  // Animated numbers
  const animatedUsers = useAnimatedNumber(stats.users, 1500)
  const animatedActivities = useAnimatedNumber(stats.activities, 1500)
  const animatedUnits = useAnimatedNumber(stats.units, 1500)
  const animatedPoints = useAnimatedNumber(stats.totalPoints, 2000)

  const fetchStats = async () => {
    setLoading(true)
    setAnimateCharts(false)
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
      // Trigger chart animations after data loads
      setTimeout(() => setAnimateCharts(true), 100)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const StatCard = ({ title, value, icon: Icon, gradient, delay }: any) => (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="pt-6 relative">
        <div 
          className="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})` }}
        />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{loading ? "..." : value.toLocaleString()}</p>
          </div>
          <div 
            className="p-3 rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
            style={{ background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})` }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Animated vertical bar chart
  const AnimatedBarChart = ({ data }: { data: {month: string, count: number}[] }) => {
    const maxValue = Math.max(...data.map(d => d.count), 1)
    
    return (
      <div className="h-64 flex items-end justify-between gap-1 px-2">
        {data.map((item, idx) => {
          const height = (item.count / maxValue) * 100
          const isHovered = hoveredBar === idx
          
          return (
            <div 
              key={idx} 
              className="flex flex-col items-center flex-1 cursor-pointer"
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="relative w-full flex justify-center mb-2">
                {/* Tooltip */}
                <div 
                  className={`absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-all duration-200 whitespace-nowrap ${
                    isHovered ? 'opacity-100 transform -translate-y-1' : 'opacity-0'
                  }`}
                >
                  {item.count} hoạt động
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full max-w-[30px] rounded-t-lg transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ 
                    height: animateCharts ? `${Math.max(height, 5)}%` : '0%',
                    background: `linear-gradient(to top, ${gradientColors[idx % 5].start}, ${gradientColors[idx % 5].end})`,
                    transitionDelay: `${idx * 50}ms`,
                    transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                    boxShadow: isHovered ? '0 -4px 20px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  {/* Shine effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{
                      transform: animateCharts ? 'translateX(100%)' : 'translateX(-100%)',
                      transition: 'transform 1s ease-out',
                      transitionDelay: `${idx * 50 + 500}ms`
                    }}
                  />
                </div>
              </div>
              
              {/* Label */}
              <span className={`text-xs transition-all duration-200 ${isHovered ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                {item.month}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Animated donut/pie chart
  const AnimatedDonutChart = ({ data }: { data: UnitData[] }) => {
    const total = data.reduce((sum, d) => sum + (d.memberCount || 0), 0)
    let currentAngle = 0
    
    const segments = data.map((item, idx) => {
      const percentage = total > 0 ? ((item.memberCount || 0) / total) * 100 : 0
      const angle = (percentage / 100) * 360
      const segment = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: gradientColors[idx % 5]
      }
      currentAngle += angle
      return segment
    })

    // Create SVG path for donut segment
    const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
      const startRad = (startAngle - 90) * Math.PI / 180
      const endRad = (endAngle - 90) * Math.PI / 180
      
      const x1 = 100 + outerRadius * Math.cos(startRad)
      const y1 = 100 + outerRadius * Math.sin(startRad)
      const x2 = 100 + outerRadius * Math.cos(endRad)
      const y2 = 100 + outerRadius * Math.sin(endRad)
      const x3 = 100 + innerRadius * Math.cos(endRad)
      const y3 = 100 + innerRadius * Math.sin(endRad)
      const x4 = 100 + innerRadius * Math.cos(startRad)
      const y4 = 100 + innerRadius * Math.sin(startRad)
      
      const largeArc = endAngle - startAngle > 180 ? 1 : 0
      
      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
    }

    return (
      <div className="flex items-center justify-center gap-6">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            <defs>
              {segments.map((seg, idx) => (
                <linearGradient key={idx} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={seg.color.start} />
                  <stop offset="100%" stopColor={seg.color.end} />
                </linearGradient>
              ))}
            </defs>
            
            {segments.map((seg, idx) => {
              const isHovered = hoveredPie === idx
              const innerR = isHovered ? 45 : 50
              const outerR = isHovered ? 95 : 90
              
              return (
                <path
                  key={idx}
                  d={createArc(seg.startAngle, animateCharts ? seg.endAngle : seg.startAngle, innerR, outerR)}
                  fill={`url(#gradient-${idx})`}
                  className="transition-all duration-500 ease-out cursor-pointer"
                  style={{ 
                    transitionDelay: `${idx * 100}ms`,
                    filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: 'center'
                  }}
                  onMouseEnter={() => setHoveredPie(idx)}
                  onMouseLeave={() => setHoveredPie(null)}
                />
              )
            })}
            
            {/* Center circle */}
            <circle cx="100" cy="100" r="40" fill="white" className="dark:fill-gray-900" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-gray-500">Đoàn viên</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                hoveredPie === idx ? 'transform translate-x-1' : ''
              }`}
              onMouseEnter={() => setHoveredPie(idx)}
              onMouseLeave={() => setHoveredPie(null)}
            >
              <div 
                className="w-3 h-3 rounded-full transition-transform duration-200"
                style={{ 
                  background: `linear-gradient(135deg, ${seg.color.start}, ${seg.color.end})`,
                  transform: hoveredPie === idx ? 'scale(1.3)' : 'scale(1)'
                }}
              />
              <span className={`text-sm transition-all duration-200 ${
                hoveredPie === idx ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}>
                {seg.name}: <span className="font-medium">{seg.memberCount}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Báo cáo & Thống kê
          </h2>
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
          <Button variant="outline" onClick={fetchStats} className="group">
            <RefreshCw className="h-4 w-4 group-hover:animate-spin" />
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Download className="h-4 w-4 mr-2" />Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng đoàn viên" value={animatedUsers} icon={Users} gradient={gradientColors[0]} />
        <StatCard title="Hoạt động" value={animatedActivities} icon={Calendar} gradient={gradientColors[3]} />
        <StatCard title="Chi đoàn" value={animatedUnits} icon={BarChart3} gradient={gradientColors[1]} />
        <StatCard title="Tổng điểm" value={animatedPoints} icon={Award} gradient={gradientColors[4]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Hoạt động theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : activityData.length > 0 ? (
              <AnimatedBarChart data={activityData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500">
                <PieChart className="h-4 w-4 text-white" />
              </div>
              Phân bố đoàn viên theo chi đoàn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : unitData.length > 0 ? (
              <AnimatedDonutChart data={unitData} />
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
