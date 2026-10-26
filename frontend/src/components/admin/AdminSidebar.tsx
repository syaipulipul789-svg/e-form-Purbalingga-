'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BadgeCheck,
  Building2,
  ClipboardList,
  FilePlus2,
  Inbox,
  LayoutDashboard,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN_OPD', 'OPERATOR'],
  },
  {
    label: 'Formulir Saya',
    href: '/admin/forms',
    icon: FilePlus2,
    roles: ['SUPER_ADMIN', 'ADMIN_OPD', 'OPERATOR'],
  },
  {
    label: 'Respons Masuk',
    href: '/admin/responses',
    icon: Inbox,
    roles: ['SUPER_ADMIN', 'ADMIN_OPD', 'OPERATOR'],
  },
  {
    label: 'Verifikasi Berkas',
    href: '/admin/verifikasi',
    icon: BadgeCheck,
    roles: ['OPERATOR'],
    disabled: true,
  },
  {
    label: 'OPD & Pengguna',
    href: '/admin/opd',
    icon: Building2,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Monitoring Sistem',
    href: '/admin/monitoring',
    icon: Activity,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Audit Trail',
    href: '/admin/audit',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN'],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <nav className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0F172A] p-3 flex flex-col gap-1">
        <div className="px-2 pt-1 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Menu Navigasi
        </div>

        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const label =
            role === 'SUPER_ADMIN' && item.href === '/admin/forms'
              ? 'Semua Formulir'
              : item.label;

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="select-none flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold"
              >
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 uppercase">
                  <Lock className="w-2.5 h-2.5" />
                  Segera
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-extrabold transition-all ${
                isActive
                  ? 'bg-[#059669] text-white border-slate-900 shadow-[3px_3px_0px_#0F172A] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-slate-700 border-transparent hover:border-slate-900 hover:shadow-[2px_2px_0px_#0F172A] hover:text-slate-900'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}