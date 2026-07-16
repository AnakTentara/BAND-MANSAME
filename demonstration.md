# Panduan Demonstrasi Website MANSAME Band
*Dokumen panduan presentasi dan demonstrasi fitur website MANSAME Band kepada Pembina.*

---

## 1. Pendahuluan Sistem
Website **MANSAME Band** dirancang sebagai pusat informasi, pendaftaran anggota baru, dan sistem manajemen ekstrakurikuler musik yang modern dan profesional untuk **MAN 1 Muara Enim**.

### Keunggulan Teknologi & Desain:
*   **Dual-Database Auto-Fallback**: Sistem berjalan menggunakan database MySQL untuk skala produksi, namun otomatis beralih ke SQLite lokal jika koneksi MySQL terputus.
*   **Aesthetics & Responsive Layout**: Menggunakan standar desain UI modern dengan efek *glassmorphism*, gradasi warna dinamis purple, animasi scroll yang responsif.
*   **SEO & Search Indexing**: Dilengkapi dengan `robots.txt`, `sitemap.xml`, dan komponen metadata dinamis `<SEO />` agar website dapat terindeks di Google.

---

## 2. Skenario Demonstrasi Fitur

### 🎬 SKENARIO 1: Halaman Publik
1.  **Beranda (`/`)**: Slideshow hero, statistik anggota, testimoni alumni dengan marquee.
2.  **Tentang Kami (`/kami`)**: Struktur pengurus (Ketua, Wakil, Sekretaris, Bendahara) dan seksi instrumen (Vocalis, Gitarist, Drummer, Bassist, Keyboardist).
3.  **Blog & Berita**: Artikel gaya koran "DAILY BAND", komentar, likes.
4.  **Anggota & Alumni**: Daftar anggota aktif dan testimoni alumni.

### 🎬 SKENARIO 2: Pendaftaran & Seleksi
1.  **Pendaftaran (`/daftar`)**: Form online (NISN, nama, kelas, WA, email, alasan bergabung).
2.  **Cek Kelulusan (`/cek-kelulusan`)**: Animasi loading SNBP-like → reveal status LULUS / TIDAK LULUS / PENDING.
3.  **Login Anggota (`/login`)**: Autentikasi NISN + password.

### 🎬 SKENARIO 3: Dashboard Admin
1.  **Login Admin (`/admin/login`)**: Akses panel administrasi.
2.  **Dashboard**: Statistik pendaftar, anggota aktif, alumni.
3.  **Manajemen Pendaftar**: CRUD, set status kelulusan, export Excel/JSON.
4.  **Notifikasi Massal**: Kirim email & WhatsApp otomatis ke seluruh peserta.
5.  **Web Editor**: Edit konten landing page, visi-misi, dan halaman kustom.
6.  **Manajemen Organisasi**: Kelola kepengurusan per periode.

---

## 3. Informasi Teknis
- **Domain**: https://mansame-band.my.id
- **Backend**: Node.js + Express (Port 25552)
- **Frontend**: React + Vite
- **Database**: MySQL (utama) + SQLite (fallback)
- **WhatsApp Bot**: Baileys (scan QR dari terminal)
