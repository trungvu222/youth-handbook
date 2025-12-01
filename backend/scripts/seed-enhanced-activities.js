const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Enhanced Activities for Module 3.3 with full features
const enhancedActivities = [
  {
    title: "Chiến dịch Mùa hè Xanh 2024",
    description: "Chiến dịch tình nguyện mùa hè với nhiều hoạt động ý nghĩa: dạy học miễn phí, khám bệnh, xây dựng nhà tình thương...",
    type: "VOLUNTEER",
    activityCode: "MHX2024-001",
    location: "Tỉnh Cao Bằng",
    startTime: new Date('2024-07-01T06:00:00Z'),
    endTime: new Date('2024-07-15T18:00:00Z'),
    maxParticipants: 50,
    checkInStartTime: new Date('2024-07-01T05:30:00Z'),
    checkInEndTime: new Date('2024-07-01T06:30:00Z'),
    requiresLocation: true,
    requiresPostSurvey: true,
    allowFeedback: true,
    onTimePoints: 25,
    latePoints: 15,
    missedPoints: -20,
    feedbackPoints: 10,
    budget: 50000000, // 50 triệu VND
    tasks: [
      { id: 1, name: "Chuẩn bị vật liệu học tập", assignee: "Tổ Giáo dục", deadline: "2024-06-25", status: "completed" },
      { id: 2, name: "Liên hệ địa phương", assignee: "Tổ Đối ngoại", deadline: "2024-06-20", status: "completed" },
      { id: 3, name: "Tổ chức xe đưa đón", assignee: "Tổ Hậu cần", deadline: "2024-06-30", status: "in_progress" },
      { id: 4, name: "Chuẩn bị thuốc men y tế", assignee: "Tổ Y tế", deadline: "2024-06-28", status: "pending" }
    ],
    materials: [
      { item: "Sách vở học tập", quantity: 500, unit: "bộ", cost: 2000000 },
      { item: "Thuốc men cơ bản", quantity: 100, unit: "hộp", cost: 5000000 },
      { item: "Vật liệu xây dựng", quantity: 1, unit: "lô", cost: 30000000 },
      { item: "Đồ dùng sinh hoạt", quantity: 200, unit: "bộ", cost: 8000000 }
    ],
    status: 'ACTIVE'
  },
  
  {
    title: "Hội thi Olympic Đoàn viên giỏi 2024",
    description: "Cuộc thi kiến thức về lý luận chính trị, pháp luật, kỹ năng mềm dành cho đoàn viên xuất sắc toàn quốc.",
    type: "STUDY",
    activityCode: "OLYMPIC2024-002", 
    location: "Trung tâm Hội nghị Quốc gia, Hà Nội",
    startTime: new Date('2024-10-15T08:00:00Z'),
    endTime: new Date('2024-10-17T17:00:00Z'),
    maxParticipants: 200,
    checkInStartTime: new Date('2024-10-15T07:30:00Z'),
    checkInEndTime: new Date('2024-10-15T08:30:00Z'),
    requiresLocation: true,
    requiresPostSurvey: true,
    allowFeedback: true,
    onTimePoints: 30,
    latePoints: 20,
    missedPoints: -25,
    feedbackPoints: 15,
    budget: 15000000, // 15 triệu VND
    tasks: [
      { id: 1, name: "Xây dựng đề thi", assignee: "Ban Học tập", deadline: "2024-10-01", status: "completed" },
      { id: 2, name: "Đăng ký thí sinh", assignee: "Ban Tổ chức", deadline: "2024-10-10", status: "completed" },
      { id: 3, name: "Chuẩn bị địa điểm thi", assignee: "Ban Hậu cần", deadline: "2024-10-14", status: "in_progress" },
      { id: 4, name: "Tập huấn ban giám khảo", assignee: "Ban Chuyên môn", deadline: "2024-10-12", status: "pending" }
    ],
    materials: [
      { item: "Đề thi và đáp án", quantity: 500, unit: "bộ", cost: 1000000 },
      { item: "Bút viết", quantity: 1000, unit: "cây", cost: 500000 },
      { item: "Giấy thi", quantity: 100, unit: "ream", cost: 2000000 },
      { item: "Cúp và giải thưởng", quantity: 50, unit: "cái", cost: 10000000 }
    ],
    status: 'ACTIVE'
  },

  {
    title: "Đại hội Đoàn viên toàn quốc lần thứ XII",
    description: "Đại hội 5 năm một lần của Đoàn TNCS Hồ Chí Minh, bầu chọn Ban Chấp hành Trung ương khóa mới và định hướng phát triển.",
    type: "MEETING",
    activityCode: "DHTN12-003",
    location: "Cung Văn hóa Hữu nghị Việt-Xô, Hà Nội", 
    startTime: new Date('2024-12-10T08:00:00Z'),
    endTime: new Date('2024-12-13T18:00:00Z'),
    maxParticipants: 1500,
    checkInStartTime: new Date('2024-12-10T07:00:00Z'),
    checkInEndTime: new Date('2024-12-10T09:00:00Z'),
    requiresLocation: true,
    requiresPostSurvey: true,
    allowFeedback: true,
    onTimePoints: 50,
    latePoints: 30,
    missedPoints: -30,
    feedbackPoints: 20,
    budget: 200000000, // 200 triệu VND
    tasks: [
      { id: 1, name: "Chuẩn bị báo cáo chính trị", assignee: "Văn phòng Trung ương", deadline: "2024-11-30", status: "in_progress" },
      { id: 2, name: "Tổ chức bầu cử", assignee: "Ban Bầu cử", deadline: "2024-12-12", status: "pending" },
      { id: 3, name: "Chuẩn bị lễ khai mạc", assignee: "Ban Văn nghệ", deadline: "2024-12-08", status: "pending" },
      { id: 4, name: "Đảm bảo an ninh", assignee: "Ban Bảo vệ", deadline: "2024-12-09", status: "pending" }
    ],
    materials: [
      { item: "Tài liệu đại hội", quantity: 2000, unit: "bộ", cost: 20000000 },
      { item: "Badge và băng đeo", quantity: 2000, unit: "cái", cost: 5000000 },
      { item: "Hoa và trang trí", quantity: 1, unit: "lô", cost: 30000000 },
      { item: "Phục vụ ăn uống", quantity: 1500, unit: "suất", cost: 45000000 }
    ],
    status: 'ACTIVE'
  }
];

async function seedEnhancedActivities() {
  try {
    console.log('🌱 Bắt đầu seed Enhanced Activities (Module 3.3)...');

    // Get users for host/manager assignment
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const leaderUser = await prisma.user.findFirst({ where: { role: 'LEADER' } });
    const users = await prisma.user.findMany({ take: 5 });
    
    if (!adminUser || !leaderUser) {
      console.log('❌ Cần có Admin và Leader users để seed activities.');
      return;
    }

    const unit = await prisma.unit.findFirst();

    console.log(`📝 Tạo ${enhancedActivities.length} hoạt động nâng cao...`);

    for (let i = 0; i < enhancedActivities.length; i++) {
      const activityData = enhancedActivities[i];
      const qrCode = crypto.randomUUID();
      
      // Assign different organizer, host, manager for variety
      const organizer = users[i % users.length];
      const host = i === 0 ? adminUser : (i === 1 ? leaderUser : users[(i + 1) % users.length]);
      const manager = users[(i + 2) % users.length];

      const activity = await prisma.activity.create({
        data: {
          ...activityData,
          organizerId: organizer.id,
          hostId: host.id,
          managerId: manager.id,
          unitId: unit?.id,
          qrCode
        }
      });

      console.log(`✅ Tạo thành công: ${activity.title}`);

      // Create activity survey for activities that require post-survey
      if (activity.requiresPostSurvey) {
        const surveyQuestions = [
          {
            id: 1,
            type: "rating",
            question: "Bạn đánh giá chất lượng tổ chức hoạt động như thế nào?",
            options: ["Rất tốt", "Tốt", "Trung bình", "Kém", "Rất kém"],
            required: true
          },
          {
            id: 2, 
            type: "text",
            question: "Điều bạn thích nhất trong hoạt động này là gì?",
            required: false
          },
          {
            id: 3,
            type: "multiple",
            question: "Bạn muốn tham gia những hoạt động nào tương tự?",
            options: ["Tình nguyện", "Học tập", "Văn nghệ", "Thể thao", "Du lịch"],
            required: false
          },
          {
            id: 4,
            type: "text", 
            question: "Ý kiến đóng góp của bạn để cải thiện chất lượng hoạt động:",
            required: false
          }
        ];

        await prisma.activitySurvey.create({
          data: {
            activityId: activity.id,
            title: `Khảo sát đánh giá hoạt động: ${activity.title}`,
            description: "Vui lòng chia sẻ ý kiến đánh giá của bạn về hoạt động vừa tham gia.",
            questions: surveyQuestions
          }
        });

        console.log(`   📋 Tạo khảo sát cho: ${activity.title}`);
      }

      // Create some sample participants for active activities
      if (activity.status === 'ACTIVE') {
        const participantUsers = await prisma.user.findMany({
          where: { unitId: unit?.id },
          take: Math.min(3, activity.maxParticipants || 3)
        });

        for (const user of participantUsers) {
          await prisma.activityParticipant.create({
            data: {
              activityId: activity.id,
              userId: user.id,
              status: 'REGISTERED',
              registeredAt: new Date()
            }
          });
        }

        console.log(`   👥 Tạo ${participantUsers.length} người đăng ký cho: ${activity.title}`);
      }
    }

    console.log('🎉 Seed Enhanced Activities hoàn thành!');
    console.log('📊 Dữ liệu đã tạo:');
    console.log(`   - ${enhancedActivities.length} hoạt động nâng cao với đầy đủ thông tin`);
    console.log(`   - Mã hoạt động, chủ trì, phụ trách, công việc, vật chất`);
    console.log(`   - Khảo sát sau hoạt động và người đăng ký`);
    console.log('');
    console.log('🚀 Module 3.3 - Hoạt động Đoàn nâng cao đã sẵn sàng!');

  } catch (error) {
    console.error('❌ Lỗi khi seed Enhanced Activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEnhancedActivities();

