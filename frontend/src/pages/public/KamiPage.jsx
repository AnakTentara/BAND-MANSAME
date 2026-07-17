import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Award, ChevronUp, ChevronDown, Music, Users } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getPublicOrg } from '@/api/public';
import SEO from '@/components/common/SEO';
import Avatar from '@/components/common/Avatar';
import { getUploadUrl } from '@/api/axios';
import styles from './KamiPage.module.css';

export default function KamiPage() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState([]);
  const [webEditorConfig, setWebEditorConfig] = useState(null);
  const [expandedYear, setExpandedYear] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgRes, settingsRes] = await Promise.all([
        getPublicOrg(),
        getPublicSettings()
      ]);
      setOrgData(orgRes.data || []);
      if (settingsRes.data?.webEditorConfig) {
        setWebEditorConfig(settingsRes.data.webEditorConfig);
      }
    } catch (err) {
      console.error('Failed to load Tentang Kami data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter current members
  const pembinaCurrent = orgData.find(m => m.role === 'PEMBINA' && m.isCurrent);
  const ketuaCurrent = orgData.find(m => m.role === 'KETUA' && m.isCurrent);
  const wakilCurrent = orgData.find(m => m.role === 'WAKIL' && m.isCurrent);
  const sekretarisCurrent = orgData.find(m => m.jabatan?.toLowerCase().includes('sekretaris') && m.isCurrent);
  const bendaharaCurrent = orgData.find(m => m.jabatan?.toLowerCase().includes('bendahara') && m.isCurrent);

  const DIVISIONS = [
    { name: 'Vocalis', ketuaTitle: 'Koordinator Vocalis', anggotaTitle: 'Anggota Vocalis' },
    { name: 'Gitarist', ketuaTitle: 'Koordinator Gitarist', anggotaTitle: 'Anggota Gitarist' },
    { name: 'Drummer', ketuaTitle: 'Koordinator Drummer', anggotaTitle: 'Anggota Drummer' },
    { name: 'Bassist', ketuaTitle: 'Koordinator Bassist', anggotaTitle: 'Anggota Bassist' },
    { name: 'Keyboardist', ketuaTitle: 'Koordinator Keyboardist', anggotaTitle: 'Anggota Keyboardist' }
  ];

  const activeDivisions = DIVISIONS.map(div => {
    const ketua = orgData.find(m => m.jabatan === div.ketuaTitle && m.isCurrent);
    const anggota = orgData.filter(m => m.jabatan === div.anggotaTitle && m.isCurrent);
    return { ...div, ketua, anggota };
  }).filter(d => d.ketua || d.anggota.length > 0);

  const ROLE_ORDER = { PEMBINA: 1, KETUA: 2, WAKIL: 3, KABINET: 4, ANGGOTA: 5 };

  const archivesGrouped = orgData.reduce((acc, m) => {
    if (m.isCurrent) return acc;
    const year = m.yearStart;
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {});

  Object.keys(archivesGrouped).forEach(year => {
    archivesGrouped[year].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
  });

  const archiveYears = Object.keys(archivesGrouped).sort((a, b) => b - a);

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const tentangKami = webEditorConfig?.tentangKami || {};
  const tahunBerdiri = tentangKami.yearFounded || '2023';
  const aboutText1 = tentangKami.aboutText1 || 'MANSAME Band merupakan ekstrakurikuler musik dan seni pertunjukan yang bernaung di bawah MAN 1 Muara Enim. Organisasi ini berfokus pada pembinaan minat bakat siswa di bidang musik, melatih kemampuan vokal, menguasai instrumen (gitar, bass, drum, keyboard), aransemen, serta pertunjukan langsung.';
  const aboutText2 = tentangKami.aboutText2 || 'Melalui latihan rutin di studio, kolaborasi kelompok, dan keterlibatan dalam berbagai festival sekolah maupun regional, kami bertekad melahirkan generasi muda yang kreatif, percaya diri, kompak, dan berprestasi.';

  return (
    <div className={styles.pageWrapper}>
      <SEO 
        title="Tentang Kami" 
        description="Profil lengkap MANSAME Band MAN 1 Muara Enim. Ketahui visi, misi, struktur pengurus aktif, pimpinan, dan perjalanan sejarah band kami." 
      />
      
      {/* 1. Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroEmoji}>🎸</div>
          <h1 className={styles.heroTitle}>Tentang MANSAME Band</h1>
          <p className={styles.heroSubtitle}>
            Ekstrakurikuler Seni Musik &amp; Band MAN 1 Muara Enim. Wadah pengembangan karakter, kekompakan, dan bakat bermusik.
          </p>
        </div>
      </section>

      {/* 2. Biodata & Profil */}
      <section className={`section ${styles.biodataSection}`}>
        <div className={`container ${styles.biodataGrid}`}>
          <div className={styles.biodataLeft}>
            <h2>Wadah Kreativitas &amp; Edukasi Seni Musik</h2>
            <p>{aboutText1}</p>
            <p>{aboutText2}</p>
          </div>
          <div className={styles.biodataRight}>
            <div className={styles.infoBox}>
              <Calendar className={styles.infoIcon} size={20} />
              <div>
                <h4>Tahun Berdiri</h4>
                <p>Resmi didirikan pada tahun {tahunBerdiri}</p>
              </div>
            </div>
            <div className={styles.infoBox}>
              <MapPin className={styles.infoIcon} size={20} />
              <div>
                <h4>Instansi Induk</h4>
                <p>MAN 1 Muara Enim, Sumatera Selatan</p>
              </div>
            </div>
            <div className={styles.infoBox}>
              <Award className={styles.infoIcon} size={20} />
              <div>
                <h4>Sekretariat</h4>
                <p>Jl. Jend. Ahmad Yani No.1, Muara Enim, Kec. Muara Enim, Kab. Muara Enim</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pimpinan Saat Ini */}
      <section className={`section ${styles.leadershipSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Pimpinan &amp; Pengurus Aktif</h2>
          
          {loading ? (
            <div className={styles.spinnerWrap}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Pembina Card */}
              {pembinaCurrent && (
                <div className={styles.pembinaCard}>
                  <div className={styles.pembinaImgWrap}>
                    {pembinaCurrent.photoPath ? (
                      <img src={getUploadUrl(pembinaCurrent.photoPath)} alt={pembinaCurrent.name} />
                    ) : (
                      <Avatar name={pembinaCurrent.name} sizeVariant="xl" />
                    )}
                  </div>
                  <div className={styles.pembinaInfo}>
                    <span className={styles.roleLabel}>PEMBINA BAND</span>
                    <h3 className={styles.pembinaName}>{pembinaCurrent.name}</h3>
                    <p className={styles.pembinaMeta}>Menjabat sejak {pembinaCurrent.yearStart}</p>
                    {pembinaCurrent.quote && (
                      <blockquote className={styles.pembinaQuote}>
                        "{pembinaCurrent.quote}"
                      </blockquote>
                    )}
                  </div>
                </div>
              )}

              {/* Ketua & Wakil */}
              <div className={styles.coreGrid}>
                {[ketuaCurrent, wakilCurrent, sekretarisCurrent, bendaharaCurrent]
                  .filter(Boolean)
                  .map((member, idx) => {
                    const roleLabels = ['KETUA UMUM', 'WAKIL KETUA', 'SEKRETARIS UMUM', 'BENDAHARA UMUM'];
                    return (
                      <div key={member.id || idx} className={styles.coreCard}>
                        <div className={styles.coreImgWrap}>
                          {member.photoPath ? (
                            <img src={getUploadUrl(member.photoPath)} alt={member.name} />
                          ) : (
                            <Avatar name={member.name} sizeVariant="lg" />
                          )}
                        </div>
                        <span className={styles.coreRole}>{roleLabels[idx]}</span>
                        <h4 className={styles.coreName}>{member.name}</h4>
                        {member.quote && <p className={styles.coreQuote}>"{member.quote}"</p>}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Divisi & Anggota (Band Sections) */}
      {!loading && activeDivisions.length > 0 && (
        <section className={styles.divisionsSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Seksi Instrumen &amp; Anggota</h2>
            
            {activeDivisions.map(d => (
              <div key={d.name} className={styles.divisionGroup}>
                <h3 className={styles.divisionTitle}>
                  <Music size={22} className="purple-glow" /> Seksi {d.name}
                </h3>
                
                {/* Koordinator (Ketua) */}
                {d.ketua && (
                  <div className={styles.divisionLeader}>
                    <span className={styles.leaderTitle}>Koordinator Seksi</span>
                    <div className={styles.leaderCard}>
                      {d.ketua.photoPath ? (
                        <img src={getUploadUrl(d.ketua.photoPath)} alt={d.ketua.name} className={styles.leaderImg} />
                      ) : (
                        <Avatar name={d.ketua.name} sizeVariant="md" />
                      )}
                      <div>
                        <h4 className={styles.leaderName}>{d.ketua.name}</h4>
                        <p className={styles.leaderClass}>Kelas {d.ketua.className || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anggota Seksi */}
                <div className={styles.membersContainer}>
                  <span className={styles.membersTitle}>Pemain / Anggota Seksi:</span>
                  {d.anggota.length > 0 ? (
                    <div className={styles.membersGrid}>
                      {d.anggota.map(a => (
                        <div key={a.id} className={styles.memberMiniCard}>
                          {a.photoPath ? (
                            <img src={getUploadUrl(a.photoPath)} alt={a.name} className={styles.memberMiniImg} />
                          ) : (
                            <Avatar name={a.name} sizeVariant="sm" />
                          )}
                          <div>
                            <div className={styles.memberMiniName}>{a.name}</div>
                            <div className={styles.memberMiniClass}>Kelas {a.className || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyMembers}>Belum ada pemain aktif terdaftar.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Arsip Kepemimpinan */}
      {!loading && archiveYears.length > 0 && (
        <section className={`section ${styles.historySection}`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Arsip Kepengurusan (Sejarah Periode)</h2>
            <p className={styles.historyIntro}>
              Perjalanan sejarah kepengurusan dan alumni yang telah berkontribusi besar dalam membangun MANSAME Band dari masa ke masa.
            </p>
            
            <div className={styles.historyAccordion}>
              {archiveYears.map(year => (
                <div key={year} className={`${styles.archiveYearItem} ${expandedYear === year ? styles.archiveYearItemActive : ''}`}>
                  <button className={styles.yearHeader} onClick={() => toggleYear(year)}>
                    <div className={styles.yearTitle}>
                      <Users size={18} />
                      <span>Kepengurusan Periode Tahun {year}</span>
                    </div>
                    {expandedYear === year ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedYear === year && (
                    <div className={styles.yearContent}>
                      <div className={styles.archiveGrid}>
                        {archivesGrouped[year].map(m => (
                          <div key={m.id} className={styles.archiveCard}>
                            <span className={styles.archiveCardName}>{m.name}</span>
                            <span className={styles.archiveCardRole}>{m.jabatan || m.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CTA Ajakan Bergabung */}
      <section className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={`glass-panel ${styles.ctaBox}`}>
            <h2 className={styles.ctaTitle}>Ingin Menjadi Bagian Dari Kami?</h2>
            <p className={styles.ctaDesc}>
              Daftarkan dirimu sekarang untuk bergabung sebagai pemain musik atau penyanyi MANSAME Band generasi selanjutnya.
            </p>
            <Link to="/daftar" className="btn btn-primary btn-lg">Daftar Sekarang</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
