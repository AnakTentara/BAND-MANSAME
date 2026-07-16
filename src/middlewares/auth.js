import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeypikrmanseku123';

export async function authAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      return res.status(401).json({ message: 'Akun admin tidak ditemukan' });
    }

    req.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Akses ditolak, tingkat kewenangan tidak mencukupi' });
    }
    next();
  };
}

export function authCandidate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'candidate') {
      return res.status(403).json({ message: 'Akses ditolak, hanya untuk anggota' });
    }
    req.candidate = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

export function authAny(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      req.admin = decoded;
    } else if (decoded.role === 'candidate') {
      req.candidate = decoded;
    }
    next();
  } catch (error) {
    next(); // continue as guest on invalid token
  }
}

export function authRequiredAny(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak, silakan login terlebih dahulu' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      req.admin = decoded;
      next();
    } else if (decoded.role === 'candidate') {
      req.candidate = decoded;
      next();
    } else {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}
