import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getBlogPostBySlug, 
  toggleLikeBlogPost, 
  createBlogComment, 
  updateBlogComment, 
  deleteBlogComment 
} from '@/api/forum';
import { formatDate, timeAgo } from '@/utils/formatDate';
import { getUploadUrl } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import SEO from '@/components/common/SEO';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Send,
  Loader2,
  Trash2,
  Edit3,
  CornerDownRight,
  Eye,
  Edit2
} from 'lucide-react';
import styles from './ForumPostPage.module.css';

// ── Recursive Comment Node Component ──
function CommentNode({
  comment,
  depth = 0,
  likedComments,
  onLikeComment,
  myComments,
  isAdminAuthenticated,
  isCandidateAuthenticated,
  candidateUser,
  replyingToId,
  setReplyingToId,
  replyForm,
  setReplyForm,
  onReplySubmit,
  editingCommentId,
  setEditingCommentId,
  editForm,
  setEditForm,
  onEditSubmit,
  onDeleteComment
}) {
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToId === comment.id;
  const isLiked = likedComments.includes(comment.id);
  const initials = comment.username ? comment.username.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

  // Check delete/edit permission
  const hasModifyPermission = 
    isAdminAuthenticated || 
    (isCandidateAuthenticated && comment.memberId === candidateUser?.id) ||
    myComments.includes(comment.id);

  // Indentation layout rule
  const maxIndentDepth = 5;
  const indentPixels = Math.min(depth, maxIndentDepth) * 20;

  return (
    <div className={styles.commentNode} style={{ marginLeft: `${indentPixels}px` }}>
      <div className={styles.commentContainer}>
        {/* Comment Header */}
        <div className={styles.commentHeader}>
          <span className={styles.commentUser}>{comment.username}</span>
          {comment.member?.role && (
            <span className={styles.roleBadge}>{comment.member.role}</span>
          )}
          <span className={styles.commentTime}>• {timeAgo(comment.createdAt)}</span>
        </div>

        {/* Comment Content / Edit mode */}
        {isEditing ? (
          <div style={{ marginTop: '8px' }}>
            <textarea
              className={styles.formTextarea}
              style={{ width: '100%', minHeight: '60px' }}
              value={editForm}
              onChange={(e) => setEditForm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                onClick={() => onEditSubmit(comment.id)} 
                className="btn btn-primary btn-sm"
              >
                Simpan
              </button>
              <button 
                onClick={() => setEditingCommentId(null)} 
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.commentBody}>{comment.content}</div>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className={styles.commentActionsRow}>
            <button
              onClick={() => onLikeComment(comment.id)}
              className={`${styles.commentActionBtn} ${isLiked ? styles.commentActionBtnLiked : ''}`}
            >
              <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{isLiked ? 'Suka' : 'Suka'}</span>
            </button>
            
            <button
              onClick={() => {
                setReplyingToId(isReplying ? null : comment.id);
                setReplyForm(prev => ({ ...prev, content: '' }));
              }}
              className={styles.commentActionBtn}
            >
              <CornerDownRight size={12} />
              <span>Balas</span>
            </button>

            {hasModifyPermission && (
              <>
                <button
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditForm(comment.content);
                  }}
                  className={styles.commentActionBtn}
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                >
                  <Trash2 size={12} />
                  <span>Hapus</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <div className={styles.replyFormBox} style={{ marginLeft: '12px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 700 }}>Balas Komentar</h4>
          {!isCandidateAuthenticated && !isAdminAuthenticated && (
            <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Nama kamu (Tamu)"
                value={replyForm.username}
                onChange={(e) => setReplyForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
          )}
          <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
            <textarea
              className={styles.formTextarea}
              placeholder="Tulis balasan..."
              value={replyForm.content}
              onChange={(e) => setReplyForm(prev => ({ ...prev, content: e.target.value }))}
              rows={2}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onReplySubmit(comment.id)} 
              className="btn btn-primary btn-sm"
              disabled={!replyForm.content.trim()}
            >
              Kirim Balasan
            </button>
            <button 
              onClick={() => setReplyingToId(null)} 
              className="btn btn-secondary btn-sm"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Recursively Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              likedComments={likedComments}
              onLikeComment={onLikeComment}
              myComments={myComments}
              isAdminAuthenticated={isAdminAuthenticated}
              isCandidateAuthenticated={isCandidateAuthenticated}
              candidateUser={candidateUser}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyForm={replyForm}
              setReplyForm={setReplyForm}
              onReplySubmit={onReplySubmit}
              editingCommentId={editingCommentId}
              setEditingCommentId={setEditingCommentId}
              editForm={editForm}
              setEditForm={setEditForm}
              onEditSubmit={onEditSubmit}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ForumPostPage Component ──
export default function ForumPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { candidateUser, isCandidateAuthenticated, isAdminAuthenticated } = useAuthStore();
  const userId = isCandidateAuthenticated ? candidateUser?.nisn : 'guest';

  // State Variables
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Likes local identification key (for guests)
  const [guestId, setGuestId] = useState('');

  // Comment Actions State
  const [mainCommentForm, setMainCommentForm] = useState({ username: '', content: '' });
  const [replyForm, setReplyForm] = useState({ username: '', content: '' });
  const [replyingToId, setReplyingToId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editForm, setEditForm] = useState('');
  
  // Local list trackers
  const [likedComments, setLikedComments] = useState([]);
  const [myComments, setMyComments] = useState([]);

  // Generate or retrieve guestId on mount
  useEffect(() => {
    let storedGuestId = localStorage.getItem('forum_guest_id');
    if (!storedGuestId) {
      storedGuestId = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      localStorage.setItem('forum_guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);

    // Retrieve local comment logs
    const savedLikedComments = localStorage.getItem(`forum_comment_likes_${userId}`);
    const savedMyComments = localStorage.getItem(`forum_my_comments_${userId}`);
    setLikedComments(savedLikedComments ? JSON.parse(savedLikedComments) : []);
    setMyComments(savedMyComments ? JSON.parse(savedMyComments) : []);
  }, [userId]);

  // Load single blog post
  const fetchPost = async () => {
    try {
      const res = await getBlogPostBySlug(slug);
      const fetchedPost = res.data?.post || res.data;
      setPost(fetchedPost);

      // Verify server-side likes
      if (fetchedPost && fetchedPost.likes) {
        const hasLiked = fetchedPost.likes.some((like) => {
          if (isCandidateAuthenticated && candidateUser) {
            return like.memberId === candidateUser.id;
          }
          let storedGuestId = localStorage.getItem('forum_guest_id') || guestId;
          return like.guestId === storedGuestId;
        });
        setIsLiked(hasLiked);
      }

      // Verify bookmarked state
      if (fetchedPost) {
        const bookmarksKey = `bookmarks_forum_${candidateUser?.nisn || 'guest'}`;
        const savedBookmarks = JSON.parse(localStorage.getItem(bookmarksKey) || '[]');
        setIsBookmarked(savedBookmarks.some((b) => b.id === fetchedPost.id));
      }

    } catch (err) {
      toast.error('Postingan tidak ditemukan atau telah dihapus.');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, isCandidateAuthenticated, candidateUser]);

  // Post Actions (Likes / Bookmarks)
  const handleLikePost = async () => {
    if (!post) return;
    try {
      const payload = {};
      if (!isCandidateAuthenticated && !isAdminAuthenticated) {
        payload.guestId = guestId;
      }
      const res = await toggleLikeBlogPost(post.id, payload);
      setIsLiked(res.data.liked);
      setPost((prev) => ({ ...prev, likeCount: res.data.likeCount }));
      toast.success(res.data.liked ? 'Postingan disukai!' : 'Batal menyukai postingan.');
      
      // Update likes list cache locally if needed
      fetchPost();
    } catch (err) {
      toast.error('Gagal menyukai postingan.');
    }
  };

  const handleBookmarkPost = () => {
    if (!post) return;
    if (!isCandidateAuthenticated) {
      toast.error('Silakan login sebagai Anggota untuk menyimpan postingan.');
      return;
    }
    const bookmarksKey = `bookmarks_forum_${candidateUser.nisn}`;
    let savedBookmarks = JSON.parse(localStorage.getItem(bookmarksKey) || '[]');
    
    if (isBookmarked) {
      savedBookmarks = savedBookmarks.filter((b) => b.id !== post.id);
      setIsBookmarked(false);
      toast.success('Postingan dihapus dari simpanan.');
    } else {
      savedBookmarks.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        createdAt: post.createdAt
      });
      setIsBookmarked(true);
      toast.success('Postingan disimpan!');
    }
    localStorage.setItem(bookmarksKey, JSON.stringify(savedBookmarks));
  };

  const handleSharePost = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan postingan berhasil disalin!');
  };

  // Comments Actions (Create / Reply / Edit / Delete)
  const handleMainCommentSubmit = async (e) => {
    e.preventDefault();
    if (!mainCommentForm.content.trim()) {
      toast.error('Komentar tidak boleh kosong.');
      return;
    }

    const payload = {
      content: mainCommentForm.content.trim(),
      username: isCandidateAuthenticated ? candidateUser.name : (mainCommentForm.username.trim() || 'Tamu')
    };

    try {
      const res = await createBlogComment(post.id, payload);
      toast.success('Komentar berhasil ditambahkan!');
      
      // Save ID to local comments
      const createdComment = res.data?.comment;
      if (createdComment) {
        const updatedMyComments = [...myComments, createdComment.id];
        setMyComments(updatedMyComments);
        localStorage.setItem(`forum_my_comments_${userId}`, JSON.stringify(updatedMyComments));
      }

      setMainCommentForm({ username: '', content: '' });
      fetchPost();
    } catch (err) {
      toast.error('Gagal mengirim komentar.');
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyForm.content.trim()) {
      toast.error('Isi balasan tidak boleh kosong.');
      return;
    }

    const payload = {
      content: replyForm.content.trim(),
      parentId,
      username: isCandidateAuthenticated ? candidateUser.name : (replyForm.username.trim() || 'Tamu')
    };

    try {
      const res = await createBlogComment(post.id, payload);
      toast.success('Balasan berhasil dikirim!');

      const createdComment = res.data?.comment;
      if (createdComment) {
        const updatedMyComments = [...myComments, createdComment.id];
        setMyComments(updatedMyComments);
        localStorage.setItem(`forum_my_comments_${userId}`, JSON.stringify(updatedMyComments));
      }

      setReplyingToId(null);
      setReplyForm({ username: '', content: '' });
      fetchPost();
    } catch (err) {
      toast.error('Gagal mengirim balasan.');
    }
  };

  const handleEditCommentSubmit = async (commentId) => {
    if (!editForm.trim()) {
      toast.error('Konten komentar tidak boleh kosong.');
      return;
    }

    try {
      await updateBlogComment(commentId, { content: editForm.trim() });
      toast.success('Komentar berhasil diperbarui!');
      setEditingCommentId(null);
      setEditForm('');
      fetchPost();
    } catch (err) {
      toast.error('Gagal mengedit komentar.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus komentar ini beserta seluruh balasannya?')) return;
    try {
      await deleteBlogComment(commentId);
      toast.success('Komentar berhasil dihapus!');
      fetchPost();
    } catch (err) {
      toast.error('Gagal menghapus komentar.');
    }
  };

  const handleLikeComment = (commentId) => {
    let updatedLikes = [...likedComments];
    if (updatedLikes.includes(commentId)) {
      updatedLikes = updatedLikes.filter(id => id !== commentId);
      toast.success('Batal menyukai komentar.');
    } else {
      updatedLikes.push(commentId);
      toast.success('Komentar disukai!');
    }
    setLikedComments(updatedLikes);
    localStorage.setItem(`forum_comment_likes_${userId}`, JSON.stringify(updatedLikes));
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className={styles.skeletonDetail}>
            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px', marginTop: '16px' }} />
            <div className="skeleton" style={{ width: '40%', height: '20px', marginTop: '12px' }} />
            <div className="skeleton" style={{ width: '100%', height: '300px', marginTop: '24px', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.pageContainer}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2>Postingan tidak ditemukan</h2>
          <Link to="/blog" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Kembali ke Forum
          </Link>
        </div>
      </div>
    );
  }

  // Count total recursive comments
  const countComments = (list) => {
    let total = 0;
    const recurse = (arr) => {
      total += arr.length;
      arr.forEach((c) => {
        if (c.replies) recurse(c.replies);
      });
    };
    if (list) recurse(list);
    return total;
  };

  const totalCommentCount = countComments(post.comments);

  return (
    <div className={styles.pageContainer}>
      <SEO 
        title={`${post.title} | Forum MANSAME Band`} 
        description={post.content} 
        type="article"
      />
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Back Link */}
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeft size={16} />
          Kembali ke Forum
        </Link>

        {/* Article content */}
        <article style={{ marginBottom: '40px' }}>
          {/* Post Header */}
          <header className={styles.postHeader}>
            <span 
              className={styles.postCategory}
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)'
              }}
            >
              {post.category}
            </span>
            <h1 className={styles.postTitle}>{post.title}</h1>
            
            {/* Meta */}
            <div className={styles.authorMeta}>
              <div className={styles.authorAvatarWrap}>
                {post.authorPhoto ? (
                  <img src={getUploadUrl(post.authorPhoto)} alt={post.authorName} className={styles.authorAvatar} />
                ) : (
                  <div className={styles.authorAvatarText}>
                    {post.authorName ? post.authorName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?'}
                  </div>
                )}
              </div>
              <div className={styles.authorInfo}>
                <div className={styles.authorNameRow}>
                  <span className={styles.authorName}>{post.authorName}</span>
                  <span className={styles.roleBadge}>{post.authorRole.toUpperCase()}</span>
                </div>
                <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
              </div>
              <div className={styles.viewsCount}>
                <Eye size={14} />
                <span>{post.views || 0} Kali Dilihat</span>
              </div>
              
              {/* If this is candidate's own post, allow them to edit it */}
              {(isAdminAuthenticated || (isCandidateAuthenticated && post.memberId === candidateUser?.id)) && (
                <Link to={`/blog/tulis?edit=${post.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', marginLeft: '8px' }}>
                  <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
                </Link>
              )}
            </div>
          </header>

          {/* Featured Cover Image */}
          {post.featuredImg && (
            <img src={getUploadUrl(post.featuredImg)} alt={post.title} className={styles.featuredCover} />
          )}

          {/* Prose Content */}
          <div 
            className={styles.prose}
            dangerouslySetInnerHTML={{
              __html: (() => {
                if (!post.content) return '';
                const cleanBase = window.location.hostname === 'localhost'
                  ? 'http://localhost:25546/uploads'
                  : `${window.location.origin}/api/uploads`;
                return post.content.replace(/src="\/uploads\//g, `src="${cleanBase}/`);
              })()
            }}
          />

          {/* Post Tags */}
          {post.tags && (
            <div className={styles.postTags}>
              {post.tags.split(',').map((tag) => (
                <span key={tag} className={styles.tagChip}>#{tag.trim()}</span>
              ))}
            </div>
          )}

          {/* Likes & Actions Panel */}
          <div className={styles.actionPanel}>
            <button
              onClick={handleLikePost}
              className={`${styles.actionBtn} ${isLiked ? styles.actionBtnActive : ''}`}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likeCount || 0} Menyukai</span>
            </button>
            <button
              onClick={handleBookmarkPost}
              className={`${styles.actionBtn} ${isBookmarked ? styles.actionBtnActive : ''}`}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Disimpan' : 'Simpan'}</span>
            </button>
            <button
              onClick={handleSharePost}
              className={styles.actionBtn}
            >
              <Share2 size={18} />
              <span>Bagikan</span>
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
          <h3 className={styles.commentsTitle}>
            <MessageSquare size={22} />
            Diskusi ({totalCommentCount})
          </h3>

          {/* Main Comment Form */}
          <form onSubmit={handleMainCommentSubmit} className={styles.commentForm}>
            <h4 className={styles.formTitle}>Tambah Komentar Baru</h4>
            {isCandidateAuthenticated ? (
              <div className={styles.authenticatedUserCommentInfo}>
                Berkomentar sebagai: <strong>{candidateUser.name}</strong>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Kamu</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ketik namamu (Tamu)"
                  value={mainCommentForm.username}
                  onChange={(e) => setMainCommentForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pesan</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Tulis pemikiranmu secara sopan..."
                value={mainCommentForm.content}
                onChange={(e) => setMainCommentForm(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!mainCommentForm.content.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={14} /> Kirim Komentar
            </button>
          </form>

          {/* Comment Tree */}
          {post.comments && post.comments.length > 0 ? (
            <div className={styles.commentTree}>
              {post.comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  likedComments={likedComments}
                  onLikeComment={handleLikeComment}
                  myComments={myComments}
                  isAdminAuthenticated={isAdminAuthenticated}
                  isCandidateAuthenticated={isCandidateAuthenticated}
                  candidateUser={candidateUser}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  replyForm={replyForm}
                  setReplyForm={setReplyForm}
                  onReplySubmit={handleReplySubmit}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEditSubmit={handleEditCommentSubmit}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noComments}>
              Belum ada diskusi dalam postingan ini. Tulis komentar pertamamu di atas!
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
