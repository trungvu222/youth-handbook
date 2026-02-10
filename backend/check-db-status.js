const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const userCount = await prisma.user.count();
    const unitCount = await prisma.unit.count();
    const activityCount = await prisma.activity.count();
    const surveyCount = await prisma.survey.count();
    const postCount = await prisma.post.count();
    
    console.log('=== DATABASE STATUS ===');
    console.log('Users:', userCount);
    console.log('Units:', unitCount);
    console.log('Activities:', activityCount);
    console.log('Surveys:', surveyCount);
    console.log('Posts:', postCount);
    
    // Check tables with try-catch for each
    try {
      const docCount = await prisma.document.count();
      console.log('Documents:', docCount);
    } catch(e) { console.log('Documents: N/A'); }
    
    try {
      const examCount = await prisma.exam.count();
      console.log('Exams:', examCount);
    } catch(e) { console.log('Exams: N/A'); }
    
    try {
      const ratingCount = await prisma.ratingPeriod.count();
      console.log('Rating Periods:', ratingCount);
    } catch(e) { console.log('Rating Periods: N/A'); }
    
    try {
      const pointsCount = await prisma.pointsHistory.count();
      console.log('Points History:', pointsCount);
    } catch(e) { console.log('Points History: N/A'); }

    // Check recent data
    const latestUser = await prisma.user.findFirst({ orderBy: { updatedAt: 'desc' }, select: { fullName: true, role: true, updatedAt: true } });
    const latestActivity = await prisma.activity.findFirst({ orderBy: { updatedAt: 'desc' }, select: { title: true, updatedAt: true } });
    
    console.log('\n=== LATEST UPDATES ===');
    console.log('Latest user update:', latestUser?.fullName, `(${latestUser?.role})`, '-', latestUser?.updatedAt);
    console.log('Latest activity update:', latestActivity?.title, '-', latestActivity?.updatedAt);
    
    // Check admin exists
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { fullName: true, email: true, isActive: true } });
    console.log('\n=== ADMIN ACCOUNT ===');
    console.log('Admin:', admin?.fullName, '-', admin?.email, '- Active:', admin?.isActive);
    
    // Check sample of real user data
    const sampleUsers = await prisma.user.findMany({ take: 5, select: { fullName: true, role: true, unitId: true, points: true }, orderBy: { createdAt: 'desc' } });
    console.log('\n=== SAMPLE USERS (Latest 5) ===');
    sampleUsers.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.fullName} | Role: ${u.role} | Unit: ${u.unitId ? 'Yes' : 'No'} | Points: ${u.points}`);
    });

    // Test write operation
    console.log('\n=== WRITE TEST ===');
    const testUpdate = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (testUpdate) {
      await prisma.user.update({ where: { id: testUpdate.id }, data: { updatedAt: new Date() } });
      console.log('Write test: OK - Admin record updated successfully');
    }

    await prisma.$disconnect();
    console.log('\n=== ALL CHECKS PASSED ===');
  } catch(e) {
    console.error('DB Error:', e.message);
    await prisma.$disconnect();
  }
}

check();
