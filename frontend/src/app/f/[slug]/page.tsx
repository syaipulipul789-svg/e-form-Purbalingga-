'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Loader2,
  AlertCircle,
  Printer,
  Briefcase,
  User,
  Wallet,
  ShieldCheck,
  Phone,
  Mail,
  IdCard,
  Layout,
  Calendar,
  FileCheck,
  Barcode,
  Building2,
} from 'lucide-react';
import PurbalinggaRegionalSelect, { RegionalValue } from '@/components/regional/PurbalinggaRegionalSelect';

interface FileField {
  file: File | null;
  preview?: string;
}

interface FormState {
  // --- UMKM (bansos-umkm-purbalingga-2026) ---
  nik: string;
  nama: string;
  noHp: string;
  email: string;
  wilayah: RegionalValue;
  alamat: string;
  fotoKtp: FileField;

  namaUsaha: string;
  jenisUsaha: string;
  alamatUsaha: string;
  lamaUsaha: string;
  jumlahTenaga: string;
  omzet: string;
  modal: string;
  nib: string;
  fotoUsaha: FileField;

  jenisBantuan: string;
  keterangan: string;
  pernyataan: boolean;

  // --- Kependudukan (permohonan-layanan-kependudukan) ---
  kd_nik: string;
  kd_nama: string;
  kd_noHp: string;
  kd_email: string;
  kd_wilayah: RegionalValue;
  kd_alamat: string;
  kd_fotoKtp: FileField;

  kd_layananPindah: boolean;
  kd_layananKk: boolean;
  kd_layananAkta: boolean;

  // Pindah datang
  kd_alamatAsal: string;
  kd_provinsiAsal: string;
  kd_kabupatenAsal: string;
  kd_alasanPindah: string;
  kd_tanggalPindah: string;
  kd_fotoDokumenAsal: FileField;

  // Pembaharuan KK
  kd_noKkLama: string;
  kd_alasanPembaharuan: string;
  kd_fotoKkLama: FileField;

  // Cetak kutipan akta kelahiran
  kd_namaAkta: string;
  kd_tempatLahir: string;
  kd_tanggalLahir: string;
  kd_namaAyah: string;
  kd_namaIbu: string;
  kd_nomorAkta: string;
  kd_fotoAkta: FileField;

  kd_pernyataan: boolean;
}

const EMPTY: FormState = {
  nik: '',
  nama: '',
  noHp: '',
  email: '',
  wilayah: {},
  alamat: '',
  fotoKtp: { file: null },
  namaUsaha: '',
  jenisUsaha: '',
  alamatUsaha: '',
  lamaUsaha: '',
  jumlahTenaga: '',
  omzet: '',
  modal: '',
  nib: '',
  fotoUsaha: { file: null },
  jenisBantuan: '',
  keterangan: '',
  pernyataan: false,

  kd_nik: '',
  kd_nama: '',
  kd_noHp: '',
  kd_email: '',
  kd_wilayah: {},
  kd_alamat: '',
  kd_fotoKtp: { file: null },
  kd_layananPindah: false,
  kd_layananKk: false,
  kd_layananAkta: false,
  kd_alamatAsal: '',
  kd_provinsiAsal: '',
  kd_kabupatenAsal: '',
  kd_alasanPindah: '',
  kd_tanggalPindah: '',
  kd_fotoDokumenAsal: { file: null },
  kd_noKkLama: '',
  kd_alasanPembaharuan: '',
  kd_fotoKkLama: { file: null },
  kd_namaAkta: '',
  kd_tempatLahir: '',
  kd_tanggalLahir: '',
  kd_namaAyah: '',
  kd_namaIbu: '',
  kd_nomorAkta: '',
  kd_fotoAkta: { file: null },
  kd_pernyataan: false,
};

function formatIDR(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function slugTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function validateNik(nik: string): string | null {
  if (!nik) return 'NIK wajib diisi';
  if (!/^\d{16}$/.test(nik)) return 'NIK harus 16 digit angka';
  if (!nik.startsWith('3303')) return 'NIK harus diawali kode Kabupaten Purbalingga (3303)';
  return null;
}

export default function FormPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const isUMKM = slug === 'bansos-umkm-purbalingga-2026';
  const isKependudukan = slug === 'permohonan-layanan-kependudukan';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regNumber, setRegNumber] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`form_draft_${slug}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only restore text fields, not files
        setForm((prev) => ({
          ...prev,
          nik: parsed.nik || '',
          nama: parsed.nama || '',
          noHp: parsed.noHp || '',
          email: parsed.email || '',
          wilayah: parsed.wilayah || {},
          alamat: parsed.alamat || '',
          namaUsaha: parsed.namaUsaha || '',
          jenisUsaha: parsed.jenisUsaha || '',
          alamatUsaha: parsed.alamatUsaha || '',
          lamaUsaha: parsed.lamaUsaha || '',
          jumlahTenaga: parsed.jumlahTenaga || '',
          omzet: parsed.omzet || '',
          modal: parsed.modal || '',
          nib: parsed.nib || '',
          jenisBantuan: parsed.jenisBantuan || '',
          keterangan: parsed.keterangan || '',
          pernyataan: parsed.pernyataan || false,
          // Kependudukan draft
          kd_nik: parsed.kd_nik || '',
          kd_nama: parsed.kd_nama || '',
          kd_noHp: parsed.kd_noHp || '',
          kd_email: parsed.kd_email || '',
          kd_wilayah: parsed.kd_wilayah || {},
          kd_alamat: parsed.kd_alamat || '',
          kd_layananPindah: parsed.kd_layananPindah || false,
          kd_layananKk: parsed.kd_layananKk || false,
          kd_layananAkta: parsed.kd_layananAkta || false,
          kd_alamatAsal: parsed.kd_alamatAsal || '',
          kd_provinsiAsal: parsed.kd_provinsiAsal || '',
          kd_kabupatenAsal: parsed.kd_kabupatenAsal || '',
          kd_alasanPindah: parsed.kd_alasanPindah || '',
          kd_tanggalPindah: parsed.kd_tanggalPindah || '',
          kd_noKkLama: parsed.kd_noKkLama || '',
          kd_alasanPembaharuan: parsed.kd_alasanPembaharuan || '',
          kd_namaAkta: parsed.kd_namaAkta || '',
          kd_tempatLahir: parsed.kd_tempatLahir || '',
          kd_tanggalLahir: parsed.kd_tanggalLahir || '',
          kd_namaAyah: parsed.kd_namaAyah || '',
          kd_namaIbu: parsed.kd_namaIbu || '',
          kd_nomorAkta: parsed.kd_nomorAkta || '',
          kd_pernyataan: parsed.kd_pernyataan || false,
        }));
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  // Autosave draft (text only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (submitted) return;
    const { fotoKtp, fotoUsaha, kd_fotoKtp, kd_fotoDokumenAsal, kd_fotoKkLama, kd_fotoAkta, ...rest } = form;
    try {
      localStorage.setItem(`form_draft_${slug}`, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }, [form, slug, submitted]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleFileChange = (key: string, file: File | null) => {
    let preview: string | undefined;
    if (file) {
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
    }
    setField(key as keyof FormState, { file, preview });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (isUMKM) {
      const nikErr = validateNik(form.nik);
      if (nikErr) e.nik = nikErr;
      if (!form.nama.trim()) e.nama = 'Nama lengkap wajib diisi';
      if (!form.noHp.trim()) e.noHp = 'Nomor telepon/WhatsApp wajib diisi';
      else if (!/^\d{10,13}$/.test(form.noHp.replace(/\D/g, ''))) e.noHp = 'Nomor telepon tidak valid';
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
      if (!form.wilayah.kode_kec || !form.wilayah.kode_desa) e.wilayah = 'Wilayah domisili wajib dipilih';
      if (!form.alamat.trim()) e.alamat = 'Alamat tempat tinggal wajib diisi';
      if (!form.fotoKtp.file) e.fotoKtp = 'Upload foto KTP wajib diisi';

      if (!form.namaUsaha.trim()) e.namaUsaha = 'Nama usaha wajib diisi';
      if (!form.jenisUsaha.trim()) e.jenisUsaha = 'Bidang/jenis usaha wajib diisi';
      if (!form.alamatUsaha.trim()) e.alamatUsaha = 'Alamat lokasi usaha wajib diisi';
      if (!form.lamaUsaha.trim()) e.lamaUsaha = 'Lama usaha wajib diisi';
      if (!form.jumlahTenaga.trim()) e.jumlahTenaga = 'Jumlah tenaga kerja wajib diisi';
      if (!form.omzet) e.omzet = 'Omzet per bulan wajib diisi';
      if (!form.modal) e.modal = 'Modal usaha wajib diisi';
      if (!form.fotoUsaha.file) e.fotoUsaha = 'Upload foto tempat usaha wajib diisi';

      if (!form.jenisBantuan.trim()) e.jenisBantuan = 'Jenis bantuan yang diharapkan wajib diisi';
      if (!form.pernyataan) e.pernyataan = 'Persetujuan pernyataan wajib dicentang';
    }

    if (isKependudukan) {
      const nikErr = validateNik(form.kd_nik);
      if (nikErr) e.kd_nik = nikErr;
      if (!form.kd_nama.trim()) e.kd_nama = 'Nama lengkap wajib diisi';
      if (!form.kd_noHp.trim()) e.kd_noHp = 'Nomor telepon/WhatsApp wajib diisi';
      else if (!/^\d{10,13}$/.test(form.kd_noHp.replace(/\D/g, ''))) e.kd_noHp = 'Nomor telepon tidak valid';
      if (form.kd_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.kd_email)) e.kd_email = 'Format email tidak valid';
      if (!form.kd_wilayah.kode_kec || !form.kd_wilayah.kode_desa) e.kd_wilayah = 'Wilayah domisili wajib dipilih';
      if (!form.kd_alamat.trim()) e.kd_alamat = 'Alamat tempat tinggal wajib diisi';
      if (!form.kd_fotoKtp.file) e.kd_fotoKtp = 'Upload foto KTP wajib diisi';

      // Minimal satu layanan
      if (!form.kd_layananPindah && !form.kd_layananKk && !form.kd_layananAkta) {
        e.kd_layananPindah = 'Pilih setidaknya satu layanan administrasi kependudukan';
      }

      // Detail pindah datang
      if (form.kd_layananPindah) {
        if (!form.kd_alamatAsal.trim()) e.kd_alamatAsal = 'Alamat asal wajib diisi';
        if (!form.kd_provinsiAsal.trim()) e.kd_provinsiAsal = 'Provinsi asal wajib diisi';
        if (!form.kd_kabupatenAsal.trim()) e.kd_kabupatenAsal = 'Kabupaten/Kota asal wajib diisi';
        if (!form.kd_alasanPindah.trim()) e.kd_alasanPindah = 'Alasan pindah wajib diisi';
        if (!form.kd_tanggalPindah) e.kd_tanggalPindah = 'Tanggal pindah wajib diisi';
        if (!form.kd_fotoDokumenAsal.file) e.kd_fotoDokumenAsal = 'Upload KTP/KK asal wajib diisi';
      }

      // Detail pembaharuan KK
      if (form.kd_layananKk) {
        if (!form.kd_noKkLama.trim()) e.kd_noKkLama = 'Nomor Kartu Keluarga lama wajib diisi';
        if (!form.kd_alasanPembaharuan.trim()) e.kd_alasanPembaharuan = 'Alasan pembaharuan wajib diisi';
        if (!form.kd_fotoKkLama.file) e.kd_fotoKkLama = 'Upload Kartu Keluarga lama wajib diisi';
      }

      // Detail cetak kutipan akta kelahiran
      if (form.kd_layananAkta) {
        if (!form.kd_namaAkta.trim()) e.kd_namaAkta = 'Nama lengkap pada akta wajib diisi';
        if (!form.kd_tempatLahir.trim()) e.kd_tempatLahir = 'Tempat lahir wajib diisi';
        if (!form.kd_tanggalLahir) e.kd_tanggalLahir = 'Tanggal lahir wajib diisi';
        if (!form.kd_namaAyah.trim()) e.kd_namaAyah = 'Nama ayah wajib diisi';
        if (!form.kd_namaIbu.trim()) e.kd_namaIbu = 'Nama ibu wajib diisi';
        if (!form.kd_fotoAkta.file) e.kd_fotoAkta = 'Upload akta kelahiran wajib diisi';
      }

      if (!form.kd_pernyataan) e.kd_pernyataan = 'Persetujuan pernyataan wajib dicentang';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadFile = async (f: File): Promise<{ file_id?: string; file_url?: string }> => {
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch(`${apiBase}/public/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.success && json?.data) return json.data;
    } catch {
      /* fall through */
    }
    return { file_id: crypto.randomUUID(), file_url: `/uploads/local/${f.name}` };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;
    setSubmitting(true);
    setUploadStatus('Mengunggah berkas...');
    try {
      // --- Upload berkas sesuai formulir ---
      let answers: Record<string, unknown> = {};

      if (isUMKM) {
        const ktpRes = form.fotoKtp.file ? await uploadFile(form.fotoKtp.file) : null;
        const usahaRes = form.fotoUsaha.file ? await uploadFile(form.fotoUsaha.file) : null;

        answers = {
          f_nik: form.nik,
          f_nama: form.nama,
          f_no_hp: form.noHp,
          f_email: form.email,
          f_wilayah: form.wilayah,
          f_alamat: form.alamat,
          f_foto_ktp: ktpRes ? { file_id: ktpRes.file_id, file_url: ktpRes.file_url } : null,
          f_nama_usaha: form.namaUsaha,
          f_jenis_usaha: form.jenisUsaha,
          f_alamat_usaha: form.alamatUsaha,
          f_lama_usaha: form.lamaUsaha,
          f_jumlah_tenaga: form.jumlahTenaga,
          f_omzet: form.omzet.replace(/\./g, ''),
          f_modal: form.modal.replace(/\./g, ''),
          f_nib: form.nib,
          f_foto_usaha: usahaRes ? { file_id: usahaRes.file_id, file_url: usahaRes.file_url } : null,
          f_jenis_bantuan: form.jenisBantuan,
          f_keterangan: form.keterangan,
          f_pernyataan: form.pernyataan,
        };
      }

      if (isKependudukan) {
        const ktpRes = form.kd_fotoKtp.file ? await uploadFile(form.kd_fotoKtp.file) : null;
        const dokumenAsalRes = form.kd_fotoDokumenAsal.file ? await uploadFile(form.kd_fotoDokumenAsal.file) : null;
        const kkLamaRes = form.kd_fotoKkLama.file ? await uploadFile(form.kd_fotoKkLama.file) : null;
        const aktaRes = form.kd_fotoAkta.file ? await uploadFile(form.kd_fotoAkta.file) : null;

        const layanan: string[] = [];
        if (form.kd_layananPindah) layanan.push('surat_pengantar_pindah_datang');
        if (form.kd_layananKk) layanan.push('pembaharuan_kartu_keluarga');
        if (form.kd_layananAkta) layanan.push('cetak_kutipan_akta_kelahiran');

        answers = {
          f_nik: form.kd_nik,
          f_nama: form.kd_nama,
          f_no_hp: form.kd_noHp,
          f_email: form.kd_email,
          f_wilayah: form.kd_wilayah,
          f_alamat: form.kd_alamat,
          f_foto_ktp: ktpRes ? { file_id: ktpRes.file_id, file_url: ktpRes.file_url } : null,
          f_layanan_diajukan: layanan,
          f_jenis_layanan: layanan.join(', '),

          // Pindah datang
          f_alamat_asal: form.kd_alamatAsal,
          f_provinsi_asal: form.kd_provinsiAsal,
          f_kabupaten_asal: form.kd_kabupatenAsal,
          f_alasan_pindah: form.kd_alasanPindah,
          f_tanggal_pindah: form.kd_tanggalPindah,
          f_dokumen_asal: dokumenAsalRes ? { file_id: dokumenAsalRes.file_id, file_url: dokumenAsalRes.file_url } : null,

          // Pembaharuan KK
          f_no_kk_lama: form.kd_noKkLama,
          f_alasan_pembaharuan: form.kd_alasanPembaharuan,
          f_kk_lama: kkLamaRes ? { file_id: kkLamaRes.file_id, file_url: kkLamaRes.file_url } : null,

          // Cetak kutipan akta kelahiran
          f_nama_akta: form.kd_namaAkta,
          f_tempat_lahir: form.kd_tempatLahir,
          f_tanggal_lahir: form.kd_tanggalLahir,
          f_nama_ayah: form.kd_namaAyah,
          f_nama_ibu: form.kd_namaIbu,
          f_nomor_akta: form.kd_nomorAkta,
          f_akta_kelahiran: aktaRes ? { file_id: aktaRes.file_id, file_url: aktaRes.file_url } : null,

          f_pernyataan: form.kd_pernyataan,
        };
      }

      setUploadStatus('Menyimpan isian formulir...');
      let reg = '';
      try {
        const res = await fetch(`${apiBase}/public/forms/${slug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ respondent_nik: isUMKM ? form.nik : form.kd_nik, answers }),
        });
        const json = await res.json();
        if (json?.success && json?.data?.registration_number) {
          reg = json.data.registration_number;
        }
      } catch {
        /* backend unavailable -> local receipt */
      }

      if (!reg) {
        const prefix = isKependudukan ? 'ADK' : 'PBG';
        reg = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      }

      const now = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Save to local submissions for offline visibility
      try {
        const existing = JSON.parse(localStorage.getItem(`form_submissions_${slug}`) || '[]');
        existing.push({ registration_number: reg, submitted_at: now, answers });
        localStorage.setItem(`form_submissions_${slug}`, JSON.stringify(existing));
      } catch {}

      localStorage.removeItem(`form_draft_${slug}`);

      setRegNumber(reg);
      setSubmittedAt(now);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  const inputCls = (key: string) =>
    `w-full px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold border-2 rounded-lg shadow-[2px_2px_0px_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#059669] transition-all placeholder:text-slate-400 placeholder:font-normal ${
      errors[key] ? 'border-rose-500' : 'border-slate-900'
    }`;

  // ========================================================================
  // FORMULIR TIDAK TERSEDIA
  // ========================================================================
  if (!isUMKM && !isKependudukan) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0F172A] p-8 text-center flex flex-col gap-4">
          <div className="w-14 h-14 bg-[#FED7AA] border-2 border-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0F172A]">
            <AlertCircle className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="font-black text-xl text-slate-900">Formulir Tidak Tersedia</h1>
          <p className="text-sm font-semibold text-slate-600">
            Formulir &quot;{slugTitle(slug)}&quot; belum dipublikasikan atau tidak ditemukan.
          </p>
          <Link href="/" className="btn-brutal-emerald justify-center">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog Formulir
          </Link>
        </div>
      </div>
    );
  }

  // ========================================================================
  // HALAMAN TERIMA KASIH (RESEPSI)
  // ========================================================================
  if (submitted) {
    const opdName = isKependudukan ? 'Dinas Kependudukan dan Pencatatan Sipil' : 'Dinas Koperasi dan UKM';
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-6 print:bg-white">
        <div className="max-w-lg w-full bg-white border-2 border-slate-900 rounded-2xl shadow-[8px_8px_0px_#0F172A] overflow-hidden">
          <div className="bg-[#059669] border-b-2 border-slate-900 p-6 text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-emerald-700 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight">Formulir Berhasil Dikirim!</h1>
              <p className="text-xs font-bold text-emerald-100">Tanda terima digital resmi eForm Purbalingga</p>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="bg-[#FEFCE8] border-2 border-slate-900 rounded-xl p-4 shadow-[3px_3px_0px_#0F172A]">
              <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Nomor Registrasi</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{regNumber}</p>
              <p className="text-[11px] font-bold text-slate-600 mt-2">Dikirim pada: {submittedAt}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-700 leading-relaxed">
              Simpan nomor registrasi ini sebagai bukti pengajuan. Data Anda akan diverifikasi oleh
              {opdName} Kabupaten Purbalingga. Petugas dinas akan menghubungi melalui
              nomor telepon/WhatsApp yang tercatat.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-brutal-white justify-center flex-1"
              >
                <Printer className="w-4 h-4" /> Cetak Bukti
              </button>
              <Link href="/" className="btn-brutal-emerald justify-center flex-1">
                Kembali ke Katalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // FORMULIR UMKM (sudah ada sebelumnya, dipertahankan)
  // ========================================================================
  if (isUMKM) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A]">
        <div className="bg-[#FFE600] text-slate-900 py-2.5 px-4 border-b-2 border-slate-900">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs gap-2 font-black">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Katalog Formulir
            </Link>
            <span className="tracking-tight hidden sm:block">E-Form Kabupaten Purbalingga • Dinas Koperasi dan UKM</span>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0F172A] overflow-hidden mb-6">
            <div className="h-3.5 bg-[#FFE600] border-b-2 border-slate-900" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#FEF08A] text-amber-950 border-2 border-slate-900 rounded shadow-[1.5px_1.5px_0px_#0F172A]">
                  Usaha &amp; UMKM
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#DCFCE7] text-emerald-950 border border-slate-900 rounded shadow-[1px_1px_0px_#0F172A]">
                  Wajib NIK
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Pendataan Pelaku Usaha Mikro (UMKM) &amp; Bantuan Modal 2026
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed">
                Formulir pendataan pelaku usaha mikro aktif se-Kabupaten Purbalingga dalam rangka verifikasi
                calon penerima fasilitasi legalitas NIB gratis dan hibah permodalan daerah. Wajib menggunakan
                NIK KTP Purbalingga. Batas pengisian: 30 Oktober 2026.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Data Anda dilindungi sesuai UU PDP No. 27 Tahun 2022.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#FFE600] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <User className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">A. Data Diri Pemohon</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Lengkapi identitas diri sesuai KTP Purbalingga.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setField('nik', e.target.value.replace(/\D/g, ''))}
                    placeholder="3303xxxxxxxxxxxx"
                    className={inputCls('nik')}
                  />
                  {errors.nik && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.nik}</p>}
                  <p className="text-[11px] font-medium text-slate-500 mt-1">Wajib 16 digit angka KTP Purbalingga (diawali 3303).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nama Lengkap Pemohon <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" value={form.nama} onChange={(e) => setField('nama', e.target.value)} placeholder="Nama sesuai KTP" className={inputCls('nama')} />
                    {errors.nama && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.nama}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input type="tel" value={form.noHp} onChange={(e) => setField('noHp', e.target.value.replace(/\D/g, ''))} placeholder="08xxxxxxxxxx" className={`${inputCls('noHp')} pl-10`} />
                    </div>
                    {errors.noHp && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.noHp}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">Alamat Email</label>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="contoh@email.com" className={inputCls('email')} />
                  {errors.email && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Wilayah Domisili Purbalingga <span className="text-rose-500">*</span>
                  </label>
                  <PurbalinggaRegionalSelect value={form.wilayah} onChange={(v) => setField('wilayah', v)} />
                  {errors.wilayah && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.wilayah}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Alamat Lengkap Tempat Tinggal <span className="text-rose-500">*</span>
                  </label>
                  <textarea rows={3} value={form.alamat} onChange={(e) => setField('alamat', e.target.value)} placeholder="Jl. / Dusun / RT / RW / Desa" className={inputCls('alamat')} />
                  {errors.alamat && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.alamat}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Upload Foto KTP Pemohon <span className="text-rose-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.fotoKtp ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                    {form.fotoKtp.file ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {form.fotoKtp.preview && (
                            <img src={form.fotoKtp.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                          )}
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.fotoKtp.file.name}</p>
                            <p className="text-[10px] font-medium text-slate-500">{(form.fotoKtp.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleFileChange('fotoKtp', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Klik untuk unggah foto KTP (JPG/PNG/PDF, max 5 MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (f && f.size > 5 * 1024 * 1024) {
                              setErrors((prev) => ({ ...prev, fotoKtp: 'Ukuran file maksimal 5 MB' }));
                              return;
                            }
                            handleFileChange('fotoKtp', f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.fotoKtp && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.fotoKtp}</p>}
                </div>
              </div>
            </section>

            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#38BDF8] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <Briefcase className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">B. Data Usaha Mikro</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Lengkapi data usaha mikro yang dijalankan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nama Usaha / Toko <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" value={form.namaUsaha} onChange={(e) => setField('namaUsaha', e.target.value)} placeholder="Warung Kopi Berkah Padamara" className={inputCls('namaUsaha')} />
                    {errors.namaUsaha && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.namaUsaha}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Bidang / Jenis Usaha <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" value={form.jenisUsaha} onChange={(e) => setField('jenisUsaha', e.target.value)} placeholder="Kuliner, Fashion, Kerajinan..." className={inputCls('jenisUsaha')} />
                    {errors.jenisUsaha && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.jenisUsaha}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Alamat Lokasi Usaha <span className="text-rose-500">*</span>
                  </label>
                  <textarea rows={2} value={form.alamatUsaha} onChange={(e) => setField('alamatUsaha', e.target.value)} placeholder="Alamat lengkap tempat usaha beroperasi" className={inputCls('alamatUsaha')} />
                  {errors.alamatUsaha && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.alamatUsaha}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Lama Usaha (Tahun) <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" min={0} max={100} value={form.lamaUsaha} onChange={(e) => setField('lamaUsaha', e.target.value)} placeholder="0" className={inputCls('lamaUsaha')} />
                    {errors.lamaUsaha && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.lamaUsaha}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Jumlah Tenaga Kerja <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" min={0} value={form.jumlahTenaga} onChange={(e) => setField('jumlahTenaga', e.target.value)} placeholder="0" className={inputCls('jumlahTenaga')} />
                    {errors.jumlahTenaga && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.jumlahTenaga}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">NIB (jika ada)</label>
                    <input type="text" value={form.nib} onChange={(e) => setField('nib', e.target.value)} placeholder="Nomor NIB" className={inputCls('nib')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Rata-rata Omzet per Bulan (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">Rp</span>
                      <input type="text" inputMode="numeric" value={form.omzet} onChange={(e) => setField('omzet', formatIDR(e.target.value))} placeholder="0" className={`${inputCls('omzet')} pl-10`} />
                    </div>
                    {errors.omzet && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.omzet}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Modal Usaha Saat Ini (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">Rp</span>
                      <input type="text" inputMode="numeric" value={form.modal} onChange={(e) => setField('modal', formatIDR(e.target.value))} placeholder="0" className={`${inputCls('modal')} pl-10`} />
                    </div>
                    {errors.modal && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.modal}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Upload Foto Tempat Usaha <span className="text-rose-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.fotoUsaha ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                    {form.fotoUsaha.file ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {form.fotoUsaha.preview && (
                            <img src={form.fotoUsaha.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                          )}
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.fotoUsaha.file.name}</p>
                            <p className="text-[10px] font-medium text-slate-500">{(form.fotoUsaha.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleFileChange('fotoUsaha', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Klik untuk unggah foto tempat usaha (JPG/PNG/PDF, max 5 MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (f && f.size > 5 * 1024 * 1024) {
                              setErrors((prev) => ({ ...prev, fotoUsaha: 'Ukuran file maksimal 5 MB' }));
                              return;
                            }
                            handleFileChange('fotoUsaha', f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.fotoUsaha && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.fotoUsaha}</p>}
                </div>
              </div>
            </section>

            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#A7F3D0] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <FileText className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">C. Rencana Bantuan Modal</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Informasi dukungan program yang dibutuhkan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Jenis Bantuan / Fasilitasi yang Diharapkan <span className="text-rose-500">*</span>
                  </label>
                  <textarea rows={3} value={form.jenisBantuan} onChange={(e) => setField('jenisBantuan', e.target.value)} placeholder="Modal usaha, pelatihan manajemen, fasilitas NIB, peralatan produksi" className={inputCls('jenisBantuan')} />
                  {errors.jenisBantuan && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.jenisBantuan}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">Keterangan Tambahan</label>
                  <textarea rows={2} value={form.keterangan} onChange={(e) => setField('keterangan', e.target.value)} placeholder="Informasi tambahan yang perlu diketahui dinas" className={inputCls('keterangan')} />
                </div>

                <label className="flex items-start gap-3 p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pernyataan}
                    onChange={(e) => setField('pernyataan', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    Saya menyatakan bahwa data yang saya isi adalah benar dan dapat dipertanggungjawabkan.
                    <span className="text-rose-500"> *</span>
                  </span>
                </label>
                {errors.pernyataan && <p className="text-[11px] font-bold text-rose-600 -mt-2">{errors.pernyataan}</p>}
              </div>
            </section>

            {uploadStatus && (
              <div className="bg-[#F0F9FF] border-2 border-slate-900 rounded-xl p-3 text-center text-xs font-black text-slate-800 shadow-[3px_3px_0px_#0F172A]">
                {uploadStatus}
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_#0F172A]">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-black text-rose-950">
                  Masih ada {Object.keys(errors).length} field wajib yang belum valid. Periksa kembali isian Anda.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <Link href="/" className="btn-brutal-white justify-center flex-1">Batal</Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal-emerald justify-center flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Kirim Formulir
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // ========================================================================
  // FORMULIR KEPENDUDUKAN (baru)
  // ========================================================================
  if (isKependudukan) {
    const showPindah = form.kd_layananPindah;
    const showKk = form.kd_layananKk;
    const showAkta = form.kd_layananAkta;

    return (
      <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A]">
        <div className="bg-[#38BDF8] text-slate-900 py-2.5 px-4 border-b-2 border-slate-900">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs gap-2 font-black">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Katalog Formulir
            </Link>
            <span className="tracking-tight hidden sm:block">E-Form Kabupaten Purbalingga • Dinas Kependudukan dan Pencatatan Sipil</span>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0F172A] overflow-hidden mb-6">
            <div className="h-3.5 bg-[#38BDF8] border-b-2 border-slate-900" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#E0F2FE] text-sky-950 border-2 border-slate-900 rounded shadow-[1.5px_1.5px_0px_#0F172A]">
                  Administrasi Kependudukan
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#DCFCE7] text-emerald-950 border border-slate-900 rounded shadow-[1px_1px_0px_#0F172A]">
                  Wajib NIK
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#F0FDF4] text-emerald-950 border border-slate-900 rounded shadow-[1px_1px_0px_#0F172A]">
                  Tanpa Antre Loket
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Permohonan Daring Administrasi Kependudukan Terpadu
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed">
                Pengajuan surat pengantar pindah datang, pembaharuan Kartu Keluarga, dan cetak kutipan akta
                kelahiran secara online tanpa antre di loket dinas. Wajib menggunakan NIK KTP Purbalingga.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Data Anda dilindungi sesuai UU PDP No. 27 Tahun 2022.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {/* A. Data Diri Pemohon */}
            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#38BDF8] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <IdCard className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">A. Data Diri Pemohon</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Lengkapi identitas diri sesuai KTP Purbalingga Anda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={form.kd_nik}
                    onChange={(e) => setField('kd_nik', e.target.value.replace(/\D/g, ''))}
                    placeholder="3303xxxxxxxxxxxx"
                    className={inputCls('kd_nik')}
                  />
                  {errors.kd_nik && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_nik}</p>}
                  <p className="text-[11px] font-medium text-slate-500 mt-1">Wajib 16 digit angka KTP Purbalingga (diawali 3303).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nama Lengkap Pemohon <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" value={form.kd_nama} onChange={(e) => setField('kd_nama', e.target.value)} placeholder="Nama sesuai KTP" className={inputCls('kd_nama')} />
                    {errors.kd_nama && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_nama}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input type="tel" value={form.kd_noHp} onChange={(e) => setField('kd_noHp', e.target.value.replace(/\D/g, ''))} placeholder="08xxxxxxxxxx" className={`${inputCls('kd_noHp')} pl-10`} />
                    </div>
                    {errors.kd_noHp && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_noHp}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">Alamat Email</label>
                  <input type="email" value={form.kd_email} onChange={(e) => setField('kd_email', e.target.value)} placeholder="contoh@email.com" className={inputCls('kd_email')} />
                  {errors.kd_email && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_email}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Wilayah Domisili Purbalingga <span className="text-rose-500">*</span>
                  </label>
                  <PurbalinggaRegionalSelect value={form.kd_wilayah} onChange={(v) => setField('kd_wilayah', v)} />
                  {errors.kd_wilayah && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_wilayah}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Alamat Lengkap Tempat Tinggal <span className="text-rose-500">*</span>
                  </label>
                  <textarea rows={3} value={form.kd_alamat} onChange={(e) => setField('kd_alamat', e.target.value)} placeholder="Jl. / Dusun / RT / RW / Desa" className={inputCls('kd_alamat')} />
                  {errors.kd_alamat && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_alamat}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                    Upload Foto KTP Pemohon <span className="text-rose-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.kd_fotoKtp ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                    {form.kd_fotoKtp.file ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {form.kd_fotoKtp.preview && (
                            <img src={form.kd_fotoKtp.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                          )}
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.kd_fotoKtp.file.name}</p>
                            <p className="text-[10px] font-medium text-slate-500">{(form.kd_fotoKtp.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleFileChange('kd_fotoKtp', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Klik untuk unggah foto KTP (JPG/PNG/PDF, max 5 MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (f && f.size > 5 * 1024 * 1024) {
                              setErrors((prev) => ({ ...prev, kd_fotoKtp: 'Ukuran file maksimal 5 MB' }));
                              return;
                            }
                            handleFileChange('kd_fotoKtp', f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.kd_fotoKtp && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_fotoKtp}</p>}
                </div>
              </div>
            </section>

            {/* B. Pilih Layanan Administrasi */}
            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#FED7AA] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <Layout className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">B. Pilih Layanan Administrasi yang Diajukan</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Pilih setidaknya satu layanan. Kolom detail akan muncul sesuai pilihan Anda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Surat pengantar pindah datang */}
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-[3px_3px_0px_#0F172A] ${form.kd_layananPindah ? 'bg-[#E0F2FE] border-sky-500' : 'bg-white border-slate-900 hover:border-sky-400'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.kd_layananPindah}
                      onChange={(e) => setField('kd_layananPindah', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-sky-600 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 border border-sky-300 rounded shadow-[1px_1px_0px_#0F172A]">
                          Surat Pengantar
                        </span>
                        <span className="text-[10px] font-bold text-rose-500">*</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">Pindah Datang</h3>
                      <p className="text-[11px] font-semibold text-slate-600 leading-relaxed mt-1">
                        Untuk warga yang pindah masuk ke Kabupaten Purbalingga dari daerah lain.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Pembaharuan Kartu Keluarga */}
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-[3px_3px_0px_#0F172A] ${form.kd_layananKk ? 'bg-[#F0FDF4] border-emerald-500' : 'bg-white border-slate-900 hover:border-emerald-400'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.kd_layananKk}
                      onChange={(e) => setField('kd_layananKk', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-600 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300 rounded shadow-[1px_1px_0px_#0F172A]">
                          Kartu Keluarga
                        </span>
                        <span className="text-[10px] font-bold text-rose-500">*</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">Pembaharuan KK</h3>
                      <p className="text-[11px] font-semibold text-slate-600 leading-relaxed mt-1">
                        Perubahan data atau penggantian Kartu Keluarga yang rusak/hilang.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Cetak kutipan akta kelahiran */}
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-[3px_3px_0px_#0F172A] ${form.kd_layananAkta ? 'bg-[#FAF5FF] border-purple-500' : 'bg-white border-slate-900 hover:border-purple-400'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.kd_layananAkta}
                      onChange={(e) => setField('kd_layananAkta', e.target.checked)}
                      className="mt-1 w-4 h-4 accent-purple-600 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-purple-800 bg-purple-100 px-2 py-0.5 border border-purple-300 rounded shadow-[1px_1px_0px_#0F172A]">
                          Akta Kelahiran
                        </span>
                        <span className="text-[10px] font-bold text-rose-500">*</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">Cetak Kutipan Akta Kelahiran</h3>
                      <p className="text-[11px] font-semibold text-slate-600 leading-relaxed mt-1">
                        Salinan resmi akta kelahiran dari pencatatan sipil.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {errors.kd_layananPindah && (
                <p className="text-[11px] font-bold text-rose-600 mt-3">{errors.kd_layananPindah}</p>
              )}
            </section>

            {/* C. Detail Pindah Datang */}
            {showPindah && (
              <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                  <div className="w-9 h-9 bg-[#FED7AA] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                    <Building2 className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-slate-900">C. Data Pindah Datang</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Informasi untuk pengajuan surat pengantar pindah datang.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Alamat Asal <span className="text-rose-500">*</span>
                      </label>
                      <textarea rows={2} value={form.kd_alamatAsal} onChange={(e) => setField('kd_alamatAsal', e.target.value)} placeholder="Alamat lengkap tempat tinggal sebelum pindah" className={inputCls('kd_alamatAsal')} />
                      {errors.kd_alamatAsal && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_alamatAsal}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Provinsi Asal <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" value={form.kd_provinsiAsal} onChange={(e) => setField('kd_provinsiAsal', e.target.value)} placeholder="Contoh: Jawa Tengah" className={inputCls('kd_provinsiAsal')} />
                      {errors.kd_provinsiAsal && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_provinsiAsal}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Kabupaten/Kota Asal <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" value={form.kd_kabupatenAsal} onChange={(e) => setField('kd_kabupatenAsal', e.target.value)} placeholder="Contoh: Cilacap" className={inputCls('kd_kabupatenAsal')} />
                      {errors.kd_kabupatenAsal && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_kabupatenAsal}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Tanggal Pindah <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input type="date" value={form.kd_tanggalPindah} onChange={(e) => setField('kd_tanggalPindah', e.target.value)} className={`${inputCls('kd_tanggalPindah')} pl-10`} />
                      </div>
                      {errors.kd_tanggalPindah && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_tanggalPindah}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Alasan Pindah <span className="text-rose-500">*</span>
                    </label>
                    <textarea rows={3} value={form.kd_alasanPindah} onChange={(e) => setField('kd_alasanPindah', e.target.value)} placeholder="Contoh: Pindah tempat kerja, menikah, bergabung dengan keluarga" className={inputCls('kd_alasanPindah')} />
                    {errors.kd_alasanPindah && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_alasanPindah}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Upload KTP / KK Asal <span className="text-rose-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.kd_fotoDokumenAsal ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                      {form.kd_fotoDokumenAsal.file ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {form.kd_fotoDokumenAsal.preview && (
                              <img src={form.kd_fotoDokumenAsal.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                            )}
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.kd_fotoDokumenAsal.file.name}</p>
                              <p className="text-[10px] font-medium text-slate-500">{(form.kd_fotoDokumenAsal.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleFileChange('kd_fotoDokumenAsal', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">Klik untuk unggah KTP/KK asal (JPG/PNG/PDF, max 5 MB)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              if (f && f.size > 5 * 1024 * 1024) {
                                setErrors((prev) => ({ ...prev, kd_fotoDokumenAsal: 'Ukuran file maksimal 5 MB' }));
                                return;
                              }
                              handleFileChange('kd_fotoDokumenAsal', f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {errors.kd_fotoDokumenAsal && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_fotoDokumenAsal}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* C. Detail Pembaharuan KK */}
            {showKk && (
              <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                  <div className="w-9 h-9 bg-[#A7F3D0] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                    <FileCheck className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-slate-900">C. Data Pembaharuan Kartu Keluarga</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Informasi untuk pengajuan pembaharuan Kartu Keluarga (KK).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nomor Kartu Keluarga Lama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={form.kd_noKkLama}
                      onChange={(e) => setField('kd_noKkLama', e.target.value.replace(/\D/g, ''))}
                      placeholder="Nomor KK tercantum pada Kartu Keluarga"
                      className={inputCls('kd_noKkLama')}
                    />
                    {errors.kd_noKkLama && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_noKkLama}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Alasan Pembaharuan <span className="text-rose-500">*</span>
                    </label>
                    <textarea rows={3} value={form.kd_alasanPembaharuan} onChange={(e) => setField('kd_alasanPembaharuan', e.target.value)} placeholder="Contoh: KK hilang, rusak, perubahan data anggota keluarga" className={inputCls('kd_alasanPembaharuan')} />
                    {errors.kd_alasanPembaharuan && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_alasanPembaharuan}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Upload Kartu Keluarga Lama <span className="text-rose-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.kd_fotoKkLama ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                      {form.kd_fotoKkLama.file ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {form.kd_fotoKkLama.preview && (
                              <img src={form.kd_fotoKkLama.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                            )}
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.kd_fotoKkLama.file.name}</p>
                              <p className="text-[10px] font-medium text-slate-500">{(form.kd_fotoKkLama.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleFileChange('kd_fotoKkLama', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">Klik untuk unggah Kartu Keluarga lama (JPG/PNG/PDF, max 5 MB)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              if (f && f.size > 5 * 1024 * 1024) {
                                setErrors((prev) => ({ ...prev, kd_fotoKkLama: 'Ukuran file maksimal 5 MB' }));
                                return;
                              }
                              handleFileChange('kd_fotoKkLama', f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {errors.kd_fotoKkLama && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_fotoKkLama}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* C. Detail Cetak Kutipan Akta Kelahiran */}
            {showAkta && (
              <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                  <div className="w-9 h-9 bg-[#DDD6FE] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                    <Barcode className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-slate-900">C. Data Cetak Kutipan Akta Kelahiran</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Informasi untuk pengajuan cetak kutipan akta kelahiran.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nama Lengkap (pada Akta) <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" value={form.kd_namaAkta} onChange={(e) => setField('kd_namaAkta', e.target.value)} placeholder="Nama lengkap tercantum dalam akta kelahiran" className={inputCls('kd_namaAkta')} />
                    {errors.kd_namaAkta && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_namaAkta}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Tempat Lahir <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" value={form.kd_tempatLahir} onChange={(e) => setField('kd_tempatLahir', e.target.value)} placeholder="Contoh: Purbalingga" className={inputCls('kd_tempatLahir')} />
                      {errors.kd_tempatLahir && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_tempatLahir}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input type="date" value={form.kd_tanggalLahir} onChange={(e) => setField('kd_tanggalLahir', e.target.value)} className={`${inputCls('kd_tanggalLahir')} pl-10`} />
                      </div>
                      {errors.kd_tanggalLahir && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_tanggalLahir}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Nama Ayah <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" value={form.kd_namaAyah} onChange={(e) => setField('kd_namaAyah', e.target.value)} placeholder="Nama ayah tercantum dalam akta" className={inputCls('kd_namaAyah')} />
                      {errors.kd_namaAyah && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_namaAyah}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                        Nama Ibu <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" value={form.kd_namaIbu} onChange={(e) => setField('kd_namaIbu', e.target.value)} placeholder="Nama ibu tercantum dalam akta" className={inputCls('kd_namaIbu')} />
                      {errors.kd_namaIbu && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_namaIbu}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Nomor Akta (jika diketahui)
                    </label>
                    <input type="text" value={form.kd_nomorAkta} onChange={(e) => setField('kd_nomorAkta', e.target.value)} placeholder="Nomor akta kelahiran (kosongkan jika tidak tahu)" className={inputCls('kd_nomorAkta')} />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                      Upload Akta Kelahiran <span className="text-rose-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${errors.kd_fotoAkta ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50 hover:border-slate-900'}`}>
                      {form.kd_fotoAkta.file ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {form.kd_fotoAkta.preview && (
                              <img src={form.kd_fotoAkta.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border-2 border-slate-900" />
                            )}
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.kd_fotoAkta.file.name}</p>
                              <p className="text-[10px] font-medium text-slate-500">{(form.kd_fotoAkta.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleFileChange('kd_fotoAkta', null)} className="text-xs font-black text-rose-600 hover:underline">Hapus</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">Klik untuk unggah akta kelahiran (JPG/PNG/PDF, max 5 MB)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              if (f && f.size > 5 * 1024 * 1024) {
                                setErrors((prev) => ({ ...prev, kd_fotoAkta: 'Ukuran file maksimal 5 MB' }));
                                return;
                              }
                              handleFileChange('kd_fotoAkta', f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {errors.kd_fotoAkta && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.kd_fotoAkta}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* D. Pernyataan */}
            <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
                <div className="w-9 h-9 bg-[#FFE600] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900">D. Pernyataan Keabsahan Data</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Saya menyetujui dan menyatakan kebenaran data yang diisikan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-start gap-3 p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.kd_pernyataan}
                    onChange={(e) => setField('kd_pernyataan', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    Saya menyatakan bahwa data dan berkas yang saya unggah adalah benar, dapat
                    dipertanggungjawabkan, dan berasal dari KTP/Kartu Keluarga milik saya sendiri.
                    Saya memahami bahwa data palsu dapat ditindaklanjuti sesuai peraturan perundang-undangan
                    yang berlaku di Kabupaten Purbalingga.
                    <span className="text-rose-500"> *</span>
                  </span>
                </label>
                {errors.kd_pernyataan && <p className="text-[11px] font-bold text-rose-600 -mt-2">{errors.kd_pernyataan}</p>}
              </div>
            </section>

            {uploadStatus && (
              <div className="bg-[#F0F9FF] border-2 border-slate-900 rounded-xl p-3 text-center text-xs font-black text-slate-800 shadow-[3px_3px_0px_#0F172A]">
                {uploadStatus}
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_#0F172A]">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-black text-rose-950">
                  Masih ada {Object.keys(errors).length} field wajib yang belum valid. Periksa kembali isian Anda.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <Link href="/" className="btn-brutal-white justify-center flex-1">Batal</Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal-emerald justify-center flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Kirim Permohonan
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }
}
