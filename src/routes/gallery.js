import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';
import { authAdmin, requireRole } from '../middlewares/auth.js';
import { compressImageInPlace } from '../utils/imageCompressor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer: gallery photo upload
const galleryDir = path.join(__dirname, '../../public/uploads/gallery');
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, galleryDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — compressed server-side
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  }
});

// ── PUBLIC ──────────────────────────────────────────────

// GET /api/gallery — semua foto galeri publik
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category && category !== 'Semua' ? { category } : {};
    const photos = await prisma.galleryPhoto.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    return res.json(photos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil data galeri' });
  }
});

// GET /api/gallery/categories — daftar kategori unik
router.get('/categories', async (req, res) => {
  try {
    const rows = await prisma.galleryPhoto.findMany({
      select: { category: true },
      distinct: ['category']
    });
    const categories = ['Semua', ...rows.map(r => r.category)];
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil kategori' });
  }
});

// ── ADMIN ────────────────────────────────────────────────

// GET /api/gallery/admin — semua foto (admin)
router.get('/admin', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']), async (req, res) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    return res.json(photos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil data galeri' });
  }
});

// POST /api/gallery/admin — tambah foto baru
router.post('/admin', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']),
  uploadGallery.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File foto wajib diupload' });
      }
      const { title, description, category, isFeatured, sortOrder } = req.body;
      if (!title) return res.status(400).json({ message: 'Judul foto wajib diisi' });

      // Compress setelah upload
      await compressImageInPlace(req.file.path);

      const photoPath = `/uploads/gallery/${req.file.filename}`;
      const photo = await prisma.galleryPhoto.create({
        data: {
          title,
          description: description || null,
          photoPath,
          category: category || 'Umum',
          isFeatured: isFeatured === 'true',
          sortOrder: parseInt(sortOrder) || 0
        }
      });
      return res.status(201).json(photo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal menambah foto galeri' });
    }
  });

// PUT /api/gallery/admin/:id — update metadata foto
router.put('/admin/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']),
  uploadGallery.single('photo'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, isFeatured, sortOrder } = req.body;

      const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Foto tidak ditemukan' });

      let photoPath = existing.photoPath;
      if (req.file) {
        // Compress dulu sebelum simpan path
        await compressImageInPlace(req.file.path);
        // Hapus file lama
        const oldFile = path.join(__dirname, '../../public', existing.photoPath);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        photoPath = `/uploads/gallery/${req.file.filename}`;
      }

      const updated = await prisma.galleryPhoto.update({
        where: { id },
        data: {
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          photoPath,
          category: category || existing.category,
          isFeatured: isFeatured !== undefined ? isFeatured === 'true' : existing.isFeatured,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder
        }
      });
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal mengupdate foto galeri' });
    }
  });

// DELETE /api/gallery/admin/:id — hapus foto
router.delete('/admin/:id', authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Foto tidak ditemukan' });

    // Hapus file fisik
    const filePath = path.join(__dirname, '../../public', existing.photoPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.galleryPhoto.delete({ where: { id } });
    return res.json({ message: 'Foto berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal menghapus foto galeri' });
  }
});

export default router;
