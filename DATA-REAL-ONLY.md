# ⚠️ CHÍNH SÁCH DATA THẬT - KHÔNG DÙNG MOCK DATA

**Ngày áp dụng: 3/2/2026**

## 🎯 QUY TẮC QUAN TRỌNG

Từ ngày này trở đi, hệ thống **PHẢI SỬ DỤNG DATA THẬT 100%** từ database PostgreSQL Neon. 

**NGHIÊM CẤM:**
- ❌ Mock data / Fake data
- ❌ Hardcode data test
- ❌ Fallback data giả
- ❌ Auto-seed data test vào production
- ❌ Set cứng giá trị trong code

## ✅ CHUẨN MỰC DATA THẬT

### 1. **Database (PostgreSQL Neon)**
- Connection: `ep-lingering-dawn-a1d7mk50-pooler.ap-southeast-1.aws.neon.tech`
- Tất cả data PHẢI lưu trong database
- Update theo thời gian thực (realtime)
- Không có data test cố định

### 2. **Backend API**
- ✅ Tất cả endpoints query từ Prisma ORM
- ✅ Không có auto-seed trong production
- ✅ Seed scripts chỉ dùng trong development khi cần thiết
- ✅ Error handling: Trả về error message, không trả mock data

**Files đã cleanup:**
- `backend/src/index.js` - Đã XÓA auto-seed code (lines 665-690)
- `backend/keep-alive.js` - Process wrapper không seed data
- `backend/reset-test-checkins.js` - Script để XÓA data test

### 3. **Frontend Components**
- ✅ Tất cả components load data từ API
- ✅ Khi API fail: Hiển thị error message, KHÔNG fallback mock data
- ✅ Loading states: Hiển thị spinner/skeleton
- ✅ Empty states: Hiển thị "Không có dữ liệu", không tạo data giả

**Files đã cleanup:**
- `components/activities/activity-detail-mobile.tsx` - Đã XÓA mock fallback

**Files cần review (có mock data):**
- `components/screens/study-screen-mobile.tsx` - MOCK_TOPICS fallback
- `components/screens/news-screen-mobile.tsx` - MOCK_POSTS fallback
- `components/screens/exams-screen-mobile.tsx` - MOCK_EXAMS fallback
- `components/screens/documents-screen-mobile.tsx` - MOCK_DOCUMENTS fallback

## 📊 FLOW DATA THẬT

### A. Điểm danh (Attendance)
```
User Mobile → Nhập QR → API POST /activities/:id/checkin 
→ Lưu PostgreSQL (status=CHECKED_IN, checkInTime=NOW()) 
→ Admin reload → Thấy data mới REALTIME
```

### B. Đăng ký hoạt động
```
User → Click "Đăng ký" → API POST /activities/:id/register 
→ Lưu PostgreSQL (status=REGISTERED) 
→ Admin → Thống kê tự động cập nhật
```

### C. Điểm thưởng
```
User check-in success → Backend tính điểm (onTime=+5, late=+2) 
→ UPDATE users.points → Leaderboard tự động cập nhật
```

## 🔧 CÁCH LÀM VIỆC VỚI DATA THẬT

### Khi phát triển tính năng mới:

1. **Backend:**
   ```javascript
   // ✅ ĐÚNG - Query database
   const activities = await prisma.activity.findMany({
     where: { status: 'ACTIVE' },
     include: { participants: true }
   })
   
   // ❌ SAI - Trả mock data
   const activities = [{ id: 1, title: 'Test' }]
   ```

2. **Frontend:**
   ```typescript
   // ✅ ĐÚNG - Load từ API, hiển thị error nếu fail
   const result = await activityApi.getActivities()
   if (!result.success) {
     alert('Không tải được dữ liệu. Vui lòng thử lại.')
     return
   }
   
   // ❌ SAI - Fallback mock data
   const result = await api.get() || MOCK_DATA
   ```

### Khi cần test với data:

1. **Development:**
   - Tạo data thật qua Admin UI
   - Hoặc chạy seed scripts: `node backend/scripts/seed-xxx.js`
   - Sau khi test xong: XÓA data test

2. **Production:**
   - Chỉ có data từ user thật
   - Không chạy seed scripts
   - Không tạo data test

## 🚨 CHECKLIST TRƯỚC KHI DEPLOY

- [ ] Không có mock data trong frontend components
- [ ] Không có auto-seed trong backend startup
- [ ] Tất cả API endpoints query từ database
- [ ] Error handling: Hiển thị message, không fallback mock
- [ ] Database có data thật (từ user hoặc admin tạo qua UI)
- [ ] Test với data thật, không test với hardcode

## 📝 LỊCH SỬ THAY ĐỔI

### 2026-02-03
- ✅ Xóa auto-seed trong `backend/src/index.js`
- ✅ Tạo `backend/reset-test-checkins.js` để cleanup
- ✅ Xóa mock fallback trong `activity-detail-mobile.tsx`
- ✅ Chạy reset: 0 check-ins test trong database
- ✅ Database hoàn toàn sạch, chờ data thật từ user

### Nguyên tắc vàng:
> **"Nếu không có data thật → Hiển thị empty state, KHÔNG tạo data giả"**

---

*Document này là guideline bắt buộc cho toàn bộ team development.*
*Mọi vi phạm cần được review và fix ngay lập tức.*
