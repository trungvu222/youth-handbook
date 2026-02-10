const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('\n🔍 CHECKING ATTENDANCE DATA...\n');
    
    // Find the activity
    const activity = await prisma.activity.findFirst({
      where: {
        title: { contains: 'Tìm hiểu' }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: {
            checkInTime: 'asc'
          }
        }
      }
    });

    if (!activity) {
      console.log('❌ Không tìm thấy activity "Tìm hiểu về Đoàn"');
      return;
    }

    console.log('✅ ACTIVITY FOUND:');
    console.log('   ID:', activity.id);
    console.log('   Title:', activity.title);
    console.log('   Start Time:', activity.startTime);
    console.log('   Location:', activity.location);
    
    const total = activity.participants.length;
    const checkedIn = activity.participants.filter(p => p.status === 'CHECKED_IN');
    const registered = activity.participants.filter(p => p.status === 'REGISTERED');
    const absent = activity.participants.filter(p => p.status === 'ABSENT');
    
    console.log('\n📊 STATISTICS:');
    console.log('   Total participants:', total);
    console.log('   Checked in:', checkedIn.length);
    console.log('   Registered (not checked in):', registered.length);
    console.log('   Absent:', absent.length);
    
    if (checkedIn.length > 0) {
      console.log('\n✅ CHECKED IN USERS:');
      const lateThreshold = new Date(activity.startTime.getTime() + 15 * 60000);
      const onTime = [];
      const late = [];
      
      checkedIn.forEach(p => {
        if (p.checkInTime <= lateThreshold) {
          onTime.push(p);
        } else {
          late.push(p);
        }
      });
      
      console.log('   On time:', onTime.length);
      console.log('   Late:', late.length);
      
      console.log('\n   Details:');
      checkedIn.forEach((p, i) => {
        const isLate = p.checkInTime > lateThreshold;
        console.log(`   ${i+1}. ${p.user.fullName} - ${p.checkInTime.toLocaleString('vi-VN')} ${isLate ? '⏰ TRỄ' : '✅ ĐÚN'}`);
      });
    } else {
      console.log('\n⚠️  NO CHECKED IN DATA - Need to seed test data!');
    }
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
