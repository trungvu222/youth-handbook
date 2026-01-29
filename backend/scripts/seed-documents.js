const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleDocuments = [
  {
    title: 'Thông báo về việc tổ chức Đại hội Đoàn toàn quốc lần thứ XII',
    documentNumber: '01/TB-TW',
    documentType: 'NOTICE',
    issuer: 'Ban Chấp hành Trung ương Đoàn',
    description: 'Thông báo về việc tổ chức Đại hội đại biểu toàn quốc Đoàn Thanh niên Cộng sản Hồ Chí Minh lần thứ XII, nhiệm kỳ 2022-2027.',
    content: `
      <h2>THÔNG BÁO</h2>
      <p>Về việc tổ chức Đại hội đại biểu toàn quốc Đoàn Thanh niên Cộng sản Hồ Chí Minh lần thứ XII</p>
      
      <h3>1. Thời gian và địa điểm:</h3>
      <p>- Thời gian: Từ ngày 15-17/12/2022</p>
      <p>- Địa điểm: Trung tâm Hội nghị Quốc gia, Hà Nội</p>
      
      <h3>2. Nội dung chính:</h3>
      <p>- Báo cáo chính trị của Ban Chấp hành Trung ương Đoàn khóa XI</p>
      <p>- Thảo luận các vấn đề quan trọng của phong trào thanh niên</p>
      <p>- Bầu Ban Chấp hành Trung ương Đoàn khóa XII</p>
      
      <h3>3. Yêu cầu:</h3>
      <p>- Các tổ chức Đoàn chuẩn bị tốt công tác tuyên truyền</p>
      <p>- Tổ chức các hoạt động hưởng ứng tại địa phương</p>
    `,
    status: 'PUBLISHED',
    issuedDate: '2022-11-15T00:00:00.000Z',
    effectiveDate: '2022-11-20T00:00:00.000Z',
    viewCount: 245,
    downloadCount: 89,
    tags: 'đại hội, đoàn thanh niên, thông báo chính thức',
    isNotificationSent: true,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  },
  
  {
    title: 'Quyết định về việc triển khai chương trình "Thanh niên khởi nghiệp"',
    documentNumber: '02/QĐ-TW',
    documentType: 'DECISION',
    issuer: 'Ban Bí thư Trung ương Đoàn',
    description: 'Quyết định triển khai chương trình hỗ trợ thanh niên khởi nghiệp trên toàn quốc.',
    content: `
      <h2>QUYẾT ĐỊNH</h2>
      <p>Về việc triển khai chương trình "Thanh niên khởi nghiệp" giai đoạn 2023-2025</p>
      
      <h3>Điều 1. Mục tiêu chương trình:</h3>
      <p>- Hỗ trợ 10.000 thanh niên khởi nghiệp thành công</p>
      <p>- Tạo việc làm cho 50.000 lao động trẻ</p>
      <p>- Đào tạo kỹ năng khởi nghiệp cho 100.000 thanh niên</p>
      
      <h3>Điều 2. Đối tượng thụ hưởng:</h3>
      <p>- Thanh niên từ 18-35 tuổi</p>
      <p>- Có ý tưởng kinh doanh khả thi</p>
      <p>- Cam kết thực hiện đúng quy định</p>
      
      <h3>Điều 3. Hình thức hỗ trợ:</h3>
      <p>- Vốn vay ưu đãi không thế chấp</p>
      <p>- Đào tạo kỹ năng miễn phí</p>
      <p>- Tư vấn, cố vấn kinh doanh</p>
      
      <h3>Điều 4. Tổ chức thực hiện:</h3>
      <p>- Trung ương Đoàn chỉ đạo chung</p>
      <p>- Đoàn các cấp triển khai tại địa phương</p>
    `,
    status: 'PUBLISHED',
    issuedDate: '2023-01-10T00:00:00.000Z',
    effectiveDate: '2023-02-01T00:00:00.000Z',
    viewCount: 567,
    downloadCount: 234,
    tags: 'khởi nghiệp, thanh niên, hỗ trợ vốn, quyết định',
    isNotificationSent: true,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  },
  
  {
    title: 'Hướng dẫn tổ chức hoạt động tình nguyện mùa hè xanh 2023',
    documentNumber: '03/HD-TW',
    documentType: 'GUIDELINE',
    issuer: 'Ban Thường vụ Trung ương Đoàn',
    description: 'Hướng dẫn chi tiết về việc tổ chức các hoạt động tình nguyện trong chiến dịch Mùa hè xanh 2023.',
    content: `
      <h2>HƯỚNG DẪN</h2>
      <p>Tổ chức hoạt động tình nguyện Mùa hè xanh 2023</p>
      
      <h3>I. Mục đích, ý nghĩa:</h3>
      <p>- Phát huy tinh thần tình nguyện của thanh niên</p>
      <p>- Góp phần xây dựng nông thôn mới</p>
      <p>- Rèn luyện kỹ năng sống cho sinh viên</p>
      
      <h3>II. Thời gian thực hiện:</h3>
      <p>- Từ tháng 6 đến tháng 8/2023</p>
      <p>- Tập trung vào kỳ nghỉ hè của học sinh, sinh viên</p>
      
      <h3>III. Nội dung hoạt động:</h3>
      <p><strong>1. Hoạt động giáo dục:</strong></p>
      <p>- Dạy học miễn phí cho trẻ em vùng khó khăn</p>
      <p>- Tuyên truyền kiến thức khoa học kỹ thuật</p>
      
      <p><strong>2. Hoạt động y tế:</strong></p>
      <p>- Khám bệnh, phát thuốc miễn phí</p>
      <p>- Tuyên truyền kiến thức chăm sóc sức khỏe</p>
      
      <p><strong>3. Hoạt động xây dựng cơ sở hạ tầng:</strong></p>
      <p>- Xây dựng, sửa chữa trường học</p>
      <p>- Làm đường giao thông nông thôn</p>
      
      <h3>IV. Yêu cầu tổ chức:</h3>
      <p>- Lập kế hoạch cụ thể, chi tiết</p>
      <p>- Đảm bảo an toàn cho tình nguyện viên</p>
      <p>- Phối hợp chặt chẽ với chính quyền địa phương</p>
    `,
    status: 'PUBLISHED',
    issuedDate: '2023-05-15T00:00:00.000Z',
    effectiveDate: '2023-06-01T00:00:00.000Z',
    viewCount: 892,
    downloadCount: 445,
    tags: 'tình nguyện, mùa hè xanh, hướng dẫn, sinh viên',
    isNotificationSent: true,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  },
  
  {
    title: 'Thông tư về công tác tuyên truyền, giáo dục lý tưởng cách mạng cho thanh niên',
    documentNumber: '04/TT-TW',
    documentType: 'CIRCULAR',
    issuer: 'Ban Bí thư Trung ương Đoàn',
    description: 'Quy định về công tác tuyên truyền, giáo dục lý tưởng cách mạng, đạo đức, lối sống cho đoàn viên, thanh niên.',
    content: `
      <h2>THÔNG TƯ</h2>
      <p>Về công tác tuyên truyền, giáo dục lý tưởng cách mạng cho thanh niên</p>
      
      <h3>Chương I: QUY ĐỊNH CHUNG</h3>
      
      <h4>Điều 1. Phạm vi điều chỉnh</h4>
      <p>Thông tư này quy định về nội dung, phương pháp, hình thức tuyên truyền, giáo dục lý tưởng cách mạng cho đoàn viên, thanh niên.</p>
      
      <h4>Điều 2. Đối tượng áp dụng</h4>
      <p>- Các tổ chức Đoàn các cấp</p>
      <p>- Cán bộ Đoàn, đoàn viên, thanh niên</p>
      <p>- Các tổ chức, cá nhân có liên quan</p>
      
      <h3>Chương II: NỘI DUNG GIÁO DỤC</h3>
      
      <h4>Điều 3. Giáo dục lý tưởng cách mạng</h4>
      <p>- Tư tưởng Hồ Chí Minh về thanh niên</p>
      <p>- Truyền thống cách mạng của Đoàn</p>
      <p>- Lý tưởng xây dựng chủ nghĩa xã hội</p>
      
      <h4>Điều 4. Giáo dục đạo đức, lối sống</h4>
      <p>- Đạo đức cách mạng</p>
      <p>- Lối sống văn minh, hiện đại</p>
      <p>- Tinh thần yêu nước, yêu chế độ</p>
      
      <h3>Chương III: PHƯƠNG PHÁP VÀ HÌNH THỨC</h3>
      
      <h4>Điều 5. Các hình thức tuyên truyền</h4>
      <p>- Sinh hoạt chi đoàn định kỳ</p>
      <p>- Hội thao, hội thi, hội diễn</p>
      <p>- Tuyên truyền qua mạng xã hội</p>
      <p>- Hoạt động văn hóa, văn nghệ</p>
    `,
    status: 'PUBLISHED',
    issuedDate: '2023-03-20T00:00:00.000Z',
    effectiveDate: '2023-04-15T00:00:00.000Z',
    viewCount: 1234,
    downloadCount: 567,
    tags: 'giáo dục, lý tưởng cách mạng, tuyên truyền, thông tư',
    isNotificationSent: true,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  },
  
  {
    title: 'Mẫu báo cáo hoạt động Đoàn tháng',
    documentNumber: '05/MẪU-TW',
    documentType: 'FORM',
    issuer: 'Văn phòng Trung ương Đoàn',
    description: 'Biểu mẫu báo cáo tổng hợp hoạt động của các tổ chức Đoàn cơ sở hàng tháng.',
    content: `
      <h2>MẪU BÁO CÁO HOẠT ĐỘNG ĐOÀN THÁNG</h2>
      
      <p><strong>Tổ chức Đoàn:</strong> ....................................</p>
      <p><strong>Tháng/Năm báo cáo:</strong> ....................................</p>
      
      <h3>I. TÌNH HÌNH TỔ CHỨC:</h3>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr>
          <th>Chỉ tiêu</th>
          <th>Số lượng đầu tháng</th>
          <th>Phát triển trong tháng</th>
          <th>Số lượng cuối tháng</th>
        </tr>
        <tr>
          <td>Số chi đoàn</td>
          <td>................</td>
          <td>................</td>
          <td>................</td>
        </tr>
        <tr>
          <td>Số đoàn viên</td>
          <td>................</td>
          <td>................</td>
          <td>................</td>
        </tr>
        <tr>
          <td>Số đoàn viên nữ</td>
          <td>................</td>
          <td>................</td>
          <td>................</td>
        </tr>
      </table>
      
      <h3>II. HOẠT ĐỘNG TRONG THÁNG:</h3>
      <h4>1. Hoạt động giáo dục chính trị tư tưởng:</h4>
      <p>- Số buổi sinh hoạt: ............ buổi</p>
      <p>- Nội dung chính: ....................................</p>
      
      <h4>2. Hoạt động văn hóa, văn nghệ, thể thao:</h4>
      <p>- Số hoạt động tổ chức: ............ hoạt động</p>
      <p>- Số người tham gia: ............ người</p>
      
      <h4>3. Hoạt động tình nguyện, xã hội:</h4>
      <p>- Số hoạt động: ............ hoạt động</p>
      <p>- Thời gian tình nguyện: ............ giờ</p>
      
      <h3>III. KẾT QUẢ ĐẠT ĐƯỢC:</h3>
      <p>....................................</p>
      
      <h3>IV. TỒN TẠI, HẠN CHẾ:</h3>
      <p>....................................</p>
      
      <h3>V. PHƯƠNG HƯỚNG THÁNG SAU:</h3>
      <p>....................................</p>
      
      <p style="text-align: right;"><strong>Ngày ... tháng ... năm .....</strong></p>
      <p style="text-align: right;"><strong>BÍ THƯ ĐOÀN</strong></p>
      <p style="text-align: right;"><strong>(Ký, ghi rõ họ tên)</strong></p>
    `,
    status: 'PUBLISHED',
    issuedDate: '2023-01-01T00:00:00.000Z',
    effectiveDate: '2023-01-01T00:00:00.000Z',
    viewCount: 2156,
    downloadCount: 1234,
    tags: 'mẫu biểu, báo cáo, hoạt động đoàn, hàng tháng',
    isNotificationSent: true,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  },
  
  {
    title: '[DỰ THẢO] Quy chế hoạt động của Đoàn thanh niên cơ sở',
    documentNumber: '06/DT-TW',
    documentType: 'REGULATION',
    issuer: 'Ban Thường vụ Trung ương Đoàn',
    description: 'Dự thảo quy chế hoạt động của các tổ chức Đoàn thanh niên ở cơ sở (đang lấy ý kiến góp ý).',
    content: `
      <h2>DỰ THẢO QUY CHẾ</h2>
      <h3>HOẠT ĐỘNG CỦA ĐOÀN THANH NIÊN CƠ SỞ</h3>
      
      <p><em>Tài liệu này đang trong giai đoạn lấy ý kiến góp ý</em></p>
      
      <h3>Chương I: NHỮNG QUY ĐỊNH CHUNG</h3>
      
      <h4>Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng</h4>
      <p>1. Quy chế này quy định về tổ chức, hoạt động của Đoàn thanh niên cơ sở.</p>
      <p>2. Đối tượng áp dụng gồm:</p>
      <p>- Đoàn thanh niên cơ sở trong các cơ quan, đơn vị, doanh nghiệp</p>
      <p>- Đoàn thanh niên cơ sở trong các trường học</p>
      <p>- Đoàn thanh niên phường, xã, thị trấn</p>
      
      <h4>Điều 2. Nguyên tắc tổ chức và hoạt động</h4>
      <p>- Tuân thủ Điều lệ Đoàn và các quy định của Đảng, Nhà nước</p>
      <p>- Dân chủ tập trung, tập thể lãnh đạo, cá nhân phụ trách</p>
      <p>- Công khai, minh bạch trong hoạt động</p>
      
      <h3>Chương II: TỔ CHỨC VÀ NHÂN SỰ</h3>
      
      <h4>Điều 3. Cơ cấu tổ chức</h4>
      <p>1. Đại hội Đoàn cơ sở là cơ quan quyền lực cao nhất</p>
      <p>2. Ban Chấp hành Đoàn cơ sở do Đại hội bầu ra</p>
      <p>3. Ban Thường vụ và Bí thư Đoàn do Ban Chấp hành bầu</p>
      
      <h4>Điều 4. Nhiệm vụ và quyền hạn của Bí thư</h4>
      <p>- Lãnh đạo toàn diện hoạt động của Đoàn cơ sở</p>
      <p>- Chịu trách nhiệm trước Đại hội và cấp trên về kết quả hoạt động</p>
      <p>- Phối hợp với lãnh đạo cơ quan, đơn vị trong công tác thanh niên</p>
    `,
    status: 'DRAFT',
    issuedDate: null,
    effectiveDate: null,
    viewCount: 156,
    downloadCount: 23,
    tags: 'quy chế, dự thảo, đoàn cơ sở, góp ý',
    isNotificationSent: false,
    authorId: 'cmfi9sjf70002ttx8b8icy3t2'
  }
];

async function seedDocuments() {
  try {
    console.log('🌱 Bắt đầu seed documents...');

    // Check if documents already exist
    const existingCount = await prisma.document.count();
    if (existingCount > 0) {
      console.log(`📄 Đã có ${existingCount} documents trong database`);
      console.log('⚠️ Xóa dữ liệu cũ và tạo mới...');
      await prisma.document.deleteMany({});
    }

    // Create documents
    let createdCount = 0;
    for (const docData of sampleDocuments) {
      try {
        await prisma.document.create({
          data: {
            ...docData,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdCount++;
        console.log(`✅ Tạo thành công: "${docData.title}"`);
      } catch (error) {
        console.log(`❌ Lỗi tạo document "${docData.title}":`, error.message);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${createdCount}/${sampleDocuments.length} documents`);
    console.log('\n📋 Danh sách documents đã tạo:');
    
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        documentType: true,
        status: true,
        viewCount: true
      },
      orderBy: { createdAt: 'desc' }
    });

    documents.forEach((doc, index) => {
      console.log(`${index + 1}. [${doc.documentType}] ${doc.title} (${doc.status}) - ${doc.viewCount} lượt xem`);
    });

    console.log('\n💡 Bạn có thể test Document Management ngay bây giờ!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDocuments();
}

module.exports = { seedDocuments };
