/**
 * TEST LATE THRESHOLD CUSTOMIZATION
 * Kiểm tra tính năng tùy chỉnh ngưỡng trễ
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testLateThreshold() {
  try {
    console.log('🧪 TEST LATE THRESHOLD CUSTOMIZATION\n')

    // Lấy activity đầu tiên
    const activity = await prisma.activity.findFirst({
      select: {
        id: true,
        title: true,
        startTime: true,
        lateThresholdMinutes: true,
        onTimePoints: true,
        latePoints: true
      }
    })

    if (!activity) {
      console.log('❌ Không có activity nào trong database')
      return
    }

    console.log('📋 Activity hiện tại:')
    console.log(`   Tên: ${activity.title}`)
    console.log(`   Start Time: ${new Date(activity.startTime).toLocaleString('vi-VN')}`)
    console.log(`   Late Threshold: ${activity.lateThresholdMinutes || 15} phút`)
    console.log(`   On-Time Points: +${activity.onTimePoints}`)
    console.log(`   Late Points: +${activity.latePoints}\n`)

    // Tính toán thời gian
    const startTime = new Date(activity.startTime)
    const thresholdMinutes = activity.lateThresholdMinutes || 15
    const lateThreshold = new Date(startTime.getTime() + thresholdMinutes * 60000)

    console.log('⏰ CÁCH TÍNH ĐÚNG GIỜ / TRỄ:')
    console.log(`   Start Time: ${startTime.toLocaleString('vi-VN')}`)
    console.log(`   Late Threshold: ${startTime.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })} + ${thresholdMinutes} phút`)
    console.log(`   = ${lateThreshold.toLocaleString('vi-VN')}\n`)

    console.log('📌 KẾT QUẢ:')
    console.log(`   ✅ Check-in TRƯỚC ${lateThreshold.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })} → Đúng giờ (+${activity.onTimePoints} điểm)`)
    console.log(`   ⏰ Check-in SAU ${lateThreshold.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })} → Trễ (+${activity.latePoints} điểm)\n`)

    console.log('💡 CÁCH ĐỂ ADMIN TÙY CHỈNH:')
    console.log('   1. Mở Admin → "Sinh hoạt đoàn"')
    console.log('   2. Click "Sửa" activity')
    console.log('   3. Thêm field "Ngưỡng tính trễ (phút)": Nhập số phút (VD: 10, 20, 30)')
    console.log('   4. Ví dụ:')
    console.log('      - Nhập 10 → Sau 10 phút tính trễ')
    console.log('      - Nhập 30 → Sau 30 phút tính trễ')
    console.log('      - Để trống → Mặc định 15 phút\n')

    // Test update
    console.log('🔧 TEST: Thử cập nhật ngưỡng trễ thành 20 phút...')
    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: { lateThresholdMinutes: 20 },
      select: { lateThresholdMinutes: true }
    })

    const newLateThreshold = new Date(startTime.getTime() + 20 * 60000)
    console.log(`   ✅ Cập nhật thành công!`)
    console.log(`   ✅ Ngưỡng mới: ${newLateThreshold.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`)
    console.log(`   ✅ Check-in sau ${newLateThreshold.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })} → Trễ\n`)

    console.log('✅ HOÀN TẤT! Field lateThresholdMinutes đã hoạt động.')

  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    if (error.message.includes('Unknown field')) {
      console.log('\n⚠️  Field chưa tồn tại trong database.')
      console.log('   Cần chạy: npx prisma db push')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testLateThreshold()
