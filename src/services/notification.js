import { sendEmail } from '../config/mail.js';
import prisma from '../config/db.js';
import { sendWhatsApp } from './whatsapp.js';

export async function sendBulkNotifications() {
  console.log('[Notification] Memulai proses pengiriman notifikasi massal...');

  // Get all candidates who have been set to LULUS or TIDAK_LULUS
  const candidates = await prisma.candidate.findMany({
    where: {
      status: {
        in: ['LULUS', 'TIDAK_LULUS']
      }
    }
  });

  // Filter in memory for robust status comparison
  const candidatesToNotify = candidates.filter(c => {
    const isFirstTime = !c.emailNotified || !c.waNotified;
    const isRevision = c.status !== c.lastStatus;
    return isFirstTime || isRevision;
  });

  console.log(`[Notification] Ditemukan ${candidatesToNotify.length} pendaftar yang membutuhkan notifikasi.`);

  let emailSentCount = 0;
  let waSentCount = 0;
  let failCount = 0;

  for (const candidate of candidatesToNotify) {
    const isRevision = candidate.status !== candidate.lastStatus && (candidate.emailNotified || candidate.waNotified);
    
    // 1. Formulate Messages
    let subject = 'Pengumuman Hasil Seleksi MANSAME Band';
    let emailHtml = '';
    let waText = '';

    if (isRevision) {
      subject = '[REVISI] Pengumuman Hasil Seleksi MANSAME Band';
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px;">
          <h2 style="color: #d93025;">REVISI PENGUMUMAN HASIL SELEKSI</h2>
          <p>Halo <strong>${candidate.name}</strong>,</p>
          <p>Kami ingin menginformasikan bahwa terdapat <strong>revisi/perubahan</strong> pada hasil seleksi pendaftaran calon anggota MANSAME Band milik Anda.</p>
          <p>Silakan periksa kembali hasil kelulusan terbaru Anda di website resmi kami melalui link di bawah ini:</p>
          <div style="margin: 20px 0;">
            <a href="https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}" 
               style="background-color: #8a2be2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
               Cek Hasil Kelulusan Terbaru
            </a>
          </div>
          <p>Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p><a href="https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}">https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Email ini dikirim secara otomatis oleh Sistem Kelulusan MANSAME Band. Mohon tidak membalas email ini.</p>
        </div>
      `;

      waText = `*⚠️ REVISI PENGUMUMAN SELEKSI MANSAME BAND*\n\nHalo *${candidate.name}*,\n\nKami menginformasikan bahwa terdapat *perubahan/revisi* pada hasil seleksi calon anggota MANSAME Band Anda.\n\nSilakan cek status kelulusan terbaru Anda dengan mengklik link berikut:\n🔗 https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nTerima kasih atas perhatiannya.`;
    } else {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px;">
          <h2 style="color: #8a2be2;">PENGUMUMAN SELEKSI MANSAME BAND</h2>
          <p>Halo <strong>${candidate.name}</strong>,</p>
          <p>Terima kasih telah mengikuti rangkaian seleksi pendaftaran calon anggota MANSAME Band.</p>
          <p>Saat ini, hasil seleksi kelulusan telah resmi diumumkan. Silakan cek status kelulusan Anda melalui tombol di bawah ini:</p>
          <div style="margin: 20px 0;">
            <a href="https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}" 
               style="background-color: #8a2be2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
               Lihat Hasil Kelulusan
            </a>
          </div>
          <p>Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p><a href="https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}">https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Email ini dikirim secara otomatis oleh Sistem Kelulusan MANSAME Band. Mohon tidak membalas email ini.</p>
        </div>
      `;

      waText = `*🔔 PENGUMUMAN HASIL SELEKSI MANSAME BAND*\n\nHalo *${candidate.name}*,\n\nHasil seleksi calon anggota MANSAME Band kini sudah resmi diumumkan!\n\nSilakan cek status kelulusan Anda dengan mengklik link berikut:\n🔗 https://mansame-band.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nSemoga sukses!`;
    }

    let emailSuccess = false;
    let waSuccess = false;

    // 2. Send Email using dynamic mail service
    try {
      await sendEmail({
        to: candidate.email,
        subject: subject,
        html: emailHtml,
      });
      emailSuccess = true;
      emailSentCount++;
    } catch (err) {
      console.error(`[Notification] Gagal mengirim email ke ${candidate.email}:`, err.message);
    }

    // 3. Send WhatsApp
    try {
      const waRes = await sendWhatsApp(candidate.whatsappNumber, waText);
      if (waRes) {
        waSuccess = true;
        waSentCount++;
      }
    } catch (err) {
      console.error(`[Notification] Gagal mengirim WhatsApp ke ${candidate.whatsappNumber}:`, err.message);
    }

    // 4. Update status in Database
    try {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          emailNotified: emailSuccess ? true : candidate.emailNotified,
          waNotified: waSuccess ? true : candidate.waNotified,
          lastStatus: candidate.status // sync lastStatus to reflect notified status
        }
      });
    } catch (dbErr) {
      console.error(`[Notification] Gagal mengupdate status notifikasi database untuk ${candidate.name}:`, dbErr.message);
    }

    if (!emailSuccess && !waSuccess) {
      failCount++;
    }
  }

  console.log(`[Notification] Selesai. Sukses Email: ${emailSentCount}, Sukses WA: ${waSentCount}, Gagal Total: ${failCount}`);
  
  return {
    processed: candidatesToNotify.length,
    emailSent: emailSentCount,
    waSent: waSentCount,
    failed: failCount
  };
}
