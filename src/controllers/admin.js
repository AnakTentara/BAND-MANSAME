import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma, { initDatabase, getDbProvider } from '../config/db.js';
import { sendBulkNotifications } from '../services/notification.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeypikrmanseku123';

function isMemberExpired(joinYear, className) {
  const cName = (className || '').trim().toUpperCase();
  let yearsToAdd = 3; // Default 3 years (Grade 10)

  if (cName.startsWith('XI-') || cName.startsWith('XI ') || cName === 'XI' || cName.startsWith('11')) {
    yearsToAdd = 2;
  } else if (cName.startsWith('XII-') || cName.startsWith('XII ') || cName === 'XII' || cName.startsWith('12')) {
    yearsToAdd = 1;
  } else if (cName.startsWith('X-') || cName.startsWith('X ') || cName === 'X' || cName.startsWith('10')) {
    yearsToAdd = 3;
  }

  const expirationDate = new Date(joinYear + yearsToAdd, 6, 25, 23, 59, 59);
  return new Date() > expirationDate;
}

// 1. Admin Login
export async function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin', adminRole: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role }
    });
  } catch (error) {
    console.error('Error admin login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}

// 2. Get All Candidates
export async function getCandidates(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(candidates);
  } catch (error) {
    console.error('Error get candidates:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pendaftar' });
  }
}

// 3. Get Candidate Detail
export async function getCandidateById(req, res) {
  const { id } = req.params;
  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return res.status(404).json({ message: 'Pendaftar tidak ditemukan' });
    }
    return res.json(candidate);
  } catch (error) {
    console.error('Error get candidate detail:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail pendaftar' });
  }
}

// 4. Create Candidate manually by Admin
export async function createCandidate(req, res) {
  const { nisn, name, className, whatsappNumber, email, gender, reason, status, asalSekolah } = req.body;

  if (!nisn || !name || !className || !whatsappNumber || !email || !gender || !asalSekolah) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
    const existing = await prisma.candidate.findUnique({ where: { nisn } });
    if (existing) {
      return res.status(400).json({ message: 'NISN sudah terdaftar' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        nisn,
        name,
        className,
        whatsappNumber,
        email,
        gender,
        asalSekolah,
        reason: reason || '',
        status: status || 'PENDING'
      }
    });

    return res.status(201).json({ message: 'Pendaftar berhasil ditambahkan', candidate });
  } catch (error) {
    console.error('Error create candidate:', error);
    return res.status(500).json({ message: 'Gagal menambahkan pendaftar' });
  }
}

// 5. Update Candidate
export async function updateCandidate(req, res) {
  const { id } = req.params;
  const { nisn, name, className, whatsappNumber, email, gender, reason, status, plainPassword, asalSekolah } = req.body;

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return res.status(404).json({ message: 'Pendaftar tidak ditemukan' });
    }

    if (nisn && nisn !== candidate.nisn) {
      const existing = await prisma.candidate.findUnique({ where: { nisn } });
      if (existing) {
        return res.status(400).json({ message: 'NISN sudah terdaftar oleh pengguna lain' });
      }
    }

    const updateData = {
      nisn: nisn ?? candidate.nisn,
      name: name ?? candidate.name,
      className: className ?? candidate.className,
      whatsappNumber: whatsappNumber ?? candidate.whatsappNumber,
      email: email ?? candidate.email,
      gender: gender ?? candidate.gender,
      asalSekolah: asalSekolah ?? candidate.asalSekolah,
      reason: reason ?? candidate.reason,
      status: status ?? candidate.status
    };

    if (plainPassword !== undefined) {
      updateData.plainPassword = plainPassword;
      if (plainPassword) {
        updateData.password = await bcrypt.hash(plainPassword, 10);
      } else {
        updateData.password = null;
      }
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: updateData
    });

    return res.json({ message: 'Biodata pendaftar berhasil diperbarui', candidate: updated });
  } catch (error) {
    console.error('Error update candidate:', error);
    return res.status(500).json({ message: 'Gagal memperbarui biodata pendaftar' });
  }
}

// 6. Delete Candidate
export async function deleteCandidate(req, res) {
  const { id } = req.params;
  try {
    await prisma.candidate.delete({ where: { id } });
    return res.json({ message: 'Pendaftar berhasil dihapus' });
  } catch (error) {
    console.error('Error delete candidate:', error);
    return res.status(500).json({ message: 'Gagal menghapus pendaftar' });
  }
}

// 7. Auto-Generate Passwords for candidates without password
export async function generatePasswords(req, res) {
  try {
    const candidatesWithoutPassword = await prisma.candidate.findMany({
      where: {
        OR: [
          { password: null },
          { password: '' }
        ]
      }
    });

    if (candidatesWithoutPassword.length === 0) {
      return res.json({ message: 'Semua pendaftar sudah memiliki password' });
    }

    let updatedCount = 0;
    for (const candidate of candidatesWithoutPassword) {
      // Generate a simple easy-to-read 6-digit number password (e.g. 294819)
      const simplePassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(simplePassword, 10);

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          password: hashedPassword,
          plainPassword: simplePassword
        }
      });
      updatedCount++;
    }

    return res.json({
      message: `Berhasil meng-generate password untuk ${updatedCount} pendaftar`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error generating passwords:', error);
    return res.status(500).json({ message: 'Gagal meng-generate password otomatis' });
  }
}

// 8. Export Candidate Accounts to JSON
export async function exportJSON(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      select: {
        nisn: true,
        name: true,
        className: true,
        plainPassword: true,
        status: true
      }
    });

    res.setHeader('Content-Disposition', 'attachment; filename=akun_pendaftar.json');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(candidates, null, 2));
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data akun ke JSON' });
  }
}

// 9. Export Candidates to Excel
export async function exportExcel(req, res) {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { className: 'asc' }
    });

    const data = candidates.map((c, index) => ({
      'No': index + 1,
      'NISN': c.nisn,
      'Nama': c.name,
      'Kelas': c.className,
      'Jenis Kelamin': c.gender,
      'No. WhatsApp': c.whatsappNumber,
      'Email': c.email,
      'Alasan Bergabung': c.reason,
      'Status Kelulusan': c.status,
      'Password Akun': c.plainPassword || '-',
      'Sudah Email': c.emailNotified ? 'Ya' : 'Belum',
      'Sudah WA': c.waNotified ? 'Ya' : 'Belum',
      'Tanggal Daftar': c.createdAt.toISOString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar PIK-R');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=rekap_pendaftar_pikr.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data ke Excel' });
  }
}

// 10. Send Notifications (Email + WhatsApp)
export async function triggerNotifications(req, res) {
  try {
    const result = await sendBulkNotifications();
    return res.json({
      message: 'Proses pengiriman notifikasi selesai',
      details: result
    });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    return res.status(500).json({ message: 'Gagal mengirimkan notifikasi' });
  }
}

// 11. Get Settings
export async function getSettings(req, res) {
  try {
    const allSettings = await prisma.setting.findMany();
    const mysqlSetting = allSettings.find(s => s.key === 'MYSQL_CONFIG');
    const smtpSetting = allSettings.find(s => s.key === 'SMTP_CONFIG');

    const mysql = mysqlSetting && mysqlSetting.value ? JSON.parse(mysqlSetting.value) : {
      host: '',
      port: 3306,
      username: '',
      password: '',
      database: ''
    };

    const smtp = smtpSetting && smtpSetting.value ? JSON.parse(smtpSetting.value) : {
      host: '',
      port: 587,
      username: '',
      password: '',
      from: ''
    };

    return res.json({
      provider: getDbProvider(),
      mysql,
      smtp,
      settings: allSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pengaturan' });
  }
}

// 12. Save Settings
export async function saveSettings(req, res) {
  const { mysql, smtp, key, value } = req.body;

  try {
    // 1. Generic key-value save
    if (key && value !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    // 2. MySQL config save
    if (mysql) {
      await prisma.setting.upsert({
        where: { key: 'MYSQL_CONFIG' },
        update: { value: JSON.stringify(mysql) },
        create: { key: 'MYSQL_CONFIG', value: JSON.stringify(mysql) }
      });
    }

    // 3. SMTP config save
    if (smtp) {
      await prisma.setting.upsert({
        where: { key: 'SMTP_CONFIG' },
        update: { value: JSON.stringify(smtp) },
        create: { key: 'SMTP_CONFIG', value: JSON.stringify(smtp) }
      });
    }

    // 4. Re-initialize database connection dynamically if MySQL changed
    let provider = getDbProvider();
    if (mysql) {
      const initResult = await initDatabase();
      provider = initResult.provider;
    }

    return res.json({
      message: 'Pengaturan berhasil disimpan',
      provider
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
}

// ─────────────────────────────────────────────────
// SESSION LIFECYCLE
// ─────────────────────────────────────────────────

// 13. Close Registration Session → migrate LULUS → Member, clear Candidates
export async function closeSession(req, res) {
  const currentYear = new Date().getFullYear();
  try {
    // 1. Fetch all LULUS candidates
    const lulusList = await prisma.candidate.findMany({
      where: { status: 'LULUS' }
    });

    // 2. Migrate to Member table (upsert by nisn)
    for (const c of lulusList) {
      let plainPassword = c.plainPassword;
      let password = c.password;

      // If the candidate does not have a generated password, create a random 6-digit one now
      if (!plainPassword || plainPassword === 'pikr2024') {
        plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
        password = await bcrypt.hash(plainPassword, 10);
      }

      await prisma.member.upsert({
        where: { nisn: c.nisn },
        update: {
          name: c.name,
          className: c.className,
          whatsappNumber: c.whatsappNumber,
          email: c.email,
          gender: c.gender,
          asalSekolah: c.asalSekolah,
          password,
          plainPassword,
          status: 'ACTIVE',
        },
        create: {
          nisn: c.nisn,
          name: c.name,
          className: c.className,
          whatsappNumber: c.whatsappNumber,
          email: c.email,
          gender: c.gender,
          asalSekolah: c.asalSekolah,
          password,
          plainPassword,
          status: 'ACTIVE',
          joinYear: currentYear,
          role: 'member',
        }
      });
    }

    // 3. Clear all Candidates (clean slate for next session)
    await prisma.candidate.deleteMany({});

    // 4. Mark session as closed
    await prisma.setting.upsert({
      where: { key: 'REGISTRATION_SESSION' },
      update: { value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) },
      create: { key: 'REGISTRATION_SESSION', value: JSON.stringify({ status: 'closed', closedAt: new Date().toISOString(), migratedCount: lulusList.length }) }
    });

    // 5. Auto-alumni check for all members based on grade and joinYear (except PEMBINA)
    const activeMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        NOT: { role: 'PEMBINA' }
      }
    });
    for (const m of activeMembers) {
      const jYear = m.joinYear || new Date(m.createdAt).getFullYear();
      if (isMemberExpired(jYear, m.className)) {
        await prisma.member.update({
          where: { id: m.id },
          data: { status: 'ALUMNI' }
        });
      }
    }

    return res.json({
      message: `Sesi berhasil ditutup. ${lulusList.length} calon anggota dipindahkan ke Member, ${lulusList.length - (await prisma.member.count({ where: { status: 'ACTIVE' } }))} anggota dijadikan alumni.`,
      migratedCount: lulusList.length
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({ message: 'Gagal menutup sesi pendaftaran' });
  }
}

// 14. Open New Registration Session
export async function openSession(req, res) {
  try {
    await prisma.setting.upsert({
      where: { key: 'REGISTRATION_SESSION' },
      update: { value: JSON.stringify({ status: 'open', openedAt: new Date().toISOString() }) },
      create: { key: 'REGISTRATION_SESSION', value: JSON.stringify({ status: 'open', openedAt: new Date().toISOString() }) }
    });

    return res.json({ message: 'Sesi pendaftaran baru berhasil dibuka.' });
  } catch (error) {
    console.error('Error opening session:', error);
    return res.status(500).json({ message: 'Gagal membuka sesi pendaftaran' });
  }
}

// ─────────────────────────────────────────────────
// MEMBER CRUD
// ─────────────────────────────────────────────────

// 15. Get All Members (with auto-alumni check)
export async function getMembers(req, res) {
  try {
    // Auto-update alumni status based on grade and joinYear (except PEMBINA)
    const activeMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        NOT: { role: 'PEMBINA' }
      }
    });
    for (const m of activeMembers) {
      const jYear = m.joinYear || new Date(m.createdAt).getFullYear();
      if (isMemberExpired(jYear, m.className)) {
        await prisma.member.update({
          where: { id: m.id },
          data: { status: 'ALUMNI' }
        });
      }
    }

    const { status } = req.query;
    const members = await prisma.member.findMany({
      where: status ? { status } : undefined,
      orderBy: { joinYear: 'desc' }
    });
    return res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ message: 'Gagal mengambil data anggota' });
  }
}

// 15.5 Create Member manually
export async function createMember(req, res) {
  const { nisn, name, className, whatsappNumber, email, gender, role, status, asalSekolah } = req.body;
  const currentYear = new Date().getFullYear();

  // For PEMBINA, className is optional (fallback to "-"). Also make asalSekolah optional with default "-"
  const resolvedClassName = (role === 'PEMBINA') ? (className || '-') : className;
  const resolvedAsalSekolah = asalSekolah || '-';

  if (!nisn || !name || !resolvedClassName || !whatsappNumber || !email || !gender) {
    return res.status(400).json({ message: 'Semua field keanggotaan wajib diisi' });
  }

  try {
    // Check if duplicate NISN
    const existing = await prisma.member.findUnique({ where: { nisn } });
    if (existing) {
      return res.status(400).json({ message: 'NISN sudah terdaftar sebagai anggota tetap' });
    }

    // Generate random 6-digit password
    const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const member = await prisma.member.create({
      data: {
        nisn,
        name,
        className: resolvedClassName,
        whatsappNumber,
        email,
        gender,
        asalSekolah: resolvedAsalSekolah,
        password: hashedPassword,
        plainPassword,
        status: status || 'ACTIVE',
        joinYear: currentYear,
        role: role || 'member'
      }
    });

    // If role is a leadership role, automatically create an OrgMember entry
    if (role && role !== 'member') {
      // Unset previous active OrgMember with same role if it exists
      if (role !== 'KABINET') {
        await prisma.orgMember.updateMany({ where: { role, isCurrent: true }, data: { isCurrent: false } });
      }

      // Determine default specific position (jabatan)
      let jabatan = 'Pengurus';
      if (role === 'PEMBINA') jabatan = 'Pembina';
      else if (role === 'KETUA') jabatan = 'Ketua Umum';
      else if (role === 'WAKIL') jabatan = 'Wakil Ketua';

      await prisma.orgMember.create({
        data: {
          name,
          role,
          jabatan,
          yearStart: currentYear,
          isCurrent: true
        }
      });
    }

    return res.status(201).json({ message: 'Anggota berhasil ditambahkan secara manual', member });
  } catch (error) {
    console.error('Error creating member:', error);
    return res.status(500).json({ message: 'Gagal menambahkan anggota secara manual' });
  }
}

// 16. Update Member
export async function updateMember(req, res) {
  const { id } = req.params;
  const { name, className, whatsappNumber, email, gender, status, role, plainPassword, asalSekolah, joinYear } = req.body;
  try {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ message: 'Anggota tidak ditemukan' });

    const updateData = {
      name: name ?? member.name,
      className: className ?? member.className,
      whatsappNumber: whatsappNumber ?? member.whatsappNumber,
      email: email ?? member.email,
      gender: gender ?? member.gender,
      asalSekolah: asalSekolah ?? member.asalSekolah,
      status: status ?? member.status,
      role: role ?? member.role,
    };

    // Handle joinYear update
    if (joinYear !== undefined && joinYear !== '') {
      updateData.joinYear = parseInt(joinYear);
    }

    // Handle photo upload
    if (req.file) {
      updateData.photoPath = `/uploads/photos/${req.file.filename}`;
    }

    if (plainPassword) {
      updateData.plainPassword = plainPassword;
      updateData.password = await bcrypt.hash(plainPassword, 10);
    }

    const updated = await prisma.member.update({ where: { id }, data: updateData });
    return res.json({ message: 'Data anggota berhasil diperbarui', member: updated });
  } catch (error) {
    console.error('Error updating member:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data anggota' });
  }
}

// 17. Delete Member
export async function deleteMember(req, res) {
  const { id } = req.params;
  try {
    await prisma.member.delete({ where: { id } });
    return res.json({ message: 'Anggota berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return res.status(500).json({ message: 'Gagal menghapus anggota' });
  }
}

// ─────────────────────────────────────────────────
// ORG MEMBER CRUD
// ─────────────────────────────────────────────────

// 18. Get Org Members (includes linked Member data)
export async function getOrgMembers(req, res) {
  try {
    const members = await prisma.orgMember.findMany({
      orderBy: [{ yearStart: 'desc' }, { role: 'asc' }],
      include: {
        member: {
          select: { id: true, name: true, photoPath: true, className: true, status: true, role: true, nisn: true }
        }
      }
    });
    // Normalize: if linked member has a photo, use it as the effective photo
    const normalized = members.map((m) => ({
      ...m,
      effectivePhoto: (m.member?.photoPath) || m.photoPath || null,
    }));
    return res.json(normalized);
  } catch (error) {
    console.error('Error fetching org members:', error);
    return res.status(500).json({ message: 'Gagal mengambil data struktur organisasi' });
  }
}

// 19. Create Org Member
export async function createOrgMember(req, res) {
  const { name, role, jabatan, yearStart, yearEnd, isCurrent, quote, memberId } = req.body;
  const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;
  
  let finalName = name;
  let memberRecord = null;
  try {
    if (memberId) {
      memberRecord = await prisma.member.findUnique({ where: { id: memberId } });
      if (memberRecord) {
        finalName = memberRecord.name;
      }
    }

    if (!finalName || !role || !jabatan || !yearStart) {
      return res.status(400).json({ message: 'Nama/Anggota, role, jabatan, dan tahun mulai wajib diisi' });
    }

    // Determine finalIsCurrent automatically based on yearEnd and current year
    const currentYear = new Date().getFullYear();
    const parsedYearEnd = yearEnd ? parseInt(yearEnd) : null;
    let finalIsCurrent = isCurrent === 'true' || isCurrent === true;
    
    if (parsedYearEnd) {
      if (parsedYearEnd >= currentYear) {
        finalIsCurrent = true;
      } else {
        finalIsCurrent = false;
      }
    }

    const org = await prisma.orgMember.create({
      data: {
        name: finalName, role, jabatan,
        yearStart: parseInt(yearStart),
        yearEnd: parsedYearEnd,
        isCurrent: finalIsCurrent,
        photoPath,       // stored only for orphan entries
        quote: quote || null,
        memberId: memberId || null,  // FK link to Member account
      }
    });

    // Sync member role if linked
    if (memberRecord) {
      await prisma.member.update({
        where: { id: memberId },
        data: { role }
      });
    }

    return res.status(201).json({ message: 'Anggota organisasi berhasil ditambahkan', org });
  } catch (error) {
    console.error('Error creating org member:', error);
    return res.status(500).json({ message: 'Gagal menambahkan anggota organisasi' });
  }
}

// 20. Update Org Member
export async function updateOrgMember(req, res) {
  const { id } = req.params;
  const { name, role, jabatan, yearStart, yearEnd, isCurrent, quote, memberId } = req.body;
  try {
    const existing = await prisma.orgMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Data tidak ditemukan' });

    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : existing.photoPath;

    // Determine finalIsCurrent automatically based on yearEnd and current year
    const currentYear = new Date().getFullYear();
    const parsedYearEnd = yearEnd !== undefined ? (yearEnd ? parseInt(yearEnd) : null) : existing.yearEnd;
    let finalIsCurrent = isCurrent !== undefined ? (isCurrent === 'true' || isCurrent === true) : existing.isCurrent;
    
    if (parsedYearEnd) {
      if (parsedYearEnd >= currentYear) {
        finalIsCurrent = true;
      } else {
        finalIsCurrent = false;
      }
    }

    // Resolve memberId: use sent value, fall back to existing
    let resolvedMemberId = existing.memberId;
    let memberRecord = null;
    if (memberId === '' || memberId === 'NONE') {
      resolvedMemberId = null; // explicitly unlink
    } else if (memberId && memberId !== 'MANUAL') {
      memberRecord = await prisma.member.findUnique({ where: { id: memberId } });
      if (memberRecord) {
        resolvedMemberId = memberId;
      }
    }

    const updated = await prisma.orgMember.update({
      where: { id },
      data: {
        name: (memberRecord ? memberRecord.name : name) ?? existing.name,
        role: role ?? existing.role,
        jabatan: jabatan ?? existing.jabatan,
        yearStart: yearStart ? parseInt(yearStart) : existing.yearStart,
        yearEnd: parsedYearEnd,
        isCurrent: finalIsCurrent,
        photoPath,
        quote: quote !== undefined ? quote : existing.quote,
        memberId: resolvedMemberId,
      }
    });

    // Sync member role if linked member has a changed role
    const effectiveRole = role ?? existing.role;
    if (memberRecord && effectiveRole !== memberRecord.role) {
      await prisma.member.update({
        where: { id: resolvedMemberId },
        data: { role: effectiveRole }
      });
    } else if (!memberRecord && role && role !== existing.role) {
      // Fallback: still try name-match if no FK (backward compat for old entries)
      const correspondingMember = await prisma.member.findFirst({
        where: { name: name ?? existing.name, status: 'ACTIVE' }
      });
      if (correspondingMember) {
        await prisma.member.update({
          where: { id: correspondingMember.id },
          data: { role }
        });
      }
    }

    return res.json({ message: 'Data organisasi berhasil diperbarui', org: updated });
  } catch (error) {
    console.error('Error updating org member:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data organisasi' });
  }
}

// 21. Delete Org Member
export async function deleteOrgMember(req, res) {
  const { id } = req.params;
  try {
    await prisma.orgMember.delete({ where: { id } });
    return res.json({ message: 'Data organisasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting org member:', error);
    return res.status(500).json({ message: 'Gagal menghapus data organisasi' });
  }
}

// ─────────────────────────────────────────────────
// ALUMNI TESTIMONIALS CRUD
// ─────────────────────────────────────────────────

// 22. Get Testimonials
export async function getTestimonials(req, res) {
  try {
    const testimonials = await prisma.alumniTestimonial.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return res.status(500).json({ message: 'Gagal mengambil data testimoni' });
  }
}

// 23. Create Testimonial
export async function createTestimonial(req, res) {
  const { name, angkatan, content } = req.body;
  const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;
  if (!name || !content) return res.status(400).json({ message: 'Nama dan isi testimoni wajib diisi' });
  try {
    const t = await prisma.alumniTestimonial.create({
      data: { name, angkatan: angkatan || '', photoPath, content }
    });
    return res.status(201).json({ message: 'Testimoni berhasil ditambahkan', testimonial: t });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return res.status(500).json({ message: 'Gagal menambahkan testimoni' });
  }
}

// 24. Update Testimonial
export async function updateTestimonial(req, res) {
  const { id } = req.params;
  const { name, angkatan, content } = req.body;
  try {
    const existing = await prisma.alumniTestimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Testimoni tidak ditemukan' });
    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : existing.photoPath;
    const updated = await prisma.alumniTestimonial.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        angkatan: angkatan ?? existing.angkatan,
        photoPath,
        content: content ?? existing.content,
      }
    });
    return res.json({ message: 'Testimoni berhasil diperbarui', testimonial: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return res.status(500).json({ message: 'Gagal memperbarui testimoni' });
  }
}

// 25. Delete Testimonial
export async function deleteTestimonial(req, res) {
  const { id } = req.params;
  try {
    await prisma.alumniTestimonial.delete({ where: { id } });
    return res.json({ message: 'Testimoni berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return res.status(500).json({ message: 'Gagal menghapus testimoni' });
  }
}

// 26. Admin Users CRUD
export async function getAdminUsers(req, res) {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ users: admins });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar admin' });
  }
}

export async function createAdminUser(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, dan role wajib diisi' });
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        role
      }
    });

    return res.status(201).json({
      message: 'User admin berhasil dibuat',
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({ message: 'Gagal membuat user admin' });
  }
}

export async function updateAdminUser(req, res) {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User admin tidak ditemukan' });
    }

    if (username && username !== existing.username) {
      const taken = await prisma.admin.findUnique({ where: { username } });
      if (taken) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
    }

    const data = {
      username: username ?? existing.username,
      role: role ?? existing.role
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.admin.update({
      where: { id },
      data
    });

    return res.json({
      message: 'User admin berhasil diperbarui',
      user: { id: updated.id, username: updated.username, role: updated.role }
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return res.status(500).json({ message: 'Gagal memperbarui user admin' });
  }
}

export async function deleteAdminUser(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User admin tidak ditemukan' });
    }

    if (existing.username === 'pikr-manseku') {
      return res.status(400).json({ message: 'Akun developer utama tidak dapat dihapus' });
    }

    if (req.admin.id === id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    // Reassign any posts authored by this admin to the master developer admin
    const masterDev = await prisma.admin.findUnique({ where: { username: 'pikr-manseku' } });
    if (masterDev) {
      await prisma.post.updateMany({
        where: { authorId: id },
        data: { authorId: masterDev.id }
      });
    }

    await prisma.admin.delete({ where: { id } });
    return res.json({ message: 'User admin berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return res.status(500).json({ message: 'Gagal menghapus user admin' });
  }
}

// 27. File Manager
export async function getUploadedFiles(req, res) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, '../../public/uploads');

    const subdirs = ['photos', 'blog', 'logos'];
    let allFiles = [];

    subdirs.forEach(subdir => {
      const dirPath = path.join(uploadsDir, subdir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            allFiles.push({
              name: file,
              path: `/uploads/${subdir}/${file}`,
              size: stat.size,
              createdAt: stat.birthtime,
              category: subdir
            });
          }
        });
      }
    });

    allFiles.sort((a, b) => b.createdAt - a.createdAt);
    return res.json({ files: allFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar file' });
  }
}

export async function deleteUploadedFile(req, res) {
  const { filePath } = req.body;
  if (!filePath || !filePath.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'Path file tidak valid' });
  }

  try {
    // 1. Check if used in Web Editor settings
    const webSetting = await prisma.setting.findUnique({ where: { key: 'WEB_EDITOR_CONFIG' } });
    if (webSetting && webSetting.value) {
      try {
        const config = JSON.parse(webSetting.value);
        if (config.hero?.webLogoUrl === filePath || config.hero?.navbarLogoUrl === filePath) {
          return res.status(400).json({ 
            message: 'File ini sedang digunakan sebagai Logo Website atau Logo Navbar. Harap ganti logo terlebih dahulu di Web Editor sebelum menghapusnya.' 
          });
        }
      } catch (err) {
        console.error('Error parsing web config:', err);
      }
    }

    // 2. Check if used in Org Members
    const isUsedInOrg = await prisma.orgMember.findFirst({ where: { photoPath: filePath } });
    if (isUsedInOrg) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto pengurus: ${isUsedInOrg.name}.` 
      });
    }

    // 3. Check if used in Alumni Testimonials
    const isUsedInTestimonial = await prisma.alumniTestimonial.findFirst({ where: { photoPath: filePath } });
    if (isUsedInTestimonial) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto testimoni: ${isUsedInTestimonial.name}.` 
      });
    }

    // 4. Check if used in Members
    const isUsedInMember = await prisma.member.findFirst({ where: { photoPath: filePath } });
    if (isUsedInMember) {
      return res.status(400).json({ 
        message: `File ini sedang digunakan sebagai foto profil anggota aktif: ${isUsedInMember.name}.` 
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const absolutePath = path.join(__dirname, '../../public', filePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return res.json({ message: 'File berhasil dihapus' });
    } else {
      return res.status(404).json({ message: 'File tidak ditemukan di disk' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Gagal menghapus file' });
  }
}

export async function downloadBackupDb(req, res) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, '../../local.db');

    if (fs.existsSync(dbPath)) {
      return res.download(dbPath, 'pikr_manseku_backup.db');
    } else {
      return res.status(404).json({ message: 'Database SQLite local.db tidak ditemukan di root server.' });
    }
  } catch (error) {
    console.error('Error backing up database:', error);
    return res.status(500).json({ message: 'Gagal membuat cadangan database' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const totalCandidates = await prisma.candidate.count();
    const passedCandidates = await prisma.candidate.count({ where: { status: 'LULUS' } });
    const notPassedCandidates = await prisma.candidate.count({ where: { status: 'TIDAK_LULUS' } });
    const pendingCandidates = await prisma.candidate.count({ where: { status: 'PENDING' } });
    
    const totalMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const totalNews = await prisma.post.count();
    const totalBlogPosts = await prisma.blogPost.count({ where: { status: 'PUBLISHED' } });
    const pendingBlogDrafts = await prisma.blogPost.count({ where: { status: 'DRAFT' } });

    // Recent comments count (last 7 days)
    const recentBlogCommentsCount = await prisma.blogComment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return res.json({
      candidates: {
        total: totalCandidates,
        passed: passedCandidates,
        notPassed: notPassedCandidates,
        pending: pendingCandidates
      },
      members: {
        active: totalMembers
      },
      blog: {
        totalNews,
        totalBlogPosts,
        pendingBlogDrafts,
        recentComments: recentBlogCommentsCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Gagal mengambil statistik dashboard' });
  }
}

