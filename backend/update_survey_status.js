const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSurveyStatus() {
  try {
    console.log('🔍 Đang tìm các khảo sát có status DRAFT...');
    
    // Find all DRAFT surveys
    const draftSurveys = await prisma.survey.findMany({
      where: { status: 'DRAFT' },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    console.log(`📋 Tìm thấy ${draftSurveys.length} khảo sát DRAFT`);
    
    if (draftSurveys.length === 0) {
      console.log('✅ Không có khảo sát nào cần cập nhật');
      return;
    }

    // Display surveys to be updated
    draftSurveys.forEach((survey, index) => {
      console.log(`\n${index + 1}. ${survey.title}`);
      console.log(`   ID: ${survey.id}`);
      console.log(`   Status hiện tại: ${survey.status}`);
      console.log(`   Thời gian: ${survey.startDate} → ${survey.endDate}`);
    });

    // Update all DRAFT surveys to ACTIVE
    const result = await prisma.survey.updateMany({
      where: { status: 'DRAFT' },
      data: { status: 'ACTIVE' }
    });

    console.log(`\n✅ Đã cập nhật ${result.count} khảo sát từ DRAFT → ACTIVE`);
    console.log('🎉 Hoàn thành! Các khảo sát giờ đã có thể trả lời được.');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSurveyStatus();
