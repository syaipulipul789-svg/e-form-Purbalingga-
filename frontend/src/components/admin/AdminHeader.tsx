'use client';

import Link from 'next/link';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'SUPER ADMIN',
  ADMIN_OPD: 'ADMIN OPD',
  OPERATOR: 'OPERATOR',
};

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-[#FFE600] text-slate-900',
  ADMIN_OPD: 'bg-[#A7F3D0] text-emerald-950',
  OPERATOR: 'bg-[#38BDF8] text-slate-900',
};

export default function AdminHeader() {
  const { user, logout } = useAuth();

  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : '';
  const roleStyle = user ? (ROLE_STYLE[user.role] ?? 'bg-white') : '';

  return (
    <header className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0F172A] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="cursor-pointer w-10 h-10 bg-[#059669] border-2 border-slate-900 rounded-xl flex items-center justify-center text-white font-black text-base shadow-[3px_3px_0px_#0F172A] hover:rotate-3 transition-transform flex-shrink-0"
        >
          PBG
        </Link>
        <div className="min-w-0">
          <p className="font-black text-sm text-slate-900 leading-tight truncate">
            E-Form Purbalingga
          </p>
          <p className="text-[11px] font-bold text-slate-500 truncate">
            Panel Admin {user?.opd?.nama_opd ?? '…'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5 pr-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-slate-900 leading-tight truncate max-w-[180px]">
                {user.nama}
              </span>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">
                {user.email}
              </span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-slate-900 text-[10px] font-black shadow-[2px_2px_0px_#0F172A] ${roleStyle}`}>
              <ShieldCheck className="w-3 h-3" />
              {roleLabel}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-rose-700 bg-white border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] hover:bg-rose-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#0F172A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}