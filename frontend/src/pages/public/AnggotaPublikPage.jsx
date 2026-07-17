import { useState, useEffect } from 'react';
import { getPublicOrg, getPublicMembers } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './AnggotaPublikPage.module.css';

export default function AnggotaPublikPage() {
  const [orgData, setOrgData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDivisionStaff = (leaderJabatan) => {
    if (!leaderJabatan) return [];
    const normalizedLeader = leaderJabatan.replace(/^(Ketua|Koordinator Bidang)\s+/i, '').trim().toLowerCase();
    
    return orgData.filter(m => {
      if (!m.isCurrent) return false;
      const jab = (m.jabatan || '').toLowerCase();
      // Match if role is ANGGOTA and it contains both "anggota" and the division name (e.g. "medinfo")
      return m.role === 'ANGGOTA' && jab.includes('anggota') && jab.includes(normalizedLeader);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, memRes] = await Promise.all([getPublicOrg(), getPublicMembers()]);
        setOrgData(orgRes.data || []);
        setMembers(memRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter current active leadership
  const pembina = orgData.find(m => m.jabatan === 'Pembina' && m.isCurrent);
  const ketua = orgData.find(m => m.jabatan === 'Ketua Umum' && m.isCurrent);
  const wakil = orgData.find(m => m.jabatan === 'Wakil Ketua Umum' && m.isCurrent);
  const kabinet = orgData.filter(m => m.role === 'KABINET' && m.isCurrent);

  const getMemberJabatan = (memberName) => {
    const found = orgData.find(o => o.name === memberName && o.isCurrent);
    return found ? found.jabatan : 'Anggota Biasa';
  };

  return (
    <div className="page-wrapper">
      <SEO 
        title="Daftar Anggota & Pengurus" 
        description="Bagan organisasi, jajaran pengurus aktif (BPH), pembina, serta daftar lengkap anggota aktif MANSAME Band MAN 1 Muara Enim." 
      />
      {/* Header */}
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Anggota MANSAME Band</h1>
          <p className={styles.subtitle}>
            Struktur kepengurusan aktif dan seluruh anggota resmi MANSAME Band MAN 1 Muara Enim.
          </p>
          <span className={styles.countBadge}>{members.length} Anggota Aktif</span>
        </div>
      </section>

      {/* 2. Bagan Kepengurusan (Pengurus) */}
      <section className={`section ${styles.treeSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Bagan Kepengurusan Tahun Ini</h2>
          
          {loading ? (
            <div className={styles.boardSection}>
              <div className={styles.boardGridCenter}>
                <div className={`${styles.memberCardHighlight} skeleton`} style={{ height: '170px', border: 'none' }} />
                <div className={`${styles.memberCardHighlight} skeleton`} style={{ height: '170px', border: 'none' }} />
                <div className={`${styles.memberCardHighlight} skeleton`} style={{ height: '170px', border: 'none' }} />
              </div>
            </div>
          ) : (
            <div className={styles.boardContainer}>
              
              {/* Jajaran Pembina & BPH Utama */}
              <div className={styles.boardSection}>
                <h3 className={styles.boardSectionTitle}>Pimpinan &amp; Pembina</h3>
                <div className={styles.boardGridCenter}>
                  {pembina && (
                    <div className={styles.memberCardHighlight}>
                      <div className={styles.avatarWrap}>
                        {(pembina.effectivePhoto || pembina.photoPath) ? (
                          <img src={getUploadUrl(pembina.effectivePhoto || pembina.photoPath)} alt={pembina.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.avatarInitials}>{pembina.name[0]}</div>
                        )}
                      </div>
                      <h4>{pembina.name}</h4>
                      <span className={styles.roleBadgePembina}>{pembina.jabatan}</span>
                    </div>
                  )}
                  {ketua && (
                    <div className={styles.memberCardHighlight}>
                      <div className={styles.avatarWrap}>
                        {(ketua.effectivePhoto || ketua.photoPath) ? (
                          <img src={getUploadUrl(ketua.effectivePhoto || ketua.photoPath)} alt={ketua.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.avatarInitials}>{ketua.name[0]}</div>
                        )}
                      </div>
                      <h4>{ketua.name}</h4>
                      <span className={styles.roleBadgeKetua}>{ketua.jabatan}</span>
                    </div>
                  )}
                  {wakil && (
                    <div className={styles.memberCardHighlight}>
                      <div className={styles.avatarWrap}>
                        {(wakil.effectivePhoto || wakil.photoPath) ? (
                          <img src={getUploadUrl(wakil.effectivePhoto || wakil.photoPath)} alt={wakil.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.avatarInitials}>{wakil.name[0]}</div>
                        )}
                      </div>
                      <h4>{wakil.name}</h4>
                      <span className={styles.roleBadgeWakil}>{wakil.jabatan}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Jajaran Kabinet / Divisi */}
              {kabinet.length > 0 && (
                <div className={styles.boardSection} style={{ marginTop: '48px' }}>
                  <h3 className={styles.boardSectionTitle}>Jajaran Koordinator &amp; Divisi</h3>
                  <div className={styles.divisionsGrid}>
                    {kabinet.map(k => {
                      const staff = getDivisionStaff(k.jabatan);
                      return (
                        <div key={k.id} className={styles.divisionCard}>
                          {/* Leader of Division */}
                          <div className={styles.divisionLeader}>
                            <div className={styles.avatarWrapSmall}>
                              {(k.effectivePhoto || k.photoPath) ? (
                                <img src={getUploadUrl(k.effectivePhoto || k.photoPath)} alt={k.name} className={styles.memberAvatarImgSmall} />
                              ) : (
                                <div className={styles.avatarInitialsSmall}>{k.name[0]}</div>
                              )}
                            </div>
                            <div className={styles.leaderInfo}>
                              <h5>{k.name}</h5>
                              <span className={styles.roleBadgeKabinet}>{k.jabatan}</span>
                            </div>
                          </div>

                          {/* Staff under this Division */}
                          {staff.length > 0 && (
                            <div className={styles.staffGrid}>
                              {staff.map(s => (
                                <div key={s.id} className={styles.staffCard}>
                                  <div className={styles.avatarWrapMini}>
                                    {(s.effectivePhoto || s.photoPath) ? (
                                      <img src={getUploadUrl(s.effectivePhoto || s.photoPath)} alt={s.name} className={styles.memberAvatarImgMini} />
                                    ) : (
                                      <div className={styles.avatarInitialsMini}>{s.name[0]}</div>
                                    )}
                                  </div>
                                  <div className={styles.staffText}>
                                    <h6>{s.name}</h6>
                                    <span>{s.jabatan}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </section>

      {/* 3. Daftar Anggota Aktif */}
      <section className={`section ${styles.membersSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Daftar Anggota Aktif</h2>
          
          {loading ? (
            <div className={styles.membersGrid}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="skeleton-member-card">
                  <div className="skeleton-member-avatar skeleton" />
                  <div className="skeleton-member-info">
                    <div className="skeleton-member-name skeleton" />
                    <div className="skeleton-member-role skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const ordinaryMembers = members.filter(m => !orgData.some(o => o.name === m.name && o.isCurrent));
            
            if (ordinaryMembers.length === 0) {
              return <p className={styles.emptyText}>Belum ada anggota aktif biasa terdaftar.</p>;
            }

            return (
              <div className={styles.membersGrid}>
                {ordinaryMembers.map(m => {
                  const jabatan = getMemberJabatan(m.name);
                  return (
                    <div key={m.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {m.photoPath ? (
                          <img src={getUploadUrl(m.photoPath)} alt={m.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.avatarInitials}>
                            {m.name[0]}
                          </div>
                        )}
                      </div>
                      <div className={styles.memberInfo}>
                        <h4>{m.name}</h4>
                        <p>Kelas {m.className} • <span className={styles.memberJabatan}>{jabatan}</span></p>
                        <span className={styles.joinYear}>Angkatan {m.joinYear}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
