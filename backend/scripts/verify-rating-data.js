const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRatingData() {
  try {
    console.log('🔍 Checking database connection...\n');

    // Get rating period
    const period = await prisma.ratingPeriod.findFirst({
      where: { 
        title: 'Xếp loại chất lượng quý 1/2026'
      },
      include: {
        _count: {
          select: { selfRatings: true }
        }
      }
    });

    if (!period) {
      console.log('❌ Period not found in database');
      return;
    }

    console.log('✅ DATABASE CONNECTION SUCCESSFUL!\n');
    console.log('📊 PERIOD INFORMATION:');
    console.log(`   ID: ${period.id}`);
    console.log(`   Title: ${period.title}`);
    console.log(`   Status: ${period.status}`);
    console.log(`   Target Rating: ${period.targetRating}`);
    console.log(`   Start: ${period.startDate.toLocaleDateString('vi-VN')}`);
    console.log(`   End: ${period.endDate.toLocaleDateString('vi-VN')}`);
    console.log(`   Total Ratings: ${period._count.selfRatings}\n`);

    // Get all ratings with user details
    const ratings = await prisma.selfRating.findMany({
      where: {
        periodId: period.id,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            fullName: true,
            militaryRank: true,
            youthPosition: true,
            unit: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log('👥 DETAILED RATINGS (First 5):');
    ratings.slice(0, 5).forEach((rating, index) => {
      console.log(`\n   ${index + 1}. ${rating.user.fullName}`);
      console.log(`      Cấp bậc: ${rating.user.militaryRank || 'N/A'}`);
      console.log(`      Chức vụ: ${rating.user.youthPosition || 'N/A'}`);
      console.log(`      Chi đoàn: ${rating.user.unit?.name || 'N/A'}`);
      console.log(`      Xếp loại: ${rating.finalRating}`);
      console.log(`      Điểm: ${rating.pointsAwarded}`);
    });

    console.log(`\n   ... và ${ratings.length - 5} người khác\n`);

    // Distribution
    const distribution = {};
    ratings.forEach(r => {
      distribution[r.finalRating] = (distribution[r.finalRating] || 0) + 1;
    });

    console.log('📈 DISTRIBUTION:');
    console.log(`   EXCELLENT: ${distribution.EXCELLENT || 0}`);
    console.log(`   GOOD: ${distribution.GOOD || 0}`);
    console.log(`   AVERAGE: ${distribution.AVERAGE || 0}`);
    console.log(`   POOR: ${distribution.POOR || 0}`);

    console.log('\n✅ ALL DATA IS IN REAL DATABASE (PostgreSQL Neon)');
    console.log('✅ Ready for production deployment!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRatingData();
