'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import type { AuditEntry, AuditListResponse } from '@/types';

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  OPD_CREATED: 'Menambahkan OPD',
  OPD_UPDATED: 'Memperbarui OPD',
  USER_CREATED: 'Menambahkan pengguna',
  USER_UPDATED: 'Memperbarui pengguna',
  USER_ACTIVATED: 'Mengaktifkan pengguna',
  USER_DEACTIVATED: 'Menonaktifkan pengguna',
  RESPONSE_STATUS_UPDATED: 'Memperbarui status pengajuan',
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Gagal memuat audit trail.';
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function AuditDetails({ entry }: { entry: AuditEntry }) {
  const details = Object.entries(entry.details ?? {}).filter(([key]) => !/password|secret|token/i.test(key));
  if (!details.length) return <span className="text-xs text-slate-400">—</span>;
  return (
    <dl className="flex flex-col gap-1">
      {details.map(([key, value]) => (
        <div key={key} className="flex gap-1 text-[10px]">
          <dt className="font-bold text-slate-500">{key.replace(/_/g, ' ')}:</dt>
          <dd className="break-all font-medium text-slate-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminAuditPage() {
  const [result, setResult] = useState<AuditListResponse | null>(null);
  const [entityType, setEntityType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (entityType) params.set('entity_type', entityType);
    if (search) params.set('search', search);
    setLoading(true);
    setError(null);
    try {
      setResult(await apiFetch<AuditListResponse>(`/admin/superadmin/audit?${params.toString()}`));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [entityType, page, search]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit, refreshKey]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#DDD6FE] shadow-[2px_2px_0px_#0F172A]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Audit Trail</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Riwayat perubahan data OPD dan akun pengguna oleh Super Admin.</p>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
          <form onSubmit={submitSearch} className="flex min-w-[240px] flex-1 gap-2">
            <label className="sr-only" htmlFor="audit-search">Cari riwayat</label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <input id="audit-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari aktor atau perubahan..." className="w-full py-2.5 text-sm font-semibold outline-none" />
            </div>
            <button type="submit" className="cursor-pointer rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-black text-white">Cari</button>
          </form>
          <label className="flex items-center gap-2 text-xs font-black text-slate-600">
            Jenis data
            <select value={entityType} onChange={(event) => { setPage(1); setEntityType(event.target.value); }} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold">
              <option value="">Semua perubahan</option>
              <option value="OPD">OPD</option>
              <option value="USER">Pengguna</option>
              <option value="FORM_RESPONSE">Pengajuan</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat audit trail...
          </div>
        ) : result?.items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <tr className="border-b-2 border-slate-900">
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Aktor</th>
                    <th className="px-4 py-3">Aksi</th>
                    <th className="px-4 py-3">Objek</th>
                    <th className="px-4 py-3">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((entry) => (
                    <tr key={entry.id} className="align-top hover:bg-violet-50/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-600">{dateLabel(entry.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-slate-900">{entry.actor_name}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500">{entry.actor_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-800">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-800">{entry.entity_name}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{entry.entity_type}{entry.ip_address ? ` · ${entry.ip_address}` : ''}</p>
                      </td>
                      <td className="max-w-[260px] px-4 py-3"><AuditDetails entry={entry} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
              <p className="text-xs font-bold text-slate-500">{result.total.toLocaleString('id-ID')} catatan</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} aria-label="Halaman sebelumnya" className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs font-black">Halaman {page} dari {totalPages}</span>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} aria-label="Halaman berikutnya" className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} aria-label="Muat ulang" className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5"><ClipboardList className="h-4 w-4" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">{search || entityType ? 'Tidak ada catatan yang cocok.' : 'Belum ada aktivitas tercatat.'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Perubahan OPD dan pengguna akan tampil di sini.</p>
          </div>
        )}
      </section>
    </>
  );
}
