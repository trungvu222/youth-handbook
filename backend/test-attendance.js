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
    
    // Cập nhật trạng thái: 30% đúng giờ, 20% đến trễ, 20% báo vắng, 30% chưa điểm danh
    const totalParticipants = participants.length;
    const numOnTime = Math.floor(totalParticipants * 0.3);      // 30% đúng giờ
    const numLate = Math.floor(totalParticipants * 0.2);        // 20% đến trễ
    const numAbsent = Math.floor(totalParticipants * 0.2);      // 20% báo vắng
    const numRegistered = totalParticipants - numOnTime - numLate - numAbsent; // Còn lại chưa điểm danh
    
    console.log('\n🔄 Cập nhật trạng thái điểm danh...');
    console.log(`   - ${numOnTime} người điểm danh đúng giờ (30%)`);
    console.log(`   - ${numLate} người đến trễ (20%)`);
    console.log(`   - ${numAbsent} người báo vắng (20%)`);
    console.log(`   - ${numRegistered} người chưa điểm danh (30%)`);
    
    // Lấy thông tin activity để tính checkInTime
    const activityStartTime = new Date(activity.startTime);
    const onTimeCheckIn = new Date(activityStartTime.getTime() + 5 * 60000); // 5 phút sau startTime (đúng giờ)
    const lateCheckIn = new Date(activityStartTime.getTime() + 20 * 60000);  // 20 phút sau startTime (trễ)
    
    let index = 0;
    
    // Điểm danh đúng giờ
    console.log('\n⏰ Điểm danh đúng giờ...');
    for (let i = 0; i < numOnTime; i++, index++) {
      await axios.put(
        `${API_URL}/activities/${activity.id}/attendance/${participants[index].id}`,
        { 
          status: 'CHECKED_IN',
          checkInTime: onTimeCheckIn.toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    console.log(`   ✅ Đã cập nhật ${numOnTime} người điểm danh đúng giờ`);
    
    // Điểm danh trễ
    console.log('\n🕐 Điểm danh trễ...');
    for (let i = 0; i < numLate; i++, index++) {
      await axios.put(
        `${API_URL}/activities/${activity.id}/attendance/${participants[index].id}`,
        { 
          status: 'CHECKED_IN',
          checkInTime: lateCheckIn.toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    console.log(`   ✅ Đã cập nhật ${numLate} người điểm danh trễ`);
    
    // Báo vắng
    console.log('\n❌ Báo vắng...');
    for (let i = 0; i < numAbsent; i++, index++) {
      await axios.put(
        `${API_URL}/activities/${activity.id}/attendance/${participants[index].id}`,
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
    
    const totalCheckedIn = numOnTime + numLate;
    const expectedAttendanceRate = ((totalCheckedIn / totalParticipants) * 100).toFixed(1);
    const expectedOnTimeRate = ((numOnTime / totalCheckedIn) * 100).toFixed(1);
    
    console.log('\n📈 THỐNG KÊ SAU KHI CẬP NHẬT:');
    console.log(`   Tổng: ${finalStats.total}`);
    console.log(`   Đã điểm danh: ${finalStats.checkedIn} (dự kiến: ${totalCheckedIn})`);
    console.log(`   • Đúng giờ: ${finalStats.onTime} (dự kiến: ${numOnTime})`);
    console.log(`   • Đến trễ: ${finalStats.late} (dự kiến: ${numLate})`);
    console.log(`   Chưa điểm danh: ${finalStats.registered} (dự kiến: ${numRegistered})`);
    console.log(`   Báo vắng: ${finalStats.absent} (dự kiến: ${numAbsent})`);
    console.log(`\n   Tỉ lệ điểm danh: ${finalStats.attendanceRate}% (dự kiến: ${expectedAttendanceRate}%)`);
    console.log(`   Đúng giờ: ${finalStats.onTimeRate}% (dự kiến: ${expectedOnTimeRate}%)`);
    
    // Kiểm tra khớp
    const isMatch = 
      finalStats.checkedIn === totalCheckedIn &&
      finalStats.onTime === numOnTime &&
      finalStats.late === numLate &&
      finalStats.absent === numAbsent &&
      finalStats.registered === numRegistered &&
      finalStats.attendanceRate === expectedAttendanceRate &&
      finalStats.onTimeRate === expectedOnTimeRate;
    
    console.log('\n' + (isMatch ? '✅ THỐNG KÊ KHỚP HOÀN TOÀN!' : '⚠️  THỐNG KÊ CÓ SAI LỆCH'));
    
    if (!isMatch) {
      console.log('\n⚠️  Chi tiết không khớp:');
      if (finalStats.checkedIn !== totalCheckedIn) {
        console.log(`   - Đã điểm danh: ${finalStats.checkedIn} ≠ ${totalCheckedIn}`);
      }
      if (finalStats.onTime !== numOnTime) {
        console.log(`   - Đúng giờ: ${finalStats.onTime} ≠ ${numOnTime}`);
      }
      if (finalStats.late !== numLate) {
        console.log(`   - Đến trễ: ${finalStats.late} ≠ ${numLate}`);
      }
      if (finalStats.absent !== numAbsent) {
        console.log(`   - Báo vắng: ${finalStats.absent} ≠ ${numAbsent}`);
      }
      if (finalStats.registered !== numRegistered) {
        console.log(`   - Chưa điểm danh: ${finalStats.registered} ≠ ${numRegistered}`);
      }
      if (finalStats.attendanceRate !== expectedAttendanceRate) {
        console.log(`   - Tỉ lệ điểm danh: ${finalStats.attendanceRate}% ≠ ${expectedAttendanceRate}%`);
      }
      if (finalStats.onTimeRate !== expectedOnTimeRate) {
        console.log(`   - Đúng giờ: ${finalStats.onTimeRate}% ≠ ${expectedOnTimeRate}%`);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
    console.error('Chi tiết:', error);
  }
}

testAttendance();
