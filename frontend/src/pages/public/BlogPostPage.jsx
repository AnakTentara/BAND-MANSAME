import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug, createComment, updateComment, deleteComment } from '@/api/blog';
import { formatDate, timeAgo } from '@/utils/formatDate';
import { ArrowLeft, Send, MessageSquare, Heart, Share2, Bookmark, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import SEO from '@/components/common/SEO';
import styles from './BlogPostPage.module.css';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ username: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Comment Actions State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [likedComments, setLikedComments] = useState([]);

  const { isCandidateAuthenticated, candidateUser, isAdminAuthenticated } = useAuthStore();

  useEffect(() => {
    const likesKey = isCandidateAuthenticated && candidateUser 
      ? `comment_likes_${candidateUser.nisn}` 
      : `comment_likes_guest`;
    setLikedComments(JSON.parse(localStorage.getItem(likesKey) || '[]'));
  }, [isCandidateAuthenticated, candidateUser, post]);

  const handleLikeComment = (commentId) => {
    const likesKey = isCandidateAuthenticated && candidateUser 
      ? `comment_likes_${candidateUser.nisn}` 
      : `comment_likes_guest`;
    let likesList = JSON.parse(localStorage.getItem(likesKey) || '[]');
    
    if (likesList.includes(commentId)) {
      likesList = likesList.filter(id => id !== commentId);
      toast.success('Batal menyukai komentar.');
    } else {
      likesList.push(commentId);
      toast.success('Komentar disukai!');
    }
    localStorage.setItem(likesKey, JSON.stringify(likesList));
    setLikedComments(likesList);
  };

  const handleShareComment = (commentId) => {
    const link = `${window.location.origin}/blog/${post.slug}#comment-${commentId}`;
    navigator.clipboard.writeText(link);
    toast.success('Tautan komentar disalin ke papan klip!');
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.error('Konten komentar tidak boleh kosong.');
      return;
    }
    try {
      await updateComment(commentId, { content: editContent });
      toast.success('Komentar diperbarui!');
      setEditingCommentId(null);
      fetchPost();
    } catch {
      toast.error('Gagal memperbarui komentar.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;
    try {
      await deleteComment(commentId);
      toast.success('Komentar berhasil dihapus!');
      
      const myComments = JSON.parse(localStorage.getItem('my_comments') || '[]');
      const filtered = myComments.filter(id => id !== commentId);
      localStorage.setItem('my_comments', JSON.stringify(filtered));

      fetchPost();
    } catch {
      toast.error('Gagal menghapus komentar.');
    }
  };

  const canModifyComment = (commentId) => {
    if (isAdminAuthenticated) return true;
    const myComments = JSON.parse(localStorage.getItem('my_comments') || '[]');
    return myComments.includes(commentId);
  };

  useEffect(() => {
    if (isCandidateAuthenticated && candidateUser) {
      setCommentForm((f) => ({ ...f, username: candidateUser.name }));
    }
  }, [isCandidateAuthenticated, candidateUser]);

  useEffect(() => {
    if (post && isCandidateAuthenticated && candidateUser) {
      const likedKey = `likes_${candidateUser.nisn}`;
      const savedKey = `bookmarks_${candidateUser.nisn}`;
      
      const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
      const savedList = JSON.parse(localStorage.getItem(savedKey) || '[]');
      
      setIsLiked(likedList.some(item => item.id === post.id));
      setIsBookmarked(savedList.some(item => item.id === post.id));
    }
  }, [post, isCandidateAuthenticated, candidateUser]);

  const handleLike = () => {
    if (!isCandidateAuthenticated || !candidateUser) {
      toast.error('Silakan login sebagai Anggota untuk menyukai artikel.');
      return;
    }
    const likedKey = `likes_${candidateUser.nisn}`;
    let likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
    
    if (isLiked) {
      likedList = likedList.filter(item => item.id !== post.id);
      setIsLiked(false);
      toast.success('Batal menyukai artikel.');
    } else {
      likedList.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        createdAt: post.createdAt
      });
      setIsLiked(true);
      toast.success('Artikel disukai!');
    }
    localStorage.setItem(likedKey, JSON.stringify(likedList));
  };

  const handleBookmark = () => {
    if (!isCandidateAuthenticated || !candidateUser) {
      toast.error('Silakan login sebagai Anggota untuk menyimpan artikel.');
      return;
    }
    const savedKey = `bookmarks_${candidateUser.nisn}`;
    let savedList = JSON.parse(localStorage.getItem(savedKey) || '[]');
    
    if (isBookmarked) {
      savedList = savedList.filter(item => item.id !== post.id);
      setIsBookmarked(false);
      toast.success('Artikel dihapus dari simpanan.');
    } else {
      savedList.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        createdAt: post.createdAt
      });
      setIsBookmarked(true);
      toast.success('Artikel disimpan!');
    }
    localStorage.setItem(savedKey, JSON.stringify(savedList));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan artikel berhasil disalin!');
  };

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

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentForm.username.trim() || !commentForm.content.trim()) {
      toast.error('Nama dan komentar wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createComment(post.id, commentForm);
      toast.success('Komentar berhasil dikirim!');

      // Cache comment ID locally to allow user edits/deletes
      const newComment = res.data?.comment;
      if (newComment && newComment.id) {
        const myComments = JSON.parse(localStorage.getItem('my_comments') || '[]');
        myComments.push(newComment.id);
        localStorage.setItem('my_comments', JSON.stringify(myComments));
      }

      if (isCandidateAuthenticated && candidateUser) {
        const commentKey = `comments_${candidateUser.nisn}`;
        let commentedList = JSON.parse(localStorage.getItem(commentKey) || '[]');
        if (!commentedList.some(item => item.id === post.id)) {
          commentedList.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            createdAt: post.createdAt
          });
          localStorage.setItem(commentKey, JSON.stringify(commentedList));
        }
      }

      setCommentForm({ username: '', content: '' });
      fetchPost();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim komentar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <SEO title="Memuat Artikel..." description="Silakan tunggu, artikel sedang dimuat." />
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
        <SEO title="Artikel Tidak Ditemukan" description="Maaf, artikel yang Anda cari tidak ditemukan atau telah dihapus." />
        <div className={`container ${styles.articleWrap}`}>
          <p style={{ color: 'var(--color-text-muted)' }}>Artikel tidak ditemukan.</p>
          <Link to="/blog" className="btn btn-secondary" style={{ marginTop: 16 }}>← Kembali ke Blog</Link>
        </div>
      </div>
    );
  }

  const comments = post.comments || [];

  return (
    <div className="page-wrapper">
      <SEO title={post.title} description={post.content} type="article" />
      <div className={`container ${styles.articleWrap}`}>
        {/* Back */}
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeft size={16} />
          Kembali ke Blog
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

          {/* Action Row (Like, Share, Save) */}
          <div className={styles.actionRow}>
            <button 
              onClick={handleLike} 
              className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
              title="Suka Berita"
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{isLiked ? 'Disukai' : 'Suka'}</span>
            </button>
            
            <button 
              onClick={handleBookmark} 
              className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
              title="Simpan Berita"
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
            </button>
            
            <button 
              onClick={handleShare} 
              className={styles.actionBtn}
              title="Bagikan Berita"
            >
              <Share2 size={18} />
              <span>Bagikan</span>
            </button>
          </div>
        </article>

        {/* Comments */}
        <section className={styles.comments}>
          <h2 className={styles.commentsTitle}>
            <MessageSquare size={20} />
            Komentar ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <p className={styles.noComments}>Belum ada komentar. Jadilah yang pertama!</p>
          ) : (
            <div className={styles.commentList}>
              {comments.map((c, i) => {
                const commentIsLiked = likedComments.includes(c.id);
                const hasRights = canModifyComment(c.id);
                const isEditingThis = editingCommentId === c.id;

                return (
                  <div key={c.id || i} id={`comment-${c.id}`} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <strong className={styles.commentUser}>{c.username}</strong>
                      <span className={styles.commentDate}>{timeAgo(c.createdAt)}</span>
                    </div>

                    {isEditingThis ? (
                      <div className={styles.commentEditWrapper}>
                        <textarea
                          className="form-textarea"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          style={{ marginBottom: '8px', width: '100%' }}
                        />
                        <div className={styles.commentEditActions}>
                          <button 
                            onClick={() => handleSaveComment(c.id)} 
                            className="btn btn-primary btn-sm"
                            style={{ marginRight: '8px' }}
                          >
                            Simpan
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            className="btn btn-secondary btn-sm"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={styles.commentContent}>{c.content}</p>
                        
                        <div className={styles.commentActionsRow}>
                          <button 
                            onClick={() => handleLikeComment(c.id)}
                            className={`${styles.commentActionBtn} ${commentIsLiked ? styles.commentLiked : ''}`}
                            title="Suka Komentar"
                          >
                            <Heart size={12} fill={commentIsLiked ? 'currentColor' : 'none'} />
                            <span>{commentIsLiked ? '1 Suka' : '0 Suka'}</span>
                          </button>

                          <button 
                            onClick={() => handleShareComment(c.id)}
                            className={styles.commentActionBtn}
                            title="Bagikan Komentar"
                          >
                            <Share2 size={12} />
                            <span>Bagikan</span>
                          </button>

                          {hasRights && (
                            <>
                              <button 
                                onClick={() => handleStartEdit(c)}
                                className={styles.commentActionBtn}
                                title="Edit Komentar"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>

                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                title="Hapus Komentar"
                              >
                                <Trash2 size={12} />
                                <span>Hapus</span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleComment} className={styles.commentForm}>
            <h3 className={styles.formTitle}>Tulis Komentar</h3>
            {isCandidateAuthenticated ? (
              <div className={styles.authenticatedUserCommentInfo}>
                Berkomentar sebagai: <strong>{candidateUser?.name}</strong>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="comment-username">Nama</label>
                <input
                  id="comment-username"
                  type="text"
                  className="form-input"
                  placeholder="Nama kamu"
                  value={commentForm.username}
                  onChange={(e) => setCommentForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="comment-content">Komentar</label>
              <textarea
                id="comment-content"
                className="form-textarea"
                placeholder="Tulis komentar kamu..."
                value={commentForm.content}
                onChange={(e) => setCommentForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <Send size={15} />}
              {submitting ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
