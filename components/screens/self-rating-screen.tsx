'use client'

import { useState, useEffect } from 'react'
import { ratingApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SelfRatingForm } from '../rating/self-rating-form'
import { RatingHistory } from '../rating/rating-history'
import { 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { toast } from '../ui/use-toast'

interface RatingPeriod {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  criteria: {
    id: string;
    name: string;
    description: string;
    isRequired: boolean;
  }[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  targetAudience: 'ALL' | 'UNIT_SPECIFIC' | 'ROLE_SPECIFIC';
  totalSubmissions?: number;
  pendingApprovals?: number;
}

interface SelfRating {
  id: string;
  periodId: string;
  userId: string;
  suggestedRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  selfAssessment?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  finalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  adminNotes?: string;
  pointsAwarded?: number;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  period: {
    id: string;
    title: string;
  };
}

export default function SelfRatingScreen() {
  const [periods, setPeriods] = useState<RatingPeriod[]>([])
  const [myRatings, setMyRatings] = useState<SelfRating[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<RatingPeriod | null>(null)
  const [activeTab, setActiveTab] = useState('available')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load active rating periods
      const periodsResponse = await ratingApi.getRatingPeriods('ACTIVE')
      if (periodsResponse.success && periodsResponse.data) {
        setPeriods(periodsResponse.data)
      }

      // Load my rating history
      const historyResponse = await ratingApi.getMyRatingHistory()
      if (historyResponse.success && historyResponse.data) {
        setMyRatings(historyResponse.data)
      }

    } catch (error) {
      console.error('Error loading rating data:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu xếp loại',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartRating = (period: RatingPeriod) => {
    setSelectedPeriod(period)
  }

  const handleRatingComplete = () => {
    setSelectedPeriod(null)
    loadData() // Reload to get updated data
    toast({
      title: 'Thành công',
      description: 'Đã gửi đánh giá chờ duyệt'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'NEEDS_REVISION': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'SUBMITTED': return <Clock className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      case 'NEEDS_REVISION': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-purple-600'
      case 'GOOD': return 'text-blue-600'
      case 'AVERAGE': return 'text-green-600'
      case 'POOR': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'Xuất sắc'
      case 'GOOD': return 'Khá'
      case 'AVERAGE': return 'Trung bình'
      case 'POOR': return 'Yếu'
      default: return rating
    }
  }

  const filteredRatings = myRatings.filter(rating => {
    if (statusFilter === 'all') return true
    return rating.status === statusFilter
  })

  const isWithinPeriod = (period: RatingPeriod) => {
    const now = new Date()
    const start = new Date(period.startDate)
    const end = new Date(period.endDate)
    return now >= start && now <= end
  }

  const hasSubmittedForPeriod = (periodId: string) => {
    return myRatings.some(rating => 
      rating.periodId === periodId && 
      ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(rating.status)
    )
  }

  if (selectedPeriod) {
    return (
      <SelfRatingForm 
        period={selectedPeriod}
        onComplete={handleRatingComplete}
        onCancel={() => setSelectedPeriod(null)}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tự xếp loại chất lượng</h1>
          <p className="text-muted-foreground">
            Đánh giá chất lượng bản thân theo các tiêu chí đã định
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Kỳ xếp loại
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Lịch sử ({myRatings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : periods.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Hiện tại không có kỳ xếp loại nào
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {periods.map(period => {
                const isActive = isWithinPeriod(period)
                const hasSubmitted = hasSubmittedForPeriod(period.id)
                const myRating = myRatings.find(r => r.periodId === period.id)
                
                return (
                  <Card key={period.id} className={`hover:shadow-md transition-shadow ${
                    !isActive ? 'opacity-60' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {isActive ? 'Đang diễn ra' : 'Chưa bắt đầu'}
                            </Badge>
                            {hasSubmitted && myRating && (
                              <Badge className={getStatusColor(myRating.status)}>
                                {getStatusIcon(myRating.status)}
                                <span className="ml-1">
                                  {myRating.status === 'SUBMITTED' ? 'Đã gửi' :
                                   myRating.status === 'APPROVED' ? 'Đã duyệt' :
                                   myRating.status === 'REJECTED' ? 'Bị từ chối' : 'Cần sửa'}
                                </span>
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {period.title}
                          </h3>

                          {period.description && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {period.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span>{period.criteria?.length || 0} tiêu chí</span>
                            {period.totalSubmissions && (
                              <span>{period.totalSubmissions} người đã gửi</span>
                            )}
                          </div>

                          {myRating?.finalRating && (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">Kết quả: </span>
                              <span className={`font-semibold ${getRatingColor(myRating.finalRating)}`}>
                                {getRatingLabel(myRating.finalRating)}
                              </span>
                              {myRating.pointsAwarded && (
                                <span className="text-blue-600">
                                  (+{myRating.pointsAwarded} điểm)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {isActive && !hasSubmitted && (
                            <Button onClick={() => handleStartRating(period)}>
                              Bắt đầu xếp loại
                            </Button>
                          )}
                          
                          {hasSubmitted && myRating?.status === 'NEEDS_REVISION' && (
                            <Button 
                              variant="outline"
                              onClick={() => handleStartRating(period)}
                            >
                              Chỉnh sửa
                            </Button>
                          )}
                          
                          {!isActive && (
                            <Badge variant="secondary">
                              Chưa mở
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Lịch sử xếp loại</h3>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="SUBMITTED">Đã gửi</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                <SelectItem value="NEEDS_REVISION">Cần sửa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RatingHistory ratings={filteredRatings} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

