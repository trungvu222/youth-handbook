'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StudyScreen from './study-screen'
import ExamsScreen from './exams-screen'
import { BookOpen, Trophy } from 'lucide-react'

export default function EnhancedStudyScreen() {
  const [activeTab, setActiveTab] = useState('study')

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '16px 16px 24px',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: '24px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#1f2937',
  }

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: '14px',
  }

  const tabsListStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
  }

  const getTabTriggerStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#2563eb' : '#6b7280',
    fontWeight: isActive ? 600 : 500,
    border: 'none',
    cursor: 'pointer',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  })

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
  }

  const contentStyle: React.CSSProperties = {
    marginTop: '24px',
  }

  return (
    <div style={containerStyle} className="container mx-auto px-4 py-6">
      <div style={headerStyle} className="mb-6">
        <h1 style={titleStyle} className="text-2xl font-bold text-center mb-2">Học tập & Kiểm tra</h1>
        <p style={subtitleStyle} className="text-muted-foreground text-center">
          Nâng cao kiến thức và tham gia các kỳ thi
        </p>
      </div>

      <div style={{ width: '100%' }}>
        <div style={tabsListStyle}>
          <button 
            style={getTabTriggerStyle(activeTab === 'study')}
            onClick={() => setActiveTab('study')}
          >
            <BookOpen style={iconStyle} className="h-4 w-4" />
            Trợ lý ảo
          </button>
          <button 
            style={getTabTriggerStyle(activeTab === 'exams')}
            onClick={() => setActiveTab('exams')}
          >
            <Trophy style={iconStyle} className="h-4 w-4" />
            Kỳ thi
          </button>
        </div>
        
        <div style={contentStyle}>
          {activeTab === 'study' ? <StudyScreen /> : <ExamsScreen />}
        </div>
      </div>
    </div>
  )
}

