import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  registerCandidate,
  checkStatus,
  loginCandidate,
  getProfile,
  updateProfile
} from '../controllers/candidates.js';
import { authCandidate } from '../middlewares/auth.js';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for candidate/member photo uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const router = express.Router();

// Public Settings for Landing page & registration status
router.get('/settings/public', async (req, res) => {
  try {
    const sessionSetting = await prisma.setting.findUnique({ where: { key: 'REGISTRATION_SESSION' } });
    const landingSetting = await prisma.setting.findUnique({ where: { key: 'LANDING_PAGE_CONTENT' } });
    const webEditorSetting = await prisma.setting.findUnique({ where: { key: 'WEB_EDITOR_CONFIG' } });

    return res.json({
      registrationSession: sessionSetting ? JSON.parse(sessionSetting.value) : { status: 'open' },
      landingPageContent: landingSetting ? JSON.parse(landingSetting.value) : null,
      webEditorConfig: webEditorSetting ? JSON.parse(webEditorSetting.value) : null
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(500).json({ message: 'Gagal memuat pengaturan publik' });
  }
});

// Public Candidate Routes
router.post('/register', registerCandidate);
router.get('/check', checkStatus);
router.post('/login', loginCandidate);

// Protected Candidate Routes
router.get('/me', authCandidate, getProfile);
router.put('/me', authCandidate, upload.single('photo'), updateProfile);

export default router;
