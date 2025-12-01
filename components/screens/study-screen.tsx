'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  FileText, 
  Video, 
  Headphones, 
  Award,
  Clock,
  Users,
  TrendingUp,
  Star
} from 'lucide-react'
import { studyApi } from '@/lib/api'

interface StudyTopic {
  id: string
  title: string
  description: string
  category: string
  userProgress?: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    completedAt?: string
    lastAccessedAt: string
  }
  totalMaterials: number
  hasQuiz: boolean
  materials?: StudyMaterial[]
}

interface StudyMaterial {
  id: string
  title: string
  type: 'VIDEO' | 'PDF' | 'ARTICLE' | 'PRESENTATION' | 'AUDIO'
  duration?: number
  orderIndex: number
  isRequired: boolean
  userProgress?: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    viewedDuration: number
    completedAt?: string
  }
  canAccess: boolean
}

interface StudyProgress {
  stats: {
    totalTopics: number
    completedTopics: number
    inProgressTopics: number
    totalQuizzes: number
    passedQuizzes: number
    averageScore: number
  }
  recentTopics: any[]
  recentQuizzes: any[]
}

const categoryColors = {
  'Nghị quyết': 'bg-red-100 text-red-800',
  'Pháp luật': 'bg-blue-100 text-blue-800',
  'Kỹ năng': 'bg-green-100 text-green-800',
  'Tiếng Anh': 'bg-purple-100 text-purple-800',
}

const materialIcons = {
  VIDEO: Video,
  PDF: FileText,
  ARTICLE: BookOpen,
  PRESENTATION: FileText,
  AUDIO: Headphones,
}

export default function StudyScreen() {
  const [topics, setTopics] = useState<StudyTopic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null)
  const [progress, setProgress] = useState<StudyProgress | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'topics' | 'progress' | 'leaderboard'>('topics')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      const [topicsResult, progressResult, leaderboardResult] = await Promise.all([
        studyApi.getStudyTopics(selectedCategory),
        studyApi.getMyProgress(),
        studyApi.getLeaderboard(selectedCategory)
      ])

      if (topicsResult.success) {
        setTopics(topicsResult.data)
      }

      if (progressResult.success) {
        setProgress(progressResult.data)
      }

      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.data.leaderboard)
      }
    } catch (error) {
      console.error('Error loading study data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartMaterial = async (materialId: string) => {
    try {
      const result = await studyApi.startStudyMaterial(materialId)
      if (result.success) {
        // Reload topic details
        if (selectedTopic) {
          const topicResult = await studyApi.getStudyTopic(selectedTopic.id)
          if (topicResult.success) {
            setSelectedTopic(topicResult.data)
          }
        }
      }
    } catch (error) {
      console.error('Error starting material:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Học tập</h1>
        <p className="opacity-90">Nâng cao kiến thức và kỹ năng</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-white">
        <div className="flex">
          {[
            { key: 'topics', label: 'Chuyên đề', icon: BookOpen },
            { key: 'progress', label: 'Tiến độ', icon: TrendingUp },
            { key: 'leaderboard', label: 'Bảng xếp hạng', icon: Award }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'topics' && (
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'Nghị quyết', 'Pháp luật', 'Kỹ năng', 'Tiếng Anh'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category === 'all' ? 'Tất cả' : category}
                </Button>
              ))}
            </div>

            {/* Topics List */}
            {topics.map((topic) => (
              <Card key={topic.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTopic(topic)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-sm">{topic.title}</h3>
                    <Badge className={categoryColors[topic.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
                      {topic.category}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {topic.totalMaterials} tài liệu
                      </span>
                      {topic.hasQuiz && (
                        <span className="flex items-center gap-1">
                          <Award size={12} />
                          Quiz
                        </span>
                      )}
                    </div>
                    
                    {topic.userProgress && (
                      <Badge variant="outline" className={getStatusColor(topic.userProgress.status)}>
                        {topic.userProgress.status === 'COMPLETED' ? 'Hoàn thành' :
                         topic.userProgress.status === 'IN_PROGRESS' ? 'Đang học' : 'Chưa bắt đầu'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'progress' && progress && (
          <div className="space-y-4">
            {/* Statistics Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thống kê tổng quan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{progress.stats.completedTopics}</div>
                    <div className="text-xs text-gray-500">Chuyên đề hoàn thành</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{progress.stats.passedQuizzes}</div>
                    <div className="text-xs text-gray-500">Quiz đã qua</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tiến độ chung</span>
                    <span>{Math.round((progress.stats.completedTopics / progress.stats.totalTopics) * 100)}%</span>
                  </div>
                  <Progress value={(progress.stats.completedTopics / progress.stats.totalTopics) * 100} />
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{progress.stats.averageScore}%</div>
                  <div className="text-xs text-gray-500">Điểm trung bình quiz</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progress.recentTopics.slice(0, 3).map((topic) => (
                    <div key={topic.topic.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{topic.topic.title}</div>
                        <div className="text-xs text-gray-500">{topic.topic.category}</div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(topic.status)}>
                        {topic.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="text-yellow-500" />
                  Top học viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((user, index) => (
                    <div key={user.user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.quizCount} quiz</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{user.averageScore}%</div>
                        <div className="text-xs text-gray-500">Điểm TB</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] overflow-y-auto rounded-t-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold">{selectedTopic.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
                  ✕
                </Button>
              </div>
              <Badge className={categoryColors[selectedTopic.category as keyof typeof categoryColors]}>
                {selectedTopic.category}
              </Badge>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">{selectedTopic.description}</p>
              
              {selectedTopic.materials && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Tài liệu học tập</h3>
                  {selectedTopic.materials.map((material) => {
                    const IconComponent = materialIcons[material.type]
                    return (
                      <Card key={material.id} className={material.canAccess ? '' : 'opacity-50'}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent size={20} className="text-blue-600" />
                              <div>
                                <div className="font-medium text-sm">{material.title}</div>
                                <div className="text-xs text-gray-500">
                                  {material.type} 
                                  {material.duration && ` • ${Math.round(material.duration / 60)} phút`}
                                  {material.isRequired && ' • Bắt buộc'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {material.userProgress && (
                                <Badge variant="outline" className={getStatusColor(material.userProgress.status)}>
                                  {material.userProgress.status === 'COMPLETED' ? 'Xong' :
                                   material.userProgress.status === 'IN_PROGRESS' ? 'Đang học' : 'Chưa học'}
                                </Badge>
                              )}
                              
                              {material.canAccess && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleStartMaterial(material.id)}
                                  disabled={material.userProgress?.status === 'COMPLETED'}
                                >
                                  <Play size={14} className="mr-1" />
                                  {material.userProgress?.status === 'COMPLETED' ? 'Hoàn thành' : 'Học'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}