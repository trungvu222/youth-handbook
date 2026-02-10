"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Plus, 
  Minus, 
  Settings, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Users,
  Star,
  Search,
  Download,
  Award,
  Target,
  Calendar,
  Loader2,
  RefreshCw,
  Save,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { BACKEND_URL } from '@/lib/config'
import { useToast } from '@/hooks/use-toast'

// Default config
const DEFAULT_POINTS_CONFIG = {
  initialPoints: 100,
  maxPoints: 1000,
  minPoints: 0,
  excellentThreshold: 800,
  goodThreshold: 600,
  averageThreshold: 400,
  poorThreshold: 200
}

const RAW_API_URL = BACKEND_URL;
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '') + '/api';

interface Member {
  id: string;
  fullName: string;
  email: string;
  unitName: string;
  points: number;
  rank: string;
}

interface PointHistory {
  id: string;
  memberName: string;
  memberUnit: string;
  action: 'add' | 'subtract';
  points: number;
  reason: string;
  type: string;
  date: string;
}

interface Unit {
  id: string;
  name: string;
}

interface Stats {
  totalPoints: number;
  avgPoints: number;
  maxPoints: number;
  excellentCount: number;
  totalMembers: number;
}

export function PointsManagement() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMember, setSelectedMember] = useState("")
  const [pointsAmount, setPointsAmount] = useState("")
  const [reason, setReason] = useState("")
  const [category, setCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel' | 'word' | 'ppt'>('excel')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  // Data states
  const [members, setMembers] = useState<Member[]>([])
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [stats, setStats] = useState<Stats>({ totalPoints: 0, avgPoints: 0, maxPoints: 0, excellentCount: 0, totalMembers: 0 })
  
  // Pagination logic
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => b.points - a.points)
  }, [members])
  
  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE)
  
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedMembers, currentPage])
  
  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterUnit])
  
  // Config state
  const [pointsConfig, setPointsConfig] = useState(DEFAULT_POINTS_CONFIG)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [error, setError] = useState("")
  
  // getAuthToken first (needed for config loading)
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    }
    return null;
  }
  
  // Load config from database on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = getAuthToken()
        const res = await fetch(`${BACKEND_URL}/api/points/config`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            setPointsConfig({
              initialPoints: data.data.initialPoints,
              maxPoints: data.data.maxPoints,
              minPoints: data.data.minPoints,
              excellentThreshold: data.data.excellentThreshold,
              goodThreshold: data.data.goodThreshold,
              averageThreshold: data.data.averageThreshold,
              poorThreshold: data.data.poorThreshold
            })
          }
        }
      } catch (e) {
        console.error('Error loading points config:', e)
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [])
  
  // Save config handler - save to database
  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${BACKEND_URL}/api/points/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pointsConfig)
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast({
          title: "Đã lưu cấu hình",
          description: "Cấu hình điểm rèn luyện đã được lưu vào database.",
        })
      } else {
        throw new Error(data.error || 'Lưu cấu hình thất bại')
      }
    } catch (err: any) {
      console.error('Error saving config:', err)
      toast({
        title: "Lỗi",
        description: err.message || "Không thể lưu cấu hình. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterUnit && filterUnit !== 'all') params.append('unitId', filterUnit);
      
      const response = await fetch(`${API_BASE_URL}/points/leaderboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // Đảm bảo luôn lấy data mới
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data);
        setStats(data.stats);
        setError(""); // Clear lỗi nếu có
      } else {
        setError(data.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // Đảm bảo luôn lấy data mới
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPointsHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/units`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUnits(data.data);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchHistory();
    fetchUnits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterUnit]);

  const pointCategories = [
    { value: "hoat_dong", label: "Hoạt động tình nguyện" },
    { value: "hoc_tap", label: "Thành tích học tập" },
    { value: "thi_dua", label: "Thành tích thi đua" },
    { value: "sinh_hoat", label: "Tham gia sinh hoạt" },
    { value: "vi_pham", label: "Vi phạm nội quy" },
    { value: "khac", label: "Khác" },
  ]

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'KHA': return 'bg-green-100 text-green-800 border-green-200';
      case 'TRUNG_BINH': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'YEU': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankText = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'Xuất sắc';
      case 'KHA': return 'Khá';
      case 'TRUNG_BINH': return 'Trung bình';
      case 'YEU': return 'Yếu';
      default: return 'Chưa xếp loại';
    }
  };

  const handleAddPoints = async () => {
    if (!selectedMember || !pointsAmount || !reason) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setActionLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedMember,
          points: parseInt(pointsAmount),
          reason,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Cộng điểm thành công",
          description: data.message,
        });
        setSelectedMember("");
        setPointsAmount("");
        setReason("");
        setCategory("");
        fetchLeaderboard();
        fetchHistory();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || 'Có lỗi xảy ra',
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error adding points:', err);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  }

  const handleSubtractPoints = async () => {
    if (!selectedMember || !pointsAmount || !reason) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setActionLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/points/subtract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedMember,
          points: parseInt(pointsAmount),
          reason,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Trừ điểm thành công",
          description: data.message,
        });
        setSelectedMember("");
        setPointsAmount("");
        setReason("");
        setCategory("");
        fetchLeaderboard();
        fetchHistory();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || 'Có lỗi xảy ra',
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error subtracting points:', err);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshLoading(true);
    setError(""); // Clear lỗi trước khi refresh
    
    try {
      // Fetch data mới
      await Promise.all([fetchLeaderboard(), fetchHistory()]);
      
      // Đảm bảo animation hiển đủ lâu để user thấy
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshLoading(false);
    }
  }

  const exportToExcel = () => {
    // Tạo CSV data từ members với proper escaping
    const escapeCSV = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return '""';
      const strValue = String(str);
      // Escape double quotes và wrap trong quotes
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    
    const headers = ['Hạng', 'Họ tên', 'Chi đoàn', 'Điểm', 'Xếp loại']
    const rows = members.map((member, index) => [
      index + 1,
      member.fullName,
      member.unitName,
      member.points,
      getRankText(member.rank)
    ])
    
    // Tạo CSV content với proper formatting
    const csvContent = [
      headers.map(h => escapeCSV(h)).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
    ].join('\r\n')
    
    // Thêm BOM cho UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-diem-ren-luyen-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToWord = () => {
    // Tạo HTML table
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo điểm rèn luyện</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #dc2626; color: white; }
          h1 { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>Báo cáo điểm rèn luyện</h1>
        <p><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        <table>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Họ tên</th>
              <th>Chi đoàn</th>
              <th>Điểm</th>
              <th>Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((member, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${member.fullName}</td>
                <td>${member.unitName}</td>
                <td>${member.points}</td>
                <td>${getRankText(member.rank)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h2>Thống kê</h2>
        <ul>
          <li>Tổng điểm: ${stats.totalPoints.toLocaleString()}</li>
          <li>Điểm trung bình: ${stats.avgPoints}</li>
          <li>Điểm cao nhất: ${stats.maxPoints}</li>
          <li>Số đoàn viên xuất sắc: ${stats.excellentCount}</li>
        </ul>
      </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-diem-ren-luyen-${new Date().toISOString().split('T')[0]}.doc`
    link.click()
  }

  const exportToPPT = () => {
    // Tạo HTML slides-style
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo điểm rèn luyện - Slides</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f0f0f0; }
          .slide { 
            background: white; 
            padding: 40px; 
            margin: 20px auto; 
            max-width: 800px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            page-break-after: always;
          }
          h1 { color: #dc2626; font-size: 2em; }
          h2 { color: #dc2626; font-size: 1.5em; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; }
          .stat-value { font-size: 2em; font-weight: bold; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #dc2626; color: white; }
        </style>
      </head>
      <body>
        <!-- Slide 1: Title -->
        <div class="slide">
          <h1>📊 Báo cáo điểm rèn luyện</h1>
          <p style="font-size: 1.2em; color: #666;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
          <p style="font-size: 1.1em; margin-top: 40px;">Tổng số đoàn viên: <strong>${members.length}</strong></p>
        </div>

        <!-- Slide 2: Statistics -->
        <div class="slide">
          <h2>📈 Thống kê tổng quan</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Tổng điểm</h3>
              <div class="stat-value">${stats.totalPoints.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <h3>Điểm trung bình</h3>
              <div class="stat-value">${stats.avgPoints}</div>
            </div>
            <div class="stat-card">
              <h3>Điểm cao nhất</h3>
              <div class="stat-value">${stats.maxPoints}</div>
            </div>
            <div class="stat-card">
              <h3>Đoàn viên xuất sắc</h3>
              <div class="stat-value">${stats.excellentCount}</div>
            </div>
          </div>
        </div>

        <!-- Slide 3: Top members -->
        <div class="slide">
          <h2>🏆 Bảng xếp hạng</h2>
          <table>
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Họ tên</th>
                <th>Chi đoàn</th>
                <th>Điểm</th>
                <th>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              ${members.slice(0, 10).map((member, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${member.fullName}</td>
                  <td>${member.unitName}</td>
                  <td><strong>${member.points}</strong></td>
                  <td>${getRankText(member.rank)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-powerpoint' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-diem-ren-luyen-${new Date().toISOString().split('T')[0]}.ppt`
    link.click()
  }

  const handleExportReport = () => {
    if (members.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Không có dữ liệu để xuất báo cáo",
        variant: "destructive"
      });
      return
    }

    switch (exportFormat) {
      case 'excel':
        exportToExcel()
        break
      case 'word':
        exportToWord()
        break
      case 'ppt':
        exportToPPT()
        break
    }
    
    setShowExportDialog(false)
  }

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient and pattern */}
      <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-rose-700 rounded-2xl p-8 text-white overflow-hidden shadow-2xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl translate-y-48 -translate-x-48" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Trophy className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Quản lý điểm rèn luyện</h1>
              <p className="text-red-100 text-lg">Quản lý và theo dõi điểm rèn luyện của đoàn viên</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleRefresh}
              disabled={refreshLoading}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-5 py-3 h-12 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
              {refreshLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
            <Button 
              onClick={() => setShowExportDialog(true)}
              className="bg-white text-red-600 px-5 py-3 h-12 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Download className="h-5 w-5 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards with gradients and animations */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 transition-opacity duration-300 ${refreshLoading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="group bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl shadow-lg hover:shadow-2xl p-6 border-t-4 border-red-500 transition-all duration-300 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 font-semibold mb-1 text-sm uppercase tracking-wide">Tổng điểm</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Trophy className={`h-8 w-8 text-white ${refreshLoading ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg hover:shadow-2xl p-6 border-t-4 border-blue-500 transition-all duration-300 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-semibold mb-1 text-sm uppercase tracking-wide">Điểm trung bình</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">{stats.avgPoints}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Target className={`h-8 w-8 text-white ${refreshLoading ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-2xl p-6 border-t-4 border-green-500 transition-all duration-300 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-semibold mb-1 text-sm uppercase tracking-wide">Điểm cao nhất</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">{stats.maxPoints}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Star className={`h-8 w-8 text-white ${refreshLoading ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl shadow-lg hover:shadow-2xl p-6 border-t-4 border-yellow-500 transition-all duration-300 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 font-semibold mb-1 text-sm uppercase tracking-wide">Xuất sắc</p>
              <p className="text-4xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">{stats.excellentCount}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Award className={`h-8 w-8 text-white ${refreshLoading ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl shadow-inner">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Users className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="add-points"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Cộng/Trừ điểm
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <History className="h-4 w-4" />
            Lịch sử
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Settings className="h-4 w-4" />
            Cấu hình
          </TabsTrigger>
        </TabsList>

        {/* Tab Tổng quan */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Search and Filter Section */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đoàn viên theo tên, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 h-14 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 text-base shadow-sm"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="px-6 py-3 h-14 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 font-medium bg-white shadow-sm min-w-[200px]"
                >
                  <option value="all">Tất cả chi đoàn</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative border border-gray-200">
            {/* Loading overlay khi refresh */}
            {refreshLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl shadow-2xl p-8">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-red-600" />
                  <p className="mt-3 text-base text-gray-700 font-semibold">Đang tải dữ liệu mới...</p>
                </div>
              </div>
            )}
            
            <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-xl mr-3 shadow-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                Bảng xếp hạng điểm rèn luyện
                <span className="ml-3 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                  {members.length} đoàn viên
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hạng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Đoàn viên</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Chi đoàn</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Điểm</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Xếp loại</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-gray-500 font-semibold">Chưa có đoàn viên nào</p>
                          <p className="text-gray-400 text-sm mt-1">Hãy thêm đoàn viên trong mục "Quản lý đoàn viên"</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member, index) => {
                      const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                      return (
                        <tr 
                          key={member.id} 
                          className="hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-white shadow-lg transition-transform group-hover:scale-110 ${
                            globalRank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                            globalRank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            globalRank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-red-400 to-red-600'
                          }`}>
                            {globalRank}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl flex items-center justify-center mr-4 shadow-md group-hover:scale-110 transition-transform">
                              <span className="text-red-600 font-bold text-lg">{member.fullName?.charAt(0) || '?'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 text-base">{member.fullName}</span>
                              <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm">
                            {member.unitName}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 group-hover:scale-125 transition-transform" fill="currentColor" />
                            <span className="font-bold text-gray-900 text-lg">{member.points}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border-2 shadow-sm ${getRankColor(member.rank)}`}>
                            {getRankText(member.rank)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} 
                              className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:scale-110" 
                              title="Cộng điểm"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => { setSelectedMember(member.id); setActiveTab("add-points"); }} 
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:scale-110" 
                              title="Trừ điểm"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, members.length)} / {members.length} đoàn viên
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 ${currentPage === page ? 'bg-red-600 hover:bg-red-700' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Cộng/Trừ điểm */}
        <TabsContent value="add-points" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-6 w-6 text-green-600 mr-2" />
              Cộng/Trừ điểm đoàn viên
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="member">Chọn đoàn viên *</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn đoàn viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName} - {member.unitName} ({member.points} điểm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points">Số điểm *</Label>
                <Input 
                  id="points" 
                  type="number" 
                  min="1" 
                  placeholder="Nhập số điểm" 
                  value={pointsAmount} 
                  onChange={(e) => setPointsAmount(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {pointCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="reason">Lý do *</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Nhập lý do cộng/trừ điểm chi tiết..." 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="mt-1" 
                  rows={4} 
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button 
                onClick={handleAddPoints} 
                className="bg-green-600 hover:bg-green-700 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Cộng điểm
              </Button>
              <Button 
                onClick={handleSubtractPoints} 
                variant="outline" 
                className="bg-transparent border-red-500 text-red-600 hover:bg-red-50 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Minus className="h-4 w-4 mr-2" />}
                Trừ điểm
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab Lịch sử */}
        <TabsContent value="history" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="h-5 w-5 text-red-600 mr-2" />
                Lịch sử thay đổi điểm
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {pointsHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có lịch sử thay đổi điểm
                </div>
              ) : (
                pointsHistory.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.action === 'add' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {entry.action === "add" ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">{entry.memberName}</span>
                          <span className="text-sm text-gray-500">{entry.memberUnit}</span>
                          <span className={`font-bold ${entry.action === "add" ? "text-green-600" : "text-red-600"}`}>
                            {entry.action === "add" ? "+" : "-"}{entry.points} điểm
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{entry.reason}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(entry.date).toLocaleDateString("vi-VN")}
                          </span>
                          <Badge variant="outline">{entry.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab Cấu hình */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="h-6 w-6 text-red-600 mr-2" />
              Cấu hình điểm rèn luyện
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Điểm cơ bản</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Điểm khởi điểm đoàn viên mới</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.initialPoints}
                      onChange={(e) => setPointsConfig({...pointsConfig, initialPoints: parseInt(e.target.value) || 0})}
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Điểm tối đa</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.maxPoints}
                      onChange={(e) => setPointsConfig({...pointsConfig, maxPoints: parseInt(e.target.value) || 0})}
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Điểm tối thiểu</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.minPoints}
                      onChange={(e) => setPointsConfig({...pointsConfig, minPoints: parseInt(e.target.value) || 0})}
                      className="mt-1" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Ngưỡng xếp loại</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Xuất sắc (≥)</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.excellentThreshold}
                      onChange={(e) => setPointsConfig({...pointsConfig, excellentThreshold: parseInt(e.target.value) || 0})}
                      className="w-24" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Khá (≥)</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.goodThreshold}
                      onChange={(e) => setPointsConfig({...pointsConfig, goodThreshold: parseInt(e.target.value) || 0})}
                      className="w-24" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Trung bình (≥)</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.averageThreshold}
                      onChange={(e) => setPointsConfig({...pointsConfig, averageThreshold: parseInt(e.target.value) || 0})}
                      className="w-24" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Yếu (&lt;)</Label>
                    <Input 
                      type="number" 
                      value={pointsConfig.poorThreshold}
                      onChange={(e) => setPointsConfig({...pointsConfig, poorThreshold: parseInt(e.target.value) || 0})}
                      className="w-24" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleSaveConfig}
                disabled={savingConfig}
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu cấu hình
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Download className="h-5 w-5 mr-2" />
              Xuất báo cáo điểm rèn luyện
            </DialogTitle>
            <DialogDescription>
              Chọn định dạng file để xuất báo cáo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <button
                onClick={() => setExportFormat('excel')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'excel' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Microsoft Excel</h4>
                    <p className="text-sm text-gray-500">File .csv - Phù hợp với Excel, Google Sheets</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportFormat('word')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'word' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Microsoft Word</h4>
                    <p className="text-sm text-gray-500">File .doc - Báo cáo định dạng văn bản</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportFormat('ppt')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'ppt' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Microsoft PowerPoint</h4>
                    <p className="text-sm text-gray-500">File .ppt - Trình bày slides</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleExportReport}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
