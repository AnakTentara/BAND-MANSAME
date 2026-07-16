import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import styles from './Modal.module.css';

/**
 * Global Confirm Modal — driven by uiStore
 */
export default function Modal() {
  const { confirmModal, closeConfirm } = useUIStore();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!confirmModal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeConfirm();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [confirmModal, closeConfirm]);

  if (!confirmModal) return null;

  const { title, message, onConfirm, danger } = confirmModal;

  const handleConfirm = () => {
    onConfirm?.();
    closeConfirm();
  };

  return (
    <div className={styles.overlay} onClick={closeConfirm} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={closeConfirm} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            className="btn btn-secondary"
            onClick={closeConfirm}
          >
            Batal
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {danger ? 'Ya, Lanjutkan' : 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
