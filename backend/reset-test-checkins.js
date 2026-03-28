/**
 * Reset Test Check-ins
 * Xóa tất cả data điểm danh test để database sạch, chỉ giữ lại data đăng ký
 * Sau khi chạy script này, user sẽ tự điểm danh thực tế qua app
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetTestCheckins() {
  try {
    console.log('🔄 Bắt đầu reset data điểm danh test...\n')

    // Đếm số lượng hiện tại
    const beforeCount = await prisma.activityParticipant.count({
      where: {
        status: 'CHECKED_IN'
      }
    })
    console.log(`📊 Hiện có ${beforeCount} bản ghi đã điểm danh`)

    // Reset tất cả participants về trạng thái REGISTERED
    const result = await prisma.activityParticipant.updateMany({
      where: {
        status: 'CHECKED_IN'
      },
      data: {
        status: 'REGISTERED',
        checkInTime: null
      }
    })

    console.log(`\n✅ Đã reset ${result.count} bản ghi về trạng thái REGISTERED`)
    console.log('📌 Tất cả user giờ chỉ là "Đã đăng ký", chưa điểm danh')
    console.log('\n💡 Cách để có data thật:')
    console.log('   1. Mở app trên mobile/web với tài khoản thành viên')
    console.log('   2. Vào "Sinh hoạt đoàn" → Chọn hoạt động')
    console.log('   3. Click "Điểm danh" và nhập mã QR')
    console.log('   4. Data sẽ tự động lưu vào database PostgreSQL')
    console.log('\n🎯 Bây giờ data sẽ là data THẬT từ user điểm danh, không phải test data!')

  } catch (error) {
    console.error('❌ Lỗi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetTestCheckins()
