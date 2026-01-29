# Hướng dẫn Deploy Youth Handbook

## 🚀 Cách 1: Deploy nhanh với Render (Khuyến nghị)

### Bước 1: Chuẩn bị Repository

```bash
# Tạo Git repository
cd c:\Users\X1\Downloads\youth-handbook
git init
git add .
git commit -m "Initial commit - Youth Handbook"

# Push lên GitHub
# 1. Tạo repo mới trên github.com
# 2. Thêm remote và push
git remote add origin https://github.com/YOUR_USERNAME/youth-handbook.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy Backend lên Render

1. Truy cập https://render.com và đăng nhập bằng GitHub

2. Click "New +" > "Web Service"

3. Kết nối repository GitHub

4. Cấu hình:
   - **Name**: `youth-handbook-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`

5. Thêm Environment Variables:
   ```
   DATABASE_URL=file:./dev.db
   JWT_SECRET=your-super-secret-key-here-123456
   NODE_ENV=production
   PORT=3001
   ```

6. Click "Create Web Service"

7. Đợi deploy xong, bạn sẽ có URL như:
   ```
   https://youth-handbook-backend.onrender.com
   ```

### Bước 3: Deploy Frontend lên Vercel

1. Truy cập https://vercel.com và đăng nhập bằng GitHub

2. Click "Add New..." > "Project"

3. Import repository `youth-handbook`

4. Cấu hình:
   - **Root Directory**: `.` (mặc định)
   - **Framework Preset**: `Next.js`
   - **Build Command**: `pnpm build:vercel` hoặc `next build`

5. Thêm Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://youth-handbook-backend.onrender.com/api
   ```

6. Click "Deploy"

7. Đợi deploy xong, bạn sẽ có URL như:
   ```
   https://youth-handbook.vercel.app
   ```

---

## 🔧 Cách 2: Deploy với Railway + Vercel (PostgreSQL)

### Bước 1: Deploy Database trên Railway

1. Truy cập https://railway.app
2. Tạo project mới > "Provision PostgreSQL"
3. Copy `DATABASE_URL` từ Variables tab

### Bước 2: Cập nhật Backend cho PostgreSQL

Đổi `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Bước 3: Deploy Backend trên Railway

1. Trong cùng project Railway, click "New" > "GitHub Repo"
2. Chọn repo, cấu hình:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`

3. Thêm Variables:
   ```
   DATABASE_URL=(Railway tự động thêm từ PostgreSQL)
   JWT_SECRET=your-super-secret-key-here-123456
   NODE_ENV=production
   ```

### Bước 4: Deploy Frontend trên Vercel

Tương tự như Cách 1, Bước 3.

---

## ✅ Sau khi Deploy

### Test các chức năng:
1. Truy cập `https://your-app.vercel.app/admin`
2. Đăng nhập với tài khoản admin (cần seed data trước)
3. Kiểm tra tất cả 10 module admin

### Seed dữ liệu mẫu:
```bash
# Chạy seed script từ backend
npx prisma db seed
```

### Tài khoản Admin mặc định:
- **Email**: admin@youth.com
- **Password**: 123456

---

## 🔒 Bảo mật Production

1. **Thay đổi JWT_SECRET** thành chuỗi ngẫu nhiên dài
2. **Cấu hình CORS** trong backend để chỉ cho phép domain frontend
3. **Bật HTTPS** (Vercel/Render tự động làm)
4. **Backup database** định kỳ

---

## 📱 Build Mobile App

Sau khi deploy xong web, build app mobile:

```bash
# Cập nhật API URL trong app
# Sửa file lib/api.ts hoặc .env

# Build cho Android
set BUILD_TARGET=mobile
pnpm build:mobile
cd android
./gradlew assembleRelease
```

File APK: `android/app/build/outputs/apk/release/app-release.apk`
