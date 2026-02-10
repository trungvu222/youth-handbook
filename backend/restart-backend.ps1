# Script restart backend tự động
# Sử dụng: .\restart-backend.ps1

Write-Host "🔄 Đang dừng tất cả Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null | Out-Null
Start-Sleep -Seconds 2

Write-Host "✓ Đã kill Node processes" -ForegroundColor Green

# Verify port free
$port = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "❌ Port 3001 vẫn bị chiếm. Thử lại..." -ForegroundColor Red
    Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess | 
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

Write-Host "✓ Port 3001 đã sẵn sàng" -ForegroundColor Green
Write-Host "🚀 Khởi động backend..." -ForegroundColor Cyan

# Start backend
Set-Location $PSScriptRoot
npm run dev
