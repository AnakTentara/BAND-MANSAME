import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * ProtectedRoute — wraps child routes that require auth
 * @prop {string} type - 'admin' | 'candidate'
 * @prop {ReactNode} children
 */
export default function ProtectedRoute({ type, children }) {
  const { isAdminAuthenticated, isCandidateAuthenticated } = useAuthStore();

  if (type === 'admin' && !isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (type === 'candidate' && !isCandidateAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (type === 'any' && !isAdminAuthenticated && !isCandidateAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
