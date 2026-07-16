import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import SEO from '@/components/common/SEO';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.wrapper}>
      <SEO 
        title="404 Halaman Tidak Ditemukan" 
        description="Maaf, halaman yang Anda cari tidak dapat ditemukan di MANSAME Band."
      />
      <div className={styles.container}>
        {/* Animated Glow effect in background */}
        <div className={styles.glow} />
        
        {/* Main Card */}
        <div className={styles.card}>
          <div className={styles.errorCode}>404</div>
          <h1 className={styles.title}>Halaman Tidak Ditemukan</h1>
          <p className={styles.description}>
            Maaf, halaman yang Anda cari telah dipindahkan, dihapus, atau belum pernah dibuat. Silakan periksa kembali tautan Anda atau kembali ke halaman beranda.
          </p>
          
          <div className={styles.actions}>
            <Link to="/" className="btn btn-primary btn-lg">
              <Home size={18} />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
