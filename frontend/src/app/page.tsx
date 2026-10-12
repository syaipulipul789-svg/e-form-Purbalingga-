'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
  Layers,
  Building2,
  Users,
  ChevronRight,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import PurbalinggaRegionalSelect, {
  RegionalValue,
} from '@/components/regional/PurbalinggaRegionalSelect';

export default function HomePage() {
  const [demoWilayah, setDemoWilayah] = useState<RegionalValue>({
    kode_kec: 330315,
    nama_kecamatan: 'PADAMARA',
    kode_desa: 3303152001,
    nama_desa: 'KARANGPULE',
  });
  const [submittedDemo, setSubmittedDemo] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Bar Announcement */}
      <div className="bg-[#FFE600] border-b-2 border-black py-2 px-4 text-center font-extrabold text-xs md:text-sm tracking-wide">
        🏛️ PORTAL RESMI E-FORM PEMERINTAH KABUPATEN PURBALINGGA • TERINTEGRASI API SIDAMI
      </div>

      {/* Navigation Header */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#059669] border-2 border-black rounded-md flex items-center justify-center font-black text-white text-lg shadow-[2px_2px_0px_#121212]">
              PBG
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tight">E-Form Purbalingga</h1>
              <p className="text-[11px] font-bold text-neutral-600">Sistem Formulir Digital Terpadu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black font-extrabold text-xs border-2 border-black rounded shadow-[2px_2px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              Direktori Form
            </button>
            <button
              type="button"
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] text-white font-extrabold text-xs border-2 border-black rounded shadow-[2px_2px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Admin OPD
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full flex flex-col gap-12">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#38BDF8] border-2 border-black rounded-full font-extrabold text-xs shadow-[2px_2px_0px_#121212] w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Form Dinamis Standar Pemerintahan</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
              Satu Pintu Layanan Formulir Publik{' '}
              <span className="bg-[#FFE600] px-2 border-2 border-black shadow-[3px_3px_0px_#121212] inline-block">
                Kabupaten Purbalingga
              </span>
            </h2>

            <p className="text-base sm:text-lg font-medium text-neutral-800 leading-relaxed">
              Memudahkan seluruh OPD dan instansi di lingkungan Pemkab Purbalingga membuat survei,
              pendaftaran bantuan, dan layanan birokrasi dengan field wilayah otomatis (18 Kecamatan & Desa) yang terhubung langsung ke API Sidami.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 bg-[#FFE600] text-black font-black text-sm border-2 border-black rounded-lg shadow-[4px_4px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#121212] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Isi Formulir Publik Sekarang
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-3.5 bg-white text-black font-bold text-sm border-2 border-black rounded-lg shadow-[3px_3px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#121212] transition-all"
              >
                Pelajari Form Builder
              </button>
            </div>
          </div>

          {/* Interactive Live Component Showcase */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_#121212]">
              <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full border border-black" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full border border-black" />
                  <div className="w-3 h-3 bg-emerald-500 rounded-full border border-black" />
                  <span className="text-xs font-black uppercase tracking-wider ml-1">Live Demo Chaining</span>
                </div>
                <span className="text-xs font-bold bg-[#C4B5FD] px-2 py-0.5 border border-black rounded">
                  Spesial Input
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    defaultValue="3303151201900001"
                    placeholder="3303xxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-neutral-50 text-black text-sm font-mono border-2 border-black rounded shadow-[2px_2px_0px_#121212] focus:outline-none"
                  />
                </div>

                {/* Chaining Selector Spesial */}
                <PurbalinggaRegionalSelect
                  value={demoWilayah}
                  onChange={(val) => setDemoWilayah(val)}
                />

                <button
                  type="button"
                  onClick={() => setSubmittedDemo(true)}
                  className="cursor-pointer w-full py-2.5 bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider border-2 border-black rounded shadow-[3px_3px_0px_#121212] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#121212] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Uji Kirim Data Demo
                </button>

                {submittedDemo && (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-700 rounded text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Data berhasil dikonfirmasi! Wilayah: {demoWilayah.nama_kecamatan} - {demoWilayah.nama_desa || 'Semua'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#121212] flex flex-col gap-3">
            <div className="w-10 h-10 bg-[#FFE600] border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_#121212]">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-lg font-black">Dynamic Form Builder</h3>
            <p className="text-sm font-medium text-neutral-700">
              Admin OPD dapat menambahkan field teks, angka, dropdown, file upload, rating kepuasan, hingga tanda tangan digital tanpa batas.
            </p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#121212] flex flex-col gap-3">
            <div className="w-10 h-10 bg-[#059669] text-white border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_#121212]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black">Integrasi API Sidami Purbalingga</h3>
            <p className="text-sm font-medium text-neutral-700">
              Data 18 Kecamatan dan seluruh Desa di Purbalingga otomatis terhubung dan di-cache dalam basis data lokal untuk respon kilat tanpa error.
            </p>
          </div>

          <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#121212] flex flex-col gap-3">
            <div className="w-10 h-10 bg-[#38BDF8] border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_#121212]">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-lg font-black">Multi-OPD & Export Excel</h3>
            <p className="text-sm font-medium text-neutral-700">
              Setiap dinas dan kecamatan mengelola formulirnya masing-masing, melihat grafik analitik langsung, dan mengekspor respons ke format .xlsx secara instan.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black py-6 px-4 text-center mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-neutral-700">
            © 2026 Pemerintah Kabupaten Purbalingga • Dinas Komunikasi dan Informatika (Diskominfo)
          </p>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-neutral-500">Versi 1.0.0-beta</span>
            <span className="px-2 py-0.5 bg-[#FFE600] border border-black rounded font-black">Neobrutalism UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
