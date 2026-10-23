'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Users,
  MapPin,
  ArrowRight,
  HelpCircle,
  Clock,
  Lock,
  Sparkles,
  HeartHandshake,
  Briefcase,
  GraduationCap,
  Activity,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  QrCode,
  Layers,
  Sparkle,
} from 'lucide-react';
import { errorMessage, listPublicForms, type PublicForm } from '@/lib/api';

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
  isOpen: boolean;
  closedReason?: string;
  colorTheme: {
    banner: string;
    badge: string;
    btnColor: string;
    shadowColor: string;
    iconBg: string;
  };
}

const THEMES = [
  {
    banner: 'bg-[#FFE600]',
    badge: 'bg-[#FEF08A] text-amber-950 border-amber-500',
    btnColor: 'bg-[#FFE600] text-slate-900 hover:bg-[#FACC15]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#CA8A04]',
    iconBg: 'bg-[#FEF08A]',
  },
  {
    banner: 'bg-[#A855F7]',
    badge: 'bg-[#F3E8FF] text-purple-950 border-purple-400',
    btnColor: 'bg-[#A855F7] text-white hover:bg-[#9333EA]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#6D28D9]',
    iconBg: 'bg-[#F3E8FF]',
  },
  {
    banner: 'bg-[#38BDF8]',
    badge: 'bg-[#E0F2FE] text-sky-950 border-sky-400',
    btnColor: 'bg-[#0284C7] text-white hover:bg-[#0369A1]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#0369A1]',
    iconBg: 'bg-[#E0F2FE]',
  },
  {
    banner: 'bg-[#34D399]',
    badge: 'bg-[#D1FAE5] text-emerald-950 border-emerald-400',
    btnColor: 'bg-[#059669] text-white hover:bg-[#047857]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#047857]',
    iconBg: 'bg-[#D1FAE5]',
  },
  {
    banner: 'bg-[#FB923C]',
    badge: 'bg-[#FFEDD5] text-orange-950 border-orange-400',
    btnColor: 'bg-[#F97316] text-white hover:bg-[#EA580C]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#C2410C]',
    iconBg: 'bg-[#FFEDD5]',
  },
  {
    banner: 'bg-[#FB7185]',
    badge: 'bg-[#FFE4E6] text-rose-950 border-rose-400',
    btnColor: 'bg-[#F43F5E] text-white hover:bg-[#E11D48]',
    shadowColor: 'hover:shadow-[4px_4px_0px_#BE123C]',
    iconBg: 'bg-[#FFE4E6]',
  },
];

function categoryFor(form: PublicForm): string {
  const opd = `${form.opd?.kode_opd || ''} ${form.opd?.nama_opd || ''}`.toLowerCase();
  if (form.slug.includes('umkm') || opd.includes('koperasi')) return 'Usaha & UMKM';
  if (form.slug.includes('skm') || form.slug.includes('survei') || opd.includes('komunikasi')) {
    return 'Survei & Evaluasi';
  }
  if (form.slug.includes('kependudukan') || opd.includes('kependudukan')) return 'Kependudukan';
  if (opd.includes('sosial')) return 'Bansos & Sosial';
  if (opd.includes('kesehatan')) return 'Kesehatan';
  if (opd.includes('tenaga kerja')) return 'Ketenagakerjaan';
  return 'Layanan Publik';
}

function formatDeadline(form: PublicForm): string {
  const value = form.settings?.end_date || form.end_date;
  if (!value) return 'Terbuka Selalu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Terbuka Selalu';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toFormItem(form: PublicForm, index: number): FormItem {
  const actualIndex = ['bansos-umkm-purbalingga-2026', 'survei-kepuasan-masyarakat-diskominfo'].indexOf(form.slug);
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    opd: form.opd?.nama_opd || 'Pemerintah Kabupaten Purbalingga',
    category: categoryFor(form),
    description: form.description || 'Formulir layanan digital resmi Pemerintah Kabupaten Purbalingga.',
    deadline: formatDeadline(form),
    totalResponses: form.total_responses,
    requiresNik: Boolean(form.settings?.require_nik),
    isOpen: form.is_open,
    closedReason: form.closed_reason,
    colorTheme: THEMES[(actualIndex >= 0 ? actualIndex : index) % THEMES.length],
  };
}

const CATEGORIES = [
  { name: 'Semua Kategori', activeBg: 'bg-[#0F172A] text-white', hoverBorder: 'hover:border-slate-900' },
  { name: 'Usaha & UMKM', activeBg: 'bg-[#FFE600] text-slate-900', hoverBorder: 'hover:border-amber-500' },
  { name: 'Kependudukan', activeBg: 'bg-[#38BDF8] text-slate-900', hoverBorder: 'hover:border-sky-500' },
  { name: 'Bansos & Sosial', activeBg: 'bg-[#FB7185] text-white', hoverBorder: 'hover:border-rose-500' },
  { name: 'Kesehatan', activeBg: 'bg-[#34D399] text-slate-900', hoverBorder: 'hover:border-emerald-500' },
  { name: 'Ketenagakerjaan', activeBg: 'bg-[#FB923C] text-slate-900', hoverBorder: 'hover:border-orange-500' },
  { name: 'Survei & Evaluasi', activeBg: 'bg-[#A855F7] text-white', hoverBorder: 'hover:border-purple-500' },
  { name: 'Layanan Publik', activeBg: 'bg-[#059669] text-white', hoverBorder: 'hover:border-emerald-500' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    listPublicForms()
      .then((items) => {
        if (active) setForms(items.map(toFormItem));
      })
      .catch((err) => {
        if (active) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredForms = useMemo(() => {
    return forms.filter((item) => {
      const matchCat =
        selectedCategory === 'Semua Kategori' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.opd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [forms, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A] flex flex-col justify-between selection:bg-[#FFE600] selection:text-slate-900 font-sans">
      {/* 1. Official Civic Top Bar */}
      <div className="bg-[#FFE600] text-slate-900 py-2.5 px-4 border-b-2 border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2 font-black">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] tracking-widest uppercase border border-slate-900 shadow-[1px_1px_0px_#CA8A04]">
              PORTAL RESMI
            </span>
            <span className="tracking-tight text-slate-900">
              PEMERINTAH KABUPATEN PURBALINGGA • DINAS KOMUNIKASI DAN INFORMATIKA
            </span>
          </div>
          <div className="text-[11px] font-extrabold text-slate-800 hidden sm:block">
            Sistem Informasi Pelayanan Publik Terpadu
          </div>
        </div>
      </div>

      {/* 2. Main Header / Navigation */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Purbalingga Logo Badge */}
            <div className="w-12 h-12 bg-[#059669] border-2 border-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[4px_4px_0px_#0F172A] hover:rotate-3 transition-transform cursor-pointer">
              PBG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  E-Form Purbalingga
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600">
                Sistem Formulir Dinamis & Pelayanan Publik Digital Terpadu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#daftar-form"
              className="cursor-pointer hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 font-extrabold text-xs border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0F172A] hover:bg-slate-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Katalog Formulir</span>
            </a>
            <Link
              href="/login"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFE600] text-slate-900 font-black text-xs border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_#0F172A] hover:bg-[#FACC15] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
            >
              <Lock className="w-4 h-4 text-slate-900" />
              <span>Portal Admin OPD</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section: Rich, Colorful, High-Contrast & Professional */}
      <section className="bg-brutal-grid border-b-2 border-slate-900 py-12 md:py-16 px-4 relative overflow-hidden">
        {/* Subtle Decorative Colorful Accents in Background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FFE600]/30 rounded-full border-2 border-dashed border-slate-900 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#38BDF8]/20 rounded-full border-2 border-dashed border-slate-900 pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">
          <div className="max-w-3xl flex flex-col gap-4">
            {/* Colorful Badges Strip */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#38BDF8] text-slate-900 border-2 border-slate-900 rounded-md font-black text-xs shadow-[2.5px_2.5px_0px_#0F172A]">
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                Resmi Pemkab Purbalingga
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A7F3D0] text-emerald-950 border-2 border-slate-900 rounded-md font-extrabold text-xs shadow-[2.5px_2.5px_0px_#0F172A]">
                ✓ Layanan Publik Terpadu
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DDD6FE] text-purple-950 border-2 border-slate-900 rounded-md font-extrabold text-xs shadow-[2.5px_2.5px_0px_#0F172A]">
                ⚡ 100% Bebas Antrean Loket
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.16]">
              Portal Layanan Formulir & Survei Publik{' '}
              <span className="relative inline-block px-3 py-1 bg-[#FFE600] border-2 border-slate-900 rounded-xl shadow-[5px_5px_0px_#0F172A] rotate-[-1deg] text-slate-900">
                Kabupaten Purbalingga
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-semibold">
              Satu pintu digital untuk pendaftaran bantuan sosial, fasilitasi legalitas UMKM, permohonan adminduk,
              hingga survei kepuasan masyarakat Organisasi Perangkat Daerah (OPD) se-Kabupaten Purbalingga
              secara terpadu, cepat, dan transparan.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="#daftar-form"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 bg-[#059669] text-white font-black text-sm border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0F172A] hover:bg-[#047857] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0F172A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                <span>Lihat Formulir Aktif</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="#cara-kerja"
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-3.5 bg-white text-slate-900 font-extrabold text-sm border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0F172A] hover:bg-slate-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] transition-all"
              >
                <HelpCircle className="w-4 h-4 text-slate-700" />
                <span>Panduan 3 Langkah</span>
              </a>
            </div>
          </div>

          {/* 4 Pillars Colorful Cards Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {/* Card 1: Canary Sunglow */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#FFE600] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <FileText className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 border border-slate-900 rounded">
                  ONLINE
                </span>
              </div>
              <div>
                <span className="font-black text-xl text-slate-900 block leading-tight">100% Daring</span>
                <span className="text-xs font-bold text-slate-600">Akses formulir kapan saja</span>
              </div>
            </div>

            {/* Card 2: Fresh Mint */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#A7F3D0] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <CheckCircle2 className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 border border-slate-900 rounded">
                  RESMI
                </span>
              </div>
              <div>
                <span className="font-black text-xl text-slate-900 block leading-tight">Terverifikasi</span>
                <span className="text-xs font-bold text-slate-600">Terhubung langsung ke dinas</span>
              </div>
            </div>

            {/* Card 3: Electric Sky */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#38BDF8] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <Users className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-100 border border-slate-900 rounded">
                  OPD
                </span>
              </div>
              <div>
                <span className="font-black text-xl text-slate-900 block leading-tight">Multi-Dinas</span>
                <span className="text-xs font-bold text-slate-600">Dinkes, Dinsos, Diskominfo</span>
              </div>
            </div>

            {/* Card 4: Royal Lavender */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#DDD6FE] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <QrCode className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-100 border border-slate-900 rounded">
                  BUKTI SAH
                </span>
              </div>
              <div>
                <span className="font-black text-xl text-slate-900 block leading-tight">Tanda Terima</span>
                <span className="text-xs font-bold text-slate-600">Nomor registrasi unik NIK</span>
              </div>
            </div>
          </div>

          {/* Interactive Search & Colorful Filter Panel */}
          <div id="daftar-form" className="bg-white border-2 border-slate-900 rounded-2xl p-5 md:p-6 shadow-[6px_6px_0px_#0F172A] flex flex-col gap-4 mt-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari formulir layanan, nama OPD, atau kata kunci..."
                  className="w-full pl-12 pr-4 py-3 bg-[#FFFDF5] border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669] placeholder:text-slate-400 placeholder:font-medium shadow-[2px_2px_0px_#0F172A]"
                />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer text-xs font-black bg-[#FECDD3] text-rose-950 px-4 py-3 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] hover:bg-rose-200 transition-all whitespace-nowrap"
                >
                  Reset Pencarian
                </button>
              )}
            </div>

            {/* Filter Pills with Distinct Color Coding */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mr-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-900" />
                <span>Kategori:</span>
              </div>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`cursor-pointer whitespace-nowrap text-xs font-black px-4 py-2 rounded-xl border-2 border-slate-900 transition-all ${
                      isActive
                        ? `${cat.activeBg} shadow-[3px_3px_0px_#0F172A] translate-x-[-1px] translate-y-[-1px]`
                        : 'bg-white text-slate-800 hover:bg-slate-100 shadow-[1.5px_1.5px_0px_#0F172A]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Form Directory Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full flex-1 flex flex-col gap-10">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>Formulir Publik Tersedia</span>
              <span className="text-xs font-black bg-[#FFE600] text-slate-900 px-3 py-1 border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_#0F172A]">
                {filteredForms.length} Formulir
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
              Pilih formulir resmi untuk langsung mengisi data secara online dan mandiri
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-[6px_6px_0px_#0F172A]">
            <div className="w-12 h-12 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-700">Memuat formulir publik…</p>
          </div>
        ) : loadError ? (
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-10 text-center flex flex-col items-center gap-3 shadow-[6px_6px_0px_#0F172A]">
            <div className="w-14 h-14 bg-[#FECDD3] border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
              <HelpCircle className="w-7 h-7 text-slate-900" />
            </div>
            <h3 className="font-black text-lg text-slate-900">Gagal Memuat Formulir</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer text-xs font-black px-5 py-2.5 bg-[#FFE600] text-slate-900 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] mt-2"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-[6px_6px_0px_#0F172A]">
            <div className="w-14 h-14 bg-[#FED7AA] border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
              <HelpCircle className="w-7 h-7 text-slate-900" />
            </div>
            <h3 className="font-black text-lg text-slate-900">Formulir Tidak Ditemukan</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm">
              Tidak ada hasil untuk pencarian &quot;{searchQuery}&quot; pada kategori &quot;{selectedCategory}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua Kategori');
              }}
              className="cursor-pointer text-xs font-black px-5 py-2.5 bg-[#FFE600] text-slate-900 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all mt-2"
            >
              Tampilkan Seluruh Formulir
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#0F172A] transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Colorful Top Accent Strip */}
                <div className={`h-3.5 w-full border-b-2 border-slate-900 ${item.colorTheme.banner}`} />

                <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                  <div className="flex flex-col gap-3">
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A] ${item.colorTheme.badge}`}>
                        {item.category}
                      </span>
                      {!item.isOpen ? (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#FECDD3] text-rose-950 border border-slate-900 rounded-md shadow-[1px_1px_0px_#0F172A]" title={item.closedReason}>
                          Ditutup
                        </span>
                      ) : item.requiresNik ? (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#DCFCE7] text-emerald-950 border border-slate-900 rounded-md shadow-[1px_1px_0px_#0F172A]">
                          Wajib NIK
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#E0F2FE] text-sky-950 border border-slate-900 rounded-md shadow-[1px_1px_0px_#0F172A]">
                          Publik
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-[#059669] transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs font-semibold text-slate-600 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Meta OPD & Deadline */}
                  <div className="pt-3 border-t-2 border-slate-100 flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.opd}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Batas: {item.deadline}
                      </span>
                      <span className="text-slate-900 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {item.totalResponses} Respon
                      </span>
                    </div>

                    {/* Action Button */}
                    {item.isOpen ? (
                      <a
                        href={`/f/${item.slug}`}
                        className={`cursor-pointer w-full mt-2 py-2.5 px-4 text-xs font-black rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 ${item.colorTheme.btnColor}`}
                      >
                        <span>Buka & Isi Formulir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span
                        title={item.closedReason}
                        className="w-full mt-2 py-2.5 px-4 text-xs font-black rounded-xl border-2 border-slate-900 bg-slate-200 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Formulir Ditutup
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Bento Grid: Program Unggulan Daerah */}
        <section className="mt-6 flex flex-col gap-6">
          <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Layanan Unggulan Purbalingga
              </h2>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Program prioritas pemerintah daerah untuk kesejahteraan masyarakat
              </p>
            </div>
            <span className="text-xs font-black bg-[#FFE600] px-2.5 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] hidden sm:inline-block">
              PRIORITAS DAERAH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FEFCE8] border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 bg-[#FFE600] border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <HeartHandshake className="w-5 h-5 text-slate-900" />
              </div>
              <h4 className="font-black text-sm text-slate-900">Bantuan Sosial & UMKM</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Pendaftaran bantuan modal usaha mikro, fasilitasi NIB legal, dan jaminan bansos lansia terpadu.
              </p>
            </div>

            <div className="bg-[#F0F9FF] border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 bg-[#38BDF8] border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <FileCheck className="w-5 h-5 text-slate-900" />
              </div>
              <h4 className="font-black text-sm text-slate-900">Adminduk Cepat Daring</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Permohonan surat pengantar, pembaharuan Kartu Keluarga, dan kutipan akta kelahiran tanpa antrean.
              </p>
            </div>

            <div className="bg-[#F0FDF4] border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 bg-[#34D399] border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Activity className="w-5 h-5 text-slate-900" />
              </div>
              <h4 className="font-black text-sm text-slate-900">Kesehatan & Gizi Anak</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Pemantauan balita stunting, survei mutu pelayanan rawat jalan puskesmas, dan jaminan kesehatan daerah.
              </p>
            </div>

            <div className="bg-[#FAF5FF] border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 bg-[#A855F7] border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-black text-sm text-slate-900">Pelatihan BLK & Vokasi</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Pelatihan kerja otomotif, garmen, dan teknologi informasi gratis bersertifikasi kompetensi BNSP.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Panduan 3 Langkah Pengisian Formulir */}
        <section id="cara-kerja" className="bg-white border-2 border-slate-900 rounded-2xl p-8 shadow-[6px_6px_0px_#0F172A]">
          <div className="mb-6 flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase text-[#059669] tracking-wider">
              PANDUAN WARGA
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Alur Pengisian Formulir Digital
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Proses ringkas, transparan, dan terverifikasi dalam 3 tahapan mudah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-[#FEFCE8] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3">
              <div className="w-10 h-10 bg-[#FFE600] text-slate-900 font-black text-base border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                01
              </div>
              <h4 className="font-black text-base text-slate-900">Pilih Formulir Layanan</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Temukan formulir yang Anda butuhkan melalui kolom pencarian atau filter kategori OPD penyelenggara program.
              </p>
            </div>

            <div className="p-5 bg-[#F0FDF4] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3">
              <div className="w-10 h-10 bg-[#34D399] text-slate-900 font-black text-base border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                02
              </div>
              <h4 className="font-black text-base text-slate-900">Lengkapi Formulir</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Isi seluruh pertanyaan formulir dengan teliti dan lampirkan berkas dokumen bila disyaratkan.
              </p>
            </div>

            <div className="p-5 bg-[#FAF5FF] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3">
              <div className="w-10 h-10 bg-[#A855F7] text-white font-black text-base border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                03
              </div>
              <h4 className="font-black text-base text-slate-900">Terima Bukti Registrasi</h4>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                Selesai kirim! Anda langsung mendapatkan nomor tanda terima digital yang sah untuk arsip dan verifikasi dinas terkait.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Civic Trust & UU PDP Security Banner */}
        <section className="bg-[#FFE4E6] border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F43F5E] text-white border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A] flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900">
                Keamanan & Perlindungan Data Pribadi Terjamin
              </h4>
              <p className="text-xs font-semibold text-rose-950 mt-0.5">
                Sistem E-Form mematuhi standar UU No. 27 Tahun 2022 (UU PDP). NIK dan data pemohon dienkripsi aman untuk keperluan verifikasi dinas.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black bg-white text-slate-900 px-3 py-1.5 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#0F172A] whitespace-nowrap">
            UU PDP COMPLIANT
          </span>
        </section>
      </main>

      {/* 8. Official Civic Footer */}
      <footer className="bg-white border-t-2 border-slate-900 py-10 px-4 sm:px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#059669] text-white font-black text-lg border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
              PBG
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                Pemerintah Kabupaten Purbalingga
              </p>
              <p className="text-xs font-bold text-slate-600">
                Dinas Komunikasi dan Informatika • Gedung Graha Adiguna Lt. 2, Jl. Onje No. 1B
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-black text-slate-800">
            <a href="#daftar-form" className="cursor-pointer hover:text-emerald-700 transition-colors">
              Direktori Formulir
            </a>
            <a href="#cara-kerja" className="cursor-pointer hover:text-emerald-700 transition-colors">
              Panduan Pengisian
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-bold">
              © 2026 Hak Cipta Dilindungi Undang-Undang
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
