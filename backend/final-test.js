const axios = require('axios');

async function testAttendanceAPI() {
  try {
    // Login admin
    console.log('[TEST] Logging in as admin...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/admin/login', {
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log(`[TEST] ✅ Login OK, token: ${token.substring(0, 30)}...`);
    
    // Test attendance API
    console.log('\n[TEST] Testing attendance API for activity 1...');
    const attendanceRes = await axios.get('http://localhost:3001/api/activities/1/attendance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n✅✅✅ BACKEND ATTENDANCE API WORKS! ✅✅✅\n');
    console.log('RESPONSE DATA:');
    console.log(JSON.stringify(attendanceRes.data, null, 2));
    
    const stats = attendanceRes.data.stats;
    if (stats) {
      console.log('\n📊 THỐNG KÊ:');
      console.log(`- Tổng số: ${stats.total}`);
      console.log(`- Đã điểm danh: ${stats.checkedIn}`);
      console.log(`- Đúng giờ: ${stats.onTime} (${stats.onTimeRate}%)`);
      console.log(`- Đến trễ: ${stats.late}`);
      console.log(`- Chưa điểm danh: ${stats.registered}`);
      console.log(`- Vắng: ${stats.absent}`);
      console.log(`- Tỷ lệ điểm danh: ${stats.attendanceRate}%`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

console.log('='.repeat(50));
console.log('TESTING ATTENDANCE API');
console.log('='.repeat(50));

testAttendanceAPI();
