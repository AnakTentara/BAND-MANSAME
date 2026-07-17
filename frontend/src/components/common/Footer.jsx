import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, MapPin, Heart } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.grid}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link to="/" aria-label="MANSAME Band — Beranda">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <img src="/media/logos/mansame-band.png" alt="MANSAME Band" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                MANSAME <span style={{ color: 'var(--color-accent)' }}>BAND</span>
              </span>
            </div>
          </Link>
          <p className={styles.tagline}>
            Ekstrakurikuler Seni Musik & Band
            <br />
            MAN 1 Muara Enim
          </p>
          <div className={styles.socialRow}>
            <a
              href="https://instagram.com/mansame_band"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram MANSAME Band"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Navigasi */}
        <div className={styles.linkGroup}>
          <h3 className={styles.groupTitle}>Navigasi</h3>
          <ul className={styles.linkList}>
            <li><Link to="/" className={styles.link}>Beranda</Link></li>
            <li><Link to="/kami" className={styles.link}>Tentang Kami</Link></li>
            <li><Link to="/galeri" className={styles.link}>Galeri Foto</Link></li>
            <li><Link to="/blog" className={styles.link}>Blog & Artikel</Link></li>
            <li><Link to="/daftar" className={styles.link}>Pendaftaran Anggota</Link></li>
            <li><Link to="/cek-kelulusan" className={styles.link}>Cek Kelulusan</Link></li>
          </ul>
        </div>

        {/* Akses Cepat */}
        <div className={styles.linkGroup}>
          <h3 className={styles.groupTitle}>Akses</h3>
          <ul className={styles.linkList}>
            <li><Link to="/login" className={styles.link}>Login Anggota</Link></li>
            <li><Link to="/daftar" className={styles.link}>Daftar Anggota</Link></li>
            <li><Link to="/cek-kelulusan" className={styles.link}>Cek Kelulusan</Link></li>
          </ul>
        </div>

        {/* Kontak */}
        <div className={styles.linkGroup}>
          <h3 className={styles.groupTitle}>Kontak</h3>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <MapPin size={14} />
              <span>MAN 1 Muara Enim, Sumatera Selatan</span>
            </li>
            <li className={styles.contactItem}>
              <Mail size={14} />
              <a href="mailto:mansameband01@gmail.com" className={styles.link}>
                mansameband01@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>
              &copy; {currentYear} MANSAME Band — MAN 1 Muara Enim. Hak cipta dilindungi.
            </p>
            <p className={styles.credit}>
              Dibuat dengan <Heart size={12} className={styles.heart} /> oleh Tim MANSAME Band
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
