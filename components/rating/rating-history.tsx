'use client'

import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  Trophy,
  Calendar,
  Eye,
  MessageSquare
} from 'lucide-react'

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

interface RatingHistoryProps {
  ratings: SelfRating[];
  loading: boolean;
}

export function RatingHistory({ ratings, loading }: RatingHistoryProps) {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Bản nháp'
      case 'SUBMITTED': return 'Đã gửi'
      case 'APPROVED': return 'Đã duyệt'
      case 'REJECTED': return 'Bị từ chối'
      case 'NEEDS_REVISION': return 'Cần sửa'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Bạn chưa có đánh giá nào</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {ratings.map(rating => (
        <Card key={rating.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(rating.status)}>
                    {getStatusIcon(rating.status)}
                    <span className="ml-1">{getStatusLabel(rating.status)}</span>
                  </Badge>
                  
                  {rating.status === 'APPROVED' && rating.finalRating && (
                    <Badge className={`${getRatingColor(rating.finalRating)} bg-opacity-10 border-current`}>
                      <Star className="h-3 w-3 mr-1" />
                      {getRatingLabel(rating.finalRating)}
                    </Badge>
                  )}

                  {rating.pointsAwarded && rating.pointsAwarded > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">
                      +{rating.pointsAwarded} điểm
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {rating.period.title}
                </h3>

                <div className="space-y-2 mb-3">
                  {rating.suggestedRating && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Tự đánh giá gợi ý:</span>
                      <span className={`ml-2 font-medium ${getRatingColor(rating.suggestedRating)}`}>
                        {getRatingLabel(rating.suggestedRating)}
                      </span>
                    </div>
                  )}

                  {rating.finalRating && rating.finalRating !== rating.suggestedRating && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Kết quả cuối cùng:</span>
                      <span className={`ml-2 font-medium ${getRatingColor(rating.finalRating)}`}>
                        {getRatingLabel(rating.finalRating)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Gửi: {formatDate(rating.submittedAt || rating.createdAt)}
                  </span>
                  
                  {rating.reviewedAt && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Duyệt: {formatDate(rating.reviewedAt)}
                    </span>
                  )}
                </div>

                {/* Self Assessment */}
                {rating.selfAssessment && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Tự đánh giá:</div>
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {rating.selfAssessment}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {rating.adminNotes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mb-1">
                      <MessageSquare className="h-3 w-3" />
                      Góp ý từ Admin:
                    </div>
                    <div className="text-sm text-blue-800">
                      {rating.adminNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {rating.status === 'NEEDS_REVISION' && (
                  <Button size="sm" variant="outline">
                    Chỉnh sửa
                  </Button>
                )}
                
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {rating.status === 'SUBMITTED' ? 'Chờ duyệt' : 
                     rating.status === 'APPROVED' ? 'Đã hoàn thành' :
                     rating.status === 'REJECTED' ? 'Bị từ chối' : 
                     'Cần cập nhật'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

