const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const ranks = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Đại úy']
  
  const users = await prisma.user.findMany({
    where: { militaryRank: null },
    select: { id: true, fullName: true }
  })
  
  for (const u of users) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)]
    await prisma.user.update({
      where: { id: u.id },
      data: { militaryRank: rank }
    })
    console.log(`${u.fullName} -> ${rank}`)
  }
  
  console.log(`\nDone: ${users.length} users updated`)
  await prisma.$disconnect()
}

main()
