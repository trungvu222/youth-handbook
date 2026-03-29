'use client'

import { useState, useEffect } from 'react'
import { suggestionApi } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  ArrowLeft,
  MessageSquare,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  Tag,
  Paperclip,
  Send,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'IMPROVEMENT' | 'COMPLAINT' | 'IDEA' | 'QUESTION' | 'OTHER' | 'POLICY' | 'PROCESS' | 'FACILITY' | 'SERVICE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'PENDING' | 'APPROVED' | 'IMPLEMENTED' | 'ARCHIVED';
  isAnonymous: boolean;
  userId?: string;
  fileUrls?: string[];
  tags?: string;
  submittedAt?: string;
  createdAt?: string;
  resolvedAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName?: string;
    name?: string;
    email?: string;
    unitName?: string;
  };
  responses?: SuggestionResponse[] | number;
  viewCount?: number;
  _count?: {
    responses: number;
  };
}

interface SuggestionResponse {
  id: string;
  suggestionId: string;
  content: string;
  isPublic: boolean;
  responderId: string;
  createdAt: string;
  responder: {
    id: string;
    fullName?: string;
    name?: string;
    role: string;
  };
}

interface SuggestionDetailProps {
  suggestion: Suggestion;
  onBack: () => void;
  onUpdate: () => void;
}

export function SuggestionDetail({ suggestion: initialSuggestion, onBack, onUpdate }: SuggestionDetailProps) {
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const [loading, setLoading] = useState(false)
  const [newResponse, setNewResponse] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadSuggestionDetail()
  }, [])

  const loadSuggestionDetail = async () => {
    try {
      setLoading(true)
      const response = await suggestionApi.getSuggestion(suggestion.id)
      
      if (response.success && response.data) {
        // Ensure responses is always an array and normalize the data
        const data: any = response.data
        const updatedSuggestion: Suggestion = {
          ...data,
          responses: Array.isArray(data.responses) ? data.responses : [],
          viewCount: data.viewCount || 0,
          submittedAt: data.submittedAt || data.createdAt
        }
        setSuggestion(updatedSuggestion)
      }
    } catch (error) {
      console.error('Error loading suggestion detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return 'bg-blue-100 text-blue-800'
      case 'COMPLAINT': return 'bg-red-100 text-red-800'
      case 'IDEA': return 'bg-green-100 text-green-800'
      case 'QUESTION': return 'bg-yellow-100 text-yellow-800'
      case 'OTHER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'IMPROVEMENT': return 'Cải tiến'
      case 'COMPLAINT': return 'Phản ánh'
      case 'IDEA': return 'Ý tưởng'
      case 'QUESTION': return 'Thắc mắc'
      case 'OTHER': return 'Khác'
      default: return category
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-gray-100 text-gray-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Đã gửi'
      case 'UNDER_REVIEW': return 'Đang xem xét'
      case 'IN_PROGRESS': return 'Đang xử lý'
      case 'RESOLVED': return 'Đã giải quyết'
      case 'REJECTED': return 'Bị từ chối'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Khẩn cấp'
      case 'HIGH': return 'Cao'
      case 'MEDIUM': return 'Trung bình'
      case 'LOW': return 'Thấp'
      default: return priority
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (url: string) => {
    if (!url) return <Paperclip className="h-4 w-4" />
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-600" />
    } else {
      return <Paperclip className="h-4 w-4" />
    }
  }

  const getFileName = (url: string) => {
    if (!url) return 'file'
    return url.split('/').pop()?.split('?')[0] || 'file'
  }

  const handleDownloadFile = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      paddingBottom: 80,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 16,
        paddingLeft: 20,
        paddingRight: 20,
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: '#fff' }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Chi tiết kiến nghị</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>ID: {suggestion.id.slice(0, 8)}...</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px 20px' }}>
        {/* Suggestion Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          marginBottom: 16
        }}>
          {/* Header Section */}
          <div style={{ padding: '20px 20px 16px' }}>
            {/* Badges Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <Badge className={getCategoryColor(suggestion.category)} style={{ fontSize: 11, padding: '4px 10px' }}>
                {getCategoryLabel(suggestion.category)}
              </Badge>
              
              <Badge className={getStatusColor(suggestion.status)} style={{ fontSize: 11, padding: '4px 10px' }}>
                {getStatusLabel(suggestion.status)}
              </Badge>
              
              <Badge variant="outline" className={getPriorityColor(suggestion.priority)} style={{ fontSize: 11, padding: '4px 10px' }}>
                {getPriorityLabel(suggestion.priority)}
              </Badge>

              {suggestion.isAnonymous && (
                <Badge variant="secondary" style={{ fontSize: 11, padding: '4px 10px' }}>
                  🔒 Ẩn danh
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 style={{ 
              color: '#1a202c', 
              fontWeight: 700, 
              fontSize: 20, 
              lineHeight: 1.4,
              marginBottom: 12,
              letterSpacing: '-0.3px'
            }}>
              {suggestion.title}
            </h1>

            {/* Meta Info - Compact inline style */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 20, 
              paddingBottom: 16,
              borderBottom: '1px solid #e2e8f0',
              fontSize: 13,
              color: '#64748b'
            }}>
              {/* Response Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare style={{ width: 16, height: 16, color: '#2563eb' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {Array.isArray(suggestion.responses) ? suggestion.responses.length : 0}
                </span>
                <span>Phản hồi</span>
              </div>

              {/* Created Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar style={{ width: 16, height: 16, color: '#ea580c' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {new Date(suggestion.submittedAt || suggestion.createdAt || Date.now()).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            </div>

            {/* User Info - if not anonymous */}
            {!suggestion.isAnonymous && suggestion.user && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                paddingTop: 12,
                fontSize: 13,
                color: '#64748b'
              }}>
                <User style={{ width: 16, height: 16 }} />
                <span>
                  {suggestion.user.fullName || suggestion.user.name}
                  {suggestion.user.unitName && ` • ${suggestion.user.unitName}`}
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ 
              color: '#4a5568', 
              fontSize: 15, 
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}>
              {suggestion.content}
            </div>
          </div>

          {/* Tags Section */}
          {suggestion.tags && (
            <div style={{ padding: '16px 20px', background: '#f7fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 10,
                color: '#4a5568',
                fontSize: 13,
                fontWeight: 600
              }}>
                <Tag style={{ width: 16, height: 16 }} />
                Thẻ tag
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestion.tags.split(',').map((tag, index) => (
                  <span key={index} style={{
                    background: '#edf2f7',
                    color: '#4a5568',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments Section */}
          {suggestion.fileUrls && suggestion.fileUrls.length > 0 && (
            <div style={{ padding: '16px 20px', background: '#f7fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12,
                color: '#4a5568',
                fontSize: 13,
                fontWeight: 600
              }}>
                <Paperclip style={{ width: 16, height: 16 }} />
                File đính kèm ({suggestion.fileUrls.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestion.fileUrls.map((url, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#fff',
                      borderRadius: 10,
                      padding: 12,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      {getFileIcon(url)}
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 500,
                        color: '#2d3748',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {getFileName(url)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(url)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      <Download style={{ width: 18, height: 18, color: '#fff' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Badge */}
          {suggestion.resolvedAt && (
            <div style={{ padding: '16px 20px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: '#166534',
                    marginBottom: 2
                  }}>
                    Đã giải quyết
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d' }}>
                    {formatDate(suggestion.resolvedAt)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responses Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '16px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <MessageSquare style={{ width: 20, height: 20, color: '#fff' }} />
            <span style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#fff',
              flex: 1
            }}>
              Phản hồi
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              borderRadius: 12,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 700
            }}>
              {Array.isArray(suggestion.responses) ? suggestion.responses.length : 0}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: 20 }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '32px 0' 
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#667eea',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </div>
            ) : !suggestion.responses || !Array.isArray(suggestion.responses) || suggestion.responses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#a0aec0'
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#f7fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <MessageSquare style={{ 
                    width: 32, 
                    height: 32,
                    color: '#cbd5e0'
                  }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#718096' }}>Chưa có phản hồi nào</p>
                <p style={{ fontSize: 13, color: '#a0aec0', marginTop: 4 }}>Phản hồi sẽ được hiển thị tại đây</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(suggestion.responses || []).map((response, index) => (
                  <div key={response.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    background: index % 2 === 0 ? '#fafafa' : '#fff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                      <Avatar className="h-10 w-10" style={{ flexShrink: 0 }}>
                        <AvatarFallback style={{ 
                          fontSize: 14,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          fontWeight: 700
                        }}>
                          {(response.responder.fullName || response.responder.name || 'A').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Responder Info */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          marginBottom: 6,
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ 
                            fontSize: 14, 
                            fontWeight: 700,
                            color: '#2d3748'
                          }}>
                            {response.responder.fullName || response.responder.name}
                          </span>
                          <Badge variant="outline" style={{ 
                            fontSize: 10, 
                            padding: '2px 8px',
                            background: '#edf2f7',
                            border: 'none',
                            color: '#4a5568'
                          }}>
                            {response.responder.role}
                          </Badge>
                          {!response.isPublic && (
                            <Badge variant="secondary" style={{ 
                              fontSize: 10, 
                              padding: '2px 8px',
                              background: '#fed7d7',
                              color: '#c53030',
                              border: 'none'
                            }}>
                              🔒 Riêng tư
                            </Badge>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div style={{ 
                          fontSize: 12, 
                          color: '#a0aec0',
                          marginBottom: 10
                        }}>
                          {formatDate(response.createdAt)}
                        </div>
                        
                        {/* Response Content */}
                        <div style={{ 
                          fontSize: 14, 
                          lineHeight: 1.6,
                          color: '#4a5568',
                          whiteSpace: 'pre-wrap',
                          background: '#fff',
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid #e2e8f0'
                        }}>
                          {response.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}






