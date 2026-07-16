# PIK-R MANSEKU

> Backend REST API untuk website organisasi **PIK-R MAN 1 Muara Enim** (PIK-R MANSEKU).  
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
| **MySQL** | Database utama (Pterodactyl) |
| **SQLite** | Database fallback lokal |
| **JWT (jsonwebtoken)** | Autentikasi Admin & Anggota |
| **bcryptjs** | Hashing password |
| **@whiskeysockets/baileys** | WhatsApp Web Bot |
| **Nodemailer** | Pengiriman email SMTP |
| **xlsx** | Export data ke format Excel |
| **pino** | Logger (untuk Baileys) |

---

## 🚀 Memulai (Development)

### Prasyarat
- Node.js v18+
- npm v9+
- (Opsional) MySQL Server (jika ingin menggunakan MySQL, bukan SQLite)

### Instalasi

```bash
# Clone repository
git clone https://github.com/AnakTentara/PIK-R-MANSEKU.git
cd PIK-R-MANSEKU

# Install dependencies
npm install
```

### Konfigurasi

Buat file `.env` di root project (opsional, karena konfigurasi utama tersimpan di database):

```env
PORT=25552
FRONTEND_URL=http://localhost:25553
JWT_SECRET=supersecretkeypikrmanseku123

# (Opsional) Fallback jika MySQL belum dikonfigurasi via dashboard
DATABASE_URL="mysql://root:root@localhost:3306/pikr_manseku"

# (Opsional) Fallback SMTP jika belum dikonfigurasi via dashboard
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=kelulusan@pikr-manseku.my.id
SMTP_PASS=your-smtp-password
SMTP_FROM=kelulusan@pikr-manseku.my.id
```

> **Catatan:** Konfigurasi MySQL dan SMTP **tidak wajib di `.env`**. Anda bisa mengaturnya langsung dari dashboard admin setelah server berjalan.

### Menjalankan Server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:25552`.

### Menghubungkan WhatsApp Bot
Setelah server dijalankan pertama kali, akan muncul **QR Code** di terminal log. Scan QR tersebut menggunakan fitur **Linked Devices** di aplikasi WhatsApp di handphone Anda. Session akan tersimpan otomatis di folder `.baileys_auth/`.

---

## 📡 API Endpoints

### Publik
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/candidates/register` | Daftar sebagai calon anggota |
| `GET` | `/api/candidates/check?nisn={NISN}` | Cek status kelulusan |
| `POST` | `/api/candidates/login` | Login anggota (NISN + Password) |
| `GET` | `/api/blog/posts` | List postingan blog |
| `GET` | `/api/blog/posts/:slug` | Detail postingan & komentar |
| `POST` | `/api/blog/posts/:postId/comments` | Buat komentar |
| `GET` | `/health` | Health check API |

### Admin (Butuh Token JWT di Header `Authorization: Bearer {token}`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/admin/login` | Login admin |
| `GET` | `/api/admin/candidates` | List semua pendaftar |
| `POST` | `/api/admin/candidates` | Tambah pendaftar manual |
| `GET` | `/api/admin/candidates/:id` | Detail pendaftar |
| `PUT` | `/api/admin/candidates/:id` | Edit biodata pendaftar |
| `DELETE` | `/api/admin/candidates/:id` | Hapus pendaftar |
| `POST` | `/api/admin/candidates/generate-passwords` | Auto-generate password massal |
| `GET` | `/api/admin/candidates/export-excel` | Download rekap Excel |
| `GET` | `/api/admin/candidates/export-json` | Download akun JSON |
| `POST` | `/api/admin/candidates/send-notifications` | Kirim notifikasi massal |
| `POST` | `/api/blog/posts` | Buat postingan blog |
| `PUT` | `/api/blog/posts/:id` | Edit postingan blog |
| `DELETE` | `/api/blog/posts/:id` | Hapus postingan blog |
| `DELETE` | `/api/admin/comments/:id` | Hapus komentar |
| `GET` | `/api/admin/settings` | Lihat konfigurasi aktif |
| `PUT` | `/api/admin/settings` | Simpan & terapkan konfigurasi baru |

---

## 🤖 WhatsApp Bot Commands

| Command | Keterangan |
|---|---|
| `/cek [Nama]` | Mencari pendaftar berdasarkan nama. Mendukung pencarian nama mirip. |
| `/cek [NISN]` | Mencari pendaftar berdasarkan NISN. |

**Contoh:**
```
/cek Haikal Mabrur
/cek 3102603365
```

---

## 🔐 Default Admin

Akun admin default dibuat otomatis saat pertama kali server dijalankan:

| Field | Value |
|---|---|
| Username | `pikrmanseku01` |
| Password | `pikrmanseku1me` |

> **Penting:** Ganti password admin Anda segera setelah login pertama kali!

---

## 📁 Dokumentasi Tambahan

- **[target.md](./target.md)** — Roadmap & progress pengembangan
- **[architecture.md](./architecture.md)** — Arsitektur teknis sistem secara detail

---

## 👥 Tentang

Website ini dibuat untuk mendukung administrasi dan rekrutmen anggota organisasi **PIK-R (Pusat Informasi dan Konseling Remaja) MAN 1 Muara Enim**, Sumatera Selatan.

> *"Generasi Berencana, Generasi Berprestasi"*
