'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Building2,
  ClipboardList,
  FilePlus2,
  FileText,
  Inbox,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import StatCard from '@/components/admin/StatCard';
import type { FormSummary } from '@/types';

interface FormListResponse {
  items: FormSummary[];
  page: number;
  limit: number;
  total: number;
}

interface DashboardData {
  forms: FormSummary[];
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalResponses: number;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OPD: 'Admin OPD',
  OPERATOR: 'Operator',
};

const FORM_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Terbit',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
};

function RoleBadge({ role }: { role: string }) {
  const style =
    role === 'SUPER_ADMIN'
      ? 'bg-[#FFE600] text-slate-900'
      : role === 'ADMIN_OPD'
        ? 'bg-[#A7F3D0] text-emerald-950'
        : 'bg-[#38BDF8] text-slate-900';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-slate-900 rounded-md font-black text-[11px] uppercase tracking-wide shadow-[2px_2px_0px_#0F172A] ${style}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    const firstPage = await apiFetch<FormListResponse>('/forms?page=1&limit=100');
    const pageCount = Math.ceil(firstPage.total / firstPage.limit);
    const otherPages = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        apiFetch<FormListResponse>(`/forms?page=${index + 2}&limit=100`),
      ),
    );
    const forms = [firstPage, ...otherPages].flatMap((page) => page.items);

    return {
      forms,
      totalForms: firstPage.total,
      publishedForms: forms.filter((form) => form.status === 'PUBLISHED').length,
      draftForms: forms.filter((form) => form.status === 'DRAFT').length,
      totalResponses: forms.reduce((total, form) => total + form.total_responses, 0),
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN_OPD') return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    loadDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, refreshKey, user?.role]);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAdminOpd = user.role === 'ADMIN_OPD';
  const statValue = (value: number | undefined) =>
    value === undefined ? (isLoading ? '…' : '0') : value.toLocaleString('id-ID');

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#0F172A] flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#059669]">
              Selamat Datang Kembali
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1">
              {user.nama}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {user.opd ? user.opd.nama_opd : 'Dinas Komunikasi dan Informatika'}
            </p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {isAdminOpd && (
          <div className="p-4 bg-[#F0FDF4] border-2 border-slate-900 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
              Ringkasan formulir dan respons untuk {user.opd?.nama_opd ?? 'dinas Anda'}.
              Data ditampilkan sesuai akses OPD akun Anda.
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {isSuperAdmin ? (
          <>
            <StatCard label="Total OPD Terdaftar" value="3" note="Data contoh dari seed awal" icon={Building2} accent="bg-[#A7F3D0]" />
            <StatCard label="Total Pengguna Aktif" value="3" note="Super Admin + Admin OPD" icon={Users} accent="bg-[#38BDF8]" />
            <StatCard label="Total Formulir" value="1" note="Formulir contoh bansos UMKM" icon={FileText} accent="bg-[#DDD6FE]" />
            <StatCard label="Wilayah Sidami" value="18" note="Kecamatan terhubung live" icon={Activity} accent="bg-[#FFE600]" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Formulir"
              value={statValue(dashboard?.totalForms)}
              note="Semua formulir milik OPD"
              icon={FilePlus2}
              accent="bg-[#FFE600]"
            />
            <StatCard
              label="Formulir Terbit"
              value={statValue(dashboard?.publishedForms)}
              note="Siap menerima pengajuan"
              icon={FileText}
              accent="bg-[#DDD6FE]"
            />
            <StatCard
              label="Total Respons Masuk"
              value={statValue(dashboard?.totalResponses)}
              note="Akumulasi dari seluruh formulir"
              icon={Inbox}
              accent="bg-[#A7F3D0]"
            />
            <StatCard
              label="Formulir Draft"
              value={statValue(dashboard?.draftForms)}
              note="Belum diterbitkan"
              icon={ClipboardList}
              accent="bg-[#FED7AA]"
            />
          </>
        )}
      </section>

      {isAdminOpd ? (
        <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Formulir {user.opd?.singkatan ?? 'Dinas Anda'}</h2>
              <p className="text-xs font-bold text-slate-500">
                Status dan jumlah respons formulir yang dikelola OPD Anda
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={isLoading}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-black bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#0F172A] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Perbarui
            </button>
          </div>

          {error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="underline underline-offset-2"
              >
                Coba lagi
              </button>
            </div>
          ) : isLoading && !dashboard ? (
            <p className="py-6 text-center text-sm font-bold text-slate-500" role="status">
              Memuat ringkasan formulir…
            </p>
          ) : dashboard?.forms.length ? (
            <div className="flex flex-col divide-y-2 divide-slate-100">
              {dashboard.forms.slice(0, 5).map((form) => (
                <div key={form.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black text-slate-900">{form.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                      <span className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5">
                        {FORM_STATUS_LABEL[form.status] ?? form.status}
                      </span>
                      <span>{form.total_responses.toLocaleString('id-ID')} respons</span>
                    </div>
                  </div>
                  {form.status === 'PUBLISHED' && (
                    <a
                      href={`/f/${encodeURIComponent(form.slug)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 hover:underline"
                    >
                      Lihat form publik
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
              {dashboard.forms.length > 5 && (
                <p className="pt-3 text-center text-xs font-bold text-slate-500">
                  Menampilkan 5 dari {dashboard.totalForms.toLocaleString('id-ID')} formulir.
                </p>
              )}
            </div>
          ) : (
            <p className="py-6 text-center text-sm font-bold text-slate-500">
              Belum ada formulir untuk {user.opd?.nama_opd ?? 'OPD Anda'}.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-lg font-black text-slate-900">Aksi Cepat</h2>
              <p className="text-xs font-bold text-slate-500">
                Fitur ini akan aktif pada modul pengembangan berikutnya
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {isSuperAdmin ? (
                <>
                  <QuickAction icon={Building2} title="Kelola OPD" desc="Tambah/ubah instansi OPD" accent="bg-[#A7F3D0]" />
                  <QuickAction icon={Users} title="Kelola Pengguna" desc="Atur akun Admin OPD" accent="bg-[#38BDF8]" />
                  <QuickAction icon={ClipboardList} title="Audit Aktivitas" desc="Pantau jejak sistem" accent="bg-[#DDD6FE]" />
                </>
              ) : (
                <>
                  <QuickAction icon={FilePlus2} title="Buat Formulir" desc="Rakit form baru dinas Anda" accent="bg-[#FFE600]" />
                  <QuickAction icon={Inbox} title="Lihat Respons" desc="Cek isian warga masuk" accent="bg-[#A7F3D0]" />
                  <QuickAction icon={ClipboardList} title="Ekspor Data" desc="Unduh Excel / CSV" accent="bg-[#38BDF8]" />
                </>
              )}
            </div>
          </section>
          <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#059669]" />
              <h3 className="font-black text-base text-slate-900">Modul Berikutnya</h3>
            </div>
            <div className="flex flex-col gap-2 text-xs font-bold text-slate-600">
              <p>1. CRUD Formulir & Form Builder drag-and-drop untuk Admin OPD</p>
              <p>2. Manajemen OPD & akun Admin OPD untuk Super Admin</p>
              <p>3. Tabel Respons, verifikasi berkas, dan ekspor Excel/CSV</p>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof FilePlus2;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="cursor-pointer text-left bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3 opacity-80"
    >
      <span className={`w-10 h-10 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A] ${accent}`}>
        <Icon className="w-5 h-5 text-slate-900" />
      </span>
      <div>
        <p className="font-black text-sm text-slate-900">{title}</p>
        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="inline-flex w-fit text-[9px] font-black bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 uppercase tracking-wider text-slate-400">
        Segera hadir
      </span>
    </button>
  );
}
