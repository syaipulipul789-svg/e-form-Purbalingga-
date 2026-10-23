import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FormStatus, VerificationStatus } from '@/lib/api';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatDateTime(value?: string | null): string {
  return formatDate(value, true);
}

export function toDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export const FORM_STATUS_LABEL: Record<FormStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasikan',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
};

export const FORM_STATUS_STYLE: Record<FormStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PUBLISHED: 'bg-emerald-200 text-emerald-950',
  CLOSED: 'bg-orange-200 text-orange-950',
  ARCHIVED: 'bg-purple-200 text-purple-950',
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  PENDING: 'Menunggu',
  ACCEPTED: 'Diterima',
  REJECTED: 'Ditolak',
  REVISION: 'Perlu Revisi',
};

export const VERIFICATION_STYLE: Record<VerificationStatus, string> = {
  PENDING: 'bg-amber-200 text-amber-950',
  ACCEPTED: 'bg-emerald-200 text-emerald-950',
  REJECTED: 'bg-rose-200 text-rose-950',
  REVISION: 'bg-sky-200 text-sky-950',
};

export const FIELD_TYPE_LABEL: Record<string, string> = {
  text: 'Teks Singkat',
  textarea: 'Teks Panjang',
  number: 'Angka',
  currency_idr: 'Rupiah',
  email: 'Email',
  nik: 'NIK',
  select: 'Dropdown',
  radio: 'Pilihan Tunggal',
  checkbox: 'Pilihan Ganda / Centang',
  date: 'Tanggal',
  time: 'Waktu',
  datetime: 'Tanggal & Waktu',
  file_upload: 'Unggah Berkas',
  regional_purbalingga: 'Wilayah Purbalingga',
  rating: 'Rating',
  linear_scale: 'Skala Linear',
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function truncate(value: string, length = 80): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}
