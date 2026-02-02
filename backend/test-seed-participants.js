const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedParticipants() {
  try {
    // Lấy activity theo thứ tự (giống test script)
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const activity = activities[0];
    
    if (!activity) {
      console.log('❌ Không tìm thấy hoạt động!');
      return;
    }
    
    console.log(`📌 Activity: ${activity.title} (${activity.id})`);
    
    // Lấy danh sách users
    const users = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      take: 15
    });
    
    if (users.length < 15) {
      console.log(`⚠️  Chỉ có ${users.length} users, cần tạo thêm...`);
      
      // Tạo thêm users để có đủ 15
      const bcrypt = require('bcryptjs');
      const numToCreate = 15 - users.length;
      
      for (let i = 0; i < numToCreate; i++) {
        const passwordHash = await bcrypt.hash('123456', 10);
        const newUser = await prisma.user.create({
          data: {
            username: `member${users.length + i + 1}`,
            email: `member${users.length + i + 1}@youth.com`,
            passwordHash,
            fullName: `Đoàn viên ${users.length + i + 1}`,
            role: 'MEMBER',
            phone: `09${String(users.length + i + 1).padStart(8, '0')}`,
            youthPosition: 'Đoàn viên'
          }
        });
        users.push(newUser);
        console.log(`   ✅ Tạo user: ${newUser.username}`);
      }
    }
    
    console.log(`\n👥 Đăng ký ${users.length} người tham gia...`);
    
    // Đăng ký tất cả users vào activity
    for (const user of users) {
      await prisma.activityParticipant.create({
        data: {
          activityId: activity.id,
          userId: user.id,
          status: 'REGISTERED'
        }
      });
      console.log(`   ✅ ${user.username} đã đăng ký`);
    }
    
    console.log('\n🎉 Hoàn thành! Có thể chạy test script giờ.');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedParticipants();
