import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { getGalleryPhotos, getGalleryCategories } from '@/api/gallery';
import { getUploadUrl } from '@/api/axios';
import SEO from '@/components/common/SEO';
import styles from './GaleriPage.module.css';

export default function GaleriPage() {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState(['Semua']);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null); // index foto yg dibuka

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [activeCategory]);

  const loadCategories = async () => {
    try {
      const res = await getGalleryCategories();
      setCategories(res.data || ['Semua']);
    } catch {
      setCategories(['Semua']);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await getGalleryPhotos(activeCategory);
      setPhotos(res.data || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Lightbox navigation
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = useCallback(() => {
    setLightboxIndex(i => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);
  const nextPhoto = useCallback(() => {
    setLightboxIndex(i => (i + 1) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="page-wrapper">
      <SEO
        title="Galeri Foto MANSAME Band"
        description="Galeri foto dokumentasi penampilan, latihan, dan kegiatan MANSAME Band MAN 1 Muara Enim."
      />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroIcon}><Images size={40} /></div>
          <h1 className={styles.heroTitle}>Galeri Foto</h1>
          <p className={styles.heroSubtitle}>
            Dokumentasi penampilan, latihan, dan momen spesial MANSAME Band dari panggung ke studio.
          </p>
        </div>
      </section>

      {/* ── Filter Kategori ── */}
      <section className={`section-sm ${styles.filterSection}`}>
        <div className="container">
          <div className={styles.filterBar}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grid Foto ── */}
      <section className={`section ${styles.gallerySection}`}>
        <div className="container">
          {loading ? (
            <div className={styles.skeletonGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className={styles.emptyState}>
              <Images size={56} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Belum Ada Foto</h3>
              <p className={styles.emptyDesc}>
                Foto untuk kategori <strong>{activeCategory}</strong> belum tersedia. Nantikan update terbaru kami!
              </p>
            </div>
          ) : (
            <div className={styles.masonryGrid}>
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`${styles.photoCard} ${photo.isFeatured ? styles.photoCardFeatured : ''}`}
                  onClick={() => openLightbox(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat foto: ${photo.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && openLightbox(index)}
                >
                  <div className={styles.photoImgWrap}>
                    <img
                      src={getUploadUrl(photo.photoPath)}
                      alt={photo.title}
                      className={styles.photoImg}
                      loading="lazy"
                    />
                    <div className={styles.photoOverlay}>
                      <ZoomIn size={24} className={styles.zoomIcon} />
                    </div>
                  </div>
                  <div className={styles.photoMeta}>
                    <span className={styles.photoCategory}>{photo.category}</span>
                    <h3 className={styles.photoTitle}>{photo.title}</h3>
                    {photo.description && (
                      <p className={styles.photoDesc}>{photo.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      {activeLightboxPhoto && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxInner} onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Tutup">
              <X size={22} />
            </button>

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={prevPhoto} aria-label="Foto sebelumnya">
                  <ChevronLeft size={28} />
                </button>
                <button className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={nextPhoto} aria-label="Foto berikutnya">
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Image */}
            <div className={styles.lightboxImgWrap}>
              <img
                src={getUploadUrl(activeLightboxPhoto.photoPath)}
                alt={activeLightboxPhoto.title}
                className={styles.lightboxImg}
              />
            </div>

            {/* Caption */}
            <div className={styles.lightboxCaption}>
              <span className={styles.lightboxCategory}>{activeLightboxPhoto.category}</span>
              <h3 className={styles.lightboxTitle}>{activeLightboxPhoto.title}</h3>
              {activeLightboxPhoto.description && (
                <p className={styles.lightboxDesc}>{activeLightboxPhoto.description}</p>
              )}
              {photos.length > 1 && (
                <span className={styles.lightboxCount}>
                  {lightboxIndex + 1} / {photos.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
