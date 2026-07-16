import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, Award, Sparkles, Mic, Music, Disc, Volume2, Key } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getPublicTestimonials } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './LandingPage.module.css';

// 9 Hero images with their exact extensions
const HERO_IMAGES = [
  { src: '/media/heros/hero1.webp', alt: 'MANSAME Band Auditions' },
  { src: '/media/heros/hero2.jpg', alt: 'Live Performance Concert' },
  { src: '/media/heros/hero3.jpeg', alt: 'Band Rehearsal Sessions' },
  { src: '/media/heros/hero4.jpeg', alt: 'Guitar Solo Performance' },
  { src: '/media/heros/hero5.jpeg', alt: 'Drum Beat Rhythms' },
  { src: '/media/heros/hero6.jpeg', alt: 'Keyboard Synth Pad' },
  { src: '/media/heros/hero7.jpeg', alt: 'Bass Line Weaving' },
  { src: '/media/heros/hero8.jpeg', alt: 'Stage Concert Lighting' },
  { src: '/media/heros/hero9.jpeg', alt: 'Studio Recording Gear' }
];

const DEFAULT_MISI = [
  'Mengasah kreativitas dan keterampilan bermusik siswa MAN 1 Muara Enim di bidang vokal dan instrumen.',
  'Menyelenggarakan latihan rutin yang disiplin, suportif, dan menyenangkan.',
  'Mengembangkan aransemen musik orisinal maupun cover lintas genre dengan performa berkualitas.',
  'Membangun kerja sama tim yang solid serta melatih kepercayaan diri tampil di atas panggung.',
];

const INSTRUMENTS = [
  { name: 'Vocalis', desc: 'Menuntun harmoni lagu lewat vokal dan teknik vokal yang matang.', icon: Mic },
  { name: 'Gitarist', desc: 'Menciptakan melodi, riff elektrik, dan harmoni ritme yang memukau.', icon: Music },
  { name: 'Drummer', desc: 'Menjaga tempo, dinamika ketukan, dan menjadi jantung detak ritme band.', icon: Disc },
  { name: 'Bassist', desc: 'Menghubungkan ketukan drum dengan harmoni nada bass yang dalam.', icon: Volume2 },
  { name: 'Keyboardist', desc: 'Mengisi harmoni pad synthesizer, piano klasik, dan efek instrumen.', icon: Key }
];

const INSTRUMENT_PREVIEWS = [
  {
    name: 'Gitar Bass Hitam',
    spec: 'Yamaha TRBX / Fender Precision Style',
    desc: 'Gitar bass elektrik hitam presisi tinggi, menghasilkan nada low-end yang solid dan tebal untuk menyatukan ketukan drum dengan melodi gitar.',
    img: '/media/instruments/black_bass.jpg'
  },
  {
    name: 'Gitar Listrik Tosca',
    spec: 'Ibanez / Fender Stratocaster Custom',
    desc: 'Gitar listrik dengan warna tosca/cyan yang modern dan cerah, ideal untuk riff melodi yang tajam, solo gitar elektrik yang megah, dan suara overdrive yang dinamis.',
    img: '/media/instruments/tosca_guitar.jpg'
  },
  {
    name: 'Keyboard KORG',
    spec: 'KORG Synthesizer Kross / Krome',
    desc: 'Keyboard Synthesizer KORG profesional, menghadirkan pad suara yang kaya, efek piano klasik yang elegan, serta synthesizer synth-lead modern untuk melengkapi harmoni.',
    img: '/media/instruments/korg_keyboard.jpg'
  },
  {
    name: 'Drum Electric NUX',
    spec: 'NUX DM-7X / DM-8 Mesh Kit (Hitam)',
    desc: 'Drum elektrik NUX hitam dengan respon dinamis tinggi, memberikan ketukan ritme yang presisi, drum fill yang bertenaga, dan kemudahan dalam latihan studio maupun performa.',
    img: '/media/instruments/nux_drum.jpg'
  }
];

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [webEditorConfig, setWebEditorConfig] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  // Auto rotate hero cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadSettings();
    loadTestimonials();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getPublicSettings();
      if (res.data) {
        setIsSessionOpen(res.data.registrationSession?.status === 'open');
        if (res.data.landingPageContent) {
          setContent(res.data.landingPageContent);
        }
        if (res.data.webEditorConfig) {
          setWebEditorConfig(res.data.webEditorConfig);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadTestimonials = async () => {
    try {
      const res = await getPublicTestimonials();
      setTestimonials(res.data || []);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    }
  };

  // Resolve config variables
  const webTitle = webEditorConfig?.hero?.webTitle || 'MANSAME Band';
  const heroDesc = webEditorConfig?.hero?.heroDesc || 'Ekstrakurikuler Seni Musik & Band MAN 1 Muara Enim — wadah kreativitas, mengasah keterampilan musik, aransemen lagu, dan melatih rasa percaya diri di atas panggung.';

  const tahunBerdiri = webEditorConfig?.tentangKami?.yearFounded || content?.tahunBerdiri || '2023';
  const aktifType = webEditorConfig?.tentangKami?.activeMembersType || 'Real';
  const aktifFake = webEditorConfig?.tentangKami?.activeMembersFakeValue || '';
  const anggotaAktif = (aktifType === 'Fake' || aktifType === 'Real+Fake') ? aktifFake : '50+';
  const kegiatan = webEditorConfig?.tentangKami?.activitiesCount || content?.kegiatan || '10+ Event';
  
  const visi = webEditorConfig?.visiMisi?.visi || content?.visi || 'Menjadi wadah kreativitas seni musik remaja yang aktif, produktif, kompak, dan berprestasi, serta menjunjung tinggi harmoni kebersamaan.';
  
  const rawMisi = webEditorConfig?.visiMisi?.misi || content?.misi;
  const misiList = rawMisi 
    ? (typeof rawMisi === 'string' ? rawMisi.split('\n').filter(Boolean) : rawMisi)
    : DEFAULT_MISI;

  return (
    <div className={styles.pageContainer}>
      <SEO />

      {/* Decorative Blobs */}
      <div className={styles.blobLeft} />
      <div className={styles.blobRight} />

      {/* ── 1. Hero Section ── */}
      <section className={styles.hero} id="beranda">
        <div className="container">
          <div className={styles.heroGrid}>
            
            {/* Left Info Column */}
            <div className={styles.heroLeft}>
              <div className={styles.tagBadge}>
                <div className={styles.tagDot} />
                <span>Audisi Terbuka 2026</span>
              </div>
              <h1 className={styles.heroTitle}>
                Jelajahi Nada, <br />
                Temukan <strong>Harmonimu</strong>
              </h1>
              <p className={styles.heroDesc}>
                {heroDesc}
              </p>
              
              <div className={styles.heroBtns}>
                <Link to="/daftar" className={styles.btnPrimary}>
                  {isSessionOpen ? 'Gabung Audisi Sekarang' : 'Audisi Ditutup'}
                  <ArrowRight size={18} />
                </Link>
                <Link to="/cek-kelulusan" className={styles.btnOutline}>
                  Cek Kelulusan
                </Link>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{anggotaAktif}</span>
                  <span className={styles.heroStatLabel}>Anggota Aktif</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{kegiatan}</span>
                  <span className={styles.heroStatLabel}>Pertunjukan Stage</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{tahunBerdiri}</span>
                  <span className={styles.heroStatLabel}>Tahun Berdiri</span>
                </div>
              </div>
            </div>

            {/* Right Card Rotation Column */}
            <div className={styles.heroRight}>
              <div className={styles.cardShowcase}>
                {HERO_IMAGES.map((img, index) => {
                  let cardClass = styles.showcaseCard;
                  if (index === activeCard) {
                    cardClass += ` ${styles.cardActive}`;
                  } else if (index === (activeCard + 1) % HERO_IMAGES.length) {
                    cardClass += ` ${styles.cardNext}`;
                  } else if (index === (activeCard - 1 + HERO_IMAGES.length) % HERO_IMAGES.length) {
                    cardClass += ` ${styles.cardPrev}`;
                  }
                  
                  return (
                    <div key={index} className={cardClass}>
                      <img src={img.src} alt={img.alt} className={styles.showcaseImg} />
                    </div>
                  );
                })}
              </div>
              
              <div className={styles.showcaseControls}>
                {HERO_IMAGES.map((_, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveCard(index)}
                    className={`${styles.controlDot} ${index === activeCard ? styles.controlDotActive : ''}`}
                    aria-label={`Lihat Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Tentang Kami: Instrument Showcase ── */}
      <section className={`section ${styles.instrumentsSection}`} id="tentang">
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Seksi Musik Kami
            <span className={styles.titleBar} />
          </h2>
          
          <div className={styles.instrumentsGrid}>
            {INSTRUMENTS.map((inst, index) => {
              const IconComp = inst.icon;
              return (
                <div key={index} className={styles.instrumentCard}>
                  <div className={styles.instrumentIcon}>
                    <IconComp size={24} />
                  </div>
                  <h3>{inst.name}</h3>
                  <p>{inst.desc}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.aboutLinkContainer}>
            <Link to="/kami" className={styles.learnMoreBtn}>
              Lihat Detail Struktur Kepengurusan <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2.5. Showcase Alat Musik Utama ── */}
      <section className={`section ${styles.instrumentPreviewSection}`} id="alat-musik">
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Alat Musik Utama Kami
            <span className={styles.titleBar} />
          </h2>
          <p className={styles.sectionSubtitle}>
            Intip instrumen premium yang kami gunakan untuk menciptakan karya musik MANSAME Band yang memukau.
          </p>
          
          <div className={styles.instrumentPreviewGrid}>
            {INSTRUMENT_PREVIEWS.map((item, index) => (
              <div key={index} className={`glass-card ${styles.instrumentPreviewCard}`}>
                <div className={styles.instrumentImgWrap}>
                  <img src={item.img} alt={item.name} className={styles.instrumentImg} />
                </div>
                <div className={styles.instrumentInfoWrap}>
                  <span className={styles.instrumentSpec}>{item.spec}</span>
                  <h3 className={styles.instrumentName}>{item.name}</h3>
                  <p className={styles.instrumentDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Visi Misi Section ── */}
      <section className={`section ${styles.visiMisiSection}`} id="visi-misi">
        <div className="container">
          <div className={styles.visiMisiGrid}>
            
            {/* Visi Left Column */}
            <div className={styles.visiCard}>
              <span className={styles.visiLabel}>Visi Utama</span>
              <blockquote className={styles.visiQuote}>
                "{visi}"
              </blockquote>
            </div>

            {/* Misi Right Column */}
            <div className={styles.misiCard}>
              <span className={styles.misiLabel}>Misi Kami</span>
              <div className={styles.misiList}>
                {misiList.map((item, index) => (
                  <div key={index} className={styles.misiItem}>
                    <div className={styles.misiNum}>{index + 1}</div>
                    <div className={styles.misiText}>{item}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Testimonials Section ── */}
      {testimonials.length > 0 && (
        <section className={`section ${styles.testimonialsSection}`} id="apa-kata-alumni">
          <div className={styles.testimonialsHeaderWrap}>
            <div className="container">
              <h2 className={styles.sectionTitle}>
                Suara dari Alumni
                <span className={styles.titleBar} />
              </h2>
            </div>
          </div>

          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {/* Double mapping for seamless infinite loops */}
              {[...testimonials, ...testimonials].map((t, index) => (
                <div 
                  key={`${t.id}-${index}`} 
                  className={styles.testimonialCard} 
                  onClick={() => setSelectedTestimonial(t)}
                >
                  <div className={styles.testimonialHeader}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.profilePic} />
                    ) : (
                      <div className={styles.profilePlaceholder}>{t.name[0]}</div>
                    )}
                    <div className={styles.profileMeta}>
                      <h4 className={styles.profileName}>{t.name}</h4>
                      <span className={styles.profileYear}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <p className={styles.testimonialText}>"{t.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. CTA Bottom ── */}
      <section className={styles.ctaSection}>
        <div className={`container`}>
          <div className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>
                {isSessionOpen ? 'Siap Guncang Panggung Bersama?' : 'Audisi Ditutup Sementara'}
              </h2>
              <p className={styles.ctaSub}>
                {isSessionOpen 
                  ? 'Daftarkan bakat bermusikmu sekarang. Jadilah bagian dari grup band resmi MAN 1 Muara Enim.'
                  : 'Sesi registrasi calon anggota baru sedang ditutup. Pantau instagram kami untuk sesi berikutnya!'
                }
              </p>
            </div>
            {isSessionOpen && (
              <Link to="/daftar" className={styles.btnPrimary}>
                Gabung Sekarang
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial Modal Popup */}
      {selectedTestimonial && (
        <div className={styles.testimonialModalOverlay} onClick={() => setSelectedTestimonial(null)}>
          <div className={styles.testimonialModalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedTestimonial(null)}>×</button>
            <div className={styles.modalPhotoWrap}>
              {selectedTestimonial.photoPath ? (
                <img src={getUploadUrl(selectedTestimonial.photoPath)} alt={selectedTestimonial.name} className={styles.modalPhoto} />
              ) : (
                <div className={styles.modalPhotoPlaceholder}>{selectedTestimonial.name[0]}</div>
              )}
            </div>
            <h3 className={styles.modalName}>{selectedTestimonial.name}</h3>
            <span className={styles.modalBadge}>Angkatan {selectedTestimonial.angkatan}</span>
            <p className={styles.modalText}>"{selectedTestimonial.content}"</p>
          </div>
        </div>
      )}

    </div>
  );
}
