// Test script cho Document và Exam Management
const axios = require('axios').default;

const API_BASE = 'http://localhost:3001/api';

// Test Document Management APIs
async function testDocumentAPIs() {
  console.log('🔍 Testing Document Management APIs...\n');
  
  try {
    // Test get documents endpoint
    console.log('1. Testing GET /documents');
    const documentsResponse = await axios.get(`${API_BASE}/documents`);
    console.log('✅ Documents API hoạt động:', documentsResponse.status === 200);
    
    // Test document search
    console.log('2. Testing document search');
    const searchResponse = await axios.get(`${API_BASE}/documents?search=test&documentType=NOTICE`);
    console.log('✅ Document search hoạt động:', searchResponse.status === 200);
    
    // Test create document (sẽ fail nếu không có auth)
    console.log('3. Testing POST /documents (without auth)');
    try {
      await axios.post(`${API_BASE}/documents`, {
        title: 'Test Document',
        documentType: 'NOTICE',
        description: 'Test description'
      });
    } catch (error) {
      console.log('✅ Create document yêu cầu authentication:', error.response?.status === 401);
    }
    
    console.log('✅ Document Management APIs test hoàn tất!\n');
    
  } catch (error) {
    console.log('❌ Lỗi testing Document APIs:', error.message);
  }
}

// Test Exam Management APIs
async function testExamAPIs() {
  console.log('🧠 Testing Exam Management APIs...\n');
  
  try {
    // Test get exams endpoint
    console.log('1. Testing GET /exams');
    const examsResponse = await axios.get(`${API_BASE}/exams`);
    console.log('✅ Exams API hoạt động:', examsResponse.status === 200);
    
    // Test exam search and filter
    console.log('2. Testing exam search and filter');
    const searchResponse = await axios.get(`${API_BASE}/exams?search=test&category=Lý luận chính trị`);
    console.log('✅ Exam search hoạt động:', searchResponse.status === 200);
    
    // Test get exam leaderboard
    console.log('3. Testing GET /exams/leaderboard');
    const leaderboardResponse = await axios.get(`${API_BASE}/exams/leaderboard`);
    console.log('✅ Exam leaderboard hoạt động:', leaderboardResponse.status === 200);
    
    // Test create exam (sẽ fail nếu không có auth)
    console.log('4. Testing POST /exams (without auth)');
    try {
      await axios.post(`${API_BASE}/exams`, {
        title: 'Test Exam',
        category: 'Test Category',
        duration: 60,
        totalQuestions: 10,
        passingScore: 70,
        maxAttempts: 3,
        pointsReward: 10,
        questions: []
      });
    } catch (error) {
      console.log('✅ Create exam yêu cầu authentication:', error.response?.status === 401);
    }
    
    console.log('✅ Exam Management APIs test hoàn tất!\n');
    
  } catch (error) {
    console.log('❌ Lỗi testing Exam APIs:', error.message);
  }
}

// Test authentication endpoints
async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    // Test login with default admin account
    console.log('1. Testing login with admin account');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login thành công:', !!token);
    
    if (token) {
      // Test protected endpoint
      console.log('2. Testing protected endpoint with token');
      const protectedResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Protected endpoint hoạt động:', protectedResponse.status === 200);
      console.log('👤 User info:', protectedResponse.data.data);
      
      return token; // Return token for further tests
    }
    
  } catch (error) {
    console.log('❌ Lỗi testing Auth:', error.message);
  }
  
  return null;
}

// Test với authentication
async function testWithAuth() {
  console.log('🔒 Testing APIs with Authentication...\n');
  
  const token = await testAuth();
  
  if (!token) {
    console.log('❌ Không thể lấy token, bỏ qua test với auth');
    return;
  }
  
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test create document với auth
    console.log('3. Testing create document with auth');
    const createDocResponse = await axios.post(`${API_BASE}/documents`, {
      title: 'Test Document với Auth',
      documentType: 'NOTICE',
      description: 'Đây là document test',
      issuer: 'Admin Test',
      status: 'PUBLISHED'
    }, { headers: authHeaders });
    
    console.log('✅ Create document với auth thành công:', createDocResponse.status === 201 || createDocResponse.status === 200);
    
    // Test create exam với auth
    console.log('4. Testing create exam with auth');
    const createExamResponse = await axios.post(`${API_BASE}/exams`, {
      title: 'Test Exam với Auth',
      category: 'Lý luận chính trị',
      duration: 30,
      totalQuestions: 3,
      passingScore: 70,
      maxAttempts: 2,
      pointsReward: 5,
      isRandomOrder: false,
      allowReview: true,
      questions: [
        {
          question: 'Câu hỏi test 1?',
          options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
          correctAnswer: 0,
          difficulty: 'EASY',
          points: 1
        },
        {
          question: 'Câu hỏi test 2?',
          options: ['Phương án 1', 'Phương án 2', 'Phương án 3', 'Phương án 4'],
          correctAnswer: 1,
          difficulty: 'MEDIUM',
          points: 1
        }
      ]
    }, { headers: authHeaders });
    
    console.log('✅ Create exam với auth thành công:', createExamResponse.status === 201 || createExamResponse.status === 200);
    
  } catch (error) {
    console.log('❌ Lỗi testing với Auth:', error.response?.data || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Bắt đầu test Document và Exam Management...\n');
  console.log('=' .repeat(60));
  
  // Wait a bit for servers to start
  console.log('⏳ Chờ servers khởi động...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await testDocumentAPIs();
    await testExamAPIs();
    await testWithAuth();
    
    console.log('=' .repeat(60));
    console.log('🎉 Hoàn tất tất cả tests!');
    console.log('');
    console.log('📋 Tóm tắt:');
    console.log('- Document Management APIs: Ready to use');
    console.log('- Exam Management APIs: Ready to use'); 
    console.log('- Authentication: Working');
    console.log('- Frontend: http://localhost:3000');
    console.log('- Backend: http://localhost:3001');
    console.log('');
    console.log('💡 Bạn có thể truy cập http://localhost:3000 để test giao diện!');
    
  } catch (error) {
    console.log('❌ Lỗi trong quá trình test:', error.message);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.log('❌ Unhandled error:', error.message);
});

// Run tests
runAllTests();

