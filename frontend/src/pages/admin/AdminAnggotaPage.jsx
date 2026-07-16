import { useState, useEffect, useMemo, useRef } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Edit, Trash2, Search, AlertTriangle, Key, Eye, EyeOff, ChevronLeft, ChevronRight, Plus, Copy, CheckCircle, Upload, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { getUploadUrl } from '@/api/axios';
import styles from './AdminAnggotaPage.module.css';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((tingkat) => {
  const maxClass = tingkat === 'X' ? 9 : 8;
  for (let i = 1; i <= maxClass; i++) {
    KELAS_OPTIONS.push(`${tingkat}-${i}`);
  }
});

const ITEMS_PER_PAGE = 10;

export default function AdminAnggotaPage() {
  const { adminUser } = useAuthStore();
  const isMedinfo = adminUser?.role === 'MEDINFO';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // ALL | ACTIVE | ALUMNI
  const [filterKelas, setFilterKelas] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswords, setShowPasswords] = useState({});

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    className: '',
    email: '',
    whatsappNumber: '',
    plainPassword: '',
    status: 'ACTIVE',
    gender: '',
    asalSekolah: '',
    joinYear: '',
    role: 'member',
  });
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nisn: '',
    name: '',
    className: '',
    email: '',
    whatsappNumber: '',
    gender: '',
    role: 'member',
    reason: '',
  });

  // Credentials Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const openConfirm = useUIStore((state) => state.openConfirm);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getMembers();
      setMembers(res.data || []);
    } catch {
      toast.error('Gagal memuat data anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (m) => {
    setSelectedMember(m);
    setEditForm({
      name: m.name || '',
      className: m.className || '',
      email: m.email || '',
      whatsappNumber: m.whatsappNumber || '',
      plainPassword: m.plainPassword || '',
      status: m.status || 'ACTIVE',
      gender: m.gender || '',
      asalSekolah: m.asalSekolah || '',
      joinYear: m.joinYear || '',
      role: m.role || 'member',
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(m.photoPath ? getUploadUrl(m.photoPath) : '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.whatsappNumber.trim()) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }

    try {
      // Use FormData if there's a photo to upload
      let payload;
      if (editPhotoFile) {
        payload = new FormData();
        Object.entries(editForm).forEach(([k, v]) => { if (v !== '' && v !== undefined) payload.append(k, v); });
        payload.append('photo', editPhotoFile);
      } else {
        payload = editForm;
      }
      await updateMember(selectedMember.id, payload);
      toast.success('Data anggota berhasil diperbarui.');
      setEditModalOpen(false);
      fetchMembers();
    } catch {
      toast.error('Gagal memperbarui data anggota.');
    }
  };

  const handleOpenAddModal = () => {
    setAddForm({
      nisn: '',
      name: '',
      className: '',
      email: '',
      whatsappNumber: '',
      gender: '',
      role: 'member',
      reason: '',
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    const isPembinaRole = addForm.role === 'PEMBINA';
    if (
      !addForm.nisn ||
      !addForm.name.trim() ||
      (!isPembinaRole && !addForm.className) ||
      !addForm.email.trim() ||
      !addForm.whatsappNumber.trim() ||
      !addForm.gender
    ) {
      toast.error('Semua kolom bertanda * wajib diisi.');
      return;
    }

    if (addForm.nisn.length !== 10 || !/^\d+$/.test(addForm.nisn)) {
      toast.error('NISN harus 10 digit angka.');
      return;
    }

    const loadingToast = toast.loading('Menambahkan anggota...');
    try {
      const res = await createMember(addForm);
      toast.success('Anggota berhasil ditambahkan!', { id: loadingToast });
      setCreatedCredentials(res.data.member);
      setAddModalOpen(false);
      setCredentialsModalOpen(true);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota.', { id: loadingToast });
    }
  };

  const handleDeleteClick = (m) => {
    openConfirm({
      title: 'Hapus Anggota Tetap',
      message: `Apakah Anda yakin ingin menghapus "${m.name}" secara permanen dari database anggota PIK-R?`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMember(m.id);
          toast.success('Anggota berhasil dihapus.');
          fetchMembers();
        } catch {
          toast.error('Gagal menghapus anggota.');
        }
      }
    });
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique kelas and angkatan for filter dropdowns
  const kelasOptions = useMemo(() => [...new Set(members.map(m => m.className).filter(Boolean))].sort(), [members]);
  const angkatanOptions = useMemo(() => [...new Set(members.map(m => m.joinYear).filter(Boolean))].sort((a, b) => b - a), [members]);

  // Filter
  const filteredMembers = useMemo(() => members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.nisn || '').includes(search);
    const matchesTab = statusTab === 'ALL' ? true : m.status === statusTab;
    const matchesKelas = filterKelas ? m.className === filterKelas : true;
    const matchesAngkatan = filterAngkatan ? String(m.joinYear) === String(filterAngkatan) : true;
    return matchesSearch && matchesTab && matchesKelas && matchesAngkatan;
  }), [members, search, statusTab, filterKelas, filterAngkatan]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset page when filters change
  const handleSearchChange = (val) => { setSearch(val); setCurrentPage(1); };
  const handleKelasChange = (val) => { setFilterKelas(val); setCurrentPage(1); };
  const handleAngkatanChange = (val) => { setFilterAngkatan(val); setCurrentPage(1); };
  const handleTabChange = (tab) => { setStatusTab(tab); setCurrentPage(1); };

  const activeCount = members.filter(m => m.status === 'ACTIVE').length;
  const alumniCount = members.filter(m => m.status === 'ALUMNI').length;

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Daftar Anggota PIK-R"
        subtitle={`${activeCount} Anggota Aktif | ${alumniCount} Alumni`}
      >
        {!isMedinfo && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Tambah Anggota
          </button>
        )}
      </AdminHeader>

      <div className={styles.body}>
        {/* Info Box */}
        <div className={styles.infoBanner}>
          <AlertTriangle size={18} />
          <span>
            Anggota PIK-R memiliki masa aktif maksimal 3 tahun, setelah itu status otomatis berubah menjadi <strong>ALUMNI</strong>.
          </span>
        </div>

        {/* Tabs & Filters */}
        <div className={styles.tabHeader}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${statusTab === 'ALL' ? styles.active : ''}`} onClick={() => handleTabChange('ALL')}>Semua ({members.length})</button>
            <button className={`${styles.tab} ${statusTab === 'ACTIVE' ? styles.active : ''}`} onClick={() => handleTabChange('ACTIVE')}>Aktif ({activeCount})</button>
            <button className={`${styles.tab} ${statusTab === 'ALUMNI' ? styles.active : ''}`} onClick={() => handleTabChange('ALUMNI')}>Alumni ({alumniCount})</button>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari nama / NISN..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={filterKelas} onChange={(e) => handleKelasChange(e.target.value)}>
              <option value="">Semua Kelas</option>
              {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select className={styles.filterSelect} value={filterAngkatan} onChange={(e) => handleAngkatanChange(e.target.value)}>
              <option value="">Semua Angkatan</option>
              {angkatanOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <SkeletonTable rows={5} cols={9} />
          ) : filteredMembers.length === 0 ? (
            <div className={styles.empty}>Belum ada data anggota di kategori ini.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>Angkatan</th>
                  <th>Status</th>
                  <th>Sandi Akun</th>
                  {!isMedinfo && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                    <td className={styles.tdNum}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td>
                      {m.photoPath ? (
                        <img src={getUploadUrl(m.photoPath)} alt={m.name} className={styles.memberAvatar} />
                      ) : (
                        <div className={styles.memberAvatarPlaceholder}><User size={14} /></div>
                      )}
                    </td>
                    <td className={styles.tdMono}>{m.nisn}</td>
                    <td className={styles.tdName}>{m.name}</td>
                    <td>{m.className}</td>
                    <td>{m.joinYear}</td>
                    <td>
                      <span className={m.status === 'ACTIVE' ? styles.badgeActive : styles.badgeAlumni}>
                        {m.status === 'ACTIVE' ? 'AKTIF' : 'ALUMNI'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.passwordCell}>
                        <Key size={14} className={styles.keyIcon} />
                        <span className={styles.passwordText}>
                          {showPasswords[m.id] ? m.plainPassword || '—' : '••••••'}
                        </span>
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => togglePasswordVisibility(m.id)}
                        >
                          {showPasswords[m.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    {!isMedinfo && (
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditClick(m)}
                            title="Edit Anggota & Sandi"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteClick(m)}
                            title="Hapus Anggota Tetap"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredMembers.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} dari {filteredMembers.length} anggota
              </span>
              <div className={styles.paginationControls}>
                <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>
                    ) : (
                      <button key={p} className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`} onClick={() => handlePageChange(p)}>{p}</button>
                    )
                  )}
                <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Edit Anggota &amp; Akun</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>NISN: <strong>{selectedMember?.nisn}</strong></p>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              {/* Photo Upload */}
              <div className={styles.photoEditSection}>
                <div className={styles.photoEditPreview}>
                  {editPhotoPreview ? (
                    <img src={editPhotoPreview} alt="Foto" />
                  ) : (
                    <div className={styles.photoEditPlaceholder}><User size={28} /></div>
                  )}
                </div>
                <label className={styles.photoEditBtn}>
                  <Upload size={14} /> {editPhotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditPhotoFile(file);
                        setEditPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                <p className={styles.photoEditHint}>Foto profil anggota akan tampil di pohon organisasi jika anggota ini terhubung sebagai pengurus.</p>
              </div>

              <div className={styles.editGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">Nama Lengkap *</label>
                  <input id="edit-name" type="text" className="form-input" value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-class">Kelas</label>
                  <input id="edit-class" type="text" className="form-input" value={editForm.className}
                    onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-email">Email *</label>
                  <input id="edit-email" type="email" className="form-input" value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-wa">No. WhatsApp *</label>
                  <input id="edit-wa" type="text" className="form-input" value={editForm.whatsappNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, whatsappNumber: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    {['Laki-laki', 'Perempuan'].map((g) => (
                      <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="edit-gender" value={g}
                          checked={editForm.gender === g}
                          onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-asal">Asal Sekolah</label>
                  <input id="edit-asal" type="text" className="form-input" value={editForm.asalSekolah}
                    onChange={(e) => setEditForm((f) => ({ ...f, asalSekolah: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-year">Tahun Bergabung</label>
                  <input id="edit-year" type="number" className="form-input" value={editForm.joinYear}
                    min="2000" max="2099"
                    onChange={(e) => setEditForm((f) => ({ ...f, joinYear: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-role">Peran Organisasi</label>
                  <select id="edit-role" className="form-select" value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="member">Anggota Biasa</option>
                    <option value="PEMBINA">PEMBINA</option>
                    <option value="KETUA">KETUA</option>
                    <option value="WAKIL">WAKIL KETUA</option>
                    <option value="KABINET">KABINET/PENGURUS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-status">Status Keanggotaan</label>
                  <select id="edit-status" className="form-select" value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">AKTIF</option>
                    <option value="ALUMNI">ALUMNI</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-password">Sandi Akun (Plaintext)</label>
                  <input id="edit-password" type="text" className="form-input"
                    placeholder="Kosongkan jika tidak ingin mengubah sandi..."
                    value={editForm.plainPassword}
                    onChange={(e) => setEditForm((f) => ({ ...f, plainPassword: e.target.value }))} />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Tambah Anggota Baru secara Manual</h3>
            </div>
            <form onSubmit={handleSaveAdd} className={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="add-nisn">NISN *</label>
                <input
                  id="add-nisn"
                  type="text"
                  maxLength={10}
                  className="form-input"
                  placeholder="Masukkan 10 digit NISN"
                  value={addForm.nisn}
                  onChange={(e) => setAddForm((f) => ({ ...f, nisn: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-name">Nama Lengkap *</label>
                <input
                  id="add-name"
                  type="text"
                  className="form-input"
                  placeholder="Nama sesuai dokumen resmi"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-class">Kelas {addForm.role === 'PEMBINA' ? '(Opsional)' : '*'}</label>
                <select
                  id="add-class"
                  className="form-select"
                  value={addForm.className}
                  onChange={(e) => setAddForm((f) => ({ ...f, className: e.target.value }))}
                >
                  <option value="">— Pilih Kelas —</option>
                  {KELAS_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-email">Email *</label>
                <input
                  id="add-email"
                  type="email"
                  className="form-input"
                  placeholder="email@contoh.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-wa">No. WhatsApp *</label>
                <input
                  id="add-wa"
                  type="text"
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  value={addForm.whatsappNumber}
                  onChange={(e) => setAddForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Kelamin *</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="add-gender"
                      value="Laki-laki"
                      checked={addForm.gender === 'Laki-laki'}
                      onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                    />
                    <span>Laki-laki</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="add-gender"
                      value="Perempuan"
                      checked={addForm.gender === 'Perempuan'}
                      onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                    />
                    <span>Perempuan</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-role">Peran Organisasi / Role *</label>
                <select
                  id="add-role"
                  className="form-select"
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="member">Anggota Biasa (member)</option>
                  <option value="PEMBINA">PEMBINA</option>
                  <option value="KETUA">KETUA</option>
                  <option value="WAKIL">WAKIL KETUA</option>
                  <option value="KABINET">KABINET/PENGURUS HARIAN</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-reason">Alasan Bergabung (Opsional)</label>
                <textarea
                  id="add-reason"
                  className="form-textarea"
                  rows={3}
                  placeholder="Tuliskan motivasi/alasan masuk..."
                  value={addForm.reason}
                  onChange={(e) => setAddForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">
                  Tambah Anggota
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAddModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Success Modal */}
      {credentialsModalOpen && createdCredentials && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Anggota Berhasil Ditambahkan!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Akun anggota tetap telah aktif. Harap catat kredensial berikut untuk diberikan kepada siswa yang bersangkutan:
            </p>

            <div style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>NAMA LENGKAP</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{createdCredentials.name}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>USERNAME / NISN</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{createdCredentials.nisn}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>KATA SANDI SEMENTARA</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1.125rem', color: 'var(--color-accent)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {createdCredentials.plainPassword}
                  </strong>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.plainPassword);
                      toast.success('Sandi berhasil disalin!');
                    }}
                    title="Salin Sandi"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setCredentialsModalOpen(false)}
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

