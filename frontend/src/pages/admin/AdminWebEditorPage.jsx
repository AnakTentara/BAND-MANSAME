import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/api/admin';
import { getUploadUrl } from '@/api/axios';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import styles from './AdminWebEditorPage.module.css';

const TABS = [
  { id: 'hero', label: 'Hero & Navbar' },
  { id: 'tentang-kami', label: 'Tentang Kami' },
  { id: 'visi-misi', label: 'Visi & Misi' },
  { id: 'custom-pages', label: 'Halaman Baru' },
];

export default function AdminWebEditorPage() {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    hero: {
      webTitle: 'MANSAME Band',
      webLogoUrl: '',
      navbarLogoUrl: '',
      heroDesc: 'Ekstrakurikuler Band Resmi MAN 1 Muara Enim — wadah menyalurkan minat, bakat musik, dan pengembangan kreativitas siswa.',
      navVisibility: {
        tentangKami: true,
        anggota: true,
        alumni: true,
        blog: true,
      }
    },
    tentangKami: {
      aboutText1: 'MANSAME Band adalah ekstrakurikuler musik resmi di bawah naungan MAN 1 Muara Enim, Kementerian Agama Republik Indonesia. Kami hadir sebagai wadah bagi siswa untuk mengembangkan minat, bakat, dan kemampuan seni musik secara profesional.',
      aboutText2: 'Melalui latihan rutin, aransemen lagu yang kreatif, dan berbagai penampilan panggung, MANSAME Band berkomitmen membina generasi muda yang berjiwa seni tinggi, kompak, dan berprestasi.',
      yearFounded: '2023',
      activeMembersType: 'Real',
      activeMembersFakeValue: '50+',
      activitiesCount: '5+ Band Group',
    },
    visiMisi: {
      visi: 'Menjadi ekstrakurikuler musik terkemuka yang melahirkan talenta musik berkarakter, kreatif, dan berprestasi di tingkat kabupaten maupun provinsi.',
      misi: 'Mengembangkan bakat musikalitas siswa MAN 1 Muara Enim secara terarah dan profesional.\nMenyelenggarakan latihan rutin dan aransemen karya orisinal.\nMembangun kekompakan, kerja sama tim, dan kepemimpinan melalui organisasi musik.\nBerpartisipasi aktif dalam kegiatan internal sekolah maupun festival eksternal.',
    },
    customPages: []
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      const settings = res.data.settings;
      const webEditorSetting = settings.find(s => s.key === 'WEB_EDITOR_CONFIG');
      
      if (webEditorSetting && webEditorSetting.value) {
        const parsed = JSON.parse(webEditorSetting.value);
        setConfig(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat pengaturan Web Editor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveSettings({ key: 'WEB_EDITOR_CONFIG', value: JSON.stringify(config) });
      toast.success('Pengaturan Web Editor berhasil disimpan');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan Web Editor');
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (field, value) => {
    setConfig(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateNavVisibility = (field, value) => {
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, navVisibility: { ...prev.hero.navVisibility, [field]: value } }
    }));
  };

  const updateTentangKami = (field, value) => {
    setConfig(prev => ({ ...prev, tentangKami: { ...prev.tentangKami, [field]: value } }));
  };

  const updateVisiMisi = (field, value) => {
    setConfig(prev => ({ ...prev, visiMisi: { ...prev.visiMisi, [field]: value } }));
  };

  const addCustomPage = () => {
    setConfig(prev => ({
      ...prev,
      customPages: [
        ...prev.customPages,
        { id: Date.now().toString(), title: 'Halaman Baru', slug: 'halaman-baru', html: '<h1>Halo Dunia</h1>' }
      ]
    }));
  };

  const updateCustomPage = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      customPages: prev.customPages.map(page => page.id === id ? { ...page, [field]: value } : page)
    }));
  };

  const deleteCustomPage = (id) => {
    setConfig(prev => ({
      ...prev,
      customPages: prev.customPages.filter(page => page.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Web Editor</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
          Simpan Perubahan
        </button>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.contentPanel}>
        {activeTab === 'hero' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Judul Website (Hero)</label>
              <input type="text" className={styles.input} value={config.hero?.webTitle || ''} onChange={e => updateHero('webTitle', e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Deskripsi Hero</label>
              <textarea className={styles.textarea} value={config.hero?.heroDesc || ''} onChange={e => updateHero('heroDesc', e.target.value)} />
            </div>
            
            <h3 className={styles.label} style={{ marginTop: '1rem', fontSize: '1rem' }}>Visibilitas Menu Navbar</h3>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={config.hero?.navVisibility?.tentangKami ?? true} onChange={e => updateNavVisibility('tentangKami', e.target.checked)} /> Tampilkan "Tentang Kami"
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={config.hero?.navVisibility?.anggota ?? true} onChange={e => updateNavVisibility('anggota', e.target.checked)} /> Tampilkan "Anggota"
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={config.hero?.navVisibility?.alumni ?? true} onChange={e => updateNavVisibility('alumni', e.target.checked)} /> Tampilkan "Alumni"
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={config.hero?.navVisibility?.blog ?? true} onChange={e => updateNavVisibility('blog', e.target.checked)} /> Tampilkan "Blog"
              </label>
            </div>
          </>
        )}

        {activeTab === 'tentang-kami' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Teks Tentang Kami (Paragraf 1)</label>
              <textarea className={styles.textarea} value={config.tentangKami?.aboutText1 || ''} onChange={e => updateTentangKami('aboutText1', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Teks Tentang Kami (Paragraf 2)</label>
              <textarea className={styles.textarea} value={config.tentangKami?.aboutText2 || ''} onChange={e => updateTentangKami('aboutText2', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tahun Berdiri</label>
              <input type="text" className={styles.input} value={config.tentangKami?.yearFounded || ''} onChange={e => updateTentangKami('yearFounded', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Mode Angka Anggota Aktif</label>
              <select className={styles.input} value={config.tentangKami?.activeMembersType || 'Real'} onChange={e => updateTentangKami('activeMembersType', e.target.value)}>
                <option value="Real">Real (Sesuai Database)</option>
                <option value="Fake">Fake (Manual Input)</option>
                <option value="Real+Fake">Real + Fake (Ditambah Manual)</option>
              </select>
            </div>
            {(config.tentangKami?.activeMembersType === 'Fake' || config.tentangKami?.activeMembersType === 'Real+Fake') && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Angka Tambahan / Manual (Cth: 50+)</label>
                <input type="text" className={styles.input} value={config.tentangKami?.activeMembersFakeValue || ''} onChange={e => updateTentangKami('activeMembersFakeValue', e.target.value)} />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Label Kegiatan (Cth: 10+ Program)</label>
              <input type="text" className={styles.input} value={config.tentangKami?.activitiesCount || ''} onChange={e => updateTentangKami('activitiesCount', e.target.value)} />
            </div>
          </>
        )}

        {activeTab === 'visi-misi' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Visi</label>
              <textarea className={styles.textarea} value={config.visiMisi?.visi || ''} onChange={e => updateVisiMisi('visi', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Misi (Pisahkan dengan baris baru / Enter)</label>
              <textarea className={styles.textarea} style={{ minHeight: '200px' }} value={config.visiMisi?.misi || ''} onChange={e => updateVisiMisi('misi', e.target.value)} />
            </div>
          </>
        )}

        {activeTab === 'custom-pages' && (
          <div className={styles.customPagesList}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={addCustomPage}>
                <Plus size={16} /> Tambah Halaman
              </button>
            </div>
            
            {!config.customPages || config.customPages.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Belum ada halaman custom.</p>
            ) : (
              config.customPages.map(page => (
                <div key={page.id} className={styles.customPageItem}>
                  <div className={styles.customPageHeader}>
                    <h4 className={styles.label}>Halaman: {page.title}</h4>
                    <button className={styles.btnDanger} onClick={() => deleteCustomPage(page.id)} title="Hapus Halaman">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Judul (Muncul di Navbar)</label>
                    <input type="text" className={styles.input} value={page.title} onChange={e => updateCustomPage(page.id, 'title', e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Slug / URL (Cth: kegiatan-baru)</label>
                    <input type="text" className={styles.input} value={page.slug} onChange={e => updateCustomPage(page.id, 'slug', e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Konten (HTML Bebas)</label>
                    <textarea className={styles.textarea} style={{ minHeight: '150px', fontFamily: 'monospace' }} value={page.html} onChange={e => updateCustomPage(page.id, 'html', e.target.value)} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
