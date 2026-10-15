'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

const DEMO_ACCOUNTS = [
  {
    role: 'Super Admin',
    email: 'superadmin@purbalinggakab.go.id',
    opd: 'Diskominfo',
    badge: 'bg-[#FFE600]',
  },
  {
    role: 'Admin OPD',
    email: 'admin.dinkes@purbalinggakab.go.id',
    opd: 'Dinas Kesehatan',
    badge: 'bg-[#A7F3D0]',
  },
  {
    role: 'Admin OPD',
    email: 'admin.dinsos@purbalinggakab.go.id',
    opd: 'Dinas Sosial',
    badge: 'bg-[#38BDF8]',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/admin');
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/admin');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login gagal. Periksa koneksi dan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A] flex flex-col bg-brutal-grid">
      {/* Top bar */}
      <div className="bg-[#FFE600] text-slate-900 py-2.5 px-4 border-b-2 border-slate-900">
        <div className="max-w-md mx-auto text-center text-xs font-black tracking-tight">
          PORTAL ADMIN • PEMERINTAH KABUPATEN PURBALINGGA
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Back to portal */}
          <Link
            href="/"
            className="cursor-pointer inline-flex items-center gap-2 text-sm font-extrabold text-slate-700 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal Publik
          </Link>

          {/* Card */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#0F172A] flex flex-col gap-6">
            {/* Logo & Title */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-[#059669] border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[4px_4px_0px_#0F172A]">
                PBG
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Masuk Portal Admin</h1>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  E-Form Kabupaten Purbalingga
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A7F3D0] text-emerald-950 border-2 border-slate-900 rounded-md font-black text-[11px] uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                Khusus Admin OPD & Super Admin
              </span>
            </div>

            {/* Error box */}
            {error && (
              <div className="p-3 bg-rose-100 border-2 border-rose-300 rounded-lg text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-extrabold text-black flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@...purbalinggakab.go.id"
                  autoComplete="username"
                  className="input-brutal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-extrabold text-black flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    className="input-brutal pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal-emerald w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0px_#0F172A]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                )}
              </button>
            </form>

            {/* Demo hint toggle */}
            <div className="border-t-2 border-dashed border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                Akun Demo untuk Pengujian
              </button>

              {showHint && (
                <div className="mt-3 flex flex-col gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.email}
                      className="p-2.5 bg-[#FFFDF5] border-2 border-slate-200 rounded-lg flex items-center gap-2.5"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full border border-slate-900 flex-shrink-0 ${acc.badge}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate">
                          {acc.email}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          {acc.role} • {acc.opd}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmail(acc.email)}
                        className="cursor-pointer text-[10px] font-black px-2 py-1 bg-white border-2 border-slate-900 rounded shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-slate-50 transition-all text-slate-700"
                      >
                        Isi
                      </button>
                    </div>
                  ))}
                  <p className="text-[10px] font-semibold text-slate-500 text-center">
                    Password semua akun: <span className="font-mono font-black">Purbalingga2026!</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] font-bold text-slate-500">
            © 2026 Dinas Komunikasi dan Informatika Kabupaten Purbalingga
          </p>
        </div>
      </div>
    </div>
  );
}