import { useState, useEffect } from 'react';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Edit2, Trash2, X, User, Shield, Key, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminUsersPage.module.css';

const ROLES = [
  { value: 'DEVELOPER', label: 'Developer (Super Admin)' },
  { value: 'KABINET_UMUM', label: 'Kabinet Umum (Admin Operasional)' },
  { value: 'MEDINFO', label: 'Anggota MedInfo (Jurnalis/Read-only)' }
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('KABINET_UMUM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Gagal memuat daftar user admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setRole('KABINET_UMUM');
    setModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingId(user.id);
    setUsername(user.username);
    setPassword(''); // Leave password empty for update unless changing
    setRole(user.role);
    setModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (user.username === 'pikr-manseku') {
      toast.error('Akun Developer utama tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user admin "${user.username}"?`)) {
      return;
    }
    try {
      await deleteAdminUser(user.id);
      toast.success('User admin berhasil dihapus!');
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus user admin.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username harus diisi.');
      return;
    }
    if (!editingId && !password.trim()) {
      toast.error('Password harus diisi untuk user baru.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update
        const payload = { username, role };
        if (password.trim()) payload.password = password;
        await updateAdminUser(editingId, payload);
        toast.success('User admin berhasil diperbarui!');
      } else {
        // Create
        await createAdminUser({ username, password, role });
        toast.success('User admin baru berhasil dibuat!');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleLabel = (roleVal) => {
    const found = ROLES.find(r => r.value === roleVal);
    return found ? found.label : roleVal;
  };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Admin"
        subtitle="Kelola akun akses dashboard admin dan atur kewenangan masing-masing role"
      />

      <div className={styles.actionBar}>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Tambah Admin Baru
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 className="spinner" size={32} />
          <p>Memuat daftar pengguna...</p>
        </div>
      ) : users.length === 0 ? (
        <div className={styles.emptyContainer}>
          <User size={48} className={styles.emptyIcon} />
          <p>Belum ada user admin terdaftar.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Username</th>
                <th>Tingkat Otoritas (Role)</th>
                <th>Tanggal Dibuat</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id}>
                  <td>{idx + 1}</td>
                  <td className={styles.usernameCol}>
                    <User size={14} className={styles.usernameIcon} />
                    {user.username}
                    {user.username === 'pikr-manseku' && (
                      <span className={styles.masterBadge}>Master</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                      <Shield size={12} style={{ marginRight: 4 }} />
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button className="btn btn-ghost" onClick={() => handleOpenEditModal(user)} title="Edit User">
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost text-error"
                        onClick={() => handleDelete(user)}
                        disabled={user.username === 'pikr-manseku'}
                        title="Hapus User"
                      >
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

      {/* User Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setModalOpen(false)}>×</button>
            <h3 className={styles.modalTitle}>
              {editingId ? 'Edit Akun Admin' : 'Tambah Akun Admin Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="user-username">Username</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    id="user-username"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Masukkan username admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={editingId && username === 'pikr-manseku'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-password">
                  {editingId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <div className={styles.inputWrapper}>
                  <Key size={16} className={styles.inputIcon} />
                  <input
                    id="user-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder={editingId ? '••••••••' : 'Masukkan password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-role">Tingkat Kewenangan (Role)</label>
                <select
                  id="user-role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={editingId && username === 'pikr-manseku'}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting && <span className="spinner" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
