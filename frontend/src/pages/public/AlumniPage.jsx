import { useState, useEffect } from 'react';
import { getPublicAlumni } from '@/api/public';
import SEO from '@/components/common/SEO';
import styles from './AlumniPage.module.css';

export default function AlumniPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicAlumni();
        setAlumni(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique join years (angkatan)
  const years = Array.from(new Set(alumni.map(a => a.joinYear))).sort((a, b) => b - a);

  // Filter
  const filteredAlumni = alumni.filter(a => {
    if (selectedYear === 'ALL') return true;
    return a.joinYear === parseInt(selectedYear);
  });

  return (
    <div className="page-wrapper">
      <SEO 
        title="Alumni & Demisioner" 
        description="Ruang silaturahmi dan apresiasi bagi seluruh demisioner serta alumni MANSAME Band MAN 1 Muara Enim dari berbagai angkatan." 
      />
      {/* Header */}
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Alumni MANSAME Band</h1>
          <p className={styles.subtitle}>
            Apresiasi dan ruang silaturahmi bagi seluruh demisioner serta alumni MANSAME Band MAN 1 Muara Enim.
          </p>
          <span className={styles.countBadge}>{alumni.length} Total Alumni</span>
        </div>
      </section>

      {/* Content */}
      <section className={`section ${styles.contentSection}`}>
        <div className="container">
          {/* Filter Years */}
          {years.length > 0 && (
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Pilih Angkatan:</span>
              <div className={styles.filterBtns}>
                <button
                  className={`${styles.filterBtn} ${selectedYear === 'ALL' ? styles.active : ''}`}
                  onClick={() => setSelectedYear('ALL')}
                >
                  Semua
                </button>
                {years.map(y => (
                  <button
                    key={y}
                    className={`${styles.filterBtn} ${selectedYear === String(y) ? styles.active : ''}`}
                    onClick={() => setSelectedYear(String(y))}
                  >
                    Angkatan {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.gridSkeleton}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`${styles.card} skeleton`} style={{ height: 120 }} />
              ))}
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className={styles.empty}>Belum ada data alumni terdaftar di angkatan ini.</div>
          ) : (
            <div className={styles.grid}>
              {filteredAlumni.map(a => (
                <div key={a.id} className={styles.card}>
                  <div className={styles.avatar}>
                    <div className={styles.initials}>
                      {a.name[0]}
                    </div>
                  </div>
                  <div className={styles.info}>
                    <h4>{a.name}</h4>
                    <p>Kelas saat aktif: {a.className}</p>
                    <span className={styles.yearBadge}>Angkatan {a.joinYear}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
