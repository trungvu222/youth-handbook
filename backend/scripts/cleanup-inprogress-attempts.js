const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupInProgressAttempts() {
  try {
    console.log('🧹 Cleaning up IN_PROGRESS exam attempts...')

    const result = await prisma.examAttempt.deleteMany({
      where: {
        status: 'IN_PROGRESS'
      }
    })

    console.log(`✅ Deleted ${result.count} IN_PROGRESS attempts`)

    // Show remaining attempts
    const allAttempts = await prisma.examAttempt.findMany({
      include: {
        exam: { select: { title: true } },
        user: { select: { fullName: true } }
      }
    })

    console.log(`\n📋 Remaining attempts: ${allAttempts.length}`)
    allAttempts.forEach(attempt => {
      console.log(`  - ${attempt.user.fullName} → ${attempt.exam.title} (Attempt #${attempt.attemptNumber}, ${attempt.status})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupInProgressAttempts()
