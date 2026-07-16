import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '@/api/blog';
import { timeAgo } from '@/utils/formatDate';
import { truncate, stripHtml } from '@/utils/truncate';
import { estimateReadingTime } from '@/utils/readingTime';
import { getUploadUrl } from '@/api/axios';
import { MessageSquare, Search as SearchIcon, Clock } from 'lucide-react';
import SkeletonCard from '@/components/skeletons/SkeletonCard';
import SEO from '@/components/common/SEO';
import styles from './BlogPage.module.css';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts({ page, limit });
      const data = res.data;
      setPosts(data.data || data.posts || data);
      setTotal(data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.content?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-wrapper">
      <SEO 
        title="Blog & Artikel" 
        description="Temukan kumpulan artikel musik, info tips bermusik, kegiatan ekstrakurikuler musik, pertunjukan, dan berita seputar MANSAME Band MAN 1 Muara Enim." 
      />
      <section className="section">
        <div className="container">
          {/* Newspaper Header */}
          <div className={styles.newspaperHeader}>
            <div className={styles.newspaperHeaderTop}>
              <span>Vol. III No. 4</span>
              <span className={styles.newspaperHeaderCenter}>MANSEKU DAILY</span>
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className={styles.newspaperBannerTitle}>Edisi Digital MANSAME Band</h1>
            <div className={styles.newspaperHeaderBottom}>
              <span>Ekstrakurikuler Musik &amp; Grup Band Resmi MAN 1 Muara Enim</span>
              <div className={styles.searchWrap}>
                <SearchIcon size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cari berita..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>Belum ada artikel.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {filtered.map((post) => {
                  const firstImg = post.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || null;
                  return (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className={`${styles.card} ${firstImg ? styles.cardHasImg : ''}`}
                    >
                      {firstImg && (
                        <div className={styles.thumbnailContainer}>
                          <img src={getUploadUrl(firstImg)} alt={post.title} className={styles.thumbnail} />
                        </div>
                      )}
                      <h3 className={styles.cardTitle} style={{ marginTop: firstImg ? '8px' : '0' }}>{post.title}</h3>
                      <p className={styles.cardBody}>
                        {truncate(stripHtml(post.content), 120)}
                      </p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardDate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {timeAgo(post.createdAt)}
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-text-secondary)' }}>
                            <Clock size={11} /> {estimateReadingTime(post.content)}
                          </span>
                        </span>
                        <span className={styles.cardComments}>
                          <MessageSquare size={13} />
                          {post._count?.comments ?? post.comments?.length ?? 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
