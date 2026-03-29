require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const prisma = require('./lib/prisma');

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
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const bookRoutes = require('./routes/books');
// const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import SSE manager for real-time attendance
const { addClient, removeClient } = require('./utils/attendanceEvents');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Disable ETag so API routes always return 200 with fresh data (never 304)
app.set('etag', false);

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
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SSE endpoint for real-time attendance updates (before regular routes)
// Admin/Leader connects to receive instant check-in notifications
app.get('/api/activities/attendance-stream', (req, res) => {
  // Authenticate via query param token (EventSource can't set headers)
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    if (decoded.role !== 'ADMIN' && decoded.role !== 'LEADER') {
      return res.status(403).json({ error: 'Admin/Leader only' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Keep alive every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  // Register client
  addClient(res);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(res);
  });
});

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/books', bookRoutes);

// Inline admin routes
app.get('/api/admin/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route working',
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats endpoint - fetches real data from database
app.get('/api/dashboard/stats', async (req, res) => {
  // Disable caching to always get fresh data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    // Fetch all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        unit: true,
        selfRatings: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Fetch all units
    const units = await prisma.unit.findMany({
      include: {
        _count: {
          select: { members: { where: { isActive: true } } }
        }
      }
    });

    // Fetch recent activities
    const activities = await prisma.activity.findMany({
      orderBy: { startTime: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    // Calculate stats
    const totalMembers = users.length;
    const activeMembers = users.filter(u => u.isActive).length;
    const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);

    // Calculate members by rating from actual selfRating data
    let xuatSac = 0, kha = 0, trungBinh = 0, yeu = 0;
    
    users.forEach(user => {
      const latestRating = user.selfRatings[0];
      if (latestRating && latestRating.finalRating) {
        switch (latestRating.finalRating) {
          case 'EXCELLENT': xuatSac++; break;
          case 'GOOD': kha++; break;
          case 'AVERAGE': trungBinh++; break;
          case 'POOR': yeu++; break;
        }
      } else {
        // If no rating, classify by points as fallback
        const points = user.points || 0;
        if (points >= 100) xuatSac++;
        else if (points >= 70) kha++;
        else if (points >= 50) trungBinh++;
        else yeu++;
      }
    });

    // Calculate new members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newMembersThisMonth = users.filter(u => new Date(u.createdAt) >= startOfMonth).length;

    // Members by unit with unit ID
    const membersByUnit = units.map(unit => {
      const unitMembers = users.filter(u => u.unitId === unit.id);
      return {
        unitId: unit.id,
        unitName: unit.name,
        memberCount: unitMembers.length,
        activeCount: unitMembers.filter(u => u.isActive).length
      };
    }).filter(u => u.memberCount > 0);

    // Recent activities
    const recentActivities = activities.slice(0, 5).map(a => ({
      id: a.id,
      title: a.title,
      type: a.type || 'MEETING',
      date: a.startTime || a.createdAt,
      participants: a._count?.participants || 0
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalMembers,
          activeMembers,
          newMembersThisMonth,
          excellentMembers: xuatSac,
          totalActivities: activities.length,
          upcomingActivities: activities.filter(a => a.status === 'ACTIVE').length,
          completedActivities: activities.filter(a => a.status === 'COMPLETED').length,
          totalPoints
        },
        membersByRank: {
          xuatSac,
          kha,
          trungBinh,
          yeu
        },
        membersByUnit,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed admin endpoint (one-time use)
app.post('/api/admin/seed-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
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
    const bcrypt = require('bcryptjs');
    
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
    const bcrypt = require('bcryptjs');
    
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
        youthPosition: 'Ban chấp hành Đoàn Cơ sở',
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
      { title: 'Sinh hoạt Chi đoàn định kỳ tháng 4/2026', type: 'MEETING', location: 'Hội trường A', pointsReward: 15, status: 'ACTIVE' },
      { title: 'Chương trình Xuân tình nguyện 2026', type: 'VOLUNTEER', location: 'Phường 10, Quận Gò Vấp', pointsReward: 30, status: 'ACTIVE' },
      { title: 'Hội thảo Kỹ năng lãnh đạo', type: 'STUDY', location: 'Phòng họp B2', pointsReward: 25, status: 'ACTIVE' },
      { title: 'Ngày hội Hiến máu nhân đạo', type: 'VOLUNTEER', location: 'Sân trường', pointsReward: 40, status: 'ACTIVE' },
      { title: 'Cuộc thi Tìm hiểu về Đoàn', type: 'STUDY', location: 'Online', pointsReward: 20, status: 'ACTIVE' },
      { title: 'Giải bóng đá Đoàn viên 2026', type: 'SOCIAL', location: 'Sân vận động', pointsReward: 15, status: 'ACTIVE' },
      // Add some completed activities from the past
      { title: 'Sinh hoạt Chi đoàn tháng 3/2026', type: 'MEETING', location: 'Hội trường B', pointsReward: 15, status: 'COMPLETED' },
      { title: 'Hoạt động tình nguyện Xuân 2026', type: 'VOLUNTEER', location: 'Xã A, Huyện B', pointsReward: 30, status: 'COMPLETED' },
    ];
    
    const activities = [];
    for (let i = 0; i < activityData.length; i++) {
      const a = activityData[i];
      let startDate, endDate;
      
      if (a.status === 'COMPLETED') {
        // Create past activities (March 2026)
        startDate = new Date(2026, 2, 10 + (i - 6), 14, 0); // March 10-11, 2026
        endDate = new Date(2026, 2, 10 + (i - 6), 17, 0);
      } else {
        // Create future activities (April 2026)
        startDate = new Date(2026, 3, 5 + i, 14, 0); // April 5-10, 2026
        endDate = new Date(2026, 3, 5 + i, 17, 0);
      }
      
      const activity = await prisma.activity.create({
        data: {
          ...a,
          description: `Mô tả chi tiết về ${a.title}`,
          organizerId: i < 2 ? adminUser.id : leaders[i % 5].id,
          unitId: i < 2 ? null : units[i % 5].id,
          startTime: startDate,
          endTime: endDate,
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
    
    // 5. Tạo Exams với câu hỏi đầy đủ
    console.log('📝 Creating exams...');
    const examData = [
      { 
        title: 'Tìm hiểu về Đoàn TNCS Hồ Chí Minh', 
        duration: 30, 
        totalQuestions: 10, 
        passingScore: 60, 
        pointsAwarded: 20,
        questions: [
          { questionText: 'Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?', answers: [{ text: '26/3/1931', isCorrect: true }, { text: '19/5/1931', isCorrect: false }, { text: '3/2/1930', isCorrect: false }, { text: '2/9/1945', isCorrect: false }] },
          { questionText: 'Tuổi đoàn viên từ bao nhiêu đến bao nhiêu?', answers: [{ text: '16-30 tuổi', isCorrect: true }, { text: '15-28 tuổi', isCorrect: false }, { text: '18-35 tuổi', isCorrect: false }] },
          { questionText: 'Màu cờ Đoàn là màu gì?', answers: [{ text: 'Đỏ', isCorrect: true }, { text: 'Xanh', isCorrect: false }, { text: 'Vàng', isCorrect: false }] },
          { questionText: 'Biểu tượng trên cờ Đoàn là gì?', answers: [{ text: 'Ngôi sao vàng', isCorrect: true }, { text: 'Búa liềm', isCorrect: false }, { text: 'Hoa sen', isCorrect: false }] },
          { questionText: 'Đoàn TNCS Hồ Chí Minh là tổ chức của ai?', answers: [{ text: 'Thanh niên Việt Nam', isCorrect: true }, { text: 'Học sinh', isCorrect: false }, { text: 'Sinh viên', isCorrect: false }] },
          { questionText: 'Ngày truyền thống của Đoàn là ngày nào?', answers: [{ text: '26/3', isCorrect: true }, { text: '19/5', isCorrect: false }, { text: '2/9', isCorrect: false }] },
          { questionText: 'Đoàn viên phải có phẩm chất gì?', answers: [{ text: 'Trung thành với Tổ quốc', isCorrect: true }, { text: 'Giàu có', isCorrect: false }, { text: 'Nổi tiếng', isCorrect: false }] },
          { questionText: 'Nhiệm vụ chính của Đoàn viên là gì?', answers: [{ text: 'Học tập và rèn luyện', isCorrect: true }, { text: 'Kiếm tiền', isCorrect: false }, { text: 'Giải trí', isCorrect: false }] },
          { questionText: 'Đoàn TNCS HCM do ai lãnh đạo?', answers: [{ text: 'Đảng Cộng sản Việt Nam', isCorrect: true }, { text: 'Chính phủ', isCorrect: false }, { text: 'Quốc hội', isCorrect: false }] },
          { questionText: 'Đoàn viên cần có tinh thần gì?', answers: [{ text: 'Đoàn kết, tương trợ', isCorrect: true }, { text: 'Cạnh tranh', isCorrect: false }, { text: 'Ích kỷ', isCorrect: false }] },
        ]
      },
      { 
        title: 'Kiến thức về Điều lệ Đoàn', 
        duration: 20, 
        totalQuestions: 15, 
        passingScore: 70, 
        pointsAwarded: 25,
        questions: [
          { questionText: 'Điều lệ Đoàn quy định về điều gì?', answers: [{ text: 'Tổ chức và hoạt động của Đoàn', isCorrect: true }, { text: 'Luật pháp', isCorrect: false }, { text: 'Kinh tế', isCorrect: false }] },
          { questionText: 'Đoàn viên có quyền gì?', answers: [{ text: 'Tham gia sinh hoạt Đoàn', isCorrect: true }, { text: 'Không tham gia', isCorrect: false }, { text: 'Tự do tuyệt đối', isCorrect: false }] },
          { questionText: 'Đoàn viên có nghĩa vụ gì?', answers: [{ text: 'Chấp hành Điều lệ', isCorrect: true }, { text: 'Không cần làm gì', isCorrect: false }, { text: 'Chỉ hưởng quyền lợi', isCorrect: false }] },
          { questionText: 'Đoàn phí được sử dụng vào việc gì?', answers: [{ text: 'Hoạt động Đoàn', isCorrect: true }, { text: 'Cá nhân', isCorrect: false }, { text: 'Không rõ', isCorrect: false }] },
          { questionText: 'Ai có thể kết nạp vào Đoàn?', answers: [{ text: 'Thanh niên từ 16-30 tuổi', isCorrect: true }, { text: 'Mọi người', isCorrect: false }, { text: 'Chỉ học sinh', isCorrect: false }] },
          { questionText: 'Đoàn viên bị kỷ luật khi nào?', answers: [{ text: 'Vi phạm Điều lệ', isCorrect: true }, { text: 'Không bao giờ', isCorrect: false }, { text: 'Tùy ý', isCorrect: false }] },
          { questionText: 'Cấp ủy Đoàn gồm những ai?', answers: [{ text: 'Ban Chấp hành', isCorrect: true }, { text: 'Tất cả đoàn viên', isCorrect: false }, { text: 'Người ngoài', isCorrect: false }] },
          { questionText: 'Đại hội Đoàn họp bao lâu một lần?', answers: [{ text: '5 năm', isCorrect: true }, { text: '1 năm', isCorrect: false }, { text: '10 năm', isCorrect: false }] },
          { questionText: 'Đoàn viên được khen thưởng khi nào?', answers: [{ text: 'Có thành tích xuất sắc', isCorrect: true }, { text: 'Không cần điều kiện', isCorrect: false }, { text: 'Có tiền', isCorrect: false }] },
          { questionText: 'Chi đoàn là gì?', answers: [{ text: 'Tổ chức cơ sở của Đoàn', isCorrect: true }, { text: 'Nhóm bạn', isCorrect: false }, { text: 'Câu lạc bộ', isCorrect: false }] },
          { questionText: 'Bí thư Chi đoàn do ai bầu?', answers: [{ text: 'Đoàn viên trong Chi đoàn', isCorrect: true }, { text: 'Cấp trên chỉ định', isCorrect: false }, { text: 'Tự ứng cử', isCorrect: false }] },
          { questionText: 'Đoàn viên có thể ra Đoàn khi nào?', answers: [{ text: 'Hết tuổi hoặc xin ra', isCorrect: true }, { text: 'Bất cứ lúc nào', isCorrect: false }, { text: 'Không được ra', isCorrect: false }] },
          { questionText: 'Sinh hoạt Chi đoàn diễn ra như thế nào?', answers: [{ text: 'Định kỳ hàng tháng', isCorrect: true }, { text: 'Không cần', isCorrect: false }, { text: 'Tùy hứng', isCorrect: false }] },
          { questionText: 'Đoàn viên cần đóng đoàn phí không?', answers: [{ text: 'Có, theo quy định', isCorrect: true }, { text: 'Không', isCorrect: false }, { text: 'Tùy ý', isCorrect: false }] },
          { questionText: 'Mục đích của Điều lệ Đoàn là gì?', answers: [{ text: 'Định hướng hoạt động Đoàn', isCorrect: true }, { text: 'Trang trí', isCorrect: false }, { text: 'Không có mục đích', isCorrect: false }] },
        ]
      },
      { 
        title: 'Cuộc thi Tìm hiểu Ngày 26/3', 
        duration: 45, 
        totalQuestions: 20, 
        passingScore: 50, 
        pointsAwarded: 50,
        questions: [
          { questionText: 'Ngày 26/3/1931 có ý nghĩa gì?', answers: [{ text: 'Ngày thành lập Đoàn', isCorrect: true }, { text: 'Ngày Quốc khánh', isCorrect: false }, { text: 'Ngày Giải phóng', isCorrect: false }] },
          { questionText: 'Đoàn TNCS HCM tiền thân là gì?', answers: [{ text: 'Đoàn Thanh niên Cộng sản', isCorrect: true }, { text: 'Hội Liên hiệp Thanh niên', isCorrect: false }, { text: 'Đội Thiếu niên', isCorrect: false }] },
          { questionText: 'Ai là người sáng lập Đoàn?', answers: [{ text: 'Đảng Cộng sản Việt Nam', isCorrect: true }, { text: 'Chủ tịch Hồ Chí Minh', isCorrect: false }, { text: 'Thanh niên', isCorrect: false }] },
          { questionText: 'Đoàn được thành lập ở đâu?', answers: [{ text: 'Hà Nội', isCorrect: true }, { text: 'Sài Gòn', isCorrect: false }, { text: 'Huế', isCorrect: false }] },
          { questionText: 'Tên đầu tiên của Đoàn là gì?', answers: [{ text: 'Đoàn Thanh niên Cộng sản Hồ Chí Minh', isCorrect: true }, { text: 'Đoàn Thanh niên Việt Nam', isCorrect: false }, { text: 'Hội Thanh niên', isCorrect: false }] },
          { questionText: 'Đoàn đã trải qua bao nhiêu kỳ Đại hội?', answers: [{ text: 'Nhiều kỳ', isCorrect: true }, { text: '1 kỳ', isCorrect: false }, { text: 'Chưa có', isCorrect: false }] },
          { questionText: 'Đoàn viên đầu tiên là ai?', answers: [{ text: 'Các chiến sĩ cách mạng', isCorrect: true }, { text: 'Học sinh', isCorrect: false }, { text: 'Nông dân', isCorrect: false }] },
          { questionText: 'Đoàn có vai trò gì trong cách mạng?', answers: [{ text: 'Lực lượng xung kích', isCorrect: true }, { text: 'Không có vai trò', isCorrect: false }, { text: 'Chỉ học tập', isCorrect: false }] },
          { questionText: 'Đoàn tham gia kháng chiến như thế nào?', answers: [{ text: 'Tích cực, dũng cảm', isCorrect: true }, { text: 'Không tham gia', isCorrect: false }, { text: 'Thụ động', isCorrect: false }] },
          { questionText: 'Đoàn có đóng góp gì cho đất nước?', answers: [{ text: 'Rất lớn', isCorrect: true }, { text: 'Không có', isCorrect: false }, { text: 'Rất ít', isCorrect: false }] },
          { questionText: 'Ngày 26/3 được tổ chức như thế nào?', answers: [{ text: 'Nhiều hoạt động kỷ niệm', isCorrect: true }, { text: 'Không tổ chức', isCorrect: false }, { text: 'Chỉ nghỉ', isCorrect: false }] },
          { questionText: 'Ý nghĩa của ngày 26/3 là gì?', answers: [{ text: 'Nhắc nhở truyền thống Đoàn', isCorrect: true }, { text: 'Không có ý nghĩa', isCorrect: false }, { text: 'Chỉ là ngày lễ', isCorrect: false }] },
          { questionText: 'Đoàn viên cần làm gì vào ngày 26/3?', answers: [{ text: 'Tham gia hoạt động kỷ niệm', isCorrect: true }, { text: 'Nghỉ ngơi', isCorrect: false }, { text: 'Không cần làm gì', isCorrect: false }] },
          { questionText: 'Truyền thống Đoàn là gì?', answers: [{ text: 'Trung thành, đoàn kết', isCorrect: true }, { text: 'Ích kỷ', isCorrect: false }, { text: 'Thụ động', isCorrect: false }] },
          { questionText: 'Đoàn viên cần kế thừa điều gì?', answers: [{ text: 'Truyền thống cách mạng', isCorrect: true }, { text: 'Không cần kế thừa', isCorrect: false }, { text: 'Chỉ học tập', isCorrect: false }] },
          { questionText: 'Đoàn có mối quan hệ với Đảng như thế nào?', answers: [{ text: 'Đoàn do Đảng lãnh đạo', isCorrect: true }, { text: 'Độc lập', isCorrect: false }, { text: 'Không liên quan', isCorrect: false }] },
          { questionText: 'Đoàn có vai trò gì trong xây dựng đất nước?', answers: [{ text: 'Lực lượng nòng cốt', isCorrect: true }, { text: 'Không có', isCorrect: false }, { text: 'Rất nhỏ', isCorrect: false }] },
          { questionText: 'Đoàn viên cần có ý thức gì?', answers: [{ text: 'Trách nhiệm với Tổ quốc', isCorrect: true }, { text: 'Không cần', isCorrect: false }, { text: 'Chỉ lo bản thân', isCorrect: false }] },
          { questionText: 'Đoàn có hoạt động quốc tế không?', answers: [{ text: 'Có, hợp tác với thanh niên thế giới', isCorrect: true }, { text: 'Không', isCorrect: false }, { text: 'Chỉ trong nước', isCorrect: false }] },
          { questionText: 'Tương lai của Đoàn như thế nào?', answers: [{ text: 'Phát triển mạnh mẽ', isCorrect: true }, { text: 'Suy yếu', isCorrect: false }, { text: 'Không rõ', isCorrect: false }] },
        ]
      },
    ];
    
    for (const e of examData) {
      const exam = await prisma.exam.create({
        data: {
          title: e.title,
          description: `Mô tả về ${e.title}`,
          instructions: 'Thời gian làm bài có giới hạn. Chọn đáp án đúng nhất.',
          duration: e.duration,
          totalQuestions: e.totalQuestions,
          passingScore: e.passingScore,
          pointsAwarded: e.pointsAwarded,
          status: 'ACTIVE',
          showResults: true,
          maxAttempts: 3,
          startTime: new Date(2026, 3, 1), // April 1, 2026
          endTime: new Date(2026, 4, 31), // May 31, 2026
          creatorId: adminUser.id
        }
      });
      
      // Tạo câu hỏi cho exam
      for (let i = 0; i < e.questions.length; i++) {
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionText: e.questions[i].questionText,
            questionType: 'SINGLE_CHOICE',
            answers: e.questions[i].answers,
            points: 1,
            orderIndex: i + 1
          }
        });
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
//if (require.main === module) {  // REMOVED - always start server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Youth Handbook Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 Server address: ${JSON.stringify(server.address())}`);
    console.log(`⏰ Server time: ${new Date().toISOString()}`);
    
    // REMOVED AUTO-SEED - Causing process to exit
    // Auto-seed is unnecessary - admin can be created via API endpoint
    console.log('✅ Backend started successfully - ready to accept connections');
  });
  
  server.on('error', (err) => {
    console.error(`❌ Server error: ${err.message}`);
    console.error(`❌ Error code: ${err.code}`);
    process.exit(1);
  });
//}  // REMOVED - always start server

module.exports = app;

