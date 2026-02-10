"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  BarChart3, Users, Calendar, Award, TrendingUp, Download, RefreshCw, PieChart, 
  FileText, FileSpreadsheet, File, Trophy, Medal, Crown, Star, Activity, 
  Clock, CheckCircle, XCircle, AlertCircle, Target, Zap, Heart, Flame
} from "lucide-react"
import { BACKEND_URL } from "@/lib/config"

const RAW_API_URL = BACKEND_URL;
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
  const [filteredStats, setFilteredStats] = useState({ users: 0, activities: 0, units: 0, totalPoints: 0 })
  const [unitData, setUnitData] = useState<UnitData[]>([])
  const [activityData, setActivityData] = useState<{month: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [animateCharts, setAnimateCharts] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredPie, setHoveredPie] = useState<number | null>(null)
  const [allActivities, setAllActivities] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  
  // New: Month and Year selectors
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
  
  // Export dialog
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Animated numbers - use filtered stats
  const animatedUsers = useAnimatedNumber(filteredStats.users, 1500)
  const animatedActivities = useAnimatedNumber(filteredStats.activities, 1500)
  const animatedUnits = useAnimatedNumber(filteredStats.units, 1500)
  const animatedPoints = useAnimatedNumber(filteredStats.totalPoints, 2000)

  // Helper function to check if date is within period
  const isWithinPeriod = (dateStr: string, periodType: string, month?: number, year?: number) => {
    const date = new Date(dateStr)
    const targetMonth = month ?? new Date().getMonth() + 1
    const targetYear = year ?? new Date().getFullYear()
    const now = new Date()
    
    switch (periodType) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo && date <= now
      case 'month':
        return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear
      case 'year':
        return date.getFullYear() === targetYear
      default:
        return true
    }
  }

  // Process data based on period
  const processDataByPeriod = (activities: any[], users: any[], units: any[], periodType: string, month?: number, year?: number) => {
    const targetMonth = month ?? new Date().getMonth() + 1
    const targetYear = year ?? new Date().getFullYear()
    const now = new Date()
    
    // Filter activities by period
    const filteredActivities = activities.filter((a: any) => {
      const dateStr = a.startTime || a.createdAt
      return dateStr && isWithinPeriod(dateStr, periodType, targetMonth, targetYear)
    })
    
    // Filter users by creation date (for new users in period)
    const filteredUsers = users.filter((u: any) => {
      if (!u.createdAt) return true // Include users without createdAt
      return isWithinPeriod(u.createdAt, periodType, targetMonth, targetYear)
    })
    
    // Calculate points earned in period (simplified - show all active users' total)
    const totalPoints = users.reduce((sum: number, u: any) => sum + (u.points || 0), 0)
    
    setFilteredStats({
      users: filteredUsers.length > 0 ? filteredUsers.length : users.length,
      activities: filteredActivities.length,
      units: units.length,
      totalPoints: totalPoints
    })
    
    // Process activity data by month - LAST 12 MONTHS (rolling window)
    const months: {month: string, count: number, year: number, monthIdx: number}[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
      months.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
        count: activities.filter((a: any) => {
          const dateStr = a.startTime || a.createdAt
          if (!dateStr) return false
          const date = new Date(dateStr)
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear()
        }).length
      })
    }
    setActivityData(months.map(m => ({ month: m.month, count: m.count })))
  }

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
        fetch(`${API_URL}/api/users?limit=200`, { headers }),
        fetch(`${API_URL}/api/activities`, { headers }),
        fetch(`${API_URL}/api/units`, { headers })
      ])
      
      const users = usersRes.ok ? await usersRes.json() : { data: [] }
      const activities = activitiesRes.ok ? await activitiesRes.json() : { data: [] }
      const units = unitsRes.ok ? await unitsRes.json() : { data: [] }
      
      const userList = users.users || users.data || users || []
      const activityList = activities.data || activities.activities || activities || []
      const unitList = units.units || units.data || units || []
      const totalUsersCount = users.pagination?.total || (Array.isArray(userList) ? userList.length : 0)
      
      // Store raw data for period filtering
      setAllActivities(Array.isArray(activityList) ? activityList : [])
      setAllUsers(Array.isArray(userList) ? userList : [])
      
      // Set total stats (all time)
      setStats({
        users: totalUsersCount,
        activities: Array.isArray(activityList) ? activityList.length : 0,
        units: Array.isArray(unitList) ? unitList.length : 0,
        totalPoints: Array.isArray(userList) ? userList.reduce((sum: number, u: any) => sum + (u.points || 0), 0) : 0
      })

      // Process unit data for chart - use memberCount from API (accurate) instead of manual filtering
      if (Array.isArray(unitList)) {
        const unitsWithCount = unitList.map((unit: any) => ({
          id: unit.id,
          name: unit.name,
          memberCount: unit.memberCount ?? unit._count?.members ?? (Array.isArray(userList) ? userList.filter((u: any) => u.unitId === unit.id).length : 0)
        }))
        setUnitData(unitsWithCount)
      }

      // Process data by selected period
      processDataByPeriod(
        Array.isArray(activityList) ? activityList : [],
        Array.isArray(userList) ? userList : [],
        Array.isArray(unitList) ? unitList : [],
        period,
        parseInt(selectedMonth),
        parseInt(selectedYear)
      )
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
      // Trigger chart animations after data loads
      setTimeout(() => setAnimateCharts(true), 100)
    }
  }

  // Re-process when period, month, or year changes
  useEffect(() => {
    if (allActivities.length > 0 || allUsers.length > 0) {
      setAnimateCharts(false)
      processDataByPeriod(allActivities, allUsers, unitData, period, parseInt(selectedMonth), parseInt(selectedYear))
      setTimeout(() => setAnimateCharts(true), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedMonth, selectedYear])

  useEffect(() => { fetchStats() }, [])

  const StatCard = ({ title, value, icon: Icon, gradient, delay }: any) => {
    // Extract shadow color from gradient start
    const shadowColor = gradient.start.replace('#', '')
    
    return (
      <div 
        className="overflow-hidden group rounded-xl transition-all duration-300 hover:-translate-y-2 relative"
        style={{ 
          background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
          boxShadow: `0 10px 30px -10px ${gradient.start}80, 0 4px 6px -2px ${gradient.start}40`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90 mb-1">{title}</p>
              <p className="text-4xl font-bold text-white drop-shadow-lg">
                {loading ? "..." : value.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-xl">
              <Icon className="h-7 w-7 text-white drop-shadow-md" />
            </div>
          </div>
        </div>
        {/* Animated shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-[shine_3s_ease-in-out_infinite]"
          style={{
            animationDelay: `${delay}s`
          }}
        />
      </div>
    )
  }

  // Animated vertical bar chart - Always visible with minimum height
  const AnimatedBarChart = ({ data }: { data: {month: string, count: number}[] }) => {
    const maxValue = Math.max(...data.map(d => d.count), 1)
    const hasData = data.some(d => d.count > 0)
    
    return (
      <div className="h-72 flex flex-col">
        {/* Chart area */}
        <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-2 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((_, i) => (
              <div key={i} className="border-b border-gray-100 w-full" />
            ))}
          </div>
          
          {data.map((item, idx) => {
            const height = hasData ? (item.count / maxValue) * 100 : 0
            const isHovered = hoveredBar === idx
            const barHeight = item.count > 0 ? Math.max(height, 8) : 8 // Minimum height of 8%
            
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center flex-1 cursor-pointer z-10 group"
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div className="relative w-full flex justify-center flex-1">
                  {/* Tooltip */}
                  <div 
                    className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap z-20 ${
                      isHovered ? 'opacity-100 transform -translate-y-2 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    <div className="font-semibold">{item.count} hoạt động</div>
                    <div className="text-gray-300 text-[10px]">Tháng {idx + 1}</div>
                    {/* Arrow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
                  </div>
                  
                  {/* Bar container - aligned to bottom */}
                  <div className="absolute bottom-0 w-full flex justify-center">
                    {/* Bar */}
                    <div 
                      className="w-8 rounded-t-xl transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ 
                        height: animateCharts ? `${barHeight * 2}px` : '0px',
                        minHeight: animateCharts ? '16px' : '0px',
                        background: item.count > 0 
                          ? `linear-gradient(180deg, ${gradientColors[idx % 5].end}, ${gradientColors[idx % 5].start})`
                          : 'linear-gradient(180deg, #e5e7eb, #d1d5db)',
                        transitionDelay: `${idx * 80}ms`,
                        transform: isHovered ? 'scaleY(1.1) scaleX(1.15)' : 'scaleY(1) scaleX(1)',
                        transformOrigin: 'bottom',
                        boxShadow: isHovered 
                          ? `0 -8px 25px ${item.count > 0 ? gradientColors[idx % 5].start + '60' : 'rgba(0,0,0,0.15)'}` 
                          : 'none'
                      }}
                    >
                      {/* Shine effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent"
                        style={{ height: '50%' }}
                      />
                      
                      {/* Animated shine sweep */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                        style={{
                          transform: animateCharts ? 'translateX(200%)' : 'translateX(-200%)',
                          transition: 'transform 1.2s ease-out',
                          transitionDelay: `${idx * 80 + 400}ms`
                        }}
                      />
                      
                      {/* Value on bar */}
                      {item.count > 0 && (
                        <div 
                          className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold transition-all duration-300 ${
                            isHovered ? 'opacity-100 scale-110' : 'opacity-70'
                          }`}
                          style={{ color: gradientColors[idx % 5].start }}
                        >
                          {item.count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between px-4 pt-3 border-t border-gray-100">
          {data.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex-1 text-center text-xs font-medium transition-all duration-200 ${
                hoveredBar === idx ? 'text-gray-900 scale-110' : 'text-gray-400'
              }`}
            >
              {item.month}
            </div>
          ))}
        </div>
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

  // Get period label for display
  const getPeriodLabel = () => {
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    switch (period) {
      case 'week': return 'tuần này'
      case 'month': return `${monthNames[parseInt(selectedMonth) - 1]} - Năm ${selectedYear}`
      case 'year': return `Năm ${selectedYear}`
      default: return ''
    }
  }

  // Export functions
  const generateReportData = () => {
    const reportDate = new Date().toLocaleDateString('vi-VN')
    const periodLabel = getPeriodLabel()
    
    return {
      title: `BÁO CÁO THỐNG KÊ HOẠT ĐỘNG ĐOÀN`,
      subtitle: `Kỳ báo cáo: ${periodLabel}`,
      generatedDate: reportDate,
      stats: {
        totalMembers: filteredStats.users,
        totalActivities: filteredStats.activities,
        totalUnits: filteredStats.units,
        totalPoints: filteredStats.totalPoints
      },
      activityByMonth: activityData,
      unitDistribution: unitData,
      allActivities: allActivities.filter((a: any) => {
        const dateStr = a.startTime || a.createdAt
        return dateStr && isWithinPeriod(dateStr, period, parseInt(selectedMonth), parseInt(selectedYear))
      }),
      allUsers: allUsers
    }
  }

  // Export to CSV/Excel
  const exportToExcel = async () => {
    setExporting(true)
    try {
      const data = generateReportData()
      
      // Create CSV content with BOM for Excel UTF-8 support
      const BOM = '\uFEFF'
      let csvContent = BOM
      
      // Header
      csvContent += `${data.title}\n`
      csvContent += `${data.subtitle}\n`
      csvContent += `Ngày xuất: ${data.generatedDate}\n\n`
      
      // Summary stats
      csvContent += `THỐNG KÊ TỔNG QUAN\n`
      csvContent += `Chỉ tiêu,Giá trị\n`
      csvContent += `Tổng đoàn viên,${data.stats.totalMembers}\n`
      csvContent += `Tổng hoạt động,${data.stats.totalActivities}\n`
      csvContent += `Số chi đoàn,${data.stats.totalUnits}\n`
      csvContent += `Tổng điểm,${data.stats.totalPoints}\n\n`
      
      // Activity by month
      csvContent += `HOẠT ĐỘNG THEO THÁNG\n`
      csvContent += `Tháng,Số hoạt động\n`
      data.activityByMonth.forEach(item => {
        csvContent += `${item.month},${item.count}\n`
      })
      csvContent += `\n`
      
      // Unit distribution
      csvContent += `PHÂN BỐ ĐOÀN VIÊN THEO CHI ĐOÀN\n`
      csvContent += `Chi đoàn,Số thành viên\n`
      data.unitDistribution.forEach(unit => {
        csvContent += `${unit.name},${unit.memberCount || 0}\n`
      })
      csvContent += `\n`
      
      // Activity list
      csvContent += `DANH SÁCH HOẠT ĐỘNG\n`
      csvContent += `STT,Tên hoạt động,Ngày bắt đầu,Trạng thái,Điểm\n`
      data.allActivities.forEach((activity: any, idx: number) => {
        const date = activity.startTime ? new Date(activity.startTime).toLocaleDateString('vi-VN') : '-'
        csvContent += `${idx + 1},"${activity.title || activity.name}",${date},${activity.status || '-'},${activity.points || 0}\n`
      })
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `bao-cao-thong-ke-${selectedMonth}-${selectedYear}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setShowExportDialog(false)
    } catch (error) {
      console.error('Export Excel error:', error)
      alert('Có lỗi khi xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  // Export to PDF (simple HTML to PDF)
  const exportToPDF = async () => {
    setExporting(true)
    try {
      const data = generateReportData()
      
      // Create printable HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Báo cáo thống kê</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; color: #1e40af; font-size: 24px; margin-bottom: 5px; }
            h2 { text-align: center; color: #6366f1; font-size: 16px; margin-top: 0; }
            .date { text-align: right; font-style: italic; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 8px 15px; font-weight: bold; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
            .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
            .stat-label { color: #6b7280; font-size: 14px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>${data.title}</h1>
          <h2>${data.subtitle}</h2>
          <p class="date">Ngày xuất báo cáo: ${data.generatedDate}</p>
          
          <div class="section">
            <div class="section-title">I. THỐNG KÊ TỔNG QUAN</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.stats.totalMembers}</div>
                <div class="stat-label">Tổng đoàn viên</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.totalActivities}</div>
                <div class="stat-label">Hoạt động</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.totalUnits}</div>
                <div class="stat-label">Chi đoàn</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.totalPoints.toLocaleString()}</div>
                <div class="stat-label">Tổng điểm</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">II. HOẠT ĐỘNG THEO THÁNG</div>
            <table>
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Số hoạt động</th>
                </tr>
              </thead>
              <tbody>
                ${data.activityByMonth.map(item => `
                  <tr>
                    <td>${item.month}</td>
                    <td>${item.count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">III. PHÂN BỐ ĐOÀN VIÊN THEO CHI ĐOÀN</div>
            <table>
              <thead>
                <tr>
                  <th>Chi đoàn</th>
                  <th>Số thành viên</th>
                </tr>
              </thead>
              <tbody>
                ${data.unitDistribution.map(unit => `
                  <tr>
                    <td>${unit.name}</td>
                    <td>${unit.memberCount || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">IV. DANH SÁCH HOẠT ĐỘNG</div>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên hoạt động</th>
                  <th>Ngày</th>
                  <th>Điểm</th>
                </tr>
              </thead>
              <tbody>
                ${data.allActivities.slice(0, 50).map((activity: any, idx: number) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${activity.title || activity.name || '-'}</td>
                    <td>${activity.startTime ? new Date(activity.startTime).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${activity.points || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${data.allActivities.length > 50 ? `<p style="font-style: italic; color: #6b7280;">... và ${data.allActivities.length - 50} hoạt động khác</p>` : ''}
          </div>
        </body>
        </html>
      `
      
      // Open print dialog
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
      
      setShowExportDialog(false)
    } catch (error) {
      console.error('Export PDF error:', error)
      alert('Có lỗi khi xuất file PDF')
    } finally {
      setExporting(false)
    }
  }

  // Export to Word (HTML download as .doc)
  const exportToWord = async () => {
    setExporting(true)
    try {
      const data = generateReportData()
      
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Times New Roman', serif; }
            h1 { text-align: center; color: #1e40af; }
            h2 { text-align: center; color: #6366f1; }
            .section-title { background: #e0e7ff; padding: 8px; font-weight: bold; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 6px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${data.title}</h1>
          <h2>${data.subtitle}</h2>
          <p style="text-align: right; font-style: italic;">Ngày xuất: ${data.generatedDate}</p>
          
          <div class="section-title">I. THỐNG KÊ TỔNG QUAN</div>
          <table>
            <tr><th>Chỉ tiêu</th><th>Giá trị</th></tr>
            <tr><td>Tổng đoàn viên</td><td>${data.stats.totalMembers}</td></tr>
            <tr><td>Tổng hoạt động</td><td>${data.stats.totalActivities}</td></tr>
            <tr><td>Số chi đoàn</td><td>${data.stats.totalUnits}</td></tr>
            <tr><td>Tổng điểm</td><td>${data.stats.totalPoints.toLocaleString()}</td></tr>
          </table>
          
          <div class="section-title">II. HOẠT ĐỘNG THEO THÁNG</div>
          <table>
            <tr><th>Tháng</th><th>Số hoạt động</th></tr>
            ${data.activityByMonth.map(item => `<tr><td>${item.month}</td><td>${item.count}</td></tr>`).join('')}
          </table>
          
          <div class="section-title">III. PHÂN BỐ ĐOÀN VIÊN THEO CHI ĐOÀN</div>
          <table>
            <tr><th>Chi đoàn</th><th>Số thành viên</th></tr>
            ${data.unitDistribution.map(unit => `<tr><td>${unit.name}</td><td>${unit.memberCount || 0}</td></tr>`).join('')}
          </table>
          
          <div class="section-title">IV. DANH SÁCH HOẠT ĐỘNG</div>
          <table>
            <tr><th>STT</th><th>Tên hoạt động</th><th>Ngày</th><th>Điểm</th></tr>
            ${data.allActivities.map((activity: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${activity.title || activity.name || '-'}</td>
                <td>${activity.startTime ? new Date(activity.startTime).toLocaleDateString('vi-VN') : '-'}</td>
                <td>${activity.points || 0}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `
      
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `bao-cao-thong-ke-${selectedMonth}-${selectedYear}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setShowExportDialog(false)
    } catch (error) {
      console.error('Export Word error:', error)
      alert('Có lỗi khi xuất file Word')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Báo cáo & Thống kê
          </h2>
          <p className="text-muted-foreground">
            Tổng quan hoạt động hệ thống - <span className="font-medium text-blue-600">{getPeriodLabel()}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Month Selector */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Year Selector */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <SelectItem key={y} value={String(y)}>Năm {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xuất báo cáo
            </DialogTitle>
            <DialogDescription>
              Chọn định dạng file bạn muốn xuất báo cáo thống kê
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-16 flex items-center justify-start gap-4 hover:bg-red-50 hover:border-red-300 transition-all text-foreground hover:text-foreground"
              onClick={exportToPDF}
              disabled={exporting}
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">PDF</div>
                <div className="text-xs text-gray-500">Xuất báo cáo dạng PDF (in ấn)</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex items-center justify-start gap-4 hover:bg-green-50 hover:border-green-300 transition-all text-foreground hover:text-foreground"
              onClick={exportToExcel}
              disabled={exporting}
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Excel (CSV)</div>
                <div className="text-xs text-gray-500">Xuất dữ liệu dạng bảng tính</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex items-center justify-start gap-4 hover:bg-blue-50 hover:border-blue-300 transition-all text-foreground hover:text-foreground"
              onClick={exportToWord}
              disabled={exporting}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <File className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Word</div>
                <div className="text-xs text-gray-500">Xuất báo cáo dạng văn bản</div>
              </div>
            </Button>
          </div>
          {exporting && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Đang xuất báo cáo...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng đoàn viên" value={animatedUsers} icon={Users} gradient={gradientColors[0]} delay={0} />
        <StatCard title="Hoạt động" value={animatedActivities} icon={Calendar} gradient={gradientColors[3]} delay={0.5} />
        <StatCard title="Chi đoàn" value={animatedUnits} icon={BarChart3} gradient={gradientColors[1]} delay={1} />
        <StatCard title="Tổng điểm" value={animatedPoints} icon={Award} gradient={gradientColors[4]} delay={1.5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Hoạt động theo tháng (12 tháng gần nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <AnimatedBarChart data={activityData} />
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

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Members by Points */}
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              Top đoàn viên xuất sắc
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers
                  .filter(u => u.role !== 'ADMIN')
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .slice(0, 5)
                  .map((user, idx) => {
                    const medals = [
                      { icon: Crown, color: 'text-yellow-500', bg: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
                      { icon: Medal, color: 'text-gray-400', bg: 'bg-gradient-to-r from-gray-300 to-gray-400' },
                      { icon: Medal, color: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-500 to-orange-600' },
                      { icon: Star, color: 'text-blue-500', bg: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
                      { icon: Star, color: 'text-purple-500', bg: 'bg-gradient-to-r from-purple-400 to-pink-500' },
                    ]
                    const MedalIcon = medals[idx]?.icon || Star
                    const medalColor = medals[idx]?.color || 'text-gray-400'
                    const bgColor = medals[idx]?.bg || 'bg-gray-200'
                    
                    return (
                      <div 
                        key={user.id} 
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                          idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' :
                          idx === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200' :
                          idx === 2 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' :
                          'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shadow-lg`}>
                          <MedalIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.unit?.name || 'Chưa xếp chi đoàn'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                            {(user.points || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">điểm</p>
                        </div>
                      </div>
                    )
                  })}
                {allUsers.filter(u => u.role !== 'ADMIN').length === 0 && (
                  <div className="h-48 flex items-center justify-center text-gray-400">
                    Chưa có dữ liệu đoàn viên
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Status Summary */}
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-violet-400 to-purple-500 shadow-lg shadow-violet-500/30">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Tình trạng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const now = new Date()
                  const completed = allActivities.filter(a => a.status === 'COMPLETED' || new Date(a.endTime || a.startTime) < now).length
                  const ongoing = allActivities.filter(a => {
                    const start = new Date(a.startTime)
                    const end = new Date(a.endTime || a.startTime)
                    return start <= now && end >= now && a.status !== 'COMPLETED'
                  }).length
                  const upcoming = allActivities.filter(a => new Date(a.startTime) > now).length
                  const cancelled = allActivities.filter(a => a.status === 'CANCELLED').length
                  
                  const statusData = [
                    { label: 'Đã hoàn thành', count: completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', gradient: 'from-green-400 to-emerald-500' },
                    { label: 'Đang diễn ra', count: ongoing, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-100', gradient: 'from-orange-400 to-red-500' },
                    { label: 'Sắp tới', count: upcoming, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100', gradient: 'from-blue-400 to-indigo-500' },
                    { label: 'Đã hủy', count: cancelled, icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', gradient: 'from-red-400 to-rose-500' },
                  ]
                  
                  return statusData.map((item, idx) => {
                    const Icon = item.icon
                    const percentage = allActivities.length > 0 ? Math.round((item.count / allActivities.length) * 100) : 0
                    
                    return (
                      <div key={idx} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${item.bg}`}>
                              <Icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.gradient} rounded-full transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities Table */}
      <Card className="hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : allActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hoạt động</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ngày</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Điểm</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {allActivities
                    .sort((a, b) => new Date(b.startTime || b.createdAt).getTime() - new Date(a.startTime || a.createdAt).getTime())
                    .slice(0, 8)
                    .map((activity, idx) => {
                      const date = activity.startTime ? new Date(activity.startTime) : null
                      const now = new Date()
                      const isCompleted = activity.status === 'COMPLETED' || (date && date < now)
                      const isCancelled = activity.status === 'CANCELLED'
                      const isUpcoming = date && date > now
                      
                      return (
                        <tr 
                          key={activity.id} 
                          className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                isCancelled ? 'bg-red-500' :
                                isCompleted ? 'bg-green-500' :
                                isUpcoming ? 'bg-blue-500' : 'bg-orange-500'
                              }`} />
                              <span className="font-medium text-gray-900">{activity.title || activity.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {date ? date.toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-amber-600">{activity.points || 0}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              isCancelled ? 'bg-red-100 text-red-700' :
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {isCancelled ? <XCircle className="h-3 w-3" /> :
                               isCompleted ? <CheckCircle className="h-3 w-3" /> :
                               isUpcoming ? <Clock className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                              {isCancelled ? 'Đã hủy' :
                               isCompleted ? 'Hoàn thành' :
                               isUpcoming ? 'Sắp tới' : 'Đang diễn ra'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Chưa có hoạt động nào
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-blue-100 text-xs">Tỷ lệ hoàn thành</p>
              <p className="text-xl font-bold">
                {allActivities.length > 0 
                  ? Math.round((allActivities.filter(a => a.status === 'COMPLETED').length / allActivities.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-emerald-100 text-xs">Điểm TB/người</p>
              <p className="text-xl font-bold">
                {filteredStats.users > 0 
                  ? Math.round(filteredStats.totalPoints / filteredStats.users)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-violet-100 text-xs">ĐV/Chi đoàn</p>
              <p className="text-xl font-bold">
                {filteredStats.units > 0 
                  ? Math.round(filteredStats.users / filteredStats.units)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-rose-100 text-xs">Tham gia TB</p>
              <p className="text-xl font-bold">
                {filteredStats.users > 0 && filteredStats.activities > 0
                  ? Math.round((filteredStats.activities * 10) / filteredStats.users)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
