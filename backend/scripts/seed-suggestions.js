const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleSuggestions = [
  {
    title: 'Đề xuất cải tiến quy trình đăng ký hoạt động tình nguyện',
    content: `Hiện tại quy trình đăng ký tham gia hoạt động tình nguyện còn phức tạp và mất thời gian. Em đề xuất một số cải tiến:

1. Tạo form đăng ký trực tuyến thay vì phải nộp giấy tờ
2. Tích hợp thông báo qua app để đoàn viên nhận thông tin nhanh hơn  
3. Cho phép đăng ký theo nhóm để thuận tiện cho các bạn cùng lớp
4. Tạo lịch hoạt động rõ ràng để đoàn viên dễ sắp xếp thời gian

Việc này sẽ giúp tăng số lượng đoàn viên tham gia và giảm tải công việc cho cán bộ Đoàn.`,
    category: 'IMPROVEMENT',
    priority: 'HIGH',
    status: 'SUBMITTED',
    isAnonymous: false,
    userId: 'cmfi9sjhq0004ttx8ti67ykid', // member1
    tags: 'quy trình, tình nguyện, công nghệ',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    viewCount: 12
  },

  {
    title: 'Phản ánh tình trạng thiết bị âm thanh hội trường B101',
    content: `Em xin phản ánh tình trạng thiết bị âm thanh tại hội trường B101 đang gặp một số vấn đề:

- Micro không dây thường bị nhiễu, tiếng không rõ
- Loa phát ra tiếng ồn khi âm lượng lớn  
- Hệ thống chiếu không kết nối được với laptop mới
- Không có remote điều khiển cho máy chiếu

Các vấn đề này ảnh hưởng đến chất lượng các buổi sinh hoạt và hội nghị. Em đề xuất liên hệ bộ phận kỹ thuật để kiểm tra và sửa chữa.`,
    category: 'COMPLAINT', 
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    isAnonymous: false,
    userId: 'cmfi9sji20005ttx843jgftg0', // member2
    tags: 'thiết bị, hội trường, âm thanh',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    viewCount: 8,
    responses: [
      {
        content: 'Cảm ơn bạn đã phản ánh. Chúng tôi đã liên hệ với bộ phận kỹ thuật và sẽ tiến hành kiểm tra, sửa chữa trong tuần tới.',
        isPublic: true,
        responderId: 'cmfi9sjf70002ttx8b8icy3t2', // admin
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ]
  },

  {
    title: 'Ý tưởng tổ chức "Ngày hội Kết nối đoàn viên"',
    content: `Em có ý tưởng tổ chức một sự kiện "Ngày hội Kết nối đoàn viên" để tăng cường gắn kết giữa các đoàn viên trong trường:

**Mục tiêu:** 
- Tạo cơ hội giao lưu giữa các khoa/lớp
- Giới thiệu các hoạt động của Đoàn trường
- Tuyên truyền tinh thần đoàn kết

**Hoạt động đề xuất:**
- Triển lãm ảnh về hoạt động Đoàn
- Các trò chơi team building
- Biểu diễn văn nghệ của các chi đoàn
- Thi nấu ăn "Món ngon quê hương"
- Tọa đàm chia sẻ kinh nghiệm

**Thời gian:** Cuối tháng 12/2024 (trước kỳ nghỉ Tết)
**Địa điểm:** Sân vườn trung tâm trường

Mong nhận được sự quan tâm và hỗ trợ từ Ban Chấp hành Đoàn trường.`,
    category: 'IDEA',
    priority: 'MEDIUM',
    status: 'UNDER_REVIEW', 
    isAnonymous: false,
    userId: 'cmfi9sjh40003ttx85a99axip', // leader1
    tags: 'sự kiện, giao lưu, kết nối',
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    viewCount: 25
  },

  {
    title: 'Thắc mắc về quy định đánh giá xếp loại đoàn viên',
    content: `Em có một số thắc mắc về quy định đánh giá xếp loại đoàn viên:

1. Tiêu chí "tham gia hoạt động tình nguyện" có yêu cầu số giờ cụ thể không?
2. Việc nghỉ sinh hoạt có lý do chính đáng (như bệnh, công tác) có ảnh hưởng đến kết quả xếp loại?
3. Điểm số học tập có được tính vào tiêu chí đánh giá không?
4. Quy trình khiếu nại kết quả xếp loại như thế nào?

Mong anh/chị có thể giải đáp giúp em để em hiểu rõ hơn về quy định này.`,
    category: 'QUESTION',
    priority: 'LOW', 
    status: 'RESOLVED',
    isAnonymous: false,
    userId: 'cmfi9sjii0006ttx8purf5106', // member3
    tags: 'quy định, xếp loại, đánh giá',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    viewCount: 18,
    responses: [
      {
        content: `Chào bạn! Mình xin trả lời các thắc mắc của bạn:

1. Về hoạt động tình nguyện: Tối thiểu 20 giờ/năm học, tương đương khoảng 2-3 hoạt động lớn
2. Nghỉ có lý do chính đáng: Không bị trừ điểm nếu có giấy tờ chứng minh hợp lệ
3. Điểm học tập: Có tính vào tiêu chí "Hoàn thành tốt nhiệm vụ học tập" với trọng số 30%
4. Khiếu nại: Gửi đơn lên Ban Chấp hành Chi đoàn trong vòng 15 ngày kể từ khi có kết quả

Bạn có thể tham khảo thêm trong Quy chế hoạt động Đoàn trên website nhé!`,
        isPublic: true,
        responderId: 'cmfi9sjf70002ttx8b8icy3t2', // admin  
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      }
    ]
  },

  {
    title: 'Góp ý cải thiện chất lượng bữa ăn tại căng tin',
    content: `Đây là góp ý ẩn danh về chất lượng bữa ăn tại căng tin trường:

**Những điểm tích cực:**
- Giá cả hợp lý với sinh viên
- Không gian ăn uống sạch sẽ, thoáng mát
- Nhân viên phục vụ thân thiện

**Những điểm cần cải thiện:**
- Thực đơn ít đa dạng, hay bị trùng lặp
- Một số món ăn chưa đảm bảo vệ sinh thực phẩm
- Thời gian chờ đợi lâu vào giờ cao điểm
- Cần bổ sung thêm món ăn chay cho những bạn ăn chay

**Đề xuất:**
- Thay đổi thực đơn theo tuần
- Tăng cường kiểm tra vệ sinh thực phẩm
- Mở thêm quầy phục vụ vào giờ cao điểm
- Có góc riêng cho đồ ăn chay

Mong nhà trường quan tâm để cải thiện chất lượng bữa ăn cho sinh viên.`,
    category: 'IMPROVEMENT',
    priority: 'MEDIUM',
    status: 'SUBMITTED',
    isAnonymous: true,
    userId: null, // Anonymous
    tags: 'căng tin, thực phẩm, chất lượng',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    viewCount: 35
  },

  {
    title: 'Đề xuất tổ chức khóa học kỹ năng mềm cho đoàn viên',
    content: `Em đề xuất tổ chức khóa học kỹ năng mềm dành cho đoàn viên với các chủ đề:

**Khối lượng:** 6 buổi, mỗi buổi 2 tiếng (cuối tuần)

**Nội dung chi tiết:**
1. **Kỹ năng thuyết trình và giao tiếp**: Cách nói chuyện tự tin, trình bày ý tưởng hiệu quả
2. **Kỹ năng làm việc nhóm**: Team work, giải quyết xung đột, phân chia công việc
3. **Kỹ năng quản lý thời gian**: Lập kế hoạch, ưu tiên công việc, cân bằng cuộc sống
4. **Tư duy sáng tạo**: Brainstorming, thiết kế thinking, đổi mới sáng tạo
5. **Kỹ năng lãnh đạo cơ bản**: Động viên nhóm, ra quyết định, quản lý dự án nhỏ
6. **Kỹ năng tìm việc**: Viết CV, phỏng vấn, xây dựng personal brand

**Lợi ích:**
- Nâng cao năng lực cá nhân của đoàn viên
- Tăng khả năng cạnh tranh trên thị trường lao động
- Phát triển đội ngũ cán bộ Đoàn có năng lực

**Hình thức:** Mời chuyên gia ngoài + cán bộ có kinh nghiệm trong trường
**Đối tượng:** Ưu tiên cán bộ Đoàn các cấp và đoàn viên tích cực`,
    category: 'IDEA', 
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    isAnonymous: false,
    userId: 'cmfi9sjji0007ttx8j55avwr9', // member4
    tags: 'kỹ năng mềm, đào tạo, phát triển',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    viewCount: 15
  }
];

async function seedSuggestions() {
  try {
    console.log('💡 Bắt đầu seed suggestions data...');

    // Check existing data
    const existingCount = await prisma.suggestion.count();
    if (existingCount > 0) {
      console.log(`💬 Đã có ${existingCount} suggestions trong database`);
      console.log('⚠️ Xóa dữ liệu cũ và tạo mới...');
      
      // Delete in correct order due to foreign key constraints
      await prisma.suggestionResponse.deleteMany({});
      await prisma.suggestion.deleteMany({});
    }

    // Create suggestions
    console.log('\n📝 Tạo suggestions...');
    let createdCount = 0;
    
    for (const suggestionData of sampleSuggestions) {
      try {
        const { responses, ...suggestionInfo } = suggestionData;
        
        // Create suggestion
        const suggestion = await prisma.suggestion.create({
          data: {
            ...suggestionInfo,
            createdAt: new Date(suggestionInfo.submittedAt),
            updatedAt: new Date()
          }
        });

        // Create responses if exist
        if (responses && responses.length > 0) {
          for (const responseData of responses) {
            await prisma.suggestionResponse.create({
              data: {
                suggestionId: suggestion.id,
                content: responseData.content,
                isPublic: responseData.isPublic,
                responderId: responseData.responderId,
                createdAt: new Date(responseData.createdAt)
              }
            });
          }
        }
        
        createdCount++;
        console.log(`✅ Tạo thành công: "${suggestionData.title}"`);
        if (responses && responses.length > 0) {
          console.log(`   └─ ${responses.length} phản hồi`);
        }
      } catch (error) {
        console.log(`❌ Lỗi tạo suggestion "${suggestionData.title}":`, error.message);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${createdCount}/${sampleSuggestions.length} suggestions`);
    
    // Display summary
    const suggestions = await prisma.suggestion.findMany({
      include: {
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    console.log('\n📋 Danh sách suggestions đã tạo:');
    
    // Group by category
    const categories = ['IMPROVEMENT', 'COMPLAINT', 'IDEA', 'QUESTION', 'OTHER'];
    categories.forEach(category => {
      const categoryItems = suggestions.filter(s => s.category === category);
      if (categoryItems.length > 0) {
        const categoryName = {
          'IMPROVEMENT': 'Cải tiến',
          'COMPLAINT': 'Phản ánh', 
          'IDEA': 'Ý tưởng',
          'QUESTION': 'Thắc mắc',
          'OTHER': 'Khác'
        }[category];
        
        console.log(`\n${categoryName} (${categoryItems.length}):`);
        categoryItems.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion.title}`);
          console.log(`     📊 ${suggestion.status} | ${suggestion.priority} | ${suggestion._count.responses} phản hồi | ${suggestion.viewCount} lượt xem`);
          if (suggestion.isAnonymous) {
            console.log(`     👤 Ẩn danh`);
          }
        });
      }
    });

    // Statistics
    const stats = {
      total: suggestions.length,
      byStatus: {
        SUBMITTED: suggestions.filter(s => s.status === 'SUBMITTED').length,
        UNDER_REVIEW: suggestions.filter(s => s.status === 'UNDER_REVIEW').length, 
        IN_PROGRESS: suggestions.filter(s => s.status === 'IN_PROGRESS').length,
        RESOLVED: suggestions.filter(s => s.status === 'RESOLVED').length,
        REJECTED: suggestions.filter(s => s.status === 'REJECTED').length
      },
      byPriority: {
        URGENT: suggestions.filter(s => s.priority === 'URGENT').length,
        HIGH: suggestions.filter(s => s.priority === 'HIGH').length,
        MEDIUM: suggestions.filter(s => s.priority === 'MEDIUM').length,
        LOW: suggestions.filter(s => s.priority === 'LOW').length
      },
      anonymous: suggestions.filter(s => s.isAnonymous).length,
      totalResponses: suggestions.reduce((sum, s) => sum + s._count.responses, 0)
    };

    console.log('\n📊 Thống kê:');
    console.log(`📝 Tổng số: ${stats.total} kiến nghị`);
    console.log(`📈 Trạng thái: ${stats.byStatus.SUBMITTED} mới | ${stats.byStatus.UNDER_REVIEW} đang xem | ${stats.byStatus.IN_PROGRESS} đang xử lý | ${stats.byStatus.RESOLVED} đã xong`);
    console.log(`⚡ Ưu tiên: ${stats.byPriority.URGENT} khẩn cấp | ${stats.byPriority.HIGH} cao | ${stats.byPriority.MEDIUM} TB | ${stats.byPriority.LOW} thấp`);
    console.log(`👤 ${stats.anonymous} kiến nghị ẩn danh`);
    console.log(`💬 ${stats.totalResponses} phản hồi tổng cộng`);

    console.log('\n💡 Bạn có thể test Suggestion Management ngay bây giờ!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed suggestions data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly  
if (require.main === module) {
  seedSuggestions();
}

module.exports = { seedSuggestions };






