'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
<<<<<<< HEAD
  Search,
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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

<<<<<<< HEAD
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regNumber, setRegNumber] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

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
=======
  switch (field.type) {
    case 'nik': {
      const text = String(value).trim();
      if (!/^3303\d{12}$/.test(text)) {
        return 'NIK harus 16 digit dan diawali kode Purbalingga 3303';
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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

<<<<<<< HEAD
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
=======
  useEffect(() => {
    if (!publicForm || typeof window === 'undefined' || submitted) return;
    try {
      localStorage.setItem(`eform_draft_${slug}`, JSON.stringify(answers));
    } catch {
      // Penyimpanan lokal tidak tersedia.
    }
  }, [answers, publicForm, slug, submitted]);
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33

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

<<<<<<< HEAD
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
    const fd = new FormData();
    fd.append('file', f);
    let res: Response;
    try {
      res = await fetch(`${apiBase}/public/upload`, { method: 'POST', body: fd });
    } catch {
      throw new Error('Gagal mengunggah berkas. Periksa koneksi Anda lalu coba lagi.');
    }
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; message?: string; data?: { file_id?: string; file_url?: string } }
      | null;
    if (!res.ok || !json?.success || !json?.data) {
      throw new Error(json?.message || 'Berkas gagal diunggah. Silakan coba lagi.');
    }
    return json.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;
    setSubmitError('');
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
      let submitRes: Response;
      try {
        submitRes = await fetch(`${apiBase}/public/forms/${slug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ respondent_nik: isUMKM ? form.nik : form.kd_nik, answers }),
        });
      } catch {
        throw new Error('Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.');
      }

      const submitJson = (await submitRes.json().catch(() => null)) as
        | {
            success?: boolean;
            message?: string;
            data?: { registration_number?: string };
            error?: { code?: string; details?: Record<string, string> };
          }
        | null;

      if (!submitRes.ok || !submitJson?.success) {
        const details = submitJson?.error?.details;
        let detailText = '';
        if (details && typeof details === 'object') {
          setErrors((prev) => ({ ...prev, ...(details as Record<string, string>) }));
          detailText = Object.values(details as Record<string, string>)
            .filter((value) => typeof value === 'string' && value.trim() !== '')
            .join(' ');
        }
        throw new Error(
          detailText ||
            submitJson?.message ||
            (submitRes.status === 409
              ? 'NIK ini sudah pernah mengirim formulir.'
              : 'Formulir gagal dikirim. Silakan periksa kembali isian Anda.'),
        );
      }

      const reg = submitJson?.data?.registration_number;
      if (!reg) {
        throw new Error('Server tidak mengembalikan nomor registrasi. Silakan coba lagi.');
      }

      const now = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
=======
    if (!file) {
      setFiles((current) => {
        const next = { ...current };
        delete next[field.id];
        return next;
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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

<<<<<<< HEAD
      localStorage.removeItem(`form_draft_${slug}`);

      setRegNumber(reg);
      setSubmittedAt(now);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Formulir gagal dikirim.');
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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
<<<<<<< HEAD
    const opdName = isKependudukan ? 'Dinas Kependudukan dan Pencatatan Sipil' : 'Dinas Sosial, Pemberdayaan Perempuan & PA';
=======
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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
<<<<<<< HEAD
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
              <Link href="/lacak" className="btn-brutal-emerald justify-center flex-1">
                <Search className="w-4 h-4" /> Cek Status
              </Link>
              <Link href="/" className="btn-brutal-white justify-center flex-1">
                Katalog
              </Link>
            </div>
=======

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.print()} className="btn-brutal-white">
              <Printer className="h-4 w-4" />
              Cetak Bukti
            </button>
            <Link href="/" className="btn-brutal-emerald justify-center">
              Kembali ke Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
          </div>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
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
            <span className="tracking-tight hidden sm:block">E-Form Kabupaten Purbalingga • Dinas Sosial, Pemberdayaan Perempuan &amp; PA</span>
          </div>
=======
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-900">
      <div className="bg-[#FFE600] px-4 py-2.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] font-black">
          <span>PEMERINTAH KABUPATEN PURBALINGGA</span>
          <span className="hidden text-slate-700 sm:block">PORTAL FORMULIR DIGITAL TERPADU</span>
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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

<<<<<<< HEAD
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

            {submitError && (
              <div role="alert" className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 flex items-start gap-3 shadow-[3px_3px_0px_#0F172A]">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-rose-950">
                  <p className="font-black">Formulir gagal dikirim</p>
                  <p className="mt-0.5">{submitError}</p>
                </div>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_#0F172A]">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-black text-rose-950">
                  Masih ada {Object.keys(errors).length} field wajib yang belum valid. Periksa kembali isian Anda.
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
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

<<<<<<< HEAD
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

            {submitError && (
              <div role="alert" className="bg-[#FFE4E6] border-2 border-slate-900 rounded-xl p-4 flex items-start gap-3 shadow-[3px_3px_0px_#0F172A]">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-rose-950">
                  <p className="font-black">Formulir gagal dikirim</p>
                  <p className="mt-0.5">{submitError}</p>
                </div>
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
=======
      <footer className="border-t-2 border-slate-900 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-center text-[10px] font-semibold text-slate-500 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} Pemerintah Kabupaten Purbalingga</span>
          <span>Dinas Komunikasi dan Informatika · E-Form Terpadu</span>
        </div>
      </footer>
    </div>
  );
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
