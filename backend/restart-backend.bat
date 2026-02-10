@echo off
echo ==============================================
echo   RESTART BACKEND SERVER
echo ==============================================
echo.

echo [1] Dang dung tat ca Node processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2] Da kill Node processes
echo [3] Khoi dong backend server...
echo.

cd /d "%~dp0"
call npm run dev
