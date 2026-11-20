'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getAnswerName, responseDate } from '@/lib/response-format';
import { responseStatusMeta } from '@/lib/response-status';
import ResponseDetail from '@/components/admin/ResponseDetail';
import type {
  FormDetail,
  FormListResponse,
  FormResponse,
  FormResponseListResponse,
  FormSummary,
  ResponseStatus,
} from '@/types';

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{ value: ResponseStatus | ''; label: string }> = [
  { value: '', label: 'Semua status' },
  { value: 'SUBMITTED', label: 'Baru' },
  { value: 'VERIFIED', label: 'Diverifikasi' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
];

interface KecamatanOption {
  kode_kec: number;
  nama_kecamatan: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat respons.';
}

async function loadAllForms(): Promise<FormSummary[]> {
  const firstPage = await apiFetch<FormListResponse>('/forms?page=1&limit=100');
  const pageCount = Math.ceil(firstPage.total / firstPage.limit);
  const otherPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      apiFetch<FormListResponse>(`/forms?page=${index + 2}&limit=100`),
    ),
  );
  return [firstPage, ...otherPages].flatMap((page) => page.items);
}

export default function AdminResponsesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formDetail, setFormDetail] = useState<FormDetail | null>(null);
  const [responses, setResponses] = useState<FormResponseListResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formsLoading, setFormsLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ResponseStatus | ''>('');
  const [kodeKec, setKodeKec] = useState('');
  const [kecamatanOptions, setKecamatanOptions] = useState<KecamatanOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<KecamatanOption[]>('/wilayah/kecamatan', { auth: false })
      .then((items) => {
        if (!cancelled) setKecamatanOptions(items);
      })
      .catch(() => {
        if (!cancelled) setKecamatanOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFormsLoading(true);
    setFormsError(null);
    loadAllForms()
      .then((items) => {
        if (!cancelled) {
          setForms(items);
          setSelectedFormId((current) =>
            current && items.some((form) => form.id === current) ? current : items[0]?.id ?? '',
          );
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setFormsError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setFormsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? null,
    [forms, selectedFormId],
  );

  const loadResponses = useCallback(async () => {
    if (!selectedFormId) {
      setResponses(null);
      setFormDetail(null);
      return;
    }

    let cancelled = false;
    setResponsesLoading(true);
    setResponsesError(null);
    setExpandedResponseId(null);
    setResponses(null);
    setFormDetail(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (kodeKec) params.set('kode_kec', kodeKec);

    Promise.all([
      apiFetch<FormDetail>(`/forms/${selectedFormId}`),
      apiFetch<FormResponseListResponse>(`/forms/${selectedFormId}/responses?${params.toString()}`),
    ])
      .then(([detail, responseData]) => {
        if (!cancelled) {
          setFormDetail(detail);
          setResponses(responseData);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setResponsesError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setResponsesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, selectedFormId, statusFilter, kodeKec]);

  useEffect(() => {
    let cancelRequest: (() => void) | undefined;
    void loadResponses().then((cancel) => {
      cancelRequest = cancel;
    });
    return () => cancelRequest?.();
  }, [loadResponses]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleResponseUpdated(updated: FormResponse) {
    setResponses((prev) => {
      if (!prev) return prev;
      if (statusFilter && updated.status !== statusFilter) {
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== updated.id),
          total: Math.max(0, prev.total - 1),
        };
      }
      return {
        ...prev,
        items: prev.items.map((item) => (item.id === updated.id ? updated : item)),
      };
    });
  }

  const answerLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const section of formDetail?.schema.sections ?? []) {
      for (const field of section.fields) labels.set(field.id, field.label);
    }
    return labels;
  }, [formDetail]);

  const totalPages = responses ? Math.max(1, Math.ceil(responses.total / PAGE_SIZE)) : 1;

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A]">
        <h1 className="text-2xl font-black text-slate-900">Respons Masuk</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {isSuperAdmin
            ? 'Cari dan periksa pengajuan pada formulir dari seluruh OPD.'
            : 'Cari dan periksa pengajuan pada formulir yang dikelola OPD Anda.'}
        </p>
      </section>

      {formsError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {formsError}
        </div>
      )}

      <section className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex min-w-[250px] flex-1 flex-col gap-1.5 text-xs font-black text-slate-600">
            Pilih formulir
            <select
              value={selectedFormId}
              disabled={formsLoading || !forms.length}
              onChange={(event) => {
                setPage(1);
                setSelectedFormId(event.target.value);
              }}
              className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 disabled:bg-slate-50"
            >
              {formsLoading && <option value="">Memuat formulir...</option>}
              {!formsLoading && !forms.length && <option value="">Tidak ada formulir</option>}
              {forms.map((form) => (
                <option key={form.id} value={form.id}>{form.title}</option>
              ))}
            </select>
          </label>
          <form onSubmit={submitSearch} className="flex min-w-[250px] flex-1 gap-2">
            <label className="sr-only" htmlFor="response-search">Cari respons</label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-slate-300 px-3">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <input
                id="response-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nomor registrasi atau jawaban..."
                className="w-full py-2.5 text-sm font-semibold outline-none"
              />
            </div>
            <button type="submit" className="cursor-pointer rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-black text-white">
              Cari
            </button>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[170px] flex-col gap-1.5 text-xs font-black text-slate-600">
            Status pengajuan
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setExpandedResponseId(null);
                setStatusFilter(event.target.value as ResponseStatus | '');
              }}
              className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[190px] flex-col gap-1.5 text-xs font-black text-slate-600">
            Kecamatan
            <select
              value={kodeKec}
              onChange={(event) => {
                setPage(1);
                setExpandedResponseId(null);
                setKodeKec(event.target.value);
              }}
              disabled={!kecamatanOptions.length}
              className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 disabled:bg-slate-50"
            >
              <option value="">Semua kecamatan</option>
              {kecamatanOptions.map((kecamatan) => (
                <option key={kecamatan.kode_kec} value={String(kecamatan.kode_kec)}>
                  {kecamatan.nama_kecamatan}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedForm && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-black text-slate-800">{selectedForm.title}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{selectedForm.total_responses.toLocaleString('id-ID')} respons tercatat</p>
            </div>
            <span className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
              {responses?.total.toLocaleString('id-ID') ?? '—'} hasil
            </span>
          </div>
        )}

        {responsesError && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {responsesError}
          </div>
        )}

        {responsesLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat respons...
          </div>
        ) : responses?.items.length ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Pemohon</th>
                    <th className="px-3 py-3">Nomor registrasi</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Tanggal masuk</th>
                    <th className="px-3 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
              {responses.items.map((response) => {
                const expanded = expandedResponseId === response.id;
                const statusMeta = responseStatusMeta(response.status);
                return (
                  <tr key={response.id} className="group">
                    <td colSpan={5} className="p-0">
                      <div className="grid grid-cols-[minmax(160px,1fr)_minmax(140px,1fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_auto] items-center gap-3 px-3 py-4">
                        <span className="truncate text-sm font-black text-slate-900">{getAnswerName(response.answers)}</span>
                        <span className="text-xs font-bold text-slate-700">{response.registration_number || '—'}</span>
                        <span>
                          <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{responseDate(response.submitted_at)}</span>
                        <button
                          type="button"
                          onClick={() => setExpandedResponseId(expanded ? null : response.id)}
                          aria-expanded={expanded}
                          className="cursor-pointer rounded-lg border-2 border-slate-300 px-3 py-1.5 text-[10px] font-black text-slate-700 hover:border-slate-900"
                        >
                          {expanded ? 'Tutup' : 'Lihat'}
                        </button>
                      </div>
                    {expanded && (
                      <ResponseDetail
                        response={response}
                        answerLabels={answerLabels}
                        onUpdated={handleResponseUpdated}
                      />
                    )}
                    </td>
                  </tr>
                );
              })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-500">
                {responses.total.toLocaleString('id-ID')} respons
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  aria-label="Respons sebelumnya"
                  className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black text-slate-700">Halaman {page} dari {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  aria-label="Respons berikutnya"
                  className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : !responsesError && !responsesLoading && selectedFormId ? (
          <div className="py-12 text-center">
            <Inbox className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              {search || statusFilter || kodeKec ? 'Tidak ada respons yang cocok.' : 'Belum ada respons masuk.'}
            </p>
            {!search && !statusFilter && !kodeKec && (
              <p className="mt-1 text-xs font-semibold text-slate-500">Respons baru akan muncul di sini setelah pemohon mengirim formulir.</p>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}
