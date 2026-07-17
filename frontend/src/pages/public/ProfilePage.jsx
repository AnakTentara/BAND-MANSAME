import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProfile, updateProfile } from '@/api/candidates';
import { useAuthStore } from '@/stores/authStore';
import SkeletonProfile from '@/components/skeletons/SkeletonProfile';
import { LogOut, Edit2, X, Save, Download, Heart, Bookmark, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import { formatDate } from '@/utils/formatDate';
import { estimateReadingTime } from '@/utils/readingTime';
import styles from './ProfilePage.module.css';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((t) => {
  const maxClass = t === 'X' ? 9 : 8;
  for (let i = 1; i <= maxClass; i++) KELAS_OPTIONS.push(`${t}-${i}`);
});

const STATUS_MAP = {
  LULUS: { label: 'Lulus Seleksi (Anggota)', cls: 'badge-success' },
  TIDAK_LULUS: { label: 'Tidak Lulus', cls: 'badge-error' },
  PENDING: { label: 'Pending (Calon Anggota)', cls: 'badge-pending' },
  ACTIVE: { label: 'Anggota Aktif', cls: 'badge-success' },
  ALUMNI: { label: 'Alumni', cls: 'badge-pending' }
};

export default function ProfilePage() {
  const { candidateUser, updateCandidateUser, logoutCandidate } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Lists from local storage
  const [activeTab, setActiveTab] = useState('liked'); // 'liked' | 'saved' | 'commented'
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const data = res.data?.candidate || res.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        className: data.className || '',
        whatsappNumber: data.whatsappNumber || '',
        email: data.email || '',
        reason: data.reason || '',
        asalSekolah: data.asalSekolah || '',
        gender: data.gender || ''
      });

      if (data && data.nisn) {
        const likedKey = `likes_${data.nisn}`;
        const savedKey = `bookmarks_${data.nisn}`;
        const commentedKey = `comments_${data.nisn}`;

        setLikedPosts(JSON.parse(localStorage.getItem(likedKey) || '[]'));
        setSavedPosts(JSON.parse(localStorage.getItem(savedKey) || '[]'));
        setCommentedPosts(JSON.parse(localStorage.getItem(commentedKey) || '[]'));
      }
    } catch {
      toast.error('Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('className', form.className);
    formData.append('whatsappNumber', form.whatsappNumber);
    formData.append('email', form.email);
    formData.append('reason', form.reason || '');
    formData.append('asalSekolah', form.asalSekolah || '');
    formData.append('gender', form.gender || '');
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    
    try {
      const res = await updateProfile(formData);
      const updated = res.data?.candidate || res.data;
      setProfile(updated);
      updateCandidateUser(updated);
      toast.success('Profil berhasil diperbarui!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadProfile = async () => {
    if (!profile) return;

    const W = 760, H = 440;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2; canvas.height = H * 2; // retina
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // ── Background gradient ──────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.55, '#1e293b');
    bg.addColorStop(1, '#0f2027');
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H, 18);
    ctx.fill();

    // ── Accent stripe left ───────────────────────
    const stripe = ctx.createLinearGradient(0, 0, 0, H);
    stripe.addColorStop(0, '#f97316');
    stripe.addColorStop(1, '#ea580c');
    ctx.fillStyle = stripe;
    roundRect(ctx, 0, 0, 6, H, [18, 0, 0, 18]);
    ctx.fill();

    // ── Decorative circles ───────────────────────
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(W - 80, -60, 150, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W + 20, H, 110, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // ── Logo text / org name ─────────────────────
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('MANSAME BAND', 30, 40);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('Ekstrakurikuler Seni Musik & Band', 30, 58);

    // Thin separator
    ctx.strokeStyle = 'rgba(249,115,22,0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(30, 68); ctx.lineTo(W - 30, 68); ctx.stroke();

    // ── KARTU ANGGOTA header ─────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('KARTU ANGGOTA RESMI', 30, 100);

    // ── Avatar circle ────────────────────────────
    const avatarX = W - 130, avatarY = 90, avatarR = 55;
    ctx.save();
    ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();

    // Try to draw member photo if available
    const photoUrl = profile.photoPath ? getUploadUrl(profile.photoPath) : null;
    if (photoUrl) {
      try {
        const img = await loadImage(photoUrl);
        ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
      } catch {
        drawAvatarFallback(ctx, avatarX, avatarY, avatarR, profile.name);
      }
    } else {
      drawAvatarFallback(ctx, avatarX, avatarY, avatarR, profile.name);
    }
    ctx.restore();

    // Avatar border ring
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarR + 2, 0, Math.PI * 2); ctx.stroke();

    // ── Member details ───────────────────────────
    const fields = [
      ['Nama Lengkap', profile.name],
      ['NISN', profile.nisn],
      ['Kelas', profile.className],
      ['Jenis Kelamin', profile.gender],
      ['Asal Sekolah', profile.asalSekolah],
      ['Status', STATUS_MAP[profile.status]?.label || profile.status || 'Anggota'],
      ['Tahun Bergabung', String(profile.joinYear || new Date(profile.createdAt).getFullYear())],
    ];

    let y = 130;
    fields.forEach(([label, value]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(label.toUpperCase(), 30, y);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(value || '—', 30, y + 16);
      y += 38;
    });

    // ── Bottom divider ───────────────────────────
    ctx.strokeStyle = 'rgba(249,115,22,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(30, H - 52); ctx.lineTo(W - 30, H - 52); ctx.stroke();

    // ── Motto ────────────────────────────────────
    ctx.fillStyle = 'rgba(249,115,22,0.9)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Kreativitas · Harmoni · Prestasi', W / 2, H - 32);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(`Dicetak otomatis oleh sistem MANSAME Band • ${new Date().getFullYear()}`, W / 2, H - 16);
    ctx.textAlign = 'left';

    // ── Export ───────────────────────────────────
    const link = document.createElement('a');
    link.download = `KARTU_ANGGOTA_MANSAME_${profile.nisn || 'PROFIL'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Kartu anggota berhasil diunduh sebagai gambar PNG!');
  };

  // Helper: load image as Promise
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Helper: draw avatar initials fallback
  function drawAvatarFallback(ctx, cx, cy, r, name) {
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${r * 0.75}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    ctx.fillText(initials, cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Helper: draw rounded rect (polyfill for older browsers)
  function roundRect(ctx, x, y, w, h, r) {
    const radii = Array.isArray(r) ? r : [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + radii[0], y);
    ctx.lineTo(x + w - radii[1], y);
    ctx.arcTo(x + w, y, x + w, y + radii[1], radii[1]);
    ctx.lineTo(x + w, y + h - radii[2]);
    ctx.arcTo(x + w, y + h, x + w - radii[2], y + h, radii[2]);
    ctx.lineTo(x + radii[3], y + h);
    ctx.arcTo(x, y + h, x, y + h - radii[3], radii[3]);
    ctx.lineTo(x, y + radii[0]);
    ctx.arcTo(x, y, x + radii[0], y, radii[0]);
    ctx.closePath();
  }

  const handleLogout = () => {
    logoutCandidate();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const statusInfo = STATUS_MAP[profile?.status] || { label: profile?.status || 'Pending', cls: 'badge-pending' };

  if (loading) {
    return (
      <div className="page-wrapper">
        <section className="section">
          <div className="container">
            <SkeletonProfile />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className={styles.layout}>
            {/* Top: Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.cardHeader}>
                <div className={styles.avatarWrap}>
                  {profile?.photoPath ? (
                    <img src={getUploadUrl(profile.photoPath)} alt={profile.name} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarText}>{initials}</div>
                  )}
                </div>
                <div className={styles.primaryInfo}>
                  <h1 className={styles.name}>{profile?.name}</h1>
                  <div className={styles.metaRow}>
                    <span className={styles.nisn}>NISN: {profile?.nisn}</span>
                    <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <button onClick={() => setEditing(!editing)} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                    {editing ? <X size={13} /> : <Edit2 size={13} />}
                    {editing ? 'Batal' : 'Edit Profil'}
                  </button>
                  <button onClick={handleDownloadProfile} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                    <Download size={13} />
                    Unduh Info
                  </button>
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <LogOut size={13} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBodyDetails}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Kelas</span>
                    <span className={styles.detailValue}>{profile?.className || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Asal Sekolah (Lama)</span>
                    <span className={styles.detailValue}>{profile?.asalSekolah || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Jenis Kelamin</span>
                    <span className={styles.detailValue}>{profile?.gender || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>No. WhatsApp</span>
                    <span className={styles.detailValue}>{profile?.whatsappNumber || '—'}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{profile?.email || '—'}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Alasan Masuk MANSAME Band</span>
                    <p className={styles.detailQuote}>"{profile?.reason || '—'}"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Edit Form */}
            {editing && (
              <div className={styles.editCardPanel}>
                <h2 className={styles.panelTitle}>Perbarui Informasi Profil</h2>
                <form onSubmit={handleSave} className={styles.editForm}>
                  <div className={styles.photoUploadSection}>
                    <div className={styles.photoPreviewWrapper}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                      ) : (
                        <div className={styles.photoPlaceholder}>{initials}</div>
                      )}
                    </div>
                    <label className={styles.photoLabel}>
                      Unggah Foto Profil
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 25 * 1024 * 1024) {
                              toast.error('Ukuran foto maksimal 25MB. Silakan pilih file yang lebih kecil.');
                              e.target.value = '';
                              return;
                            }
                            setPhotoFile(file);
                            setPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className={styles.fileInput}
                      />
                    </label>
                  </div>

                  <div className={styles.editGrid}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-name">Nama Lengkap</label>
                      <input
                        id="edit-name"
                        type="text"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-class">Kelas</label>
                      <select
                        id="edit-class"
                        className="form-select"
                        value={form.className}
                        onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                      >
                        <option value="">— Pilih Kelas —</option>
                        {KELAS_OPTIONS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-wa">No. WhatsApp</label>
                      <input
                        id="edit-wa"
                        type="text"
                        className="form-input"
                        value={form.whatsappNumber}
                        onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-email">Email</label>
                      <input
                        id="edit-email"
                        type="email"
                        className="form-input"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-asal">Asal Sekolah</label>
                      <input
                        id="edit-asal"
                        type="text"
                        className="form-input"
                        value={form.asalSekolah}
                        onChange={(e) => setForm((f) => ({ ...f, asalSekolah: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-gender">Jenis Kelamin</label>
                      <select
                        id="edit-gender"
                        className="form-select"
                        value={form.gender}
                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" htmlFor="edit-reason">Alasan Masuk MANSAME Band</label>
                      <textarea
                        id="edit-reason"
                        className="form-textarea"
                        rows={3}
                        value={form.reason}
                        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner" /> : <Save size={14} />}
                      {saving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bottom: Tabs (Likes, Saved, Commented) */}
            <div className={styles.tabsSection}>
              <div className={styles.tabHeaders}>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`${styles.tabBtn} ${activeTab === 'liked' ? styles.tabActive : ''}`}
                >
                  <Heart size={16} fill={activeTab === 'liked' ? 'currentColor' : 'none'} />
                  Artikel Disukai ({likedPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`}
                >
                  <Bookmark size={16} fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
                  Artikel Disimpan ({savedPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('commented')}
                  className={`${styles.tabBtn} ${activeTab === 'commented' ? styles.tabActive : ''}`}
                >
                  <MessageSquare size={16} />
                  Komentar Artikel ({commentedPosts.length})
                </button>
              </div>

              <div className={styles.tabContentPanel}>
                {activeTab === 'liked' && (
                  <PostList posts={likedPosts} emptyMessage="Belum ada artikel yang disukai. Jelajahi halaman blog untuk menyukainya!" />
                )}
                {activeTab === 'saved' && (
                  <PostList posts={savedPosts} emptyMessage="Belum ada artikel yang disimpan. Simpan artikel menarik untuk dibaca nanti!" />
                )}
                {activeTab === 'commented' && (
                  <PostList posts={commentedPosts} emptyMessage="Belum ada artikel yang Anda komentari." />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PostList({ posts, emptyMessage }) {
  if (posts.length === 0) {
    return <p className={styles.emptyText}>{emptyMessage}</p>;
  }

  const getFirstImage = (html) => {
    if (!html) return null;
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className={styles.postsGrid}>
      {posts.map((post) => {
        const firstImg = getFirstImage(post.content);
        return (
          <Link key={post.id} to={`/blog/${post.slug}`} className={styles.postCard}>
            {firstImg && (
              <div className={styles.postThumbnail}>
                <img src={getUploadUrl(firstImg)} alt={post.title} />
              </div>
            )}
            <div className={styles.postCardBody}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postExcerpt}>{stripHtml(post.content).slice(0, 90)}...</p>
              <div className={styles.postMeta}>
                <span>{formatDate(post.createdAt)}</span>
                <span className={styles.metaDivider}>•</span>
                <span className={styles.readingTime}>
                  <Clock size={11} style={{ marginRight: '3px' }} />
                  {estimateReadingTime(post.content)}
                </span>
                <span className={styles.readMoreLink}>
                  Baca <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
