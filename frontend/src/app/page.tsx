'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  MapPin,
  ArrowRight,
  HelpCircle,
  Clock,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface FormItem {
  id: string;
  slug: string;
  title: string;
  opd: string;
  category: string;
  description: string;
  deadline: string;
  totalResponses: number;
  requiresNik: boolean;
  isPopular?: boolean;
}

const SAMPLE_FORMS: FormItem[] = [
  {
    id: 'f1',
    slug: 'bansos-umkm-purbalingga-2026',
    title: 'Pendataan Pelaku Usaha Mikro (UMKM) 2026',
    opd: 'Dinas Koperasi dan UKM',
    category: 'Usaha & UMKM',
    description: 'Inventarisasi data pelaku usaha mikro untuk verifikasi penerima bantuan permodalan dan fasilitas pembinaan legalitas.',
    deadline: '30 Oktober 2026',
    totalResponses: 1420,
    requiresNik: true,
    isPopular: true,
  },
  {
    id: 'f2',
    slug: 'survei-kepuasan-masyarakat-diskominfo',
    title: 'Survei Kepuasan Masyarakat (SKM) Pelayanan Diskominfo',
    opd: 'Dinas Komunikasi dan Informatika',
    category: 'Survei & Evaluasi',
    description: 'Penilaian indeks kepuasan masyarakat atas kecepatan, transparansi, dan kemudahan fasilitas jaringan internet serta publikasi.',
    deadline: 'Terbuka Selalu',
    totalResponses: 854,
    requiresNik: false,
    isPopular: true,
  },
  {
    id: 'f3',
    slug: 'permohonan-layanan-kependudukan',
    title: 'Permohonan Penerbitan Surat Kependudukan Daring',
    opd: 'Dinas Kependudukan dan Pencatatan Sipil',
    category: 'Kependudukan',
    description: 'Pengajuan layanan administrasi kependudukan cepat tanpa antrean untuk warga di 18 Kecamatan Kabupaten Purbalingga.',
    deadline: 'Terbuka Selalu',
    totalResponses: 2310,
    requiresNik: true,
    isPopular: false,
  },
  {
    id: 'f4',
    slug: 'pelatihan-kerja-blk-purbalingga',
    title: 'Pendaftaran Peserta Pelatihan Kerja BLK Batch IV',
    opd: 'Dinas Tenaga Kerja',
    category: 'Ketenagakerjaan',
    description: 'Program pelatihan kejuruan teknik otomotif, tata boga, garmen, dan teknologi informasi gratis bersertifikasi BNSP.',
    deadline: '15 November 2026',
    totalResponses: 620,
    requiresNik: true,
    isPopular: false,
  },
  {
    id: 'f5',
    slug: 'bantuan-kesejahteraan-sosial-lansia',
    title: 'Verifikasi Calon Penerima Bantuan Sosial Lansia Terlantar',
    opd: 'Dinas Sosial',
    category: 'Bansos & Sosial',
    description: 'Pengusulan dan pemutakhiran data terpadu warga lanjut usia tidak mampu oleh aparatur desa dan pendamping sosial.',
    deadline: '20 November 2026',
    totalResponses: 412,
    requiresNik: true,
    isPopular: false,
  },
  {
    id: 'f6',
    slug: 'evaluasi-pelayanan-kesehatan-puskesmas',
    title: 'Evaluasi Mutu Pelayanan Kesehatan Puskesmas',
    opd: 'Dinas Kesehatan',
    category: 'Kesehatan',
    description: 'Kuesioner evaluasi ketersediaan obat, keramahan tenaga medis, dan sarana prasarana puskesmas se-Kabupaten Purbalingga.',
    deadline: 'Terbuka Selalu',
    totalResponses: 980,
    requiresNik: false,
    isPopular: false,
  },
];

const CATEGORIES = [
  'Semua Kategori',
  'Usaha & UMKM',
  'Kependudukan',
  'Bansos & Sosial',
  'Kesehatan',
  'Ketenagakerjaan',
  'Survei & Evaluasi',
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  const filteredForms = useMemo(() => {
    return SAMPLE_FORMS.filter((item) => {
      const matchCat =
        selectedCategory === 'Semua Kategori' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.opd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      {/* Official Government Identity Bar */}
      <div className="bg-[#065F46] text-white py-2 px-4 border-b border-emerald-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-1.5 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider uppercase text-[11px] bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600/40">
              Pemerintah Kabupaten Purbalingga
            </span>
            <span className="hidden md:inline text-emerald-200">•</span>
            <span className="hidden md:inline text-emerald-100">
              Dinas Komunikasi dan Informatika (Diskominfo)
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200 text-[11px]">
            <span>Terintegrasi API Sidami</span>
            <span>•</span>
            <span className="text-emerald-100">Kerahasiaan Data Terlindungi</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#065F46] border-2 border-slate-900 rounded-md flex items-center justify-center text-white font-black text-lg shadow-[3px_3px_0px_#0F172A]">
              PBG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  E-Form Purbalingga
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-300 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600">
                Sistem Formulir & Survei Digital Terpadu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#daftar-form"
              className="cursor-pointer hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-800 font-bold text-xs border-2 border-slate-900 rounded hover:bg-slate-50 transition-all shadow-[2px_2px_0px_#0F172A]"
            >
              <FileText className="w-3.5 h-3.5" />
              Telusuri Formulir
            </a>
            <button
              type="button"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#065F46] text-white font-bold text-xs border-2 border-slate-900 rounded shadow-[3px_3px_0px_#0F172A] hover:bg-[#047857] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Admin OPD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-100 to-[#F8FAFC] border-b-2 border-slate-900 py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="max-w-3xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-slate-900 rounded font-bold text-xs text-slate-800 shadow-[2px_2px_0px_#0F172A] w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Portal Layanan Resmi Terintegrasi Wilayah Purbalingga</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Pelayanan Formulir & Survei Publik yang Cepat, Tepat, dan Terpercaya
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              Akses formulir permohonan dinas, pendaftaran program bantuan, serta survei kepuasan masyarakat
              di lingkungan Pemerintah Kabupaten Purbalingga secara daring tanpa perlu datang ke kantor dinas.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0F172A]">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">18 Kecamatan</span>
              </div>
              <p className="text-xs text-slate-600">Terhubung live API Sidami</p>
            </div>

            <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0F172A]">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">224 Desa/Kelurahan</span>
              </div>
              <p className="text-xs text-slate-600">Validasi bertingkat otomatis</p>
            </div>

            <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0F172A]">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Users className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">Multi-OPD Terpadu</span>
              </div>
              <p className="text-xs text-slate-600">Dinas, Badan & Kecamatan</p>
            </div>

            <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0F172A]">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">Tanda Terima Digital</span>
              </div>
              <p className="text-xs text-slate-600">Nomor registrasi unik & sah</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div id="daftar-form" className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_#0F172A] flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari formulir, nama dinas, atau kata kunci layanan..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 placeholder:text-slate-400"
                />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-300 rounded"
                >
                  Reset Pencarian
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded border-2 border-slate-900 transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#065F46] text-white shadow-[2px_2px_0px_#0F172A]'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Directory Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Daftar Formulir Publik Aktif
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Menampilkan {filteredForms.length} formulir yang dapat diisi oleh masyarakat
            </p>
          </div>
        </div>

        {filteredForms.length === 0 ? (
          <div className="bg-white border-2 border-slate-900 rounded-lg p-10 text-center flex flex-col items-center gap-3 shadow-[3px_3px_0px_#0F172A]">
            <HelpCircle className="w-10 h-10 text-slate-400" />
            <h3 className="font-bold text-base text-slate-800">Tidak ada formulir yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Coba sesuaikan kata kunci pencarian atau pilih kategori lain pada filter di atas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua Kategori');
              }}
              className="cursor-pointer text-xs font-bold text-emerald-800 underline mt-2"
            >
              Tampilkan Semua Formulir
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-slate-900 rounded-lg p-5 shadow-[4px_4px_0px_#0F172A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#0F172A] transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-3">
                  {/* Category & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded">
                      {item.category}
                    </span>
                    {item.requiresNik ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded">
                        Wajib NIK
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-300 rounded">
                        Terbuka Umum
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* OPD Meta */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.opd}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Batas: {item.deadline}
                      </span>
                      <span>{item.totalResponses} Respon</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  className="cursor-pointer w-full py-2.5 px-4 bg-[#065F46] text-white text-xs font-bold rounded border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] hover:bg-[#047857] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                >
                  <span>Buka & Isi Formulir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* How It Works Guide */}
        <section className="bg-white border-2 border-slate-900 rounded-xl p-8 shadow-[4px_4px_0px_#0F172A] mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900">
              Alur Mudah Pengisian Formulir Digital
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Tiga langkah praktis untuk menyelesaikan pengisian permohonan atau survei
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-300 rounded-lg">
              <div className="w-7 h-7 bg-[#065F46] text-white font-black text-xs rounded flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Pilih Formulir Layanan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Temukan formulir yang sesuai dengan kebutuhan Anda melalui pencarian atau kategori dinas terkait.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-300 rounded-lg">
              <div className="w-7 h-7 bg-[#065F46] text-white font-black text-xs rounded flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Lengkapi Data & Wilayah</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Isi data pertanyaan, pilih Kecamatan dan Desa di Purbalingga secara bertingkat, serta lampirkan berkas jika diminta.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-300 rounded-lg">
              <div className="w-7 h-7 bg-[#065F46] text-white font-black text-xs rounded flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Terima Bukti Registrasi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setelah berhasil dikirim, Anda mendapatkan kode tanda terima digital untuk keperluan verifikasi dan arsip pribadi.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t-2 border-slate-900 py-8 px-4 sm:px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#065F46] text-white font-black text-sm border-2 border-slate-900 rounded flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
              PBG
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Pemerintah Kabupaten Purbalingga
              </p>
              <p className="text-[11px] text-slate-500">
                Dinas Komunikasi dan Informatika • Gedung Graha Adiguna Lt. 2
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#daftar-form" className="cursor-pointer hover:text-slate-900">
              Direktori Form
            </a>
            <a href="#" className="cursor-pointer hover:text-slate-900">
              Kebijakan Privasi
            </a>
            <a href="#" className="cursor-pointer hover:text-slate-900">
              Bantuan & Panduan
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">
              © 2026 Hak Cipta Dilindungi Undang-Undang
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
