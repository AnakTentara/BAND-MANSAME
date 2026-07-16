const BASE_URL = 'http://localhost:25552';

async function runTests() {
  console.log('=== MEMULAI VERIFIKASI API BACKEND PIK-R MANSEKU ===\n');

  // Test 1: Health Check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log('✅ Test 1 (Health Check) Sukses:', data);
  } catch (error) {
    console.error('❌ Test 1 (Health Check) Gagal:', error.message);
  }

  // Test 2: Register Candidate
  const testCandidate = {
    nisn: '1234567890',
    name: 'Haikal Mabrur',
    className: 'XI IPA 1',
    whatsappNumber: '081234567890',
    email: 'haikal.mabrur@example.com',
    gender: 'Laki-laki',
    reason: 'Ingin berkontribusi aktif dalam konseling remaja di MAN 1 Muara Enim.'
  };

  try {
    const res = await fetch(`${BASE_URL}/api/candidates/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCandidate)
    });
    const data = await res.json();
    console.log('✅ Test 2 (Pendaftaran Pendaftar) Sukses:', data);
  } catch (error) {
    console.error('❌ Test 2 (Pendaftaran Pendaftar) Gagal:', error.message);
  }

  // Test 3: Check status via NISN
  try {
    const res = await fetch(`${BASE_URL}/api/candidates/check?nisn=1234567890`);
    const data = await res.json();
    console.log('✅ Test 3 (Cek Kelulusan via NISN) Sukses:', data);
  } catch (error) {
    console.error('❌ Test 3 (Cek Kelulusan via NISN) Gagal:', error.message);
  }

  // Test 4: Candidate Login (Should fail with password error first since passwords are not set yet)
  const loginData = {
    nisn: '1234567890',
    password: 'password123'
  };

  try {
    const res = await fetch(`${BASE_URL}/api/candidates/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    const data = await res.json();
    console.log('✅ Test 4 (Login Anggota - Expected Fail/Success):', res.status, data.message);
  } catch (error) {
    console.error('❌ Test 4 (Login Anggota) Gagal:', error.message);
  }

  console.log('\n=== VERIFIKASI SELESAI ===');
}

runTests();
