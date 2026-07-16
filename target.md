# 🎯 Target & Roadmap

Dokumen ini berisi target pengembangan website MANSAME Band secara keseluruhan, dibagi berdasarkan fase dan prioritas.

---

## ✅ Fase 1 — Backend API (SELESAI)

- [x] Inisialisasi project Node.js (ES Modules, Express)
- [x] Dynamic multi-database: MySQL (utama) + SQLite (fallback otomatis)
- [x] Konfigurasi MySQL & SMTP tersimpan di database secara real-time
- [x] Prisma ORM dengan skema MySQL & SQLite
- [x] REST API Pendaftaran Calon Anggota MANSAME Band
  - [x] Form pendaftaran publik (NISN, Nama, Kelas, WA, Email, Gender, Alasan)
  - [x] Cek status kelulusan berbasis NISN (SNBP-like)
  - [x] Login anggota menggunakan NISN + Password
  - [x] Edit biodata diri sendiri
- [x] REST API Admin Dashboard
  - [x] Login admin (JWT Authentication)
  - [x] CRUD lengkap data pendaftar & Anggota Tetap (Member)
  - [x] Set status LULUS / TIDAK LULUS / PENDING
  - [x] Auto-generate password sederhana untuk semua akun
  - [x] Export data ke Excel (`.xlsx`)
  - [x] Export akun anggota ke JSON
  - [x] Kelola Pengaturan (MySQL & SMTP) secara real-time
- [x] Sistem Blog lengkap
  - [x] CRUD Post oleh Admin
  - [x] Komentar publik tanpa autentikasi (cukup nama)
  - [x] Admin bisa hapus komentar
- [x] Notifikasi Massal
  - [x] Email pengumuman kelulusan dinamis
  - [x] Notifikasi WhatsApp via bot
  - [x] Deteksi revisi status & kirim notifikasi revisi otomatis
- [x] WhatsApp Bot (Baileys)
  - [x] Command `/cek [Nama]` dengan algoritma string similarity
  - [x] Command `/cek [NISN]` untuk pencarian eksak
  - [x] Saran nama mirip jika tidak ditemukan persis
- [x] Deployment-ready untuk Pterodactyl (Port `25552`)
- [x] Git repository terhubung ke GitHub

---

## ✅ Fase 2 — Frontend Website (SELESAI)

### Halaman Publik
- [x] **Beranda (Landing Page)** — Profil singkat MANSAME Band, Hero Section yang menawan dengan CTA Pendaftaran, ulasan testimoni alumni (modal glassmorphism).
- [x] **Halaman Tentang Kami** — Struktur pimpinan & pengurus per divisi dengan dropdown statis yang selalu terbuka untuk Staff Divisi.
- [x] **Halaman Pendaftaran** — Form pendaftaran online yang interaktif.
- [x] **Halaman Cek Kelulusan** — Tampilan minimalis beranimasi (SNBP-like) dengan feedback kelulusan dinamis.
- [x] **Portal Blog & Berita** — Tata letak artikel layaknya koran cetak dengan Drop-Cap, Zoom Effect, pencarian artikel, dan pembacaan waktu estimasi membaca.
- [x] **Login Anggota / Calon Anggota** — Autentikasi NISN + password untuk masuk ke portal mandiri.
- [x] **Profil Anggota** — Tampilan responsif berisi biodata lengkap, edit profil langsung, tab postingan (Disukai, Disimpan, Komentar), dan unduh Kartu Anggota.

### Halaman Admin Dashboard
- [x] **Login Admin** — Login aman menggunakan username & password.
- [x] **Dashboard Overview** — Statistik pendaftar (lulus, tidak lulus, pending), jumlah anggota aktif, dan alumni.
- [x] **Manajemen Pendaftar & Anggota** — CRUD lengkap pendaftar, edit status kelulusan, dan unduh data Excel/JSON.
- [x] **Manajemen Struktur Organisasi (Org)** — Pengaturan kepengurusan per periode, tautkan pengurus langsung ke akun Anggota (`Member.id`), sinkronisasi role & foto profil.
- [x] **Web Editor Dinamis** — Ubah informasi landing page, vis-misi, biodata, logo website, dan kelola halaman kustom (custom page).
- [x] **Manajemen Artikel Blog & Komentar** — Rich text editor Tiptap terintegrasi dengan upload gambar tanpa freeze, moderation komentar (hapus komentar).

---

## ✅ Fase 3 — Penyempurnaan & Produksi (SELESAI)

- [x] Rate limiting pada API publik (mencegah spam pendaftaran)
- [x] Validasi NISN ketat (10 digit angka)
- [x] Pagination, search, dan filter (kelas/angkatan) pada daftar anggota admin
- [x] Custom domain setup & CORS allowance
- [x] Backup database SQLite satu kali klik langsung dari Dashboard Developer Settings
- [x] Scrollbar minimalis bertema glassmorphism & elastis micro-animations pada tombol
- [x] Kartu Anggota Digital berformat PNG premium, digambar dinamis via HTML5 Canvas dengan motto baru *"Kreativitas, Harmoni, Prestasi"*
- [x] Aksi komentar blog lengkap (Like, Share, Edit, Hapus) dengan integrasi cache guest & candidate sync
- [x] Keamanan super admin: Proteksi akun utama `mansame-admin` agar tidak bisa dihapus atau diubah rolenya
- [x] Unifikasi akun universal untuk Pembina, Pengurus, dan Anggota Biasa (1 Orang = 1 Akun)

