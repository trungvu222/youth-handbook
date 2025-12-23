const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Seeding database với dữ liệu đầy đủ...');

  try {
    // Check if data already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@youth.com' }
    });

    if (existingAdmin) {
      console.log('✅ Database already seeded. Skipping...');
      return;
    }

    const hashedPassword = await hashPassword('123456');

    // =====================================
    // 1. TẠO CHI ĐOÀN (UNITS)
    // =====================================
    console.log('📋 Tạo chi đoàn...');
    
    const unitData = [
      { id: 'unit-cntt', name: 'Chi đoàn Công nghệ thông tin' },
      { id: 'unit-kt', name: 'Chi đoàn Kinh tế' },
      { id: 'unit-yk', name: 'Chi đoàn Y khoa' },
      { id: 'unit-sp', name: 'Chi đoàn Sư phạm' },
      { id: 'unit-kthuat', name: 'Chi đoàn Kỹ thuật' },
    ];
    
    const units = [];
    for (const u of unitData) {
      const unit = await prisma.unit.create({ data: u });
      units.push(unit);
    }
    console.log(`✅ Đã tạo ${units.length} chi đoàn`);

    // =====================================
    // 2. TẠO NGƯỜI DÙNG (USERS)
    // =====================================
    console.log('👤 Tạo người dùng...');
    
    // Admin
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@youth.com',
        fullName: 'Nguyễn Văn Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        points: 1000,
        phone: '0901234567',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        dateOfBirth: new Date('1990-05-15'),
        dateJoined: new Date('2015-03-26'),
        ethnicity: 'Kinh',
        religion: 'Không',
        educationLevel: 'Đại học',
        politicsLevel: 'Trung cấp',
        youthPosition: 'Ban chấp hành Đoàn Cơ sở',
        isActive: true
      },
    });

    // Leaders cho từng chi đoàn
    const leaderData = [
      { username: 'leader_cntt', email: 'leader.cntt@youth.com', fullName: 'Trần Minh Đức', unitIndex: 0, position: 'Bí thư Chi đoàn CNTT' },
      { username: 'leader_kt', email: 'leader.kt@youth.com', fullName: 'Lê Thị Hương', unitIndex: 1, position: 'Bí thư Chi đoàn Kinh tế' },
      { username: 'leader_yk', email: 'leader.yk@youth.com', fullName: 'Phạm Văn Khoa', unitIndex: 2, position: 'Bí thư Chi đoàn Y khoa' },
      { username: 'leader_sp', email: 'leader.sp@youth.com', fullName: 'Hoàng Thị Lan', unitIndex: 3, position: 'Bí thư Chi đoàn Sư phạm' },
      { username: 'leader_kthuat', email: 'leader.kthuat@youth.com', fullName: 'Ngô Văn Thành', unitIndex: 4, position: 'Bí thư Chi đoàn Kỹ thuật' },
    ];

    const leaders = [];
    for (const l of leaderData) {
      const leader = await prisma.user.create({
        data: {
          username: l.username,
          email: l.email,
          fullName: l.fullName,
          passwordHash: hashedPassword,
          role: 'LEADER',
          points: 500 + Math.floor(Math.random() * 300),
          unitId: units[l.unitIndex].id,
          phone: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
          address: 'Hà Nội',
          dateOfBirth: new Date(1992 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
          dateJoined: new Date(2018 + Math.floor(Math.random() * 3), 2, 26),
          ethnicity: 'Kinh',
          religion: 'Không',
          educationLevel: 'Đại học',
          politicsLevel: 'Sơ cấp',
          youthPosition: l.position,
          isActive: true
        },
      });
      leaders.push(leader);
      
      // Update unit với leader
      await prisma.unit.update({
        where: { id: units[l.unitIndex].id },
        data: { leaderId: leader.id }
      });
    }

    // Members - 20 đoàn viên
    const memberNames = [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
      'Hoàng Văn Em', 'Vũ Thị Phượng', 'Đặng Văn Giang', 'Bùi Thị Hạnh',
      'Ngô Văn Inh', 'Đinh Thị Kim', 'Lý Văn Long', 'Mai Thị Mỹ',
      'Phan Văn Nam', 'Trịnh Thị Oanh', 'Dương Văn Phú', 'Hồ Thị Quỳnh',
      'Võ Văn Rạng', 'Tạ Thị Sen', 'Lưu Văn Tài', 'Cao Thị Uyên'
    ];

    const members = [];
    for (let i = 0; i < memberNames.length; i++) {
      const unitIndex = i % 5;
      const member = await prisma.user.create({
        data: {
          username: `member${i + 1}`,
          email: `member${i + 1}@youth.com`,
          fullName: memberNames[i],
          passwordHash: hashedPassword,
          role: 'MEMBER',
          points: 100 + Math.floor(Math.random() * 800),
          unitId: units[unitIndex].id,
          phone: `098${Math.floor(1000000 + Math.random() * 9000000)}`,
          address: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'][Math.floor(Math.random() * 5)],
          dateOfBirth: new Date(1998 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
          dateJoined: new Date(2020 + Math.floor(Math.random() * 4), 2, 26),
          ethnicity: ['Kinh', 'Tày', 'Thái', 'Mường', 'Khmer'][Math.floor(Math.random() * 5)],
          religion: 'Không',
          educationLevel: ['Đại học', 'Cao đẳng', 'Trung cấp'][Math.floor(Math.random() * 3)],
          youthPosition: 'Đoàn viên',
          isActive: true
        },
      });
      members.push(member);
    }

    const allUsers = [adminUser, ...leaders, ...members];
    console.log(`✅ Đã tạo ${allUsers.length} người dùng`);

    // =====================================
    // 3. TẠO SINH HOẠT ĐOÀN (ACTIVITIES)
    // =====================================
    console.log('📅 Tạo sinh hoạt đoàn...');
    
    const activityData = [
      {
        title: 'Sinh hoạt Chi đoàn định kỳ tháng 12/2025',
        description: 'Tổng kết hoạt động năm 2025, đánh giá kết quả rèn luyện và triển khai kế hoạch năm 2026',
        type: 'MEETING',
        startTime: new Date('2025-12-20T14:00:00'),
        endTime: new Date('2025-12-20T17:00:00'),
        location: 'Hội trường A, Trụ sở Đoàn trường',
        pointsReward: 15,
        status: 'ACTIVE',
        maxParticipants: 100
      },
      {
        title: 'Chương trình Xuân tình nguyện 2026',
        description: 'Hoạt động tình nguyện dọn dẹp vệ sinh môi trường, tặng quà Tết cho người nghèo',
        type: 'VOLUNTEER',
        startTime: new Date('2026-01-15T07:00:00'),
        endTime: new Date('2026-01-15T12:00:00'),
        location: 'Phường 10, Quận Gò Vấp',
        pointsReward: 30,
        status: 'ACTIVE',
        maxParticipants: 50
      },
      {
        title: 'Hội thảo Kỹ năng lãnh đạo cho đoàn viên',
        description: 'Tập huấn các kỹ năng lãnh đạo, tổ chức và quản lý cho cán bộ Đoàn',
        type: 'STUDY',
        startTime: new Date('2025-12-25T08:30:00'),
        endTime: new Date('2025-12-25T16:00:00'),
        location: 'Phòng họp B2, Tầng 3',
        pointsReward: 25,
        status: 'ACTIVE',
        maxParticipants: 30
      },
      {
        title: 'Ngày hội Hiến máu nhân đạo',
        description: 'Chương trình hiến máu nhân đạo hưởng ứng lời kêu gọi của Hội Chữ thập đỏ',
        type: 'VOLUNTEER',
        startTime: new Date('2025-12-28T08:00:00'),
        endTime: new Date('2025-12-28T12:00:00'),
        location: 'Sân trường chính',
        pointsReward: 40,
        status: 'ACTIVE',
        maxParticipants: 200
      },
      {
        title: 'Cuộc thi Tìm hiểu về Đoàn TNCS Hồ Chí Minh',
        description: 'Cuộc thi trực tuyến tìm hiểu lịch sử, truyền thống Đoàn TNCS Hồ Chí Minh',
        type: 'STUDY',
        startTime: new Date('2026-03-20T14:00:00'),
        endTime: new Date('2026-03-20T17:00:00'),
        location: 'Online - Zoom Meeting',
        pointsReward: 20,
        status: 'ACTIVE',
        maxParticipants: 500
      },
      {
        title: 'Sinh hoạt lớp Cảm tình Đoàn',
        description: 'Lớp bồi dưỡng nhận thức về Đoàn cho thanh niên chuẩn bị kết nạp',
        type: 'MEETING',
        startTime: new Date('2025-11-15T08:00:00'),
        endTime: new Date('2025-11-15T11:30:00'),
        location: 'Phòng hội thảo C',
        pointsReward: 10,
        status: 'COMPLETED',
        maxParticipants: 40
      },
      {
        title: 'Giải bóng đá Đoàn viên 2025',
        description: 'Giải bóng đá giao lưu giữa các Chi đoàn nhân dịp kỷ niệm ngày thành lập Đoàn',
        type: 'SOCIAL',
        startTime: new Date('2025-03-26T14:00:00'),
        endTime: new Date('2025-03-26T18:00:00'),
        location: 'Sân vận động trường',
        pointsReward: 15,
        status: 'COMPLETED',
        maxParticipants: 100
      },
    ];

    const activities = [];
    for (let i = 0; i < activityData.length; i++) {
      const a = activityData[i];
      const activity = await prisma.activity.create({
        data: {
          ...a,
          organizerId: i < 2 ? adminUser.id : leaders[i % 5].id,
          unitId: i < 2 ? null : units[i % 5].id,
          qrCode: `activity-${Date.now()}-${i}`,
          allowFeedback: true,
          onTimePoints: 15,
          latePoints: 5,
          missedPoints: -10
        }
      });
      activities.push(activity);
    }
    console.log(`✅ Đã tạo ${activities.length} sinh hoạt đoàn`);

    // Thêm participants cho các activities đã completed
    for (const activity of activities.filter(a => a.status === 'COMPLETED')) {
      const participantCount = Math.floor(10 + Math.random() * 15);
      const shuffledMembers = [...members].sort(() => Math.random() - 0.5).slice(0, participantCount);
      
      for (const member of shuffledMembers) {
        await prisma.activityParticipant.create({
          data: {
            activityId: activity.id,
            userId: member.id,
            status: 'COMPLETED',
            checkInTime: new Date(activity.startTime.getTime() + Math.random() * 30 * 60000),
            pointsEarned: activity.pointsReward
          }
        });
      }
    }

    // =====================================
    // 4. TẠO TÀI LIỆU ĐOÀN (DOCUMENTS)
    // =====================================
    console.log('📚 Tạo tài liệu đoàn...');
    
    const documentData = [
      {
        title: 'Điều lệ Đoàn TNCS Hồ Chí Minh',
        documentNumber: '01-ĐL/TW',
        documentType: 'REGULATION',
        issuer: 'Ban Chấp hành Trung ương Đoàn',
        description: 'Điều lệ Đoàn TNCS Hồ Chí Minh được thông qua tại Đại hội Đoàn toàn quốc lần thứ XII',
        content: 'Điều lệ quy định về mục đích, tính chất, nhiệm vụ, quyền hạn của Đoàn...',
        status: 'PUBLISHED',
        issuedDate: new Date('2022-12-15'),
        effectiveDate: new Date('2023-01-01'),
        viewCount: 1250,
        downloadCount: 456
      },
      {
        title: 'Hướng dẫn đánh giá xếp loại đoàn viên',
        documentNumber: '15-HD/TWĐTN',
        documentType: 'GUIDELINE',
        issuer: 'Ban Tổ chức Trung ương Đoàn',
        description: 'Hướng dẫn chi tiết quy trình và tiêu chí đánh giá xếp loại đoàn viên hàng năm',
        status: 'PUBLISHED',
        issuedDate: new Date('2024-01-10'),
        effectiveDate: new Date('2024-02-01'),
        viewCount: 890,
        downloadCount: 312
      },
      {
        title: 'Quy chế hoạt động của Ban Chấp hành Chi đoàn',
        documentNumber: '08-QC/ĐTN',
        documentType: 'REGULATION',
        issuer: 'Đoàn trường',
        description: 'Quy chế quy định chức năng, nhiệm vụ và quyền hạn của BCH Chi đoàn',
        status: 'PUBLISHED',
        issuedDate: new Date('2024-09-01'),
        effectiveDate: new Date('2024-09-15'),
        viewCount: 567,
        downloadCount: 189
      },
      {
        title: 'Mẫu sổ đoàn viên',
        documentNumber: 'Mẫu-01/SĐV',
        documentType: 'FORM',
        issuer: 'Đoàn trường',
        description: 'Mẫu sổ đoàn viên theo quy định mới của Trung ương Đoàn',
        status: 'PUBLISHED',
        issuedDate: new Date('2024-03-20'),
        viewCount: 2100,
        downloadCount: 1560
      },
      {
        title: 'Thông báo về việc thu đoàn phí năm 2025',
        documentNumber: '45-TB/ĐTN',
        documentType: 'NOTICE',
        issuer: 'Đoàn trường',
        description: 'Thông báo mức thu và thời hạn nộp đoàn phí năm 2025',
        status: 'PUBLISHED',
        issuedDate: new Date('2025-01-05'),
        effectiveDate: new Date('2025-01-10'),
        viewCount: 450,
        downloadCount: 78
      },
      {
        title: 'Công văn triệu tập Đại hội Chi đoàn',
        documentNumber: '88-CV/ĐTN',
        documentType: 'LETTER',
        issuer: 'Đoàn trường',
        description: 'Triệu tập Đại hội Chi đoàn nhiệm kỳ 2025-2027',
        status: 'PUBLISHED',
        issuedDate: new Date('2025-11-01'),
        viewCount: 320,
        downloadCount: 145
      },
      {
        title: 'Nghị quyết về công tác Đoàn và phong trào thanh niên năm 2025',
        documentNumber: '12-NQ/ĐTN',
        documentType: 'DECISION',
        issuer: 'Ban Chấp hành Đoàn trường',
        description: 'Nghị quyết đề ra các nhiệm vụ trọng tâm và giải pháp thực hiện công tác Đoàn năm 2025',
        status: 'PUBLISHED',
        issuedDate: new Date('2025-01-15'),
        effectiveDate: new Date('2025-01-20'),
        viewCount: 678,
        downloadCount: 234
      },
    ];

    const documents = [];
    for (const d of documentData) {
      const doc = await prisma.document.create({
        data: {
          ...d,
          authorId: adminUser.id,
        }
      });
      documents.push(doc);
    }
    console.log(`✅ Đã tạo ${documents.length} tài liệu`);

    // =====================================
    // 5. TẠO BÀI KIỂM TRA (EXAMS)
    // =====================================
    console.log('📝 Tạo bài kiểm tra tìm hiểu...');
    
    const examData = [
      {
        title: 'Tìm hiểu về Đoàn TNCS Hồ Chí Minh',
        description: 'Bài kiểm tra kiến thức về lịch sử, truyền thống của Đoàn TNCS Hồ Chí Minh',
        instructions: 'Thời gian làm bài 30 phút. Mỗi câu hỏi 1 điểm. Đạt từ 60% trở lên được cộng điểm rèn luyện.',
        duration: 30,
        totalQuestions: 10,
        passingScore: 60,
        maxAttempts: 3,
        pointsAwarded: 20,
        status: 'ACTIVE',
        showResults: true,
        showAnswers: true,
        shuffleQuestions: true,
        startTime: new Date('2025-12-01'),
        endTime: new Date('2025-12-31'),
      },
      {
        title: 'Kiến thức về Điều lệ Đoàn',
        description: 'Bài thi trắc nghiệm về các quy định trong Điều lệ Đoàn TNCS Hồ Chí Minh',
        instructions: 'Thời gian 20 phút. Chọn đáp án đúng nhất cho mỗi câu hỏi.',
        duration: 20,
        totalQuestions: 15,
        passingScore: 70,
        maxAttempts: 2,
        pointsAwarded: 25,
        status: 'ACTIVE',
        showResults: true,
        startTime: new Date('2025-12-01'),
        endTime: new Date('2026-01-15'),
      },
      {
        title: 'Cuộc thi Tìm hiểu Ngày thành lập Đoàn 26/3',
        description: 'Cuộc thi trực tuyến nhân dịp kỷ niệm ngày thành lập Đoàn TNCS Hồ Chí Minh',
        instructions: 'Thời gian 45 phút. 20 câu hỏi. Điểm số được xếp hạng để trao giải.',
        duration: 45,
        totalQuestions: 20,
        passingScore: 50,
        maxAttempts: 1,
        pointsAwarded: 50,
        status: 'ACTIVE',
        startTime: new Date('2026-03-20'),
        endTime: new Date('2026-03-26'),
      },
    ];

    const exams = [];
    for (const e of examData) {
      const exam = await prisma.exam.create({
        data: {
          ...e,
          creatorId: adminUser.id,
        }
      });
      exams.push(exam);

      // Tạo câu hỏi mẫu cho exam đầu tiên
      if (exams.length === 1) {
        const questions = [
          {
            questionText: 'Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?',
            questionType: 'SINGLE_CHOICE',
            answers: [
              { text: '26/3/1931', isCorrect: true },
              { text: '19/5/1931', isCorrect: false },
              { text: '3/2/1930', isCorrect: false },
              { text: '2/9/1945', isCorrect: false }
            ],
            explanation: 'Đoàn TNCS Hồ Chí Minh được thành lập ngày 26/3/1931 tại Hồng Kông, Trung Quốc.',
            points: 1
          },
          {
            questionText: 'Ai là Bí thư thứ nhất Ban Chấp hành Trung ương Đoàn khóa XII?',
            questionType: 'SINGLE_CHOICE',
            answers: [
              { text: 'Nguyễn Đắc Vinh', isCorrect: false },
              { text: 'Bùi Quang Huy', isCorrect: true },
              { text: 'Lê Quốc Phong', isCorrect: false },
              { text: 'Nguyễn Anh Tuấn', isCorrect: false }
            ],
            points: 1
          },
          {
            questionText: 'Khẩu hiệu hành động của Đoàn là gì?',
            questionType: 'SINGLE_CHOICE',
            answers: [
              { text: 'Tuổi trẻ Việt Nam tiên phong, bản lĩnh, đoàn kết, sáng tạo, phát triển', isCorrect: false },
              { text: 'Đâu cần thanh niên có, việc gì khó có thanh niên', isCorrect: true },
              { text: 'Xung kích, tình nguyện, sáng tạo, hội nhập', isCorrect: false },
              { text: 'Thanh niên Việt Nam tiên phong, đoàn kết, sáng tạo', isCorrect: false }
            ],
            points: 1
          },
          {
            questionText: 'Đoàn viên có những nhiệm vụ nào sau đây?',
            questionType: 'MULTIPLE_CHOICE',
            answers: [
              { text: 'Luôn phấn đấu vì lý tưởng của Đảng và Bác Hồ', isCorrect: true },
              { text: 'Gương mẫu chấp hành chủ trương của Đảng, chính sách pháp luật của Nhà nước', isCorrect: true },
              { text: 'Tham gia xây dựng Đoàn', isCorrect: true },
              { text: 'Chỉ tham gia sinh hoạt Đoàn khi có thời gian', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Huy hiệu Đoàn được sử dụng chính thức từ năm nào?',
            questionType: 'SINGLE_CHOICE',
            answers: [
              { text: '1956', isCorrect: true },
              { text: '1931', isCorrect: false },
              { text: '1945', isCorrect: false },
              { text: '1960', isCorrect: false }
            ],
            points: 1
          },
        ];

        for (let i = 0; i < questions.length; i++) {
          await prisma.examQuestion.create({
            data: {
              examId: exam.id,
              ...questions[i],
              orderIndex: i + 1
            }
          });
        }
      }
    }
    console.log(`✅ Đã tạo ${exams.length} bài kiểm tra`);

    // =====================================
    // 6. TẠO KIẾN NGHỊ (SUGGESTIONS)
    // =====================================
    console.log('💬 Tạo kiến nghị...');
    
    const suggestionData = [
      {
        title: 'Đề xuất tổ chức thêm hoạt động thể thao',
        content: 'Kính gửi Ban Chấp hành Đoàn trường,\n\nTôi xin đề xuất tổ chức thêm các hoạt động thể thao như giải bóng chuyền, cầu lông vào cuối tuần để đoàn viên có thể rèn luyện sức khỏe và giao lưu.',
        category: 'IDEA',
        priority: 'MEDIUM',
        status: 'SUBMITTED'
      },
      {
        title: 'Cải thiện hệ thống điểm danh sinh hoạt',
        content: 'Hệ thống điểm danh bằng QR code hiện tại đôi khi bị chậm. Đề xuất cải thiện tốc độ xử lý và thêm tính năng điểm danh offline.',
        category: 'IMPROVEMENT',
        priority: 'HIGH',
        status: 'UNDER_REVIEW'
      },
      {
        title: 'Câu hỏi về thủ tục chuyển sinh hoạt Đoàn',
        content: 'Tôi sắp chuyển công tác sang đơn vị mới. Xin hỏi thủ tục chuyển sinh hoạt Đoàn như thế nào và cần những giấy tờ gì?',
        category: 'QUESTION',
        priority: 'LOW',
        status: 'RESOLVED'
      },
      {
        title: 'Phản ánh về việc thông báo sinh hoạt muộn',
        content: 'Một số buổi sinh hoạt được thông báo quá gấp (chỉ trước 1-2 ngày) khiến đoàn viên khó sắp xếp lịch. Đề nghị thông báo sớm hơn.',
        category: 'COMPLAINT',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS'
      },
      {
        title: 'Đề xuất tổ chức câu lạc bộ tiếng Anh',
        content: 'Xin đề xuất thành lập CLB tiếng Anh cho đoàn viên để cải thiện kỹ năng ngoại ngữ, chuẩn bị tốt cho hội nhập quốc tế.',
        category: 'IDEA',
        priority: 'MEDIUM',
        status: 'SUBMITTED'
      },
    ];

    const suggestions = [];
    for (let i = 0; i < suggestionData.length; i++) {
      const s = suggestionData[i];
      const suggestion = await prisma.suggestion.create({
        data: {
          ...s,
          userId: members[i % members.length].id,
          isAnonymous: i === 3, // 1 kiến nghị ẩn danh
          viewCount: Math.floor(10 + Math.random() * 50),
          resolvedAt: s.status === 'RESOLVED' ? new Date() : null
        }
      });
      suggestions.push(suggestion);

      // Thêm response cho các kiến nghị đã được xử lý
      if (s.status === 'RESOLVED' || s.status === 'IN_PROGRESS') {
        await prisma.suggestionResponse.create({
          data: {
            suggestionId: suggestion.id,
            content: s.status === 'RESOLVED' 
              ? 'Cảm ơn bạn đã gửi câu hỏi. Về thủ tục chuyển sinh hoạt Đoàn, bạn cần: 1) Giấy giới thiệu từ Chi đoàn cũ, 2) Sổ đoàn viên. Vui lòng liên hệ Văn phòng Đoàn để được hướng dẫn chi tiết.'
              : 'Ban Chấp hành đã ghi nhận ý kiến và đang họp để cải thiện quy trình thông báo.',
            responderId: adminUser.id,
            isPublic: true
          }
        });
      }
    }
    console.log(`✅ Đã tạo ${suggestions.length} kiến nghị`);

    // =====================================
    // 7. TẠO ĐỢT ĐÁNH GIÁ XẾP LOẠI (RATING PERIODS)
    // =====================================
    console.log('⭐ Tạo đợt đánh giá xếp loại...');
    
    const ratingCriteria = [
      { id: 'c1', title: 'Chấp hành chủ trương của Đảng, chính sách pháp luật của Nhà nước', maxPoints: 20 },
      { id: 'c2', title: 'Tham gia sinh hoạt Đoàn định kỳ', maxPoints: 20 },
      { id: 'c3', title: 'Đóng đoàn phí đầy đủ', maxPoints: 15 },
      { id: 'c4', title: 'Tham gia hoạt động tình nguyện', maxPoints: 15 },
      { id: 'c5', title: 'Hoàn thành nhiệm vụ học tập/công tác', maxPoints: 20 },
      { id: 'c6', title: 'Có tinh thần xây dựng Đoàn', maxPoints: 10 }
    ];

    const ratingPeriods = await Promise.all([
      prisma.ratingPeriod.create({
        data: {
          title: 'Đánh giá xếp loại đoàn viên năm 2025',
          description: 'Đợt đánh giá xếp loại đoàn viên năm 2025 theo tiêu chí của Trung ương Đoàn',
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-31'),
          criteria: ratingCriteria,
          status: 'ACTIVE',
          targetAudience: 'ALL',
          createdBy: adminUser.id
        }
      }),
      prisma.ratingPeriod.create({
        data: {
          title: 'Đánh giá xếp loại đoàn viên HK1/2025',
          description: 'Đợt đánh giá giữa kỳ học kỳ 1 năm 2025',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-30'),
          criteria: ratingCriteria,
          status: 'COMPLETED',
          targetAudience: 'ALL',
          createdBy: adminUser.id
        }
      })
    ]);

    // Tạo một số self-ratings cho đợt đã hoàn thành
    const completedPeriod = ratingPeriods[1];
    for (let i = 0; i < 10; i++) {
      const member = members[i];
      const responses = ratingCriteria.map(c => ({
        criteriaId: c.id,
        score: Math.floor(c.maxPoints * (0.6 + Math.random() * 0.4)),
        note: ''
      }));
      const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
      let suggestedRating = 'AVERAGE';
      if (totalScore >= 90) suggestedRating = 'EXCELLENT';
      else if (totalScore >= 75) suggestedRating = 'GOOD';
      else if (totalScore < 50) suggestedRating = 'POOR';

      await prisma.selfRating.create({
        data: {
          periodId: completedPeriod.id,
          userId: member.id,
          criteriaResponses: responses,
          suggestedRating: suggestedRating,
          selfAssessment: 'Tôi đã cố gắng hoàn thành tốt các nhiệm vụ được giao và tích cực tham gia sinh hoạt Đoàn.',
          status: 'APPROVED',
          finalRating: suggestedRating,
          adminNotes: 'Đã xác nhận',
          pointsAwarded: suggestedRating === 'EXCELLENT' ? 50 : suggestedRating === 'GOOD' ? 30 : 15,
          submittedAt: new Date('2025-06-15'),
          reviewedAt: new Date('2025-06-25'),
          reviewedBy: adminUser.id
        }
      });
    }
    console.log(`✅ Đã tạo ${ratingPeriods.length} đợt đánh giá`);

    // =====================================
    // 8. TẠO LỊCH SỬ ĐIỂM (POINTS HISTORY)
    // =====================================
    console.log('📊 Tạo lịch sử điểm...');
    
    const reasons = [
      'Tham gia sinh hoạt Chi đoàn định kỳ',
      'Hoàn thành bài kiểm tra trực tuyến',
      'Tham gia hoạt động tình nguyện',
      'Đóng đoàn phí đúng hạn',
      'Có ý kiến đóng góp xây dựng',
      'Được khen thưởng cấp trường',
      'Tham gia hiến máu nhân đạo',
      'Hoàn thành khóa học kỹ năng'
    ];

    for (const user of allUsers) {
      const numRecords = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numRecords; i++) {
        await prisma.pointsHistory.create({
          data: {
            userId: user.id,
            points: [5, 10, 15, 20, 25, 30][Math.floor(Math.random() * 6)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            type: 'EARN',
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
    console.log('✅ Đã tạo lịch sử điểm');

    // =====================================
    // 9. TẠO BÀI ĐĂNG (POSTS)
    // =====================================
    console.log('📰 Tạo bài đăng...');
    
    const postData = [
      {
        title: 'Thông báo lịch sinh hoạt Chi đoàn tháng 12/2025',
        content: 'Kính gửi toàn thể đoàn viên,\n\nBan Chấp hành Đoàn trường thông báo lịch sinh hoạt Chi đoàn tháng 12/2025 như sau:\n- Ngày 20/12: Sinh hoạt định kỳ\n- Ngày 28/12: Tổng kết năm 2025\n\nĐề nghị các đoàn viên sắp xếp thời gian tham gia đầy đủ.',
        postType: 'ANNOUNCEMENT',
        status: 'APPROVED'
      },
      {
        title: 'Chi đoàn Công nghệ đạt giải Nhất cuộc thi Sáng tạo trẻ',
        content: 'Chúc mừng Chi đoàn Công nghệ thông tin đã xuất sắc giành giải Nhất cuộc thi Sáng tạo trẻ cấp thành phố năm 2025.\n\nĐội thi gồm các bạn: Nguyễn Văn An, Trần Thị Bình, Lê Văn Cường đã mang về vinh dự cho Đoàn trường.',
        postType: 'NEWS',
        status: 'APPROVED'
      },
      {
        title: 'Đề xuất tổ chức giải bóng đá Xuân 2026',
        content: 'Em xin đề xuất tổ chức giải bóng đá giao hữu giữa các Chi đoàn nhân dịp Tết Nguyên đán 2026.\n\nThời gian dự kiến: Tuần đầu tháng 2/2026\nĐịa điểm: Sân vận động trường',
        postType: 'SUGGESTION',
        status: 'PENDING'
      },
      {
        title: 'Kết quả Đại hội Chi đoàn nhiệm kỳ 2025-2027',
        content: 'Đại hội Chi đoàn các đơn vị đã diễn ra thành công tốt đẹp. Ban Chấp hành Chi đoàn mới đã được bầu với đầy đủ năng lực và nhiệt huyết.\n\nChúc mừng các đồng chí trúng cử!',
        postType: 'NEWS',
        status: 'APPROVED'
      },
    ];

    for (let i = 0; i < postData.length; i++) {
      await prisma.post.create({
        data: {
          ...postData[i],
          authorId: i < 2 ? adminUser.id : members[i].id,
          unitId: i < 2 ? null : units[i % 5].id,
          publishedAt: postData[i].status === 'APPROVED' ? new Date() : null
        }
      });
    }
    console.log(`✅ Đã tạo ${postData.length} bài đăng`);

    // =====================================
    // HOÀN THÀNH
    // =====================================
    console.log('\n🎉 ====================================');
    console.log('   SEED DATABASE HOÀN THÀNH!');
    console.log('=====================================');
    console.log('');
    console.log('📊 Thống kê dữ liệu đã tạo:');
    console.log(`   - ${units.length} chi đoàn`);
    console.log(`   - ${allUsers.length} người dùng (1 admin, ${leaders.length} leader, ${members.length} đoàn viên)`);
    console.log(`   - ${activities.length} sinh hoạt đoàn`);
    console.log(`   - ${documents.length} tài liệu`);
    console.log(`   - ${exams.length} bài kiểm tra`);
    console.log(`   - ${suggestions.length} kiến nghị`);
    console.log(`   - ${ratingPeriods.length} đợt đánh giá`);
    console.log('');
    console.log('🔐 Thông tin đăng nhập:');
    console.log('   Admin:  admin@youth.com / 123456');
    console.log('   Leader: leader.cntt@youth.com / 123456');
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


