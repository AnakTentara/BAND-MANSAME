@echo off
title PIK-R MANSEKU — Automation Startup Script

echo ==========================================
echo [1/5] Memulai Git Pull
echo ==========================================
git pull
if %errorlevel% neq 0 (
  echo Warning: Git pull gagal. Melanjutkan dengan kode lokal...
) else (
  echo Git pull berhasil.
)
echo.

echo ==========================================
echo [2/5] Menginstal Dependensi Backend
echo ==========================================
call npm install
if %errorlevel% neq 0 (
  echo Error: Gagal menginstal dependensi backend.
  pause
  exit /b %errorlevel%
)
echo Dependensi backend berhasil diinstal.
echo.

echo ==========================================
echo [3/5] Menginstal Dependensi Frontend
echo ==========================================
cd frontend
call npm install
if %errorlevel% neq 0 (
  echo Error: Gagal menginstal dependensi frontend.
  cd ..
  pause
  exit /b %errorlevel%
)
cd ..
echo Dependensi frontend berhasil diinstal.
echo.

echo ==========================================
echo [4/5] Men-generate Prisma Client
echo ==========================================
call npx prisma generate
if %errorlevel% neq 0 (
  echo Warning: Gagal men-generate Prisma Client.
) else (
  echo Prisma Client berhasil di-generate.
)
echo.

echo ==========================================
echo [5/5] Menjalankan Backend ^& Frontend (Concurrently)
echo ==========================================
echo Backend  : http://localhost:25552
echo Frontend : http://localhost:25551
echo Tekan Ctrl+C untuk menghentikan kedua server.
echo.

npx concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npm run dev" "cd frontend && npm run dev"
pause
