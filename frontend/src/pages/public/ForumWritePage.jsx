import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { getBlogPostBySlug, createBlogPost, updateBlogPost } from '@/api/forum';
import { uploadBlogImage } from '@/api/admin';
import { getUploadUrl } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import SEO from '@/components/common/SEO';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Plus,
  X,
  FileText,
  Loader2,
  Trash2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2
} from 'lucide-react';
import styles from './ForumWritePage.module.css';

const CATEGORIES = ['Umum', 'Edukasi', 'Kegiatan', 'Konseling', 'Pengumuman', 'Curhat'];

export default function ForumWritePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');

  const { candidateUser, adminUser, isCandidateAuthenticated, isAdminAuthenticated } = useAuthStore();
  const userId = isCandidateAuthenticated ? candidateUser?.nisn : adminUser?.username;
  const isLogged = isCandidateAuthenticated || isAdminAuthenticated;

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Umum');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [content, setContent] = useState('');
  
  // App State
  const [loading, setLoading] = useState(Boolean(editId));
  const [submitting, setSubmitting] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraftTime, setSavedDraftTime] = useState('');
  const [lastAutoSaved, setLastAutoSaved] = useState('');

  const draftKey = `forum_post_draft_${userId || 'guest'}`;

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.editorLink
        }
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: styles.editorImage
        }
      }),
      Placeholder.configure({
        placeholder: 'Tulis isi artikel blog atau thread diskusi di sini secara detail...'
      })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    }
  });

  // Fetch post if in edit mode
  useEffect(() => {
    if (editId) {
      loadPostData();
    }
  }, [editId]);

  const loadPostData = async () => {
    setLoading(true);
    try {
      // Slug or ID is supported. Let's find the post.
      const res = await getBlogPostBySlug(editId);
      const post = res.data?.post || res.data;
      if (post) {
        setTitle(post.title || '');
        setCategory(post.category || 'Umum');
        setTags(post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
        setContent(post.content || '');
        if (editor) {
          editor.commands.setContent(post.content || '');
        }
        if (post.featuredImg) {
          setCoverPreview(getUploadUrl(post.featuredImg));
        }
      } else {
        toast.error('Postingan tidak ditemukan.');
        navigate('/blog');
      }
    } catch (err) {
      toast.error('Gagal memuat data postingan.');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  // Check for local draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Only show banner if draft has actual content, and is different from current state
        const isEditMismatch = editId && parsed.editId !== editId;
        const isNewMismatch = !editId && parsed.editId;
        
        if (!isEditMismatch && !isNewMismatch && (parsed.title || parsed.content)) {
          setShowDraftBanner(true);
          setSavedDraftTime(parsed.time || 'Waktu tidak diketahui');
        }
      } catch (e) {
        // Invalid json
      }
    }
  }, [draftKey, editId]);

  // Sync content with editor when content is set via API or draft
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Auto-Save Draft Interval
  useEffect(() => {
    if (!isLogged) return;
    
    const interval = setInterval(() => {
      if (title.trim() || (content && content !== '<p></p>')) {
        const draft = {
          editId: editId || null,
          title,
          content,
          category,
          tags,
          time: new Date().toLocaleString('id-ID')
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutoSaved(timeNow);
      }
    }, 10000); // auto-save every 10 seconds

    return () => clearInterval(interval);
  }, [title, content, category, tags, editId, isLogged, draftKey]);

  // Form Handlers
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/,/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran cover image maksimal 5MB.');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview('');
  };

  const handleRecoverDraft = () => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setTitle(parsed.title || '');
        setCategory(parsed.category || 'Umum');
        setTags(parsed.tags || []);
        setContent(parsed.content || '');
        if (editor) {
          editor.commands.setContent(parsed.content || '');
        }
        toast.success('Draf berhasil dipulihkan!');
      } catch (e) {
        toast.error('Gagal memulihkan draf.');
      }
    }
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setShowDraftBanner(false);
    toast.success('Draf dihapus.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul postingan tidak boleh kosong.');
      return;
    }
    if (!content || content === '<p></p>') {
      toast.error('Konten postingan tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading(editId ? 'Memperbarui postingan...' : 'Mempublikasikan postingan...');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('category', category);
      formData.append('tags', tags.join(','));
      
      if (coverFile) {
        formData.append('featuredImg', coverFile);
      }

      if (editId) {
        await updateBlogPost(editId, formData);
        toast.success('Postingan berhasil diperbarui!', { id: loadingToast });
      } else {
        await createBlogPost(formData);
        toast.success('Postingan berhasil dikirim untuk ditinjau admin!', { id: loadingToast });
      }

      // Clear draft on success
      localStorage.removeItem(draftKey);
      navigate('/blog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan postingan.', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  // Tiptap toolbar actions
  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files && input.files[0] && editor) {
        const file = input.files[0];
        
        // Admins can upload using Admin API, candidates use inline base64 fallback
        if (isAdminAuthenticated) {
          const formData = new FormData();
          formData.append('image', file);
          const uploadToast = toast.loading('Mengunggah gambar...');
          try {
            const res = await uploadBlogImage(formData);
            const url = getUploadUrl(res.data.imageUrl);
            editor.chain().focus().setImage({ src: url }).run();
            toast.success('Gambar berhasil diunggah!', { id: uploadToast });
          } catch (err) {
            toast.error('Gagal mengunggah gambar. Mengonversi ke offline base64...', { id: uploadToast });
            // Fallback to base64
            insertBase64Image(file);
          }
        } else {
          // Candidate fallback to base64
          insertBase64Image(file);
        }
      }
    };
    input.click();
  };

  const insertBase64Image = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (editor) {
        editor.chain().focus().setImage({ src: reader.result }).run();
        toast.success('Gambar berhasil disisipkan secara lokal.');
      }
    };
    reader.onerror = () => {
      toast.error('Gagal membaca gambar.');
    };
    reader.readAsDataURL(file);
  };

  const addLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL Link:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center', padding: '100px 0' }}>
          <Loader2 className="spinner" size={48} style={{ margin: '0 auto var(--space-md)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Memuat data postingan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <SEO 
        title={editId ? 'Edit Postingan Forum' : 'Tulis Postingan Forum Baru'} 
        description="Bagikan artikel edukasi atau thread diskusi baru di forum MANSAME Band."
      />
      <div className="container" style={{ maxWidth: '1040px' }}>
        
        {/* Navigation & Header */}
        <div className={styles.headerRow}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeft size={16} />
            Kembali ke Forum
          </Link>
          <h1 className={styles.pageTitle}>{editId ? 'Edit Postingan' : 'Buat Postingan Baru'}</h1>
        </div>

        {/* Local Draft Alert Banner */}
        {showDraftBanner && (
          <div className={styles.draftBanner}>
            <span className={styles.draftBannerText}>
              <FileText size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              Ditemukan draf lokal yang belum disimpan dari tanggal {savedDraftTime}.
            </span>
            <div className={styles.draftBannerActions}>
              <button onClick={handleRecoverDraft} className="btn btn-secondary btn-sm">Pulihkan Draf</button>
              <button onClick={handleDiscardDraft} className="btn btn-ghost btn-sm text-error" style={{ color: 'var(--color-error, #ef4444)' }}>
                <Trash2 size={14} style={{ marginRight: '4px' }} /> Abaikan
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          {/* Main Form Column */}
          <div className={styles.mainColumn}>
            
            {/* Title Input */}
            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.titleInput}
                placeholder="Masukkan judul postingan yang menarik..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Rich Editor Wrap */}
            <div className={styles.editorWrap}>
              {editor && (
                <div className={styles.editorContainer}>
                  {/* Toolbar */}
                  <div className={styles.menuBar}>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`${styles.menuBtn} ${editor.isActive('bold') ? styles.active : ''}`}
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`${styles.menuBtn} ${editor.isActive('italic') ? styles.active : ''}`}
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`${styles.menuBtn} ${editor.isActive('underline') ? styles.active : ''}`}
                      title="Underline"
                    >
                      <UnderlineIcon size={16} />
                    </button>

                    <span className={styles.separator} />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`${styles.menuBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
                      title="Heading 2"
                    >
                      <Heading2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`${styles.menuBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
                      title="Heading 3"
                    >
                      <Heading3 size={16} />
                    </button>

                    <span className={styles.separator} />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`${styles.menuBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
                      title="Bullet List"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`${styles.menuBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
                      title="Ordered List"
                    >
                      <ListOrdered size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`${styles.menuBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
                      title="Blockquote"
                    >
                      <Quote size={16} />
                    </button>

                    <span className={styles.separator} />

                    <button
                      type="button"
                      onClick={addLink}
                      className={`${styles.menuBtn} ${editor.isActive('link') ? styles.active : ''}`}
                      title="Insert Link"
                    >
                      <Link2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={addImage}
                      className={styles.menuBtn}
                      title="Insert Image"
                    >
                      <ImageIcon size={16} />
                    </button>

                    <span className={styles.separator} />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className={styles.menuBtn}
                      title="Undo"
                    >
                      <Undo2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className={styles.menuBtn}
                      title="Redo"
                    >
                      <Redo2 size={16} />
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className={styles.editorBody}>
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Settings Column */}
          <div className={styles.sidebarColumn}>
            
            {/* Category selection */}
            <div className={`${styles.editorCard} ${styles.inputGroup}`}>
              <label className={styles.inputLabel}>Kategori Postingan</label>
              <select
                className={styles.selectInput}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tags selection */}
            <div className={`${styles.editorCard} ${styles.inputGroup}`}>
              <label className={styles.inputLabel}>Tags (Label Kategori)</label>
              <div className={styles.tagInputContainer}>
                {tags.map((tag, index) => (
                  <span key={tag} className={styles.tagChip}>
                    #{tag}
                    <button
                      type="button"
                      className={styles.removeTagBtn}
                      onClick={() => handleRemoveTag(index)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className={styles.tagRawInput}
                  placeholder="Ketik tag lalu tekan enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
              <span className={styles.inputHelp}>Tekan Enter atau Koma ( , ) untuk menambah tag.</span>
            </div>

            {/* Featured Image Cover */}
            <div className={`${styles.editorCard} ${styles.inputGroup}`}>
              <label className={styles.inputLabel}>Gambar Sampul (Cover)</label>
              <div 
                className={styles.coverUploadArea}
                onClick={() => document.getElementById('cover-file-input').click()}
              >
                <input
                  id="cover-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                />
                
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover Preview" className={styles.coverPreview} />
                    <button 
                      onClick={handleRemoveCover} 
                      className={styles.removeCoverBtn}
                      title="Hapus Cover"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className={styles.uploadIcon} size={32} />
                    <span className={styles.uploadText}>Pilih File Gambar</span>
                    <span className={styles.uploadSubtext}>Maksimal 5MB (PNG, JPG, WebP)</span>
                  </>
                )}
              </div>
            </div>

          </div>
        </form>

        {/* Action Footer Buttons */}
        <div className={styles.actionFooter}>
          {lastAutoSaved && (
            <span className={styles.draftIndicatorText}>
              <span className={styles.dotIndicator} style={{ backgroundColor: 'var(--color-success, #22c55e)' }} />
              Draf disimpan otomatis {lastAutoSaved}
            </span>
          )}
          <Link to="/blog" className="btn btn-secondary">
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '150px' }}
          >
            {submitting ? (
              <>
                <Loader2 className="spinner" size={14} style={{ marginRight: '6px' }} />
                Mengirim...
              </>
            ) : (
              <>
                <Save size={14} style={{ marginRight: '6px' }} />
                {editId ? 'Perbarui Postingan' : 'Kirim Postingan'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
