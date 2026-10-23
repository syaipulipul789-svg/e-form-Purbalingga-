'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Layers,
  Loader2,
  PlusCircle,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/admin/auth-provider';
import {
  errorMessage,
  formatSubmittedAt,
  getDashboardSummary,
  type DashboardSummary,
} from '@/lib/api';
import {
  cn,
  formatNumber,
  VERIFICATION_LABEL,
  VERIFICATION_STYLE,
} from '@/lib/utils';

const STAT_CARDS = [
  {
    key: 'total_forms',
    label: 'Total Formulir',
    icon: Layers,
    accent: 'bg-[#E0F2FE]',
    note: 'Seluruh formulir OPD',
  },
  {
    key: 'published_forms',
    label: 'Sedang Aktif',
    icon: CheckCircle2,
    accent: 'bg-[#A7F3D0]',
    note: 'Dipublikasikan ke publik',
  },
  {
    key: 'total_responses',
    label: 'Total Respons',
    icon: Users,
    accent: 'bg-[#FEF08A]',
    note: 'Sepanjang periode',
  },
  {
    key: 'pending_verification',
    label: 'Menunggu Verifikasi',
    icon: Clock3,
    accent: 'bg-[#FFE4E6]',
    note: 'Perlu ditinjau petugas',
  },
] as const;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getDashboardSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const maxTrend = useMemo(
    () => Math.max(1, ...(summary?.response_trend || []).map((item) => item.count)),
    [summary]
  );

  const maxTopForm = useMemo(
    () => Math.max(1, ...(summary?.top_forms || []).map((item) => item.total_responses)),
    [summary]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="card-brutal flex items-center gap-3 px-6 py-5">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-black">Memuat ringkasan dashboard…</span>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="card-brutal border-rose-900 bg-rose-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-700" />
          <div>
            <h1 className="text-lg font-black text-rose-950">Dashboard gagal dimuat</h1>
            <p className="mt-1 text-sm font-semibold text-rose-800">
              {error || 'Terjadi kesalahan yang tidak diketahui.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-brutal-white mt-4"
            >
              Muat ulang halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card-brutal overflow-hidden bg-[#059669] p-0 text-white">
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-2 border-slate-900 bg-[#FFE600]" />
          <div className="absolute -bottom-16 right-24 h-40 w-40 rotate-12 rounded-2xl border-2 border-slate-900 bg-[#38BDF8]" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100">
              {user?.role === 'SUPER_ADMIN' ? 'Ringkasan Kabupaten' : user?.opd?.nama_opd || 'Ringkasan OPD'}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Selamat datang, {user?.nama?.split(' ').slice(0, 2).join(' ')}.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold text-emerald-50">
              Pantau performa formulir, respons masyarakat, dan antrean verifikasi dari satu
              dashboard.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <Link href="/admin/forms/new" className="btn-brutal-yellow">
              <PlusCircle className="h-4 w-4" />
              Buat Formulir Baru
            </Link>
            <Link
              href="/admin/forms"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-5 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0px_#0F172A] transition-all hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Kelola Formulir
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];
          return (
            <div key={card.key} className="card-brutal p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={cn('rounded-lg border-2 border-slate-900 p-2', card.accent)}>
                  <Icon className="h-5 w-5" />
                </span>
                {card.key === 'total_responses' ? (
                  <span className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-black text-emerald-800">
                    <TrendingUp className="h-3 w-3" />
                    {formatNumber(summary.responses_this_month)} bulan ini
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight">{formatNumber(value)}</p>
              <p className="mt-1 text-xs font-black text-slate-800">{card.label}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{card.note}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="card-brutal">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <Activity className="h-5 w-5 text-emerald-700" />
                Tren Respons 14 Hari
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Jumlah respons masuk per hari untuk cakupan akun Anda.
              </p>
            </div>
            <span className="badge-brutal bg-[#E0F2FE]">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatNumber(summary.responses_today)} hari ini
            </span>
          </div>

          <div className="mt-6 flex h-56 items-end gap-1.5 sm:gap-2">
            {summary.response_trend.map((point) => {
              const height = Math.max(4, Math.round((point.count / maxTrend) * 100));
              const date = new Date(`${point.date}T00:00:00`);
              const day = date.toLocaleDateString('id-ID', { day: '2-digit' });
              return (
                <div key={point.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[9px] font-black text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                    {point.count}
                  </span>
                  <div
                    className="w-full rounded-t-md border-2 border-slate-900 bg-[#38BDF8] transition-all group-hover:bg-[#FFE600]"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${point.count} respons`}
                  />
                  <span className="text-[9px] font-bold text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t-2 border-dashed border-slate-200 pt-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-slate-900 bg-[#38BDF8]" />
              Respons harian
            </span>
            <span>Rata-rata: {formatNumber(summary.total_responses)} total respons</span>
            <span>Bulan ini: {formatNumber(summary.responses_this_month)}</span>
          </div>
        </section>

        <section className="card-brutal">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Layers className="h-5 w-5 text-purple-700" />
              Formulir Teratas
            </h2>
            <Link href="/admin/forms" className="text-xs font-black text-emerald-700 hover:underline">
              Semua
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {summary.top_forms.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-xs font-semibold text-slate-500">
                Belum ada formulir.
              </p>
            ) : (
              summary.top_forms.map((form, index) => (
                <Link
                  key={form.id}
                  href={`/admin/forms/${form.id}/responses`}
                  className="block rounded-lg border-2 border-slate-900 bg-[#FFFDF5] p-3 transition-all hover:bg-white hover:shadow-brutal-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-slate-900 bg-[#FFE600] text-xs font-black">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black">{form.title}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-900 bg-white">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.max(6, Math.round((form.total_responses / maxTopForm) * 100))}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                        {formatNumber(form.total_responses)} respons
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="card-brutal">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Clock3 className="h-5 w-5 text-orange-600" />
              Respons Terbaru
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Kiriman terakhir yang masuk ke formulir Anda.
            </p>
          </div>
          <Link href="/admin/forms" className="btn-brutal-white px-4 py-2 text-xs">
            Lihat Semua Formulir
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Nomor Registrasi</th>
                <th className="px-3 py-2">Formulir</th>
                <th className="px-3 py-2">Waktu Kirim</th>
                <th className="px-3 py-2">Verifikasi</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent_responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-xs font-semibold text-slate-500">
                    Belum ada respons masuk.
                  </td>
                </tr>
              ) : (
                summary.recent_responses.map((response) => (
                  <tr key={response.id} className="border-b border-slate-200 text-xs font-semibold">
                    <td className="px-3 py-3 font-black text-slate-900">
                      {response.registration_number || '-'}
                    </td>
                    <td className="max-w-[260px] px-3 py-3">
                      <p className="truncate">{response.form_title}</p>
                      <p className="truncate text-[10px] text-slate-400">{response.form_slug}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {formatSubmittedAt(response.submitted_at)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black',
                          VERIFICATION_STYLE[response.verification_status]
                        )}
                      >
                        {VERIFICATION_LABEL[response.verification_status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/forms/${response.form_id}/responses`}
                        className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-[#FFE600]"
                      >
                        Tinjau
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
