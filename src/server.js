import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma, { initDatabase } from './config/db.js';
import adminRoutes from './routes/admin.js';
import candidateRoutes from './routes/candidates.js';
import blogRoutes from './routes/blog.js';
import forumRoutes from './routes/forum.js';
import publicRoutes from './routes/public.js';
import galleryRoutes from './routes/gallery.js';
import { initWhatsApp } from './services/whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 25546;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:25545';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:25545', 'http://localhost:25546', 'https://mansame-band.my.id'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads/photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/gallery', galleryRoutes);

// Serve static files from frontend build
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SEO: Robots.txt
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://mansame-band.my.id/sitemap.xml`);
});

// SEO: Dynamic Sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = 'https://mansame-band.my.id';
  const staticPages = [
    '',
    '/kami',
    '/daftar',
    '/cek-kelulusan',
    '/berita',
    '/blog'
  ];
  
  try {
    const posts = await prisma.post.findMany({
      select: { slug: true, updatedAt: true }
    });
    
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true }
    });
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    posts.forEach(post => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/berita/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    blogPosts.forEach(post => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += `</urlset>`;
    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MANSAME Band API is running smoothly' });
});

// Helper function to seed default admin
async function seedDefaultAdmin() {
  try {
    const defaultUsername = 'band-mansame';
    const defaultPassword = 'bandmansame2026==';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Clean up old temporary 'admin' and 'pikrmanseku01' accounts if they exist
    try {
      const oldAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
      if (oldAdmin) {
        await prisma.admin.delete({ where: { username: 'admin' } });
        console.log('Removed temporary admin account.');
      }
      const oldDev = await prisma.admin.findUnique({ where: { username: 'pikr-manseku' } });
      if (oldDev) {
        await prisma.admin.delete({ where: { username: 'pikr-manseku' } });
        console.log('Removed old developer account pikr-manseku.');
      }
    } catch (e) {
      // Ignore errors (e.g. table not ready yet)
    }

    // Upsert new default admin credentials
    await prisma.admin.upsert({
      where: { username: defaultUsername },
      update: { role: 'DEVELOPER' },
      create: {
        username: defaultUsername,
        password: hashedPassword,
        role: 'DEVELOPER'
      }
    });

    console.log('==================================================');
    console.log('Seed Akun Admin Berhasil:');
    console.log(`Username: ${defaultUsername}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('==================================================');
  } catch (error) {
    console.error('Gagal menjalankan seeding admin default:', error);
  }
}

// Seed dummy org structure if empty
async function seedDummyOrgData() {
  try {
    const count = await prisma.orgMember.count();
    if (count > 0) return; // Already seeded

    const YEAR = new Date().getFullYear();
    const dummies = [
      { name: 'Drs. Ahmad Fauzi, M.Pd', role: 'PEMBINA', jabatan: 'Pembina', yearStart: YEAR, isCurrent: true, quote: 'Musik adalah bahasa universal jiwa. Bersama MANSAME Band, mari kita salurkan kreativitas, asa, dan karya terbaik melalui alunan nada!' },
      { name: 'Siti Rahmawati', role: 'KETUA', jabatan: 'Ketua', yearStart: YEAR, isCurrent: true, quote: 'Di MANSAME Band, kita tidak hanya bermain alat musik, kita menciptakan harmoni dan kekeluargaan yang tak terlupakan.' },
      { name: 'Muhammad Rizki', role: 'WAKIL', jabatan: 'Wakil Ketua', yearStart: YEAR, isCurrent: true, quote: 'Mari kembangkan bakat musikmu, temukan suaramu, dan bersinarlah di atas panggung bersama kami!' },
      { name: 'Nurul Hidayah', role: 'KABINET', jabatan: 'Sekretaris', yearStart: YEAR, isCurrent: true },
      { name: 'Fajar Maulana', role: 'KABINET', jabatan: 'Bendahara', yearStart: YEAR, isCurrent: true },
      { name: 'Aisyah Putri', role: 'KABINET', jabatan: 'Koordinator Vocalis', yearStart: YEAR, isCurrent: true },
      { name: 'Dini Permata', role: 'KABINET', jabatan: 'Koordinator Gitarist', yearStart: YEAR, isCurrent: true },
      { name: 'Budi Santoso', role: 'KABINET', jabatan: 'Koordinator Drummer', yearStart: YEAR, isCurrent: true },
      { name: 'Reza Firmansyah', role: 'KABINET', jabatan: 'Koordinator Bassist', yearStart: YEAR, isCurrent: true },
      { name: 'Anisa Rahma', role: 'KABINET', jabatan: 'Koordinator Keyboardist', yearStart: YEAR, isCurrent: true },
    ];

    for (const d of dummies) {
      await prisma.orgMember.create({ data: { ...d, yearEnd: null, photoPath: null, quote: d.quote || null } });
    }

    // Seed dummy testimonials
    const tCount = await prisma.alumniTestimonial.count();
    if (tCount === 0) {
      const testimonials = [
        { name: 'Rania Safitri', angkatan: '2023', content: 'Bergabung dengan MANSAME Band membuat masa sekolah saya luar biasa indah! Saya belajar banyak tentang aransemen lagu, kerja sama tim, dan pertunjukan panggung.', photoPath: null },
        { name: 'Hendra Pratama', angkatan: '2023', content: 'Dari yang awalnya tidak bisa bermain bass, di MANSAME Band saya diajarkan dari nol oleh teman-teman hingga akhirnya kami bisa tampil di berbagai festival sekolah!', photoPath: null },
        { name: 'Dinda Maharani', angkatan: '2024', content: 'Suasana latihan di studio MANSAME Band sangat seru, suportif, dan penuh tawa. Sangat direkomendasikan untuk seluruh siswa MANSAME yang hobi bermusik!', photoPath: null },
      ];
      for (const t of testimonials) {
        await prisma.alumniTestimonial.create({ data: t });
      }
    }

    console.log('[Seed] Data dummy organisasi & testimoni berhasil ditambahkan.');
  } catch (error) {
    console.error('[Seed] Gagal menambahkan data dummy organisasi:', error.message);
  }
}

// Wildcard fallback for React routing (SPA)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  // Initialize Database before queries run
  await initDatabase();

  console.log(`[Server] MANSAME Band Backend berjalan di port ${PORT}`);
  console.log(`[Server] Mengizinkan CORS dari origin: ${FRONTEND_URL}`);
  
  // Seed admin if necessary
  await seedDefaultAdmin();

  // Seed dummy org data if empty
  await seedDummyOrgData();
  
  // Initialize WhatsApp Bot service in the background
  try {
    console.log('[Server] Menghubungkan ke WhatsApp Web...');
    await initWhatsApp();
  } catch (error) {
    console.error('[Server] Gagal menginisialisasi WhatsApp Bot:', error);
  }
});
