import { create } from 'zustand';

/* ──────────────────────────────────────
   Auth Store — manages both admin and
   candidate JWT tokens + user data
────────────────────────────────────── */
export const useAuthStore = create((set) => ({
  // Admin state
  adminToken: localStorage.getItem('admin_token') || null,
  adminUser: (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || 'null');
    } catch {
      return null;
    }
  })(),
  isAdminAuthenticated: !!localStorage.getItem('admin_token'),

  // Candidate state
  candidateToken: localStorage.getItem('candidate_token') || null,
  candidateUser: (() => {
    try {
      return JSON.parse(localStorage.getItem('candidate_user') || 'null');
    } catch {
      return null;
    }
  })(),
  isCandidateAuthenticated: !!localStorage.getItem('candidate_token'),

  // Admin actions
  setAdminToken: (token, user = null) => {
    localStorage.setItem('admin_token', token);
    if (user) {
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
    set({ 
      adminToken: token, 
      adminUser: user || JSON.parse(localStorage.getItem('admin_user') || 'null'),
      isAdminAuthenticated: true 
    });
  },

  logoutAdmin: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ adminToken: null, adminUser: null, isAdminAuthenticated: false });
  },

  // Candidate actions
  setCandidateAuth: (token, user) => {
    localStorage.setItem('candidate_token', token);
    localStorage.setItem('candidate_user', JSON.stringify(user));
    set({
      candidateToken: token,
      candidateUser: user,
      isCandidateAuthenticated: true,
    });
  },

  updateCandidateUser: (user) => {
    localStorage.setItem('candidate_user', JSON.stringify(user));
    set({ candidateUser: user });
  },

  logoutCandidate: () => {
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_user');
    set({
      candidateToken: null,
      candidateUser: null,
      isCandidateAuthenticated: false,
    });
  },
}));
