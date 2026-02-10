const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedExams() {
  try {
    console.log('🌱 Seeding exam data with realistic attempts...');

    // Find admin user
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('❌ Admin user not found. Please run seed-rating-q1-2026.js first.');
      return;
    }

    // Get all MEMBER users
    const members = await prisma.user.findMany({
      where: { 
        role: 'MEMBER',
        isActive: true 
      },
      include: {
        unit: true
      }
    });

    if (members.length === 0) {
      console.log('❌ No members found. Please run seed-rating-q1-2026.js first.');
      return;
    }

    console.log(`✅ Found ${members.length} members to create exam attempts`);

    // Delete existing exam data to start fresh
    console.log('🗑️  Cleaning existing exam data...');
    await prisma.examAttempt.deleteMany({});
    await prisma.examQuestion.deleteMany({});
    await prisma.exam.deleteMany({});

    // Create 3 realistic exams with different categories
    const examsData = [
      {
        title: 'Cuộc thi Tìm hiểu Ngày 26/3',
        description: 'Tìm hiểu lịch sử ngày thành lập Đoàn Thanh niên Cộng sản Hồ Chí Minh',
        category: 'Lịch sử - Truyền thống',
        instructions: 'Thời gian làm bài: 45 phút. Vui lòng đọc kỹ câu hỏi trước khi trả lời.',
        duration: 45,
        totalQuestions: 20,
        passingScore: 50,
        maxAttempts: 3,
        pointsAwarded: 10,
        status: 'PUBLISHED',
        shuffleQuestions: true,
        showAnswers: true,
        showResults: true,
        startTime: new Date('2025-03-20'),
        endTime: new Date('2026-03-30')
      },
      {
        title: 'Kiến thức về Điều lệ Đoàn',
        description: 'Kiểm tra kiến thức về Điều lệ Đoàn TNCS Hồ Chí Minh',
        category: 'Điều lệ & Tổ chức',
        instructions: 'Thời gian làm bài: 20 phút. Cần đạt 70% để hoàn thành.',
        duration: 20,
        totalQuestions: 15,
        passingScore: 70,
        maxAttempts: 2,
        pointsAwarded: 15,
        status: 'PUBLISHED',
        shuffleQuestions: false,
        showAnswers: true,
        showResults: true,
        startTime: new Date('2025-12-01'),
        endTime: new Date('2026-12-31')
      },
      {
        title: 'Tìm hiểu về Đoàn TNCS Hồ Chí Minh',
        description: 'Tìm hiểu về lịch sử, tổ chức và hoạt động của Đoàn TNCS Hồ Chí Minh',
        category: 'Lý luận chính trị',
        instructions: 'Thời gian làm bài: 30 phút. Đọc kỹ đề trước khi làm bài.',
        duration: 30,
        totalQuestions: 25,
        passingScore: 60,
        maxAttempts: 2,
        pointsAwarded: 12,
        status: 'PUBLISHED',
        shuffleQuestions: true,
        showAnswers: false,
        showResults: true,
        startTime: new Date('2025-11-01'),
        endTime: new Date('2026-12-31')
      }
    ];

    const createdExams = [];

    for (const examData of examsData) {
      console.log(`\n📝 Creating exam: ${examData.title}`);
      
      const exam = await prisma.exam.create({
        data: {
          ...examData,
          creatorId: admin.id,
          questions: {
            create: Array.from({ length: examData.totalQuestions }, (_, i) => ({
              questionText: `Câu hỏi ${i + 1} của ${examData.title}`,
              questionType: 'SINGLE_CHOICE',
              answers: [
                { text: 'Đáp án A', isCorrect: i % 4 === 0 },
                { text: 'Đáp án B', isCorrect: i % 4 === 1 },
                { text: 'Đáp án C', isCorrect: i % 4 === 2 },
                { text: 'Đáp án D', isCorrect: i % 4 === 3 }
              ],
              explanation: `Giải thích cho câu hỏi ${i + 1}`,
              points: i % 3 === 0 ? 3 : i % 3 === 1 ? 5 : 7,
              orderIndex: i
            }))
          }
        },
        include: {
          questions: true
        }
      });

      console.log(`✅ Created exam with ${exam.questions.length} questions`);
      createdExams.push(exam);

      // Create exam attempts for random members
      const participantsCount = Math.floor(members.length * (0.5 + Math.random() * 0.35)); // 50-85% members participate
      const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
      const participants = shuffledMembers.slice(0, participantsCount);

      console.log(`👥 Creating ${participants.length} exam attempts...`);

      for (const member of participants) {
        // Random score between 35-95
        const baseScore = 35 + Math.random() * 60;
        const score = Math.round(baseScore);
        const isPassed = score >= examData.passingScore;

        // Random time spent (60-95% of duration)
        const timeSpent = Math.floor(examData.duration * 60 * (0.6 + Math.random() * 0.35)); // in seconds

        // Random submission date within exam period
        const startDate = new Date(examData.startTime);
        const endDate = new Date();
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

        // Generate random answers
        const userAnswers = exam.questions.map((q, idx) => ({
          questionId: q.id,
          selectedAnswer: Math.floor(Math.random() * 4),
          isCorrect: Math.random() > 0.35 // 65% correct rate
        }));

        await prisma.examAttempt.create({
          data: {
            examId: exam.id,
            userId: member.id,
            attemptNumber: 1,
            status: 'SUBMITTED',
            score: score,
            isPassed: isPassed,
            timeSpent: timeSpent,
            startedAt: new Date(randomDate.getTime() - timeSpent * 1000),
            submittedAt: randomDate,
            answers: userAnswers
          }
        });
      }

      console.log(`✅ Created ${participants.length} attempts for "${exam.title}"`);
    }

    // Print summary
    console.log('\n📊 EXAM SEEDING SUMMARY:');
    console.log('========================');
    
    for (const exam of createdExams) {
      const attempts = await prisma.examAttempt.count({
        where: { examId: exam.id }
      });
      
      const passedCount = await prisma.examAttempt.count({
        where: { 
          examId: exam.id,
          isPassed: true 
        }
      });

      const avgScore = await prisma.examAttempt.aggregate({
        where: { examId: exam.id },
        _avg: { score: true }
      });

      console.log(`\n📝 ${exam.title}`);
      console.log(`   Danh mục: ${exam.category}`);
      console.log(`   Tổng lượt thi: ${attempts}`);
      console.log(`   Số người đạt: ${passedCount}/${attempts} (${Math.round(passedCount/attempts*100)}%)`);
      console.log(`   Điểm trung bình: ${Math.round(avgScore._avg.score || 0)}`);
    }

    console.log('\n✅ Exam seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding exams:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedExams();
}

module.exports = { seedExams };

