const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

// Login admin
async function loginAdmin() {
  const res = await axios.post(`${API_URL}/auth/login`, {
    username: 'admin',
    password: '123456'
  });
  return res.data.token;
}

// Test attendance
async function testAttendance() {
  try {
    console.log('🔐 Đăng nhập admin...');
    const token = await loginAdmin();
    
    console.log('📋 Lấy danh sách hoạt động...');
    const activitiesRes = await axios.get(`${API_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const activity = activitiesRes.data.data[0];
    if (!activity) {
      console.log('❌ Không có hoạt động nào!');
      return;
    }
    
    console.log(`\n📌 Hoạt động: ${activity.title}`);
    console.log(`   ID: ${activity.id}`);
    
    // Lấy danh sách điểm danh
    console.log('\n📊 Lấy danh sách điểm danh...');
    const attendanceRes = await axios.get(`${API_URL}/activities/${activity.id}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { participants, stats } = attendanceRes.data.data;
    
    console.log('\n📈 THỐNG KÊ BAN ĐẦU:');
    console.log(`   Tổng: ${stats.total}`);
    console.log(`   Đã điểm danh: ${stats.checkedIn}`);
    console.log(`   Chưa điểm danh: ${stats.registered}`);
    console.log(`   Báo vắng: ${stats.absent}`);
    
    if (participants.length === 0) {
      console.log('\n❌ Không có người tham gia!');
      return;
    }
    
    console.log(`\n👥 Có ${participants.length} người đăng ký`);
    
    // Cập nhật trạng thái: 40% đã điểm danh, 20% báo vắng, 40% chưa điểm danh
    const totalParticipants = participants.length;
    const numCheckedIn = Math.floor(totalParticipants * 0.4);
    const numAbsent = Math.floor(totalParticipants * 0.2);
    
    console.log('\n🔄 Cập nhật trạng thái điểm danh...');
    console.log(`   - ${numCheckedIn} người đã điểm danh`);
    console.log(`   - ${numAbsent} người báo vắng`);
    console.log(`   - ${totalParticipants - numCheckedIn - numAbsent} người chưa điểm danh`);
    
    // Điểm danh cho một số user
    for (let i = 0; i < numCheckedIn; i++) {
      await axios.put(
        `${API_URL}/activities/${activity.id}/attendance/${participants[i].id}`,
        { status: 'CHECKED_IN' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    console.log(`   ✅ Đã cập nhật ${numCheckedIn} người điểm danh`);
    
    // Báo vắng cho một số user
    for (let i = numCheckedIn; i < numCheckedIn + numAbsent; i++) {
      await axios.put(
        `${API_URL}/activities/${activity.id}/attendance/${participants[i].id}`,
        { status: 'ABSENT', absentReason: 'Bận việc đột xuất' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    console.log(`   ✅ Đã cập nhật ${numAbsent} người báo vắng`);
    
    // Kiểm tra lại thống kê
    console.log('\n🔍 Kiểm tra lại thống kê...');
    const finalRes = await axios.get(`${API_URL}/activities/${activity.id}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const finalStats = finalRes.data.data.stats;
    
    console.log('\n📈 THỐNG KÊ SAU KHI CẬP NHẬT:');
    console.log(`   Tổng: ${finalStats.total}`);
    console.log(`   Đã điểm danh: ${finalStats.checkedIn} (dự kiến: ${numCheckedIn})`);
    console.log(`   Chưa điểm danh: ${finalStats.registered} (dự kiến: ${totalParticipants - numCheckedIn - numAbsent})`);
    console.log(`   Báo vắng: ${finalStats.absent} (dự kiến: ${numAbsent})`);
    
    // Kiểm tra khớp
    const isMatch = 
      finalStats.checkedIn === numCheckedIn &&
      finalStats.absent === numAbsent &&
      finalStats.registered === (totalParticipants - numCheckedIn - numAbsent);
    
    console.log('\n' + (isMatch ? '✅ THỐNG KÊ KHỚP!' : '❌ THỐNG KÊ KHÔNG KHỚP!'));
    
    if (!isMatch) {
      console.log('\n⚠️  Chi tiết không khớp:');
      if (finalStats.checkedIn !== numCheckedIn) {
        console.log(`   - Đã điểm danh: ${finalStats.checkedIn} ≠ ${numCheckedIn}`);
      }
      if (finalStats.absent !== numAbsent) {
        console.log(`   - Báo vắng: ${finalStats.absent} ≠ ${numAbsent}`);
      }
      if (finalStats.registered !== (totalParticipants - numCheckedIn - numAbsent)) {
        console.log(`   - Chưa điểm danh: ${finalStats.registered} ≠ ${totalParticipants - numCheckedIn - numAbsent}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
    console.error('Chi tiết:', error);
  }
}

testAttendance();
