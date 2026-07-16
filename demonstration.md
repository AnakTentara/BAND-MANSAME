# Panduan Demonstrasi Sistem Informasi PIK-R MANSEKU
*Dokumen panduan presentasi dan demonstrasi fitur website PIK-R MANSEKU kepada Pembina.*

---

## 1. Pendahuluan Sistem
Website **PIK-R MANSEKU** dirancang sebagai pusat informasi, konseling sebaya, dan sistem penerimaan anggota baru (PAB) yang modern dan profesional untuk **MAN 1 Muara Enim**. 

### Keunggulan Teknologi & Desain:
*   **Dual-Database Auto-Fallback**: Sistem berjalan menggunakan database MySQL untuk skala produksi yang cepat, namun otomatis beralih ke SQLite lokal jika koneksi MySQL terputus.
*   **Aesthetics & Responsive Layout**: Menggunakan standar desain UI modern dengan efek *glassmorphism*, gradasi warna dinamis, animasi scroll yang responsif, serta penempatan lencana adaptif (di samping teks pada desktop, dan melayang kompak di atas teks pada mobile).
*   **SEO & Search Indexing**: Dilengkapi dengan berkas `robots.txt`, `sitemap.xml`, dan komponen metadata dinamis `<SEO />` agar website dapat terindeks dengan cepat dan dicari di Google.

---

## 2. Skenario Demonstrasi Fitur (Langkah demi Langkah)

Berikut adalah 3 skenario utama yang dapat Anda tunjukkan kepada Pembina selama sesi demonstrasi:

### 🎬 SKENARIO 1: Pengalaman Pengunjung & Halaman Publik
*Tujuan: Menunjukkan tampilan beranda yang premium, struktur pengurus per divisi, artikel gaya koran, serta daftar anggota aktif.*

1.  **Halaman Beranda (Landing Page) (`/`)**:
    *   Tunjukkan slideshow latar belakang yang dipadu gradasi halus.
    *   Soroti **Lencana Melayang** ("Konseling Sebaya" & "Pendidik Sebaya") di sebelah kanan dan kiri.
    *   *Uji Coba Responsif (Mobile)*: Perkecil browser Anda (atau tunjukkan melalui HP). Perlihatkan bahwa lencana melayang tersebut otomatis bergeser secara rapi dan kompak ke bagian atas tulisan "Selamat Datang di", mencegah bentrokan visual di layar kecil.
    *   Tunjukkan bagian **Apa Kata Alumni**. Klik salah satu kartu testimoni untuk menunjukkan pop-up modal detail dengan efek kaca buram (*background blur*).
2.  **Halaman Tentang Kami (`/kami`)**:
    *   Tunjukkan judul halaman yang memiliki efek gradasi warna oranye-merah.
    *   Perlihatkan bagian **Pimpinan & Pengurus Aktif**: Struktur dibagi berkelompok secara teratur per divisi (misal: MedInfo, Humas, Konselor Sebaya, dll.).
    *   Tunjukkan kartu Ketua Divisi di atas, dan daftar Anggota Divisi di bawahnya yang terbungkus rapi dalam tag-pill oval yang rapi.
3.  **Halaman Artikel ala Koran (`/blog` & `/blog/:slug`)**:
    *   Buka halaman `/blog`. Tunjukkan desain masthead klasik surat kabar cetak, garis ganda, tanggal terbit, serta teks berita rata kanan-kiri (*justified*).
    *   Buka detail artikel untuk memperlihatkan huruf pertama paragraf utama yang berukuran besar (*drop-cap*) bergaya redaksi premium.
4.  **Halaman Daftar Anggota Publik (`/anggota`)**:
    *   Tunjukkan daftar lengkap seluruh anggota resmi PIK-R MANSEKU.
    *   Soroti informasi jabatan spesifik (seperti "Ketua MedInfo" atau "Anggota Humas") yang otomatis tampil di samping nama anggota di halaman ini, bukan sekadar tulisan anggota biasa.

---

### 🎬 SKENARIO 2: Portal Anggota (Pengunggahan Foto Profil)
*Tujuan: Menunjukkan kemudahan anggota dalam mengelola profil pribadi dan mengunggah foto.*

1.  **Login Anggota (`/login`)**:
    *   Masuk menggunakan salah satu NISN anggota terdaftar dan kata sandi dari admin.
2.  **Halaman Profil Mandiri (`/profil`)**:
    *   Perlihatkan status kelulusan pendaftaran (LULUS) dan biodata anggota.
    *   Klik tombol **Edit Profil**.
    *   Pilih berkas foto profil baru melalui tombol **Pilih Foto Profil**. Preview foto akan langsung muncul di dalam lingkaran avatar secara dinamis.
    *   Klik **Simpan Perubahan**.
3.  **Verifikasi Sinkronisasi Otomatis**:
    *   Kembali ke halaman publik `/anggota`.
    *   Tunjukkan bahwa inisial nama anggota tersebut kini telah otomatis berubah menjadi foto profil asli yang baru saja diunggah, lengkap dengan jabatannya.

---

### 🎬 SKENARIO 3: Dashboard Administrator & Manajemen Struktur (`/admin`)
*Tujuan: Menunjukkan kontrol penuh admin terhadap konten web dan kepengurusan.*

1.  **Login Admin (`/admin/login`)**:
    *   Masuk menggunakan akun Administrator utama.
2.  **Pengurus Organisasi (`/admin/org`)**:
    *   Tunjukkan tombol **"Tambah Pengurus"** (untuk siswa terdaftar) dan tombol **"Tambah Pembina"** (khusus non-anggota/guru).
    *   *Klik "Tambah Pembina"*: Tunjukkan bahwa kolom Nama Lengkap dapat diinput manual secara bebas, dan jabatannya otomatis dikunci ke pilihan "Pembina".
    *   *Klik "Tambah Pengurus"*: Tunjukkan bahwa admin tidak mengetik nama manual, melainkan wajib memilih anggota aktif dari dropdown daftar siswa PIK-R, lalu memilih jabatannya (seperti Sekretaris, Ketua MedInfo, dll.). Ini meminimalkan kesalahan ketik nama.
3.  **Web Editor Dinamis (`/admin/web-editor`)**:
    *   Tunjukkan bagaimana admin dapat dengan mudah mengubah teks sambutan Hero, visi-misi, serta biodata organisasi secara langsung tanpa menyentuh kode program.
    *   Tunjukkan fitur **Halaman Kustom** (`/p/:slug`) di mana admin dapat membuat halaman baru hanya dengan menuliskan kode HTML/CSS di editor.
4.  **Halaman Editor Artikel (`/admin/blog/new`)**:
    *   Tunjukkan bahwa halaman pembuatan artikel baru kini sangat responsif, lancar diisi teks, diformat (Tebal, Miring, Heading, Bullet, Link), serta dapat mengunggah gambar langsung ke editor tanpa membeku/freeze.
5.  **Manajemen Pendaftaran (`/admin/pendaftaran`)**:
    *   Perlihatkan status pendaftaran yang dapat dibuka/ditutup secara instan.
    *   Tunjukkan tombol ekspor data pendaftar ke berkas **Excel (.xlsx)** dalam satu kali klik.

---

## 3. Penanganan Kasus Halaman Error 404
*Tujuan: Memamerkan penanganan kesalahan tautan yang ramah pengguna.*

*   Cobalah untuk mengetikkan URL acak di browser (misalnya: `https://pikr-manseku.my.id/halaman-salah`).
*   Tunjukkan tampilan halaman **404 Halaman Tidak Ditemukan** yang bertema kaca transparan (*glassmorphism*) dengan animasi pendar pendar cahaya lembut di belakangnya, lengkap dengan tombol **Kembali ke Beranda** yang interaktif.
