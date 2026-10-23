'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { errorMessage, loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email.trim(), password);
      router.replace('/admin');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] bg-brutal-grid text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r-2 border-slate-900 bg-[#059669] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-2 border-slate-900 bg-[#FFE600]" />
          <div className="absolute -bottom-20 -left-14 h-72 w-72 rotate-12 rounded-3xl border-2 border-slate-900 bg-[#38BDF8]" />
          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-brutal-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal Publik
            </Link>
          </div>

          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-[#FFE600] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900 shadow-brutal-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Ruang Kerja Digital OPD
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-tight xl:text-6xl">
              Kelola formulir pelayanan dengan cepat dan rapi.
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-relaxed text-emerald-50">
              Susun formulir dinamis, pantau respons masyarakat, verifikasi berkas, dan ekspor
              data layanan dalam satu portal admin terpadu.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {[
                ['Form Builder', 'Susun section dan field tanpa koding.'],
                ['Verifikasi Data', 'Tinjau respons dengan catatan petugas.'],
                ['Ekspor CSV / Excel', 'Unduh rekap sesuai filter layanan.'],
                ['Akses per OPD', 'Setiap dinas hanya melihat datanya.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border-2 border-slate-900 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-black">{title}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-50/90">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-xs font-bold text-emerald-50">
            <ShieldCheck className="h-5 w-5" />
            Autentikasi aman dengan cookie httpOnly · Pemerintah Kabupaten Purbalingga
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-black">
                <ArrowLeft className="h-4 w-4" />
                Portal Publik
              </Link>
              <span className="rounded-md border-2 border-slate-900 bg-[#FFE600] px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                Admin PBG
              </span>
            </div>

            <div className="card-brutal p-7 sm:p-9">
              <div className="mb-8 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FFE600] text-base font-black shadow-brutal-sm">
                  PBG
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Portal Admin
                  </p>
                  <h2 className="text-2xl font-black tracking-tight">Masuk ke akun OPD</h2>
                </div>
              </div>

              {error ? (
                <div className="mb-5 rounded-lg border-2 border-rose-900 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-700">
                    Email Dinas
                  </span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nama@opd.purbalinggakab.go.id"
                      className="input-brutal pl-10"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-700">
                    Kata Sandi
                  </span>
                  <span className="relative block">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="input-brutal px-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brutal-emerald w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memverifikasi…
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-[11px] font-semibold leading-relaxed text-slate-500">
                Gunakan akun dinas yang diberikan administrator sistem. Hubungi Diskominfo apabila
                mengalami kendala akses.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
