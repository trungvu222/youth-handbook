# 🚀 Backend Quick Start Guide

## Lỗi Port 3001 bị chiếm (EADDRINUSE)?

### Cách 1: Dùng Script Tự Động (Khuyên dùng)
```powershell
cd backend
.\restart-backend.ps1
```

### Cách 2: Manual (Nếu script không chạy)
```powershell
# Bước 1: Kill tất cả Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Bước 2: Đợi 2 giây
Start-Sleep -Seconds 2

# Bước 3: Verify port free
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# Bước 4: Start backend
cd backend
npm run dev
```

### Cách 3: Dùng taskkill (Windows CMD)
```cmd
taskkill /F /IM node.exe /T
timeout /t 2
cd backend
npm run dev
```

## Verify Backend Running

### Check Port 3001
```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen
```

### Test API Endpoint
```powershell
curl http://localhost:3001/api/exams/admin/stats
```
Expect: `401 Unauthorized` (API working, just no auth token)

## Backend URLs
- **Local Development**: `http://localhost:3001`
- **API Base**: `http://localhost:3001/api`
- **Exam API**: `http://localhost:3001/api/exams`
- **Survey API**: `http://localhost:3001/api/surveys`
- **Notification API**: `http://localhost:3001/api/notifications`

## Common Issues

### 1. Port vẫn bị chiếm sau khi kill
```powershell
# Force kill process on port 3001
Get-NetTCPConnection -LocalPort 3001 | 
  Select-Object -ExpandProperty OwningProcess | 
  ForEach-Object { Stop-Process -Id $_ -Force }
```

### 2. Backend không start sau khi kill
```powershell
# Clear npm cache và reinstall
cd backend
rm -r node_modules
npm install
npm run dev
```

### 3. Prisma client out of sync
```powershell
cd backend
npx prisma generate
npm run dev
```

### 4. Database connection error
```powershell
# Check .env file có DATABASE_URL
cat .env | Select-String "DATABASE_URL"

# Test database connection
npx prisma db push
```

## Development Workflow

1. **First Time Setup**
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

2. **Daily Development**
```powershell
cd backend
npm run dev
```

3. **After Schema Changes**
```powershell
cd backend
npx prisma generate
npx prisma db push
npm run dev
```

4. **If Port Issues**
```powershell
cd backend
.\restart-backend.ps1
```

## Quick Commands Cheat Sheet

| Task | Command |
|------|---------|
| Start backend | `npm run dev` |
| Restart backend | `.\restart-backend.ps1` |
| Kill all Node | `Get-Process node \| Stop-Process -Force` |
| Check port 3001 | `Get-NetTCPConnection -LocalPort 3001` |
| Regenerate Prisma | `npx prisma generate` |
| Sync database | `npx prisma db push` |
| View database | `npx prisma studio` |

## Backend Status Indicators

✅ **Running Successfully**
```
[nodemon] starting `node src/index.js`
✅ Database connected successfully
🔗 Server is running on port 3001
```

❌ **Port Conflict**
```
❌ Server error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```
**Fix**: Run `.\restart-backend.ps1`

❌ **Database Connection Error**
```
❌ Database connection failed
```
**Fix**: Check `.env` DATABASE_URL

❌ **Prisma Client Not Generated**
```
Cannot find module '@prisma/client'
```
**Fix**: Run `npx prisma generate`
