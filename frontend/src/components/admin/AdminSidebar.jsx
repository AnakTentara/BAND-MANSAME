import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  ClipboardList, 
  Users, 
  Network, 
  MessageSquare, 
  X, 
  FolderOpen, 
  Shield,
  Images
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar({ isOpen = false, onClose }) {
  const { adminUser, logoutAdmin } = useAuthStore();
  const navigate = useNavigate();

  const role = adminUser?.role || 'KABINET_UMUM';

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, allowedRoles: ['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'] },
    { to: '/admin/pendaftaran', label: 'Pendaftaran', icon: ClipboardList, allowedRoles: ['DEVELOPER', 'KABINET_UMUM'] },
    { to: '/admin/anggota', label: 'Anggota Band', icon: Users, allowedRoles: ['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'] },
    { to: '/admin/org', label: 'Struktur Org', icon: Network, allowedRoles: ['DEVELOPER', 'KABINET_UMUM'] },
    { to: '/admin/testimoni', label: 'Testimoni Alumni', icon: MessageSquare, allowedRoles: ['DEVELOPER', 'KABINET_UMUM'] },
    { to: '/admin/gallery', label: 'Galeri Foto', icon: Images, allowedRoles: ['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'] },
    { to: '/admin/blog', label: 'Blog', icon: FileText, allowedRoles: ['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'] },
    { to: '/admin/web-editor', label: 'Web Editor', icon: LayoutDashboard, allowedRoles: ['DEVELOPER', 'KABINET_UMUM'] },
    { to: '/admin/file-manager', label: 'File Manager', icon: FolderOpen, allowedRoles: ['DEVELOPER', 'KABINET_UMUM'] },
    { to: '/admin/users', label: 'Manajemen Admin', icon: Shield, allowedRoles: ['DEVELOPER'] },
    { to: '/admin/settings', label: 'Pengaturan', icon: Settings, allowedRoles: ['DEVELOPER'] },
  ].filter(item => item.allowedRoles.includes(role));

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const getRoleBadgeLabel = (roleVal) => {
    switch (roleVal) {
      case 'DEVELOPER': return 'Developer';
      case 'KABINET_UMUM': return 'Kabinet Umum';
      case 'MEDINFO': return 'MedInfo';
      default: return roleVal;
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Logo + Mobile Close Button */}
      <div className={styles.logoArea}>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>MANSAME Band</span>
          <span className={styles.logoSub}>Admin Panel</span>
        </div>

        {/* Close button — visible only on mobile */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>
            {adminUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <span className={styles.adminName}>{adminUser?.username || 'Admin'}</span>
            <span className={styles.adminRole} style={{ fontSize: '0.7rem', display: 'block', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {getRoleBadgeLabel(role)}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Keluar">
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
