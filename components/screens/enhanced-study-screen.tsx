'use client'

import { useState } from 'react'
import StudyScreenMobile from './study-screen-mobile'
import ExamsScreenMobile from './exams-screen-mobile'
import { BookOpen, Trophy } from 'lucide-react'

export default function EnhancedStudyScreen() {
  const [activeTab, setActiveTab] = useState('study')

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f5f6fa',
    minHeight: '100%',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: isActive ? '#fef2f2' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #dc2626' : '3px solid transparent',
    color: isActive ? '#dc2626' : '#94a3b8',
    fontWeight: isActive ? 600 : 500,
    fontSize: '14px',
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

