const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleRatingPeriods = [
  {
    title: 'Xếp loại chất lượng Quý 4/2024',
    description: 'Đánh giá chất lượng thực hiện nhiệm vụ của đoàn viên trong Quý 4 năm 2024',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    status: 'ACTIVE',
    targetAudience: 'ALL',
    createdBy: 'cmfi9sjf70002ttx8b8icy3t2', // admin user ID
    criteria: [
      {
        id: 'criteria_1',
        name: 'Tham gia đầy đủ sinh hoạt Chi đoàn',
        description: 'Tham dự tối thiểu 80% các buổi sinh hoạt Chi đoàn trong quý',
        isRequired: true
      },
      {
        id: 'criteria_2', 
        name: 'Hoàn thành tốt nhiệm vụ được giao',
        description: 'Thực hiện đầy đủ và đúng thời hạn các nhiệm vụ được phân công',
        isRequired: true
      },
      {
        id: 'criteria_3',
        name: 'Có tinh thần đoàn kết, tương trợ',
        description: 'Luôn sẵn sàng giúp đỡ đồng đội, có tinh thần đoàn kết tập thể',
        isRequired: false
      },
      {
        id: 'criteria_4',
        name: 'Tham gia tích cực hoạt động tình nguyện',
        description: 'Tham gia ít nhất 2 hoạt động tình nguyện trong quý',
        isRequired: false
      },
      {
        id: 'criteria_5',
        name: 'Có thái độ học tập, làm việc tích cực',
        description: 'Thể hiện tinh thần ham học hỏi, cầu tiến trong học tập và công việc',
        isRequired: true
      }
    ]
  },
  
  {
    title: 'Xếp loại chất lượng năm 2024',
    description: 'Đánh giá tổng kết chất lượng thực hiện nhiệm vụ của đoàn viên trong cả năm 2024',
    startDate: new Date('2024-12-15'),
    endDate: new Date('2025-01-15'),
    status: 'DRAFT',
    targetAudience: 'ALL', 
    createdBy: 'cmfi9sjf70002ttx8b8icy3t2',
    criteria: [
      {
        id: 'yearly_1',
        name: 'Chấp hành tốt chủ trương, nghị quyết của Đảng, Đoàn',
        description: 'Luôn chấp hành nghiêm túc các chủ trương, nghị quyết của Đảng, Đoàn các cấp',
        isRequired: true
      },
      {
        id: 'yearly_2',
        name: 'Tham gia đầy đủ sinh hoạt tổ chức',
        description: 'Tham dự tối thiểu 85% các buổi sinh hoạt và hoạt động của tổ chức',
        isRequired: true
      },
      {
        id: 'yearly_3',
        name: 'Hoàn thành xuất sắc nhiệm vụ chuyên môn',
        description: 'Hoàn thành tốt nhiệm vụ học tập hoặc công việc được giao',
        isRequired: true
      },
      {
        id: 'yearly_4',
        name: 'Có nhiều đóng góp tích cực cho tập thể',
        description: 'Có những sáng kiến, đóng góp tích cực cho sự phát triển của tập thể',
        isRequired: false
      },
      {
        id: 'yearly_5',
        name: 'Gương mẫu trong lối sống, đạo đức',
        description: 'Có lối sống lành mạnh, đạo đức tốt, là tấm gương cho mọi người',
        isRequired: true
      },
      {
        id: 'yearly_6',
        name: 'Tích cực tham gia hoạt động xã hội',
        description: 'Tham gia tích cực các hoạt động xã hội, tình nguyện vì cộng đồng',
        isRequired: false
      }
    ]
  }
];

const sampleSelfRatings = [
  {
    periodId: '', // Will be set after creating periods
    userId: 'cmfi9sjh40003ttx85a99axip', // leader1
    criteriaResponses: [
      { criteriaId: 'criteria_1', value: true, note: 'Tham gia đầy đủ 12/12 buổi sinh hoạt' },
      { criteriaId: 'criteria_2', value: true, note: 'Hoàn thành tốt nhiệm vụ Bí thư Chi đoàn' },
      { criteriaId: 'criteria_3', value: true, note: 'Luôn hỗ trợ các đoàn viên khác' },
      { criteriaId: 'criteria_4', value: true, note: 'Tham gia 3 hoạt động tình nguyện: dọn vệ sinh trường học, hiến máu, từ thiện' },
      { criteriaId: 'criteria_5', value: true, note: 'Đạt điểm GPA 3.8/4.0' }
    ],
    suggestedRating: 'EXCELLENT',
    selfAssessment: 'Trong quý này em đã cố gắng hoàn thành tốt các nhiệm vụ được giao. Với vai trò là Bí thư Chi đoàn, em luôn cố gắng gương mẫu và hỗ trợ tối đa các đoàn viên khác. Em tham gia đầy đủ các hoạt động của tổ chức và đạt kết quả học tập khá tốt.',
    status: 'SUBMITTED'
  },
  
  {
    periodId: '', // Will be set after creating periods  
    userId: 'cmfi9sjhq0004ttx8ti67ykid', // member1
    criteriaResponses: [
      { criteriaId: 'criteria_1', value: true, note: 'Tham gia 10/12 buổi sinh hoạt (có 2 buổi xin phép vì bận học)' },
      { criteriaId: 'criteria_2', value: true, note: 'Hoàn thành tốt nhiệm vụ được giao' },
      { criteriaId: 'criteria_3', value: false, note: 'Chưa tích cực hỗ trợ các bạn trong tập thể' },
      { criteriaId: 'criteria_4', value: true, note: 'Tham gia 2 hoạt động tình nguyện: dọn vệ sinh và hiến máu' },
      { criteriaId: 'criteria_5', value: true, note: 'Đạt điểm GPA 3.2/4.0' }
    ],
    suggestedRating: 'GOOD',
    selfAssessment: 'Em đã cố gắng tham gia các hoạt động của Chi đoàn trong khả năng của mình. Tuy nhiên em nhận thấy mình cần cải thiện thêm về tinh thần đoàn kết và hỗ trợ các bạn trong tập thể.',
    status: 'SUBMITTED'
  }
];

async function seedRating() {
  try {
    console.log('⭐ Bắt đầu seed rating data...');

    // Check existing data
    const existingPeriods = await prisma.ratingPeriod.count();
    if (existingPeriods > 0) {
      console.log(`📊 Đã có ${existingPeriods} rating periods trong database`);
      console.log('⚠️ Xóa dữ liệu cũ và tạo mới...');
      
      // Delete in correct order due to foreign key constraints
      await prisma.selfRating.deleteMany({});
      await prisma.ratingPeriod.deleteMany({});
    }

    // Create rating periods
    console.log('\n📝 Tạo rating periods...');
    const createdPeriods = [];
    
    for (const periodData of sampleRatingPeriods) {
      try {
        const period = await prisma.ratingPeriod.create({
          data: {
            title: periodData.title,
            description: periodData.description,
            startDate: periodData.startDate,
            endDate: periodData.endDate,
            criteria: periodData.criteria,
            status: periodData.status,
            targetAudience: periodData.targetAudience,
            createdBy: periodData.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        createdPeriods.push(period);
        console.log(`✅ Tạo thành công: "${periodData.title}"`);
      } catch (error) {
        console.log(`❌ Lỗi tạo period "${periodData.title}":`, error.message);
      }
    }

    // Create self ratings for active period
    if (createdPeriods.length > 0) {
      console.log('\n🎯 Tạo self ratings...');
      const activePeriod = createdPeriods.find(p => p.status === 'ACTIVE');
      
      if (activePeriod) {
        let createdRatingsCount = 0;
        
        for (const ratingData of sampleSelfRatings) {
          try {
            await prisma.selfRating.create({
              data: {
                periodId: activePeriod.id,
                userId: ratingData.userId,
                criteriaResponses: ratingData.criteriaResponses,
                suggestedRating: ratingData.suggestedRating,
                selfAssessment: ratingData.selfAssessment,
                status: ratingData.status,
                submittedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            createdRatingsCount++;
            console.log(`✅ Tạo thành công self rating cho user ${ratingData.userId}`);
          } catch (error) {
            console.log(`❌ Lỗi tạo self rating cho user ${ratingData.userId}:`, error.message);
          }
        }
        
        console.log(`\n🎉 Đã tạo ${createdRatingsCount} self ratings`);
      }
    }

    // Display summary
    console.log(`\n🎊 Hoàn thành! Đã tạo ${createdPeriods.length} rating periods`);
    
    const periods = await prisma.ratingPeriod.findMany({
      include: {
        _count: {
          select: { selfRatings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Danh sách rating periods:');
    periods.forEach((period, index) => {
      console.log(`${index + 1}. ${period.title} (${period.status})`);
      console.log(`   📅 ${period.startDate.toLocaleDateString('vi-VN')} - ${period.endDate.toLocaleDateString('vi-VN')}`);
      console.log(`   👥 ${period._count.selfRatings} đánh giá đã gửi`);
      console.log(`   📝 ${period.criteria.length} tiêu chí\n`);
    });

    console.log('💡 Bạn có thể test Rating Management ngay bây giờ!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed rating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedRating();
}

module.exports = { seedRating };






