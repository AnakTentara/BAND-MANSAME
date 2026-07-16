import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBlogPosts } from '@/api/forum';
import { timeAgo } from '@/utils/formatDate';
import { truncate, stripHtml } from '@/utils/truncate';
import { getUploadUrl } from '@/api/axios';
import { Search as SearchIcon, Heart, MessageSquare, Eye, Edit2, Bookmark, FolderOpen, ArrowRight } from 'lucide-react';
import SkeletonCard from '@/components/skeletons/SkeletonCard';
import SEO from '@/components/common/SEO';
import { useAuthStore } from '@/stores/authStore';
import styles from './ForumPage.module.css';

const CATEGORIES = [
  { value: 'Semua', label: 'Semua', color: 'var(--color-text-secondary)' },
  { value: 'Umum', label: 'Umum', color: '#6b7280' },
  { value: 'Edukasi', label: 'Edukasi', color: '#3b82f6' },
  { value: 'Kegiatan', label: 'Kegiatan', color: '#f97316' },
  { value: 'Konseling', label: 'Konseling', color: '#8b5cf6' },
  { value: 'Pengumuman', label: 'Pengumuman', color: '#ef4444' },
  { value: 'Curhat', label: 'Curhat', color: '#ec4899' },
];

export default function ForumPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const activeCategory = searchParams.get('category') || 'Semua';
  const activeSort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const [total, setTotal] = useState(0);
  const limit = 9;

  const { isCandidateAuthenticated, candidateUser, isAdminAuthenticated } = useAuthStore();
  const isLogged = isCandidateAuthenticated || isAdminAuthenticated;

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, activeSort, page, searchParams]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        category: activeCategory !== 'Semua' ? activeCategory : undefined,
        sort: activeSort,
        search: searchParams.get('search') || undefined
      };
      const res = await getBlogPosts(params);
      setPosts(res.data?.posts || []);
      setTotal(res.data?.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', cat);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (sortVal) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortVal);
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-wrapper">
      <SEO 
        title="Forum Komunitas Musik MANSAME Band" 
        description="Ruang diskusi, sharing tips bermusik, aransemen lagu, lirik karya, dan interaksi komunitas anggota MANSAME Band MAN 1 Muara Enim." 
      />
      <section className="section">
        <div className="container" style={{ maxWidth: '1040px' }}>
          
          {/* Header Section */}
          <div className={styles.forumHeader}>
            <div>
              <span className={styles.kicker}>RUANG BERBAGI & DISKUSI</span>
              <h1 className={styles.title}>Komunitas Musik MANSAME Band</h1>
              <p className={styles.subtitle}>Bagikan tips latihan, bahas lagu favorit, dan mulailah berdiskusi kreatif bersama seluruh anggota band.</p>
            </div>
            
            {isLogged && (
              <Link to="/blog/tulis" className="btn btn-primary" style={{ gap: '8px' }}>
                <Edit2 size={16} />
                Buat Postingan Baru
              </Link>
            )}
          </div>

          {/* Navigation Category Tabs */}
          <div className={styles.categoryScroller}>
            <div className={styles.categoryTabs}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`${styles.categoryTab} ${activeCategory === cat.value ? styles.categoryTabActive : ''}`}
                >
                  {cat.value !== 'Semua' && (
                    <span className={styles.dotIndicator} style={{ backgroundColor: cat.color }} />
                  )}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className={styles.toolbar}>
            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <SearchIcon size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari thread diskus atau artikel blog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className={styles.sortSelector}>
              <span className={styles.sortLabel}>Urutkan:</span>
              <select
                className={styles.sortSelect}
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="newest">Terbaru</option>
                <option value="popular">Terpopuler (Views)</option>
                <option value="likes">Paling Disukai</option>
                <option value="comments">Banyak Komentar</option>
              </select>
            </div>
          </div>

          {/* Content Listing */}
          {loading ? (
            <div className={styles.threadsList}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={styles.skeletonThreadItem}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '40%', height: '14px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}>
              <FolderOpen size={48} className={styles.emptyIcon} />
              <h3>Belum Ada Postingan</h3>
              <p>Tidak ada artikel blog atau thread diskusi yang ditemukan pada kategori ini.</p>
              {isLogged && (
                <Link to="/blog/tulis" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  Tulis Thread Pertama
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className={styles.threadsList}>
                {posts.map((post) => {
                  const initials = post.authorName ? post.authorName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';
                  const catInfo = CATEGORIES.find(c => c.value === post.category) || { color: '#6b7280' };
                  
                  return (
                    <article key={post.id} className={styles.threadItem}>
                      {/* Left: Author Avatar */}
                      <div className={styles.threadAvatarWrap}>
                        {post.authorPhoto ? (
                          <img src={getUploadUrl(post.authorPhoto)} alt={post.authorName} className={styles.threadAvatar} />
                        ) : (
                          <div className={styles.threadAvatarText}>{initials}</div>
                        )}
                      </div>

                      {/* Center: Thread Info */}
                      <div className={styles.threadContent}>
                        <div className={styles.threadMetaTop}>
                          <span 
                            className={styles.threadCategory} 
                            style={{ 
                              color: catInfo.color, 
                              borderColor: catInfo.color + '30',
                              backgroundColor: catInfo.color + '10'
                            }}
                          >
                            {post.category}
                          </span>
                          <span className={styles.threadMetaDivider}>•</span>
                          <span className={styles.threadAuthor}>{post.authorName}</span>
                          <span className={styles.roleBadge}>{post.authorRole.toUpperCase()}</span>
                          <span className={styles.threadMetaDivider}>•</span>
                          <span className={styles.threadTime}>{timeAgo(post.createdAt)}</span>
                        </div>

                        <Link to={`/blog/${post.slug}`} className={styles.threadTitleLink}>
                          <h2 className={styles.threadTitle}>
                            {post.title}
                            {post.status === 'DRAFT' && <span className={styles.draftBadge}>DRAF</span>}
                          </h2>
                        </Link>

                        {post.tags && (
                          <div className={styles.threadTags}>
                            {post.tags.split(',').map((tag) => (
                              <span key={tag} className={styles.threadTag}>#{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Stats and Arrow */}
                      <div className={styles.threadRight}>
                        <div className={styles.threadStats}>
                          <div className={styles.statItem} title="Suka">
                            <Heart size={14} />
                            <span>{post.likeCount || 0}</span>
                          </div>
                          <div className={styles.statItem} title="Komentar">
                            <MessageSquare size={14} />
                            <span>{post.commentCount || 0}</span>
                          </div>
                          <div className={styles.statItem} title="Dilihat">
                            <Eye size={14} />
                            <span>{post.views || 0}</span>
                          </div>
                        </div>

                        <Link to={`/blog/${post.slug}`} className={styles.goBtn}>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(Math.max(1, page - 1)));
                      setSearchParams(newParams);
                    }}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(Math.min(totalPages, page + 1)));
                      setSearchParams(newParams);
                    }}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Floating Action Button for Mobile */}
          {isLogged && (
            <Link to="/blog/tulis" className={styles.mobileFab} title="Tulis Artikel Baru">
              <Edit2 size={20} />
            </Link>
          )}

        </div>
      </section>
    </div>
  );
}
