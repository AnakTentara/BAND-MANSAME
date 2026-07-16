# 🏗️ Architecture

Dokumen ini menjelaskan arsitektur teknis backend website MANSAME Band secara menyeluruh.

---

## Gambaran Umum Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│   Browser (Frontend)           WhatsApp (User)                   │
│   Port 25553                   Command: /cek                     │
└──────────────────┬──────────────────────────┬────────────────────┘
                   │ HTTP/REST                │ Baileys WS
                   ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                  │
│                         Port 25552                               │
│                                                                   │
│   ┌────────────────┐   ┌───────────────┐   ┌─────────────────┐  │
│   │  REST API      │   │  WhatsApp Bot │   │  Email Service  │  │
│   │  (Express)     │   │  (Baileys)    │   │  (Nodemailer)   │  │
│   └───────┬────────┘   └──────┬────────┘   └────────┬────────┘  │
│           │                   │                      │            │
│           └───────────────────┼──────────────────────┘            │
│                               ▼                                   │
│                    ┌──────────────────┐                           │
│                    │  Prisma ORM      │                           │
│                    │  (DB Layer)      │                           │
│                    └────────┬─────────┘                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
   ┌─────────────────────┐       ┌─────────────────────┐
   │  MySQL (Utama)      │       │  SQLite (Fallback)   │
   │  Pterodactyl DB     │       │  local.db            │
   │  (jika tersedia)    │       │  (selalu aktif)      │
   └─────────────────────┘       └─────────────────────┘
```

---

## Struktur Direktori

```
MANSAME-Band/
│
├── prisma/
│   ├── schema.prisma          # Skema Prisma untuk MySQL
│   └── sqlite.prisma          # Skema Prisma untuk SQLite
│
├── src/
│   ├── config/
│   │   ├── db.js              # Dynamic DB init (MySQL/SQLite fallback)
│   │   └── mail.js            # Nodemailer dengan config dinamis dari DB
│   │
│   ├── controllers/
│   │   ├── admin.js           # Login, CRUD kandidat, export, settings
│   │   ├── candidates.js      # Registrasi publik, cek status, login anggota
│   │   └── blog.js            # CRUD post & komentar
│   │
│   ├── middlewares/
│   │   └── auth.js            # JWT Auth middleware (Admin & Candidate)
│   │
│   ├── routes/
│   │   ├── admin.js           # /api/admin/*
│   │   ├── candidates.js      # /api/candidates/*
│   │   └── blog.js            # /api/blog/*
│   │
│   ├── services/
│   │   ├── whatsapp.js        # Baileys client + handler /cek
│   │   └── notification.js    # Logic pengiriman notifikasi massal & revisi
│   │
│   ├── utils/
│   │   └── similarity.js      # Algoritma Dice Coefficient + word matching
│   │
│   └── server.js              # Entrypoint: Express setup, DB init, seed admin
│
├── .baileys_auth/             # Session WhatsApp Web (di-gitignore)
├── local.db                   # SQLite database lokal (di-gitignore)
├── .env                       # Environment fallback (di-gitignore)
├── .gitignore
├── package.json
├── target.md
├── architecture.md
└── README.md
```

---

## Komponen Utama

### 1. Dynamic Database (`src/config/db.js`)
- Pada setiap startup, sistem mencoba membaca konfigurasi MySQL dari tabel `Setting` di SQLite.
- Jika konfigurasi ada dan MySQL berhasil dijangkau → pindah ke **MySQL** sebagai database aktif.
- Jika MySQL off atau belum dikonfigurasi → tetap pakai **SQLite** (`local.db`) sebagai fallback.
- Menggunakan **JavaScript `Proxy`** untuk membungkus instance Prisma secara dinamis tanpa perlu import ulang di setiap controller.
- Admin bisa mengubah konfigurasi MySQL di dashboard kapan saja, dan server akan langsung mencoba koneksi baru tanpa perlu restart.

### 2. WhatsApp Bot (`src/services/whatsapp.js`)
- Menggunakan `@whiskeysockets/baileys` untuk menghubungkan ke WhatsApp Web.
- QR Code untuk scan device dicetak langsung di terminal saat pertama kali dijalankan.
- Session tersimpan di folder `.baileys_auth/` sehingga tidak perlu scan ulang setiap restart.
- Handler pesan `/cek`:
  - **Input berupa angka** → Cari berdasarkan NISN (exact match).
  - **Input berupa teks** → Cari nama menggunakan algoritma kemiripan string (Dice Coefficient + Word Containment) di `src/utils/similarity.js`.
  - Mengembalikan link cek kelulusan: `https://mansame-band.my.id/cek-kelulusan?nisn={NISN}`

### 3. Autentikasi (`src/middlewares/auth.js`)
- **Admin**: Login via `POST /api/admin/login` → mendapatkan **JWT Token** berlaku 7 hari. Semua route `/api/admin/*` (kecuali `/login`) membutuhkan token ini di header `Authorization: Bearer {token}`.
- **Anggota/Kandidat**: Login via `POST /api/candidates/login` menggunakan NISN + Password. Mendapatkan JWT Token untuk mengakses route profilnya sendiri.

### 4. Notifikasi (`src/services/notification.js`)
- Dipanggil saat admin menekan tombol "Kirim" di dashboard.
- Mengambil semua kandidat dengan status `LULUS` atau `TIDAK LULUS`.
- **Pencocokan Revisi**: Jika `candidate.status !== candidate.lastStatus` dan sudah pernah dinotifikasi sebelumnya → kirim email & WA dengan label **REVISI**.
- Setelah pengiriman berhasil, field `emailNotified`, `waNotified`, dan `lastStatus` di database diperbarui.
- SMTP credentials dimuat secara dinamis dari database (`Setting.SMTP_CONFIG`) lewat `src/config/mail.js`.

### 5. Blog (`src/controllers/blog.js`)
- Post hanya bisa dibuat/diedit/dihapus oleh admin (JWT protected).
- Komentar bisa dibuat siapa saja tanpa login (hanya perlu mengisi nama/username).
- Admin bisa menghapus komentar yang tidak pantas.
- Fitur pagination, search, dan slug unik otomatis pada setiap post.

---

### Skema Database

### Model `Candidate`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| nisn | String | Unik, digunakan sebagai ID login anggota |
| name | String | Nama lengkap |
| className | String | Kelas |
| whatsappNumber | String | Nomor WA untuk notifikasi |
| email | String | Email untuk notifikasi |
| gender | String | Jenis kelamin |
| asalSekolah | String | Asal sekolah sebelumnya (default "-") |
| reason | Text | Alasan bergabung |
| status | Enum | `PENDING` / `LULUS` / `TIDAK_LULUS` |
| photoPath | String? | Path foto pendaftar |
| password | String? | Hashed password (opsional, di-generate admin) |
| plainPassword | String? | Plaintext password (untuk export JSON oleh admin) |
| emailNotified | Boolean | Status kirim email |
| waNotified | Boolean | Status kirim WA |
| lastStatus | Enum | Status terakhir saat notifikasi dikirim (untuk deteksi revisi) |

### Model `Member`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| nisn | String | Unik, NISN anggota tetap (username login) |
| name | String | Nama lengkap anggota |
| className | String | Kelas aktif |
| whatsappNumber | String | Nomor WA aktif |
| email | String | Email aktif |
| gender | String | Jenis kelamin |
| asalSekolah | String | Asal sekolah SMP/MTS sebelumnya |
| password | String | Hashed password login portal |
| plainPassword | String? | Plaintext password untuk kemudahan admin |
| status | Enum | `ACTIVE` / `ALUMNI` (auto-expire status ke alumni setelah 3-1 tahun) |
| joinYear | Int | Tahun bergabung (default 2026) |
| role | String | Hak akses portal (`member` / `PEMBINA` / `KETUA` / `WAKIL` / `KABINET`) |
| photoPath | String? | Path foto profil anggota tetap (bisa diunggah admin) |
| orgMember | OrgMember? | Hubungan back-relation ke model OrgMember |

### Model `OrgMember`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| name | String | Nama lengkap pengurus |
| role | String | Peran divisi (`PEMBINA`, `KETUA`, `WAKIL`, `KABINET`, `ANGGOTA`) |
| jabatan | String | Jabatan spesifik (e.g. "Ketua MedInfo", "Pembina", dsb.) |
| yearStart | Int | Tahun mulai menjabat |
| yearEnd | Int? | Tahun selesai menjabat (null jika masih aktif menjabat) |
| isCurrent | Boolean | Status keaktifan kepengurusan saat ini |
| photoPath | String? | Path foto mandiri (hanya dipakai jika statusnya orphan/tanpa akun) |
| quote | Text? | Kutipan kata motivasi / sambutan pengurus |
| memberId | UUID? | Kunci asing (FK) terhubung ke model `Member.id` (Unik, Nullable) |
| member | Member? | Relasi data anggota terhubung |

### Model `AlumniTestimonial`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| name | String | Nama lengkap alumni |
| angkatan | String | Angkatan kelulusan (e.g., "2024") |
| photoPath | String? | Path foto alumni |
| content | Text | Isi kutipan testimoni alumni |

### Model `Admin`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| username | String | Unik (e.g., super admin `band-mansame`) |
| password | String | Hashed (bcrypt) |
| role | String | `DEVELOPER` / `KABINET_UMUM` / `MEDINFO` |

### Model `Post`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| title | String | Judul postingan |
| slug | String | Unik, URL-friendly |
| content | LongText | Isi postingan (markdown/HTML) |
| authorId | UUID | Foreign key ke Admin |

### Model `Comment`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| postId | UUID | Foreign key ke Post |
| username | String | Nama pengunjung atau nama kandidat/anggota terautentikasi |
| content | Text | Isi komentar |

### Model `Setting`
| Field | Tipe | Keterangan |
|---|---|---|
| key | String | Primary key (e.g. `MYSQL_CONFIG`, `SMTP_CONFIG`, `REGISTRATION_SESSION`) |
| value | Text | JSON string berisi konfigurasi |

---

## Port & CORS

| Service | Port |
|---|---|
| Backend API | `25552` |
| Frontend (rencana) | `25553` |

CORS dikonfigurasi untuk mengizinkan request dari `http://localhost:25553` dan `https://mansame-band.my.id`.
