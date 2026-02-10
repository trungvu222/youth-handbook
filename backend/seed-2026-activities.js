const { PrismaClient } = require('@prisma/client');

async function seed2026Activities() {
  const prisma = new PrismaClient();
  
  try {
    // Get admin user for createdBy
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      console.log('No admin user found!');
      return;
    }
    
    // Get some units
    const units = await prisma.unit.findMany({ take: 3 });
    
    const activities2026 = [
      // January 2026
      {
        title: 'Sinh hoạt Chi đoàn tháng 1/2026',
        description: 'Sinh hoạt định kỳ đầu năm mới 2026, triển khai kế hoạch hoạt động năm.',
        startTime: new Date('2026-01-10T14:00:00Z'),
        endTime: new Date('2026-01-10T16:00:00Z'),
        location: 'Hội trường A',
        type: 'MEETING',
        status: 'COMPLETED',
        pointsReward: 10,
        unitId: units[0]?.id,
        organizerId: admin.id
      },
      {
        title: 'Chương trình Tết ấm tình thương 2026',
        description: 'Tặng quà Tết cho các hộ khó khăn trong địa bàn.',
        startTime: new Date('2026-01-20T08:00:00Z'),
        endTime: new Date('2026-01-20T17:00:00Z'),
        location: 'Xã An Bình',
        type: 'VOLUNTEER',
        status: 'COMPLETED',
        pointsReward: 20,
        organizerId: admin.id
      },
      {
        title: 'Hội nghị tổng kết công tác Đoàn 2025',
        description: 'Tổng kết hoạt động năm 2025 và phương hướng năm 2026.',
        startTime: new Date('2026-01-25T08:00:00Z'),
        endTime: new Date('2026-01-25T12:00:00Z'),
        location: 'Hội trường lớn',
        type: 'CONFERENCE',
        status: 'COMPLETED',
        pointsReward: 15,
        organizerId: admin.id
      },
      // February 2026
      {
        title: 'Sinh hoạt Chi đoàn tháng 2/2026',
        description: 'Sinh hoạt định kỳ tháng 2, triển khai nhiệm vụ quý 1.',
        startTime: new Date('2026-02-05T14:00:00Z'),
        endTime: new Date('2026-02-05T16:00:00Z'),
        location: 'Phòng họp B',
        type: 'MEETING',
        status: 'ACTIVE',
        pointsReward: 10,
        unitId: units[1]?.id,
        organizerId: admin.id
      },
      {
        title: 'Ngày hội hiến máu nhân đạo đầu xuân',
        description: 'Hiến máu tình nguyện hưởng ứng tháng Thanh niên.',
        startTime: new Date('2026-02-14T07:30:00Z'),
        endTime: new Date('2026-02-14T12:00:00Z'),
        location: 'Bệnh viện Đa khoa',
        type: 'VOLUNTEER',
        status: 'ACTIVE',
        pointsReward: 25,
        organizerId: admin.id
      },
      {
        title: 'Tập huấn kỹ năng công tác Đoàn 2026',
        description: 'Tập huấn nghiệp vụ cho cán bộ Đoàn các cấp.',
        startTime: new Date('2026-02-20T08:00:00Z'),
        endTime: new Date('2026-02-20T17:00:00Z'),
        location: 'Trung tâm Hội nghị',
        type: 'STUDY',
        status: 'ACTIVE',
        pointsReward: 15,
        organizerId: admin.id
      },
      {
        title: 'Giải bóng đá chào mừng ngày 26/3',
        description: 'Giải thi đấu bóng đá giữa các Chi đoàn.',
        startTime: new Date('2026-02-28T14:00:00Z'),
        endTime: new Date('2026-02-28T18:00:00Z'),
        location: 'Sân vận động',
        type: 'SOCIAL',
        status: 'ACTIVE',
        pointsReward: 20,
        organizerId: admin.id
      }
    ];
    
    console.log('🌱 Seeding activities for 2026...');
    
    for (const activity of activities2026) {
      // Check if activity already exists
      const existing = await prisma.activity.findFirst({
        where: { title: activity.title }
      });
      
      if (existing) {
        console.log(`  ⏭️ Skipping (exists): ${activity.title}`);
        continue;
      }
      
      await prisma.activity.create({ data: activity });
      console.log(`  ✅ Created: ${activity.title}`);
    }
    
    // Count activities by year
    const count2026 = await prisma.activity.count({
      where: {
        startTime: {
          gte: new Date('2026-01-01'),
          lt: new Date('2027-01-01')
        }
      }
    });
    
    console.log(`\n📊 Total activities in 2026: ${count2026}`);
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed2026Activities();
