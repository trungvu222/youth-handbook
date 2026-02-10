@echo off
echo ====================================
echo STARTING YOUTH HANDBOOK BACKEND
echo ====================================
cd /d "%~dp0"
set PORT=3001
set NODE_ENV=development
echo PORT=%PORT%
echo NODE_ENV=%NODE_ENV%
echo.
node src\index.js
pause
