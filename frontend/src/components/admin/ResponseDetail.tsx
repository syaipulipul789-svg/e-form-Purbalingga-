'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { displayValue, isFileAnswer, maskSensitiveValue, responseDate } from '@/lib/response-format';
import { responseStatusMeta } from '@/lib/response-status';
import type { FormResponse, ResponseStatus } from '@/types';

interface ResponseDetailProps {
  response: FormResponse;
  answerLabels: Map<string, string>;
  onUpdated: (response: FormResponse) => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Gagal memperbarui status pengajuan.';
}

export default function ResponseDetail({ response, answerLabels, onUpdated }: ResponseDetailProps) {
  const [publicNote, setPublicNote] = useState(response.public_note ?? '');
  const [internalNote, setInternalNote] = useState(response.internal_note ?? '');
  const [action, setAction] = useState<ResponseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPublicNote(response.public_note ?? '');
    setInternalNote(response.internal_note ?? '');
    setError(null);
  }, [response.id, response.public_note, response.internal_note]);

  const meta = responseStatusMeta(response.status);
  const isFinal = response.status === 'APPROVED' || response.status === 'REJECTED';

  async function changeStatus(next: ResponseStatus) {
    if (next === 'REJECTED' && !publicNote.trim()) {
      setError('Catatan untuk warga wajib diisi saat menolak pengajuan.');
      return;
    }
    setAction(next);
    setError(null);
    try {
      const updated = await apiFetch<FormResponse>(
        `/forms/${response.form_id}/responses/${response.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: next,
            public_note: publicNote.trim(),
            internal_note: internalNote.trim(),
          }),
        },
      );
      onUpdated(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-slate-800">Detail pengajuan</h3>
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-[10px] font-semibold text-slate-500">
          Masuk {responseDate(response.submitted_at)}
          {response.updated_at ? ` · Diperbarui ${responseDate(response.updated_at)}` : ''}
        </p>
      </div>

      <h3 className="mt-4 text-xs font-black text-slate-800">Jawaban pemohon</h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {Object.entries(response.answers).map(([key, value]) => {
          const label = answerLabels.get(key) ?? key.replace(/[_-]/g, ' ');
          const isSensitive = /nik|nomor induk kependudukan/i.test(`${key} ${label}`);
          return (
            <div key={key} className="min-w-0 border-b border-slate-200 pb-2">
              <dt className="text-[10px] font-black uppercase text-slate-500">{label}</dt>
              <dd className="mt-0.5 break-words text-xs font-semibold text-slate-800">
                {isFileAnswer(value) ? (
                  <a
                    href={value.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> Buka berkas
                  </a>
                ) : isSensitive ? (
                  maskSensitiveValue(value)
                ) : (
                  displayValue(value)
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[10px] font-black uppercase text-slate-500">
          Catatan internal (tidak terlihat warga)
          <textarea
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            disabled={isFinal}
            rows={3}
            placeholder="Hasil pengecekan berkas, catatan petugas, dll."
            className="rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-semibold normal-case text-slate-800 disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] font-black uppercase text-slate-500">
          Catatan untuk warga
          <textarea
            value={publicNote}
            onChange={(event) => setPublicNote(event.target.value)}
            disabled={isFinal}
            rows={3}
            placeholder="Contoh: Berkas lengkap, pengajuan disetujui. Petugas akan menghubungi Anda."
            className="rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-semibold normal-case text-slate-800 disabled:bg-slate-100"
          />
        </label>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {isFinal ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 text-xs font-bold text-slate-600">
          <ShieldCheck className="h-4 w-4" />
          Pengajuan sudah final ({meta.label}). Status tidak dapat diubah lagi.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {response.status === 'SUBMITTED' && (
            <button
              type="button"
              onClick={() => changeStatus('VERIFIED')}
              disabled={action !== null}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-amber-300 px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0px_#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action === 'VERIFIED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verifikasi Pengajuan
            </button>
          )}
          {response.status === 'VERIFIED' && (
            <>
              <button
                type="button"
                onClick={() => changeStatus('APPROVED')}
                disabled={action !== null}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-emerald-300 px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0px_#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action === 'APPROVED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Setujui
              </button>
              <button
                type="button"
                onClick={() => changeStatus('REJECTED')}
                disabled={action !== null}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-rose-200 px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0px_#0F172A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action === 'REJECTED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Tolak
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
