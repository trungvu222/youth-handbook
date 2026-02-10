const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickCheck() {
  const count = await prisma.activityParticipant.count({ where: { status: 'CHECKED_IN' } })
  console.log(`Total check-ins: ${count}`)
  
  const recent = await prisma.activityParticipant.findFirst({
    where: { status: 'CHECKED_IN' },
    include: { user: true, activity: true },
    orderBy: { checkInTime: 'desc' }
  })
  
  if (recent) {
    console.log(`\nMost recent check-in:`)
    console.log(`  User: ${recent.user.fullName}`)
    console.log(`  Activity: ${recent.activity.title}`)
    console.log(`  Time: ${new Date(recent.checkInTime).toLocaleString('vi-VN')}`)
    console.log(`  Points: +${recent.pointsEarned}`)
  }
  
  await prisma.$disconnect()
}

quickCheck()
