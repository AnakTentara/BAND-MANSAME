import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug } from '@/api/blog';
import { formatDate } from '@/utils/formatDate';
import { ArrowLeft, Share2, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { estimateReadingTime } from '@/utils/readingTime';
import SEO from '@/components/common/SEO';
import styles from './BeritaPostPage.module.css';

export default function BeritaPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await getPostBySlug(slug);
      setPost(res.data?.post || res.data);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      })
      .then(() => toast.success('Berhasil membagikan berita!'))
      .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan berita berhasil disalin ke clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <SEO title="Memuat Berita..." description="Silakan tunggu, rilis berita sedang dimuat." />
        <div className={`container ${styles.articleWrap}`}>
          <div className={`skeleton ${styles.skelTitle}`} />
          <div className={`skeleton ${styles.skelMeta}`} />
          <div className={styles.skelBody}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`skeleton ${styles.skelLine}`} style={{ width: i % 3 === 2 ? '65%' : '100%' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-wrapper">
        <SEO title="Berita Tidak Ditemukan" description="Maaf, berita yang Anda cari tidak ditemukan atau telah dihapus." />
        <div className={`container ${styles.articleWrap}`}>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'Georgia, serif' }}>Berita tidak ditemukan.</p>
          <Link to="/berita" className="btn btn-secondary" style={{ marginTop: 16 }}>← Kembali ke Berita</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <SEO title={post.title} description={post.content} type="article" />
      <div className={`container ${styles.articleWrap}`}>
        {/* Back */}
        <Link to="/berita" className={styles.backLink}>
          <ArrowLeft size={16} />
          Kembali ke Berita
        </Link>

        {/* Header */}
        <article className={styles.article}>
          <h1 className={styles.articleTitle}>{post.title}</h1>
          <div className={styles.articleMeta}>
            <span>{formatDate(post.createdAt)}</span>
            {post.author?.username && (
              <>
                <span className={styles.metaDot} />
                <span>{post.author.username}</span>
              </>
            )}
            <span className={styles.metaDot} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={12} /> {estimateReadingTime(post.content)}
            </span>
            <span className={styles.metaDot} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Eye size={12} /> {post.views || 0} Kali Dibaca
            </span>
          </div>

          <hr className={styles.divider} />

          {/* Content */}
          <div
            className={styles.prose}
            dangerouslySetInnerHTML={{ 
              __html: (() => {
                if (!post.content) return '';
                const cleanBase = window.location.hostname === 'localhost' 
                  ? 'http://localhost:25552/uploads' 
                  : `${window.location.origin}/api/uploads`;
                return post.content.replace(/src="\/uploads\//g, `src="${cleanBase}/`);
              })()
            }}
          />

          {/* Action Row */}
          <div className={styles.actionRow}>
            <button 
              onClick={handleShare} 
              className={styles.actionBtn}
              title="Bagikan Berita"
            >
              <Share2 size={18} />
              <span>Bagikan Berita</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
