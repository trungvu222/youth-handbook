const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Study Topics for Module 3.4 - Learning System
const studyTopics = [
  {
    title: "Nghị quyết Đại hội XIII của Đảng",
    description: "Tìm hiểu về Nghị quyết Đại hội đại biểu toàn quốc lần thứ XIII của Đảng Cộng sản Việt Nam và các định hướng phát triển đất nước.",
    category: "Nghị quyết",
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    materials: [
      {
        title: "Video: Tóm tắt Nghị quyết Đại hội XIII",
        type: "VIDEO",
        fileUrl: "https://example.com/video/nghi-quyet-dai-hoi-13.mp4",
        duration: 1800, // 30 minutes
        orderIndex: 1,
        isRequired: true
      },
      {
        title: "Tài liệu: Văn kiện Đại hội XIII đầy đủ",
        type: "PDF", 
        fileUrl: "https://example.com/pdf/van-kien-dai-hoi-13.pdf",
        fileSize: 5242880, // 5MB
        orderIndex: 2,
        isRequired: true
      },
      {
        title: "Bài viết: Phân tích định hướng phát triển",
        type: "ARTICLE",
        content: "Nghị quyết Đại hội XIII đã xác định rõ mục tiêu xây dựng đất nước phồn vinh, hạnh phúc...",
        orderIndex: 3,
        isRequired: false
      }
    ],
    quiz: {
      title: "Kiểm tra kiến thức Nghị quyết Đại hội XIII",
      instructions: "Hãy trả lời các câu hỏi sau để kiểm tra hiểu biết của bạn về Nghị quyết Đại hội XIII.",
      timeLimit: 45,
      maxAttempts: 3,
      passingScore: 70,
      showAnswers: true,
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "Đại hội XIII của Đảng được tổ chức vào năm nào?",
          options: ["2020", "2021", "2022", "2023"],
          correctAnswer: 1,
          points: 10
        },
        {
          id: 2, 
          type: "multiple_choice",
          question: "Mục tiêu chiến lược của Nghị quyết Đại hội XIII là gì?",
          options: [
            "Xây dựng đất nước phồn vinh, hạnh phúc",
            "Trở thành nước công nghiệp hiện đại",
            "Tăng trưởng kinh tế cao",
            "Cả A và B"
          ],
          correctAnswer: 3,
          points: 15
        },
        {
          id: 3,
          type: "true_false", 
          question: "Nghị quyết Đại hội XIII đặt mục tiêu Việt Nam trở thành nước phát triển vào năm 2045.",
          correctAnswer: true,
          points: 10
        },
        {
          id: 4,
          type: "multiple_choice",
          question: "Theo Nghị quyết, động lực phát triển chính của đất nước là gì?",
          options: ["Đổi mới sáng tạo", "Khoa học công nghệ", "Nguồn nhân lực", "Tất cả đáp án trên"],
          correctAnswer: 3,
          points: 15
        }
      ]
    }
  },

  {
    title: "Pháp luật về Thanh niên và Đoàn viên",
    description: "Tìm hiểu về các quy định pháp luật liên quan đến thanh niên, quyền và nghĩa vụ của đoàn viên trong xã hội.",
    category: "Pháp luật",
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    materials: [
      {
        title: "Video: Luật Thanh niên 2020 - Những điểm mới",
        type: "VIDEO",
        fileUrl: "https://example.com/video/luat-thanh-nien-2020.mp4",
        duration: 2100, // 35 minutes
        orderIndex: 1,
        isRequired: true
      },
      {
        title: "Tài liệu: Điều lệ Đoàn TNCS Hồ Chí Minh",
        type: "PDF",
        fileUrl: "https://example.com/pdf/dieu-le-doan.pdf", 
        fileSize: 3145728, // 3MB
        orderIndex: 2,
        isRequired: true
      },
      {
        title: "Bài thuyết trình: Quyền và nghĩa vụ đoàn viên",
        type: "PRESENTATION",
        fileUrl: "https://example.com/ppt/quyen-nghia-vu-doan-vien.pptx",
        fileSize: 7340032, // 7MB
        orderIndex: 3,
        isRequired: false
      }
    ],
    quiz: {
      title: "Kiểm tra kiến thức Pháp luật Thanh niên",
      instructions: "Kiểm tra hiểu biết của bạn về pháp luật liên quan đến thanh niên và đoàn viên.",
      timeLimit: 30,
      maxAttempts: 2,
      passingScore: 60,
      showAnswers: false,
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "Luật Thanh niên năm 2020 quy định độ tuổi thanh niên từ bao nhiêu đến bao nhiêu?",
          options: ["16-30 tuổi", "16-35 tuổi", "18-30 tuổi", "18-35 tuổi"],
          correctAnswer: 1,
          points: 20
        },
        {
          id: 2,
          type: "multiple_choice", 
          question: "Đoàn viên có nghĩa vụ nào sau đây?",
          options: [
            "Tham gia sinh hoạt Đoàn",
            "Đóng đoàn phí",
            "Thực hiện nhiệm vụ được giao",
            "Tất cả đáp án trên"
          ],
          correctAnswer: 3,
          points: 20
        },
        {
          id: 3,
          type: "true_false",
          question: "Đoàn viên có quyền được bảo vệ các quyền và lợi ích hợp pháp của mình.",
          correctAnswer: true,
          points: 15
        }
      ]
    }
  },

  {
    title: "Kỹ năng mềm cho Đoàn viên",
    description: "Phát triển các kỹ năng mềm cần thiết cho đoàn viên trong học tập, làm việc và sinh hoạt xã hội.",
    category: "Kỹ năng",
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2025-01-01'),
    materials: [
      {
        title: "Video: Kỹ năng giao tiếp hiệu quả",
        type: "VIDEO",
        fileUrl: "https://example.com/video/ky-nang-giao-tiep.mp4",
        duration: 2700, // 45 minutes
        orderIndex: 1,
        isRequired: true
      },
      {
        title: "Podcast: Làm việc nhóm và lãnh đạo",
        type: "AUDIO",
        fileUrl: "https://example.com/audio/lam-viec-nhom.mp3",
        duration: 1500, // 25 minutes
        orderIndex: 2,
        isRequired: true
      },
      {
        title: "Bài viết: Quản lý thời gian hiệu quả",
        type: "ARTICLE",
        content: "Thời gian là tài nguyên quý giá nhất của con người. Học cách quản lý thời gian hiệu quả...",
        orderIndex: 3,
        isRequired: false
      },
      {
        title: "Tài liệu: 50 kỹ năng mềm cần thiết",
        type: "PDF",
        fileUrl: "https://example.com/pdf/50-ky-nang-mem.pdf",
        fileSize: 4194304, // 4MB
        orderIndex: 4,
        isRequired: false
      }
    ],
    quiz: {
      title: "Đánh giá kỹ năng mềm",
      instructions: "Đánh giá mức độ hiểu biết của bạn về các kỹ năng mềm cơ bản.",
      timeLimit: 40,
      maxAttempts: 5,
      passingScore: 65,
      showAnswers: true,
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "Yếu tố nào quan trọng nhất trong giao tiếp?",
          options: ["Lắng nghe", "Nói", "Viết", "Đọc"],
          correctAnswer: 0,
          points: 15
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "Trong làm việc nhóm, vai trò của người lãnh đạo là gì?",
          options: [
            "Ra quyết định cuối cùng",
            "Điều phối và động viên",
            "Làm tất cả công việc", 
            "Kiểm soát mọi người"
          ],
          correctAnswer: 1,
          points: 20
        },
        {
          id: 3,
          type: "true_false",
          question: "Quản lý thời gian tốt giúp tăng hiệu suất làm việc.",
          correctAnswer: true,
          points: 10
        }
      ]
    }
  },

  {
    title: "Tiếng Anh giao tiếp cơ bản",
    description: "Học tiếng Anh giao tiếp cơ bản phục vụ cho việc học tập và công việc của đoàn viên.",
    category: "Tiếng Anh",
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-06-30'),
    materials: [
      {
        title: "Video: 100 câu giao tiếp tiếng Anh thông dụng",
        type: "VIDEO",
        fileUrl: "https://example.com/video/100-cau-tieng-anh.mp4",
        duration: 3600, // 60 minutes
        orderIndex: 1,
        isRequired: true
      },
      {
        title: "Audio: Luyện phát âm tiếng Anh",
        type: "AUDIO",
        fileUrl: "https://example.com/audio/luyen-phat-am.mp3",
        duration: 1800, // 30 minutes
        orderIndex: 2,
        isRequired: true
      },
      {
        title: "Tài liệu: Ngữ pháp tiếng Anh cơ bản",
        type: "PDF",
        fileUrl: "https://example.com/pdf/ngu-phap-tieng-anh.pdf",
        fileSize: 6291456, // 6MB
        orderIndex: 3,
        isRequired: false
      }
    ],
    quiz: {
      title: "Test tiếng Anh cơ bản",
      instructions: "Complete the following English test to check your basic English skills.",
      timeLimit: 60,
      maxAttempts: 3,
      passingScore: 50,
      showAnswers: true,
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          question: "What is your name?",
          options: ["My name is John", "I am fine", "Nice to meet you", "How are you?"],
          correctAnswer: 0,
          points: 10
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "Choose the correct form: I _____ to school every day.",
          options: ["go", "goes", "going", "went"],
          correctAnswer: 0,
          points: 15
        },
        {
          id: 3,
          type: "true_false",
          question: "The sentence 'She are beautiful' is correct.",
          correctAnswer: false,
          points: 10
        }
      ]
    }
  }
];

async function seedStudySystem() {
  try {
    console.log('🌱 Bắt đầu seed Study System (Module 3.4)...');

    console.log(`📚 Tạo ${studyTopics.length} chuyên đề học tập...`);

    for (const topicData of studyTopics) {
      console.log(`📖 Đang tạo chuyên đề: ${topicData.title}`);
      
      // Create study topic
      const topic = await prisma.studyTopic.create({
        data: {
          title: topicData.title,
          description: topicData.description,
          category: topicData.category,
          validFrom: topicData.validFrom,
          validTo: topicData.validTo
        }
      });

      // Create materials for this topic
      let quizMaterialId = null;
      for (const materialData of topicData.materials) {
        const material = await prisma.studyTopicMaterial.create({
          data: {
            topicId: topic.id,
            title: materialData.title,
            type: materialData.type,
            fileUrl: materialData.fileUrl,
            content: materialData.content,
            duration: materialData.duration,
            fileSize: materialData.fileSize,
            orderIndex: materialData.orderIndex,
            isRequired: materialData.isRequired
          }
        });

        // Use the last material for quiz (typically the main material)
        if (materialData.orderIndex === topicData.materials.length) {
          quizMaterialId = material.id;
        }

        console.log(`   📄 Tạo tài liệu: ${material.title}`);
      }

      // Create quiz if quiz data exists
      if (topicData.quiz && quizMaterialId) {
        const quiz = await prisma.studyQuiz.create({
          data: {
            materialId: quizMaterialId,
            title: topicData.quiz.title,
            instructions: topicData.quiz.instructions,
            timeLimit: topicData.quiz.timeLimit,
            maxAttempts: topicData.quiz.maxAttempts,
            passingScore: topicData.quiz.passingScore,
            showAnswers: topicData.quiz.showAnswers,
            questions: topicData.quiz.questions
          }
        });

        console.log(`   ❓ Tạo bài quiz: ${quiz.title}`);
      }

      console.log(`✅ Hoàn thành chuyên đề: ${topic.title}`);
    }

    // Create some sample progress for existing users
    const users = await prisma.user.findMany({ take: 3 });
    const topics = await prisma.studyTopic.findMany({ include: { materials: true } });

    console.log('👥 Tạo tiến độ học tập mẫu cho users...');
    
    for (const user of users) {
      for (let i = 0; i < Math.min(2, topics.length); i++) {
        const topic = topics[i];
        
        // Create study progress
        await prisma.userStudyProgress.create({
          data: {
            userId: user.id,
            topicId: topic.id,
            status: i === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            lastAccessedAt: new Date()
          }
        });

        // Create material progress for in-progress topic
        if (i === 0) {
          for (let j = 0; j < Math.min(2, topic.materials.length); j++) {
            const material = topic.materials[j];
            await prisma.userMaterialProgress.create({
              data: {
                userId: user.id,
                materialId: material.id,
                status: j === 0 ? 'COMPLETED' : 'IN_PROGRESS',
                viewedDuration: material.duration ? Math.floor(material.duration * 0.7) : 0,
                completedAt: j === 0 ? new Date() : null,
                lastAccessedAt: new Date()
              }
            });
          }
        }
      }

      console.log(`   📊 Tạo tiến độ cho user: ${user.fullName}`);
    }

    console.log('🎉 Seed Study System hoàn thành!');
    console.log('📊 Dữ liệu đã tạo:');
    console.log(`   - ${studyTopics.length} chuyên đề học tập đa dạng`);
    console.log(`   - ${studyTopics.reduce((sum, topic) => sum + topic.materials.length, 0)} tài liệu học tập (Video, PDF, Audio, Article)`);
    console.log(`   - ${studyTopics.length} bài kiểm tra trắc nghiệm`);
    console.log(`   - Tiến độ học tập mẫu cho ${users.length} users`);
    console.log('');
    console.log('🚀 Module 3.4 - Hệ thống Học tập đã sẵn sàng!');

  } catch (error) {
    console.error('❌ Lỗi khi seed Study System:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedStudySystem();

