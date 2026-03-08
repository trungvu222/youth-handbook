'use client'

import { useState } from 'react'
import StudyScreenMobile from './study-screen-mobile'
import ExamsScreenMobile from './exams-screen-mobile'
import { BookOpen, Trophy } from 'lucide-react'

export default function EnhancedStudyScreen() {
  const [activeTab, setActiveTab] = useState('study')

  // Inline styles for mobile compatibility
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#faf5ff',
    minHeight: '100%',
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #a855f7 100%)',
    padding: '20px 16px 14px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 6px rgba(109,40,217,0.08)',
  }

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: isActive ? '#f5f3ff' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #7c3aed' : '3px solid transparent',
    color: isActive ? '#7c3aed' : '#94a3b8',
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
      {/* Header banner */}
      <div style={headerStyle}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -25, right: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -10, left: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>📚 Học tập</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>Trợ lý ảo AI & Kỳ thi</div>
        </div>
      </div>

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

