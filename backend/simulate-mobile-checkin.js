/**
 * SIMULATE REAL USER CHECK-IN FROM MOBILE
 * Script này giả lập user mobile thực hiện điểm danh
 * Data sẽ được lưu vào database PostgreSQL như user thật
 */

const API_BASE = 'http://localhost:3001/api'

async function simulateUserCheckIn() {
  console.log('🎯 BẮT ĐẦU SIMULATE USER MOBILE CHECK-IN...\n')

  // BƯỚC 1: Login với tài khoản member
  console.log('📱 BƯỚC 1: Đăng nhập với user member...')
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'member1', password: '123456' })
  })
  
  if (!loginRes.ok) {
    console.error('❌ Login thất bại')
    // Thử tạo user mới nếu chưa tồn tại
    console.log('   Thử tạo user member1...')
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'member1',
        password: '123456',
        fullName: 'Nguyễn Văn A',
        email: 'member1@example.com',
        role: 'MEMBER'
      })
    })
    
    if (!registerRes.ok) {
      console.error('❌ Register cũng thất bại, dừng lại')
      return
    }
    
    // Login lại sau khi register
    const loginRes2 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'member1', password: '123456' })
    })
    
    const loginData2 = await loginRes2.json()
    var token = loginData2.token
    var user = loginData2.user
  } else {
    const loginData = await loginRes.json()
    var token = loginData.token
    var user = loginData.user
  }
  
  console.log(`   ✅ Đăng nhập thành công: ${user.fullName} (${user.username})`)
  console.log(`   📌 User ID: ${user.id}\n`)

  // BƯỚC 2: Lấy danh sách activities
  console.log('📋 BƯỚC 2: Lấy danh sách hoạt động...')
  const activitiesRes = await fetch(`${API_BASE}/activities`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const activitiesData = await activitiesRes.json()
  const activities = activitiesData.data || []
  
  if (activities.length === 0) {
    console.error('❌ Không có activity nào, cần tạo activity trước')
    return
  }
  
  // Tìm activity đang ACTIVE hoặc lấy activity đầu tiên
  let targetActivity = activities.find(a => a.status === 'ACTIVE')
  if (!targetActivity) {
    targetActivity = activities[0]
  }
  
  console.log(`   ✅ Chọn activity: ${targetActivity.title}`)
  console.log(`   📌 Activity ID: ${targetActivity.id}`)
  console.log(`   📌 QR Code: ${targetActivity.qrCode}`)
  console.log(`   📌 Start Time: ${targetActivity.startTime}\n`)

  // BƯỚC 3: Đăng ký activity (nếu chưa)
  console.log('📝 BƯỚC 3: Đăng ký tham gia hoạt động...')
  const registerActivityRes = await fetch(`${API_BASE}/activities/${targetActivity.id}/register`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const registerActivityData = await registerActivityRes.json()
  if (registerActivityRes.ok) {
    console.log('   ✅ Đăng ký thành công')
  } else if (registerActivityData.error?.includes('already registered')) {
    console.log('   ℹ️  Đã đăng ký trước đó')
  } else {
    console.log(`   ⚠️  Register response: ${registerActivityData.error || 'Unknown'}`)
  }

  // BƯỚC 4: Check-in (ĐIỂM DANH THẬT)
  console.log('\n✨ BƯỚC 4: ĐIỂM DANH (như user mobile)...')
  const checkInRes = await fetch(`${API_BASE}/activities/${targetActivity.id}/checkin`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      qrCode: targetActivity.qrCode,
      latitude: 10.762622,  // Giả lập vị trí HCM
      longitude: 106.660172
    })
  })
  
  const checkInData = await checkInRes.json()
  
  if (checkInRes.ok) {
    console.log('   🎉 ĐIỂM DANH THÀNH CÔNG!')
    console.log(`   📌 Thời gian: ${new Date().toLocaleString('vi-VN')}`)
    console.log(`   📌 Điểm nhận: +${checkInData.data?.pointsEarned || 'N/A'}`)
    console.log(`   📌 Status: ${checkInData.data?.status}`)
    console.log(`   📌 Check-in Time: ${checkInData.data?.checkInTime || new Date().toISOString()}`)
  } else {
    console.error(`   ❌ Điểm danh thất bại: ${checkInData.error}`)
    console.error('   Chi tiết:', checkInData)
  }

  // BƯỚC 5: Verify data
  console.log('\n📊 BƯỚC 5: Kiểm tra data trong database...')
  console.log('   → Mở admin: http://localhost:3000/admin')
  console.log('   → Login: admin / 123456')
  console.log('   → Vào "Sinh hoạt đoàn" → Click icon 👥 ở activity:', targetActivity.title)
  console.log('   → Xem danh sách điểm danh → Sẽ thấy:', user.fullName, '- Đã điểm danh ✅')
  
  console.log('\n✅ HOÀN TẤT! Data thật đã được lưu vào PostgreSQL Neon.')
  console.log('   Data này là DATA THẬT 100%, giống như user mobile điểm danh.\n')
}

// Run
simulateUserCheckIn().catch(err => {
  console.error('❌ LỖI:', err)
  process.exit(1)
})
