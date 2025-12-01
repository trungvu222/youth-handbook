'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StudyScreen from './study-screen'
import ExamsScreen from './exams-screen'
import { BookOpen, Trophy } from 'lucide-react'

export default function EnhancedStudyScreen() {
  const [activeTab, setActiveTab] = useState('study')

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">Học tập & Kiểm tra</h1>
        <p className="text-muted-foreground text-center">
          Nâng cao kiến thức và tham gia các kỳ thi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="study" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Trợ lý ảo
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Kỳ thi
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="study" className="mt-6">
          <StudyScreen />
        </TabsContent>
        
        <TabsContent value="exams" className="mt-6">
          <ExamsScreen />
        </TabsContent>
      </Tabs>
    </div>
  )
}

