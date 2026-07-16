import express from 'express';
import prisma from '../config/db.js';

const router = express.Router();

// GET /api/public/members — Active members (for public page)
router.get('/members', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { joinYear: 'asc' },
      select: { id: true, name: true, className: true, gender: true, joinYear: true, role: true }
    });
    return res.json(members);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data anggota' });
  }
});

// GET /api/public/alumni — Alumni members
router.get('/alumni', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ALUMNI' },
      orderBy: { joinYear: 'desc' },
      select: { id: true, name: true, className: true, gender: true, joinYear: true }
    });
    return res.json(members);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data alumni' });
  }
});

// GET /api/public/org — Org structure (current + history)
router.get('/org', async (req, res) => {
  try {
    const org = await prisma.orgMember.findMany({
      orderBy: [{ yearStart: 'desc' }, { role: 'asc' }]
    });
    return res.json(org);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data struktur organisasi' });
  }
});

// GET /api/public/testimonials — Alumni testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.alumniTestimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(testimonials);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data testimoni' });
  }
});

export default router;
