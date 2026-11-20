'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { responseDate } from '@/lib/response-format';
import { responseStatusMeta } from '@/lib/response-status';
import type { PublicTrackResponse } from '@/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Gagal memuat status pengajuan.';
}

export default function TrackPage() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [nik, setNik] = useState('');
  const [result, setResult] = useState<PublicTrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<PublicTrackResponse>('/public/track', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({
          registration_number: registrationNumber.trim(),
          nik: nik.trim(),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? responseStatusMeta(result.status) : null;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A]">
      <div className="border-b-2 border-slate-900 bg-[#FFE600] px-4 py-2.5 text-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 text-xs font-black">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Katalog Formulir
          </Link>
          <span>E-Form Kabupaten Purbalingga</span>
        </div>
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
        <section className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0px_#0F172A]">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-emerald-200 shadow-[2px_2px_0px_#0F172A]">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900">Cek Status Pengajuan</h1>
              <p className="text-xs font-semibold text-slate-600">
                Masukkan nomor registrasi dan NIK yang digunakan saat mengirim formulir.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-black text-slate-600">
              Nomor registrasi
              <input
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value)}
                placeholder="Contoh: PBG-20261115-ABCDEF"
                className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-black text-slate-600">
              NIK (16 digit)
              <input
                value={nik}
                onChange={(event) => setNik(event.target.value)}
                inputMode="numeric"
                placeholder="3303xxxxxxxxxxxx"
                className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-emerald-300 px-4 py-3 text-sm font-black text-slate-900 shadow-[3px_3px_0px_#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" /> {loading ? 'Mencari...' : 'Cek Status'}
            </button>
          </form>

          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </section>

        {result && meta && (
          <section className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0px_#0F172A]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Formulir</p>
                <h2 className="mt-0.5 text-base font-black text-slate-900">{result.form_title}</h2>
                <p className="mt-1 text-xs font-bold text-slate-600">{result.registration_number}</p>
              </div>
              <span className={`rounded-lg border-2 px-3 py-1.5 text-xs font-black uppercase ${meta.className}`}>
                {meta.label}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2 text-xs font-semibold text-slate-700">
              <p className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Dikirim: {responseDate(result.submitted_at)}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Diperbarui: {responseDate(result.updated_at)}
              </p>
            </div>

            <div className="mt-5 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Catatan petugas</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {result.public_note || 'Belum ada catatan untuk pengajuan ini.'}
              </p>
            </div>

            {result.status === 'APPROVED' && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Pengajuan disetujui. Petugas akan menghubungi Anda untuk tahap berikutnya.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
