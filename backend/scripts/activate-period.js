const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activatePeriod() {
  try {
    // Find the period first
    const foundPeriod = await prisma.ratingPeriod.findFirst({
      where: { 
        title: 'Xếp loại chất lượng quý 1/2026'
      }
    });

    if (!foundPeriod) {
      console.log('❌ Period not found');
      return;
    }

    // Update by ID
    const period = await prisma.ratingPeriod.update({
      where: { 
        id: foundPeriod.id
      },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log('✅ Period activated successfully!');
    console.log(`   Title: ${period.title}`);
    console.log(`   Status: ${period.status}`);
    console.log('\n✅ Ready to display in statistics dropdown!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activatePeriod();
