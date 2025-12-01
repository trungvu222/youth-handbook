const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Bắt đầu seed database...');

    // 1. Create Units first
    console.log('📋 Tạo units...');
    
    const unit1 = await prisma.unit.create({
      data: {
        name: 'Chi đoàn Công nghệ',
      },
    });

    const unit2 = await prisma.unit.create({
      data: {
        name: 'Chi đoàn Kinh tế',
      },
    });

    console.log(`✅ Tạo thành công ${2} units`);

    // 2. Create Admin user
    console.log('👤 Tạo users...');
    
    const hashedPassword = await bcrypt.hash('123456', 12);

    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@youth.com',
        fullName: 'Nguyễn Văn Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        points: 150,
        unit: {
          connect: { id: unit1.id }
        },
        phone: '0123456789',
        address: 'Hà Nội',
        youthPosition: 'Bí thư Đoàn',
      },
    });

    // Set admin as leader of unit1
    await prisma.unit.update({
      where: { id: unit1.id },
      data: { leaderId: adminUser.id }
    });

    // 3. Create Leader user
    const leaderUser = await prisma.user.create({
      data: {
        username: 'leader1',
        email: 'leader1@youth.com',
        fullName: 'Trần Thị Leader',
        passwordHash: hashedPassword,
        role: 'LEADER',
        points: 120,
        unit: {
          connect: { id: unit2.id }
        },
        phone: '0987654321',
        address: 'Hà Nội',
        youthPosition: 'Phó Bí thư Chi đoàn',
      },
    });

    // Set leader as leader of unit2
    await prisma.unit.update({
      where: { id: unit2.id },
      data: { leaderId: leaderUser.id }
    });

    // 4. Create Members
    const memberUsers = [];
    for (let i = 1; i <= 8; i++) {
      const member = await prisma.user.create({
        data: {
          username: `member${i}`,
          email: `member${i}@youth.com`,
          fullName: `Đoàn viên ${i}`,
          passwordHash: hashedPassword,
          role: 'MEMBER',
          points: 80 + Math.floor(Math.random() * 40), // 80-120 points
          unit: {
            connect: { id: i <= 4 ? unit1.id : unit2.id }
          },
          phone: `091234567${i}`,
          address: 'Hà Nội',
          youthPosition: 'Đoàn viên',
        },
      });
      memberUsers.push(member);
    }

    console.log(`✅ Tạo thành công ${memberUsers.length + 2} users`);

    // 5. Create some sample points history
    console.log('📊 Tạo lịch sử điểm...');
    
    const allUsers = [adminUser, leaderUser, ...memberUsers];
    
    for (const user of allUsers) {
      // Create some random points history
      for (let i = 0; i < 3; i++) {
        await prisma.pointsHistory.create({
          data: {
            userId: user.id,
            points: [5, 10, 15, -5, -10][Math.floor(Math.random() * 5)],
            reason: [
              'Tham gia sinh hoạt',
              'Hoàn thành nhiệm vụ',
              'Góp ý tích cực',
              'Đi trễ sinh hoạt',
              'Vắng mặt không phép'
            ][Math.floor(Math.random() * 5)],
            type: Math.random() > 0.3 ? 'EARN' : 'DEDUCT',
          },
        });
      }
    }

    console.log('✅ Tạo thành công lịch sử điểm');

    console.log('🎉 Seed database hoàn thành!');
    console.log('📊 Dữ liệu đã tạo:');
    console.log(`   - 2 units: ${unit1.name}, ${unit2.name}`);
    console.log(`   - ${allUsers.length} users (1 Admin, 1 Leader, ${memberUsers.length} Members)`);
    console.log('   - Lịch sử điểm mẫu');
    console.log('');
    console.log('🔐 Thông tin đăng nhập:');
    console.log('   Admin: admin / 123456');
    console.log('   Leader: leader1 / 123456');
    console.log('   Member: member1 / 123456');
    console.log('');

  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
