const axios = require('axios');

async function testAPI() {
  try {
    // Lấy token admin
    const loginRes = await axios.post('http://localhost:3001/api/auth/admin/login', {
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login thành công');
    
    // Test attendance API
    const attendanceRes = await axios.get('http://localhost:3001/api/activities/1/attendance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 THỐNG KÊ ĐIỂM DANH:');
    console.log(JSON.stringify(attendanceRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ LỖI:', error.response?.data || error.message);
  }
}

testAPI();
