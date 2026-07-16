import { useState, useEffect } from 'react';
import { getUploadedFiles, deleteUploadedFile } from '@/api/admin';
import { getUploadUrl } from '@/api/axios';
import AdminHeader from '@/components/admin/AdminHeader';
import { Search, Trash2, Copy, Eye, Calendar, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminFileManagerPage.module.css';

export default function AdminFileManagerPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await getUploadedFiles();
      setFiles(res.data.files || []);
    } catch (err) {
      toast.error('Gagal memuat file terunggah.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus file "${file.name}" secara permanen?`)) {
      return;
    }
    try {
      await deleteUploadedFile(file.path);
      toast.success('File berhasil dihapus!');
      setFiles(prev => prev.filter(f => f.path !== file.path));
      if (selectedFile?.path === file.path) {
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus file.');
    }
  };

  const handleCopyLink = (file) => {
    const fullUrl = getUploadUrl(file.path);
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link tautan berhasil disalin ke clipboard!');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'photos': return 'Foto Profil';
      case 'blog': return 'Artikel Blog';
      case 'logos': return 'Logo / Web';
      default: return category;
    }
  };

  // Filters
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 'all' || f.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.page}>
      <AdminHeader
        title="File Manager"
        subtitle="Kelola dan pantau seluruh berkas gambar yang telah diunggah ke server"
      />

      <div className={styles.controls}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari file berdasarkan nama..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs Filter */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`} onClick={() => setActiveTab('all')}>
            Semua ({files.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'photos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('photos')}>
            Foto Profil ({files.filter(f => f.category === 'photos').length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'blog' ? styles.activeTab : ''}`} onClick={() => setActiveTab('blog')}>
            Artikel Blog ({files.filter(f => f.category === 'blog').length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'logos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('logos')}>
            Logo & Web ({files.filter(f => f.category === 'logos').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 className="spinner" size={32} />
          <p>Memuat file...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className={styles.emptyContainer}>
          <ImageIcon size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>Tidak ditemukan file terunggah.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredFiles.map((file) => (
            <div key={file.path} className={styles.card}>
              <div className={styles.previewContainer} onClick={() => setSelectedFile(file)}>
                <img src={getUploadUrl(file.path)} alt={file.name} className={styles.previewImage} />
                <div className={styles.overlay}>
                  <Eye size={20} className={styles.overlayIcon} />
                </div>
              </div>
              <div className={styles.details}>
                <h4 className={styles.fileName} title={file.name}>{file.name}</h4>
                <div className={styles.meta}>
                  <span className={`${styles.categoryBadge} ${styles[file.category]}`}>
                    {getCategoryLabel(file.category)}
                  </span>
                  <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                </div>
                <div className={styles.cardActions}>
                  <button className="btn btn-ghost" onClick={() => handleCopyLink(file)} title="Salin Tautan Gambar">
                    <Copy size={14} />
                    Salin Link
                  </button>
                  <button className="btn btn-ghost text-error" onClick={() => handleDelete(file)} title="Hapus File Permanen">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFile(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedFile(null)}>×</button>
            <h3 className={styles.modalTitle}>Detail & Pratampilan File</h3>
            <div className={styles.modalBody}>
              <div className={styles.modalPreview}>
                <img src={getUploadUrl(selectedFile.path)} alt={selectedFile.name} />
              </div>
              <div className={styles.modalMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Nama File:</span>
                  <span className={styles.metaValue} style={{ wordBreak: 'break-all' }}>{selectedFile.name}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Kategori:</span>
                  <span className={styles.metaValue}>{getCategoryLabel(selectedFile.category)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Ukuran:</span>
                  <span className={styles.metaValue}>{formatBytes(selectedFile.size)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Tanggal Diunggah:</span>
                  <span className={styles.metaValue}>
                    {new Date(selectedFile.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Path Internal:</span>
                  <span className={styles.metaValueCode}>{selectedFile.path}</span>
                </div>
                
                <div className={styles.modalActions}>
                  <button className="btn btn-primary" onClick={() => handleCopyLink(selectedFile)}>
                    <Copy size={16} />
                    Salin Link URL
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedFile)}>
                    <Trash2 size={16} />
                    Hapus File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
