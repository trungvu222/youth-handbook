const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRatingQ1_2026() {
  try {
    console.log('🌱 Seeding rating data for Q1/2026...');

    // Find or create admin user
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('Creating admin user...');
      admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          passwordHash: '$2b$10$YourHashedPasswordHere',
          fullName: 'Trần Văn Admin',
          role: 'ADMIN',
          militaryRank: 'Trung úy',
          youthPosition: 'Bí thư'
        }
      });
    }

    // Create or find units
    const units = [];
    const unitNames = ['Chi đoàn Tham mưu', 'Chi đoàn Tiếng Anh', 'Chi đoàn Kỹ thuật', 'Chi đoàn Hậu cần'];
    
    for (const unitName of unitNames) {
      let unit = await prisma.unit.findFirst({
        where: { name: unitName }
      });
      
      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            name: unitName,
            leaderId: admin.id
          }
        });
      }
      units.push(unit);
    }

    // Create test users with diverse data
    const testUsers = [
      { fullName: 'Trần Văn Admin', militaryRank: 'Trung úy', youthPosition: 'Bí thư', unit: units[0], rating: 'EXCELLENT' },
      { fullName: 'Nguyễn Văn Tuấn', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[1], rating: 'EXCELLENT' },
      { fullName: 'Lê Thị Hoa', militaryRank: 'Thiếu úy', youthPosition: 'Phó Bí thư', unit: units[0], rating: 'GOOD' },
      { fullName: 'Phạm Minh Hoàng', militaryRank: 'Trung úy', youthPosition: 'Ủy viên', unit: units[1], rating: 'GOOD' },
      { fullName: 'Trần Thu Trang', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[2], rating: 'GOOD' },
      { fullName: 'Đinh Công Minh', militaryRank: 'Đại úy', youthPosition: 'Bí thư', unit: units[2], rating: 'EXCELLENT' },
      { fullName: 'Hoàng Văn Nam', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[3], rating: 'AVERAGE' },
      { fullName: 'Vũ Thị Mai', militaryRank: 'Trung úy', youthPosition: 'Phó Bí thư', unit: units[0], rating: 'AVERAGE' },
      { fullName: 'Đặng Quốc Huy', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[1], rating: 'GOOD' },
      { fullName: 'Bùi Thị Lan', militaryRank: 'Đại úy', youthPosition: 'Ủy viên', unit: units[3], rating: 'EXCELLENT' },
      { fullName: 'Ngô Văn Đức', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[2], rating: 'AVERAGE' },
      { fullName: 'Cao Thị Hương', militaryRank: 'Trung úy', youthPosition: 'Đoàn viên', unit: units[0], rating: 'POOR' },
      { fullName: 'Lý Minh Tuấn', militaryRank: 'Thiếu úy', youthPosition: 'Đoàn viên', unit: units[1], rating: 'GOOD' },
      { fullName: 'Phan Thị Ngọc', militaryRank: 'Đại úy', youthPosition: 'Bí thư', unit: units[3], rating: 'EXCELLENT' },
      { fullName: 'Dương Văn Khoa', militaryRank: 'Trung úy', youthPosition: 'Ủy viên', unit: units[2], rating: 'GOOD' }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      let user = await prisma.user.findFirst({
        where: { fullName: userData.fullName }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            username: userData.fullName.toLowerCase().replace(/\s+/g, ''),
            email: `${userData.fullName.toLowerCase().replace(/\s+/g, '')}@example.com`,
            passwordHash: '$2b$10$YourHashedPasswordHere',
            fullName: userData.fullName,
            militaryRank: userData.militaryRank,
            youthPosition: userData.youthPosition,
            unitId: userData.unit.id,
            role: 'MEMBER'
          }
        });
      } else {
        // Update user with missing fields
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            militaryRank: userData.militaryRank,
            youthPosition: userData.youthPosition,
            unitId: userData.unit.id
          }
        });
      }
      
      createdUsers.push({ user, rating: userData.rating });
    }

    // Create rating period
    const periodTitle = 'Xếp loại chất lượng quý 1/2026';
    let period = await prisma.ratingPeriod.findFirst({
      where: { title: periodTitle }
    });

    if (!period) {
      const periodCriteria = [
        {
          id: 'criterion_1',
          name: 'Tham gia sinh hoạt Đoàn',
          description: 'Tham gia đầy đủ các buổi sinh hoạt Đoàn',
          isRequired: true,
          weight: 30
        },
        {
          id: 'criterion_2',
          name: 'Hoàn thành nhiệm vụ được giao',
          description: 'Hoàn thành tốt nhiệm vụ công tác Đoàn',
          isRequired: true,
          weight: 40
        },
        {
          id: 'criterion_3',
          name: 'Ý thức kỷ luật',
          description: 'Chấp hành nghiêm kỷ luật, nội quy',
          isRequired: true,
          weight: 30
        }
      ];

      period = await prisma.ratingPeriod.create({
        data: {
          title: periodTitle,
          description: 'Đánh giá chất lượng đoàn viên trong Quý 1 năm 2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-03-31'),
          status: 'ACTIVE',
          targetRating: 'GOOD',
          createdBy: admin.id,
          criteria: periodCriteria
        }
      });
      
      // Set criteria for later use
      period.criteria = periodCriteria;
    } else {
      // Ensure criteria is parsed if it's a string
      if (typeof period.criteria === 'string') {
        period.criteria = JSON.parse(period.criteria);
      }
    }

    console.log(`✅ Created period: ${period.title}`);

    // Create self-ratings for all users
    const ratingPoints = {
      'EXCELLENT': 95,
      'GOOD': 85,
      'AVERAGE': 75,
      'POOR': 60
    };

    for (const { user, rating } of createdUsers) {
      // Check if rating already exists
      const existingRating = await prisma.selfRating.findFirst({
        where: {
          userId: user.id,
          periodId: period.id
        }
      });

      if (!existingRating) {
        // Create criteria responses based on period criteria
        const criteriaResponses = period.criteria.map(criterion => ({
          criterionId: criterion.id,
          name: criterion.name,
          isMet: true,
          response: 'Đạt yêu cầu',
          notes: 'Hoàn thành tốt'
        }));

        await prisma.selfRating.create({
          data: {
            userId: user.id,
            periodId: period.id,
            suggestedRating: rating,
            finalRating: rating,
            status: 'APPROVED',
            selfAssessment: `Tôi đã hoàn thành tốt nhiệm vụ được giao trong quý 1/2026.`,
            adminNotes: `Đã xác nhận và phê duyệt xếp loại ${rating}`,
            pointsAwarded: ratingPoints[rating],
            criteriaResponses: criteriaResponses,
            submittedAt: new Date('2026-03-25'),
            reviewedAt: new Date('2026-03-28'),
            reviewedBy: admin.id
          }
        });
        
        console.log(`  ✅ Created rating for ${user.fullName}: ${rating}`);
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Period: ${period.title}`);
    console.log(`   - Total users: ${createdUsers.length}`);
    console.log(`   - EXCELLENT: ${createdUsers.filter(u => u.rating === 'EXCELLENT').length}`);
    console.log(`   - GOOD: ${createdUsers.filter(u => u.rating === 'GOOD').length}`);
    console.log(`   - AVERAGE: ${createdUsers.filter(u => u.rating === 'AVERAGE').length}`);
    console.log(`   - POOR: ${createdUsers.filter(u => u.rating === 'POOR').length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRatingQ1_2026();
