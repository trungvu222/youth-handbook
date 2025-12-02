const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const unitRoutes = require('./routes/units');
const activityRoutes = require('./routes/activities');
const surveyRoutes = require('./routes/surveys');
const postRoutes = require('./routes/posts');
const pointsRoutes = require('./routes/points');
const documentRoutes = require('./routes/documents');
const studyRoutes = require('./routes/study');
const examRoutes = require('./routes/exams');
const ratingRoutes = require('./routes/rating');
const suggestionRoutes = require('./routes/suggestions');
// const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'http://localhost:3001', 'https://youth-handbook.vercel.app', 'https://youth-handbook-trungvu222s-projects.vercel.app']
    : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Inline admin routes
app.get('/api/admin/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route working',
    timestamp: new Date().toISOString()
  });
});

// Seed admin endpoint (one-time use)
app.post('/api/admin/seed-admin', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Check if admin exists
    let admin = await prisma.user.findFirst({
      where: { email: 'admin@youth.com' }
    });
    
    if (admin) {
      // Update to ADMIN role and reset password
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { 
          role: 'ADMIN',
          passwordHash: hashedPassword
        }
      });
      return res.json({ success: true, message: 'Admin updated with new password', user: { id: admin.id, email: admin.email, role: admin.role } });
    }
    
    // Create new admin
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@youth.com',
        passwordHash: hashedPassword,
        fullName: 'Administrator',
        role: 'ADMIN'
      }
    });
    
    res.json({ success: true, message: 'Admin created', user: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed sample data endpoint
app.post('/api/admin/seed-data', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Create units
    const units = await Promise.all([
      prisma.unit.upsert({
        where: { id: 'unit-cntt' },
        update: {},
        create: { id: 'unit-cntt', name: 'Chi đoàn Công nghệ' }
      }),
      prisma.unit.upsert({
        where: { id: 'unit-kt' },
        update: {},
        create: { id: 'unit-kt', name: 'Chi đoàn Kinh tế' }
      }),
      prisma.unit.upsert({
        where: { id: 'unit-yk' },
        update: {},
        create: { id: 'unit-yk', name: 'Chi đoàn Y khoa' }
      }),
      prisma.unit.upsert({
        where: { id: 'unit-sp' },
        update: {},
        create: { id: 'unit-sp', name: 'Chi đoàn Sư phạm' }
      }),
      prisma.unit.upsert({
        where: { id: 'unit-kthuat' },
        update: {},
        create: { id: 'unit-kthuat', name: 'Chi đoàn Kỹ thuật' }
      })
    ]);
    
    // Create sample members
    const members = [
      { username: 'nguyenvanan', email: 'an@youth.com', fullName: 'Nguyễn Văn An', unitId: 'unit-cntt', points: 850 },
      { username: 'tranthiminh', email: 'minh@youth.com', fullName: 'Trần Thị Minh', unitId: 'unit-kt', points: 720 },
      { username: 'levancuong', email: 'cuong@youth.com', fullName: 'Lê Văn Cường', unitId: 'unit-yk', points: 580 },
      { username: 'phamthidung', email: 'dung@youth.com', fullName: 'Phạm Thị Dung', unitId: 'unit-sp', points: 920 },
      { username: 'hoangvanem', email: 'em@youth.com', fullName: 'Hoàng Văn Em', unitId: 'unit-kthuat', points: 450 },
      { username: 'ngothimai', email: 'mai@youth.com', fullName: 'Ngô Thị Mai', unitId: 'unit-cntt', points: 780 },
      { username: 'dangvantuan', email: 'tuan@youth.com', fullName: 'Đặng Văn Tuấn', unitId: 'unit-kt', points: 650 },
      { username: 'vuthilan', email: 'lan@youth.com', fullName: 'Vũ Thị Lan', unitId: 'unit-yk', points: 890 }
    ];
    
    const createdMembers = [];
    for (const member of members) {
      const user = await prisma.user.upsert({
        where: { email: member.email },
        update: { points: member.points, unitId: member.unitId },
        create: {
          username: member.username,
          email: member.email,
          passwordHash: hashedPassword,
          fullName: member.fullName,
          role: 'MEMBER',
          unitId: member.unitId,
          points: member.points,
          phone: '0' + Math.floor(100000000 + Math.random() * 900000000)
        }
      });
      createdMembers.push(user);
    }
    
    await prisma.$disconnect();
    
    res.json({ 
      success: true, 
      message: 'Sample data created', 
      data: {
        units: units.length,
        members: createdMembers.length
      }
    });
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// FULL RESET AND SEED ENDPOINT - Xóa tất cả và tạo dữ liệu mới
app.post('/api/admin/reset-and-seed', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    console.log('🔄 Starting reset and seed...');
    
    // Xóa tất cả dữ liệu theo thứ tự
    console.log('🗑️ Deleting old data...');
    await prisma.suggestionResponse.deleteMany({});
    await prisma.suggestion.deleteMany({});
    await prisma.selfRating.deleteMany({});
    await prisma.ratingPeriod.deleteMany({});
    await prisma.examAttempt.deleteMany({});
    await prisma.examQuestion.deleteMany({});
    await prisma.exam.deleteMany({});
    await prisma.documentView.deleteMany({});
    await prisma.userDocumentFavorite.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.activitySurveyResponse.deleteMany({});
    await prisma.activitySurvey.deleteMany({});
    await prisma.activityNotification.deleteMany({});
    await prisma.activityFeedback.deleteMany({});
    await prisma.activityParticipant.deleteMany({});
    await prisma.pointsHistory.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.surveyResponse.deleteMany({});
    await prisma.survey.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.unit.deleteMany({});
    
    console.log('✅ Old data deleted');
    
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // 1. Tạo Chi đoàn
    console.log('📋 Creating units...');
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
    
    // 2. Tạo Users
    console.log('👤 Creating users...');
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
        youthPosition: 'Bí thư Đoàn trường',
        isActive: true
      },
    });
    
    // Leaders
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
          youthPosition: l.position,
          isActive: true
        },
      });
      leaders.push(leader);
      await prisma.unit.update({ where: { id: units[l.unitIndex].id }, data: { leaderId: leader.id } });
    }
    
    // Members
    const memberNames = [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
      'Hoàng Văn Em', 'Vũ Thị Phượng', 'Đặng Văn Giang', 'Bùi Thị Hạnh',
      'Ngô Văn Inh', 'Đinh Thị Kim', 'Lý Văn Long', 'Mai Thị Mỹ',
      'Phan Văn Nam', 'Trịnh Thị Oanh', 'Dương Văn Phú', 'Hồ Thị Quỳnh',
      'Võ Văn Rạng', 'Tạ Thị Sen', 'Lưu Văn Tài', 'Cao Thị Uyên'
    ];
    
    const members = [];
    for (let i = 0; i < memberNames.length; i++) {
      const member = await prisma.user.create({
        data: {
          username: `member${i + 1}`,
          email: `member${i + 1}@youth.com`,
          fullName: memberNames[i],
          passwordHash: hashedPassword,
          role: 'MEMBER',
          points: 100 + Math.floor(Math.random() * 800),
          unitId: units[i % 5].id,
          phone: `098${Math.floor(1000000 + Math.random() * 9000000)}`,
          youthPosition: 'Đoàn viên',
          isActive: true
        },
      });
      members.push(member);
    }
    
    const allUsers = [adminUser, ...leaders, ...members];
    
    // 3. Tạo Activities
    console.log('📅 Creating activities...');
    const activityData = [
      { title: 'Sinh hoạt Chi đoàn định kỳ tháng 12/2025', type: 'MEETING', location: 'Hội trường A', pointsReward: 15, status: 'ACTIVE' },
      { title: 'Chương trình Xuân tình nguyện 2026', type: 'VOLUNTEER', location: 'Phường 10, Quận Gò Vấp', pointsReward: 30, status: 'ACTIVE' },
      { title: 'Hội thảo Kỹ năng lãnh đạo', type: 'STUDY', location: 'Phòng họp B2', pointsReward: 25, status: 'ACTIVE' },
      { title: 'Ngày hội Hiến máu nhân đạo', type: 'VOLUNTEER', location: 'Sân trường', pointsReward: 40, status: 'ACTIVE' },
      { title: 'Cuộc thi Tìm hiểu về Đoàn', type: 'STUDY', location: 'Online', pointsReward: 20, status: 'ACTIVE' },
      { title: 'Giải bóng đá Đoàn viên 2025', type: 'SOCIAL', location: 'Sân vận động', pointsReward: 15, status: 'COMPLETED' },
    ];
    
    const activities = [];
    for (let i = 0; i < activityData.length; i++) {
      const a = activityData[i];
      const activity = await prisma.activity.create({
        data: {
          ...a,
          description: `Mô tả chi tiết về ${a.title}`,
          organizerId: i < 2 ? adminUser.id : leaders[i % 5].id,
          unitId: i < 2 ? null : units[i % 5].id,
          startTime: new Date(2025, 11, 20 + i, 14, 0),
          endTime: new Date(2025, 11, 20 + i, 17, 0),
          qrCode: `activity-${Date.now()}-${i}`,
          maxParticipants: 50 + i * 10
        }
      });
      activities.push(activity);
    }
    
    // 4. Tạo Documents
    console.log('📚 Creating documents...');
    const docData = [
      { title: 'Điều lệ Đoàn TNCS Hồ Chí Minh', documentNumber: '01-ĐL/TW', documentType: 'REGULATION', issuer: 'Ban Chấp hành TW Đoàn', viewCount: 1250 },
      { title: 'Hướng dẫn đánh giá xếp loại đoàn viên', documentNumber: '15-HD/TWĐTN', documentType: 'GUIDELINE', issuer: 'Ban Tổ chức TW Đoàn', viewCount: 890 },
      { title: 'Quy chế hoạt động BCH Chi đoàn', documentNumber: '08-QC/ĐTN', documentType: 'REGULATION', issuer: 'Đoàn trường', viewCount: 567 },
      { title: 'Mẫu sổ đoàn viên', documentNumber: 'Mẫu-01/SĐV', documentType: 'FORM', issuer: 'Đoàn trường', viewCount: 2100 },
      { title: 'Thông báo thu đoàn phí năm 2025', documentNumber: '45-TB/ĐTN', documentType: 'NOTICE', issuer: 'Đoàn trường', viewCount: 450 },
      { title: 'Công văn triệu tập Đại hội Chi đoàn', documentNumber: '88-CV/ĐTN', documentType: 'LETTER', issuer: 'Đoàn trường', viewCount: 320 },
      { title: 'Nghị quyết công tác Đoàn năm 2025', documentNumber: '12-NQ/ĐTN', documentType: 'DECISION', issuer: 'BCH Đoàn trường', viewCount: 678 },
    ];
    
    for (const d of docData) {
      await prisma.document.create({
        data: {
          ...d,
          description: `Mô tả về ${d.title}`,
          status: 'PUBLISHED',
          issuedDate: new Date(2024, 0, 15),
          authorId: adminUser.id,
          downloadCount: Math.floor(d.viewCount * 0.3)
        }
      });
    }
    
    // 5. Tạo Exams
    console.log('📝 Creating exams...');
    const examData = [
      { title: 'Tìm hiểu về Đoàn TNCS Hồ Chí Minh', duration: 30, totalQuestions: 10, passingScore: 60, pointsAwarded: 20 },
      { title: 'Kiến thức về Điều lệ Đoàn', duration: 20, totalQuestions: 15, passingScore: 70, pointsAwarded: 25 },
      { title: 'Cuộc thi Tìm hiểu Ngày 26/3', duration: 45, totalQuestions: 20, passingScore: 50, pointsAwarded: 50 },
    ];
    
    for (const e of examData) {
      const exam = await prisma.exam.create({
        data: {
          ...e,
          description: `Mô tả về ${e.title}`,
          instructions: 'Thời gian làm bài có giới hạn. Chọn đáp án đúng nhất.',
          status: 'ACTIVE',
          showResults: true,
          maxAttempts: 3,
          startTime: new Date(2025, 11, 1),
          endTime: new Date(2025, 11, 31),
          creatorId: adminUser.id
        }
      });
      
      // Tạo câu hỏi cho exam đầu
      if (exam.title.includes('Tìm hiểu')) {
        const questions = [
          { questionText: 'Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?', answers: [{ text: '26/3/1931', isCorrect: true }, { text: '19/5/1931', isCorrect: false }, { text: '3/2/1930', isCorrect: false }, { text: '2/9/1945', isCorrect: false }] },
          { questionText: 'Tuổi đoàn viên từ bao nhiêu đến bao nhiêu?', answers: [{ text: '16-30 tuổi', isCorrect: true }, { text: '15-28 tuổi', isCorrect: false }, { text: '18-35 tuổi', isCorrect: false }] },
          { questionText: 'Màu cờ Đoàn là màu gì?', answers: [{ text: 'Đỏ', isCorrect: true }, { text: 'Xanh', isCorrect: false }, { text: 'Vàng', isCorrect: false }] },
        ];
        for (let i = 0; i < questions.length; i++) {
          await prisma.examQuestion.create({
            data: {
              examId: exam.id,
              questionText: questions[i].questionText,
              questionType: 'SINGLE_CHOICE',
              answers: questions[i].answers,
              points: 1,
              orderIndex: i + 1
            }
          });
        }
      }
    }
    
    // 6. Tạo Suggestions
    console.log('💬 Creating suggestions...');
    const suggestionData = [
      { title: 'Đề xuất tổ chức hoạt động thể thao', category: 'IDEA', priority: 'MEDIUM', status: 'SUBMITTED' },
      { title: 'Cải thiện hệ thống điểm danh', category: 'IMPROVEMENT', priority: 'HIGH', status: 'UNDER_REVIEW' },
      { title: 'Câu hỏi về thủ tục chuyển sinh hoạt Đoàn', category: 'QUESTION', priority: 'LOW', status: 'RESOLVED' },
      { title: 'Phản ánh về việc thông báo muộn', category: 'COMPLAINT', priority: 'MEDIUM', status: 'IN_PROGRESS' },
      { title: 'Đề xuất tổ chức CLB tiếng Anh', category: 'IDEA', priority: 'MEDIUM', status: 'SUBMITTED' },
    ];
    
    for (let i = 0; i < suggestionData.length; i++) {
      const s = suggestionData[i];
      const suggestion = await prisma.suggestion.create({
        data: {
          ...s,
          content: `Nội dung chi tiết về ${s.title}`,
          userId: members[i % members.length].id,
          viewCount: Math.floor(10 + Math.random() * 50),
          resolvedAt: s.status === 'RESOLVED' ? new Date() : null
        }
      });
      
      if (s.status === 'RESOLVED' || s.status === 'IN_PROGRESS') {
        await prisma.suggestionResponse.create({
          data: {
            suggestionId: suggestion.id,
            content: 'Ban Chấp hành đã ghi nhận và đang xử lý ý kiến của bạn.',
            responderId: adminUser.id,
            isPublic: true
          }
        });
      }
    }
    
    // 7. Tạo Rating Periods
    console.log('⭐ Creating rating periods...');
    const ratingCriteria = [
      { id: 'c1', title: 'Chấp hành chủ trương của Đảng', maxPoints: 20 },
      { id: 'c2', title: 'Tham gia sinh hoạt Đoàn', maxPoints: 20 },
      { id: 'c3', title: 'Đóng đoàn phí đầy đủ', maxPoints: 15 },
      { id: 'c4', title: 'Tham gia hoạt động tình nguyện', maxPoints: 15 },
      { id: 'c5', title: 'Hoàn thành nhiệm vụ học tập', maxPoints: 20 },
      { id: 'c6', title: 'Tinh thần xây dựng Đoàn', maxPoints: 10 }
    ];
    
    const activePeriod = await prisma.ratingPeriod.create({
      data: {
        title: 'Đánh giá xếp loại đoàn viên năm 2025',
        description: 'Đợt đánh giá năm 2025',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
        criteria: ratingCriteria,
        status: 'ACTIVE',
        targetAudience: 'ALL',
        createdBy: adminUser.id
      }
    });
    
    const completedPeriod = await prisma.ratingPeriod.create({
      data: {
        title: 'Đánh giá xếp loại đoàn viên HK1/2025',
        description: 'Đợt đánh giá HK1',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
        criteria: ratingCriteria,
        status: 'COMPLETED',
        targetAudience: 'ALL',
        createdBy: adminUser.id
      }
    });
    
    // Tạo self-ratings
    for (let i = 0; i < 10; i++) {
      const responses = ratingCriteria.map(c => ({ criteriaId: c.id, score: Math.floor(c.maxPoints * (0.6 + Math.random() * 0.4)) }));
      const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
      let rating = 'AVERAGE';
      if (totalScore >= 90) rating = 'EXCELLENT';
      else if (totalScore >= 75) rating = 'GOOD';
      
      await prisma.selfRating.create({
        data: {
          periodId: completedPeriod.id,
          userId: members[i].id,
          criteriaResponses: responses,
          suggestedRating: rating,
          status: 'APPROVED',
          finalRating: rating,
          pointsAwarded: rating === 'EXCELLENT' ? 50 : rating === 'GOOD' ? 30 : 15,
          submittedAt: new Date('2025-06-15'),
          reviewedAt: new Date('2025-06-25'),
          reviewedBy: adminUser.id
        }
      });
    }
    
    // 8. Tạo Points History
    console.log('📊 Creating points history...');
    const reasons = ['Tham gia sinh hoạt', 'Hoàn thành bài kiểm tra', 'Hoạt động tình nguyện', 'Đóng đoàn phí', 'Góp ý xây dựng'];
    
    for (const user of allUsers) {
      for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
        await prisma.pointsHistory.create({
          data: {
            userId: user.id,
            points: [5, 10, 15, 20, 25][Math.floor(Math.random() * 5)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            type: 'EARN',
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
    
    // 9. Tạo Posts
    console.log('📰 Creating posts...');
    const postData = [
      { title: 'Thông báo lịch sinh hoạt tháng 12/2025', postType: 'ANNOUNCEMENT', status: 'APPROVED' },
      { title: 'Chi đoàn Công nghệ đạt giải Nhất Sáng tạo trẻ', postType: 'NEWS', status: 'APPROVED' },
      { title: 'Đề xuất tổ chức giải bóng đá Xuân 2026', postType: 'SUGGESTION', status: 'PENDING' },
      { title: 'Kết quả Đại hội Chi đoàn 2025-2027', postType: 'NEWS', status: 'APPROVED' },
    ];
    
    for (let i = 0; i < postData.length; i++) {
      await prisma.post.create({
        data: {
          ...postData[i],
          content: `Nội dung chi tiết về ${postData[i].title}`,
          authorId: i < 2 ? adminUser.id : members[i].id,
          unitId: i < 2 ? null : units[i % 5].id,
          publishedAt: postData[i].status === 'APPROVED' ? new Date() : null
        }
      });
    }
    
    await prisma.$disconnect();
    
    console.log('🎉 Reset and seed completed!');
    
    res.json({
      success: true,
      message: 'Database đã được reset và seed thành công!',
      data: {
        units: units.length,
        users: allUsers.length,
        activities: activities.length,
        documents: docData.length,
        exams: examData.length,
        suggestions: suggestionData.length,
        ratingPeriods: 2
      },
      login: {
        admin: 'admin@youth.com / 123456',
        leader: 'leader.cntt@youth.com / 123456',
        member: 'member1@youth.com / 123456'
      }
    });
    
  } catch (error) {
    console.error('Reset and seed error:', error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

app.get('/api/admin/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalUsers: 10,
        activeUsers: 8,
        totalPosts: 0,
        pendingPosts: 0,
        totalDocuments: 0,
        publishedDocuments: 0,
        totalExams: 0,
        publishedExams: 0,
        pendingRatings: 0,
        newSuggestions: 0,
        totalActivities: 0,
        upcomingActivities: 0
      },
      recentActivities: [
        {
          id: '1',
          title: 'Hoạt động mẫu',
          type: 'MEETING',
          createdAt: new Date().toISOString(),
          author: { fullName: 'Admin' }
        }
      ],
      recentPosts: [],
      recentUsers: [],
      systemInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Youth Handbook Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database: SQLite (${process.env.DATABASE_URL || 'file:./dev.db'})`);
  
  // Auto-seed admin user on startup (for Render free tier SQLite reset issue)
  try {
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          email: 'admin@youth.com',
          username: 'admin',
          passwordHash,
          fullName: 'Administrator',
          role: 'ADMIN',
          phone: '0123456789'
        }
      });
      console.log('✅ Auto-seeded admin user: admin@youth.com / 123456');
    } else {
      console.log('✅ Admin user exists');
    }
    await prisma.$disconnect();
  } catch (error) {
    console.log('⚠️ Auto-seed skipped:', error.message);
  }
});

module.exports = app;
