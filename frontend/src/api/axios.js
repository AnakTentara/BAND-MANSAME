import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Request Interceptor: Attach JWT ── */
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_token');
    const candidateToken = localStorage.getItem('candidate_token');
    const isAdminPath = config.url.startsWith('/admin') || window.location.pathname.startsWith('/admin');
    const token = isAdminPath ? adminToken : (candidateToken || adminToken);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor: Handle 401 ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdmin = window.location.pathname.startsWith('/admin');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('candidate_token');
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}${cleanPath}`;
  }
  
  if (window.location.hostname === 'localhost') {
    return `http://localhost:25552${cleanPath}`;
  }
  
  const apiPath = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  return `${window.location.origin}${apiPath}`;
};

export default api;
