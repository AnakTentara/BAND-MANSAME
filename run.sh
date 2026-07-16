#!/bin/bash

# ==========================================
# PIK-R MANSEKU — Automation Startup Script
# ==========================================

# Color codes for clean console styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== [1/5] Memulai Git Pull untuk Sinkronisasi Kode ===${NC}"
git pull
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Git pull gagal. Melanjutkan dengan kode lokal saat ini...${NC}"
else
  echo -e "${GREEN}Git pull berhasil selesai.${NC}"
fi

echo ""
echo -e "${BLUE}=== [2/5] Menginstal Dependensi Backend ===${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Gagal menginstal dependensi backend. Proses dihentikan.${NC}"
  exit 1
fi
echo -e "${GREEN}Dependensi backend berhasil diinstal.${NC}"

echo ""
echo -e "${BLUE}=== [3/5] Menginstal Dependensi Frontend ===${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Gagal menginstal dependensi frontend. Proses dihentikan.${NC}"
  exit 1
fi
cd ..
echo -e "${GREEN}Dependensi frontend berhasil diinstal.${NC}"

echo ""
echo -e "${BLUE}=== [4/5] Sinkronisasi Database (Prisma Client Generate) ===${NC}"
echo -e "${YELLOW}Menjalankan postinstall script secara manual...${NC}"
node node_modules/@prisma/client/scripts/postinstall.js
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal menjalankan Prisma postinstall script.${NC}"
fi

echo -e "${YELLOW}Men-generate client SQLite lokal...${NC}"
npx prisma generate --schema=prisma/sqlite.prisma
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal men-generate client SQLite.${NC}"
fi
echo -e "${YELLOW}Menyelaraskan tabel database SQLite lokal (db push)...${NC}"
npx prisma db push --schema=prisma/sqlite.prisma --accept-data-loss
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal melakukan db push pada SQLite.${NC}"
fi
echo -e "${YELLOW}Men-generate client MySQL...${NC}"
npx prisma generate --schema=prisma/schema.prisma
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal men-generate client MySQL.${NC}"
fi
echo -e "${GREEN}Prisma Client untuk SQLite & MySQL berhasil di-generate.${NC}"

echo ""
echo -e "${BLUE}=== [5/5] Menjalankan Backend & Frontend Secara Bersamaan ===${NC}"
echo -e "${YELLOW}Backend: http://localhost:25552${NC}"
echo -e "${YELLOW}Frontend: http://localhost:25551${NC}"
echo -e "${BLUE}Menghubungkan console log... Tekan Ctrl+C untuk menghentikan kedua server.${NC}"
echo ""

# Use concurrently (forcing non-interactive install confirmation with -y)
npx -y concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  "npm run dev" \
  "cd frontend && npm run dev"
