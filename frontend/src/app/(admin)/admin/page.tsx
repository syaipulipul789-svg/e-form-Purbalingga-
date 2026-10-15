'use client';

import {
  Activity,
  Building2,
  ClipboardList,
  FilePlus2,
  FileText,
  Inbox,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import StatCard from '@/components/admin/StatCard';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OPD: 'Admin OPD',
  OPERATOR: 'Operator',
};

function RoleBadge({ role }: { role: string }) {
  const style =
    role === 'SUPER_ADMIN'
      ? 'bg-[#FFE600] text-slate-900'
      : role === 'ADMIN_OPD'
        ? 'bg-[#A7F3D0] text-emerald-950'
        : 'bg-[#38BDF8] text-slate-900';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-slate-900 rounded-md font-black text-[11px] uppercase tracking-wide shadow-[2px_2px_0px_#0F172A] ${style}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <>
      {/* Welcome Hero */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#0F172A] flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#059669]">
              Selamat Datang Kembali
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1">
              {user.nama}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {user.opd ? user.opd.nama_opd : 'Dinas Komunikasi dan Informatika'}
            </p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <div className="p-4 bg-[#F0FDF4] border-2 border-slate-900 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
            Fondasi panel admin telah aktif: autentikasi JWT, proteksi peran (RBAC), dan dashboard
            per-role. Modul <span className="font-black">Formulir</span>,{' '}
            <span className="font-black">Respons</span>, dan{' '}
            <span className="font-black">Kelola OPD</span> sedang dalam tahap pengembangan lanjutan.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {isSuperAdmin ? (
          <>
            <StatCard
              label="Total OPD Terdaftar"
              value="3"
              note="Data contoh dari seed awal"
              icon={Building2}
              accent="bg-[#A7F3D0]"
            />
            <StatCard
              label="Total Pengguna Aktif"
              value="3"
              note="Super Admin + Admin OPD"
              icon={Users}
              accent="bg-[#38BDF8]"
            />
            <StatCard
              label="Total Formulir"
              value="1"
              note="Formulir contoh bansos UMKM"
              icon={FileText}
              accent="bg-[#DDD6FE]"
            />
            <StatCard
              label="Wilayah Sidami"
              value="18"
              note="Kecamatan terhubung live"
              icon={Activity}
              accent="bg-[#FFE600]"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Formulir Saya"
              value="1"
              note="Formulir contoh bansos UMKM"
              icon={FilePlus2}
              accent="bg-[#FFE600]"
            />
            <StatCard
              label="Total Respons Masuk"
              value="0"
              note="Menunggu responden pertama"
              icon={Inbox}
              accent="bg-[#A7F3D0]"
            />
            <StatCard
              label="Kecamatan Terhubung"
              value="18"
              note="Data live API Sidami"
              icon={Activity}
              accent="bg-[#38BDF8]"
            />
            <StatCard
              label="Kuota Respon"
              value="1.000"
              note="Maksimum pada form contoh"
              icon={ClipboardList}
              accent="bg-[#FED7AA]"
            />
          </>
        )}
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <div className="border-b-2 border-slate-900 pb-2">
          <h2 className="text-lg font-black text-slate-900">Aksi Cepat</h2>
          <p className="text-xs font-bold text-slate-500">
            Fitur ini akan aktif pada modul pengembangan berikutnya
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isSuperAdmin ? (
            <>
              <QuickAction icon={Building2} title="Kelola OPD" desc="Tambah/ubah instansi OPD" accent="bg-[#A7F3D0]" />
              <QuickAction icon={Users} title="Kelola Pengguna" desc="Atur akun Admin OPD" accent="bg-[#38BDF8]" />
              <QuickAction icon={ClipboardList} title="Audit Aktivitas" desc="Pantau jejak sistem" accent="bg-[#DDD6FE]" />
            </>
          ) : (
            <>
              <QuickAction icon={FilePlus2} title="Buat Formulir" desc="Rakit form baru dinas Anda" accent="bg-[#FFE600]" />
              <QuickAction icon={Inbox} title="Lihat Respons" desc="Cek isian warga masuk" accent="bg-[#A7F3D0]" />
              <QuickAction icon={ClipboardList} title="Ekspor Data" desc="Unduh Excel / CSV" accent="bg-[#38BDF8]" />
            </>
          )}
        </div>
      </section>

      {/* Upcoming modules */}
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#059669]" />
          <h3 className="font-black text-base text-slate-900">Modul Berikutnya</h3>
        </div>
        <div className="flex flex-col gap-2 text-xs font-bold text-slate-600">
          <p>1. CRUD Formulir & Form Builder drag-and-drop untuk Admin OPD</p>
          <p>2. Manajemen OPD & akun Admin OPD untuk Super Admin</p>
          <p>3. Tabel Respons, verifikasi berkas, dan ekspor Excel/CSV</p>
        </div>
      </section>
    </>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof FilePlus2;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="cursor-pointer text-left bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3 opacity-80"
    >
      <span className={`w-10 h-10 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A] ${accent}`}>
        <Icon className="w-5 h-5 text-slate-900" />
      </span>
      <div>
        <p className="font-black text-sm text-slate-900">{title}</p>
        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="inline-flex w-fit text-[9px] font-black bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 uppercase tracking-wider text-slate-400">
        Segera hadir
      </span>
    </button>
  );
}