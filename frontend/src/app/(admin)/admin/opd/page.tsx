'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import type { AdminOPD, AdminUser } from '@/types';

type OPDForm = Pick<AdminOPD, 'kode_opd' | 'nama_opd' | 'singkatan' | 'logo_url'>;
type UserForm = {
  opd_id: string;
  nama: string;
  email: string;
  role: 'ADMIN_OPD' | 'OPERATOR';
  password: string;
};

const emptyOPDForm = (): OPDForm => ({
  kode_opd: '',
  nama_opd: '',
  singkatan: '',
  logo_url: '',
});
const emptyUserForm = (): UserForm => ({
  opd_id: '',
  nama: '',
  email: '',
  role: 'ADMIN_OPD',
  password: '',
});

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Terjadi kesalahan pada pengelolaan OPD dan pengguna.';
}

export default function AdminOPDPage() {
  const [opds, setOpds] = useState<AdminOPD[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opdDialog, setOpdDialog] = useState(false);
  const [editingOpd, setEditingOpd] = useState<AdminOPD | null>(null);
  const [opdForm, setOpdForm] = useState<OPDForm>(emptyOPDForm);
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [opdSearch, setOpdSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const loadManagementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [opdData, userData] = await Promise.all([
        apiFetch<AdminOPD[]>('/admin/superadmin/opds'),
        apiFetch<AdminUser[]>('/admin/superadmin/users'),
      ]);
      setOpds(opdData);
      setUsers(userData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadManagementData();
  }, [loadManagementData, refreshKey]);

  function openOPDDialog(opd?: AdminOPD) {
    setEditingOpd(opd ?? null);
    setOpdForm(opd
      ? {
          kode_opd: opd.kode_opd,
          nama_opd: opd.nama_opd,
          singkatan: opd.singkatan ?? '',
          logo_url: opd.logo_url ?? '',
        }
      : emptyOPDForm());
    setOpdDialog(true);
  }

  async function saveOPD(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = JSON.stringify({
      ...opdForm,
      singkatan: opdForm.singkatan?.trim() || null,
      logo_url: opdForm.logo_url?.trim() || null,
    });
    try {
      await apiFetch(
        editingOpd
          ? `/admin/superadmin/opds/${editingOpd.id}`
          : '/admin/superadmin/opds',
        { method: editingOpd ? 'PUT' : 'POST', body },
      );
      setOpdDialog(false);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openUserDialog(user?: AdminUser) {
    setEditingUser(user ?? null);
    setUserForm(user
      ? {
          opd_id: user.opd_id ?? '',
          nama: user.nama,
          email: user.email,
          role: user.role,
          password: '',
        }
      : { ...emptyUserForm(), opd_id: opds[0]?.id ?? '' });
    setUserDialog(true);
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = JSON.stringify({
      opd_id: userForm.opd_id,
      nama: userForm.nama,
      email: userForm.email,
      role: userForm.role,
      password: userForm.password,
    });
    try {
      await apiFetch(
        editingUser
          ? `/admin/superadmin/users/${editingUser.id}`
          : '/admin/superadmin/users',
        { method: editingUser ? 'PUT' : 'POST', body },
      );
      setUserDialog(false);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserStatus(user: AdminUser) {
    setError(null);
    try {
      await apiFetch(`/admin/superadmin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const filteredOPDs = opds.filter((opd) =>
    `${opd.kode_opd} ${opd.nama_opd} ${opd.singkatan ?? ''}`.toLowerCase().includes(opdSearch.toLowerCase()),
  );
  const filteredUsers = users.filter((user) =>
    `${user.nama} ${user.email} ${user.opd_name ?? ''} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <>
      <section className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">OPD & Pengguna</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Atur data OPD dan akun admin/operator di seluruh Kabupaten Purbalingga.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0px_#0F172A] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="text-base font-black text-slate-900">Organisasi Perangkat Daerah</h2>
              <p className="text-[11px] font-semibold text-slate-500">{opds.length} OPD terdaftar</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Cari OPD"
              value={opdSearch}
              onChange={(event) => setOpdSearch(event.target.value)}
              placeholder="Cari OPD..."
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-700"
            />
            <button type="button" onClick={() => openOPDDialog()} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-900 bg-[#A7F3D0] px-3 py-2 text-xs font-black">
              <Plus className="h-4 w-4" /> Tambah OPD
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat data...
          </div>
        ) : filteredOPDs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-white text-[10px] font-black uppercase tracking-wide text-slate-500">
                <tr className="border-b-2 border-slate-900">
                  <th className="px-4 py-3">OPD</th>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Formulir</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOPDs.map((opd) => (
                  <tr key={opd.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-slate-900">{opd.nama_opd}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{opd.kode_opd}{opd.singkatan ? ` · ${opd.singkatan}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{opd.total_users}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{opd.total_forms}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openOPDDialog(opd)} aria-label={`Ubah ${opd.nama_opd}`} className="cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm font-bold text-slate-500">{opdSearch ? 'OPD tidak ditemukan.' : 'Belum ada OPD.'}</p>
        )}
        <p className="border-t border-slate-200 bg-amber-50 px-4 py-2 text-[10px] font-semibold text-amber-900">
          OPD tidak dapat dihapus dari halaman ini agar formulir dan data historis tetap terjaga.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[5px_5px_0px_#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sky-700" />
            <div>
              <h2 className="text-base font-black text-slate-900">Akun Pengguna</h2>
              <p className="text-[11px] font-semibold text-slate-500">{users.length} akun · Super Admin tidak ditampilkan untuk perubahan</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Cari pengguna"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Cari nama, email, OPD..."
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-sky-700"
            />
            <button type="button" disabled={!opds.length} onClick={() => openUserDialog()} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-900 bg-[#BAE6FD] px-3 py-2 text-xs font-black disabled:opacity-50">
              <Plus className="h-4 w-4" /> Tambah pengguna
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat data...
          </div>
        ) : filteredUsers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                <tr className="border-b-2 border-slate-900">
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">OPD</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-sky-50/40">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-slate-900">{user.nama}</p>
                      <p className="text-[11px] font-semibold text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{user.opd_name ?? 'Tidak terhubung'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-black">{user.role === 'ADMIN_OPD' ? 'Admin OPD' : 'Operator'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${user.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openUserDialog(user)} aria-label={`Ubah ${user.nama}`} className="cursor-pointer rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void toggleUserStatus(user)} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${user.is_active ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}>
                          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm font-bold text-slate-500">{userSearch ? 'Pengguna tidak ditemukan.' : 'Belum ada pengguna.'}</p>
        )}
      </section>

      {opdDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="opd-dialog-title" className="my-auto w-full max-w-lg rounded-2xl border-2 border-slate-900 bg-[#FFFDF5] p-6 shadow-[6px_6px_0px_#0F172A]">
            <div className="flex items-center justify-between">
              <h2 id="opd-dialog-title" className="text-lg font-black">{editingOpd ? 'Ubah OPD' : 'Tambah OPD'}</h2>
              <button type="button" onClick={() => setOpdDialog(false)} aria-label="Tutup" className="cursor-pointer rounded-lg border border-slate-300 p-1.5"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(event) => void saveOPD(event)} className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-black">Kode OPD
                <input required maxLength={50} value={opdForm.kode_opd} onChange={(event) => setOpdForm({ ...opdForm, kode_opd: event.target.value.toUpperCase() })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">Nama OPD
                <input required maxLength={255} value={opdForm.nama_opd} onChange={(event) => setOpdForm({ ...opdForm, nama_opd: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">Singkatan
                <input maxLength={50} value={opdForm.singkatan ?? ''} onChange={(event) => setOpdForm({ ...opdForm, singkatan: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">URL logo (opsional)
                <input type="url" value={opdForm.logo_url ?? ''} onChange={(event) => setOpdForm({ ...opdForm, logo_url: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpdDialog(false)} className="cursor-pointer rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black">Batal</button>
                <button type="submit" disabled={saving} className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#059669] px-4 py-2 text-xs font-black text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Simpan OPD
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {userDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="my-auto w-full max-w-lg rounded-2xl border-2 border-slate-900 bg-[#FFFDF5] p-6 shadow-[6px_6px_0px_#0F172A]">
            <div className="flex items-center justify-between">
              <h2 id="user-dialog-title" className="text-lg font-black">{editingUser ? 'Ubah pengguna' : 'Tambah pengguna'}</h2>
              <button type="button" onClick={() => setUserDialog(false)} aria-label="Tutup" className="cursor-pointer rounded-lg border border-slate-300 p-1.5"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(event) => void saveUser(event)} className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-black">Nama lengkap
                <input required maxLength={150} value={userForm.nama} onChange={(event) => setUserForm({ ...userForm, nama: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">Email
                <input type="email" required maxLength={150} value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">OPD
                <select required value={userForm.opd_id} onChange={(event) => setUserForm({ ...userForm, opd_id: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold">
                  {opds.map((opd) => <option key={opd.id} value={opd.id}>{opd.nama_opd}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-black">Peran
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as UserForm['role'] })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold">
                  <option value="ADMIN_OPD">Admin OPD</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </label>
              <div className="flex flex-col gap-1">
                <label htmlFor="user-password" className="text-xs font-black">{editingUser ? 'Password baru (opsional)' : 'Password awal'}</label>
                <input id="user-password" type="password" required={!editingUser} minLength={12} autoComplete="new-password" aria-describedby="user-password-help" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold" />
                <span id="user-password-help" className="text-[10px] font-semibold text-slate-500">Minimal 12 karakter. Password tidak disimpan ke audit log.</span>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setUserDialog(false)} className="cursor-pointer rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black">Batal</button>
                <button type="submit" disabled={saving} className="cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#059669] px-4 py-2 text-xs font-black text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Simpan pengguna
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
