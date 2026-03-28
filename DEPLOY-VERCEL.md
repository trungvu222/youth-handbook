# Hướng dẫn Deploy Youth Handbook lên Vercel

## 📋 Yêu cầu trước khi deploy

### 1. Backend API
Trước khi deploy frontend lên Vercel, bạn cần deploy backend trước. Có thể chọn:
- **Railway** (khuyến nghị): https://railway.app
- **Render**: https://render.com
- **DigitalOcean**: https://digitalocean.com

Sau khi deploy backend, bạn sẽ có URL như:
```
https://youth-handbook-backend.up.railway.app/api
```

### 2. Database
Backend cần một database PostgreSQL hoặc MySQL. Các dịch vụ miễn phí:
- **Supabase** (PostgreSQL): https://supabase.com
- **PlanetScale** (MySQL): https://planetscale.com
- **Railway** (PostgreSQL): https://railway.app

---

## 🚀 Các bước Deploy Frontend lên Vercel

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Bước 2: Kết nối Vercel với GitHub
1. Truy cập https://vercel.com
2. Đăng nhập bằng tài khoản GitHub
3. Click "Add New..." > "Project"
4. Chọn repository `youth-handbook`

### Bước 3: Cấu hình Environment Variables
Trong Vercel Dashboard, thêm biến môi trường:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com/api` |

### Bước 4: Deploy
1. Click "Deploy"
2. Đợi build hoàn tất (khoảng 2-3 phút)
3. Truy cập URL được cấp (vd: `youth-handbook.vercel.app`)

---

## 🔧 Cấu hình bổ sung

### Custom Domain (tùy chọn)
1. Vào Project Settings > Domains
2. Thêm domain của bạn (vd: `admin.youth-handbook.vn`)
3. Cấu hình DNS theo hướng dẫn

### Environment Variables theo môi trường
- **Production**: Dùng URL backend production
- **Preview**: Có thể dùng URL backend staging

---

## 📱 Build Mobile App

Để build app mobile (sau khi đã deploy web):

```bash
# Windows
set BUILD_TARGET=mobile && pnpm build:mobile

# Sau đó build APK trong Android Studio
cd android
./gradlew assembleRelease
```

---

## ⚠️ Lưu ý quan trọng

1. **CORS**: Backend cần cho phép domain Vercel trong CORS settings
2. **HTTPS**: Vercel tự động cấp SSL certificate
3. **API Rate Limiting**: Nên cấu hình rate limiting cho production
4. **Monitoring**: Sử dụng Vercel Analytics để theo dõi

---

## 🔒 Bảo mật

- Không commit file `.env` lên GitHub
- Sử dụng HTTPS cho tất cả API calls
- Cấu hình Content Security Policy
- Enable 2FA cho tài khoản Vercel

---

## 📞 Hỗ trợ

Nếu gặp vấn đề khi deploy, kiểm tra:
1. Vercel Build Logs
2. Browser Console cho frontend errors
3. Backend logs cho API errors

---

## ✅ Checklist trước khi gửi khách hàng

- [ ] Backend đã deploy và hoạt động
- [ ] Frontend đã deploy trên Vercel
- [ ] Đã test đăng nhập admin
- [ ] Đã test tất cả chức năng admin panel
- [ ] Đã cấu hình custom domain (nếu có)
- [ ] Đã backup database
