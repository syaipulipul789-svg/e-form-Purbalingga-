'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import type { AdminMetrics } from '@/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Gagal memuat monitoring sistem.';
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  accent: string;
}) {
  return (
    <article className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0px_#0F172A]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 ${accent}`}>
        <Icon className="h-5 w-5 text-slate-900" />
      </span>
      <p className="mt-4 text-3xl font-black leading-none text-slate-900">{value.toLocaleString('id-ID')}</p>
      <p className="mt-1.5 text-sm font-bold text-slate-700">{label}</p>
    </article>
  );
}

export default function AdminMonitoringPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await apiFetch<AdminMetrics>('/admin/superadmin/monitoring'));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
    const interval = window.setInterval(() => setRefreshKey((value) => value + 1), 60_000);
    return () => window.clearInterval(interval);
  }, [loadMetrics, refreshKey]);

  const healthy = metrics?.status === 'healthy';

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Monitoring Sistem</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Kesehatan database dan ringkasan aktivitas E-Form.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0px_#0F172A] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div><p>{error}</p><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="mt-1 underline">Coba lagi</button></div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className={`flex items-center gap-4 rounded-2xl border-2 border-slate-900 p-5 shadow-[4px_4px_0px_#0F172A] ${metrics && healthy ? 'bg-emerald-50' : 'bg-white'}`}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-900 ${metrics && healthy ? 'bg-[#A7F3D0]' : 'bg-slate-100'}`}>
            <Activity className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status aplikasi</p>
            <p className="mt-1 text-lg font-black text-slate-900">{loading && !metrics ? 'Memeriksa...' : metrics ? (healthy ? 'Beroperasi normal' : 'Perlu perhatian') : 'Tidak diketahui'}</p>
          </div>
          {metrics && (healthy ? <CheckCircle2 className="h-6 w-6 text-emerald-700" /> : <XCircle className="h-6 w-6 text-rose-700" />)}
        </article>
        <article className={`flex items-center gap-4 rounded-2xl border-2 border-slate-900 p-5 shadow-[4px_4px_0px_#0F172A] ${metrics?.database === 'healthy' ? 'bg-emerald-50' : 'bg-white'}`}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-900 ${metrics?.database === 'healthy' ? 'bg-[#A7F3D0]' : 'bg-slate-100'}`}>
            <Database className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Koneksi database</p>
            <p className="mt-1 text-lg font-black text-slate-900">{loading && !metrics ? 'Memeriksa...' : metrics?.database === 'healthy' ? 'Terhubung' : metrics?.database === 'unavailable' ? 'Tidak tersedia' : 'Tidak diketahui'}</p>
          </div>
          {metrics && (metrics.database === 'healthy' ? <CheckCircle2 className="h-6 w-6 text-emerald-700" /> : <XCircle className="h-6 w-6 text-rose-700" />)}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && !metrics ? (
          <p className="col-span-full py-8 text-center text-sm font-bold text-slate-500" role="status">Memuat metrik...</p>
        ) : metrics ? (
          <>
            <MetricCard label="OPD terdaftar" value={metrics.total_opd} icon={Building2} accent="bg-[#A7F3D0]" />
            <MetricCard label="Total pengguna" value={metrics.total_users} icon={Users} accent="bg-[#BAE6FD]" />
            <MetricCard label="Pengguna aktif" value={metrics.active_users} icon={Activity} accent="bg-[#DDD6FE]" />
            <MetricCard label="Total formulir" value={metrics.total_forms} icon={ClipboardList} accent="bg-[#FFE600]" />
            <MetricCard label="Formulir terbit" value={metrics.published_forms} icon={FileText} accent="bg-[#FED7AA]" />
            <MetricCard label="Respons terkumpul" value={metrics.total_responses} icon={Database} accent="bg-[#FBCFE8]" />
          </>
        ) : null}
      </section>

      {metrics && (
        <p className="text-right text-[10px] font-semibold text-slate-500">
          Pemeriksaan terakhir: {new Date(metrics.checked_at).toLocaleString('id-ID')}
        </p>
      )}
    </>
  );
}
