# MANSAME Band

> Backend REST API untuk website ekstrakurikuler **MANSAME Band** (MAN 1 Muara Enim).  
> Dibangun dengan Node.js + Express, mendukung dynamic database (MySQL/SQLite), WhatsApp Bot, dan sistem notifikasi email massal.

---

## ✨ Fitur Utama

- **📋 Pendaftaran Calon Anggota** — Form pendaftaran publik berbasis NISN
- **🏆 Pengumuman Kelulusan (SNBP-Like)** — Cek status LULUS/TIDAK LULUS menggunakan NISN
- **👤 Akun Anggota** — Login menggunakan NISN + Password, edit biodata sendiri
- **🛡️ Dashboard Admin** — CRUD pendaftar, set status kelulusan, export data
- **📢 Notifikasi Massal** — Email & WhatsApp otomatis ke seluruh peserta saat pengumuman
- **🔄 Notifikasi Revisi** — Jika status diubah, notifikasi revisi otomatis terkirim
- **🤖 WhatsApp Bot** — Command `/cek [Nama/NISN]` dengan pencarian nama mirip (fuzzy matching)
- **📝 Blog** — CRUD postingan oleh admin, komentar publik tanpa login
- **📊 Export Data** — Export ke Excel (`.xlsx`) dan JSON
- **🗄️ Dynamic Database** — Otomatis fallback ke SQLite jika MySQL offline/belum dikonfigurasi
- **⚙️ Pengaturan Real-time** — Konfigurasi MySQL & SMTP dari dashboard admin tanpa restart server

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | HTTP Server & Router |
| **Prisma ORM** | Database management (MySQL & SQLite) |
| **MySQL** | Database utama |
| **SQLite** | Database fallback lokal |
| **JWT (jsonwebtoken)** | Autentikasi Admin & Anggota |
| **bcryptjs** | Hashing password |
| **@whiskeysockets/baileys** | WhatsApp Web Bot |
| **Nodemailer** | Pengiriman email SMTP |
| **xlsx** | Export data ke format Excel |
| **React + Vite** | Frontend SPA |

---

## 🚀 Memulai (Development)

### Prasyarat
- Node.js v18+
- npm v9+
- (Opsional) MySQL Server

### Instalasi

```bash
# Clone repository
git clone https://github.com/AnakTentara/BAND-MANSAME.git
cd BAND-MANSAME

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### Menjalankan Server

```bash
# Development
npm run dev

# Atau gunakan script otomatis
./run.bat
```

Server akan berjalan dan frontend akan di-build otomatis.

---

## 🔐 Default Admin

| Field | Value |
|---|---|
| Username | `band-mansame` |
| Password | `bandmansame2026==` |

> **Penting:** Ganti password admin Anda segera setelah login pertama kali!

---

## 📁 Dokumentasi Tambahan

- **[target.md](./target.md)** — Roadmap & progress pengembangan
- **[architecture.md](./architecture.md)** — Arsitektur teknis sistem secara detail

---

## 👥 Tentang

Website ini dibuat untuk mendukung administrasi dan rekrutmen anggota ekstrakurikuler **MANSAME Band** di **MAN 1 Muara Enim**, Sumatera Selatan.

> *"Kreativitas, Harmoni, Prestasi"*
