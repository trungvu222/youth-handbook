'use client'

import { useState } from 'react'
import StudyScreenMobile from './study-screen-mobile'
import ExamsScreenMobile from './exams-screen-mobile'
import { BookOpen, Trophy } from 'lucide-react'

export default function EnhancedStudyScreen() {
  const [activeTab, setActiveTab] = useState('study')

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
    color: isActive ? '#2563eb' : '#6b7280',
    fontWeight: isActive ? 600 : 500,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  const iconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
  }

  return (
    <div style={containerStyle}>
      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button 
          style={getTabStyle(activeTab === 'study')}
          onClick={() => setActiveTab('study')}
        >
          <BookOpen style={iconStyle} />
          Trợ lý ảo
        </button>
        <button 
          style={getTabStyle(activeTab === 'exams')}
          onClick={() => setActiveTab('exams')}
        >
          <Trophy style={iconStyle} />
          Kỳ thi
        </button>
      </div>
      
      {/* Content */}
      <div>
        {activeTab === 'study' ? <StudyScreenMobile /> : <ExamsScreenMobile />}
      </div>
    </div>
  )
}

