import { create } from 'zustand';

/* ──────────────────────────────────────
   UI Store — global modal / confirm state
────────────────────────────────────── */
export const useUIStore = create((set) => ({
  // Confirm modal
  confirmModal: null, // { title, message, onConfirm, danger }

  openConfirm: ({ title, message, onConfirm, danger = false }) =>
    set({ confirmModal: { title, message, onConfirm, danger } }),

  closeConfirm: () => set({ confirmModal: null }),
}));
