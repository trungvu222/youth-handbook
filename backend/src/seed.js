const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/auth');
const { generateQRCode } = require('./utils/helpers');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await prisma.pointsHistory.deleteMany({});
    await prisma.activityParticipant.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.surveyResponse.deleteMany({});
    await prisma.survey.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.studyMaterial.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.unit.deleteMany({});

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@youth-handbook.com',
        passwordHash: adminPassword,
        fullName: 'Quản trị viên hệ thống',
        phone: '0123456789',
        role: 'ADMIN',
        points: 1000
      }
    });

    console.log('✅ Created admin user:', admin.username);

    // Create units
    const units = await Promise.all([
      prisma.unit.create({
        data: {
          name: 'Chi đoàn CNTT',
          leaderId: null // Will update later
        }
      }),
      prisma.unit.create({
        data: {
          name: 'Chi đoàn Kinh tế',
          leaderId: null
        }
      }),
      prisma.unit.create({
        data: {
          name: 'Chi đoàn Ngoại ngữ',
          leaderId: null
        }
      })
    ]);

    console.log('✅ Created units:', units.map(u => u.name).join(', '));

    // Create leaders
    const leaderPassword = await hashPassword('leader123');
    const leaders = await Promise.all([
      prisma.user.create({
        data: {
          username: 'leader_cntt',
          email: 'leader.cntt@youth-handbook.com',
          passwordHash: leaderPassword,
          fullName: 'Nguyễn Văn An',
          phone: '0987654321',
          role: 'LEADER',
          unitId: units[0].id,
          points: 850
        }
      }),
      prisma.user.create({
        data: {
          username: 'leader_kt',
          email: 'leader.kt@youth-handbook.com',
          passwordHash: leaderPassword,
          fullName: 'Trần Thị Bình',
          phone: '0987654322',
          role: 'LEADER',
          unitId: units[1].id,
          points: 820
        }
      })
    ]);

    // Update units with leaders
    await Promise.all([
      prisma.unit.update({
        where: { id: units[0].id },
        data: { leaderId: leaders[0].id }
      }),
      prisma.unit.update({
        where: { id: units[1].id },
        data: { leaderId: leaders[1].id }
      })
    ]);

    console.log('✅ Created leaders:', leaders.map(l => l.fullName).join(', '));

    // Create members
    const memberPassword = await hashPassword('member123');
    const members = await Promise.all([
      prisma.user.create({
        data: {
          username: 'member_001',
          email: 'member001@youth-handbook.com',
          passwordHash: memberPassword,
          fullName: 'Lê Văn Cường',
          phone: '0987654323',
          role: 'MEMBER',
          unitId: units[0].id,
          points: 780
        }
      }),
      prisma.user.create({
        data: {
          username: 'member_002',
          email: 'member002@youth-handbook.com',
          passwordHash: memberPassword,
          fullName: 'Phạm Thị Dung',
          phone: '0987654324',
          role: 'MEMBER',
          unitId: units[1].id,
          points: 750
        }
      }),
      prisma.user.create({
        data: {
          username: 'member_003',
          email: 'member003@youth-handbook.com',
          passwordHash: memberPassword,
          fullName: 'Hoàng Văn Em',
          phone: '0987654325',
          role: 'MEMBER',
          unitId: units[0].id,
          points: 720
        }
      })
    ]);

    console.log('✅ Created members:', members.map(m => m.fullName).join(', '));

    // Create activities
    const activities = await Promise.all([
      prisma.activity.create({
        data: {
          title: 'Sinh hoạt Chi đoàn CNTT tháng 1',
          description: 'Sinh hoạt định kỳ của Chi đoàn CNTT',
          type: 'MEETING',
          organizerId: leaders[0].id,
          unitId: units[0].id,
          startTime: new Date('2024-01-22T09:00:00Z'),
          endTime: new Date('2024-01-22T11:00:00Z'),
          location: 'Phòng họp A101',
          pointsReward: 50,
          qrCode: generateQRCode('meeting-cntt-jan'),
          status: 'ACTIVE'
        }
      }),
      prisma.activity.create({
        data: {
          title: 'Hoạt động tình nguyện vệ sinh môi trường',
          description: 'Tham gia làm sạch công viên thành phố',
          type: 'VOLUNTEER',
          organizerId: admin.id,
          unitId: null, // Public activity
          startTime: new Date('2024-01-25T07:00:00Z'),
          endTime: new Date('2024-01-25T11:00:00Z'),
          location: 'Công viên Thống Nhất',
          pointsReward: 80,
          qrCode: generateQRCode('volunteer-cleanup'),
          status: 'ACTIVE'
        }
      })
    ]);

    console.log('✅ Created activities:', activities.map(a => a.title).join(', '));

    // Create study materials
    const studyMaterials = await Promise.all([
      prisma.studyMaterial.create({
        data: {
          title: 'Lịch sử Đảng Cộng sản Việt Nam',
          content: 'Tài liệu học tập về lịch sử thành lập và phát triển của Đảng',
          category: 'Lý luận chính trị',
          quizQuestions: JSON.stringify([
            {
              question: 'Đảng Cộng sản Việt Nam được thành lập năm nào?',
              options: ['1925', '1930', '1935', '1940'],
              correctAnswer: 1
            }
          ]),
          pointsReward: 30,
          accessLevel: 'PUBLIC'
        }
      })
    ]);

    console.log('✅ Created study materials:', studyMaterials.map(s => s.title).join(', '));

    // Create sample documents
    const documents = await Promise.all([
      prisma.document.create({
        data: {
          title: 'Điều lệ Đoàn TNCS Hồ Chí Minh',
          description: 'Điều lệ chính thức của Đoàn Thanh niên Cộng sản Hồ Chí Minh',
          fileUrl: '/uploads/documents/dieu-le-doan.pdf',
          category: 'Văn bản pháp quy',
          uploaderId: admin.id,
          accessLevel: 'PUBLIC'
        }
      }),
      prisma.document.create({
        data: {
          title: 'Biên bản họp Chi đoàn CNTT',
          description: 'Biên bản cuộc họp Chi đoàn CNTT tháng 12/2023',
          fileUrl: '/uploads/documents/bien-ban-hop.pdf',
          category: 'Biên bản họp',
          uploaderId: leaders[0].id,
          accessLevel: 'UNIT'
        }
      })
    ]);

    console.log('✅ Created documents:', documents.map(d => d.title).join(', '));

    // Create activity participants
    await Promise.all([
      prisma.activityParticipant.create({
        data: {
          activityId: activities[0].id,
          userId: members[0].id,
          status: 'CHECKED_IN',
          checkInTime: new Date('2024-01-22T09:05:00Z'),
          pointsEarned: 50
        }
      }),
      prisma.activityParticipant.create({
        data: {
          activityId: activities[0].id,
          userId: members[2].id,
          status: 'REGISTERED'
        }
      })
    ]);

    // Create points history
    await Promise.all([
      prisma.pointsHistory.create({
        data: {
          userId: members[0].id,
          activityId: activities[0].id,
          points: 50,
          reason: 'Tham gia sinh hoạt Chi đoàn',
          type: 'EARN'
        }
      }),
      prisma.pointsHistory.create({
        data: {
          userId: leaders[0].id,
          points: 100,
          reason: 'Tổ chức thành công sinh hoạt Chi đoàn',
          type: 'BONUS'
        }
      })
    ]);

    console.log('✅ Created sample data');

    // Print login credentials
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Leader CNTT: leader_cntt / leader123');
    console.log('Leader KT: leader_kt / leader123');
    console.log('Member: member_001 / member123');
    console.log('\n🎉 Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
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


