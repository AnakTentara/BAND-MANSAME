import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getUploadUrl } from '@/api/axios';
import styles from './Navbar.module.css';

// Link utama yang selalu tampil (tidak bisa disembunyikan)
const CORE_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/daftar', label: 'Pendaftaran' },
  { to: '/cek-kelulusan', label: 'Cek Kelulusan' },
];

// Group: Tentang — tampil sebagai dropdown
const GROUP_TENTANG = {
  label: 'Tentang',
  children: [
    { to: '/kami', label: 'Tentang Kami', key: 'tentangKami' },
    { to: '/anggota', label: 'Anggota', key: 'anggota' },
    { to: '/alumni', label: 'Alumni', key: 'alumni' },
    { to: '/galeri', label: 'Galeri Foto', key: 'galeri' },
  ],
};

// Group: Konten — tampil sebagai dropdown
const GROUP_KONTEN = {
  label: 'Konten',
  children: [
    { to: '/berita', label: 'Berita', key: 'berita' },
    { to: '/blog', label: 'Blog', key: 'blog' },
  ],
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'tentang' | 'konten' | null
  const { isCandidateAuthenticated, candidateUser, logoutCandidate } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [webEditorConfig, setWebEditorConfig] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });

    getPublicSettings().then(res => {
      if (res.data?.webEditorConfig) {
        setWebEditorConfig(res.data.webEditorConfig);
      }
    }).catch(console.error);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navVisibility = webEditorConfig?.hero?.navVisibility || {};
  const customPages = webEditorConfig?.customPages || [];

  // Filter children berdasarkan navVisibility config
  const filterChildren = (children) =>
    children.filter(link => !link.key || navVisibility[link.key] !== false);

  const visibleTentang = filterChildren(GROUP_TENTANG.children);
  const visibleKonten = filterChildren(GROUP_KONTEN.children);

  const isAdmin = !!localStorage.getItem('admin_token');

  const handleLogout = () => {
    logoutCandidate();
    navigate('/login');
    setMenuOpen(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
    setMenuOpen(false);
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="banner">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="MANSAME Band — Beranda">
          <div className={styles.logoInner}>
            <img src="/media/logos/mansame-band.png" alt="MANSAME Band" className={styles.logoImg} />
            <span className={styles.logoText}>
              MANSAME <span className={styles.logoAccent}>BAND</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav} aria-label="Navigasi utama" ref={dropdownRef}>
          {/* Beranda */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Beranda
          </NavLink>

          {/* Dropdown: Tentang */}
          {visibleTentang.length > 0 && (
            <div className={styles.dropdownGroup}>
              <button
                className={`${styles.navLink} ${styles.dropdownTrigger} ${activeDropdown === 'tentang' ? styles.dropdownOpen : ''}`}
                onClick={() => toggleDropdown('tentang')}
                aria-expanded={activeDropdown === 'tentang'}
                aria-haspopup="menu"
              >
                Tentang <ChevronDown size={14} className={styles.chevron} />
              </button>
              {activeDropdown === 'tentang' && (
                <div className={styles.dropdownMenu} role="menu">
                  {visibleTentang.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={() => setActiveDropdown(null)}
                      className={({ isActive }) =>
                        `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dropdown: Konten */}
          {visibleKonten.length > 0 && (
            <div className={styles.dropdownGroup}>
              <button
                className={`${styles.navLink} ${styles.dropdownTrigger} ${activeDropdown === 'konten' ? styles.dropdownOpen : ''}`}
                onClick={() => toggleDropdown('konten')}
                aria-expanded={activeDropdown === 'konten'}
                aria-haspopup="menu"
              >
                Konten <ChevronDown size={14} className={styles.chevron} />
              </button>
              {activeDropdown === 'konten' && (
                <div className={styles.dropdownMenu} role="menu">
                  {visibleKonten.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={() => setActiveDropdown(null)}
                      className={({ isActive }) =>
                        `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pendaftaran */}
          <NavLink
            to="/daftar"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Pendaftaran
          </NavLink>

          {/* Cek Kelulusan */}
          <NavLink
            to="/cek-kelulusan"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Cek Kelulusan
          </NavLink>

          {/* Custom pages */}
          {customPages.map(page => (
            <NavLink
              key={page.slug}
              to={`/p/${page.slug}`}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {page.title}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className={styles.actions}>
          {isAdmin ? (
            <div className={styles.userMenu}>
              <Link to="/admin" className={styles.userBtn} style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                <User size={16} />
                <span>Dashboard (Admin)</span>
              </Link>
              <button
                onClick={handleAdminLogout}
                className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
                title="Keluar Admin"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : isCandidateAuthenticated ? (
            <div className={styles.userMenu}>
              <Link to="/profil" className={styles.userBtn}>
                <User size={16} />
                <span>{candidateUser?.name?.split(' ')[0] || 'Profil'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
                title="Keluar"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`btn btn-secondary btn-sm`}>
                Masuk Anggota
              </Link>
              <Link to="/daftar" className={`btn btn-primary btn-sm`}>
                Daftar Sekarang
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={styles.mobileDrawer}>
          <nav className={styles.mobileNav} aria-label="Navigasi mobile">
            <NavLink
              to="/"
              end
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
            >
              Beranda
            </NavLink>

            {/* Group: Tentang */}
            {visibleTentang.length > 0 && (
              <>
                <div className={styles.mobileGroupLabel}>Tentang</div>
                {visibleTentang.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `${styles.mobileLink} ${styles.mobileLinkIndent} ${isActive ? styles.active : ''}`}
                  >
                    {label}
                  </NavLink>
                ))}
              </>
            )}

            {/* Group: Konten */}
            {visibleKonten.length > 0 && (
              <>
                <div className={styles.mobileGroupLabel}>Konten</div>
                {visibleKonten.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `${styles.mobileLink} ${styles.mobileLinkIndent} ${isActive ? styles.active : ''}`}
                  >
                    {label}
                  </NavLink>
                ))}
              </>
            )}

            <NavLink
              to="/daftar"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
            >
              Pendaftaran
            </NavLink>
            <NavLink
              to="/cek-kelulusan"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
            >
              Cek Kelulusan
            </NavLink>

            {customPages.map(page => (
              <NavLink
                key={page.slug}
                to={`/p/${page.slug}`}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
              >
                {page.title}
              </NavLink>
            ))}

            <hr className="divider" />
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={styles.mobileLink}
                  style={{ color: 'var(--color-accent)' }}
                >
                  <User size={16} /> Dashboard Admin
                </Link>
                <button onClick={handleAdminLogout} className={`${styles.mobileLink} ${styles.logoutMobile}`}>
                  <LogOut size={16} /> Keluar Admin
                </button>
              </>
            ) : isCandidateAuthenticated ? (
              <>
                <Link
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className={styles.mobileLink}
                >
                  <User size={16} /> Profil Saya
                </Link>
                <button onClick={handleLogout} className={`${styles.mobileLink} ${styles.logoutMobile}`}>
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
                  Masuk Anggota
                </Link>
                <Link
                  to="/daftar"
                  onClick={() => setMenuOpen(false)}
                  className={`${styles.mobileLink} ${styles.mobileCtaLink}`}
                >
                  Daftar Sekarang →
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
