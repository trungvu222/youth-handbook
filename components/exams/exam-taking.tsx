'use client'

import { useState, useEffect, useRef } from 'react'
import { examApi } from '../../lib/api'

interface ExamQuestion {
  id: string;
  questionText: string;
  questionType: string;
  answers: Array<{ id: string; text: string }>;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  category: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  pointsReward: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions?: ExamQuestion[];
  [key: string]: any;
}

interface ExamTakingProps {
  exam: Exam;
  onComplete: () => void;
  onBack: () => void;
}

export function ExamTaking({ exam, onComplete, onBack }: ExamTakingProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState((exam.duration || 60) * 60)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' })
  const timerRef = useRef<NodeJS.Timeout>()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startExam()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSubmitExam(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading])

  const startExam = async () => {
    try {
      setLoading(true)
      const response = await examApi.startExam(exam.id)
      if (response.success && response.data) {
        setAttemptId(response.data.attemptId)
        setQuestions(response.data.questions)
      } else {
        setError(response.error || 'Khong the bat dau ky thi')
      }
    } catch {
      setError('Khong the ket noi server')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), duration)
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleSubmitExam = async (autoSubmit = false) => {
    try {
      setSubmitting(true)
      if (timerRef.current) clearInterval(timerRef.current)
      const formattedAnswers = Object.entries(answers).map(([questionId, answerIndex]) => {
        const question = questions.find(q => q.id === questionId)
        if (!question || !question.answers || answerIndex >= question.answers.length) return null
        return { questionId, answerId: question.answers[answerIndex].id }
      }).filter(Boolean)
      const response = await examApi.submitExam(attemptId, formattedAnswers as any)
      if (response.success) {
        showToast(
          autoSubmit
            ? 'Hết giờ! Bài thi đã được nộp tự động. Vui lòng đợi admin chấm điểm.'
            : 'Nộp bài thành công! Vui lòng đợi admin chấm điểm để xem kết quả.',
          'success', 3500
        )
        setTimeout(() => onComplete(), 3600)
      } else {
        showToast('Lỗi: ' + (response.error || 'Không thể nộp bài thi'), 'error')
      }
    } catch {
      showToast('Lỗi kết nối, vui lòng thử lại', 'error')
    } finally {
      setSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
  const getTimeColor = () => { const p=(timeLeft/((exam.duration||60)*60))*100; return p<=10?'#ef4444':p<=25?'#f97316':'#16a34a' }
  const answeredCount = Object.keys(answers).length
  const isAnswered = (idx: number) => answers[questions[idx]?.id] !== undefined
  const isLowTime = timeLeft <= 300

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'16px'}}>
      <div style={{width:'40px',height:'40px',border:'4px solid #e9d5ff',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
      <p style={{color:'#64748b',fontSize:'15px'}}>Đang chuẩn bị kỳ thi...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{padding:'32px',textAlign:'center'}}>
      <div style={{fontSize:'40px',marginBottom:'12px'}}>❌</div>
      <p style={{color:'#dc2626',marginBottom:'16px'}}>{error}</p>
      <button onClick={onBack} style={{padding:'10px 24px',backgroundColor:'#7c3aed',color:'white',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Quay lai</button>
    </div>
  )

  if (questions.length === 0) return (
    <div style={{padding:'32px',textAlign:'center'}}>
      <div style={{fontSize:'40px',marginBottom:'12px'}}>⚠️</div>
      <p style={{color:'#64748b',marginBottom:'16px'}}>Khong co cau hoi nao</p>
      <button onClick={onBack} style={{padding:'10px 24px',backgroundColor:'#7c3aed',color:'white',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Quay lai</button>
    </div>
  )

  const currentQuestion = questions[currentQuestionIndex]

  const toastBg = toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6'
  const toastIcon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'

  return (
    <div style={{backgroundColor:'#f5f6fa',minHeight:'100%',paddingBottom:'100px'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* TOAST */}
      {toast.show && (
        <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',zIndex:9999,backgroundColor:toastBg,color:'#fff',padding:'12px 20px',borderRadius:'14px',fontSize:'14px',fontWeight:600,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(0,0,0,0.2)',animation:'slideDown 0.3s ease',minWidth:'240px',maxWidth:'320px',textAlign:'center',justifyContent:'center'}}>
          <span>{toastIcon}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:'linear-gradient(135deg,#7c3aed 0%,#8b5cf6 50%,#a78bfa 100%)',padding:'16px',color:'white',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'12px',opacity:0.85,marginBottom:'2px'}}>Cau {currentQuestionIndex+1} / {questions.length}</div>
            <div style={{fontSize:'15px',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{exam.title}</div>
          </div>
          <div style={{textAlign:'right',marginLeft:'12px',flexShrink:0}}>
            <div style={{fontSize:'22px',fontWeight:800,color:isLowTime?'#fca5a5':'white'}}>⏱ {formatTime(timeLeft)}</div>
            <div style={{fontSize:'11px',opacity:0.85}}>Da tra loi: {answeredCount}/{questions.length}</div>
          </div>
        </div>
        <div style={{marginTop:'10px',backgroundColor:'rgba(255,255,255,0.25)',borderRadius:'99px',height:'5px',overflow:'hidden'}}>
          <div style={{height:'100%',backgroundColor:'white',borderRadius:'99px',width:`${((currentQuestionIndex+1)/questions.length)*100}%`,transition:'width 0.3s'}}/>
        </div>
      </div>

      {/* LOW TIME WARNING */}
      {isLowTime && (
        <div style={{backgroundColor:'#fef3c7',border:'1px solid #fcd34d',padding:'10px 16px',display:'flex',alignItems:'center',gap:'8px'}}>
          <span>⚠️</span>
          <span style={{fontSize:'13px',color:'#92400e',fontWeight:500}}>Chi con {formatTime(timeLeft)} de hoan thanh bai thi!</span>
        </div>
      )}

      {/* QUESTION CARD */}
      <div style={{margin:'12px 16px',backgroundColor:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <div style={{padding:'14px 16px 10px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{padding:'3px 10px',backgroundColor:'#ede9fe',color:'#5b21b6',borderRadius:'99px',fontSize:'12px',fontWeight:600}}>Cau {currentQuestionIndex+1}/{questions.length}</span>
          <span style={{padding:'3px 10px',backgroundColor:'#f0fdf4',color:'#15803d',borderRadius:'99px',fontSize:'12px',fontWeight:600}}>{currentQuestion.points} diem</span>
          {isAnswered(currentQuestionIndex) && <span style={{marginLeft:'auto',color:'#16a34a',fontSize:'18px'}}>✓</span>}
        </div>
        <div style={{padding:'16px 16px 12px'}}>
          <p style={{fontSize:'15px',fontWeight:600,color:'#0f172a',lineHeight:1.6,margin:0}}>{currentQuestion.questionText}</p>
        </div>
        <div style={{padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:'10px'}}>
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = answers[currentQuestion.id] === index
            return (
              <div key={answer.id} onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                style={{padding:'13px 14px',borderRadius:'12px',border:`2px solid ${isSelected?'#7c3aed':'#e2e8f0'}`,backgroundColor:isSelected?'#faf5ff':'#ffffff',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:'12px'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'50%',flexShrink:0,border:`2px solid ${isSelected?'#7c3aed':'#cbd5e1'}`,backgroundColor:isSelected?'#7c3aed':'white',display:'flex',alignItems:'center',justifyContent:'center',marginTop:'1px'}}>
                  {isSelected && <div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:'white'}}/>}
                </div>
                <span style={{fontSize:'14px',color:isSelected?'#5b21b6':'#374151',fontWeight:isSelected?600:400,lineHeight:1.5}}>
                  {String.fromCharCode(65+index)}. {answer.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* QUESTION NAVIGATOR */}
      <div style={{margin:'0 16px 12px',backgroundColor:'white',borderRadius:'14px',padding:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',border:'1px solid #f1f5f9'}}>
        <div style={{fontSize:'11px',color:'#64748b',fontWeight:600,marginBottom:'8px',textTransform:'uppercase'}}>Chuyen cau</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {questions.map((_,idx) => (
            <button key={idx} onClick={() => setCurrentQuestionIndex(idx)}
              style={{width:'34px',height:'34px',borderRadius:'8px',border:idx===currentQuestionIndex?'2px solid #7c3aed':'1.5px solid #e2e8f0',backgroundColor:idx===currentQuestionIndex?'#7c3aed':isAnswered(idx)?'#f0fdf4':'white',color:idx===currentQuestionIndex?'white':isAnswered(idx)?'#15803d':'#64748b',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
              {idx+1}
            </button>
          ))}
        </div>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div style={{display:'flex',gap:'10px',padding:'0 16px',marginBottom:'12px'}}>
        <button onClick={() => setCurrentQuestionIndex(Math.max(0,currentQuestionIndex-1))} disabled={currentQuestionIndex===0}
          style={{flex:1,padding:'13px',borderRadius:'12px',border:'1.5px solid #e2e8f0',backgroundColor:currentQuestionIndex===0?'#f8fafc':'white',color:currentQuestionIndex===0?'#cbd5e1':'#374151',fontSize:'14px',fontWeight:600,cursor:currentQuestionIndex===0?'not-allowed':'pointer'}}>
          ‹ Cau truoc
        </button>
        {currentQuestionIndex===questions.length-1 ? (
          <button onClick={() => setShowConfirmSubmit(true)} disabled={submitting}
            style={{flex:1.5,padding:'13px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontSize:'14px',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 10px rgba(22,163,74,0.3)'}}>
            {submitting?'⏳ Dang nop...':'✅ Nop bai'}
          </button>
        ) : (
          <button onClick={() => setCurrentQuestionIndex(Math.min(questions.length-1,currentQuestionIndex+1))}
            style={{flex:1,padding:'13px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',color:'white',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
            Cau sau ›
          </button>
        )}
      </div>

      {/* SUBMIT CONFIRM DIALOG */}
      {showConfirmSubmit && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'20px'}} onClick={() => !submitting && setShowConfirmSubmit(false)}>
          <div style={{backgroundColor:'white',borderRadius:'20px',width:'100%',maxWidth:'380px',overflow:'hidden',boxShadow:'0 20px 40px rgba(0,0,0,0.15)'}} onClick={e => e.stopPropagation()}>
            <div style={{background:'linear-gradient(135deg,#16a34a,#15803d)',padding:'20px 24px',color:'white',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'6px'}}>📝</div>
              <div style={{fontSize:'18px',fontWeight:700}}>Xac nhan nop bai</div>
              <div style={{fontSize:'13px',opacity:0.85,marginTop:'4px'}}>Ban co chac muon nop bai khong?</div>
            </div>
            <div style={{padding:'20px 24px'}}>
              <div style={{backgroundColor:'#f8fafc',borderRadius:'12px',padding:'14px',marginBottom:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                  <span style={{color:'#64748b',fontSize:'13px'}}>Da tra loi</span>
                  <span style={{fontWeight:700,fontSize:'13px',color:answeredCount===questions.length?'#16a34a':'#f97316'}}>{answeredCount}/{questions.length} cau</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'#64748b',fontSize:'13px'}}>Thoi gian con lai</span>
                  <span style={{fontWeight:700,fontSize:'13px',color:getTimeColor()}}>{formatTime(timeLeft)}</span>
                </div>
                {answeredCount<questions.length && (
                  <div style={{marginTop:'10px',padding:'8px 10px',backgroundColor:'#fff7ed',borderRadius:'8px',border:'1px solid #fed7aa'}}>
                    <span style={{fontSize:'12px',color:'#c2410c'}}>⚠️ Con {questions.length-answeredCount} cau chua tra loi</span>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={() => setShowConfirmSubmit(false)} disabled={submitting}
                  style={{flex:1,padding:'13px',borderRadius:'12px',border:'1.5px solid #e2e8f0',backgroundColor:'white',color:'#374151',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
                  Tiep tuc
                </button>
                <button onClick={() => handleSubmitExam()} disabled={submitting}
                  style={{flex:1,padding:'13px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontSize:'14px',fontWeight:700,cursor:submitting?'not-allowed':'pointer',opacity:submitting?0.7:1}}>
                  {submitting?'⏳ Dang nop...':'✅ Nop bai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
