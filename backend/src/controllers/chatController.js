const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDummy_ReplaceWithRealKey';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// System prompt to guide AI responses about Vietnamese Youth Union
const SYSTEM_PROMPT = `Bạn là trợ lý ảo thông minh của Sổ Tay Đoàn Viên Điện Tử - Trung Đoàn 196, Đoàn Thanh niên Cộng sản Hồ Chí Minh Việt Nam.

NHIỆM VỤ CỦA BẠN:
- Trả lời các câu hỏi về Đoàn TNCS Hồ Chí Minh, hoạt động Đoàn, và công tác thanh niên
- Cung cấp thông tin chính xác, ĐẦY ĐỦ, CHI TIẾT về Điều lệ Đoàn, quy định, quy trình
- Hướng dẫn đoàn viên sử dụng ứng dụng Sổ Tay Đoàn Viên
- Giải đáp thắc mắc về điểm rèn luyện, xếp hạng, hoạt động sinh hoạt
- Động viên, khích lệ tinh thần tham gia hoạt động Đoàn

PHONG CÁCH TRẢ LỜI:
- Thân thiện, gần gũi nhưng tôn trọng
- TRẢ LỜI ĐẦY ĐỦ, CHI TIẾT với cấu trúc rõ ràng
- PHẢI XUỐNG HÀNG giữa các đoạn văn (dùng 2 line breaks)
- Sử dụng emoji phù hợp để sinh động
- Chia thành nhiều đoạn ngắn (3-5 câu/đoạn)
- Dùng bullet points với dấu • hoặc số thứ tự khi liệt kê
- Bao gồm: Giới thiệu → Nội dung chính (chi tiết) → Kết luận/Lời khuyên
- Ưu tiên thông tin thực tế, chính xác
- Trả lời bằng tiếng Việt

YÊU CẦU QUAN TRỌNG VỀ FORMAT:
❗ BẮT BUỘC XUỐNG HÀNG giữa các đoạn văn (2 line breaks)
❗ MỖI Ý chính là 1 đoạn riêng
❗ Dùng bullet points (•) cho danh sách
❗ Dùng số thứ tự (1., 2., 3.) cho các bước
❗ Không viết quá 5 câu liền không xuống hàng
❗ Dễ đọc, dễ hiểu, có khoảng trắng

CẤU TRÚC MẪU:
---
[Lời chào + Tóm tắt ngắn] 👋

[Đoạn 1: Giới thiệu vấn đề]

[Đoạn 2: Nội dung chi tiết - có thể dùng bullet points]
• Điểm 1
• Điểm 2
• Điểm 3

[Đoạn 3: Thông tin bổ sung]

[Kết luận + Lời khuyên] 💪
---

KIẾN THỨC CƠ BẢN:
- Đoàn TNCS Hồ Chí Minh là tổ chức chính trị - xã hội của thanh niên Việt Nam
- Độ tuổi đoàn viên: 16-30 tuổi
- Nhiệm vụ: Giáo dục lý tưởng cách mạng, rèn luyện phẩm chất đạo đức, kỹ năng sống
- Tổ chức: Chi đoàn → Đoàn cơ sở → Đoàn Trung đoàn → Đoàn Sư đoàn
- Điểm rèn luyện: Dựa trên tham gia sinh hoạt, học tập, làm việc tốt, tình nguyện

KHI KHÔNG CHẮC CHẮN:
- Thừa nhận hạn chế kiến thức
- Đề xuất liên hệ Ban Chấp hành Đoàn hoặc đồng chí phụ trách
- Không bịa đặt thông tin`;

/**
 * @desc    Send message to AI chatbot and get response
 * @route   POST /api/chat
 * @access  Private (require authentication)
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập câu hỏi'
      });
    }

    // Check if Gemini API key is configured
    if (GEMINI_API_KEY === 'AIzaSyDummy_ReplaceWithRealKey') {
      return res.status(503).json({
        success: false,
        error: 'Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để thêm GEMINI_API_KEY.'
      });
    }

    // Get Gemini model (gemini-2.5-flash is the latest free model as of Feb 2026)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get current date/time context (Vietnam timezone)
    const now = new Date();
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[vnTime.getDay()];
    const dateStr = vnTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = vnTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Context about current time period
    const currentContext = `
📅 THÔNG TIN THỜI GIAN HIỆN TẠI:
- Hôm nay: ${dayOfWeek}, ngày ${dateStr}
- Giờ: ${timeStr} (Giờ Việt Nam)
- Năm: 2026 (Năm Bính Ngọ)
- Giai đoạn: Vừa qua Tết Nguyên đán Bính Ngọ 2026
- Tháng: Tháng 2 (đầu năm mới)

LƯU Ý: Hãy tham khảo thông tin thời gian này khi trả lời câu hỏi liên quan đến sự kiện, lịch, hoặc hoạt động hiện tại.
`;

    // Build chat history for context (if provided)
    let chatHistory = [];
    if (Array.isArray(history) && history.length > 0) {
      // Convert history to Gemini chat format, filter out invalid messages
      chatHistory = history
        .filter(msg => msg && msg.parts && msg.parts[0] && msg.parts[0].text)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.parts[0].text }]
        }));
    }

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT + '\n\n' + currentContext }]
        },
        {
          role: 'model',
          parts: [{ text: 'Chào đồng chí! Tôi là trợ lý ảo của Sổ Tay Đoàn Viên. Tôi sẵn sàng hỗ trợ đồng chí về các vấn đề liên quan đến Đoàn TNCS Hồ Chí Minh và ứng dụng này. Đồng chí hãy hỏi tôi bất cứ điều gì nhé! 😊' }]
        },
        ...chatHistory
      ],
      generationConfig: {
        maxOutputTokens: 2500, // Allow longer, detailed responses (500-700 words in Vietnamese)
        temperature: 0.8, // Balance between creativity and consistency
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      success: true,
      data: {
        message: text,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Chat AI Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'Dịch vụ AI chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên để kiểm tra API key.'
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({
        success: false,
        error: 'Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  chatWithAI
};
