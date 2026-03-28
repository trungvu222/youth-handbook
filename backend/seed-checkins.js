const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAttendance() {
  try {
    console.log('\n⏰ SEEDING CHECK-IN DATA...\n');
    
    // Get all activities
    const activities = await prisma.activity.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          }
        }
      }
    });

    console.log(`📌 Found ${activities.length} activities\n`);

    for (const activity of activities) {
      const startTime = new Date(activity.startTime);
      const participants = activity.participants;
      
      if (participants.length === 0) continue;

      // Seed pattern: 6 on-time, 4 late, rest registered (not checked in)
      const onTimeCount = Math.min(6, participants.length);
      const lateCount = Math.min(4, participants.length - onTimeCount);
      
      console.log(`📍 ${activity.title}`);
      console.log(`   Start: ${startTime.toLocaleString('vi-VN')}`);
      
      // On-time check-ins (0-14 minutes after start)
      for (let i = 0; i < onTimeCount; i++) {
        const p = participants[i];
        const minutesOffset = Math.floor(Math.random() * 15); // 0-14 minutes
        const checkInTime = new Date(startTime.getTime() + minutesOffset * 60000);
        
        await prisma.activityParticipant.update({
          where: { id: p.id },
          data: {
            status: 'CHECKED_IN',
            checkInTime: checkInTime
          }
        });
      }
      console.log(`   ✅ ${onTimeCount} đúng giờ`);
      
      // Late check-ins (16-45 minutes after start)
      for (let i = onTimeCount; i < onTimeCount + lateCount; i++) {
        const p = participants[i];
        const minutesOffset = 16 + Math.floor(Math.random() * 30); // 16-45 minutes
        const checkInTime = new Date(startTime.getTime() + minutesOffset * 60000);
        
        await prisma.activityParticipant.update({
          where: { id: p.id },
          data: {
            status: 'CHECKED_IN',
            checkInTime: checkInTime
          }
        });
      }
      console.log(`   ⏰ ${lateCount} đến trễ`);
      
      // Rest stay as REGISTERED (not checked in)
      const notCheckedIn = participants.length - onTimeCount - lateCount;
      console.log(`   ⏸️  ${notCheckedIn} chưa điểm danh\n`);
    }

    console.log('✅ SEEDING COMPLETE!\n');
    console.log('📊 Pattern for each activity:');
    console.log('   - 6 users: đúng giờ (0-14 phút)');
    console.log('   - 4 users: đến trễ (16-45 phút)');
    console.log('   - Rest: chưa điểm danh\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAttendance();
