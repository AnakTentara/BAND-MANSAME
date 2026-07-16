import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCandidate } from '@/api/candidates';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { isCandidateAuthenticated, setCandidateAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nisn: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCandidateAuthenticated) navigate('/blog', { replace: true });
  }, [isCandidateAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nisn.trim() || !form.password.trim()) {
      toast.error('NISN dan password wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginCandidate(form);
      const { token, candidate } = res.data;
      setCandidateAuth(token, candidate);
      toast.success('Login berhasil!');
      navigate('/blog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'NISN atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`page-wrapper ${styles.wrapper}`}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Link to="/">
            <img
              src="/media/logos/mansame-band.png"
              alt="MANSAME Band"
              className={styles.logo}
            />
          </Link>
          <h1 className={styles.title}>Login Anggota</h1>
          <p className={styles.subtitle}>
            Masuk menggunakan NISN dan password yang diberikan oleh administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-nisn">NISN</label>
            <input
              id="login-nisn"
              name="nisn"
              type="text"
              className="form-input"
              placeholder="Masukkan NISN kamu"
              value={form.nisn}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className={styles.pwdWrap}>
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${styles.pwdInput}`}
                placeholder="Masukkan password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading && <span className="spinner" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className={styles.footer}>
          Belum punya akun?{' '}
          <Link to="/daftar" className={styles.footerLink}>
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
