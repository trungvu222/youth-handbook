const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reseedParticipants() {
  try {
    // Xóa tất cả participants cũ
    console.log('🗑️  Xóa tất cả participants cũ...');
    await prisma.activityParticipant.deleteMany();
    
    // Lấy TẤT CẢ activities
    const activities = await prisma.activity.findMany({
      orderBy: { startTime: 'desc' }
    });
    
    if (activities.length === 0) {
      console.log('❌ Không tìm thấy hoạt động nào!');
      return;
    }
    
    console.log(`\n📋 Tìm thấy ${activities.length} hoạt động`);
    
    // Lấy danh sách users
    let users = await prisma.user.findMany({
      where: { role: 'MEMBER' }
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
    
    console.log(`\n👥 Đăng ký ${users.length} người vào TẤT CẢ ${activities.length} hoạt động...\n`);
    
    // Đăng ký users vào TẤT CẢ activities
    for (const activity of activities) {
      console.log(`📌 ${activity.title}`);
      
      // Đăng ký tất cả users vào activity này
      for (const user of users) {
        await prisma.activityParticipant.create({
          data: {
            activityId: activity.id,
            userId: user.id,
            status: 'REGISTERED'
          }
        });
      }
      console.log(`   ✅ Đã đăng ký ${users.length} người\n`);
    }
    
    console.log('🎉 Hoàn thành! Tất cả hoạt động đã có participants.');
    console.log(`   Tổng số hoạt động: ${activities.length}`);
    console.log(`   Mỗi hoạt động có: ${users.length} người đăng ký`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reseedParticipants();
