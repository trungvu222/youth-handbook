const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleExams = [
  {
    title: 'Kiểm tra kiến thức lý luận chính trị cơ bản',
    description: 'Bài kiểm tra về các kiến thức lý luận chính trị cơ bản dành cho đoàn viên, thanh niên.',
    instructions: 'Thời gian làm bài: 30 phút. Trả lời 15 câu hỏi trắc nghiệm. Điểm đạt: 70%.',
    duration: 30,
    totalQuestions: 15,
    passingScore: 70,
    maxAttempts: 3,
    pointsAwarded: 15,
    showResults: true,
    showAnswers: true,
    shuffleQuestions: true,
    shuffleAnswers: false,
    status: 'PUBLISHED',
    creatorId: 'cmfi9sjf70002ttx8b8icy3t2',
    questions: [
      {
        questionText: 'Đảng Cộng sản Việt Nam được thành lập vào năm nào?',
        questionType: 'SINGLE_CHOICE',
        options: ['1925', '1930', '1945', '1954'],
        correctAnswers: [1],
        explanation: 'Đảng Cộng sản Việt Nam được thành lập ngày 3/2/1930 tại Hồng Kông do Chủ tịch Hồ Chí Minh sáng lập.',
        points: 1,
        difficulty: 'EASY'
      },
      {
        questionText: 'Chủ tịch Hồ Chí Minh sinh năm nào?',
        questionType: 'SINGLE_CHOICE',
        options: ['1889', '1890', '1891', '1892'],
        correctAnswers: [1],
        explanation: 'Chủ tịch Hồ Chí Minh sinh ngày 19/5/1890 (theo dương lịch) tại làng Sen, xã Kim Liên, huyện Nam Đàn, tỉnh Nghệ An.',
        points: 1,
        difficulty: 'EASY'
      },
      {
        questionText: 'Cách mạng tháng Tám năm 1945 thành công, nước Việt Nam Dân chủ Cộng hòa ra đời vào ngày nào?',
        questionType: 'SINGLE_CHOICE',
        options: ['30/8/1945', '2/9/1945', '19/8/1945', '25/8/1945'],
        correctAnswers: [1],
        explanation: 'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa.',
        points: 1,
        difficulty: 'MEDIUM'
      },
      {
        questionText: 'Đoàn Thanh niên Cộng sản Hồ Chí Minh được thành lập vào năm nao?',
        questionType: 'SINGLE_CHOICE',
        options: ['1925', '1931', '1956', '1961'],
        correctAnswers: [1],
        explanation: 'Đoàn Thanh niên Cộng sản Hồ Chí Minh được thành lập ngày 26/3/1931.',
        points: 1,
        difficulty: 'MEDIUM'
      },
      {
        questionText: 'Nguyên tắc tổ chức và hoạt động của Đảng là gì?',
        questionType: 'SINGLE_CHOICE',
        options: ['Dân chủ tập trung', 'Tập thể lãnh đạo', 'Cá nhân phụ trách', 'Tất cả các phương án trên'],
        correctAnswers: [3],
        explanation: 'Nguyên tắc tổ chức và hoạt động của Đảng bao gồm: dân chủ tập trung, tập thể lãnh đạo, cá nhân phụ trách.',
        points: 1,
        difficulty: 'MEDIUM'
      }
    ]
  },

  {
    title: 'Kiến thức về kỹ năng lãnh đạo cho thanh niên',
    description: 'Bài test đánh giá kiến thức và kỹ năng lãnh đạo dành cho cán bộ Đoàn các cấp.',
    instructions: 'Thời gian: 45 phút. 20 câu hỏi. Cần đạt tối thiểu 75% để pass.',
    duration: 45,
    totalQuestions: 20,
    passingScore: 75,
    maxAttempts: 2,
    pointsAwarded: 20,
    showResults: true,
    showAnswers: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
    status: 'PUBLISHED',
    creatorId: 'cmfi9sjf70002ttx8b8icy3t2',
    questions: [
      {
        questionText: 'Đặc điểm quan trọng nhất của một nhà lãnh đạo hiệu quả là gì?',
        questionType: 'SINGLE_CHOICE',
        options: ['Khả năng ra quyết định nhanh', 'Khả năng truyền cảm hứng cho người khác', 'Kiến thức chuyên môn sâu rộng', 'Khả năng kiểm soát mọi việc'],
        correctAnswers: [1],
        explanation: 'Khả năng truyền cảm hứng và tạo động lực cho người khác là đặc điểm quan trọng nhất của nhà lãnh đạo hiệu quả.',
        points: 1,
        difficulty: 'MEDIUM'
      },
      {
        questionText: 'Khi gặp xung đột trong nhóm, cách xử lý tốt nhất là?',
        questionType: 'SINGLE_CHOICE',
        options: ['Tránh né, để thời gian giải quyết', 'Đặt ra luật cứng rắn để ngăn chặn', 'Lắng nghe và tìm cách hòa giải', 'Loại bỏ người gây xung đột'],
        correctAnswers: [2],
        explanation: 'Lắng nghe tất cả các bên và tìm cách hòa giải là phương pháp hiệu quả nhất để giải quyết xung đột.',
        points: 1,
        difficulty: 'HARD'
      },
      {
        questionText: 'Theo bạn, điều gì quan trọng nhất khi giao việc cho đồng đội?',
        questionType: 'SINGLE_CHOICE',
        options: ['Giao việc chi tiết, cụ thể', 'Đặt mục tiêu rõ ràng và trao quyền', 'Giám sát chặt chẽ quá trình thực hiện', 'Đưa ra nhiều hướng dẫn'],
        correctAnswers: [1],
        explanation: 'Đặt mục tiêu rõ ràng và trao quyền cho đồng đội sẽ tạo động lực và phát huy tối đa năng lực của họ.',
        points: 1,
        difficulty: 'MEDIUM'
      }
    ]
  },

  {
    title: 'Kiểm tra kiến thức pháp luật cơ bản',
    description: 'Đánh giá hiểu biết về các quy định pháp luật có liên quan đến hoạt động thanh niên.',
    instructions: 'Thời gian: 25 phút. 12 câu hỏi. Điểm đạt: 60%.',
    duration: 25,
    totalQuestions: 12,
    passingScore: 60,
    maxAttempts: 5,
    pointsAwarded: 10,
    showResults: true,
    showAnswers: false, // Không hiển thị đáp án để tăng tính bảo mật
    shuffleQuestions: false,
    shuffleAnswers: true,
    status: 'PUBLISHED',
    creatorId: 'cmfi9sjf70002ttx8b8icy3t2',
    questions: [
      {
        questionText: 'Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam hiện hành được thông qua năm nào?',
        questionType: 'SINGLE_CHOICE',
        options: ['1992', '2013', '2019', '2021'],
        correctAnswers: [1],
        explanation: 'Hiến pháp hiện hành được Quốc hội thông qua ngày 28/11/2013 và có hiệu lực từ 1/1/2014.',
        points: 1,
        difficulty: 'EASY'
      },
      {
        questionText: 'Tuổi thành niên theo quy định của pháp luật Việt Nam là?',
        questionType: 'SINGLE_CHOICE',
        options: ['16 tuổi', '18 tuổi', '20 tuổi', '21 tuổi'],
        correctAnswers: [1],
        explanation: 'Theo Bộ luật Dân sự 2015, tuổi thành niên là đủ 18 tuổi trở lên.',
        points: 1,
        difficulty: 'EASY'
      },
      {
        questionText: 'Luật Thanh niên số 53/2020/QH14 có hiệu lực từ ngày nào?',
        questionType: 'SINGLE_CHOICE',
        options: ['1/1/2021', '1/7/2021', '1/1/2022', '1/7/2022'],
        correctAnswers: [0],
        explanation: 'Luật Thanh niên số 53/2020/QH14 có hiệu lực thi hành từ ngày 1/1/2021.',
        points: 1,
        difficulty: 'MEDIUM'
      }
    ]
  }
];

async function seedExams() {
  try {
    console.log('🧠 Bắt đầu seed exams...');

    // Check if exams already exist
    const existingCount = await prisma.exam.count();
    if (existingCount > 0) {
      console.log(`📝 Đã có ${existingCount} exams trong database`);
      console.log('⚠️ Xóa dữ liệu cũ và tạo mới...');
      await prisma.exam.deleteMany({});
    }

    // Create exams
    let createdCount = 0;
    for (const examData of sampleExams) {
      try {
        const { questions, ...examInfo } = examData;
        
        // Create exam first
        const exam = await prisma.exam.create({
          data: {
            ...examInfo,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create questions for this exam
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          
          // Transform question data to match schema
          const answerOptions = questionData.options.map((option, index) => ({
            text: option,
            isCorrect: questionData.correctAnswers.includes(index)
          }));

          await prisma.examQuestion.create({
            data: {
              examId: exam.id,
              questionText: questionData.questionText,
              questionType: questionData.questionType,
              answers: answerOptions,
              explanation: questionData.explanation,
              points: questionData.points,
              orderIndex: i + 1,
              createdAt: new Date()
            }
          });
        }

        createdCount++;
        console.log(`✅ Tạo thành công: "${examData.title}" với ${questions.length} câu hỏi`);
      } catch (error) {
        console.log(`❌ Lỗi tạo exam "${examData.title}":`, error.message);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${createdCount}/${sampleExams.length} exams`);
    console.log('\n📋 Danh sách exams đã tạo:');
    
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    exams.forEach((exam, index) => {
      console.log(`${index + 1}. ${exam.title}`);
      console.log(`   📊 ${exam._count.questions} câu hỏi, ${exam.duration} phút, ${exam.passingScore}% để đạt`);
      console.log(`   🎯 ${exam.pointsAwarded} điểm thưởng, tối đa ${exam.maxAttempts} lần thi`);
      console.log(`   📈 ${exam._count.attempts} lượt thi đã thực hiện\n`);
    });

    console.log('💡 Bạn có thể test Exam Management ngay bây giờ!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed exams:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedExams();
}

module.exports = { seedExams };
