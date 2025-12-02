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
