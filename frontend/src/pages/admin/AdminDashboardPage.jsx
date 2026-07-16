import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { ClipboardList, Users, CheckCircle, XCircle, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch {
      toast.error('Gagal memuat data statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const cand = stats?.candidates || { total: 0, passed: 0, notPassed: 0, pending: 0 };
  const memb = stats?.members || { active: 0 };
  const blog = stats?.blog || { totalNews: 0, totalBlogPosts: 0, pendingBlogDrafts: 0, recentComments: 0 };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Dashboard Utama"
        subtitle="Analisis data organisasi, pendaftar, rilis berita, dan blog komunitas"
      />

      <div className={styles.body}>
        {/* Section Title 1 */}
        <h3 className={styles.sectionTitle}>Analisis Pendaftaran & Anggota</h3>
        
        {/* Statistics Grid Rows */}
        <div className={styles.statsGrid}>
          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran')}
            title="Klik untuk buka halaman Pendaftaran"
          >
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <ClipboardList size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Calon Pendaftar</span>
              <span className={styles.statValue}>{loading ? '...' : cand.total}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/anggota')}
            title="Klik untuk buka halaman Anggota PIK-R"
          >
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Anggota Aktif</span>
              <span className={styles.statValue}>{loading ? '...' : memb.active}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran?status=LULUS')}
            title="Klik untuk filter pendaftar yang Lolos"
          >
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Pendaftar Lulus</span>
              <span className={styles.statValue}>{loading ? '...' : cand.passed}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran?status=TIDAK_LULUS')}
            title="Klik untuk filter pendaftar yang Tidak Lolos"
          >
            <div className={`${styles.statIcon} ${styles.statIconRed}`}>
              <XCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Tidak Lulus</span>
              <span className={styles.statValue}>{loading ? '...' : cand.notPassed}</span>
            </div>
          </div>
        </div>

        {/* Section Title 2 */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '24px' }}>Statistik Konten & Komunitas</h3>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              <FileText size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Berita Resmi</span>
              <span className={styles.statValue}>{loading ? '...' : blog.totalNews}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`} style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Blog Publik (Published)</span>
              <span className={styles.statValue}>{loading ? '...' : blog.totalBlogPosts}</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${blog.pendingBlogDrafts > 0 ? styles.draftAlertCard : ''}`}>
            <div 
              className={styles.statIcon} 
              style={{ 
                backgroundColor: blog.pendingBlogDrafts > 0 ? '#fff7ed' : '#f9fafb', 
                color: blog.pendingBlogDrafts > 0 ? '#ea580c' : '#4b5563' 
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Draft Blog Pending</span>
              <span className={styles.statValue} style={{ color: blog.pendingBlogDrafts > 0 ? '#ea580c' : 'inherit' }}>
                {loading ? '...' : blog.pendingBlogDrafts}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`} style={{ backgroundColor: '#f5f3ff', color: '#6d28d9' }}>
              <MessageSquare size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Komentar Baru (7 Hari)</span>
              <span className={styles.statValue}>{loading ? '...' : blog.recentComments}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
