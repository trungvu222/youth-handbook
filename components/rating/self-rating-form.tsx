'use client'

import { useState, useEffect } from 'react'
import { ratingApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Star,
  Trophy,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from '../ui/use-toast'

interface RatingCriteria {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
}

interface RatingPeriod {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  criteria: RatingCriteria[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface SelfRatingFormProps {
  period: RatingPeriod;
  onComplete: () => void;
  onCancel: () => void;
}

export function SelfRatingForm({ period, onComplete, onCancel }: SelfRatingFormProps) {
  const [responses, setResponses] = useState<Record<string, { value: boolean; note?: string }>>({})
  const [selfAssessment, setSelfAssessment] = useState('')
  const [suggestedRating, setSuggestedRating] = useState<'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'>('AVERAGE')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingRating, setExistingRating] = useState<any>(null)

  useEffect(() => {
    loadExistingRating()
  }, [period.id])

  useEffect(() => {
    calculateSuggestedRating()
  }, [responses])

  const loadExistingRating = async () => {
    try {
      setLoading(true)
      const response = await ratingApi.getMyRating(period.id)
      
      if (response.success && response.data) {
        const rating = response.data
        setExistingRating(rating)
        
        // Pre-fill form with existing data
        const responseMap: Record<string, { value: boolean; note?: string }> = {}
        rating.criteriaResponses?.forEach(resp => {
          responseMap[resp.criteriaId] = {
            value: resp.value,
            note: resp.note
          }
        })
        setResponses(responseMap)
        setSelfAssessment(rating.selfAssessment || '')
      }
    } catch (error) {
      console.error('Error loading existing rating:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSuggestedRating = () => {
    const totalCriteria = period.criteria.length
    if (totalCriteria === 0) return

    const metCriteria = Object.values(responses).filter(r => r.value).length
    const percentage = (metCriteria / totalCriteria) * 100

    if (percentage >= 90) {
      setSuggestedRating('EXCELLENT')
    } else if (percentage >= 75) {
      setSuggestedRating('GOOD')
    } else if (percentage >= 60) {
      setSuggestedRating('AVERAGE')
    } else {
      setSuggestedRating('POOR')
    }
  }

  const handleResponseChange = (criteriaId: string, value: boolean) => {
    setResponses(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        value
      }
    }))
  }

  const handleNoteChange = (criteriaId: string, note: string) => {
    setResponses(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        note: note || undefined
      }
    }))
  }

  const handleSubmit = async () => {
    // Validate required criteria
    const missingRequired = period.criteria.filter(criteria => 
      criteria.isRequired && !responses[criteria.id]?.value
    )

    if (missingRequired.length > 0) {
      toast({
        title: 'Chưa đầy đủ',
        description: `Vui lòng đáp ứng các tiêu chí bắt buộc: ${missingRequired.map(c => c.name).join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    try {
      setSubmitting(true)

      const ratingData = {
        periodId: period.id,
        criteriaResponses: period.criteria.map(criteria => ({
          criteriaId: criteria.id,
          value: responses[criteria.id]?.value || false,
          note: responses[criteria.id]?.note
        })),
        selfAssessment: selfAssessment.trim() || undefined
      }

      let response
      if (existingRating && existingRating.status === 'DRAFT') {
        response = await ratingApi.updateRating(existingRating.id, ratingData)
      } else {
        response = await ratingApi.submitRating(ratingData)
      }

      if (response.success) {
        onComplete()
      } else {
        toast({
          title: 'Lỗi',
          description: response.error || 'Không thể gửi đánh giá',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi đánh giá',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getSuggestedRatingInfo = () => {
    const totalCriteria = period.criteria.length
    const metCriteria = Object.values(responses).filter(r => r.value).length

    switch (suggestedRating) {
      case 'EXCELLENT':
        return {
          label: 'Xuất sắc',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          icon: <Star className="h-5 w-5 text-purple-600" />,
          points: '+10 điểm',
          description: `Bạn đã đạt ${metCriteria}/${totalCriteria} tiêu chí (${Math.round((metCriteria/totalCriteria)*100)}%)`
        }
      case 'GOOD':
        return {
          label: 'Khá',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: <Trophy className="h-5 w-5 text-blue-600" />,
          points: '+5 điểm',
          description: `Bạn đã đạt ${metCriteria}/${totalCriteria} tiêu chí (${Math.round((metCriteria/totalCriteria)*100)}%)`
        }
      case 'AVERAGE':
        return {
          label: 'Trung bình',
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          points: '+2 điểm',
          description: `Bạn đã đạt ${metCriteria}/${totalCriteria} tiêu chí (${Math.round((metCriteria/totalCriteria)*100)}%)`
        }
      case 'POOR':
        return {
          label: 'Yếu',
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          points: '+1 điểm',
          description: `Bạn đã đạt ${metCriteria}/${totalCriteria} tiêu chí (${Math.round((metCriteria/totalCriteria)*100)}%)`
        }
    }
  }

  const ratingInfo = getSuggestedRatingInfo()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải biểu mẫu xếp loại...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tự xếp loại chất lượng</h1>
          <p className="text-muted-foreground">{period.title}</p>
        </div>
      </div>

      {/* Period Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{period.title}</CardTitle>
          {period.description && (
            <CardDescription>{period.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Thời gian: {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
            </span>
            <span>
              {period.criteria.length} tiêu chí đánh giá
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rating Warning */}
      {existingRating && existingRating.status !== 'DRAFT' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Bạn đã có đánh giá cho kỳ này với trạng thái: <strong>{existingRating.status}</strong>
            {existingRating.status === 'NEEDS_REVISION' && (
              <span> - Vui lòng chỉnh sửa theo góp ý của admin.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Criteria Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Đánh giá theo tiêu chí
          </CardTitle>
          <CardDescription>
            Đánh dấu các tiêu chí mà bạn đã thực hiện được trong kỳ này
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {period.criteria.map((criteria, index) => (
            <div key={criteria.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={criteria.id}
                  checked={responses[criteria.id]?.value || false}
                  onCheckedChange={(checked) => handleResponseChange(criteria.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor={criteria.id} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {index + 1}. {criteria.name}
                    </label>
                    {criteria.isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Bắt buộc
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {criteria.description}
                  </p>

                  {/* Optional note */}
                  <div className="mt-3">
                    <Textarea
                      placeholder="Ghi chú thêm (tuỳ chọn)..."
                      value={responses[criteria.id]?.note || ''}
                      onChange={(e) => handleNoteChange(criteria.id, e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Rating */}
      <Card className={`border-2 ${ratingInfo.color}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {ratingInfo.icon}
            Mức xếp loại gợi ý: {ratingInfo.label}
          </CardTitle>
          <CardDescription>
            {ratingInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4" />
            <span>Điểm thưởng dự kiến: <strong>{ratingInfo.points}</strong></span>
          </div>
          
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Đây chỉ là gợi ý dựa trên số tiêu chí bạn đã đáp ứng. Kết quả cuối cùng sẽ do Admin/Leader duyệt.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Self Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Tự đánh giá tổng quan</CardTitle>
          <CardDescription>
            Chia sẻ cảm nhận và đánh giá của bạn về chất lượng thực hiện nhiệm vụ trong kỳ này
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Nhập đánh giá tự thân của bạn..."
            value={selfAssessment}
            onChange={(e) => setSelfAssessment(e.target.value)}
            rows={4}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </div>
    </div>
  )
}

