import nodemailer from 'nodemailer';
import prisma from './db.js';
import dotenv from 'dotenv';

dotenv.config();

export async function sendEmail({ to, subject, html }) {
  let smtpConfig = null;
  
  // Try to load SMTP config from dynamic database settings
  try {
    const smtpSetting = await prisma.setting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    if (smtpSetting && smtpSetting.value) {
      smtpConfig = JSON.parse(smtpSetting.value);
    }
  } catch (err) {
    console.warn('[Mail] Gagal membaca SMTP_CONFIG dari database:', err.message);
  }

  const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.mailgun.org';
  const port = parseInt(smtpConfig?.port || process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;
  const user = smtpConfig?.user || smtpConfig?.username || process.env.SMTP_USER;
  const pass = smtpConfig?.password || process.env.SMTP_PASS;
  const from = smtpConfig?.from || process.env.SMTP_FROM || 'kelulusan@pikr-manseku.my.id';

  if (!user || !pass) {
    console.warn('[Mail] Kredensial SMTP tidak lengkap. Email mungkin gagal terkirim.');
  }

  console.log(`[Mail] Mencoba mengirim email ke ${to} via SMTP ${host}:${port}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
