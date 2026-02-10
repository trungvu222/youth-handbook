const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRatingData() {
  try {
    console.log('🌱 Seeding rating data...');

    // Get existing users and periods
    const users = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      take: 15
    });

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }

    if (users.length < 5) {
      console.error('❌ Need at least 5 member users');
      return;
    }

    // Get rating periods
    let periods = await prisma.ratingPeriod.findMany();

    // Create periods if none exist
    if (periods.length === 0) {
      console.log('Creating rating periods...');
      
      const periodData = [
        {
          title: 'Xếp loại chất lượng quý 1/2026',
          description: 'Đánh giá chất lượng đoàn viên quý 1 năm 2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-03-31'),
          status: 'ACTIVE',
          createdBy: adminUser.id,
          criteria: [
            { name: 'Tham gia sinh hoạt', description: 'Tham gia đầy đủ các buổi sinh hoạt', isRequired: true },
            { name: 'Hoàn thành nhiệm vụ', description: 'Hoàn thành các nhiệm vụ được giao', isRequired: true },
            { name: 'Ý thức tổ chức', description: 'Có ý thức tổ chức kỷ luật tốt', isRequired: true }
          ]
        },
        {
          title: 'Đánh giá xếp loại đoàn viên HK1/2025',
          description: 'Xếp loại chất lượng đoàn viên học kỳ 1 năm 2025',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-12-31'),
          status: 'COMPLETED',
          createdBy: adminUser.id,
          criteria: [
            { name: 'Học tập', description: 'Kết quả học tập đạt yêu cầu', isRequired: true },
            { name: 'Rèn luyện', description: 'Tham gia các hoạt động rèn luyện', isRequired: true },
            { name: 'Công tác đoàn', description: 'Tích cực trong công tác đoàn', isRequired: true }
          ]
        },
        {
          title: 'Xếp loại chất lượng tháng 12/2025',
          description: 'Đánh giá định kỳ tháng 12 năm 2025',
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-31'),
          status: 'COMPLETED',
          createdBy: adminUser.id,
          criteria: [
            { name: 'Kỷ luật', description: 'Chấp hành tốt nội quy kỷ luật', isRequired: true },
            { name: 'Tinh thần', description: 'Có tinh thần trách nhiệm cao', isRequired: false }
          ]
        }
      ];

      for (const data of periodData) {
        await prisma.ratingPeriod.create({ data });
      }

      periods = await prisma.ratingPeriod.findMany();
      console.log(`✅ Created ${periods.length} rating periods`);
    }

    // Create self ratings for each user and period
    console.log('Creating self ratings...');
    
    const ratings = ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'];
    let createdCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    for (const period of periods) {
      // Create ratings for random users
      const numRatings = Math.min(users.length, 8 + Math.floor(Math.random() * 5));
      
      console.log(`\nProcessing period: ${period.title}`);
      console.log(`Period criteria:`, JSON.stringify(period.criteria, null, 2));
      
      for (let i = 0; i < numRatings; i++) {
        const user = users[i];
        const isPending = Math.random() < 0.3; // 30% chờ duyệt
        const isApproved = !isPending && Math.random() < 0.7; // 70% đã duyệt
        
        const selfRating = ratings[Math.floor(Math.random() * ratings.length)];
        const finalRating = isApproved 
          ? ratings[Math.floor(Math.random() * ratings.length)]
          : null;

        // Create response data based on criteria
        const criteriaResponses = Array.isArray(period.criteria) 
          ? period.criteria.map(criterion => ({
              criterionName: criterion.name || criterion.criterionName || 'Unknown',
              value: Math.random() < 0.8 // 80% đạt
            }))
          : [];

        const selfAssessment = [
          'Em đã cố gắng hoàn thành tốt các nhiệm vụ được giao',
          'Em tham gia đầy đủ các hoạt động của đoàn',
          'Em luôn chấp hành tốt nội quy kỷ luật',
          'Em tích cực đóng góp ý kiến xây dựng',
          'Em cần cố gắng nhiều hơn trong học tập'
        ][i % 5];

        try {
          const rating = await prisma.selfRating.create({
            data: {
              userId: user.id,
              periodId: period.id,
              suggestedRating: selfRating,
              finalRating,
              criteriaResponses,
              selfAssessment,
              status: isPending ? 'SUBMITTED' : (isApproved ? 'APPROVED' : 'SUBMITTED'),
              submittedAt: new Date(period.startDate.getTime() + Math.random() * (period.endDate.getTime() - period.startDate.getTime())),
              reviewedAt: isApproved ? new Date() : null,
              reviewedBy: isApproved ? adminUser.id : null,
              adminNotes: isApproved ? 'Đánh giá chính xác, phù hợp với thực tế' : null
            }
          });

          createdCount++;
          if (isPending) pendingCount++;
          if (isApproved) approvedCount++;
        } catch (error) {
          // Skip if already exists
          if (error.code !== 'P2002') {
            console.error(`Error creating rating for user ${user.id}:`, error.message);
          }
        }
      }
    }

    console.log(`✅ Created ${createdCount} self ratings`);
    console.log(`   - ${pendingCount} pending approval`);
    console.log(`   - ${approvedCount} approved`);

    // Create some statistics
    const stats = await prisma.selfRating.groupBy({
      by: ['periodId', 'finalRating'],
      where: { status: 'APPROVED' },
      _count: true
    });

    console.log('📊 Rating statistics:');
    for (const stat of stats) {
      const period = periods.find(p => p.id === stat.periodId);
      console.log(`   ${period?.title}: ${stat.finalRating} - ${stat._count} đoàn viên`);
    }

    console.log('✅ Rating data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding rating data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRatingData()
  .catch(console.error);
