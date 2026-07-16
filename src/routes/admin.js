import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  loginAdmin,
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  generatePasswords,
  exportJSON,
  exportExcel,
  triggerNotifications,
  getSettings,
  saveSettings,
  downloadBackupDb,
  // Session
  closeSession,
  openSession,
  promoteCandidateToMember,
  // Members
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  // Org
  getOrgMembers,
  createOrgMember,
  updateOrgMember,
  deleteOrgMember,
  // Testimonials
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  // Admin User Accounts
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  // File Manager
  getUploadedFiles,
  deleteUploadedFile,
  getDashboardStats,
} from '../controllers/admin.js';
import { authAdmin, requireRole } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Multer config for blog images
const blogImagesDir = path.join(__dirname, '../../public/uploads/blog');
if (!fs.existsSync(blogImagesDir)) {
  fs.mkdirSync(blogImagesDir, { recursive: true });
}

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `blog-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const uploadBlog = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Multer config for web logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/logos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});


const router = express.Router();

// Public Admin Login
router.post('/login', loginAdmin);

// Protected Admin Routes (Requires authAdmin)
router.get('/dashboard-stats', authAdmin, getDashboardStats);

// Candidates (DEVELOPER and KABINET_UMUM only)
router.get('/candidates', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), getCandidates);
router.post('/candidates', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), createCandidate);
router.get('/candidates/export-json', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), exportJSON);
router.get('/candidates/export-excel', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), exportExcel);
router.post('/candidates/generate-passwords', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), generatePasswords);
router.post('/candidates/send-notifications', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), triggerNotifications);

// Candidate CRUD by ID (DEVELOPER and KABINET_UMUM only)
router.get('/candidates/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), getCandidateById);
router.put('/candidates/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), updateCandidate);
router.delete('/candidates/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), deleteCandidate);
router.post('/candidates/:id/promote-to-member', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), promoteCandidateToMember);

// Settings Management (DEVELOPER only)
router.get('/settings', authAdmin, requireRole(['DEVELOPER']), getSettings);
router.put('/settings', authAdmin, requireRole(['DEVELOPER']), saveSettings);
router.get('/settings/backup-db', authAdmin, requireRole(['DEVELOPER']), downloadBackupDb);

// Admin User Accounts CRUD (DEVELOPER only)
router.get('/users', authAdmin, requireRole(['DEVELOPER']), getAdminUsers);
router.post('/users', authAdmin, requireRole(['DEVELOPER']), createAdminUser);
router.put('/users/:id', authAdmin, requireRole(['DEVELOPER']), updateAdminUser);
router.delete('/users/:id', authAdmin, requireRole(['DEVELOPER']), deleteAdminUser);

// File Manager (DEVELOPER and KABINET_UMUM only)
router.get('/files', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), getUploadedFiles);
router.delete('/files', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), deleteUploadedFile);

// Session Lifecycle (DEVELOPER and KABINET_UMUM only)
router.post('/session/close', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), closeSession);
router.post('/session/open', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), openSession);

// Member CRUD (MEDINFO can read, but only DEVELOPER and KABINET_UMUM can create/edit/delete)
router.get('/members', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']), getMembers);
router.post('/members', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), createMember);
router.put('/members/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), upload.single('photo'), updateMember);
router.delete('/members/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), deleteMember);

// Org Member CRUD (DEVELOPER and KABINET_UMUM only)
router.get('/org', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), getOrgMembers);
router.post('/org', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), upload.single('photo'), createOrgMember);
router.put('/org/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), upload.single('photo'), updateOrgMember);
router.delete('/org/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), deleteOrgMember);

// Testimonials CRUD (DEVELOPER and KABINET_UMUM only)
router.get('/testimonials', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), getTestimonials);
router.post('/testimonials', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), upload.single('photo'), createTestimonial);
router.put('/testimonials/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), upload.single('photo'), updateTestimonial);
router.delete('/testimonials/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), deleteTestimonial);

// Blog Image Upload Endpoint (All roles can write posts and upload images inside them)
router.post('/blog/upload-image', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']), uploadBlog.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file gambar yang diupload' });
  }
  const imageUrl = `/uploads/blog/${req.file.filename}`;
  return res.json({ imageUrl });
});

// Web Editor upload-logo endpoint (DEVELOPER and KABINET_UMUM only)
router.post('/web-editor/upload-logo', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM']), uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file logo yang diupload' });
  }
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  return res.json({ logoUrl });
});

export default router;
