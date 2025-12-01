const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const posts = [
  {
    title: "Thông báo: Sinh hoạt Chi đoàn tháng 12/2024",
    content: "📢 Kính chào toàn thể các đoàn viên!\n\nChi đoàn thông báo lịch sinh hoạt định kỳ tháng 12/2024:\n\n🗓️ Thời gian: 14:00 - 16:00, Chủ nhật 15/12/2024\n📍 Địa điểm: Phòng họp A3, Tầng 2, Nhà văn hóa\n\n📋 Nội dung chính:\n- Tổng kết hoạt động tháng 11/2024\n- Kế hoạch cuối năm và đón Tết Nguyên đán\n- Đánh giá thành tích các đoàn viên\n- Bầu chọn gương mặt tiêu biểu\n\n💡 Lưu ý:\n- Tất cả đoàn viên bắt buộc có mặt đúng giờ\n- Mang theo sổ tay đoàn viên\n- Dress code: Áo sơ mi trắng, quần âu xanh đen\n\nMọi thắc mắc xin liên hệ Ban Chấp hành Chi đoàn.",
    postType: "ANNOUNCEMENT",
    status: "APPROVED"
  },
  {
    title: "Bài viết: Kỷ niệm 93 năm Ngày thành lập Đoàn TNCS Hồ Chí Minh",
    content: "🌟 **Tự hào truyền thống 93 năm Đoàn TNCS Hồ Chí Minh**\n\nNgày 26/3/1931 - 26/3/2024, Đoàn Thanh niên Cộng sản Hồ Chí Minh đã trải qua 93 năm hình thành và phát triển với những dấu mốc lịch sử hào hùng.\n\n🏆 **Những thành tựu nổi bật:**\n- Đưa hàng triệu thanh niên tham gia cách mạng\n- Xây dựng đất nước trong thời kỳ đổi mới\n- Phong trào tình nguyện lan tỏa khắp mọi miền\n\n👥 **Thế hệ trẻ hôm nay:**\nChúng ta - những đoàn viên thế hệ mới, cần tiếp tục phát huy tinh thần yêu nước, ý chí vươn lên và đoàn kết để đóng góp xây dựng đất nước ngày càng phồn vinh.\n\n💪 **Hãy cùng nhau:**\n- Học tập nâng cao kiến thức\n- Tham gia tích cực hoạt động Đoàn\n- Lan tỏa tinh thần tình nguyện\n- Góp phần xây dựng xã hội văn minh\n\n#DoànTNCSHCM #TruyềnThống #ThếHệTrẻ #YêuNước",
    postType: "NEWS",
    status: "APPROVED"
  },
  {
    title: "Hoạt động tình nguyện: Chăm sóc cây xanh tại Công viên Thống Nhất",
    content: "🌱 **Hoạt động ý nghĩa vì môi trường xanh**\n\nSáng Chủ nhật vừa qua, Chi đoàn đã tổ chức thành công hoạt động tình nguyện chăm sóc cây xanh tại Công viên Thống Nhất với sự tham gia nhiệt tình của 25 đoàn viên.\n\n📸 **Những khoảnh khắc đáng nhớ:**\n- Tưới nước, cắt tỉa cành lá cho các cây cảnh\n- Dọn dẹp rác thải, làm sạch lối đi\n- Trồng thêm 20 cây hoa theo yêu cầu của BQL công viên\n\n🎯 **Kết quả đạt được:**\n- Khu vực được dọn dẹp: 500m²\n- Số cây được chăm sóc: 150 cây\n- Rác thải thu gom: 15 bao lớn\n\n💝 **Cảm ơn các đoàn viên tham gia:**\nNguyễn Văn A, Trần Thị B, Lê Minh C và 22 đoàn viên khác đã có mặt từ sớm, làm việc hết mình vì môi trường xanh - sạch - đẹp.\n\n🌍 **Thông điệp:** \nHãy cùng nhau bảo vệ môi trường, mỗi hành động nhỏ đều góp phần tạo nên thế giới xanh!",
    postType: "NEWS",
    status: "APPROVED"
  },
  {
    title: "Khen thưởng: Đoàn viên xuất sắc tháng 11/2024",
    content: "🏆 **Chúc mừng các đoàn viên xuất sắc tháng 11/2024**\n\nBan Chấp hành Chi đoàn xin chúc mừng và ghi nhận những đóng góp tích cực của các đoàn viên trong tháng 11 vừa qua:\n\n🥇 **Danh hiệu \"Đoàn viên tiêu biểu\":**\n1. **Nguyễn Thị Mai** - Chi đoàn Công nghệ\n   - Tham gia đầy đủ 100% hoạt động\n   - Đạt 145 điểm rèn luyện\n   - Viết 3 bài tuyên truyền chất lượng cao\n\n2. **Trần Văn Nam** - Chi đoàn Kinh tế  \n   - Tổ chức thành công 2 hoạt động tình nguyện\n   - Hỗ trợ tích cực các đoàn viên khó khăn\n   - Đạt 138 điểm rèn luyện\n\n🥈 **Danh hiệu \"Đoàn viên tích cực\":**\n- Lê Thị Hoa, Phạm Minh Tuấn, Võ Thị Lan\n- Nguyễn Đình Long, Trần Thị Linh\n\n🎁 **Phần thưởng:**\n- Giấy khen và phần thưởng tiền mặt\n- Cộng 20 điểm rèn luyện\n- Ưu tiên xét khen thưởng cuối năm\n\n👏 Chúc mừng và cảm ơn tất cả các đoàn viên!",
    postType: "ANNOUNCEMENT",
    status: "APPROVED"
  },
  {
    title: "Hướng dẫn: Cách sử dụng ứng dụng Sổ tay Đoàn viên",
    content: "📱 **Hướng dẫn sử dụng ứng dụng Sổ tay Đoàn viên**\n\nĐể hỗ trợ các đoàn viên sử dụng hiệu quả ứng dụng, Chi đoàn hướng dẫn chi tiết các chức năng chính:\n\n🏠 **Tab Bảng tin:**\n- Xem thông báo mới nhất từ Chi đoàn\n- Đọc bài viết, tin tức về hoạt động Đoàn\n- Cập nhật thông tin quan trọng\n\n📅 **Tab Sổ tay (Sinh hoạt):**\n- Xem lịch sinh hoạt sắp tới\n- Đăng ký tham gia các hoạt động\n- Điểm danh bằng mã QR\n- Gửi góp ý, kiến nghị\n\n📚 **Tab Tài liệu:**\n- Tải xuống tài liệu học tập\n- Xem video, hình ảnh hoạt động\n- Lưu trữ tài liệu cá nhân\n\n🤖 **Tab Trợ lý ảo:**\n- Học tập kiến thức về Đoàn\n- Làm bài quiz kiểm tra\n- Hỏi đáp với chatbot\n\n👤 **Tab Cá nhân:**\n- Quản lý thông tin cá nhân\n- Xem điểm rèn luyện\n- Theo dõi xếp hạng\n- Cập nhật hồ sơ\n\n❓ **Hỗ trợ kỹ thuật:**\nLiên hệ Admin qua email: admin@youth.com",
    postType: "ANNOUNCEMENT",
    status: "APPROVED"
  },
  {
    title: "Sự kiện: Chương trình giao lưu văn hóa các Chi đoàn",
    content: "🎭 **Chương trình giao lưu văn hóa các Chi đoàn**\n\n🗓️ **Thông tin sự kiện:**\n- Thời gian: 16:00 - 19:00, Thứ 7, 22/12/2024\n- Địa điểm: Sân khấu ngoài trời, Công viên Văn hóa\n- Đối tượng: Toàn thể đoàn viên các Chi đoàn\n\n🎪 **Nội dung chương trình:**\n\n**16:00 - 16:30:** Khai mạc và giới thiệu\n- Phát biểu của Bí thư Đoàn cơ sở\n- Giới thiệu các Chi đoàn tham gia\n\n**16:30 - 17:30:** Phần thi tài năng\n- Tiết mục ca hát dân ca, dân nhạc\n- Múa truyền thống các vùng miền\n- Thơ ca về tuổi trẻ và quê hương\n\n**17:30 - 18:30:** Trò chơi dân gian\n- Kéo co giữa các Chi đoàn\n- Nhảy sào, ném còn\n- Đố vui về lịch sử Đoàn\n\n**18:30 - 19:00:** Trao giải và bế mạc\n- Trao giải các phần thi\n- Chụp ảnh lưu niệm\n\n🎁 **Giải thưởng:**\n- Nhất: 2.000.000đ + Cúp vàng\n- Nhì: 1.500.000đ + Cúp bạc  \n- Ba: 1.000.000đ + Cúp đồng\n- Khuyến khích: 500.000đ\n\n📞 **Đăng ký tham gia:**\nLiên hệ BCS Chi đoàn trước 20/12/2024",
    postType: "NEWS",
    status: "APPROVED"
  }
];

async function seedPosts() {
  try {
    console.log('🌱 Bắt đầu seed Posts...');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ Không tìm thấy Admin user.');
      return;
    }

    // Get first unit  
    const unit = await prisma.unit.findFirst();

    console.log(`📝 Tạo ${posts.length} bài viết mẫu...`);

    for (const postData of posts) {
      const post = await prisma.post.create({
        data: {
          ...postData,
          authorId: adminUser.id,
          unitId: unit?.id
        }
      });

      console.log(`✅ Tạo thành công: ${post.title}`);
    }

    console.log('🎉 Seed Posts hoàn thành!');
    console.log('📊 Dữ liệu đã tạo:');
    console.log(`   - ${posts.length} bài viết/thông báo`);
    console.log(`   - Các loại: Thông báo (ANNOUNCEMENT), Tin tức (NEWS)`);
    console.log(`   - Tất cả đã được duyệt và sẵn sàng hiển thị`);
    console.log('');
    console.log('🚀 Tab Bảng tin đã có dữ liệu!');

  } catch (error) {
    console.error('❌ Lỗi khi seed Posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPosts();