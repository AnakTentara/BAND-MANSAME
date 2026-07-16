import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost } from '@/api/blog';
import { getBlogPosts, deleteBlogPost, approveBlogPostApi } from '@/api/forum';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { formatDateShort } from '@/utils/formatDate';
import { Edit2, Trash2, Plus, Check, FileText, MessageSquare, ListFilter, Rss } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminBlogPage.module.css';

export default function AdminBlogPage() {
  const [activeTab, setActiveTab] = useState('berita'); // 'berita' | 'blog'
  
  // Berita State
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Blog State
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [blogStatusFilter, setBlogStatusFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'

  const { openConfirm } = useUIStore();

  useEffect(() => {
    fetchNews();
    fetchBlogs();
  }, []);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await getPosts({ limit: 100 });
      setNews(res.data?.data || res.data?.posts || res.data || []);
    } catch {
      toast.error('Gagal memuat berita.');
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      // Fetch both draft and published blog posts
      const res = await getBlogPosts({ limit: 100, status: 'ALL' });
      setBlogs(res.data?.posts || []);
    } catch {
      toast.error('Gagal memuat postingan blog komunitas.');
    } finally {
      setLoadingBlogs(false);
    }
  };

  const handleDeleteNews = (id, title) => {
    openConfirm({
      title: 'Hapus Berita',
      message: `Hapus berita resmi "${title}"? Tindakan tidak dapat dibatalkan.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deletePost(id);
          setNews((prev) => prev.filter((n) => n.id !== id));
          toast.success('Berita berhasil dihapus.');
        } catch {
          toast.error('Gagal menghapus berita.');
        }
      },
    });
  };

  const handleDeleteBlog = (id, title) => {
    openConfirm({
      title: 'Hapus Postingan Blog',
      message: `Hapus postingan blog "${title}" dari komunitas? Semua komentar dan suka juga akan terhapus.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteBlogPost(id);
          setBlogs((prev) => prev.filter((b) => b.id !== id));
          toast.success('Postingan blog berhasil dihapus.');
        } catch {
          toast.error('Gagal menghapus postingan blog.');
        }
      },
    });
  };

  const handleApproveBlog = async (id, title) => {
    try {
      await approveBlogPostApi(id);
      toast.success(`Postingan "${title}" berhasil disetujui!`);
      fetchBlogs(); // refresh
    } catch {
      toast.error('Gagal menyetujui postingan blog.');
    }
  };

  // Filtered Blogs
  const filteredBlogs = blogs.filter((b) => {
    if (blogStatusFilter === 'ALL') return true;
    return b.status === blogStatusFilter;
  });

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Konten"
        subtitle="Kelola rilis berita resmi dan postingan blog forum komunitas"
      >
        {activeTab === 'berita' ? (
          <Link to="/admin/blog/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Berita Baru
          </Link>
        ) : (
          <Link to="/blog/tulis" className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
            <Plus size={15} />
            Blog Baru
          </Link>
        )}
      </AdminHeader>

      <div className={styles.body}>
        {/* Navigation Tabs */}
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'berita' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('berita')}
          >
            <FileText size={16} />
            Berita Resmi ({news.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'blog' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <MessageSquare size={16} />
            Blog Komunitas ({blogs.length})
            {blogs.some(b => b.status === 'DRAFT') && (
              <span className={styles.badgeOrange}>
                {blogs.filter(b => b.status === 'DRAFT').length} Draf
              </span>
            )}
          </button>
        </div>

        {/* Tab Content: Berita */}
        {activeTab === 'berita' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Rilis Berita Resmi (Hanya Admin)</h2>
            <div className={styles.tableWrap}>
              {loadingNews ? (
                <SkeletonTable rows={5} cols={5} />
              ) : news.length === 0 ? (
                <div className={styles.empty}>Belum ada berita resmi yang dipublikasikan.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Judul Berita</th>
                      <th>Slug</th>
                      <th>Dilihat</th>
                      <th>Tanggal Rilis</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {news.map((n, i) => (
                      <tr key={n.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                        <td className={styles.tdNum}>{i + 1}</td>
                        <td className={styles.tdTitle}>{n.title}</td>
                        <td className={styles.tdSlug}>{n.slug}</td>
                        <td>{n.views || 0} Kali</td>
                        <td>{formatDateShort(n.createdAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <Link
                              to={`/admin/blog/edit/${n.id}`}
                              className="btn btn-secondary btn-sm"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </Link>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteNews(n.id, n.title)}
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Blog Komunitas */}
        {activeTab === 'blog' && (
          <div className={styles.section}>
            <div className={styles.subFilterRow}>
              <h2 className={styles.sectionTitle}>Postingan Blog & Forum Diskusi</h2>
              
              <div className={styles.filterGroup}>
                <ListFilter size={14} className={styles.filterIcon} />
                <button
                  className={`${styles.filterBtn} ${blogStatusFilter === 'ALL' ? styles.filterBtnActive : ''}`}
                  onClick={() => setBlogStatusFilter('ALL')}
                >
                  Semua
                </button>
                <button
                  className={`${styles.filterBtn} ${blogStatusFilter === 'PUBLISHED' ? styles.filterBtnActive : ''}`}
                  onClick={() => setBlogStatusFilter('PUBLISHED')}
                >
                  Published
                </button>
                <button
                  className={`${styles.filterBtn} ${blogStatusFilter === 'DRAFT' ? styles.filterBtnActive : ''}`}
                  onClick={() => setBlogStatusFilter('DRAFT')}
                >
                  Draft / Review
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              {loadingBlogs ? (
                <SkeletonTable rows={5} cols={7} />
              ) : filteredBlogs.length === 0 ? (
                <div className={styles.empty}>Tidak ada postingan blog komunitas yang cocok dengan filter.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Judul Blog</th>
                      <th>Penulis</th>
                      <th>Kategori</th>
                      <th>Status</th>
                      <th>Statistik</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlogs.map((b, i) => (
                      <tr key={b.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                        <td className={styles.tdNum}>{i + 1}</td>
                        <td className={styles.tdTitle}>
                          {b.title}
                          {b.featuredImg && <span className={styles.imgIndicator} title="Memiliki Featured Image">🖼️</span>}
                        </td>
                        <td className={styles.tdAuthor}>
                          {b.authorName} 
                          <span className={styles.roleLabel}>{b.authorRole}</span>
                        </td>
                        <td>{b.category}</td>
                        <td>
                          <span className={b.status === 'PUBLISHED' ? styles.statusPub : styles.statusDraft}>
                            {b.status}
                          </span>
                        </td>
                        <td className={styles.tdStats}>
                          👁️ {b.views || 0} • ❤️ {b.likeCount || 0} • 💬 {b.commentCount || 0}
                        </td>
                        <td>{formatDateShort(b.createdAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            {b.status === 'DRAFT' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApproveBlog(b.id, b.title)}
                                title="Approve & Publish"
                                style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <Link
                              to={`/blog/${b.slug}`}
                              className="btn btn-secondary btn-sm"
                              title="Lihat"
                              target="_blank"
                            >
                              <Rss size={14} />
                            </Link>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteBlog(b.id, b.title)}
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
