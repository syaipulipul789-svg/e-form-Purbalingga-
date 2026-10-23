'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Loader2,
  Printer,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import PurbalinggaRegionalSelect, {
  type RegionalValue,
} from '@/components/regional/PurbalinggaRegionalSelect';
import {
  ApiRequestError,
  errorMessage,
  formatSubmittedAt,
  getPublicForm,
  resolveFileUrl,
  submitPublicForm,
  uploadSubmissionFile,
  type FormField,
  type FormSchema,
  type PublicForm,
} from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';

interface SelectedFile {
  file: File;
  preview?: string;
}

interface SubmittedState {
  registrationNumber: string;
  submittedAt: string;
}

function normalizeSchema(raw: unknown): FormSchema {
  const parsed = raw as Partial<FormSchema> | null;
  if (!parsed || !Array.isArray(parsed.sections)) return { sections: [] };
  return {
    version: parsed.version ?? 1,
    sections: parsed.sections.map((section, index) => ({
      id: section.id || `s${index + 1}`,
      title: section.title || `Bagian ${index + 1}`,
      description: section.description || '',
      fields: Array.isArray(section.fields)
        ? section.fields.map((field) => ({
            ...field,
            required: Boolean(field.required),
            options: Array.isArray(field.options) ? field.options : [],
          }))
        : [],
    })),
  };
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return !value;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function fieldSpan(field: FormField): string {
  if (['textarea', 'regional_purbalingga', 'file_upload'].includes(field.type)) {
    return 'sm:col-span-2';
  }
  if (field.type === 'radio' || field.type === 'checkbox') return 'sm:col-span-2';
  return '';
}

function validateField(field: FormField, value: unknown): string | null {
  if (field.required && isEmpty(value)) return 'Field ini wajib diisi';
  if (isEmpty(value)) return null;

  switch (field.type) {
    case 'nik': {
      const text = String(value).trim();
      if (!/^3303\d{12}$/.test(text)) {
        return 'NIK harus 16 digit dan diawali kode Purbalingga 3303';
      }
      return null;
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? null : 'Format email tidak valid';
    case 'number':
    case 'currency_idr': {
      if (Number.isNaN(Number(String(value).replace(/\./g, '')))) return 'Nilai harus berupa angka';
      return null;
    }
    case 'regional_purbalingga': {
      const region = value as RegionalValue;
      if (!region?.kode_kec || !region?.kode_desa) return 'Kecamatan dan desa wajib dipilih';
      return null;
    }
    case 'file_upload': {
      const file = value as { file_url?: string };
      if (!file?.file_url) return 'Berkas belum berhasil diunggah';
      return null;
    }
    case 'rating':
    case 'linear_scale': {
      const number = Number(value);
      const min = field.config?.min ?? 1;
      const max = field.config?.max ?? 5;
      if (Number.isNaN(number) || number < min || number > max) return `Nilai harus antara ${min} dan ${max}`;
      return null;
    }
    default: {
      if (field.validation?.minLength && String(value).trim().length < field.validation.minLength) {
        return `Minimal ${field.validation.minLength} karakter`;
      }
      if (field.validation?.maxLength && String(value).trim().length > field.validation.maxLength) {
        return `Maksimal ${field.validation.maxLength} karakter`;
      }
      return null;
    }
  }
}

export default function DynamicPublicFormPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [publicForm, setPublicForm] = useState<PublicForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, SelectedFile>>({});
  const [respondentNik, setRespondentNik] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [unavailable, setUnavailable] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);

  const schema = useMemo(() => normalizeSchema(publicForm?.schema), [publicForm]);
  const fields = useMemo(() => schema.sections.flatMap((section) => section.fields), [schema]);
  const nikField = useMemo(
    () => fields.find((field) => field.type === 'nik') || fields.find((field) => field.id === 'f_nik'),
    [fields]
  );
  const needsRespondentNik =
    Boolean(publicForm?.settings?.require_nik) && !nikField;

  const isClosed = publicForm ? !publicForm.is_open : false;

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicForm(slug)
      .then((data) => {
        if (!active) return;
        setPublicForm(data);
        if (!data.is_open) {
          setUnavailable(data.closed_reason || 'Formulir sedang tidak menerima respons.');
        }
      })
      .catch((err) => {
        if (!active) return;
        setUnavailable(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!publicForm || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`eform_draft_${slug}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setAnswers((current) => ({ ...parsed, ...current }));
    } catch {
      // Draft tidak valid diabaikan.
    }
  }, [publicForm, slug]);

  useEffect(() => {
    if (!publicForm || typeof window === 'undefined' || submitted) return;
    try {
      localStorage.setItem(`eform_draft_${slug}`, JSON.stringify(answers));
    } catch {
      // Penyimpanan lokal tidak tersedia.
    }
  }, [answers, publicForm, slug, submitted]);

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  };

  const setFile = (field: FormField, file: File | null) => {
    setErrors((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });

    if (!file) {
      setFiles((current) => {
        const next = { ...current };
        delete next[field.id];
        return next;
      });
      setAnswers((current) => {
        const next = { ...current };
        delete next[field.id];
        return next;
      });
      return;
    }

    const maxMB = field.validation?.maxSizeInMB || 5;
    if (file.size > maxMB * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        [field.id]: `Ukuran berkas maksimal ${maxMB} MB`,
      }));
      return;
    }

    const extensions = field.validation?.allowedExtensions || [];
    if (extensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!extensions.map((item) => item.toLowerCase()).includes(extension)) {
        setErrors((current) => ({
          ...current,
          [field.id]: `Format berkas harus ${extensions.join(', ')}`,
        }));
        return;
      }
    }

    setFiles((current) => ({
      ...current,
      [field.id]: {
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      },
    }));
    setAnswers((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'file_upload' && files[field.id]) continue;
      const issue = validateField(field, answers[field.id]);
      if (issue) nextErrors[field.id] = issue;
    }
    if (needsRespondentNik && !/^3303\d{12}$/.test(respondentNik.trim())) {
      nextErrors.respondent_nik = 'NIK harus 16 digit dan diawali kode Purbalingga 3303';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = fields.find((field) => nextErrors[field.id]);
      const targetId = first ? `field-${first.id}` : 'field-respondent_nik';
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicForm || submitting || isClosed) return;
    setSubmitError('');
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      const finalAnswers: Record<string, unknown> = { ...answers };
      for (const field of fields) {
        if (field.type !== 'file_upload') continue;
        const selected = files[field.id];
        if (!selected) continue;
        setUploadMessage(`Mengunggah ${field.label}…`);
        const uploaded = await uploadSubmissionFile(selected.file);
        finalAnswers[field.id] = {
          file_id: uploaded.file_id,
          file_url: uploaded.file_url,
          original_name: uploaded.original_name,
          mime_type: uploaded.mime_type,
          file_size: uploaded.file_size,
        };
      }

      const nik = nikField ? String(finalAnswers[nikField.id] || '') : respondentNik.trim();

      setUploadMessage('Menyimpan formulir…');
      const result = await submitPublicForm(
        slug,
        nik,
        finalAnswers,
        crypto.randomUUID()
      );

      try {
        localStorage.removeItem(`eform_draft_${slug}`);
      } catch {
        // abaikan
      }

      setSubmitted({
        registrationNumber: result.registration_number,
        submittedAt: result.submitted_at,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(errorMessage(err));
      if (err instanceof ApiRequestError && Array.isArray(err.details)) {
        const nextErrors: Record<string, string> = {};
        for (const detail of err.details as Array<{ field?: string; issue?: string }>) {
          if (detail.field) nextErrors[detail.field] = detail.issue || 'Isian tidak valid';
        }
        if (Object.keys(nextErrors).length > 0) setErrors(nextErrors);
      }
    } finally {
      setSubmitting(false);
      setUploadMessage('');
    }
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id];
    const error = errors[field.id];
    const commonClass = cn('input-brutal', error && 'border-rose-600 focus:ring-rose-500');

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={`input-${field.id}`}
            rows={4}
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            placeholder={field.placeholder}
            className={cn(commonClass, 'resize-y')}
          />
        );
      case 'select':
        return (
          <select
            id={`input-${field.id}`}
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            className={commonClass}
          >
            <option value="">{field.placeholder || '-- Pilih --'}</option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {(field.options || []).map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border-2 bg-white px-3 py-2.5 text-sm font-bold transition-all',
                  value === option.value
                    ? 'border-slate-900 bg-[#FFE600] shadow-brutal-xs'
                    : 'border-slate-300 hover:border-slate-900'
                )}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => setAnswer(field.id, option.value)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      case 'checkbox': {
        if (!field.options || field.options.length === 0) {
          return (
            <label className="flex items-start gap-3 rounded-lg border-2 border-slate-900 bg-[#F0FDF4] px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => setAnswer(field.id, event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm font-bold text-slate-800">
                {field.placeholder || field.label}
                {field.required ? <span className="text-rose-600"> *</span> : null}
              </span>
            </label>
          );
        }
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {(field.options || []).map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border-2 bg-white px-3 py-2.5 text-sm font-bold transition-all',
                  selected.includes(option.value)
                    ? 'border-slate-900 bg-[#FFE600] shadow-brutal-xs'
                    : 'border-slate-300 hover:border-slate-900'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value);
                    setAnswer(field.id, next);
                  }}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      }
      case 'number':
        return (
          <input
            id={`input-${field.id}`}
            type="number"
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min ?? undefined}
            max={field.validation?.max ?? undefined}
            className={commonClass}
          />
        );
      case 'currency_idr': {
        const raw = String(value || '').replace(/\D/g, '');
        const formatted = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        return (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
              Rp
            </span>
            <input
              id={`input-${field.id}`}
              inputMode="numeric"
              value={formatted}
              onChange={(event) => setAnswer(field.id, event.target.value.replace(/\D/g, ''))}
              placeholder={field.placeholder || '0'}
              className={cn(commonClass, 'pl-10')}
            />
          </div>
        );
      }
      case 'date':
      case 'time':
      case 'datetime':
        return (
          <input
            id={`input-${field.id}`}
            type={field.type === 'datetime' ? 'datetime-local' : field.type}
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            className={commonClass}
          />
        );
      case 'nik':
        return (
          <input
            id={`input-${field.id}`}
            inputMode="numeric"
            maxLength={16}
            value={String(value || '')}
            onChange={(event) =>
              setAnswer(field.id, event.target.value.replace(/\D/g, '').slice(0, 16))
            }
            placeholder={field.placeholder || '16 digit NIK Purbalingga'}
            className={cn(commonClass, 'font-mono tracking-wider')}
          />
        );
      case 'email':
        return (
          <input
            id={`input-${field.id}`}
            type="email"
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            placeholder={field.placeholder}
            className={commonClass}
          />
        );
      case 'regional_purbalingga':
        return (
          <PurbalinggaRegionalSelect
            required={field.required}
            value={(value as RegionalValue) || {}}
            onChange={(regional) => setAnswer(field.id, regional)}
          />
        );
      case 'rating':
      case 'linear_scale': {
        const min = field.config?.min ?? 1;
        const max = field.config?.max ?? 5;
        const options = Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
        return (
          <div className="flex flex-wrap items-center gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAnswer(field.id, option)}
                className={cn(
                  'flex h-11 min-w-11 items-center justify-center rounded-lg border-2 px-3 text-sm font-black transition-all',
                  Number(value) === option
                    ? 'border-slate-900 bg-[#FFE600] shadow-brutal-xs'
                    : 'border-slate-300 bg-white hover:border-slate-900'
                )}
                aria-label={`Nilai ${option}`}
              >
                {option}
              </button>
            ))}
            {field.config?.min !== undefined || field.config?.max !== undefined ? (
              <span className="text-[10px] font-bold text-slate-400">
                Skala {min}–{max}
              </span>
            ) : null}
          </div>
        );
      }
      case 'file_upload': {
        const selected = files[field.id];
        const uploaded = value as { file_url?: string; original_name?: string } | undefined;
        const extensions = field.validation?.allowedExtensions || [];
        return (
          <div className="rounded-lg border-2 border-dashed border-slate-400 bg-white p-4">
            <input
              id={`input-${field.id}`}
              type="file"
              accept={extensions.map((extension) => `.${extension}`).join(',') || undefined}
              onChange={(event) => setFile(field, event.target.files?.[0] || null)}
              className="block w-full text-xs font-semibold text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-2 file:border-slate-900 file:bg-[#FFE600] file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-900"
            />
            <p className="mt-2 text-[10px] font-semibold text-slate-400">
              Maksimal {field.validation?.maxSizeInMB || 5} MB
              {extensions.length ? ` · Format: ${extensions.join(', ')}` : ''}
            </p>

            {selected ? (
              <div className="mt-3 flex items-center gap-2 rounded-md border-2 border-slate-900 bg-[#F0FDF4] px-3 py-2">
                {selected.preview ? (
                  <img
                    src={selected.preview}
                    alt="Pratinjau berkas"
                    className="h-10 w-10 rounded border border-slate-300 object-cover"
                  />
                ) : (
                  <FileText className="h-5 w-5 text-emerald-700" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{selected.file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(field, null)}
                  className="rounded border border-slate-300 p-1 text-rose-600"
                  aria-label="Hapus berkas"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : uploaded?.file_url ? (
              <a
                href={resolveFileUrl(uploaded.file_url)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 underline"
              >
                Berkas tersimpan
              </a>
            ) : null}
          </div>
        );
      }
      default:
        return (
          <input
            id={`input-${field.id}`}
            type="text"
            value={String(value || '')}
            onChange={(event) => setAnswer(field.id, event.target.value)}
            placeholder={field.placeholder}
            className={commonClass}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] p-6">
        <div className="card-brutal flex items-center gap-3 px-6 py-5">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-black">Memuat formulir…</span>
        </div>
      </div>
    );
  }

  if (!publicForm || unavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] bg-brutal-grid p-6">
        <div className="w-full max-w-md rounded-2xl border-2 border-slate-900 bg-white p-8 text-center shadow-brutal-lg">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-900 bg-[#FED7AA] shadow-brutal-sm">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-black">Formulir Tidak Tersedia</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {unavailable || 'Formulir belum dipublikasikan atau tidak ditemukan.'}
          </p>
          <Link href="/" className="btn-brutal-emerald mt-6 justify-center">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal Publik
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] bg-brutal-grid p-6">
        <div className="w-full max-w-xl rounded-2xl border-2 border-slate-900 bg-white p-8 text-center shadow-brutal-lg">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-900 bg-[#A7F3D0] shadow-brutal">
            <CheckCircle2 className="h-8 w-8 text-emerald-800" />
          </span>
          <h1 className="mt-5 text-2xl font-black">Formulir Berhasil Dikirim</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Terima kasih. Simpan nomor registrasi berikut untuk melacak layanan Anda.
          </p>

          <div className="mt-6 rounded-xl border-2 border-slate-900 bg-[#FEFCE8] p-5 shadow-brutal-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Nomor Registrasi
            </p>
            <p className="mt-1 font-mono text-2xl font-black tracking-tight">
              {submitted.registrationNumber}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Dikirim {formatSubmittedAt(submitted.submittedAt)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.print()} className="btn-brutal-white">
              <Printer className="h-4 w-4" />
              Cetak Bukti
            </button>
            <Link href="/" className="btn-brutal-emerald justify-center">
              Kembali ke Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-900">
      <div className="bg-[#FFE600] px-4 py-2.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] font-black">
          <span>PEMERINTAH KABUPATEN PURBALINGGA</span>
          <span className="hidden text-slate-700 sm:block">PORTAL FORMULIR DIGITAL TERPADU</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b-2 border-slate-900 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#059669] text-xs font-black text-white shadow-brutal-xs">
              PBG
            </span>
            <span className="font-black tracking-tight">E-Form Purbalingga</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black shadow-brutal-xs hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Semua Formulir
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-brutal-lg">
          {publicForm.banner_url ? (
            <img
              src={resolveFileUrl(publicForm.banner_url)}
              alt=""
              className="h-40 w-full border-b-2 border-slate-900 object-cover sm:h-56"
            />
          ) : (
            <div className="flex h-24 items-center justify-between gap-3 border-b-2 border-slate-900 bg-[#059669] px-5 text-white sm:h-28 sm:px-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">
                  Formulir Layanan Publik
                </p>
                <p className="mt-1 text-sm font-bold">Pemerintah Kabupaten Purbalingga</p>
              </div>
              <ShieldCheck className="h-10 w-10 text-emerald-200" />
            </div>
          )}

          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {publicForm.opd ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-slate-900 bg-[#E0F2FE] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">
                  <Building2 className="h-3.5 w-3.5" />
                  {publicForm.opd.singkatan || publicForm.opd.nama_opd}
                </span>
              ) : null}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border-2 border-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                  isClosed ? 'bg-rose-200' : 'bg-emerald-200'
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {isClosed ? 'Ditutup' : 'Menerima Respons'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-slate-900 bg-white px-2.5 py-1 text-[10px] font-black">
                <Users className="h-3.5 w-3.5" />
                {formatNumber(publicForm.total_responses)} respons
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {publicForm.title}
            </h1>
            {publicForm.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-600">
                {publicForm.description}
              </p>
            ) : null}

            {publicForm.end_date ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" />
                Batas pengisian: {formatSubmittedAt(publicForm.end_date)}
              </p>
            ) : null}
          </div>
        </section>

        {isClosed ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border-2 border-rose-900 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {unavailable || publicForm.closed_reason || 'Formulir sedang tidak menerima respons.'}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {needsRespondentNik ? (
            <section
              id="field-respondent_nik"
              className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-brutal sm:p-6"
            >
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#FECDD3] text-xs font-black shadow-brutal-xs">
                  ID
                </span>
                <div>
                  <h2 className="text-lg font-black">Identitas Responden</h2>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                    Formulir ini mewajibkan NIK KTP Purbalingga.
                  </p>
                </div>
              </div>
              <label htmlFor="input-respondent_nik" className="mb-1.5 flex items-center gap-1 text-xs font-black text-slate-800">
                NIK Responden <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-respondent_nik"
                value={respondentNik}
                onChange={(event) => {
                  setRespondentNik(event.target.value.replace(/\D/g, '').slice(0, 16));
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.respondent_nik;
                    return next;
                  });
                }}
                inputMode="numeric"
                maxLength={16}
                placeholder="16 digit NIK diawali 3303"
                className={cn('input-brutal', errors.respondent_nik && 'border-rose-600 focus:ring-rose-500')}
              />
              {errors.respondent_nik ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-700">
                  <AlertCircle className="h-3 w-3" />
                  {errors.respondent_nik}
                </p>
              ) : null}
            </section>
          ) : null}
          {schema.sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-brutal sm:p-6"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#FFE600] text-xs font-black shadow-brutal-xs">
                  {sectionIndex + 1}
                </span>
                <div>
                  <h2 className="text-lg font-black">{section.title}</h2>
                  {section.description ? (
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                      {section.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.id} id={`field-${field.id}`} className={fieldSpan(field)}>
                    <label
                      htmlFor={`input-${field.id}`}
                      className="mb-1.5 flex items-start gap-1 text-xs font-black text-slate-800"
                    >
                      <span>
                        {field.label}
                        {field.required ? <span className="text-rose-600"> *</span> : null}
                      </span>
                    </label>
                    {field.helpText ? (
                      <p className="mb-1.5 flex items-start gap-1 text-[10px] font-semibold leading-relaxed text-slate-400">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                        {field.helpText}
                      </p>
                    ) : null}
                    {renderField(field)}
                    {errors[field.id] ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-700">
                        <AlertCircle className="h-3 w-3" />
                        {errors[field.id]}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {section.fields.length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-center text-xs font-semibold text-slate-500">
                  Bagian ini belum memiliki field.
                </p>
              ) : null}
            </section>
          ))}

          {submitError ? (
            <div className="flex items-start gap-3 rounded-xl border-2 border-rose-900 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          ) : null}

          <section className="rounded-2xl border-2 border-slate-900 bg-[#FEFCE8] p-5 shadow-brutal">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p className="text-xs font-semibold leading-relaxed text-slate-600">
                Pastikan seluruh data yang Anda isi benar dan dapat dipertanggungjawabkan. Data
                pribadi hanya digunakan untuk keperluan layanan OPD terkait.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting || isClosed || schema.sections.length === 0}
              className="btn-brutal-emerald mt-5 w-full justify-center py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadMessage || 'Mengirim formulir…'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Kirim Formulir
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
              Nomor registrasi akan ditampilkan setelah pengiriman berhasil.
            </p>
          </section>
        </form>
      </main>

      <footer className="border-t-2 border-slate-900 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-center text-[10px] font-semibold text-slate-500 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} Pemerintah Kabupaten Purbalingga</span>
          <span>Dinas Komunikasi dan Informatika · E-Form Terpadu</span>
        </div>
      </footer>
    </div>
  );
}
