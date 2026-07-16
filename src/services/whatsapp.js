import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { findSimilarCandidates } from '../utils/similarity.js';

let sock = null;
let isConnected = false;

export function formatPhoneNumber(num) {
  let cleaned = num.replace(/\D/g, ''); // Keep only digits
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    return cleaned + '@s.whatsapp.net';
  }
  return cleaned;
}

export async function initWhatsApp() {
  const authFolder = path.join(process.cwd(), '.baileys_auth');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Menggunakan versi Baileys v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    printQRInTerminal: false, // We will custom print it using qrcode-terminal
    auth: state,
    logger: pino({ level: 'silent' }), // Turn off annoying logs
    browser: ['MANSAME Band Bot', 'Safari', '3.0.0'],
    defaultQueryTimeoutMs: undefined
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('=== SCAN QR CODE DI BAWAH INI UNTUK MENGHUBUNGKAN WHATSAPP ===');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi WhatsApp terputus. Penyebab: ', lastDisconnect?.error, 'Mencoba menghubungkan kembali:', shouldReconnect);
      
      if (shouldReconnect) {
        setTimeout(() => {
          initWhatsApp();
        }, 5000);
      } else {
        console.log('WhatsApp Bot Ter-logout. Hapus folder .baileys_auth untuk menscan ulang.');
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (e) {
          console.error('Gagal menghapus folder autentikasi:', e);
        }
        setTimeout(() => {
          initWhatsApp();
        }, 5000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      console.log('WhatsApp Bot MANSAME Band BERHASIL terhubung dan AKTIF!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Extract text from textMessage or extendedTextMessage
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || '';
                 
    if (text.startsWith('/cek ')) {
      const query = text.substring(5).trim();
      const fromJid = msg.key.remoteJid;

      if (!query) {
        await replyToMessage(fromJid, 'Format salah. Gunakan: */cek [Nama atau NISN]*\nContoh: `/cek Haikal Mabrur` atau `/cek 3102603365`', msg);
        return;
      }

      console.log(`WhatsApp Bot menerima request cek dari ${fromJid} untuk query: "${query}"`);
      
      // Determine if query is NISN (digits only)
      const isNisn = /^\d+$/.test(query);

      try {
        if (isNisn) {
          // 1. Search by NISN
          const candidate = await prisma.candidate.findUnique({
            where: { nisn: query }
          });

          if (candidate) {
            const replyText = `Halo *${candidate.name}*,\n\nHasil kelulusan pendaftaran MANSAME Band Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan NISN *${query}* tidak ditemukan di database.`, msg);
          }
        } else {
          // 2. Search by Name (Similarity)
          const allCandidates = await prisma.candidate.findMany({
            select: { id: true, name: true, nisn: true, className: true }
          });

          const matches = findSimilarCandidates(query, allCandidates);

          if (matches.length === 0) {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan nama *"${query}"* tidak ditemukan di database.`, msg);
          } else if (matches[0].exact || matches[0].score > 0.95) {
            const candidate = matches[0].candidate;
            const replyText = `Halo *${candidate.name}* (${candidate.className}),\n\nHasil kelulusan pendaftaran MANSAME Band Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            // Suggest similar matches
            let replyText = `Data pendaftar dengan nama *"${query}"* tidak ditemukan secara persis.\n\n*Mungkin yang kamu maksud:*\n`;
            
            // Limit to top 3 suggestions
            const suggestions = matches.slice(0, 3);
            suggestions.forEach((match, index) => {
              const c = match.candidate;
              replyText += `\n${index + 1}. *${c.name}* (Kelas ${c.className})\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${c.nisn}\n`;
            });
            
            replyText += `\nSilakan klik link di atas jika sesuai dengan nama Anda.`;
            await replyToMessage(fromJid, replyText, msg);
          }
        }
      } catch (err) {
        console.error('Error handling WhatsApp cek command:', err);
        await replyToMessage(fromJid, 'Terjadi kesalahan sistem saat mencari data.', msg);
      }
    }
  });
}

// Helper to reply to messages
async function replyToMessage(jid, text, msg) {
  if (!sock) return;
  try {
    await sock.sendMessage(jid, { text }, { quoted: msg });
  } catch (error) {
    console.error('Gagal mengirim pesan WhatsApp:', error);
  }
}

// Function to send normal WhatsApp message
export async function sendWhatsApp(to, text) {
  if (!sock || !isConnected) {
    console.warn(`[WhatsApp] Gagal mengirim pesan ke ${to} karena bot belum aktif/terkoneksi.`);
    return false;
  }

  try {
    const formattedJid = formatPhoneNumber(to);
    await sock.sendMessage(formattedJid, { text });
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Gagal mengirim pesan ke ${to}:`, error);
    return false;
  }
}

export function isWhatsAppReady() {
  return isConnected;
}
