'use client'

import { useState, useEffect, useMemo } from 'react'
import { bookApi, Book, BookStats } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Search, Edit, Trash2, RefreshCw, BookOpen, QrCode,
  Users, Calendar, ChevronLeft, ChevronRight, Printer, Download,
  CheckCircle2, Clock, AlertTriangle, FileText, Check, BookPlus,
  ArrowRight, ShieldCheck, UserCheck, X
} from 'lucide-react'

interface BorrowingRecord {
  stt: number
  id: string
  bookId?: string
  userId?: string
  borrower: string
  borrowerUnit: string
  bookTitle: string
  author: string
  publisher: string
  borrowedAt: string
  expectedReturnDate: string | null
  returnedAt: string | null
  status: string
}

interface MemberUser {
  id: string
  fullName: string
  email?: string
  unitName?: string
  code: string
}

// Interactive Date & Time Picker Field
function DateTimePickerField({
  label,
  required,
  value,
  onChange,
  colorClass = 'text-slate-100',
  placeholder = 'Chọn ngày và giờ',
  allowClear = false
}: {
  label: string
  required?: boolean
  value: string
  onChange: (val: string) => void
  colorClass?: string
  placeholder?: string
  allowClear?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<number | 'now' | null>(null)
  
  const parsedDate = useMemo(() => {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }, [value])

  const [tempDate, setTempDate] = useState({
    day: parsedDate ? parsedDate.getDate() : new Date().getDate(),
    month: parsedDate ? parsedDate.getMonth() + 1 : new Date().getMonth() + 1,
    year: parsedDate ? parsedDate.getFullYear() : new Date().getFullYear(),
    hour: parsedDate ? parsedDate.getHours() : 21,
    minute: parsedDate ? parsedDate.getMinutes() : 0,
  })

  useEffect(() => {
    if (isOpen) {
      const d = parsedDate || new Date()
      setTempDate({
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        hour: d.getHours(),
        minute: d.getMinutes()
      })

      if (!parsedDate) {
        setActivePreset(null)
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const target = new Date(parsedDate)
        target.setHours(0, 0, 0, 0)
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) setActivePreset('now')
        else if (diffDays === 3) setActivePreset(3)
        else if (diffDays === 7) setActivePreset(7)
        else if (diffDays === 14) setActivePreset(14)
        else if (diffDays === 30) setActivePreset(30)
        else setActivePreset(null)
      }
    }
  }, [isOpen, parsedDate])

  const applyPreset = (daysOffset: number, presetHour = 21, presetMin = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setTempDate({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      hour: presetHour,
      minute: presetMin
    })
    setActivePreset(daysOffset === 0 ? 'now' : daysOffset)
  }

  const handleConfirm = () => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const isoString = `${tempDate.year}-${pad(tempDate.month)}-${pad(tempDate.day)}T${pad(tempDate.hour)}:${pad(tempDate.minute)}`
    onChange(isoString)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const displayText = useMemo(() => {
    if (!parsedDate) return placeholder
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateStr = `${pad(parsedDate.getDate())}/${pad(parsedDate.getMonth() + 1)}/${parsedDate.getFullYear()}`
    const timeStr = `${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`
    return `${dateStr}, ${timeStr}`
  }, [parsedDate, placeholder])

  const presets = [
    { id: 'now' as const, label: 'Hiện tại', offset: 0, getH: () => new Date().getHours(), getM: () => new Date().getMinutes() },
    { id: 3 as const, label: '+3 ngày', offset: 3, getH: () => 17, getM: () => 0 },
    { id: 7 as const, label: '+7 ngày', offset: 7, getH: () => 21, getM: () => 0 },
    { id: 14 as const, label: '+14 ngày', offset: 14, getH: () => 21, getM: () => 0 },
    { id: 30 as const, label: '+30 ngày', offset: 30, getH: () => 21, getM: () => 0 },
  ]

  const hourChips = [
    { label: '08:00', h: 8, m: 0 },
    { label: '11:30', h: 11, m: 30 },
    { label: '14:00', h: 14, m: 0 },
    { label: '17:00', h: 17, m: 0 },
    { label: '21:00', h: 21, m: 0 },
  ]

  return (
    <div>
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 h-4 truncate">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full h-11 bg-slate-900 border border-slate-700/90 hover:border-amber-500/80 rounded-xl px-3 flex items-center justify-between text-xs font-semibold transition-all shadow-xs group ${
          !parsedDate ? 'text-slate-500' : colorClass
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
          <span className="truncate">{displayText}</span>
        </div>
        <Clock className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-800 bg-[#0f172a] text-slate-100">
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <DialogTitle className="text-base font-bold text-white">
                {label}
              </DialogTitle>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Quick Presets */}
            <div>
              <span className="text-slate-400 font-semibold mb-1.5 block">Chọn nhanh mốc thời gian:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {presets.map(preset => {
                  const isActive = activePreset === preset.id
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.offset, preset.getH(), preset.getM())}
                      className={`px-2 py-1.5 rounded-lg text-center text-xs transition-all border ${
                        isActive
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold shadow-xs ring-1 ring-amber-500/50'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80 font-medium'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Section (Ngày / Tháng / Năm) */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Calendar className="h-4 w-4" />
                <span>Chọn Ngày / Tháng / Năm</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ngày</label>
                  <Select
                    value={String(tempDate.day)}
                    onValueChange={(val) => {
                      setTempDate(prev => ({ ...prev, day: parseInt(val) }))
                      setActivePreset(null)
                    }}
                  >
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[200px]">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <SelectItem key={d} value={String(d)} className="text-xs hover:bg-slate-800">
                          Ngày {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tháng</label>
                  <Select
                    value={String(tempDate.month)}
                    onValueChange={(val) => {
                      setTempDate(prev => ({ ...prev, month: parseInt(val) }))
                      setActivePreset(null)
                    }}
                  >
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={String(m)} className="text-xs hover:bg-slate-800">
                          Tháng {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Năm</label>
                  <Select
                    value={String(tempDate.year)}
                    onValueChange={(val) => {
                      setTempDate(prev => ({ ...prev, year: parseInt(val) }))
                      setActivePreset(null)
                    }}
                  >
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[200px]">
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <SelectItem key={y} value={String(y)} className="text-xs hover:bg-slate-800">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Time Section (Giờ : Phút) */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Clock className="h-4 w-4" />
                <span>Chọn Giờ & Phút</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Giờ (00 - 23)</label>
                  <Select
                    value={String(tempDate.hour)}
                    onValueChange={(val) => setTempDate(prev => ({ ...prev, hour: parseInt(val) }))}
                  >
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map(h => (
                        <SelectItem key={h} value={String(h)} className="text-xs hover:bg-slate-800">
                          {h.toString().padStart(2, '0')} giờ
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phút (00 - 59)</label>
                  <Select
                    value={String(tempDate.minute)}
                    onValueChange={(val) => setTempDate(prev => ({ ...prev, minute: parseInt(val) }))}
                  >
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => i).map(m => (
                        <SelectItem key={m} value={String(m)} className="text-xs hover:bg-slate-800">
                          {m.toString().padStart(2, '0')} phút
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Hour Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 mr-1">Khung giờ:</span>
                {hourChips.map(chip => {
                  const isHourActive = tempDate.hour === chip.h && tempDate.minute === chip.m
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setTempDate(prev => ({ ...prev, hour: chip.h, minute: chip.m }))}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-all ${
                        isHourActive
                          ? 'bg-blue-500/25 text-blue-300 border-blue-500/60 font-bold ring-1 ring-blue-500/50'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Value Preview */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Thời gian đã chọn:</span>
              <span className="font-mono font-bold text-amber-300">
                {tempDate.day.toString().padStart(2, '0')}/{tempDate.month.toString().padStart(2, '0')}/{tempDate.year}, {tempDate.hour.toString().padStart(2, '0')}:{tempDate.minute.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            {allowClear ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
              >
                Xóa / Để trống
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="bg-slate-800 border-slate-700 text-slate-300 text-xs rounded-lg"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg px-4"
              >
                Xác nhận chọn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function BookManagement() {
  const { toast } = useToast()

  // State
  const [books, setBooks] = useState<Book[]>([])
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([])
  const [users, setUsers] = useState<MemberUser[]>([])
  const [stats, setStats] = useState<BookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [activeTab, setActiveTab] = useState<'books' | 'stats'>('books')

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [borrowSearchTerm, setBorrowSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Book Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  // Borrowing Dialogs
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const [showEditBorrowDialog, setShowEditBorrowDialog] = useState(false)
  const [showDeleteBorrowDialog, setShowDeleteBorrowDialog] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingRecord | null>(null)
  const [borrowingToDelete, setBorrowingToDelete] = useState<BorrowingRecord | null>(null)
  const [savingBorrow, setSavingBorrow] = useState(false)

  // Book Form data
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: ''
  })

  // Borrow Form data (Create & Edit)
  const [borrowFormData, setBorrowFormData] = useState({
    bookId: '',
    userIds: [] as string[],
    borrowedAt: '',
    expectedReturnDate: '',
    returnedAt: '',
    status: 'BORROWED' as 'BORROWED' | 'RETURNED' | 'OVERDUE',
    note: 'Lập sổ nhật ký mượn trả thủ công'
  })
  const [userSearchTerm, setUserSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [currentBorrowPage, setCurrentBorrowPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Load data
  useEffect(() => {
    loadBooks()
    loadStats()
    loadUsers()
    
    const intervalId = setInterval(() => {
      if (activeTab === 'books') {
        bookApi.getBooks().then(response => {
          if (response.success && response.data) {
            setBooks(response.data)
          }
        }).catch(err => console.error('[Admin] Polling error:', err))
      } else if (activeTab === 'stats') {
        bookApi.getBorrowingStats(statusFilter === 'all' ? undefined : statusFilter as any).then(response => {
          if (response.success && response.data) {
            setStats(response.data.stats)
            setBorrowings(response.data.borrowings)
          }
        }).catch(err => console.error('[Admin] Polling error:', err))
      }
    }, 5000)
    
    return () => clearInterval(intervalId)
  }, [activeTab, statusFilter])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const response = await bookApi.getBooks()
      if (response.success && response.data) {
        setBooks(response.data)
      } else {
        toast({ title: 'Lỗi', description: response.error || 'Không thể tải danh sách sách', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối server', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (status?: 'borrowed' | 'returned') => {
    try {
      const response = await bookApi.getBorrowingStats(status)
      if (response.success && response.data) {
        setStats(response.data.stats)
        setBorrowings(response.data.borrowings)
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('auth_token') || localStorage.getItem('token')) : null
      const API_URL = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')
        ? 'http://localhost:3001'
        : 'https://youth-handbook.onrender.com'
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${API_URL}/api/users?limit=500`, { headers })
      if (response.ok) {
        const data = await response.json()
        const userList = data.users || data.data || []
        setUsers(userList.map((u: any, idx: number) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          unitName: u.unit?.name || u.unitName || 'Chi đoàn Cơ sở',
          code: u.studentId || u.memberCode || `ĐV-${196010 + idx}`
        })))
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchTerm ||
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.publisher && book.publisher.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [books, searchTerm])

  // Filter borrowings
  const filteredBorrowings = useMemo(() => {
    return borrowings.filter(b => {
      if (statusFilter === 'borrowed' && b.returnedAt) return false
      if (statusFilter === 'returned' && !b.returnedAt) return false
      if (statusFilter === 'overdue' && (b.returnedAt || !isOverdue(b.expectedReturnDate, b.returnedAt))) return false

      if (borrowSearchTerm.trim()) {
        const q = borrowSearchTerm.toLowerCase()
        const matchesBorrower = b.borrower?.toLowerCase().includes(q) || b.borrowerUnit?.toLowerCase().includes(q)
        const matchesBook = b.bookTitle?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.publisher?.toLowerCase().includes(q)
        return matchesBorrower || matchesBook
      }
      return true
    })
  }, [borrowings, statusFilter, borrowSearchTerm])

  // Filtered readers for modal
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users
    const q = userSearchTerm.toLowerCase()
    return users.filter(u => 
      u.fullName.toLowerCase().includes(q) ||
      (u.unitName && u.unitName.toLowerCase().includes(q)) ||
      (u.code && u.code.toLowerCase().includes(q))
    )
  }, [users, userSearchTerm])

  // Pagination
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBooks, currentPage])

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)

  const paginatedBorrowings = useMemo(() => {
    const start = (currentBorrowPage - 1) * ITEMS_PER_PAGE
    return filteredBorrowings.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBorrowings, currentBorrowPage])

  const totalBorrowPages = Math.ceil(filteredBorrowings.length / ITEMS_PER_PAGE)

  // Book CRUD handlers
  const resetForm = () => {
    setFormData({ title: '', author: '', publisher: '' })
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên sách', variant: 'destructive' })
      return
    }

    try {
      const response = await bookApi.createBook(formData)
      if (response.success) {
        toast({ title: 'Thành công', description: 'Đã thêm sách mới' })
        setShowCreateDialog(false)
        resetForm()
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: response.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể thêm sách', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    if (!selectedBook || !formData.title.trim()) return

    try {
      const response = await bookApi.updateBook(selectedBook.id, formData)
      if (response.success) {
        toast({ title: 'Thành công', description: 'Đã cập nhật sách' })
        setShowEditDialog(false)
        resetForm()
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: response.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật sách', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!selectedBook) return

    try {
      const response = await bookApi.deleteBook(selectedBook.id)
      if (response.success) {
        toast({ title: 'Thành công', description: 'Đã xóa sách' })
        setShowDeleteDialog(false)
        setSelectedBook(null)
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: response.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa sách', variant: 'destructive' })
    }
  }

  const openEditDialog = (book: Book) => {
    setSelectedBook(book)
    setFormData({
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || ''
    })
    setShowEditDialog(true)
  }

  const openQRDialog = (book: Book) => {
    setSelectedBook(book)
    setShowQRDialog(true)
  }

  const printQRCode = () => {
    if (!selectedBook) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>QR Code - ${selectedBook.title}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { border: 2px solid #333; padding: 20px; display: inline-block; margin: 20px; }
            .book-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .book-info { font-size: 12px; color: #666; margin-bottom: 15px; }
            .qr-code { margin-bottom: 10px; }
            .qr-text { font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="book-title">${selectedBook.title}</div>
            <div class="book-info">${selectedBook.author || ''} - ${selectedBook.publisher || ''}</div>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBook.qrCode)}" alt="QR Code" />
            </div>
            <div class="qr-text">Mã: ${selectedBook.qrCode}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  // Helper date conversions
  const toLocalInputFormat = (date: Date | string | null) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '-'
    const pad = (n: number) => n.toString().padStart(2, '0')
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    return `${time} ${date}`
  }

  const isOverdue = (expectedReturnDate: string | null, returnedAt: string | null) => {
    if (!expectedReturnDate || returnedAt) return false
    return new Date(expectedReturnDate) < new Date()
  }

  // Borrowing Handlers
  const openCreateBorrowDialog = () => {
    const now = new Date()
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    dueDate.setHours(21, 0, 0, 0)

    setBorrowFormData({
      bookId: books[0]?.id || '',
      userIds: [],
      borrowedAt: toLocalInputFormat(now),
      expectedReturnDate: toLocalInputFormat(dueDate),
      returnedAt: '',
      status: 'BORROWED',
      note: 'Lập sổ nhật ký mượn trả thủ công'
    })
    setUserSearchTerm('')
    setShowBorrowDialog(true)
  }

  const openEditBorrowDialog = (record: BorrowingRecord) => {
    setSelectedBorrowing(record)
    const book = books.find(b => b.title === record.bookTitle || b.id === record.bookId)
    const user = users.find(u => u.fullName === record.borrower || u.id === record.userId)

    const overdue = isOverdue(record.expectedReturnDate, record.returnedAt)
    const initialStatus = record.returnedAt ? 'RETURNED' : (overdue ? 'OVERDUE' : 'BORROWED')

    setBorrowFormData({
      bookId: book?.id || record.bookId || books[0]?.id || '',
      userIds: user?.id ? [user.id] : (record.userId ? [record.userId] : []),
      borrowedAt: toLocalInputFormat(record.borrowedAt),
      expectedReturnDate: toLocalInputFormat(record.expectedReturnDate),
      returnedAt: toLocalInputFormat(record.returnedAt),
      status: initialStatus,
      note: 'Điều chỉnh hồ sơ mượn trả'
    })
    setUserSearchTerm('')
    setShowEditBorrowDialog(true)
  }

  const openDeleteBorrowDialog = (record: BorrowingRecord) => {
    setBorrowingToDelete(record)
    setShowDeleteBorrowDialog(true)
  }

  const toggleUserSelection = (userId: string, singleMode = false) => {
    setBorrowFormData(prev => {
      if (singleMode) {
        return { ...prev, userIds: [userId] }
      }
      const exists = prev.userIds.includes(userId)
      if (exists) {
        return { ...prev, userIds: prev.userIds.filter(id => id !== userId) }
      } else {
        return { ...prev, userIds: [...prev.userIds, userId] }
      }
    })
  }

  const selectAllUsers = () => {
    setBorrowFormData(prev => ({
      ...prev,
      userIds: filteredUsers.map(u => u.id)
    }))
  }

  const deselectAllUsers = () => {
    setBorrowFormData(prev => ({
      ...prev,
      userIds: []
    }))
  }

  const handleSaveBorrow = async () => {
    if (!borrowFormData.bookId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn cuốn sách', variant: 'destructive' })
      return
    }
    if (borrowFormData.userIds.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn ít nhất một độc giả / đoàn viên', variant: 'destructive' })
      return
    }

    try {
      setSavingBorrow(true)
      const res = await bookApi.createManualBorrowings({
        bookId: borrowFormData.bookId,
        userIds: borrowFormData.userIds,
        borrowedAt: borrowFormData.borrowedAt ? new Date(borrowFormData.borrowedAt).toISOString() : undefined,
        expectedReturnDate: borrowFormData.expectedReturnDate ? new Date(borrowFormData.expectedReturnDate).toISOString() : undefined,
        returnedAt: borrowFormData.returnedAt ? new Date(borrowFormData.returnedAt).toISOString() : (borrowFormData.status === 'RETURNED' ? new Date().toISOString() : null),
        status: borrowFormData.status,
        note: borrowFormData.note
      })

      if (res.success) {
        toast({
          title: '✅ Thành công',
          description: `Đã tạo nhật ký mượn trả cho ${borrowFormData.userIds.length} độc giả`,
          className: 'bg-green-50 border-green-500 text-green-900',
          duration: 4000
        })
        setShowBorrowDialog(false)
        loadStats()
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: res.error || 'Không thể tạo hồ sơ', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Có lỗi xảy ra khi lưu hồ sơ mượn trả', variant: 'destructive' })
    } finally {
      setSavingBorrow(false)
    }
  }

  const handleUpdateBorrow = async () => {
    if (!selectedBorrowing) return
    if (!borrowFormData.bookId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn cuốn sách', variant: 'destructive' })
      return
    }

    try {
      setSavingBorrow(true)
      const res = await bookApi.updateBorrowing(selectedBorrowing.id, {
        bookId: borrowFormData.bookId,
        userId: borrowFormData.userIds[0] || undefined,
        borrowedAt: borrowFormData.borrowedAt ? new Date(borrowFormData.borrowedAt).toISOString() : undefined,
        expectedReturnDate: borrowFormData.expectedReturnDate ? new Date(borrowFormData.expectedReturnDate).toISOString() : undefined,
        returnedAt: borrowFormData.returnedAt ? new Date(borrowFormData.returnedAt).toISOString() : (borrowFormData.status === 'RETURNED' ? new Date().toISOString() : null),
        status: borrowFormData.status,
        note: borrowFormData.note
      })

      if (res.success) {
        toast({
          title: '✅ Thành công',
          description: 'Đã cập nhật hồ sơ mượn trả sách',
          className: 'bg-green-50 border-green-500 text-green-900',
          duration: 3000
        })
        setShowEditBorrowDialog(false)
        setSelectedBorrowing(null)
        loadStats()
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: res.error || 'Không thể cập nhật hồ sơ', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Có lỗi xảy ra khi cập nhật hồ sơ', variant: 'destructive' })
    } finally {
      setSavingBorrow(false)
    }
  }

  const handleDeleteBorrow = async () => {
    if (!borrowingToDelete) return
    try {
      const res = await bookApi.deleteBorrowing(borrowingToDelete.id)
      if (res.success) {
        toast({ title: 'Thành công', description: 'Đã xóa bản ghi mượn sách' })
        setShowDeleteBorrowDialog(false)
        setBorrowingToDelete(null)
        loadStats()
        loadBooks()
      } else {
        toast({ title: 'Lỗi', description: res.error || 'Không thể xóa bản ghi', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối máy chủ', variant: 'destructive' })
    }
  }

  const handleQuickReturn = async (record: BorrowingRecord) => {
    try {
      const res = await bookApi.returnBook(record.id)
      if (res.success) {
        toast({
          title: '✅ Đã trả sách',
          description: `Đoàn viên ${record.borrower} đã trả cuốn "${record.bookTitle}"`,
          className: 'bg-green-50 border-green-500 text-green-900',
          duration: 3000
        })
        loadStats()
        loadBooks()
      } else {
        const fallbackRes = await bookApi.updateBorrowing(record.id, {
          status: 'RETURNED',
          returnedAt: new Date().toISOString()
        })
        if (fallbackRes.success) {
          toast({
            title: '✅ Đã trả sách',
            description: `Đoàn viên ${record.borrower} đã trả cuốn "${record.bookTitle}"`,
            className: 'bg-green-50 border-green-500 text-green-900',
            duration: 3000
          })
          loadStats()
          loadBooks()
          return
        }
        toast({ title: 'Lỗi', description: res.error || 'Không thể trả sách', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Có lỗi xảy ra', variant: 'destructive' })
    }
  }

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phòng HCM</h1>
          <p className="text-gray-500 text-sm">Quản lý sách và theo dõi thống kê mượn/trả tài liệu</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'stats' ? (
            <Button 
              onClick={openCreateBorrowDialog}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all h-10 px-4 rounded-xl"
            >
              <BookPlus className="h-4 w-4 mr-2" /> Tạo hồ sơ mượn trả
            </Button>
          ) : (
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Thêm sách mới
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tổng sách</p>
                <p className="text-2xl font-extrabold text-gray-900">{stats?.totalBooks || books.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-xl">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đang mượn</p>
                <p className="text-2xl font-extrabold text-orange-600">{stats?.currentlyBorrowed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đã trả</p>
                <p className="text-2xl font-extrabold text-green-600">{stats?.returned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tổng lượt mượn</p>
                <p className="text-2xl font-extrabold text-purple-600">{stats?.totalBorrowings || borrowings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-5 py-2.5 font-semibold text-sm transition-all ${
            activeTab === 'books' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('books')}
        >
          Quản lý sách
        </button>
        <button
          className={`px-5 py-2.5 font-semibold text-sm transition-all ${
            activeTab === 'stats' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => { setActiveTab('stats'); loadStats() }}
        >
          Thống kê mượn trả
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'books' ? (
        <>
          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên sách, tác giả, NXB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
            <Button variant="outline" onClick={loadBooks} className="h-10 rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>

          {/* Books Table */}
          <Card className="border shadow-sm overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">STT</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Tên sách</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Tác giả</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Nhà xuất bản</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">Mã QR</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedBooks.map((book, index) => (
                      <tr key={book.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-sm text-gray-900">{book.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{book.author || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{book.publisher || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={book.isBorrowed ? 'destructive' : 'secondary'} className="font-semibold">
                            {book.isBorrowed ? 'Đang mượn' : 'Sẵn sàng'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => openQRDialog(book)} className="text-blue-600 hover:bg-blue-50">
                            <QrCode className="h-4 w-4 mr-1" />
                            Xem QR
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(book)} className="text-blue-600 hover:bg-blue-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedBook(book); setShowDeleteDialog(true) }} className="text-red-500 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedBooks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Không tìm thấy sách nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredBooks.length)} / {filteredBooks.length} cuốn sách
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Borrowing Filter & Actions Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); loadStats(v === 'all' ? undefined : v as any) }}>
                <SelectTrigger className="w-[160px] h-10 bg-white rounded-xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="borrowed">Đang mượn</SelectItem>
                  <SelectItem value="returned">Đã trả</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm người mượn, tên sách, tác giả..."
                  value={borrowSearchTerm}
                  onChange={(e) => setBorrowSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-white rounded-xl"
                />
              </div>

              <Button variant="outline" onClick={() => loadStats()} className="h-10 bg-white rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
              </Button>
            </div>

            <Button 
              onClick={openCreateBorrowDialog}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-10 px-5 shadow-sm rounded-xl transition-all"
            >
              <BookPlus className="h-4 w-4 mr-2" /> Tạo hồ sơ mượn trả
            </Button>
          </div>

          {/* Borrowings Table */}
          <Card className="border shadow-sm overflow-hidden rounded-xl">
            <CardHeader className="bg-slate-50/80 border-b py-3 px-4">
              <CardTitle className="text-base font-bold text-gray-900">Thống kê mượn/trả sách</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/70 border-b">
                    <tr>
                      <th className="px-3.5 py-3 text-center text-xs font-bold text-gray-500 uppercase w-12">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[170px]">Người mượn</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[240px]">Tên sách</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[140px]">Tác giả</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[140px]">Nhà xuất bản</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[140px]">Thời gian mượn</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[140px]">Dự kiến trả</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[140px]">Thời gian trả</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedBorrowings.map((b, index) => {
                      const overdue = isOverdue(b.expectedReturnDate, b.returnedAt)
                      return (
                        <tr key={b.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-3.5 py-3.5 text-center font-bold text-gray-700">
                            {(currentBorrowPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-gray-900">{b.borrower}</p>
                            <p className="text-xs text-gray-500">{b.borrowerUnit || 'Chi đoàn Cơ sở'}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-gray-900 leading-snug">{b.bookTitle}</p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">{b.author || '-'}</td>
                          <td className="px-4 py-3.5 text-gray-600">{b.publisher || '-'}</td>
                          <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap font-medium text-xs font-mono">
                            {formatDateTime(b.borrowedAt)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium text-xs font-mono">
                            {b.expectedReturnDate ? (
                              <span className={overdue ? "text-red-600 font-bold" : "text-blue-600 font-semibold"}>
                                {formatDateTime(b.expectedReturnDate)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {b.returnedAt ? (
                              <span className="text-gray-800 font-medium text-xs font-mono">
                                {formatDateTime(b.returnedAt)}
                              </span>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-amber-600 bg-amber-50/90 border-amber-300 font-semibold rounded-full px-2.5 py-0.5 text-xs"
                              >
                                Chưa trả
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!b.returnedAt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickReturn(b)}
                                  className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-bold shadow-2xs"
                                  title="Đánh dấu đã trả sách"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Trả sách
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditBorrowDialog(b)}
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Chỉnh sửa hồ sơ mượn trả"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteBorrowDialog(b)}
                                className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Xóa bản ghi"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {paginatedBorrowings.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu mượn trả sách nào</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Borrow Pagination */}
          {totalBorrowPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentBorrowPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentBorrowPage * ITEMS_PER_PAGE, filteredBorrowings.length)} / {filteredBorrowings.length} bản ghi
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={currentBorrowPage === 1} onClick={() => setCurrentBorrowPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={currentBorrowPage === totalBorrowPages} onClick={() => setCurrentBorrowPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO THỦ CÔNG NHẬT KÝ MƯỢN TRẢ SÁCH BÁO CÁO */}
      {/* ========================================================================= */}
      <Dialog open={showBorrowDialog || showEditBorrowDialog} onOpenChange={(open) => {
        if (!open) {
          setShowBorrowDialog(false)
          setShowEditBorrowDialog(false)
          setSelectedBorrowing(null)
        }
      }}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-800 bg-[#0f172a] text-slate-100 max-h-[92vh] flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-white leading-snug">
                  {showEditBorrowDialog ? 'Điều Chỉnh Nhật Ký Mượn Trả Sách' : 'Tạo Thủ Công Nhật Ký Mượn Trả Sách Báo Cáo'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Chọn danh sách độc giả, chọn cuốn sách, điều chỉnh ngày mượn/hạn trả và trạng thái để lập hồ sơ hoàn chỉnh.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* 1. Chọn Cuốn Sách */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                CHỌN CUỐN SÁCH <span className="text-red-400">*</span>
              </Label>
              <Select 
                value={borrowFormData.bookId} 
                onValueChange={(val) => setBorrowFormData(prev => ({ ...prev, bookId: val }))}
              >
                <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-100 h-11 rounded-xl text-sm font-medium px-3.5 focus:border-amber-500">
                  <SelectValue placeholder="-- Chọn cuốn sách trong danh mục thư viện --" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-[280px]">
                  {books.map(book => (
                    <SelectItem key={book.id} value={book.id} className="hover:bg-slate-800 text-slate-200 text-sm">
                      [{book.publisher || 'SÁCH'}] {book.title} {book.author ? `- Tác giả: ${book.author}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Chọn Danh Sách Độc Giả */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  CHỌN DANH SÁCH ĐỘC GIẢ <span className="text-red-400">*</span>{' '}
                  <span className="text-amber-400 text-xs font-normal lowercase">
                    {showEditBorrowDialog ? '(chọn độc giả)' : '(Có thể chọn nhiều độc giả cùng lúc)'}
                  </span>
                </Label>
                
                {!showEditBorrowDialog && (
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={selectAllUsers} 
                      className="text-xs h-7 text-amber-400 hover:text-amber-300 hover:bg-slate-800 px-2 rounded-lg"
                    >
                      Chọn tất cả ({filteredUsers.length})
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={deselectAllUsers} 
                      className="text-xs h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 rounded-lg"
                    >
                      Bỏ chọn
                    </Button>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold px-2.5">
                      Đã chọn: {borrowFormData.userIds.length}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Search Readers Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm đoàn viên theo tên, đơn vị, mã..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-slate-900 border-slate-700 text-slate-100 text-xs rounded-xl"
                />
              </div>

              {/* Readers List Container */}
              <div className="max-h-[180px] overflow-y-auto space-y-2 p-2 rounded-xl border border-slate-800 bg-slate-950/70 custom-scrollbar pr-2.5">
                {filteredUsers.map((user) => {
                  const isSelected = borrowFormData.userIds.includes(user.id)
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id, showEditBorrowDialog)}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-slate-900 border-amber-500/80 shadow-xs' 
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 bg-slate-900'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">{user.unitName}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-md shrink-0">
                        {user.code}
                      </span>
                    </div>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Không tìm thấy đoàn viên nào
                  </div>
                )}
              </div>
            </div>

            {/* 3. Dates (Interactive DateTimePickers - Never Clipped, Click anywhere to pick) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
              <DateTimePickerField
                label="NGÀY MƯỢN"
                required
                value={borrowFormData.borrowedAt}
                onChange={(val) => setBorrowFormData(prev => ({ ...prev, borrowedAt: val }))}
                colorClass="text-slate-100"
                placeholder="Chọn ngày mượn"
              />

              <DateTimePickerField
                label="HẠN TRẢ (DỰ KIẾN)"
                required
                value={borrowFormData.expectedReturnDate}
                onChange={(val) => setBorrowFormData(prev => ({ ...prev, expectedReturnDate: val }))}
                colorClass="text-amber-300"
                placeholder="Chọn hạn trả"
              />

              <DateTimePickerField
                label="NGÀY TRẢ THỰC TẾ"
                value={borrowFormData.returnedAt}
                onChange={(val) => setBorrowFormData(prev => ({ 
                  ...prev, 
                  returnedAt: val,
                  status: val ? 'RETURNED' : 'BORROWED'
                }))}
                colorClass="text-emerald-400"
                placeholder="dd/mm/yyyy, --:--"
                allowClear
              />
            </div>

            {/* 4. Trạng Thái & Ghi Chú */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              <div>
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 h-4">
                  TRẠNG THÁI MƯỢN TRẢ
                </Label>
                <Select 
                  value={borrowFormData.status} 
                  onValueChange={(val: any) => {
                    setBorrowFormData(prev => ({
                      ...prev,
                      status: val,
                      returnedAt: val === 'RETURNED' ? (prev.returnedAt || toLocalInputFormat(new Date())) : ''
                    }))
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-11 rounded-xl text-sm font-semibold px-3.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                    <SelectItem value="BORROWED" className="hover:bg-slate-800 text-yellow-400 text-sm font-medium">
                      🟡 Đang mượn
                    </SelectItem>
                    <SelectItem value="RETURNED" className="hover:bg-slate-800 text-emerald-400 text-sm font-medium">
                      🟢 Đã trả sách
                    </SelectItem>
                    <SelectItem value="OVERDUE" className="hover:bg-slate-800 text-red-400 text-sm font-medium">
                      🔴 Quá hạn
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 h-4">
                  GHI CHÚ HỒ SƠ
                </Label>
                <Input
                  placeholder="Lập sổ nhật ký mượn trả thủ công"
                  value={borrowFormData.note}
                  onChange={(e) => setBorrowFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100 text-sm font-medium px-3.5 h-11 rounded-xl placeholder:text-slate-500 w-full"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/90 shrink-0 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBorrowDialog(false)
                setShowEditBorrowDialog(false)
                setSelectedBorrowing(null)
              }}
              disabled={savingBorrow}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl h-11 px-7 font-semibold text-sm transition-all"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={showEditBorrowDialog ? handleUpdateBorrow : handleSaveBorrow}
              disabled={savingBorrow || !borrowFormData.bookId || borrowFormData.userIds.length === 0}
              className="bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-8 h-11 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all text-sm"
            >
              {savingBorrow ? 'Đang lưu...' : 'Lưu Hồ Sơ Mượn Trả'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Borrowing Dialog */}
      <Dialog open={showDeleteBorrowDialog} onOpenChange={setShowDeleteBorrowDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Xác nhận xóa bản ghi
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa bản ghi mượn sách <strong>"{borrowingToDelete?.bookTitle}"</strong> của <strong>{borrowingToDelete?.borrower}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteBorrowDialog(false)} className="rounded-xl">Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteBorrow} className="rounded-xl">Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Book Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Thêm sách mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sách *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tên sách"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Tác giả</Label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Nhập tên tác giả"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Nhà xuất bản</Label>
              <Input
                value={formData.publisher}
                onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                placeholder="Nhập nhà xuất bản"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }} className="rounded-xl">Hủy</Button>
            <Button onClick={handleCreate} className="rounded-xl">Thêm sách</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Sửa thông tin sách</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sách *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Tác giả</Label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Nhà xuất bản</Label>
              <Input
                value={formData.publisher}
                onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm() }}>Hủy</Button>
            <Button onClick={handleUpdate} className="rounded-xl">Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Book Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Bạn có chắc muốn xóa sách "{selectedBook?.title}"? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm text-center rounded-xl">
          <DialogHeader>
            <DialogTitle>Mã QR - {selectedBook?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBook?.qrCode || '')}`}
              alt="QR Code"
              className="border rounded-lg"
            />
            <p className="text-sm text-gray-500">Mã: {selectedBook?.qrCode}</p>
            {selectedBook?.author && <p className="text-sm">Tác giả: {selectedBook.author}</p>}
            {selectedBook?.publisher && <p className="text-sm">NXB: {selectedBook.publisher}</p>}
          </div>
          <DialogFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setShowQRDialog(false)} className="rounded-xl">Đóng</Button>
            <Button onClick={printQRCode} className="rounded-xl">
              <Printer className="h-4 w-4 mr-2" /> In QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
