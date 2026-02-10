const { PrismaClient } = require('@prisma/client');

async function checkActivities() {
  const prisma = new PrismaClient();
  
  try {
    // Get activities with dates
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        createdAt: true
      },
      orderBy: { startTime: 'desc' },
      take: 20
    });
    
    console.log('\n📅 ACTIVITIES (sorted by startTime):');
    console.log('=' .repeat(80));
    
    // Group by year
    const byYear = {};
    activities.forEach(a => {
      const year = a.startTime ? new Date(a.startTime).getFullYear() : 'No date';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(a);
    });
    
    Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
      console.log(`\n📆 Year ${year}: ${byYear[year].length} activities`);
      byYear[year].forEach((a, i) => {
        const startDate = a.startTime ? new Date(a.startTime).toISOString().split('T')[0] : 'N/A';
        console.log(`  ${i + 1}. [${startDate}] ${a.title.substring(0, 50)}`);
      });
    });
    
    // Count by year
    const totalCount = await prisma.activity.count();
    console.log(`\n📊 TOTAL: ${totalCount} activities`);
    
    // Count for 2026
    const count2026 = await prisma.activity.count({
      where: {
        startTime: {
          gte: new Date('2026-01-01'),
          lt: new Date('2027-01-01')
        }
      }
    });
    console.log(`📊 Activities in 2026: ${count2026}`);
    
    // Count for 2025
    const count2025 = await prisma.activity.count({
      where: {
        startTime: {
          gte: new Date('2025-01-01'),
          lt: new Date('2026-01-01')
        }
      }
    });
    console.log(`📊 Activities in 2025: ${count2025}`);
    
    // Count for current month (Feb 2026)
    const count2026Feb = await prisma.activity.count({
      where: {
        startTime: {
          gte: new Date('2026-02-01'),
          lt: new Date('2026-03-01')
        }
      }
    });
    console.log(`📊 Activities in Feb 2026: ${count2026Feb}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();
