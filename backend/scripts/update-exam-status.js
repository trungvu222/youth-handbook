const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateExamStatus() {
  try {
    console.log('🔄 Updating all exams to be immediately available...')

    // Update all exams: set status to PUBLISHED and clear time restrictions
    const result = await prisma.exam.updateMany({
      data: {
        status: 'PUBLISHED',
        startTime: null,
        endTime: null
      }
    })

    console.log(`✅ Updated ${result.count} exams - Status: PUBLISHED, Time restrictions: REMOVED`)

    // List all exams to verify
    const allExams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        startTime: true,
        endTime: true,
        _count: {
          select: { questions: true }
        }
      }
    })

    console.log('\n📋 All exams:')
    allExams.forEach(exam => {
      const timeInfo = exam.startTime || exam.endTime ? 
        `⏰ ${exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Always'} - ${exam.endTime ? new Date(exam.endTime).toLocaleString() : 'Always'}` : 
        '✅ Always available'
      console.log(`  - ${exam.title}`)
      console.log(`    Status: ${exam.status} | Questions: ${exam._count.questions} | ${timeInfo}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExamStatus()
