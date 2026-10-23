'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
  RotateCcw,
  Clock3,
} from 'lucide-react';
import {
  downloadBlob,
  errorMessage,
  exportAdminResponses,
  formatSubmittedAt,
  getAdminForm,
  listAdminResponses,
  verifyAdminResponse,
  type AdminForm,
  type AdminResponse,
  type FormField,
  type ResponsePageMeta,
  type ResponseSummary,
  type VerificationStatus,
} from '@/lib/api';
import {
  cn,
  formatNumber,
  truncate,
  VERIFICATION_LABEL,
  VERIFICATION_STYLE,
} from '@/lib/utils';

const EMPTY_SUMMARY: ResponseSummary = {
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0,
  revision: 0,
};

const STATUS_TABS: Array<{ value: string; label: string; key: keyof ResponseSummary }> = [
  { value: '', label: 'Semua', key: 'total' },
  { value: 'PENDING', label: 'Menunggu', key: 'pending' },
  { value: 'ACCEPTED', label: 'Diterima', key: 'accepted' },
  { value: 'REVISION', label: 'Perlu Revisi', key: 'revision' },
  { value: 'REJECTED', label: 'Ditolak', key: 'rejected' },
];

function flattenFields(form: AdminForm | null): FormField[] {
  return (form?.schema?.sections || []).flatMap((section) => section.fields || []);
}

function answerText(field: FormField, value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (field.type === 'file_upload' && typeof value === 'object') {
    const file = value as { file_url?: string; original_name?: string; file_name?: string };
    return file.original_name || file.file_name || file.file_url || '-';
  }
  if (field.type === 'regional_purbalingga' && typeof value === 'object') {
    const region = value as { nama_kecamatan?: string; nama_desa?: string };
    return [region.nama_kecamatan, region.nama_desa].filter(Boolean).join(' / ') || '-';
  }
  if (Array.isArray(value)) return value.join(', ') || '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (field.type === 'currency_idr' && !Number.isNaN(Number(value))) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value));
  }
  return String(value);
}

function respondentName(response: AdminResponse, fields: FormField[]): string {
  const nameField =
    fields.find((field) => field.id === 'f_nama') ||
    fields.find((field) => field.label.toLowerCase().includes('nama')) ||
    fields.find((field) => field.type === 'text');
  const value = nameField ? response.answers[nameField.id] : '';
  return value ? String(value) : 'Responden';
}

function respondentNik(response: AdminResponse, fields: FormField[]): string {
  const nikField = fields.find((field) => field.type === 'nik') || fields.find((field) => field.id === 'f_nik');
  const value = nikField ? response.answers[nikField.id] : '';
  return value ? String(value) : '-';
}

export default function FormResponsesPage({ params }: { params: { id: string } }) {
  const formId = params.id;
  const [form, setForm] = useState<AdminForm | null>(null);
  const [responses, setResponses] = useState<AdminResponse[]>([]);
  const [meta, setMeta] = useState<ResponsePageMeta>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    summary: EMPTY_SUMMARY,
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<AdminResponse | null>(null);
  const [verifying, setVerifying] = useState<AdminResponse | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('ACCEPTED');
  const [verificationNote, setVerificationNote] = useState('');
  const [savingVerification, setSavingVerification] = useState(false);

  const fields = useMemo(() => flattenFields(form), [form]);
  const summary = meta.summary || EMPTY_SUMMARY;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateFrom, dateTo]);

  useEffect(() => {
    let active = true;
    getAdminForm(formId)
      .then((data) => {
        if (active) setForm(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [formId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminResponses(formId, {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        verification_status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setResponses(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [formId, page, debouncedSearch, status, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openVerify = (response: AdminResponse) => {
    setError('');
    setVerifying(response);
    setVerificationStatus(
      response.verification_status === 'PENDING' ? 'ACCEPTED' : response.verification_status
    );
    setVerificationNote(response.verification_note || '');
  };

  const submitVerification = async () => {
    if (!verifying) return;
    if (['REJECTED', 'REVISION'].includes(verificationStatus) && !verificationNote.trim()) {
      setError('Catatan verifikasi wajib diisi untuk status Ditolak atau Perlu Revisi.');
      return;
    }
    setSavingVerification(true);
    setError('');
    try {
      await verifyAdminResponse(
        formId,
        verifying.id,
        verificationStatus,
        verificationStatus === 'PENDING' ? '' : verificationNote.trim()
      );
      setVerifying(null);
      showNotice('Status verifikasi respons berhasil diperbarui.');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingVerification(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    setError('');
    try {
      const result = await exportAdminResponses(formId, format, {
        search: debouncedSearch || undefined,
        verification_status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      downloadBlob(result.blob, result.filename);
      showNotice(`Ekspor ${format.toUpperCase()} berhasil diunduh.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/admin/forms"
            className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke daftar formulir
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {form ? truncate(form.title, 60) : 'Respons Formulir'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {form?.opd?.nama_opd || 'Memuat data formulir…'}
            {form ? ` · /f/${form.slug}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/forms/${formId}/edit`} className="btn-brutal-white px-4 py-2 text-xs">
            <FileText className="h-4 w-4" />
            Edit Formulir
          </Link>
          <button
            type="button"
            onClick={() => void handleExport('csv')}
            disabled={Boolean(exporting)}
            className="btn-brutal-white px-4 py-2 text-xs"
          >
            {exporting === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            CSV
          </button>
          <button
            type="button"
            onClick={() => void handleExport('xlsx')}
            disabled={Boolean(exporting)}
            className="btn-brutal-emerald px-4 py-2 text-xs"
          >
            {exporting === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Excel
          </button>
        </div>
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={cn(
              'rounded-xl border-2 border-slate-900 px-4 py-3 text-left shadow-brutal-xs transition-all',
              status === tab.value ? 'bg-[#FFE600]' : 'bg-white hover:bg-slate-50'
            )}
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              {tab.label}
            </p>
            <p className="mt-1 text-2xl font-black">{formatNumber(summary[tab.key])}</p>
          </button>
        ))}
      </section>

      <section className="card-brutal p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Cari respons</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor registrasi, NIK, atau isi jawaban…"
              className="input-brutal pl-10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Dari
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="input-brutal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Sampai
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="input-brutal"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn-brutal-white px-4 py-2.5 text-xs lg:mt-5"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-brutal-white px-4 py-2.5 text-xs lg:mt-5"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Muat
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filter aktif: {STATUS_TABS.find((tab) => tab.value === status)?.label || 'Semua'}
          {dateFrom ? ` · dari ${dateFrom}` : ''}
          {dateTo ? ` · sampai ${dateTo}` : ''}
        </p>
      </section>

      <section className="card-brutal overflow-hidden p-0">
        <div className="flex items-center justify-between border-b-2 border-slate-900 bg-[#F8FAFC] px-5 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-600">
            {formatNumber(meta.total)} respons
          </p>
          <p className="text-xs font-bold text-slate-500">
            Halaman {meta.page} dari {Math.max(1, meta.total_pages)}
          </p>
        </div>

        {loading && responses.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-black text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat respons…
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="rounded-xl border-2 border-slate-900 bg-[#E0F2FE] p-4 shadow-brutal-sm">
              <FileText className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-black">Belum ada respons</h2>
            <p className="mt-1 max-w-md text-sm font-semibold text-slate-500">
              Belum ada kiriman yang cocok dengan filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-white text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Responden</th>
                  <th className="px-4 py-3">Nomor Registrasi</th>
                  <th className="px-4 py-3">Waktu Kirim</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr key={response.id} className="border-b border-slate-200 align-top last:border-0">
                    <td className="px-4 py-4">
                      <p className="text-sm font-black text-slate-900">
                        {respondentName(response, fields)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] font-bold text-slate-400">
                        NIK {respondentNik(response, fields)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs font-black">
                      {response.registration_number || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                      {formatSubmittedAt(response.submitted_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-md border-2 border-slate-900 px-2.5 py-1 text-[10px] font-black',
                          VERIFICATION_STYLE[response.verification_status]
                        )}
                      >
                        {VERIFICATION_LABEL[response.verification_status]}
                      </span>
                      {response.verified_by_name ? (
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          oleh {response.verified_by_name}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] px-4 py-4 text-[11px] font-semibold text-slate-500">
                      {response.verification_note ? truncate(response.verification_note, 70) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetail(response)}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-white px-2 py-1 text-[10px] font-black hover:bg-[#E0F2FE]"
                        >
                          <Eye className="h-3 w-3" />
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => openVerify(response)}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-slate-900 bg-[#FFE600] px-2 py-1 text-[10px] font-black hover:bg-[#FACC15]"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verifikasi
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
            Menampilkan {responses.length} dari {formatNumber(meta.total)} respons
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

      {detail ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-6">
          <div className="my-4 w-full max-w-3xl rounded-xl border-2 border-slate-900 bg-[#FFFDF5] shadow-brutal-lg">
            <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 bg-[#E0F2FE] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Detail Respons
                </p>
                <h2 className="text-lg font-black">
                  {detail.registration_number || detail.id.slice(0, 8)}
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  Dikirim {formatSubmittedAt(detail.submitted_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-md border-2 border-slate-900 bg-white p-1.5"
                aria-label="Tutup detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {fields.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">Schema formulir tidak tersedia.</p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field) => {
                    const value = detail.answers[field.id];
                    const isFile = field.type === 'file_upload' && value && typeof value === 'object';
                    const fileUrl = isFile
                      ? (value as { file_url?: string }).file_url
                      : undefined;
                    const absolute = fileUrl
                      ? fileUrl.startsWith('http')
                        ? fileUrl
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8088'}${fileUrl}`
                      : '';
                    return (
                      <div
                        key={field.id}
                        className="grid gap-1 rounded-lg border-2 border-slate-900 bg-white px-3 py-2.5 sm:grid-cols-[220px_1fr]"
                      >
                        <div>
                          <p className="text-[11px] font-black text-slate-700">{field.label}</p>
                          <p className="font-mono text-[9px] text-slate-400">{field.id}</p>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          {isFile && absolute ? (
                            <a
                              href={absolute}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border-2 border-slate-900 bg-[#E0F2FE] px-2 py-1 text-[10px] font-black hover:bg-[#38BDF8]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Buka Berkas
                            </a>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">
                              {answerText(field, value)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 rounded-lg border-2 border-slate-300 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Metadata Pengiriman
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-600">
                  IP: {String(detail.metadata?.ip_address || '-')} · User Agent:{' '}
                  {String(detail.metadata?.user_agent || '-')}
                </p>
              </div>

              {detail.verification_note ? (
                <div className="mt-3 rounded-lg border-2 border-slate-900 bg-[#FEFCE8] px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Catatan Verifikasi
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs font-semibold text-slate-800">
                    {detail.verification_note}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-slate-900 bg-white px-5 py-4">
              <button type="button" onClick={() => setDetail(null)} className="btn-brutal-white">
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetail(null);
                  openVerify(detail);
                }}
                className="btn-brutal-yellow"
              >
                <ShieldCheck className="h-4 w-4" />
                Verifikasi Respons
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {verifying ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-6">
          <div className="my-4 w-full max-w-xl rounded-xl border-2 border-slate-900 bg-[#FFFDF5] shadow-brutal-lg">
            <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 bg-[#FFE600] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Verifikasi Respons
                </p>
                <h2 className="text-lg font-black">
                  {verifying.registration_number || verifying.id.slice(0, 8)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVerifying(null)}
                className="rounded-md border-2 border-slate-900 bg-white p-1.5"
                aria-label="Tutup verifikasi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {error ? (
                <div className="rounded-lg border-2 border-rose-900 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
                  {error}
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ['ACCEPTED', 'Terima', CheckCircle2],
                    ['REVISION', 'Perlu Revisi', RotateCcw],
                    ['REJECTED', 'Tolak', XCircle],
                    ['PENDING', 'Kembalikan ke Menunggu', Clock3],
                  ] as Array<[VerificationStatus, string, typeof CheckCircle2]>
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVerificationStatus(value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border-2 border-slate-900 px-3 py-2.5 text-xs font-black shadow-brutal-xs',
                      verificationStatus === value ? 'bg-[#FFE600]' : 'bg-white hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Catatan Verifikasi
                  {['REJECTED', 'REVISION'].includes(verificationStatus) ? (
                    <span className="text-rose-600"> *</span>
                  ) : null}
                </span>
                <textarea
                  rows={4}
                  value={verificationNote}
                  onChange={(event) => setVerificationNote(event.target.value)}
                  disabled={verificationStatus === 'PENDING'}
                  placeholder={
                    ['REJECTED', 'REVISION'].includes(verificationStatus)
                      ? 'Jelaskan alasan atau bagian yang perlu diperbaiki…'
                      : 'Catatan opsional untuk respons ini…'
                  }
                  className="input-brutal resize-y disabled:bg-slate-100"
                />
                <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                  Maksimal 1000 karakter. Wajib diisi untuk status Ditolak atau Perlu Revisi.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-slate-900 bg-white px-5 py-4">
              <button type="button" onClick={() => setVerifying(null)} className="btn-brutal-white">
                Batal
              </button>
              <button
                type="button"
                onClick={() => void submitVerification()}
                disabled={savingVerification}
                className="btn-brutal-emerald"
              >
                {savingVerification ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Simpan Verifikasi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
