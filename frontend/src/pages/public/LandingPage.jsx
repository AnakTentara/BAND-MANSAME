import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, BookOpen } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getPublicTestimonials } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './LandingPage.module.css';

const HERO_SLIDES = [
  { src: '/media/heros/hero1.jpeg', alt: 'Kegiatan MANSAME Band 1' },
  { src: '/media/heros/hero2.jpeg', alt: 'Kegiatan MANSAME Band 2' },
];

const DEFAULT_MISI = [
  'Mengasah kreativitas dan keterampilan bermusik siswa MAN 1 Muara Enim di bidang vokal dan instrumen.',
  'Menyelenggarakan latihan rutin yang disiplin, suportif, dan menyenangkan.',
  'Mengembangkan aransemen musik orisinal maupun cover lintas genre dengan performa berkualitas.',
  'Membangun kerja sama tim yang solid serta melatih kepercayaan diri tampil di atas panggung.',
];

function ScrollReveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { 
        threshold: 0.1,
        rootMargin: "-40px 0px -40px 0px"
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`${styles.revealFade} ${isVisible ? styles.revealFadeActive : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [webEditorConfig, setWebEditorConfig] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
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
  const anggotaAktif = (aktifType === 'Fake' || aktifType === 'Real+Fake') ? aktifFake : '50+'; // ideally this should also combine real if Real+Fake, but keeping simple for UI display
  const kegiatan = webEditorConfig?.tentangKami?.activitiesCount || content?.kegiatan || '10+ Event';
  
  const aboutText1 = webEditorConfig?.tentangKami?.aboutText1 || content?.aboutText1 || 'MANSAME Band adalah organisasi ekstrakurikuler musik dan band yang menaungi minat bakat seni musik siswa di MAN 1 Muara Enim. Kami hadir sebagai studio kreativitas bagi siswa-siswi yang ingin mendalami instrumen gitar, bass, drum, keyboard, vokal, hingga teknik sound engineering.';
  const aboutText2 = webEditorConfig?.tentangKami?.aboutText2 || content?.aboutText2 || 'Dengan studio latihan mandiri dan bimbingan yang bersahabat, MANSAME Band berkomitmen menciptakan generasi muda yang kreatif, percaya diri, dan berprestasi di bidang seni pertunjukan serta festival musik.';
  
  const visi = webEditorConfig?.visiMisi?.visi || content?.visi || 'Menjadi wadah kreativitas seni musik remaja yang aktif, produktif, kompak, dan berprestasi, serta menjunjung tinggi harmoni kebersamaan.';
  
  const rawMisi = webEditorConfig?.visiMisi?.misi || content?.misi;
  const misiList = rawMisi 
    ? (typeof rawMisi === 'string' ? rawMisi.split('\n').filter(Boolean) : rawMisi)
    : DEFAULT_MISI;

  return (
    <div className="page-wrapper">
      <SEO />

      {/* ── Hero ── */}
      <section className={styles.hero} id="beranda">
        {/* Full-width slideshow background */}
        <div className={styles.slideshowContainer}>
          <div className={styles.slideshow}>
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`${styles.slide} ${i === activeSlide ? styles.active : ''}`}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className={styles.slideImg}
                />
              </div>
            ))}
          </div>
          {/* Transition overlay: smooth vertical and horizontal fade to white */}
          <div className={styles.heroOverlay} />
        </div>

        {/* Foreground Content */}
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            {/* Mobile Badges (Visible on mobile only) */}
            <div className={styles.mobileBadges}>
              <div className={styles.slideBadge}>
                <div className={styles.slideBadgeIcon}>
                  <Users size={16} />
                </div>
                <div className={styles.slideBadgeText}>
                  <span className={styles.slideBadgeNum}>Latihan Studio</span>
                  <span className={styles.slideBadgeLabel}>MANSAME Band</span>
                </div>
              </div>
              <div className={styles.slideBadge}>
                <div className={styles.slideBadgeIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <BookOpen size={16} />
                </div>
                <div className={styles.slideBadgeText}>
                  <span className={styles.slideBadgeNum}>Komposisi Musik</span>
                  <span className={styles.slideBadgeLabel}>Harmoni Kreatif</span>
                </div>
              </div>
            </div>

            <p className={styles.heroEyebrow}>
              <span />
              Selamat Datang di
            </p>
            <h1 className={styles.heroTitle}>
              {webTitle.includes(' ') ? (
                <>
                  {webTitle.split(' ')[0]} <strong>{webTitle.substring(webTitle.indexOf(' ') + 1)}</strong>
                </>
              ) : (
                <strong>{webTitle}</strong>
              )}
            </h1>
            <p className={styles.heroDesc}>
              {heroDesc}
            </p>
            <div className={styles.heroBtns}>
              <Link to="/daftar" className={styles.heroBtnPrimary}>
                {isSessionOpen ? 'Daftar Sekarang' : 'Pendaftaran Ditutup'}
                <ArrowRight size={16} />
              </Link>
              <Link to="/cek-kelulusan" className={styles.heroBtnOutline}>
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
                <span className={styles.heroStatLabel}>Program Kegiatan</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{tahunBerdiri}</span>
                <span className={styles.heroStatLabel}>Tahun Berdiri</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Badge Left */}
        <div className={styles.badgeLeft}>
          <div className={styles.slideBadge}>
            <div className={styles.slideBadgeIcon}>
              <Users size={18} />
            </div>
            <div className={styles.slideBadgeText}>
              <span className={styles.slideBadgeNum}>Latihan Studio</span>
              <span className={styles.slideBadgeLabel}>MANSAME Band</span>
            </div>
          </div>
        </div>

        {/* Floating Badge Right */}
        <div className={styles.badgeRight}>
          <div className={styles.slideBadge} style={{ animationDelay: '0.3s' }}>
            <div className={styles.slideBadgeIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <BookOpen size={18} />
            </div>
            <div className={styles.slideBadgeText}>
              <span className={styles.slideBadgeNum}>Komposisi Musik</span>
              <span className={styles.slideBadgeLabel}>Remaja Kreatif &amp; Berbakat</span>
            </div>
          </div>
        </div>

        {/* Dot navigation */}
        <div className={styles.slideDots}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.slideDot} ${i === activeSlide ? styles.activeDot : ''}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Tentang ── */}
      <section className="section" id="tentang">
        <div className={`container ${styles.aboutGrid}`}>
          <ScrollReveal>
            <div className={styles.aboutText}>
              <h2 className={styles.sectionTitle}>
                Tentang Kami
                <span className={styles.titleBar} />
              </h2>
              <p className={styles.aboutDesc}>{aboutText1}</p>
              <p className={styles.aboutDesc}>{aboutText2}</p>
              <Link to="/kami" className={styles.learnMoreLink}>
                Pelajari Lebih Lanjut <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          <div className={styles.aboutStats}>
            <ScrollReveal delay={0}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{tahunBerdiri}</div>
                  <div className={styles.statLabel}>Tahun Berdiri</div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Users size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{anggotaAktif}</div>
                  <div className={styles.statLabel}>Anggota Aktif</div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{kegiatan}</div>
                  <div className={styles.statLabel}>Kegiatan</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Visi Misi ── */}
      <section className={`section ${styles.visiMisiSection}`} id="visi-misi">
        <div className="container">
          <ScrollReveal>
            <h2 className={styles.sectionTitle}>
              Visi &amp; Misi
              <span className={styles.titleBar} />
            </h2>
          </ScrollReveal>

          <div className={styles.visiMisiGrid}>
            <ScrollReveal delay={100}>
              <div className={styles.visiCard}>
                <span className={styles.visiLabel}>Visi</span>
                <blockquote className={styles.visiQuote}>{visi}</blockquote>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className={styles.misiCard}>
                <span className={styles.misiLabel}>Misi</span>
                <ol className={styles.misiList}>
                  {misiList.map((item, i) => (
                    <li key={i} className={styles.misiItem}>
                      <span className={styles.misiNum}>{i + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials (Apa Kata Alumni?) ── */}
      {testimonials.length > 0 && (
        <section className={`section ${styles.testimonialsSection}`} id="apa-kata-alumni">
          <div className={styles.testimonialsHeaderWrap}>
            <div className="container">
              <ScrollReveal>
                <h2 className={styles.sectionTitle}>
                  Apa Kata Alumni?
                  <span className={styles.titleBar} />
                </h2>
              </ScrollReveal>
            </div>
          </div>

          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {/* Set 1 */}
              {testimonials.map((t) => (
                <div key={`${t.id}-1`} className={styles.testimonialCard} onClick={() => setSelectedTestimonial(t)}>
                  <div className={styles.testimonialPhotoWrap}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.testimonialPhoto} />
                    ) : (
                      <div className={styles.testimonialPhotoPlaceholder}>{t.name[0]}</div>
                    )}
                    <div className={styles.testimonialMetaOverlay}>
                      <h4 className={styles.testimonialName}>{t.name}</h4>
                      <span className={styles.testimonialBadge}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <div className={styles.testimonialContent}>
                    <p className={styles.testimonialText}>"{t.content}"</p>
                  </div>
                </div>
              ))}
              {/* Set 2 (Duplikasi untuk Seamless Infinite Scroll) */}
              {testimonials.map((t) => (
                <div key={`${t.id}-2`} className={styles.testimonialCard} onClick={() => setSelectedTestimonial(t)}>
                  <div className={styles.testimonialPhotoWrap}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.testimonialPhoto} />
                    ) : (
                      <div className={styles.testimonialPhotoPlaceholder}>{t.name[0]}</div>
                    )}
                    <div className={styles.testimonialMetaOverlay}>
                      <h4 className={styles.testimonialName}>{t.name}</h4>
                      <span className={styles.testimonialBadge}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <div className={styles.testimonialContent}>
                    <p className={styles.testimonialText}>"{t.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Bottom ── */}
      <section className={styles.ctaSection}>
        <div className={`container ${styles.ctaInner}`}>
          <ScrollReveal>
            <div>
              <h2 className={styles.ctaTitle}>
                {isSessionOpen ? 'Tertarik bergabung dengan MANSAME Band?' : 'Pendaftaran Saat Ini Ditutup'}
              </h2>
              <p className={styles.ctaSub}>
                {isSessionOpen 
                  ? 'Daftarkan dirimu sekarang dan jadilah bagian dari komunitas musik terbaik MAN 1 Muara Enim.'
                  : 'Nantikan pembukaan pendaftaran sesi berikutnya. Terus pantau media sosial kami!'
                }
              </p>
            </div>
          </ScrollReveal>
          {isSessionOpen && (
            <ScrollReveal delay={150}>
              <Link to="/daftar" className="btn btn-primary btn-lg">
                Daftar Sekarang
                <ArrowRight size={18} />
              </Link>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Testimonial Popup Modal */}
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

