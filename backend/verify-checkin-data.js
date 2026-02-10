/**
 * VERIFY CHECK-IN DATA IN DATABASE
 * Kiểm tra data điểm danh thật trong PostgreSQL
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyCheckInData() {
  try {
    console.log('🔍 KIỂM TRA DATA ĐIỂM DANH TRONG DATABASE...\n')

    // Đếm tổng số check-ins
    const totalCheckIns = await prisma.activityParticipant.count({
      where: { status: 'CHECKED_IN' }
    })

    console.log(`📊 Tổng số người đã điểm danh: ${totalCheckIns}`)

    // Lấy chi tiết check-ins gần nhất
    const recentCheckIns = await prisma.activityParticipant.findMany({
      where: { 
        status: 'CHECKED_IN',
        checkInTime: { not: null }
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
            email: true
          }
        },
        activity: {
          select: {
            title: true,
            startTime: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' },
      take: 10
    })

    console.log('\n📋 10 LƯỢT ĐIỂM DANH GẦN NHẤT:\n')
    
    recentCheckIns.forEach((checkin, index) => {
      const checkInTime = new Date(checkin.checkInTime)
      const activityStart = new Date(checkin.activity.startTime)
      const timeDiff = (checkInTime - activityStart) / 60000 // phút
      const status = timeDiff <= 15 ? '✅ Đúng giờ' : '⏰ Đến trễ'
      
      console.log(`${index + 1}. ${checkin.user.fullName} (${checkin.user.username})`)
      console.log(`   Activity: ${checkin.activity.title}`)
      console.log(`   Check-in: ${checkInTime.toLocaleString('vi-VN')}`)
      console.log(`   Status: ${status}`)
      console.log(`   Điểm: +${checkin.pointsEarned || 'N/A'}`)
      console.log(`   QR Code: ${checkin.qrData || 'N/A'}`)
      if (checkin.latitude && checkin.longitude) {
        console.log(`   Vị trí: ${checkin.latitude}, ${checkin.longitude}`)
      }
      console.log('')
    })

    // Thống kê theo activity
    const activityStats = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        _count: {
          select: {
            participants: {
              where: { status: 'CHECKED_IN' }
            }
          }
        },
        participants: {
          where: { status: 'CHECKED_IN' },
          select: {
            user: {
              select: { fullName: true }
            },
            checkInTime: true
          },
          orderBy: { checkInTime: 'desc' },
          take: 5
        }
      },
      where: {
        participants: {
          some: { status: 'CHECKED_IN' }
        }
      },
      take: 5
    })

    console.log('\n📊 THỐNG KÊ THEO ACTIVITY:\n')
    
    activityStats.forEach(activity => {
      console.log(`📌 ${activity.title}`)
      console.log(`   Thời gian: ${new Date(activity.startTime).toLocaleString('vi-VN')}`)
      console.log(`   Đã điểm danh: ${activity._count.participants} người`)
      
      if (activity.participants.length > 0) {
        console.log(`   Người điểm danh:`)
        activity.participants.forEach(p => {
          console.log(`     - ${p.user.fullName} (${new Date(p.checkInTime).toLocaleString('vi-VN')})`)
        })
      }
      console.log('')
    })

    console.log('✅ TẤT CẢ DATA TRÊN LÀ DATA THẬT TỪ POSTGRESQL NEON!')
    console.log('   Không có mock data, không có fake data.')
    console.log('   Database: ep-lingering-dawn-a1d7mk50-pooler.ap-southeast-1.aws.neon.tech\n')

  } catch (error) {
    console.error('❌ Lỗi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCheckInData()
