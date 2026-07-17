import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Star, StarOff, X, Upload, Images } from 'lucide-react';
import {
  getAdminGalleryPhotos,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto
} from '@/api/gallery';
import { getUploadUrl } from '@/api/axios';
import toast from 'react-hot-toast';
import styles from './AdminGalleryPage.module.css';

const CATEGORIES = ['Umum', 'Penampilan', 'Latihan', 'Event', 'Behind the Scenes'];

const emptyForm = {
  title: '',
  description: '',
  category: 'Umum',
  isFeatured: false,
  sortOrder: 0,
};

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = new, obj = edit
  const [form, setForm] = useState(emptyForm);
  const [previewFile, setPreviewFile] = useState(null); // File object
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadPhotos(); }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await getAdminGalleryPhotos();
      setPhotos(res.data || []);
    } catch {
      toast.error('Gagal memuat foto galeri');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setPreviewFile(null);
    setPreviewUrl('');
    setShowModal(true);
  };

  const openEdit = (photo) => {
    setEditTarget(photo);
    setForm({
      title: photo.title,
      description: photo.description || '',
      category: photo.category,
      isFeatured: photo.isFeatured,
      sortOrder: photo.sortOrder,
    });
    setPreviewFile(null);
    setPreviewUrl(getUploadUrl(photo.photoPath));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return; }
    if (!editTarget && !previewFile) { toast.error('Foto wajib diupload'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('isFeatured', String(form.isFeatured));
      fd.append('sortOrder', String(form.sortOrder));
      if (previewFile) fd.append('photo', previewFile);

      if (editTarget) {
        await updateGalleryPhoto(editTarget.id, fd);
        toast.success('Foto berhasil diupdate');
      } else {
        await createGalleryPhoto(fd);
        toast.success('Foto berhasil ditambahkan');
      }
      closeModal();
      loadPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan foto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!confirm(`Hapus foto "${photo.title}"? Tindakan ini tidak bisa diurungkan.`)) return;
    try {
      await deleteGalleryPhoto(photo.id);
      toast.success('Foto dihapus');
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch {
      toast.error('Gagal menghapus foto');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Images size={24} /> Galeri Foto
          </h1>
          <p className={styles.pageSubtitle}>{photos.length} foto tersimpan</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Foto
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className={styles.empty}>
          <Images size={48} className={styles.emptyIcon} />
          <p>Belum ada foto. Klik "Tambah Foto" untuk mulai.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {photos.map(photo => (
            <div key={photo.id} className={`${styles.card} ${photo.isFeatured ? styles.cardFeatured : ''}`}>
              <div className={styles.cardImg}>
                <img src={getUploadUrl(photo.photoPath)} alt={photo.title} />
                {photo.isFeatured && (
                  <div className={styles.featuredBadge}><Star size={12} /> Unggulan</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardCategory}>{photo.category}</span>
                <h3 className={styles.cardTitle}>{photo.title}</h3>
                {photo.description && <p className={styles.cardDesc}>{photo.description}</p>}
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(photo)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(photo)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? 'Edit Foto' : 'Tambah Foto Baru'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {/* Upload foto */}
              <div
                className={`${styles.dropzone} ${previewUrl ? styles.dropzoneHasFile : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className={styles.dropzonePreview} />
                ) : (
                  <div className={styles.dropzonePlaceholder}>
                    <Upload size={32} className={styles.dropzoneIcon} />
                    <p>Klik untuk upload foto</p>
                    <span>JPG, PNG, WEBP — maks. 8MB</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleFile}
                />
              </div>

              {previewUrl && (
                <button type="button" className={styles.changePhoto} onClick={() => fileRef.current?.click()}>
                  Ganti Foto
                </button>
              )}

              <div className="form-group">
                <label className="form-label">Judul Foto *</label>
                <input name="title" value={form.title} onChange={handleChange} className="form-input" placeholder="Contoh: Penampilan di Pensi 2025" required />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi (opsional)</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" placeholder="Keterangan singkat tentang foto ini..." rows={3} />
              </div>

              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kategori</label>
                  <select name="category" value={form.category} onChange={handleChange} className="form-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ width: '100px' }}>
                  <label className="form-label">Urutan</label>
                  <input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} className="form-input" min={0} />
                </div>
              </div>

              <label className={styles.checkboxRow}>
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                <span><Star size={14} /> Tandai sebagai Foto Unggulan</span>
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner" />}
                  {saving ? 'Menyimpan...' : editTarget ? 'Update Foto' : 'Simpan Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
