const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSurveys() {
  console.log('🌱 Seeding surveys...');

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    console.error('❌ No admin user found!');
    return;
  }

  const surveys = [
    {
      title: 'Khảo sát mức độ hài lòng về hoạt động Đoàn năm 2025',
      description: 'Khảo sát đánh giá mức độ hài lòng của đoàn viên về các hoạt động Đoàn trong năm 2025',
      status: 'ACTIVE',
      questions: JSON.stringify([
        {
          id: '1',
          text: 'Bạn đánh giá như thế nào về chất lượng các hoạt động Đoàn năm 2025?',
          type: 'RATING',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: '2',
          text: 'Hoạt động nào bạn thấy ấn tượng nhất?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Tình nguyện', 'Văn nghệ', 'Thể thao', 'Học tập', 'Khác']
        },
        {
          id: '3',
          text: 'Bạn có đề xuất gì để cải thiện hoạt động Đoàn?',
          type: 'TEXT',
          required: false
        }
      ]),
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-02-28'),
      createdById: admin.id
    },
    {
      title: 'Khảo sát nhu cầu học tập và phát triển kỹ năng',
      description: 'Tìm hiểu nhu cầu học tập và mong muốn phát triển kỹ năng của đoàn viên',
      status: 'ACTIVE',
      questions: JSON.stringify([
        {
          id: '1',
          text: 'Bạn quan tâm đến lĩnh vực nào nhất?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Công nghệ thông tin', 'Ngoại ngữ', 'Kỹ năng mềm', 'Nghệ thuật', 'Khởi nghiệp']
        },
        {
          id: '2',
          text: 'Hình thức học tập nào bạn thích nhất?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Học trực tiếp', 'Học online', 'Tự học qua video', 'Workshop thực hành']
        },
        {
          id: '3',
          text: 'Thời gian học phù hợp với bạn?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Buổi sáng', 'Buổi chiều', 'Buổi tối', 'Cuối tuần']
        }
      ]),
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      createdById: admin.id
    },
    {
      title: 'Đánh giá công tác tổ chức sự kiện',
      description: 'Khảo sát ý kiến đoàn viên về công tác tổ chức các sự kiện đã qua',
      status: 'CLOSED',
      questions: JSON.stringify([
        {
          id: '1',
          text: 'Bạn đánh giá công tác chuẩn bị như thế nào?',
          type: 'RATING',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: '2',
          text: 'Công tác điều phối có tốt không?',
          type: 'RATING',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: '3',
          text: 'Góp ý để tổ chức tốt hơn',
          type: 'TEXT',
          required: false
        }
      ]),
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-31'),
      createdById: admin.id
    },
    {
      title: 'Khảo sát về môi trường làm việc và sinh hoạt',
      description: 'Đánh giá môi trường làm việc, sinh hoạt tại cơ sở Đoàn',
      status: 'ACTIVE',
      questions: JSON.stringify([
        {
          id: '1',
          text: 'Bạn có hài lòng với cơ sở vật chất hiện tại không?',
          type: 'RATING',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: '2',
          text: 'Điều gì cần cải thiện nhất?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Phòng họp', 'Trang thiết bị', 'Không gian sinh hoạt', 'WiFi/Internet', 'Khác']
        },
        {
          id: '3',
          text: 'Ý kiến đóng góp thêm',
          type: 'TEXT',
          required: false
        }
      ]),
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-04-15'),
      createdById: admin.id
    },
    {
      title: 'Khảo sát xu hướng tham gia hoạt động tình nguyện',
      description: 'Tìm hiểu xu hướng và mong muốn tham gia hoạt động tình nguyện của đoàn viên',
      status: 'DRAFT',
      questions: JSON.stringify([
        {
          id: '1',
          text: 'Bạn đã tham gia hoạt động tình nguyện bao nhiêu lần trong năm qua?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Chưa lần nào', '1-2 lần', '3-5 lần', 'Trên 5 lần']
        },
        {
          id: '2',
          text: 'Loại hình tình nguyện bạn quan tâm?',
          type: 'CHECKBOX',
          required: true,
          options: ['Hiến máu', 'Môi trường', 'Giáo dục', 'Y tế', 'Hỗ trợ người yếu thế']
        },
        {
          id: '3',
          text: 'Thời gian bạn có thể tham gia tình nguyện?',
          type: 'MULTIPLE_CHOICE',
          required: true,
          options: ['Ngày thường', 'Cuối tuần', 'Cả hai', 'Không chắc chắn']
        }
      ]),
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-05-31'),
      createdById: admin.id
    }
  ];

  for (const survey of surveys) {
    await prisma.survey.create({
      data: {
        title: survey.title,
        description: survey.description,
        status: survey.status,
        questions: survey.questions,
        startDate: survey.startDate,
        endDate: survey.endDate,
        creator: {
          connect: { id: survey.createdById }
        }
      }
    });
    console.log(`✅ Created survey: ${survey.title}`);
  }

  console.log('\n🎉 Seeding completed!');
  
  const total = await prisma.survey.count();
  console.log(`Total surveys in database: ${total}`);
}

seedSurveys()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
