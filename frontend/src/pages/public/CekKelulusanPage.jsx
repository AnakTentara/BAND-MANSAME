import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { checkStatus } from '@/api/candidates';
import { Search, MapPin, Calendar, Heart, Share2, CornerUpLeft } from 'lucide-react';
import SEO from '@/components/common/SEO';
import toast from 'react-hot-toast';
import styles from './CekKelulusanPage.module.css';

const STAGES = { SEARCH: 'search', LOADING: 'loading', RESULT: 'result' };

export default function CekKelulusanPage() {
  const [searchParams] = useSearchParams();
  const [nisn, setNisn] = useState(searchParams.get('nisn') || '');
  const [stage, setStage] = useState(STAGES.SEARCH);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const doCheck = useCallback(async (value) => {
    if (!value.trim()) return;
    setError('');
    setStage(STAGES.LOADING);
    setResult(null);

    // Artificial 2s delay for dramatic reveal
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await checkStatus(value.trim());
      setResult(res.data);
      setStage(STAGES.RESULT);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ notFound: true });
        setStage(STAGES.RESULT);
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan.');
        setStage(STAGES.SEARCH);
      }
    }
  }, []);

  // Auto-fetch if nisn query param is present
  useEffect(() => {
    const paramNisn = searchParams.get('nisn');
    if (paramNisn) {
      setNisn(paramNisn);
      doCheck(paramNisn);
    }
  }, [searchParams, doCheck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    doCheck(nisn);
  };

  const handleReset = () => {
    setStage(STAGES.SEARCH);
    setResult(null);
    setNisn('');
    setError('');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/cek-kelulusan?nisn=${nisn}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link tiket kelulusan disalin ke clipboard!');
  };

  const Barcode = () => (
    <div className={styles.stubBarcode}>
      <div className={`${styles.barcodeLine} ${styles.barcodeLineLg}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineSm}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineMd}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineSm}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineLg}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineMd}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineSm}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineLg}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineSm}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineMd}`} />
      <div className={`${styles.barcodeLine} ${styles.barcodeLineLg}`} />
    </div>
  );

  // ── Search Stage ──
  if (stage === STAGES.SEARCH) {
    return (
      <div className={styles.searchWrapper}>
        <SEO title="Cek Kelulusan Seleksi" description="Halaman pengumuman resmi hasil seleksi penerimaan anggota baru MANSAME Band. Masukkan NISN Anda untuk melihat status kelulusan." />
        
        <div className={styles.searchCenter}>
          <div className={styles.guitarIcon}>🎸</div>
          <h1 className={styles.searchTitle}>Cek Kelulusan</h1>
          <p className={styles.searchSub}>
            Masukkan 10 digit NISN pendaftaran kamu untuk melihat status audisi penerimaan MANSAME Band.
          </p>

          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Masukkan NISN kamu..."
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                maxLength={10}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!nisn.trim()} style={{ justifyContent: 'center' }}>
              Cek Hasil Audisi
            </button>
          </form>

          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Loading Stage ──
  if (stage === STAGES.LOADING) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingGlow}>⚡</div>
        <p className={styles.loadingText}>Memeriksa Lembar Audisi...</p>
      </div>
    );
  }

  // ── Result Stage ──
  if (result?.notFound) {
    return (
      <div className={styles.resultScreen}>
        <SEO title="NISN Tidak Ditemukan" description="Pengecekan kelulusan seleksi MANSAME Band: NISN tidak ditemukan dalam database." />
        <div className={styles.searchCenter}>
          <div className={styles.guitarIcon} style={{ filter: 'grayscale(1)' }}>🎟️</div>
          <h1 className={styles.searchTitle}>Tidak Ditemukan</h1>
          <p className={styles.searchSub}>
            Maaf, NISN <strong>{nisn}</strong> tidak terdaftar dalam database pendaftaran audisi kami. Pastikan nomor yang diinput sudah benar.
          </p>
          <button onClick={handleReset} className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const status = result?.status || result?.candidate?.status;
  const name = result?.name || result?.candidate?.name || '—';
  const candidateNisn = result?.nisn || result?.candidate?.nisn || nisn;
  const className = result?.className || result?.candidate?.className || '—';
  const serialNo = `MNSM-AUD-${candidateNisn.substring(0, 4)}-${candidateNisn.substring(6)}`;

  if (status === 'LULUS') {
    return (
      <div className={styles.resultScreen}>
        <SEO title="Selamat! Anda Lulus Seleksi" description="Selamat! Hasil seleksi menyatakan Anda LULUS menjadi bagian dari grup MANSAME Band." />
        <div className={styles.ticketWrap}>
          
          <div className={styles.ticketBody}>
            {/* Stamp */}
            <div className={`${styles.stamp} ${styles.stampLulus}`}>Selected</div>

            {/* Left Column */}
            <div className={styles.ticketMain}>
              <div className={styles.ticketHeader}>
                <span className={styles.ticketTag}>VIP Access Pass</span>
                <span className={styles.ticketSerial}>{serialNo}</span>
              </div>

              <h2 className={`${styles.ticketTitle} ${styles.ticketTitleLulus}`}>
                MANSAME BAND AUDITION
              </h2>

              <div className={styles.ticketInfo}>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Nama Musisi</span>
                  <span className={styles.infoVal}>{name}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>NISN Peserta</span>
                  <span className={styles.infoVal}>{candidateNisn}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Kelas Asal</span>
                  <span className={styles.infoVal}>{className}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Status Audisi</span>
                  <span className={styles.infoVal} style={{ color: 'var(--color-success)' }}>LULUS / INITIATED</span>
                </div>
              </div>

              <div className={styles.ticketFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={12} /> <span>Studio Musik MANSAME Band</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <Calendar size={12} /> <span>Bawa kartu identitas &amp; login profil untuk aktivasi pass</span>
                </div>
              </div>
            </div>

            {/* Right Sobek Column */}
            <div className={styles.ticketStub}>
              <span className={styles.stubHeader}>CONCERT STUB</span>
              <div className={styles.stubGlowGlow}>⚡</div>
              <Barcode />
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.ticketActionRow}>
            <Link to="/login" className="btn btn-lg btn-primary">
              Aktivasi Akun Musisi
            </Link>
            <button onClick={handleShare} className="btn btn-lg btn-secondary">
              <Share2 size={16} /> Bagikan Pass
            </button>
            <button onClick={handleReset} className="btn btn-lg btn-ghost">
              <CornerUpLeft size={16} /> Kembali
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (status === 'TIDAK_LULUS') {
    return (
      <div className={styles.resultScreen}>
        <SEO title="Hasil Seleksi: Tetap Semangat" description="Audisi MANSAME Band menyatakan Anda belum lulus kali ini. Tetap berkarya!" />
        <div className={styles.ticketWrap}>
          
          <div className={styles.ticketBody} style={{ filter: 'grayscale(0.6)' }}>
            {/* Stamp */}
            <div className={`${styles.stamp} ${styles.stampGagal}`}>Keep Practicing</div>

            {/* Left Column */}
            <div className={styles.ticketMain}>
              <div className={styles.ticketHeader}>
                <span className={styles.ticketTag} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderColor: '#475569' }}>Standard Stub</span>
                <span className={styles.ticketSerial}>{serialNo}</span>
              </div>

              <h2 className={`${styles.ticketTitle} ${styles.ticketTitleGagal}`}>
                MANSAME BAND AUDITION
              </h2>

              <div className={styles.ticketInfo}>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Nama Musisi</span>
                  <span className={styles.infoVal}>{name}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>NISN Peserta</span>
                  <span className={styles.infoVal}>{candidateNisn}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Kelas Asal</span>
                  <span className={styles.infoVal}>{className}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Status Audisi</span>
                  <span className={styles.infoVal} style={{ color: 'var(--color-error)' }}>BELUM LULUS</span>
                </div>
              </div>

              <div className={styles.ticketFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={12} /> <span>Terima kasih telah berpartisipasi. Jangan patah semangat!</span>
                </div>
              </div>
            </div>

            {/* Right Sobek Column */}
            <div className={styles.ticketStub}>
              <span className={styles.stubHeader}>STANDARD PASS</span>
              <div className={styles.stubGlowGlow} style={{ opacity: 0.3 }}>🎸</div>
              <Barcode />
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.ticketActionRow}>
            <button onClick={handleReset} className="btn btn-lg btn-secondary">
              <CornerUpLeft size={16} /> Cek NISN Lain
            </button>
          </div>

        </div>
      </div>
    );
  }

  // PENDING
  return (
    <div className={styles.resultScreen}>
      <SEO title="Status Seleksi: Menunggu Pengumuman" description="Status pendaftaran MANSAME Band Anda saat ini masih dalam proses peninjauan." />
      <div className={styles.ticketWrap}>
        
        <div className={styles.ticketBody}>
          {/* Stamp */}
          <div className={`${styles.stamp} ${styles.stampPending}`}>Pending review</div>

          {/* Left Column */}
          <div className={styles.ticketMain}>
            <div className={styles.ticketHeader}>
              <span className={styles.ticketTag} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: '#f59e0b' }}>Review Pass</span>
              <span className={styles.ticketSerial}>{serialNo}</span>
            </div>

            <h2 className={styles.ticketTitle} style={{ color: '#f59e0b' }}>
              MANSAME BAND AUDITION
            </h2>

            <div className={styles.ticketInfo}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Nama Musisi</span>
                <span className={styles.infoVal}>{name}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>NISN Peserta</span>
                <span className={styles.infoVal}>{candidateNisn}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Kelas Asal</span>
                <span className={styles.infoVal}>{className}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Status Audisi</span>
                <span className={styles.infoVal} style={{ color: '#f59e0b' }}>DALAM PENINJAUAN</span>
              </div>
            </div>

            <div className={styles.ticketFooter}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} /> <span>Hasil audisi kamu sedang diperiksa secara teliti oleh juri. Cek berkala!</span>
              </div>
            </div>
          </div>

          {/* Right Sobek Column */}
          <div className={styles.ticketStub}>
            <span className={styles.stubHeader}>STUB REVIEW</span>
            <div className={styles.stubGlowGlow} style={{ color: '#f59e0b' }}>⏳</div>
            <Barcode />
          </div>
        </div>

        {/* Action Row */}
        <div className={styles.ticketActionRow}>
          <button onClick={handleReset} className="btn btn-lg btn-secondary">
            <CornerUpLeft size={16} /> Kembali
          </button>
        </div>

      </div>
    </div>
  );
}
