import { useState, useEffect, useMemo } from 'react';
import { getCandidates, updateCandidate, deleteCandidate, sendNotifications, getSettings, closeSession, openSession } from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, ToggleLeft, ToggleRight, Bell, FileSpreadsheet, FileJson, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPendaftaranPage.module.css';
import { downloadBlob } from '@/utils/truncate';
import { exportExcel, exportJSON } from '@/api/admin';

const ITEMS_PER_PAGE = 10;

export default function AdminPendaftaranPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    className: '',
    asalSekolah: '',
    email: '',
    whatsappNumber: '',
    status: '',
  });

  const { openConfirm } = useUIStore();

  useEffect(() => {
    fetchSessionAndCandidates();
  }, []);

  const fetchSessionAndCandidates = async () => {
    setLoading(true);
    try {
      // Load settings to check session status
      const settingsRes = await getSettings();
      const settingsList = settingsRes.data?.settings || [];
      const sessionSetting = settingsList.find((s) => s.key === 'REGISTRATION_SESSION');
      if (sessionSetting?.value) {
        const sessionData = JSON.parse(sessionSetting.value);
        setIsSessionOpen(sessionData.status === 'open');
        setSessionInfo(sessionData);
      } else {
        setIsSessionOpen(true);
      }

      // Load candidates
      const candRes = await getCandidates();
      setCandidates(candRes.data || []);
    } catch {
      toast.error('Gagal memuat data pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSession = async () => {
    const actionText = isSessionOpen 
      ? 'Menutup sesi akan memindahkan seluruh peserta LULUS ke data Anggota Tetap PIK-R, lalu membersihkan seluruh database pendaftaran calon peserta saat ini.' 
      : 'Membuka sesi pendaftaran baru akan membersihkan data pendaftaran lama dan mengizinkan calon peserta baru mendaftar kembali.';

    openConfirm({
      title: `${isSessionOpen ? 'Tutup' : 'Buka'} Sesi Pendaftaran`,
      message: `${actionText} Apakah Anda sangat yakin?`,
      danger: isSessionOpen,
      onConfirm: async () => {
        setSavingSession(true);
        try {
          if (isSessionOpen) {
            const res = await closeSession();
            toast.success(res.data.message || 'Sesi pendaftaran berhasil ditutup & diarsipkan.');
          } else {
            await openSession();
            toast.success('Sesi pendaftaran baru berhasil dibuka.');
          }
          await fetchSessionAndCandidates();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal memperbarui sesi pendaftaran.');
        } finally {
          setSavingSession(false);
        }
      },
    });
  };

  // Notification trigger
  const handleSendNotifications = () => {
    openConfirm({
      title: 'Kirim Notifikasi Massal',
      message: 'Kirim notifikasi hasil kelulusan ke semua peserta via Email & WhatsApp? Ini membutuhkan waktu beberapa saat.',
      onConfirm: async () => {
        setNotifying(true);
        try {
          await sendNotifications();
          toast.success('Proses pengiriman notifikasi berhasil dimulai!');
          fetchSessionAndCandidates();
        } catch {
          toast.error('Gagal mengirimkan notifikasi.');
        } finally {
          setNotifying(false);
        }
      },
    });
  };

  // CRUD handlers
  const handleEditClick = (c) => {
    setSelectedCandidate(c);
    setEditForm({
      name: c.name || '',
      className: c.className || '',
      asalSekolah: c.asalSekolah || '',
      email: c.email || '',
      whatsappNumber: c.whatsappNumber || '',
      status: c.status || 'PENDING',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.whatsappNumber.trim()) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }

    try {
      await updateCandidate(selectedCandidate.id, editForm);
      toast.success('Data peserta berhasil diperbarui.');
      setEditModalOpen(false);
      fetchSessionAndCandidates();
    } catch {
      toast.error('Gagal memperbarui data peserta.');
    }
  };

  const handleDeleteClick = (id, name) => {
    openConfirm({
      title: 'Hapus Calon Peserta',
      message: `Hapus pendaftar "${name}"? Tindakan ini permanen.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteCandidate(id);
          toast.success('Pendaftar berhasil dihapus.');
          fetchSessionAndCandidates();
        } catch {
          toast.error('Gagal menghapus pendaftar.');
        }
      },
    });
  };

  // Export handlers
  const handleExportExcel = async () => {
    try {
      const blob = await exportExcel();
      downloadBlob(blob, 'rekap_pendaftaran.xlsx');
      toast.success('Data pendaftaran berhasil diexport ke Excel.');
    } catch {
      toast.error('Gagal mengeksport data.');
    }
  };

  const handleExportJSON = async () => {
    try {
      const blob = await exportJSON();
      downloadBlob(blob, 'akun_pendaftaran.json');
      toast.success('Data pendaftaran berhasil diexport ke JSON.');
    } catch {
      toast.error('Gagal mengeksport data.');
    }
  };

  // Unique kelas for filter
  const kelasOptions = useMemo(() => [...new Set(candidates.map(c => c.className).filter(Boolean))].sort(), [candidates]);

  // Search & Filter
  const filteredCandidates = useMemo(() => candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nisn || '').includes(search);
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesKelas = filterKelas ? c.className === filterKelas : true;
    return matchesSearch && matchesStatus && matchesKelas;
  }), [candidates, search, statusFilter, filterKelas]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handleSearchChange = (val) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val) => { setStatusFilter(val); setCurrentPage(1); };
  const handleKelasChange = (val) => { setFilterKelas(val); setCurrentPage(1); };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Pendaftaran"
        subtitle={`${candidates.length} total calon peserta terdaftar`}
      >
        <div className={styles.headerActions}>
          <button
            onClick={handleToggleSession}
            disabled={savingSession}
            className={`btn ${isSessionOpen ? 'btn-danger' : 'btn-primary'} btn-sm`}
          >
            {isSessionOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {isSessionOpen ? 'Tutup Sesi Pendaftaran' : 'Buka Sesi Pendaftaran'}
          </button>
        </div>
      </AdminHeader>

      <div className={styles.body}>
        {/* Banner Sesi */}
        <div className={`${styles.sessionBanner} ${isSessionOpen ? styles.openBanner : styles.closedBanner}`}>
          <div className={styles.bannerIcon}>
            <AlertCircle size={20} />
          </div>
          <div className={styles.bannerText}>
            <strong>Sesi Pendaftaran Saat Ini: {isSessionOpen ? 'TERBUKA' : 'DITUTUP (ARSIP)'}</strong>
            <p>
              {isSessionOpen
                ? 'Calon peserta dapat melakukan pendaftaran baru melalui form publik. Penutupan sesi akan mengarsipkan data pendaftaran.'
                : `Pendaftaran ditutup pada ${sessionInfo?.closedAt ? new Date(sessionInfo.closedAt).toLocaleString() : ''}. Sebanyak ${sessionInfo?.migratedCount || 0} anggota dipindahkan ke Anggota PIK-R.`}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari nama atau NISN..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={!isSessionOpen && candidates.length === 0}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!isSessionOpen && candidates.length === 0}
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="LULUS">Lulus</option>
              <option value="TIDAK_LULUS">Tidak Lulus</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filterKelas}
              onChange={(e) => handleKelasChange(e.target.value)}
              disabled={!isSessionOpen && candidates.length === 0}
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className={styles.toolbarRight}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSendNotifications}
              disabled={notifying || (!isSessionOpen && candidates.length === 0)}
              title="Kirim notifikasi kelulusan masal"
            >
              <Bell size={15} />
              Kirim Notifikasi
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} disabled={candidates.length === 0} title="Export ke Excel">
              <FileSpreadsheet size={15} />
              Excel
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} disabled={candidates.length === 0} title="Export ke JSON">
              <FileJson size={15} />
              JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <SkeletonTable rows={6} cols={7} />
          ) : filteredCandidates.length === 0 ? (
            <div className={styles.empty}>Belum ada data pendaftar.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas & Sekolah</th>
                  <th>Status</th>
                  <th>Email / WA</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                    <td className={styles.tdNum}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td className={styles.tdMono}>{c.nisn}</td>
                    <td className={styles.tdName}>{c.name}</td>
                    <td>
                      <div>{c.className}</div>
                      <div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>{c.asalSekolah}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.notifStatus}>
                        <Mail
                          size={14}
                          className={c.emailNotified ? styles.iconOk : styles.iconNo}
                          title={c.emailNotified ? 'Email Terkirim' : 'Email Belum Terkirim'}
                        />
                        <span className={c.waNotified ? styles.iconOk : styles.iconNo}>WA</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditClick(c)}
                          title="Edit Biodata & Status"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteClick(c.id, c.name)}
                          title="Hapus Calon Peserta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredCandidates.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCandidates.length)} dari {filteredCandidates.length} pendaftar
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
              <h3>Edit Calon Peserta</h3>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Nama Lengkap</label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-class">Kelas</label>
                <input
                  id="edit-class"
                  type="text"
                  className="form-input"
                  value={editForm.className}
                  onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-asal">Asal Sekolah</label>
                <input
                  id="edit-asal"
                  type="text"
                  className="form-input"
                  value={editForm.asalSekolah}
                  onChange={(e) => setEditForm((f) => ({ ...f, asalSekolah: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-wa">No. WhatsApp</label>
                <input
                  id="edit-wa"
                  type="text"
                  className="form-input"
                  value={editForm.whatsappNumber}
                  onChange={(e) => setEditForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-status">Status Kelulusan</label>
                <select
                  id="edit-status"
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK_LULUS">TIDAK LULUS</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

