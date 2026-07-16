import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '@/api/admin';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminLoginPage.module.css';

export default function AdminLoginPage() {
  const { isAdminAuthenticated, setAdminToken } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) navigate('/admin', { replace: true });
  }, [isAdminAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.error('Username dan password wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAdmin(form);
      const { token, admin } = res.data;
      setAdminToken(token, admin);
      toast.success('Login berhasil!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎸</div>
          <h1 className={styles.title}>Dashboard Admin</h1>
          <p className={styles.subtitle}>MANSAME Band — Panel Administrasi</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              name="username"
              type="text"
              className="form-input"
              placeholder="Username admin"
              value={form.username}
              onChange={handleChange}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className={styles.pwdWrap}>
              <input
                id="admin-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${styles.pwdInput}`}
                placeholder="Password admin"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Sembunyikan' : 'Tampilkan'}
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
      </div>
    </div>
  );
}
