const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const activities = [
  {
    title: "Sinh hoạt Chi đoàn tháng 12",
    description: "Sinh hoạt định kỳ hàng tháng của Chi đoàn, trao đổi về kế hoạch hoạt động cuối năm và đánh giá thành tích các đoàn viên.",
    type: "MEETING",
    location: "Phòng họp A3, Tầng 2, Nhà văn hóa",
    startTime: new Date('2024-12-15T14:00:00Z'),
    endTime: new Date('2024-12-15T16:00:00Z'),
    maxParticipants: 50,
    checkInStartTime: new Date('2024-12-15T13:45:00Z'),
    checkInEndTime: new Date('2024-12-15T14:15:00Z'),
    requiresLocation: true,
    allowFeedback: true,
    onTimePoints: 15,
    latePoints: 5,
    missedPoints: -10,
    feedbackPoints: 5,
    status: 'ACTIVE'
  },
  {
    title: "Tình nguyện dọn dẹp công viên",
    description: "Hoạt động tình nguyện dọn dẹp, chăm sóc cây xanh tại Công viên Thống Nhất. Mang theo găng tay và dụng cụ làm vệ sinh.",
    type: "VOLUNTEER",
    location: "Công viên Thống Nhất, cổng chính",
    startTime: new Date('2024-12-18T07:00:00Z'),
    endTime: new Date('2024-12-18T10:00:00Z'),
    maxParticipants: 30,
    checkInStartTime: new Date('2024-12-18T06:45:00Z'),
    checkInEndTime: new Date('2024-12-18T07:30:00Z'),
    requiresLocation: true,
    allowFeedback: true,
    onTimePoints: 20,
    latePoints: 10,
    missedPoints: -15,
    feedbackPoints: 5,
    status: 'ACTIVE'
  },
  {
    title: "Học tập chuyên đề: Lịch sử Đoàn",
    description: "Buổi học tập về lịch sử hình thành và phát triển của Đoàn TNCS Hồ Chí Minh, truyền thống vẻ vang của tuổi trẻ Việt Nam.",
    type: "STUDY",
    location: "Hội trường lớn, Trung tâm Thanh niên",
    startTime: new Date('2024-12-20T19:00:00Z'),
    endTime: new Date('2024-12-20T21:00:00Z'),
    maxParticipants: 100,
    checkInStartTime: new Date('2024-12-20T18:45:00Z'),
    checkInEndTime: new Date('2024-12-20T19:15:00Z'),
    requiresLocation: false,
    allowFeedback: true,
    onTimePoints: 15,
    latePoints: 8,
    missedPoints: -12,
    feedbackPoints: 8,
    status: 'ACTIVE'
  },
  {
    title: "Nhiệm vụ khảo sát thành viên",
    description: "Thực hiện khảo sát ý kiến về chất lượng hoạt động Đoàn trong tháng 11. Deadline nộp báo cáo trước 25/12.",
    type: "TASK",
    location: "Online - Google Forms",
    startTime: new Date('2024-12-10T00:00:00Z'),
    endTime: new Date('2024-12-25T23:59:00Z'),
    maxParticipants: null,
    checkInStartTime: new Date('2024-12-10T00:00:00Z'),
    checkInEndTime: new Date('2024-12-25T23:59:00Z'),
    requiresLocation: false,
    allowFeedback: true,
    onTimePoints: 10,
    latePoints: 0,
    missedPoints: -8,
    feedbackPoints: 3,
    status: 'ACTIVE'
  },
  {
    title: "Giao lưu văn hóa các Chi đoàn",
    description: "Buổi giao lưu văn hóa giữa các Chi đoàn với các tiết mục ca hát, múa, thơ ca và trò chơi dân gian truyền thống.",
    type: "SOCIAL",
    location: "Sân khấu ngoài trời, Công viên Văn hóa",
    startTime: new Date('2024-12-22T16:00:00Z'),
    endTime: new Date('2024-12-22T19:00:00Z'),
    maxParticipants: 200,
    checkInStartTime: new Date('2024-12-22T15:30:00Z'),
    checkInEndTime: new Date('2024-12-22T16:30:00Z'),
    requiresLocation: true,
    allowFeedback: true,
    onTimePoints: 18,
    latePoints: 10,
    missedPoints: -10,
    feedbackPoints: 7,
    status: 'ACTIVE'
  },
  {
    title: "Sinh hoạt Chi đoàn tháng 11 (Đã kết thúc)",
    description: "Sinh hoạt định kỳ tháng 11 đã diễn ra thành công với sự tham gia của 45/50 đoàn viên.",
    type: "MEETING",
    location: "Phòng họp B2, Tầng 3, Nhà văn hóa",
    startTime: new Date('2024-11-15T14:00:00Z'),
    endTime: new Date('2024-11-15T16:00:00Z'),
    maxParticipants: 50,
    checkInStartTime: new Date('2024-11-15T13:45:00Z'),
    checkInEndTime: new Date('2024-11-15T14:15:00Z'),
    requiresLocation: true,
    allowFeedback: true,
    onTimePoints: 15,
    latePoints: 5,
    missedPoints: -10,
    feedbackPoints: 5,
    status: 'COMPLETED'
  }
];

async function seedActivities() {
  try {
    console.log('🌱 Bắt đầu seed Activities...');

    // Get admin user (first user in database)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ Không tìm thấy Admin user. Vui lòng chạy seed users trước.');
      return;
    }

    // Get first unit
    const unit = await prisma.unit.findFirst();

    console.log(`📝 Tạo ${activities.length} sinh hoạt mẫu...`);

    for (const activityData of activities) {
      const qrCode = crypto.randomUUID();
      
      const activity = await prisma.activity.create({
        data: {
          ...activityData,
          organizerId: adminUser.id,
          unitId: unit?.id,
          qrCode
        }
      });

      console.log(`✅ Tạo thành công: ${activity.title}`);

      // Create some participants for completed activities
      if (activity.status === 'COMPLETED') {
        const users = await prisma.user.findMany({
          where: { unitId: unit?.id },
          take: 5
        });

        for (const user of users) {
          await prisma.activityParticipant.create({
            data: {
              activityId: activity.id,
              userId: user.id,
              status: 'CHECKED_IN',
              checkInTime: new Date(activity.startTime.getTime() + Math.random() * 30 * 60 * 1000), // Random within 30 mins
              qrData: activity.qrCode,
              pointsEarned: activity.onTimePoints
            }
          });

          // Add points to user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              points: { increment: activity.onTimePoints }
            }
          });

          // Create points history
          await prisma.pointsHistory.create({
            data: {
              userId: user.id,
              activityId: activity.id,
              points: activity.onTimePoints,
              reason: `Điểm danh sinh hoạt: ${activity.title}`,
              type: 'EARN'
            }
          });
        }

        console.log(`   📊 Tạo ${users.length} lượt tham gia cho sinh hoạt đã kết thúc`);
      }

      // Create some sample feedback
      if (Math.random() > 0.5) {
        const users = await prisma.user.findMany({
          where: { unitId: unit?.id },
          take: 2
        });

        for (const user of users) {
          await prisma.activityFeedback.create({
            data: {
              activityId: activity.id,
              userId: user.id,
              content: `Góp ý mẫu cho sinh hoạt ${activity.title}: Nội dung rất bổ ích và thú vị!`,
              type: ['SUGGESTION', 'PRAISE', 'QUESTION'][Math.floor(Math.random() * 3)],
              status: 'PENDING',
              isAnonymous: Math.random() > 0.7
            }
          });
        }
        console.log(`   💬 Tạo góp ý mẫu cho ${activity.title}`);
      }
    }

    console.log('🎉 Seed Activities hoàn thành!');
    console.log('📊 Dữ liệu đã tạo:');
    console.log(`   - ${activities.length} sinh hoạt`);
    console.log(`   - Có sẵn participants và feedback mẫu`);
    console.log(`   - Points history được cập nhật`);
    console.log('');
    console.log('🚀 Có thể test ứng dụng ngay bây giờ!');

  } catch (error) {
    console.error('❌ Lỗi khi seed Activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedActivities();

