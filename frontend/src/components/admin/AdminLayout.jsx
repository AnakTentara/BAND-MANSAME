import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Modal from '@/components/common/Modal';
import styles from './AdminLayout.module.css';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Mobile top bar with hamburger */}
      <div className={styles.mobileTopBar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <span className={styles.mobileTitle}>MANSAME Band Admin</span>
      </div>

      {/* Overlay (closes sidebar on click) */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.visible : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Modal />
    </div>
  );
}
