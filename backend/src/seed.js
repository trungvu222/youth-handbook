const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Check if data already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@youth.com' }
    });

    if (existingAdmin) {
      console.log('✅ Database already seeded. Skipping...');
      return;
    }

    // Create Units first
    console.log('📋 Creating units...');
    
    const units = await Promise.all([
      prisma.unit.create({ data: { name: 'Chi đoàn Công nghệ' } }),
      prisma.unit.create({ data: { name: 'Chi đoàn Kinh tế' } }),
      prisma.unit.create({ data: { name: 'Chi đoàn Y khoa' } }),
      prisma.unit.create({ data: { name: 'Chi đoàn Sư phạm' } }),
      prisma.unit.create({ data: { name: 'Chi đoàn Kỹ thuật' } }),
    ]);

    console.log(`✅ Created ${units.length} units`);

    // Create Admin user
    console.log('👤 Creating users...');
    
    const hashedPassword = await hashPassword('123456');

    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@youth.com',
        fullName: 'Administrator',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        points: 150,
        unitId: units[0].id,
        phone: '0123456789',
        address: 'Hà Nội',
        youthPosition: 'Bí thư Đoàn trường',
        isActive: true
      },
    });

    // Set admin as leader of unit1
    await prisma.unit.update({
      where: { id: units[0].id },
      data: { leaderId: adminUser.id }
    });

    // Create Leader users
    const leaderUsers = await Promise.all([
      prisma.user.create({
        data: {
          username: 'leader1',
          email: 'leader1@youth.com',
          fullName: 'Trần Thị Hương',
          passwordHash: hashedPassword,
          role: 'LEADER',
          points: 120,
          unitId: units[1].id,
          phone: '0987654321',
          address: 'Hà Nội',
          youthPosition: 'Bí thư Chi đoàn Kinh tế',
          isActive: true
        },
      }),
      prisma.user.create({
        data: {
          username: 'leader2',
          email: 'leader2@youth.com',
          fullName: 'Lê Văn Minh',
          passwordHash: hashedPassword,
          role: 'LEADER',
          points: 115,
          unitId: units[2].id,
          phone: '0912345678',
          address: 'TP. Hồ Chí Minh',
          youthPosition: 'Bí thư Chi đoàn Y khoa',
          isActive: true
        },
      }),
    ]);

    // Set leaders for units
    await prisma.unit.update({
      where: { id: units[1].id },
      data: { leaderId: leaderUsers[0].id }
    });
    await prisma.unit.update({
      where: { id: units[2].id },
      data: { leaderId: leaderUsers[1].id }
    });

    // Create Members
    const memberUsers = [];
    const memberNames = [
      'Nguyễn Văn An', 'Phạm Thị Bình', 'Hoàng Văn Cường',
      'Trần Thị Dung', 'Lê Minh Đức', 'Ngô Thị Em',
      'Đỗ Văn Phong', 'Bùi Thị Giang', 'Vũ Văn Hải',
      'Đinh Thị Lan'
    ];

    for (let i = 0; i < memberNames.length; i++) {
      const unitIndex = i % 5;
      const member = await prisma.user.create({
        data: {
          username: `member${i + 1}`,
          email: `member${i + 1}@youth.com`,
          fullName: memberNames[i],
          passwordHash: hashedPassword,
          role: 'MEMBER',
          points: 60 + Math.floor(Math.random() * 60), // 60-120 points
          unitId: units[unitIndex].id,
          phone: `091234567${i}`,
          address: 'Hà Nội',
          youthPosition: 'Đoàn viên',
          isActive: true
        },
      });
      memberUsers.push(member);
    }

    console.log(`✅ Created ${memberUsers.length + leaderUsers.length + 1} users`);

    // Create Activities
    console.log('📅 Creating activities...');
    
    const activities = await Promise.all([
      prisma.activity.create({
        data: {
          title: 'Sinh hoạt Chi đoàn tháng 12',
          description: 'Sinh hoạt định kỳ đánh giá hoạt động tháng 12',
          type: 'MEETING',
          organizerId: adminUser.id,
          startTime: new Date('2024-12-15T14:00:00'),
          endTime: new Date('2024-12-15T16:00:00'),
          location: 'Hội trường A',
          pointsReward: 10,
          status: 'ACTIVE',
          qrCode: 'meeting-dec-2024'
        }
      }),
      prisma.activity.create({
        data: {
          title: 'Tình nguyện vì cộng đồng',
          description: 'Hoạt động tình nguyện dọn dẹp vệ sinh môi trường',
          type: 'VOLUNTEER',
          organizerId: leaderUsers[0].id,
          unitId: units[1].id,
          startTime: new Date('2024-12-20T08:00:00'),
          endTime: new Date('2024-12-20T12:00:00'),
          location: 'Công viên thành phố',
          pointsReward: 20,
          status: 'ACTIVE',
          qrCode: 'volunteer-dec-2024'
        }
      }),
      prisma.activity.create({
        data: {
          title: 'Hội thảo nghiên cứu khoa học',
          description: 'Hội thảo trao đổi kinh nghiệm nghiên cứu khoa học',
          type: 'STUDY',
          organizerId: leaderUsers[1].id,
          unitId: units[2].id,
          startTime: new Date('2024-12-22T09:00:00'),
          endTime: new Date('2024-12-22T11:00:00'),
          location: 'Phòng hội thảo B',
          pointsReward: 15,
          status: 'ACTIVE',
          qrCode: 'study-dec-2024'
        }
      }),
    ]);

    console.log(`✅ Created ${activities.length} activities`);

    // Create some points history
    console.log('📊 Creating points history...');
    
    const allUsers = [adminUser, ...leaderUsers, ...memberUsers];
    const reasons = [
      'Tham gia sinh hoạt định kỳ',
      'Hoàn thành nhiệm vụ được giao',
      'Góp ý xây dựng tích cực',
      'Tham gia tình nguyện',
      'Đạt thành tích học tập tốt',
    ];

    for (const user of allUsers) {
      const numRecords = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numRecords; i++) {
        await prisma.pointsHistory.create({
          data: {
            userId: user.id,
            points: [5, 10, 15, 20][Math.floor(Math.random() * 4)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            type: 'EARN',
          },
        });
      }
    }

    console.log('✅ Created points history');

    console.log('🎉 Seed database hoàn thành!');
    console.log('');
    console.log('🔐 Thông tin đăng nhập:');
    console.log('   Admin: admin@youth.com / 123456');
    console.log('   Leader: leader1@youth.com / 123456');
    console.log('   Member: member1@youth.com / 123456');
    console.log('');

  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


