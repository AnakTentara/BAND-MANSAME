import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleLikeBlogPost,
  approveBlogPost,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment
} from '../controllers/blogForum.js';
import { authAdmin, authAny, authRequiredAny } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage configuration for blog featured images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diperbolehkan'));
  }
});

const router = express.Router();

// Public forum endpoints
router.get('/posts', getBlogPosts);
router.get('/posts/:slug', getBlogPostBySlug);
router.post('/posts/:id/comments', authAny, createBlogComment); // optional auth to bind comment to candidate

// Protected forum endpoints (Login either as Member/Admin required)
router.post('/posts', authRequiredAny, upload.single('featuredImg'), createBlogPost);
router.put('/posts/:id', authRequiredAny, upload.single('featuredImg'), updateBlogPost);
router.delete('/posts/:id', authRequiredAny, deleteBlogPost);
router.post('/posts/:id/like', authAny, toggleLikeBlogPost); // supports guestId in req.body, otherwise candidate token
router.put('/comments/:id', authRequiredAny, updateBlogComment);
router.delete('/comments/:id', authRequiredAny, deleteBlogComment);

// Admin-only endpoints
router.put('/posts/:id/approve', authAdmin, approveBlogPost);

export default router;
