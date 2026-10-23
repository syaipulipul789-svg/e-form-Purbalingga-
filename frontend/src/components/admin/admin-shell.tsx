'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/components/admin/auth-provider';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/forms', label: 'Formulir', icon: FileText, exact: false },
  { href: '/admin/forms/new', label: 'Buat Formulir', icon: PlusCircle, exact: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-slate-900 bg-[#FFE600] p-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-sm font-black shadow-brutal-sm">
            PBG
          </span>
          <span>
            <span className="block text-base font-black leading-tight text-slate-900">
              E-Form Admin
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Kab. Purbalingga
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Menu Utama
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-sm font-extrabold transition-all',
                active
                  ? 'border-slate-900 bg-[#FFE600] text-slate-900 shadow-brutal-xs'
                  : 'border-transparent text-slate-600 hover:border-slate-900 hover:bg-white hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active ? <ChevronRight className="h-4 w-4" /> : null}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Tautan Publik
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-2.5 text-sm font-extrabold text-slate-600 transition-all hover:border-slate-900 hover:bg-white hover:text-slate-900"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="flex-1">Buka Portal Publik</span>
          </Link>
        </div>
      </nav>

      <div className="border-t-2 border-slate-900 bg-white p-4">
        <div className="mb-3 flex items-start gap-3 rounded-lg border-2 border-slate-900 bg-[#FFFDF5] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#A7F3D0]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-900">{user?.nama}</p>
            <p className="truncate text-[11px] font-semibold text-slate-500">{user?.email}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              <Building2 className="h-3 w-3" />
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.opd?.singkatan || 'Admin OPD'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-brutal-xs transition-all hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Keluar dari Portal
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r-2 border-slate-900 bg-[#FFFDF5] lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r-2 border-slate-900 bg-[#FFFDF5] shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md border-2 border-slate-900 bg-white p-1.5"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b-2 border-slate-900 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border-2 border-slate-900 bg-[#FFE600] p-2 shadow-brutal-xs lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Portal Admin OPD
              </p>
              <p className="truncate text-sm font-extrabold text-slate-900">
                Sistem Formulir Digital Terpadu
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border-2 border-slate-900 bg-[#F0FDF4] px-3 py-1.5 text-xs font-black sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sesi Aktif
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-center text-[11px] font-semibold text-slate-500 sm:px-6">
          E-Form Kabupaten Purbalingga · Dinas Komunikasi dan Informatika
        </footer>
      </div>
    </div>
  );
}
