'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/admin/auth-provider';
import {
  deleteAdminForm,
  errorMessage,
  listAdminForms,
  listOPD,
  updateAdminFormStatus,
  type AdminFormSummary,
  type FormStatus,
  type OPDSummary,
  type PageMeta,
} from '@/lib/api';
import {
  cn,
  FORM_STATUS_LABEL,
  FORM_STATUS_STYLE,
  formatDate,
  formatNumber,
} from '@/lib/utils';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Dipublikasikan' },
  { value: 'CLOSED', label: 'Ditutup' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
];

export default function AdminFormsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<AdminFormSummary[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [opds, setOpds] = useState<OPDSummary[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [opdId, setOpdId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    listOPD()
      .then(setOpds)
      .catch(() => setOpds([]));
  }, [user?.role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminForms({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: status || undefined,
        opd_id: opdId || undefined,
      });
      setForms(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, opdId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, opdId]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleStatus = async (form: AdminFormSummary, nextStatus: FormStatus) => {
    const label = FORM_STATUS_LABEL[nextStatus];
    if (!window.confirm(`Ubah status "${form.title}" menjadi ${label}?`)) return;
    setBusyId(form.id);
    setError('');
    try {
      await updateAdminFormStatus(form.id, nextStatus);
      showNotice(`Status formulir berhasil diubah menjadi ${label}.`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (form: AdminFormSummary) => {
    if (!window.confirm(`Hapus formulir "${form.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setBusyId(form.id);
    setError('');
    try {
      await deleteAdminForm(form.id);
      showNotice('Formulir draft berhasil dihapus.');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Manajemen Konten
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Daftar Formulir</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Kelola formulir dinamis, atur publikasi, dan tinjau respons masyarakat.
          </p>
        </div>
        <Link href="/admin/forms/new" className="btn-brutal-yellow">
          <PlusCircle className="h-4 w-4" />
          Buat Formulir
        </Link>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border-2 border-rose-900 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Tutup pesan">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border-2 border-emerald-900 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {notice}
        </div>
      ) : null}

      <section className="card-brutal p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Cari formulir</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul atau slug formulir…"
              className="input-brutal pl-10"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="input-brutal min-w-[170px]"
            aria-label="Filter status"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {user?.role === 'SUPER_ADMIN' ? (
            <select
              value={opdId}
              onChange={(event) => setOpdId(event.target.value)}
              className="input-brutal min-w-[190px]"
              aria-label="Filter OPD"
            >
              <option value="">Semua OPD</option>
              {opds.map((opd) => (
                <option key={opd.id} value={opd.id}>
                  {opd.singkatan || opd.nama_opd}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            onClick={() => void load()}
            className="btn-brutal-white px-4 py-2.5 text-xs"
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Muat Ulang
          </button>
        </div>
      </section>

      <section className="card-brutal overflow-hidden p-0">
        <div className="flex items-center justify-between border-b-2 border-slate-900 bg-[#F8FAFC] px-5 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-600">
            {formatNumber(meta.total)} formulir ditemukan
          </p>
          <p className="text-xs font-bold text-slate-500">
            Halaman {meta.page} dari {Math.max(1, meta.total_pages)}
          </p>
        </div>

        {loading && forms.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-black text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat formulir…
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="rounded-xl border-2 border-slate-900 bg-[#E0F2FE] p-4 shadow-brutal-sm">
              <FileText className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-black">Belum ada formulir</h2>
            <p className="mt-1 max-w-md text-sm font-semibold text-slate-500">
              Buat formulir pertama Anda atau ubah kata kunci/filter pencarian.
            </p>
            <Link href="/admin/forms/new" className="btn-brutal-yellow mt-5">
              <PlusCircle className="h-4 w-4" />
              Buat Formulir Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-white text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Formulir</th>
                  <th className="px-4 py-3">OPD</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Respons</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id} className="border-b border-slate-200 align-top last:border-0">
                    <td className="max-w-[340px] px-4 py-4">
                      <p className="truncate text-sm font-black text-slate-900">{form.title}</p>
                      <p className="mt-0.5 truncate font-mono text-[10px] font-bold text-slate-400">
                        /f/{form.slug}
                      </p>
                      {form.description ? (
                        <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-500">
                          {form.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {formatNumber(form.total_responses)} respons
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(form.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black">{form.opd?.singkatan || '-'}</p>
                      <p className="mt-0.5 max-w-[170px] text-[10px] font-semibold text-slate-500">
                        {form.opd?.nama_opd || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-md border-2 border-slate-900 px-2.5 py-1 text-[10px] font-black',
                          FORM_STATUS_STYLE[form.status]
                        )}
                      >
                        {FORM_STATUS_LABEL[form.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-md border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black">
                        {formatNumber(form.total_responses)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      {formatDate(form.updated_at, true)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/forms/${form.id}/responses`}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-[#E0F2FE] px-2 py-1 text-[10px] font-black hover:bg-[#38BDF8]"
                        >
                          <Eye className="h-3 w-3" />
                          Respons
                        </Link>
                        <Link
                          href={`/admin/forms/${form.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-white px-2 py-1 text-[10px] font-black hover:bg-[#FFE600]"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        {form.status === 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busyId === form.id}
                            onClick={() => void handleStatus(form, 'DRAFT')}
                            className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-purple-200 px-2 py-1 text-[10px] font-black hover:bg-purple-300 disabled:opacity-50"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Pulihkan
                          </button>
                        ) : form.status !== 'PUBLISHED' ? (
                          <button
                            type="button"
                            disabled={busyId === form.id}
                            onClick={() => void handleStatus(form, 'PUBLISHED')}
                            className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-emerald-200 px-2 py-1 text-[10px] font-black hover:bg-emerald-300 disabled:opacity-50"
                          >
                            <Send className="h-3 w-3" />
                            Publikasikan
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === form.id}
                            onClick={() => void handleStatus(form, 'CLOSED')}
                            className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-orange-200 px-2 py-1 text-[10px] font-black hover:bg-orange-300 disabled:opacity-50"
                          >
                            <Archive className="h-3 w-3" />
                            Tutup
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === form.id}
                          onClick={() => void handleDelete(form)}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-900 hover:bg-rose-200 disabled:opacity-50"
                          title="Hapus formulir (hanya draft tanpa respons)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-slate-900 bg-[#F8FAFC] px-5 py-3">
          <p className="text-[11px] font-semibold text-slate-500">
            Menampilkan {forms.length} dari {formatNumber(meta.total)} formulir
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-white px-2.5 py-1.5 text-[11px] font-black disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>
            <span className="rounded-md border-2 border-slate-900 bg-[#FFE600] px-2.5 py-1.5 text-[11px] font-black">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= Math.max(1, meta.total_pages) || loading}
              onClick={() => setPage((value) => value + 1)}
              className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-white px-2.5 py-1.5 text-[11px] font-black disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-slate-300 bg-white/60 px-4 py-3 text-[11px] font-semibold text-slate-500">
        <span>Tips: formulir harus berstatus draft dan belum memiliki respons agar dapat dihapus.</span>
        <Link href="/admin" className="inline-flex items-center gap-1 font-black text-emerald-700">
          Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
