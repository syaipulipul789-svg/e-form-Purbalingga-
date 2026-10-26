'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FormDetail, FormListResponse, FormSummary } from '@/types';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Terbit',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
};

interface BuilderField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FormEditor {
  id?: string;
  title: string;
  description: string;
  fields: BuilderField[];
  settings: Record<string, unknown>;
}

const emptyEditor = (): FormEditor => ({
  title: '',
  description: '',
  fields: [],
  settings: {
    is_public: true,
    require_nik: false,
    one_response_per_nik: false,
    max_submissions: 0,
  },
});

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses formulir.';
}

function statusStyle(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  if (status === 'CLOSED') return 'bg-amber-100 text-amber-900 border-amber-300';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600 border-slate-300';
  return 'bg-violet-100 text-violet-900 border-violet-300';
}

export default function AdminFormsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [result, setResult] = useState<FormListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<FormEditor | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FormSummary | null>(null);

  const loadForms = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<FormListResponse>(`/forms?${params.toString()}`);
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void loadForms();
  }, [loadForms, refreshKey]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function openEditor(form?: FormSummary) {
    setEditorError(null);
    if (!form) {
      setEditor(emptyEditor());
      return;
    }

    setBusyId(form.id);
    try {
      const detail = await apiFetch<FormDetail>(`/forms/${form.id}`);
      const sections = detail.schema.sections ?? [];
      setEditor({
        id: detail.id,
        title: detail.title,
        description: detail.description ?? '',
        fields: sections.flatMap((section) =>
          section.fields.map((field) => ({
            ...field,
            id: field.id,
            type: field.type,
            label: field.label,
            required: field.required,
          })),
        ),
        settings: detail.settings ?? {},
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function addField() {
    setEditor((current) =>
      current
        ? {
            ...current,
            fields: [
              ...current.fields,
              {
                id: `field_${Date.now()}`,
                type: 'text',
                label: '',
                required: false,
              },
            ],
          }
        : current,
    );
  }

  function updateField(index: number, patch: Partial<BuilderField>) {
    setEditor((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field, fieldIndex) =>
              fieldIndex === index ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  }

  function removeField(index: number) {
    setEditor((current) =>
      current
        ? { ...current, fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index) }
        : current,
    );
  }

  async function saveForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    setEditorError(null);

    const title = editor.title.trim();
    const fields = editor.fields.map((field, index) => ({
      ...field,
      id: field.id || `field_${index + 1}`,
      label: field.label.trim(),
    }));
    if (!title) {
      setEditorError('Judul formulir wajib diisi.');
      return;
    }
    if (!fields.length || fields.some((field) => !field.label)) {
      setEditorError('Tambahkan minimal satu kolom dan isi semua label kolom.');
      return;
    }

    const body = {
      title,
      description: editor.description.trim(),
      schema: {
        version: '1.0',
        sections: [
          {
            id: 'sec_data',
            title: 'Data Pemohon',
            fields,
          },
        ],
      },
      settings: editor.settings,
    };

    setSaving(true);
    try {
      if (editor.id) {
        await apiFetch(`/forms/${editor.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/forms', {
          method: 'POST',
          body: JSON.stringify({ ...body, status: 'DRAFT' }),
        });
      }
      setEditor(null);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setEditorError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(form: FormSummary) {
    const nextStatus = form.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    setBusyId(form.id);
    setError(null);
    try {
      await apiFetch(`/forms/${form.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteForm() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    setError(null);
    try {
      await apiFetch(`/forms/${pendingDelete.id}`, { method: 'DELETE' });
      setPendingDelete(null);
      if (result?.items.length === 1 && page > 1) setPage(page - 1);
      else setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {isSuperAdmin ? 'Semua Formulir' : 'Formulir Saya'}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {isSuperAdmin
                  ? 'Lihat dan kelola formulir dari seluruh OPD. Formulir baru otomatis mengikuti OPD pada akun Anda.'
                  : 'Kelola formulir dan status publikasi milik OPD Anda.'}
              </p>
            </div>
          <button
            type="button"
            onClick={() => void openEditor()}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#FFE600] px-4 py-2.5 text-sm font-black shadow-[3px_3px_0px_#0F172A]"
          >
            <FilePlus2 className="h-4 w-4" />
            Buat formulir
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <section className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form onSubmit={submitSearch} className="flex min-w-[240px] flex-1 flex-wrap gap-2">
            <label className="sr-only" htmlFor="form-search">Cari formulir</label>
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border-2 border-slate-300 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="form-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama formulir..."
                className="w-full py-2.5 text-sm font-semibold outline-none"
              />
            </div>
            <button type="submit" className="cursor-pointer rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-black text-white">
              Cari
            </button>
          </form>
          <label className="flex items-center gap-2 text-xs font-black text-slate-600">
            Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            >
              <option value="">Semua status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Terbit</option>
              <option value="CLOSED">Ditutup</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat formulir...
          </div>
        ) : result?.items.length ? (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Nama formulir</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Respons</th>
                    <th className="px-3 py-3">Diperbarui</th>
                    <th className="px-3 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.items.map((form) => (
                    <tr key={form.id} className="align-middle">
                      <td className="max-w-[360px] px-3 py-4">
                        <p className="truncate text-sm font-black text-slate-900">{form.title}</p>
                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{form.slug}</p>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase ${statusStyle(form.status)}`}>
                          {STATUS_LABEL[form.status] ?? form.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm font-bold text-slate-700">
                        {form.total_responses.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                        {new Date(form.updated_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          {form.status === 'PUBLISHED' && (
                            <Link
                              href={`/f/${encodeURIComponent(form.slug)}`}
                              target="_blank"
                              className="cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                              aria-label={`Lihat ${form.title}`}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => void openEditor(form)}
                            disabled={busyId === form.id}
                            className="cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            aria-label={`Ubah ${form.title}`}
                          >
                            {busyId === form.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void changeStatus(form)}
                            disabled={busyId === form.id}
                            className="cursor-pointer rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {form.status === 'PUBLISHED' ? 'Tutup' : 'Terbitkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(form)}
                            disabled={busyId === form.id}
                            className="cursor-pointer rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            aria-label={`Hapus ${form.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-500">
                {result.total.toLocaleString('id-ID')} formulir
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black text-slate-700">Halaman {page} dari {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                  className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5"
                  aria-label="Muat ulang"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <FilePlus2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              {search || statusFilter ? 'Tidak ada formulir yang cocok.' : 'Belum ada formulir.'}
            </p>
            {!search && !statusFilter && (
              <p className="mt-1 text-xs font-semibold text-slate-500">Buat formulir pertama untuk OPD Anda.</p>
            )}
          </div>
        )}
      </section>

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-editor-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-slate-900 bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_#0F172A] sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="form-editor-title" className="text-xl font-black text-slate-900">
                  {editor.id ? 'Ubah formulir' : 'Buat formulir'}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Formulir baru disimpan sebagai draft. Anda dapat menerbitkannya setelah siap.
                </p>
              </div>
              <button type="button" onClick={() => setEditor(null)} aria-label="Tutup" className="cursor-pointer rounded-lg border-2 border-slate-300 p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {editorError && (
              <div role="alert" className="mt-4 rounded-lg border-2 border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {editorError}
              </div>
            )}

            <form onSubmit={(event) => void saveForm(event)} className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-black text-slate-700">
                Judul formulir
                <input
                  required
                  value={editor.title}
                  onChange={(event) => setEditor({ ...editor, title: event.target.value })}
                  className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-700"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-black text-slate-700">
                Deskripsi
                <textarea
                  rows={2}
                  value={editor.description}
                  onChange={(event) => setEditor({ ...editor, description: event.target.value })}
                  className="resize-y rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-700"
                />
              </label>

              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Kolom formulir</h3>
                  <p className="text-[10px] font-semibold text-slate-500">Tambahkan pertanyaan yang akan diisi pemohon.</p>
                </div>
                <button type="button" onClick={addField} className="cursor-pointer inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-[#A7F3D0] px-2.5 py-1.5 text-[11px] font-black">
                  <Plus className="h-3.5 w-3.5" />
                  Tambah kolom
                </button>
              </div>

              {editor.fields.length ? (
                <div className="flex flex-col gap-3">
                  {editor.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 sm:grid-cols-[1fr_150px_auto_auto] sm:items-end">
                      <label className="flex flex-col gap-1 text-[10px] font-black text-slate-500">
                        Label kolom
                        <input
                          value={field.label}
                          onChange={(event) => updateField(index, { label: event.target.value })}
                          placeholder="Contoh: Nama lengkap"
                          className="rounded-md border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-black text-slate-500">
                        Jenis kolom
                        <select
                          value={field.type}
                          onChange={(event) => updateField(index, { type: event.target.value })}
                          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-900"
                        >
                          {!['text', 'textarea', 'number', 'date'].includes(field.type) && (
                            <option value={field.type}>Jenis saat ini ({field.type})</option>
                          )}
                          <option value="text">Teks</option>
                          <option value="textarea">Teks panjang</option>
                          <option value="number">Angka</option>
                          <option value="date">Tanggal</option>
                        </select>
                      </label>
                      <label className="inline-flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) => updateField(index, { required: event.target.checked })}
                        />
                        Wajib
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        aria-label={`Hapus kolom ${field.label || index + 1}`}
                        className="cursor-pointer mb-1 rounded-md p-1.5 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border-2 border-dashed border-slate-300 py-6 text-center text-xs font-bold text-slate-500">
                  Belum ada kolom. Tambahkan setidaknya satu pertanyaan.
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setEditor(null)} className="cursor-pointer rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-600">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#059669] px-4 py-2 text-xs font-black text-white shadow-[2px_2px_0px_#0F172A] disabled:cursor-wait disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan formulir
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-form-title" className="w-full max-w-md rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0px_#0F172A]">
            <h2 id="delete-form-title" className="text-lg font-black text-slate-900">Hapus formulir?</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              “{pendingDelete.title}” akan dihapus permanen, termasuk seluruh responsnya. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="cursor-pointer rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-black">
                Batal
              </button>
              <button type="button" onClick={() => void deleteForm()} disabled={busyId === pendingDelete.id} className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-rose-800 bg-rose-700 px-4 py-2 text-xs font-black text-white disabled:opacity-60">
                {busyId === pendingDelete.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Hapus permanen
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
