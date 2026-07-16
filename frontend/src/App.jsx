import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ProtectedRoute from '@/components/common/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Public Pages
import LandingPage from '@/pages/public/LandingPage';
import RegisterPage from '@/pages/public/RegisterPage';
import CekKelulusanPage from '@/pages/public/CekKelulusanPage';
import BeritaPage from '@/pages/public/BeritaPage';
import BeritaPostPage from '@/pages/public/BeritaPostPage';
import ForumPage from '@/pages/public/ForumPage';
import ForumWritePage from '@/pages/public/ForumWritePage';
import ForumPostPage from '@/pages/public/ForumPostPage';
import CustomPage from '@/pages/public/CustomPage';
import NotFoundPage from '@/pages/public/NotFoundPage';

// Auth & Profil (Candidates)
import LoginPage from '@/pages/public/LoginPage';
import ProfilePage from '@/pages/public/ProfilePage';
import KamiPage from '@/pages/public/KamiPage';
import AnggotaPublikPage from '@/pages/public/AnggotaPublikPage';
import AlumniPage from '@/pages/public/AlumniPage';

// Admin Pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminPendaftaranPage from '@/pages/admin/AdminPendaftaranPage';
import AdminAnggotaPage from '@/pages/admin/AdminAnggotaPage';
import AdminBlogPage from '@/pages/admin/AdminBlogPage';
import AdminBlogEditorPage from '@/pages/admin/AdminBlogEditorPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminWebEditorPage from '@/pages/admin/AdminWebEditorPage';
import AdminOrgPage from '@/pages/admin/AdminOrgPage';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage';
import AdminFileManagerPage from '@/pages/admin/AdminFileManagerPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import { useAuthStore } from '@/stores/authStore';

// Admin Layout
import AdminLayout from '@/components/admin/AdminLayout';

/* Layout wrapper for public pages */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function RoleProtectedRoute({ allowedRoles, children }) {
  const { adminUser } = useAuthStore();
  const role = adminUser?.role || 'KABINET_UMUM';
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ── Public Routes (with Navbar + Footer) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/daftar" element={<RegisterPage />} />
          <Route path="/cek-kelulusan" element={<CekKelulusanPage />} />
          <Route path="/berita" element={<BeritaPage />} />
          <Route path="/berita/:slug" element={<BeritaPostPage />} />
          <Route path="/blog" element={<ForumPage />} />
          <Route
            path="/blog/tulis"
            element={
              <ProtectedRoute type="any">
                <ForumWritePage />
              </ProtectedRoute>
            }
          />
          <Route path="/blog/:slug" element={<ForumPostPage />} />
          <Route path="/p/:slug" element={<CustomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kami" element={<KamiPage />} />
          <Route path="/anggota" element={<AnggotaPublikPage />} />
          <Route path="/alumni" element={<AlumniPage />} />
          <Route
            path="/profil"
            element={
              <ProtectedRoute type="candidate">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ── Admin Login (standalone, no layout) ── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ── Admin Protected Routes (with Sidebar Layout) ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute type="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route 
            path="pendaftaran" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminPendaftaranPage />
              </RoleProtectedRoute>
            } 
          />
          <Route path="anggota" element={<AdminAnggotaPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="blog/new" element={<AdminBlogEditorPage />} />
          <Route path="blog/edit/:id" element={<AdminBlogEditorPage />} />
          <Route 
            path="web-editor" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminWebEditorPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="file-manager" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminFileManagerPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER']}>
                <AdminUsersPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER']}>
                <AdminSettingsPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="org" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminOrgPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="testimoni" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminTestimonialsPage />
              </RoleProtectedRoute>
            } 
          />
        </Route>

        {/* ── Fallback / Error Page ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

