import { useState, useEffect } from 'react';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { useUIStore } from '@/stores/uiStore';
import { Plus, Edit2, Trash2, X, Upload, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import styles from './AdminTestimonialsPage.module.css';

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [content, setContent] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const openConfirm = useUIStore((state) => state.openConfirm);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await getTestimonials();
      setTestimonials(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data testimoni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setAngkatan('');
    setContent('');
    setPhotoFile(null);
    setPhotoPreview('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingId(t.id);
    setName(t.name);
    setAngkatan(t.angkatan);
    setContent(t.content);
    setPhotoFile(null);
    setPhotoPreview(t.photoPath ? getUploadUrl(t.photoPath) : '');
    setModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !content) {
      return toast.error('Harap isi semua kolom wajib!');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('angkatan', angkatan);
    formData.append('content', content);
    if (photoFile) formData.append('photo', photoFile);

    try {
      if (editingId) {
        await updateTestimonial(editingId, formData);
        toast.success('Testimoni berhasil diperbarui');
      } else {
        await createTestimonial(formData);
        toast.success('Testimoni baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data testimoni');
    }
  };

  const handleDelete = (id) => {
    openConfirm({
      title: 'Hapus Testimoni',
      message: 'Apakah Anda yakin ingin menghapus testimoni ini? Tindakan ini tidak dapat dibatalkan.',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteTestimonial(id);
          toast.success('Testimoni berhasil dihapus');
          fetchTestimonials();
        } catch (err) {
          toast.error('Gagal menghapus testimoni');
        }
      }
    });
  };

  return (
    <div className={styles.page}>
      <AdminHeader title="Testimoni Alumni" subtitle="Kelola perkataan dan pesan kesan alumni PIK-R MANSEKU">
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Tambah Testimoni
        </button>
      </AdminHeader>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={`${styles.card} skeleton`} style={{ height: 200 }} />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className={styles.empty}>Belum ada testimoni alumni. Klik "+ Tambah Testimoni" untuk memulai.</div>
        ) : (
          <div className={styles.grid}>
            {testimonials.map((t) => (
              <div key={t.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.meta}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{t.name[0]}</div>
                    )}
                    <div>
                      <h4 className={styles.name}>{t.name}</h4>
                      <span className={styles.badge}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(t)} title="Edit">
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(t.id)} title="Hapus">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.text}>"{t.content}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.photoSection}>
                <div className={styles.photoPreviewWrapper}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                  ) : (
                    <div className={styles.photoPlaceholder}><Upload size={24} /></div>
                  )}
                </div>
                <label className={styles.photoLabel}>
                  <Upload size={14} /> Pilih Foto Alumni
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className={styles.fileInput} />
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Alumni *</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nama Lengkap Alumni" />
              </div>

              <div className="form-group">
                <label className="form-label">Angkatan (Tahun Lulus, misal: 2023) *</label>
                <input type="text" className="form-input" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} required placeholder="Contoh: 2023" />
              </div>

              <div className="form-group">
                <label className="form-label">Testimoni / Pesan Kesan *</label>
                <textarea className="form-textarea" rows={4} value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Bagikan kesan pesan selama berada di PIK-R MANSEKU..." />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
