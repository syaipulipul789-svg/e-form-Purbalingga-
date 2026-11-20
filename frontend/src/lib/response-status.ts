import type { ResponseStatus } from '@/types';

interface StatusMeta {
  label: string;
  className: string;
}

export const RESPONSE_STATUS_META: Record<ResponseStatus, StatusMeta> = {
  SUBMITTED: {
    label: 'Baru',
    className: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  VERIFIED: {
    label: 'Diverifikasi',
    className: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  APPROVED: {
    label: 'Disetujui',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};

export function responseStatusMeta(status?: string): StatusMeta {
  return (
    RESPONSE_STATUS_META[status as ResponseStatus] ?? {
      label: status || 'Baru',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
    }
  );
}
