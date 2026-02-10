const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log('Total users in database:', count);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('\nAll Users list:');
  users.forEach((u, i) => {
    console.log(`${i+1}. ${u.fullName} (${u.email}) - ${u.role} - Active: ${u.isActive}`);
  });
  
  const activeCount = users.filter(u => u.isActive).length;
  console.log(`\nActive users: ${activeCount}/${count}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
