import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registerCandidate, getPublicSettings } from '@/api/candidates';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '@/components/common/SEO';
import styles from './RegisterPage.module.css';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((tingkat) => {
  const maxClass = tingkat === 'X' ? 9 : 8;
  for (let i = 1; i <= maxClass; i++) {
    KELAS_OPTIONS.push(`${tingkat}-${i}`);
  }
});

const INITIAL = {
  nisn: '',
  name: '',
  className: '',
  whatsappNumber: '',
  email: '',
  gender: '',
  asalSekolah: '',
  reason: '',
};

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await getPublicSettings();
        if (res.data?.registrationSession) {
          setIsSessionOpen(res.data.registrationSession.status === 'open');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  if (checkingSession) {
    return (
      <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  if (!isSessionOpen) {
    return (
      <div className="container" style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBlock: 'var(--space-2xl)' }}>
        <SEO title="Pendaftaran Ditutup" description="Maaf, sesi pendaftaran anggota baru MANSAME Band saat ini sedang ditutup oleh pihak administrasi. Silakan pantau pengumuman resmi kami untuk sesi berikutnya." />
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>Pendaftaran Ditutup</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Maaf, sesi pendaftaran anggota baru MANSAME Band saat ini sedang ditutup oleh pihak administrasi. Silakan pantau pengumuman resmi kami untuk sesi berikutnya.
          </p>
          <Link to="/" className="btn btn-secondary" style={{ width: 'auto', alignSelf: 'center' }}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nisn || form.nisn.length !== 10 || !/^\d+$/.test(form.nisn))
      errs.nisn = 'NISN harus 10 digit angka.';
    if (!form.name.trim()) errs.name = 'Nama lengkap wajib diisi.';
    if (!form.className) errs.className = 'Pilih kelas.';
    if (!form.whatsappNumber.trim()) errs.whatsappNumber = 'Nomor WA wajib diisi.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Email tidak valid.';
    if (!form.gender) errs.gender = 'Pilih jenis kelamin.';
    if (!form.asalSekolah.trim()) errs.asalSekolah = 'Asal Sekolah SMP/MTs/Sederajat wajib diisi.';
    if (!form.reason.trim() || form.reason.trim().length < 20)
      errs.reason = 'Alasan minimal 20 karakter.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerCandidate(form);
      toast.success('Pendaftaran berhasil!');
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan.';
      if (err.response?.status === 409) {
        setErrors((prev) => ({ ...prev, nisn: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <SEO title="Pendaftaran Berhasil" description="Selamat! Pendaftaran online Anda sebagai calon anggota baru MANSAME Band berhasil terkirim." />
        <section className="section">
          <div className={`container ${styles.successCard}`}>
            <CheckCircle size={56} className={styles.successIcon} />
            <h2 className={styles.successTitle}>Pendaftaran Berhasil!</h2>
            <p className={styles.successMsg}>
              Data kamu telah berhasil dikirim. Silakan tunggu pengumuman seleksi
              melalui email atau WhatsApp yang telah didaftarkan.
            </p>
            <a href="/cek-kelulusan" className="btn btn-primary">
              Cek Status Kelulusan
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <SEO title="Pendaftaran Anggota Baru" description="Formulir pendaftaran online calon anggota baru MANSAME Band MAN 1 Muara Enim. Daftarkan dirimu dan jadilah bagian dari petualangan musik kami!" />
      <section className="section">
        <div className={`container ${styles.grid}`}>
          {/* Form */}
          <div className={styles.formSide}>
            <h1 className={styles.title}>Pendaftaran Anggota Baru</h1>
            <p className={styles.subtitle}>
              Isi formulir di bawah untuk mendaftar sebagai calon anggota MANSAME Band.
            </p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* NISN */}
              <div className="form-group">
                <label className="form-label" htmlFor="nisn">NISN</label>
                <input
                  id="nisn"
                  name="nisn"
                  type="text"
                  maxLength={10}
                  className={`form-input ${errors.nisn ? 'error' : ''}`}
                  placeholder="Masukkan 10 digit NISN"
                  value={form.nisn}
                  onChange={handleChange}
                />
                {errors.nisn && <span className="form-error">{errors.nisn}</span>}
              </div>

              {/* Nama */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nama Lengkap</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Nama sesuai dokumen resmi"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Kelas */}
              <div className="form-group">
                <label className="form-label" htmlFor="className">Kelas</label>
                <select
                  id="className"
                  name="className"
                  className={`form-select ${errors.className ? 'error' : ''}`}
                  value={form.className}
                  onChange={handleChange}
                >
                  <option value="">— Pilih Kelas —</option>
                  {KELAS_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                {errors.className && <span className="form-error">{errors.className}</span>}
              </div>

              {/* No WA */}
              <div className="form-group">
                <label className="form-label" htmlFor="whatsappNumber">No. WhatsApp</label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="text"
                  className={`form-input ${errors.whatsappNumber ? 'error' : ''}`}
                  placeholder="08xxxxxxxxxx"
                  value={form.whatsappNumber}
                  onChange={handleChange}
                />
                {errors.whatsappNumber && <span className="form-error">{errors.whatsappNumber}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">Jenis Kelamin</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value="Laki-laki"
                      checked={form.gender === 'Laki-laki'}
                      onChange={handleChange}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioText}>Laki-laki</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value="Perempuan"
                      checked={form.gender === 'Perempuan'}
                      onChange={handleChange}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioText}>Perempuan</span>
                  </label>
                </div>
                {errors.gender && <span className="form-error">{errors.gender}</span>}
              </div>

              {/* Asal Sekolah */}
              <div className="form-group">
                <label className="form-label" htmlFor="asalSekolah">Asal Sekolah SMP/MTs/Sederajat</label>
                <input
                  id="asalSekolah"
                  name="asalSekolah"
                  type="text"
                  className={`form-input ${errors.asalSekolah ? 'error' : ''}`}
                  placeholder="Misal: SMPN 1 Muara Enim, MTsN 1 Muara Enim"
                  value={form.asalSekolah}
                  onChange={handleChange}
                />
                {errors.asalSekolah && <span className="form-error">{errors.asalSekolah}</span>}
              </div>

              {/* Alasan */}
              <div className="form-group">
                <label className="form-label" htmlFor="reason">Alasan Bergabung</label>
                <textarea
                  id="reason"
                  name="reason"
                  className={`form-textarea ${errors.reason ? 'error' : ''}`}
                  placeholder="Ceritakan motivasi dan alasan kamu ingin bergabung dengan MANSAME Band..."
                  value={form.reason}
                  onChange={handleChange}
                />
                {errors.reason && <span className="form-error">{errors.reason}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading && <span className="spinner" />}
                {loading ? 'Mengirim...' : 'Daftar Sekarang'}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className={styles.infoSide}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Informasi Pendaftaran</h3>
              <ul className={styles.infoList}>
                <li className={styles.infoItem}>
                  <AlertCircle size={14} />
                  Pendaftaran terbuka untuk seluruh siswa MAN 1 Muara Enim.
                </li>
                <li className={styles.infoItem}>
                  <AlertCircle size={14} />
                  Pastikan NISN yang dimasukkan valid dan sesuai data sekolah.
                </li>
                <li className={styles.infoItem}>
                  <AlertCircle size={14} />
                  Gunakan nomor WhatsApp aktif untuk menerima notifikasi seleksi.
                </li>
                <li className={styles.infoItem}>
                  <AlertCircle size={14} />
                  Hasil seleksi akan diumumkan melalui email dan WhatsApp.
                </li>
                <li className={styles.infoItem}>
                  <AlertCircle size={14} />
                  Setiap NISN hanya dapat mendaftar satu kali.
                </li>
              </ul>
              <hr className="divider" />
              <p className={styles.infoContact}>
                Pertanyaan? Hubungi admin melalui Instagram{' '}
                <a
                  href="https://instagram.com/mansame_band"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  @mansame_band
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
