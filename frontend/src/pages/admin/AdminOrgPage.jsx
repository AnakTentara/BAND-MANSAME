import { useState, useEffect } from 'react';
import { getOrgMembers, createOrgMember, updateOrgMember, deleteOrgMember, getMembers } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Network, Plus, Edit2, Trash2, Check, X, Upload, Link, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import styles from './AdminOrgPage.module.css';

const POSITIONS = [
  // Pimpinan Inti
  { label: 'Ketua Umum', role: 'KETUA' },
  { label: 'Wakil Ketua Umum', role: 'WAKIL' },
  { label: 'Sekretaris Umum', role: 'KABINET' },
  { label: 'Bendahara Umum', role: 'KABINET' },
  
  // Ketua Divisi
  { label: 'Ketua MedInfo', role: 'KABINET' },
  { label: 'Ketua Konselor Sebaya', role: 'KABINET' },
  { label: 'Ketua Pendidik Sebaya', role: 'KABINET' },
  { label: 'Ketua Humas', role: 'KABINET' },
  { label: 'Ketua Informasi', role: 'KABINET' },
  { label: 'Ketua Konseling dan Pendamping', role: 'KABINET' },
  { label: 'Ketua Kegiatan dan Kreativitas', role: 'KABINET' },
  
  // Anggota Divisi
  { label: 'Anggota MedInfo', role: 'ANGGOTA' },
  { label: 'Anggota Konselor Sebaya', role: 'ANGGOTA' },
  { label: 'Anggota Pendidik Sebaya', role: 'ANGGOTA' },
  { label: 'Anggota Humas', role: 'ANGGOTA' },
  { label: 'Anggota Informasi', role: 'ANGGOTA' },
  { label: 'Anggota Konseling dan Pendamping', role: 'ANGGOTA' },
  { label: 'Anggota Kegiatan dan Kreativitas', role: 'ANGGOTA' }
];

export default function AdminOrgPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL'); // ALL | CURRENT | ARCHIVE
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPembinaMode, setIsPembinaMode] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('PEMBINA');
  const [jabatan, setJabatan] = useState('');
  const [yearStart, setYearStart] = useState(new Date().getFullYear());
  const [yearEnd, setYearEnd] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [quote, setQuote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  // Link to existing member state
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  const openConfirm = useUIStore((state) => state.openConfirm);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getOrgMembers();
      setMembers(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data struktur organisasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActiveMembers = async () => {
    try {
      const res = await getMembers({ status: 'ACTIVE' });
      setAllMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load members for selection:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAllActiveMembers();
  }, []);

  const handleOpenAddModal = (forPembina = false) => {
    setEditingId(null);
    setName('');
    setSelectedMemberId(forPembina ? 'MANUAL' : '');
    setRole(forPembina ? 'PEMBINA' : 'KABINET');
    setJabatan(forPembina ? 'Pembina' : '');
    setIsPembinaMode(forPembina);
    setYearStart(new Date().getFullYear());
    setYearEnd('');
    setIsCurrent(false);
    setQuote('');
    setPhotoFile(null);
    setPhotoPreview('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingId(m.id);
    setName(m.name);
    // Use stored memberId FK directly (no more fragile name-matching)
    const existingMemberId = m.memberId || '';
    setSelectedMemberId(existingMemberId || (m.role === 'PEMBINA' ? 'MANUAL' : ''));
    setRole(m.role);
    setJabatan(m.jabatan);
    setIsPembinaMode(m.role === 'PEMBINA');
    setYearStart(m.yearStart);
    setYearEnd(m.yearEnd || '');
    setIsCurrent(m.isCurrent);
    setQuote(m.quote || '');
    setPhotoFile(null);
    // Use effectivePhoto (member photo if linked, else orgMember's own photo)
    setPhotoPreview(m.effectivePhoto ? getUploadUrl(m.effectivePhoto) : '');
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
    if (!name || !jabatan || !yearStart) {
      return toast.error('Harap isi semua kolom wajib!');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('jabatan', jabatan);
    formData.append('yearStart', yearStart);
    if (yearEnd) formData.append('yearEnd', yearEnd);
    formData.append('isCurrent', isCurrent);
    if (quote) formData.append('quote', quote);
    // Only upload photo if no member is linked (orphan entries)
    if (photoFile && (!selectedMemberId || selectedMemberId === 'MANUAL')) {
      formData.append('photo', photoFile);
    }
    // Send memberId FK
    if (selectedMemberId && selectedMemberId !== 'MANUAL') {
      formData.append('memberId', selectedMemberId);
    } else if (editingId) {
      // On edit: if explicitly set to MANUAL, signal unlink
      if (selectedMemberId === 'MANUAL') formData.append('memberId', 'NONE');
    }

    try {
      if (editingId) {
        await updateOrgMember(editingId, formData);
        toast.success('Pengurus berhasil diperbarui');
      } else {
        await createOrgMember(formData);
        toast.success('Pengurus baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengurus');
    }
  };

  const handleDelete = (id) => {
    openConfirm({
      title: 'Hapus Pengurus',
      message: 'Apakah Anda yakin ingin menghapus data pengurus ini? Tindakan ini tidak dapat dibatalkan.',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteOrgMember(id);
          toast.success('Pengurus berhasil dihapus');
          fetchMembers();
        } catch (err) {
          toast.error('Gagal menghapus pengurus');
        }
      }
    });
  };

  const ROLE_ORDER = { KETUA: 1, WAKIL: 2, KABINET: 3, PEMBINA: 4 };

  const filteredMembers = members
    .filter((m) => {
      if (tab === 'CURRENT') return m.isCurrent;
      if (tab === 'ARCHIVE') return !m.isCurrent;
      return true;
    })
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));


  return (
    <div className={styles.page}>
      <AdminHeader title="Struktur Organisasi" subtitle="Manajemen pengurus, pembina, dan kabinet PIK-R MANSEKU">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => handleOpenAddModal(false)}>
            <Plus size={16} /> Tambah Pengurus
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenAddModal(true)}>
            <Plus size={16} /> Tambah Pembina
          </button>
        </div>
      </AdminHeader>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'ALL' ? styles.active : ''}`} onClick={() => setTab('ALL')}>Semua</button>
          <button className={`${styles.tab} ${tab === 'CURRENT' ? styles.active : ''}`} onClick={() => setTab('CURRENT')}>Menjabat Saat Ini</button>
          <button className={`${styles.tab} ${tab === 'ARCHIVE' ? styles.active : ''}`} onClick={() => setTab('ARCHIVE')}>Arsip Kepengurusan</button>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={8} />
        ) : filteredMembers.length === 0 ? (
          <div className={styles.empty}>Belum ada data pengurus di kategori ini.</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                                <th>No</th>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Peran</th>
                  <th>Tahun</th>
                  <th>Aktif</th>
                  <th>Akun Terhubung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {m.effectivePhoto ? (
                        <img src={getUploadUrl(m.effectivePhoto)} alt={m.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{m.name[0]}</div>
                      )}
                    </td>
                    <td className={styles.name}>{m.name}</td>
                    <td>{m.jabatan}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[m.role.toLowerCase()]}`}>
                        {m.role}
                      </span>
                    </td>
                    <td>{m.yearStart}{m.yearEnd ? ` - ${m.yearEnd}` : ' - sekarang'}</td>
                    <td>
                      {m.isCurrent ? (
                        <span className={styles.yes}><Check size={16} /></span>
                      ) : (
                        <span className={styles.no}><X size={16} /></span>
                      )}
                    </td>
                    <td>
                      {m.memberId ? (
                        <span className={styles.linkedBadge}>
                          <Link size={12} /> {m.member?.nisn || 'Terhubung'}
                        </span>
                      ) : (
                        <span className={styles.orphanBadge}>
                          <Unlink size={12} /> Mandiri
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(m)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(m.id)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Photo upload: only shown for orphan entries (no linked Member account) */}
              {(!selectedMemberId || selectedMemberId === 'MANUAL') && (
                <div className={styles.photoSection}>
                  <div className={styles.photoPreviewWrapper}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}><Upload size={24} /></div>
                    )}
                  </div>
                  <label className={styles.photoLabel}>
                    <Upload size={14} /> Pilih Foto Pengurus
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className={styles.fileInput} />
                  </label>
                </div>
              )}
              {/* If linked to a Member, show their photo */}
              {selectedMemberId && selectedMemberId !== 'MANUAL' && (() => {
                const linked = allMembers.find(m => m.id === selectedMemberId);
                return linked?.photoPath ? (
                  <div className={styles.linkedPhotoInfo}>
                    <img src={getUploadUrl(linked.photoPath)} alt={linked.name} className={styles.linkedPhotoAvatar} />
                    <span>Foto diambil dari akun anggota <strong>{linked.name}</strong>. Edit foto melalui halaman Anggota.</span>
                  </div>
                ) : (
                  <div className={styles.linkedPhotoInfo}>
                    <div className={styles.linkedPhotoPlaceholder}>{linked?.name?.[0] || '?'}</div>
                    <span>Anggota <strong>{linked?.name}</strong> belum punya foto profil. Upload foto di halaman Anggota.</span>
                  </div>
                );
              })()}

              <div className={styles.grid}>
                 {/* Member dropdown — shown in BOTH create and edit modes */}
                 <div className="form-group">
                   <label className="form-label">
                     {isPembinaMode 
                       ? (editingId ? 'Tautkan ke Akun Pembina' : 'Tautkan ke Akun Pembina (Opsional)') 
                       : (editingId ? 'Tautkan ke Akun Anggota' : 'Pilih Anggota PIK-R *')}
                   </label>
                   <select
                     className="form-select"
                     value={selectedMemberId}
                     onChange={(e) => {
                       const val = e.target.value;
                       setSelectedMemberId(val);
                       if (val && val !== 'MANUAL') {
                         const found = allMembers.find((m) => m.id === val);
                         if (found) setName(found.name);
                       } else if (!editingId) {
                         setName('');
                       }
                     }}
                     required={!isPembinaMode && !editingId}
                   >
                     <option value="">{editingId ? '— Tidak diubah —' : (isPembinaMode ? '— Pilih Akun Pembina (Kosongkan jika Mandiri) —' : '— Pilih Anggota —')}</option>
                     {editingId && <option value="MANUAL">✕ Lepas tautan (tanpa akun)</option>}
                     {allMembers.map((m) => (
                       <option key={m.id} value={m.id}>
                         {m.name} ({m.role} - {m.className || 'Umum'})
                       </option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="form-group">
                   <label className="form-label">Nama Lengkap *</label>
                   <input
                     type="text"
                     className="form-input"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     readOnly={selectedMemberId && selectedMemberId !== 'MANUAL'}
                     required
                     style={selectedMemberId && selectedMemberId !== 'MANUAL' ? { backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' } : {}}
                     placeholder={selectedMemberId && selectedMemberId !== 'MANUAL' ? "Nama otomatis terisi setelah memilih akun" : "Masukkan nama lengkap"}
                   />
                 </div>
                 
                 <div className="form-group">
                   <label className="form-label">Jabatan Kepengurusan *</label>
                   {isPembinaMode ? (
                     <input
                       type="text"
                       className="form-input"
                       value="Pembina"
                       readOnly
                       style={{ backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' }}
                     />
                   ) : (
                     <select
                       className="form-select"
                       value={jabatan}
                       onChange={(e) => {
                         const val = e.target.value;
                         setJabatan(val);
                         const matchedPos = POSITIONS.find((p) => p.label === val);
                         if (matchedPos) {
                           setRole(matchedPos.role);
                         }
                       }}
                       required
                     >
                       <option value="">— Pilih Jabatan —</option>
                       {POSITIONS.map((p) => (
                         <option key={p.label} value={p.label}>
                           {p.label}
                         </option>
                       ))}
                     </select>
                   )}
                 </div>
                <div className="form-group">
                  <label className="form-label">Tahun Mulai Menjabat *</label>
                  <input type="number" className="form-input" value={yearStart} onChange={(e) => setYearStart(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Selesai Menjabat (kosongkan jika masih menjabat)</label>
                  <input type="number" className="form-input" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} />
                </div>
                <div className="form-group checkbox-group">
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
                    Menjabat Saat Ini (Aktif)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kata Sambutan / Kutipan (Quote)</label>
                <textarea className="form-textarea" rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Tuliskan kata motivasi atau sambutan singkat..." />
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
