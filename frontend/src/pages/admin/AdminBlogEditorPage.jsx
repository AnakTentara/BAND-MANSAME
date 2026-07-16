import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPosts, createPost, updatePost } from '@/api/blog';
import AdminHeader from '@/components/admin/AdminHeader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { slugify } from '@/utils/truncate';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminBlogEditorPage.module.css';

export default function AdminBlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing) {
      setSlug(slugify(title));
    }
  }, [title, isEditing]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await getPosts({ limit: 200 });
      const list = res.data?.data || res.data?.posts || res.data || [];
      const found = list.find((p) => p.id === id);
      if (found) {
        setTitle(found.title || '');
        setContent(found.content || '');
        setSlug(found.slug || '');
      } else {
        toast.error('Post tidak ditemukan.');
        navigate('/admin/blog');
      }
    } catch {
      toast.error('Gagal memuat data post.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul tidak boleh kosong.');
      return;
    }
    if (!content || content === '<p></p>') {
      toast.error('Konten artikel tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updatePost(id, { title, content });
        toast.success('Post berhasil diperbarui!');
      } else {
        await createPost({ title, content });
        toast.success('Post berhasil dipublikasikan!');
      }
      navigate('/admin/blog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminHeader title="Memuat post..." />
        <div className={styles.body}>
          <div className={`skeleton ${styles.skelTitle}`} />
          <div className={`skeleton ${styles.skelEditor}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AdminHeader title={isEditing ? 'Edit Post' : 'Post Baru'}>
        <Link to="/admin/blog" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          Kembali
        </Link>
      </AdminHeader>

      <form onSubmit={handleSave} className={styles.body}>
        {/* Title */}
        <div className={styles.titleGroup}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="Judul artikel..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className={styles.slugPreview}>
            Slug: <code>{slug || '—'}</code>
          </p>
        </div>

        {/* Editor */}
        <div className={styles.editorWrap}>
          <RichTextEditor
            content={content}
            onChange={setContent}
          />
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <Save size={15} />}
            {saving ? 'Menyimpan...' : isEditing ? 'Perbarui Post' : 'Publikasikan Post'}
          </button>
          <Link to="/admin/blog" className="btn btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
