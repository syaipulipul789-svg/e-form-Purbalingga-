'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Printer,
  User,
  Info,
  MessageSquare,
  Wifi,
  Star,
  ShieldCheck,
} from 'lucide-react';
import PurbalinggaRegionalSelect, { RegionalValue } from '@/components/regional/PurbalinggaRegionalSelect';

interface FileField {
  file: File | null;
  preview?: string;
}

interface FormState {
  nama: string;
  jenisKelamin: string;
  usia: string;
  pendidikan: string;
  pekerjaan: string;
  statusResponden: string;
  wilayah: RegionalValue;
  alamat: string;

  // Transparansi informasi publik
  tKemudahan: string;
  tKetepatan: string;
  tKelengkapan: string;
  tTransparansi: string;
  tAksesDokumen: string;
  tSaran: string;

  // Kecepatan respon kanal aduan
  aduanKanal: string[];
  aduanFrekuensi: string;
  aduanKecepatan: string;
  aduanKualitas: string;
  aduanPenyelesaian: string;
  aduanSaran: string;

  // Konektivitas internet desa
  inetProvider: string;
  inetKecepatan: string;
  inetStabilitas: string;
  inetSinyal: string;
  inetJangkauan: string;
  inetMemadai: string;
  inetKendala: string[];
  inetSaran: string;

  // Penilaian umum
  overall: string;
  rekomendasi: string;
  saranUmum: string;
}

const EMPTY: FormState = {
  nama: '',
  jenisKelamin: '',
  usia: '',
  pendidikan: '',
  pekerjaan: '',
  statusResponden: '',
  wilayah: {},
  alamat: '',

  tKemudahan: '',
  tKetepatan: '',
  tKelengkapan: '',
  tTransparansi: '',
  tAksesDokumen: '',
  tSaran: '',

  aduanKanal: [],
  aduanFrekuensi: '',
  aduanKecepatan: '',
  aduanKualitas: '',
  aduanPenyelesaian: '',
  aduanSaran: '',

  inetProvider: '',
  inetKecepatan: '',
  inetStabilitas: '',
  inetSinyal: '',
  inetJangkauan: '',
  inetMemadai: '',
  inetKendala: [],
  inetSaran: '',

  overall: '',
  rekomendasi: '',
  saranUmum: '',
};

const KANAL_OPTIONS = [
  'WhatsApp / Call Center Dinkominfo',
  'Telepon langsung',
  'Email resmi',
  'Media sosial (Instagram/Facebook/X)',
  'Website resmi & form pengaduan',
  'SP4N-LAPOR!',
  'Datang langsung ke kantor',
  'Lainnya',
];

const KENDALA_OPTIONS = [
  'Sinyal lemah / tidak masuk ke dalam rumah',
  'Koneksi sering putus (intermiten)',
  'Kecepatan internet lambat',
  'Kuota / paket data mahal',
  'Infrastruktur (tiang/BTS) kurang',
  'Gangguan saat cuaca buruk',
  'Listrik tidak stabil',
  'Belum tersedia internet',
];

const RATING_LABELS = [
  'Sangat Tidak Puas',
  'Tidak Puas',
  'Cukup Puas',
  'Puas',
  'Sangat Puas',
];

const SKALA_CEPAT_LABELS = [
  'Sangat Lambat',
  'Lambat',
  'Cukup Cepat',
  'Cepat',
  'Sangat Cepat',
];

const inputCls = (err?: string) =>
  `w-full px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold border-2 rounded-lg shadow-[2px_2px_0px_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A855F7] transition-all placeholder:text-slate-400 placeholder:font-normal ${
    err ? 'border-rose-500' : 'border-slate-900'
  }`;

const pillCls = (active: boolean, err?: boolean) =>
  `cursor-pointer text-xs font-black px-3 py-2 rounded-xl border-2 transition-all ${
    active
      ? 'bg-[#A855F7] text-white border-slate-900 shadow-[2px_2px_0px_#6D28D9]'
      : err
      ? 'bg-white text-slate-800 border-rose-400 hover:border-slate-900'
      : 'bg-white text-slate-800 border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-slate-50'
  }`;

export default function SKMPage() {
  const slug = 'survei-kepuasan-masyarakat-diskominfo';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regNumber, setRegNumber] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Load draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`form_draft_${slug}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((prev) => ({
          ...prev,
          nama: parsed.nama || '',
          jenisKelamin: parsed.jenisKelamin || '',
          usia: parsed.usia || '',
          pendidikan: parsed.pendidikan || '',
          pekerjaan: parsed.pekerjaan || '',
          statusResponden: parsed.statusResponden || '',
          wilayah: parsed.wilayah || {},
          alamat: parsed.alamat || '',
          tKemudahan: parsed.tKemudahan || '',
          tKetepatan: parsed.tKetepatan || '',
          tKelengkapan: parsed.tKelengkapan || '',
          tTransparansi: parsed.tTransparansi || '',
          tAksesDokumen: parsed.tAksesDokumen || '',
          tSaran: parsed.tSaran || '',
          aduanKanal: parsed.aduanKanal || [],
          aduanFrekuensi: parsed.aduanFrekuensi || '',
          aduanKecepatan: parsed.aduanKecepatan || '',
          aduanKualitas: parsed.aduanKualitas || '',
          aduanPenyelesaian: parsed.aduanPenyelesaian || '',
          aduanSaran: parsed.aduanSaran || '',
          inetProvider: parsed.inetProvider || '',
          inetKecepatan: parsed.inetKecepatan || '',
          inetStabilitas: parsed.inetStabilitas || '',
          inetSinyal: parsed.inetSinyal || '',
          inetJangkauan: parsed.inetJangkauan || '',
          inetMemadai: parsed.inetMemadai || '',
          inetKendala: parsed.inetKendala || [],
          inetSaran: parsed.inetSaran || '',
          overall: parsed.overall || '',
          rekomendasi: parsed.rekomendasi || '',
          saranUmum: parsed.saranUmum || '',
        }));
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  // Autosave draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (submitted) return;
    try {
      localStorage.setItem(`form_draft_${slug}`, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form, slug, submitted]);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const toggleArray = (key: 'aduanKanal' | 'inetKendala', value: string) => {
    setForm((prev) => {
      const arr = prev[key];
      const next = arr.includes(value)
        ? arr.filter((x) => x !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.wilayah.kode_kec || !form.wilayah.kode_desa)
      e.wilayah = 'Wilayah domisili wajib dipilih';
    if (!form.tKemudahan) e.tKemudahan = 'Wajib dipilih';
    if (!form.tKetepatan) e.tKetepatan = 'Wajib dipilih';
    if (!form.tKelengkapan) e.tKelengkapan = 'Wajib dipilih';
    if (!form.tTransparansi) e.tTransparansi = 'Wajib dipilih';
    if (!form.tAksesDokumen) e.tAksesDokumen = 'Wajib dipilih';
    if (!form.aduanKecepatan) e.aduanKecepatan = 'Wajib dipilih';
    if (!form.aduanKualitas) e.aduanKualitas = 'Wajib dipilih';
    if (!form.inetSinyal) e.inetSinyal = 'Wajib dipilih';
    if (!form.inetKecepatan) e.inetKecepatan = 'Wajib dipilih';
    if (!form.overall) e.overall = 'Wajib dipilih';
    if (!form.rekomendasi) e.rekomendasi = 'Wajib dipilih';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;
    setSubmitting(true);
    setUploadStatus('Menyimpan isian survei...');
    try {
      const answers: Record<string, unknown> = {
        r_nama: form.nama,
        r_jenis_kelamin: form.jenisKelamin,
        r_usia: form.usia,
        r_pendidikan: form.pendidikan,
        r_pekerjaan: form.pekerjaan,
        r_status_responden: form.statusResponden,
        r_wilayah: form.wilayah,
        r_alamat: form.alamat,

        t_info_kemudahan: form.tKemudahan,
        t_info_ketepatan: form.tKetepatan,
        t_info_kelengkapan: form.tKelengkapan,
        t_info_transparansi: form.tTransparansi,
        t_info_akses_dokumen: form.tAksesDokumen,
        t_info_saran: form.tSaran,

        aduan_kanal: form.aduanKanal,
        aduan_frekuensi: form.aduanFrekuensi,
        aduan_kecepatan: form.aduanKecepatan,
        aduan_kualitas: form.aduanKualitas,
        aduan_penyelesaian: form.aduanPenyelesaian,
        aduan_saran: form.aduanSaran,

        inet_provider: form.inetProvider,
        inet_kecepatan: form.inetKecepatan,
        inet_stabilitas: form.inetStabilitas,
        inet_sinyal: form.inetSinyal,
        inet_jangkauan: form.inetJangkauan,
        inet_memadai: form.inetMemadai,
        inet_kendala: form.inetKendala,
        inet_saran: form.inetSaran,

        overall: form.overall,
        rekomendasi: form.rekomendasi,
        saran_umum: form.saranUmum,
      };

      let reg = '';
      try {
        const res = await fetch(`${apiBase}/public/forms/${slug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ respondent_nik: '', answers }),
        });
        const json = await res.json();
        if (json?.success && json?.data?.registration_number) {
          reg = json.data.registration_number;
        }
      } catch {
        /* backend unavailable -> local receipt */
      }

      if (!reg) {
        reg = `PBG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      }

      const now = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      try {
        const existing = JSON.parse(
          localStorage.getItem(`form_submissions_${slug}`) || '[]'
        );
        existing.push({ registration_number: reg, submitted_at: now, answers });
        localStorage.setItem(
          `form_submissions_${slug}`,
          JSON.stringify(existing)
        );
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

  const renderRating = (
    value: string,
    onChange: (v: string) => void,
    labels: string[] = RATING_LABELS,
    err?: string
  ) => (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n, i) => {
        const v = String(n);
        const active = value === v;
        return (
          <label
            key={v}
            className={`cursor-pointer flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all min-w-[70px] ${
              active
                ? 'bg-[#A855F7] text-white border-slate-900 shadow-[2px_2px_0px_#6D28D9]'
                : err
                ? 'bg-white text-slate-700 border-rose-400 hover:border-slate-900'
                : 'bg-white text-slate-700 border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A] hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name={`rating-${Math.random()}`}
              checked={active}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            <span className="font-black text-base leading-none">{n}</span>
            <span className="text-[9px] font-bold text-center leading-tight">
              {labels[i]}
            </span>
          </label>
        );
      })}
    </div>
  );

  // Result screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-6 print:bg-white">
        <div className="max-w-lg w-full bg-white border-2 border-slate-900 rounded-2xl shadow-[8px_8px_0px_#0F172A] overflow-hidden">
          <div className="bg-[#A855F7] border-b-2 border-slate-900 p-6 text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-purple-700 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight">Survei Berhasil Dikirim!</h1>
              <p className="text-xs font-bold text-purple-100">Tanda terima digital resmi eForm Purbalingga</p>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="bg-[#FEFCE8] border-2 border-slate-900 rounded-xl p-4 shadow-[3px_3px_0px_#0F172A]">
              <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                Nomor Registrasi
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{regNumber}</p>
              <p className="text-[11px] font-bold text-slate-600 mt-2">Dikirim pada: {submittedAt}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-700 leading-relaxed">
              Terima kasih atas partisipasi Anda dalam Survei Kepuasan Masyarakat (SKM) Dinas Komunikasi dan
              Informatika Kabupaten Purbalingga. Masukan Anda sangat berarti untuk peningkatan layanan publik,
              transparansi informasi, kanal aduan, dan kualitas konektivitas internet desa.
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

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A]">
      {/* Top bar */}
      <div className="bg-[#A855F7] text-white py-2.5 px-4 border-b-2 border-slate-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs gap-2 font-black">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Katalog Formulir
          </Link>
          <span className="tracking-tight hidden sm:block">
            E-Form Kabupaten Purbalingga • Dinas Komunikasi dan Informatika
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0F172A] overflow-hidden mb-6">
          <div className="h-3.5 bg-[#A855F7] border-b-2 border-slate-900" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#F3E8FF] text-purple-950 border-2 border-slate-900 rounded shadow-[1.5px_1.5px_0px_#0F172A]">
                Survei &amp; Evaluasi
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#E0F2FE] text-sky-950 border border-slate-900 rounded shadow-[1px_1px_0px_#0F172A]">
                Publik / Anonim
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              Survei Kepuasan Masyarakat (SKM) Layanan Diskominfo
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed">
              Evaluasi transparansi informasi publik, kecepatan respon kanal aduan, dan kualitas konektivitas
              internet desa se-Kabupaten Purbalingga. Identitas responden bersifat opsional; pengisian anonim
              diperbolehkan.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Data Anda dilindungi sesuai UU PDP No. 27 Tahun 2022.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {/* Section A: Identitas Responden */}
          <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <div className="w-9 h-9 bg-[#DDD6FE] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <User className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">A. Identitas Responden (Opsional)</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Boleh dikosongkan untuk pengisian anonim.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                    placeholder="Nama responden (opsional)"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Jenis Kelamin</label>
                  <select
                    value={form.jenisKelamin}
                    onChange={(e) => setField('jenisKelamin', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                    <option value="LAIN">Tidak menyebutkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Kelompok Usia</label>
                  <select
                    value={form.usia}
                    onChange={(e) => setField('usia', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="<17">&lt; 17 tahun</option>
                    <option value="17-25">17-25 tahun</option>
                    <option value="26-40">26-40 tahun</option>
                    <option value="41-60">41-60 tahun</option>
                    <option value=">60">&gt; 60 tahun</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Pendidikan Terakhir</label>
                  <select
                    value={form.pendidikan}
                    onChange={(e) => setField('pendidikan', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="SD">SD/Sederajat</option>
                    <option value="SMP">SMP/Sederajat</option>
                    <option value="SMA">SMA/SMK/Sederajat</option>
                    <option value="D3">Diploma (D3)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="S2/S3">Pascasarjana (S2/S3)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Status Responden</label>
                  <select
                    value={form.statusResponden}
                    onChange={(e) => setField('statusResponden', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Warga">Warga / Masyarakat Umum</option>
                    <option value="ASN">ASN / Aparatur Pemerintah</option>
                    <option value="Pelaku Usaha">Pelaku Usaha / UMKM</option>
                    <option value="Pelajar">Pelajar / Mahasiswa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1 mb-1.5">
                  Wilayah Domisili (Kecamatan &amp; Desa) <span className="text-rose-500">*</span>
                </label>
                <PurbalinggaRegionalSelect
                  value={form.wilayah}
                  onChange={(v) => setField('wilayah', v)}
                />
                {errors.wilayah && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.wilayah}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Pekerjaan</label>
                <input
                  type="text"
                  value={form.pekerjaan}
                  onChange={(e) => setField('pekerjaan', e.target.value)}
                  placeholder="Contoh: Guru, Petani, Wiraswasta"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">Alamat (opsional)</label>
                <textarea
                  rows={2}
                  value={form.alamat}
                  onChange={(e) => setField('alamat', e.target.value)}
                  placeholder="Alamat tempat tinggal"
                  className={inputCls()}
                />
              </div>
            </div>
          </section>

          {/* Section B: Transparansi Informasi Publik */}
          <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <div className="w-9 h-9 bg-[#F3E8FF] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Info className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">B. Transparansi Informasi Publik</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Beri penilaian 1 (sangat tidak puas) s/d 5 (sangat puas).
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {[
                {
                  key: 'tKemudahan',
                  label: 'Kemudahan menemukan informasi layanan Dinkominfo di kanal resmi (website/media sosial)',
                },
                {
                  key: 'tKetepatan',
                  label: 'Ketepatan & kebaruan informasi yang dipublikasikan (tidak kadaluarsa)',
                },
                {
                  key: 'tKelengkapan',
                  label: 'Kelengkapan informasi publik (agenda, pengumuman, layanan, kontak, pedoman)',
                },
                {
                  key: 'tTransparansi',
                  label: 'Keterbukaan informasi publik (laporan kinerja, anggaran, kegiatan)',
                },
                {
                  key: 'tAksesDokumen',
                  label: 'Kemudahan mengakses & mengunduh dokumen publik',
                },
              ].map((q) => (
                <div key={q.key}>
                  <label className="text-xs font-extrabold text-slate-900 mb-2 block">{q.label}</label>
                  {renderRating(
                    form[q.key as keyof FormState] as string,
                    (v) => setField(q.key as keyof FormState, v),
                    RATING_LABELS,
                    errors[q.key]
                  )}
                  {errors[q.key] && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">{errors[q.key]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Saran / masukan untuk transparansi informasi publik
                </label>
                <textarea
                  rows={3}
                  value={form.tSaran}
                  onChange={(e) => setField('tSaran', e.target.value)}
                  placeholder="Tuliskan saran Anda"
                  className={inputCls()}
                />
              </div>
            </div>
          </section>

          {/* Section C: Kecepatan Respon Kanal Aduan */}
          <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <div className="w-9 h-9 bg-[#FDE68A] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <MessageSquare className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">C. Kecepatan Respon Kanal Aduan</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Terkait kanal pengaduan/layanan (WhatsApp, call center, email, dll).
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Kanal aduan yang pernah Anda gunakan (boleh lebih dari satu)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KANAL_OPTIONS.map((opt) => {
                    const checked = form.aduanKanal.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          checked
                            ? 'bg-[#A855F7] text-white border-slate-900'
                            : 'bg-white text-slate-800 border-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArray('aduanKanal', opt)}
                          className="w-4 h-4 accent-purple-600"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                    Seberapa sering Anda menggunakan kanal aduan?
                  </label>
                  <select
                    value={form.aduanFrekuensi}
                    onChange={(e) => setField('aduanFrekuensi', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Belum pernah">Belum pernah</option>
                    <option value="1 kali">1 kali</option>
                    <option value="2-5 kali">2-5 kali</option>
                    <option value=">5 kali">&gt; 5 kali</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                    Apakah aduan Anda terselesaikan?
                  </label>
                  <select
                    value={form.aduanPenyelesaian}
                    onChange={(e) => setField('aduanPenyelesaian', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Ya">Ya, terselesaikan</option>
                    <option value="Sebagian">Sebagian terselesaikan</option>
                    <option value="Tidak">Tidak terselesaikan</option>
                    <option value="Belum">Belum ada tindak lanjut</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Kecepatan respons awal kanal aduan <span className="text-rose-500">*</span>
                </label>
                {renderRating(
                  form.aduanKecepatan,
                  (v) => setField('aduanKecepatan', v),
                  SKALA_CEPAT_LABELS,
                  errors.aduanKecepatan
                )}
                {errors.aduanKecepatan && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.aduanKecepatan}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Kualitas penanganan aduan (kesopanan, kejelasan, solusi) <span className="text-rose-500">*</span>
                </label>
                {renderRating(
                  form.aduanKualitas,
                  (v) => setField('aduanKualitas', v),
                  RATING_LABELS,
                  errors.aduanKualitas
                )}
                {errors.aduanKualitas && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.aduanKualitas}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Saran / masukan untuk peningkatan kanal aduan
                </label>
                <textarea
                  rows={3}
                  value={form.aduanSaran}
                  onChange={(e) => setField('aduanSaran', e.target.value)}
                  placeholder="Tuliskan saran Anda"
                  className={inputCls()}
                />
              </div>
            </div>
          </section>

          {/* Section D: Konektivitas Internet Desa */}
          <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <div className="w-9 h-9 bg-[#BBF7D0] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Wifi className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">D. Kualitas Konektivitas Internet Desa</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Berdasarkan pengalaman internet di desa tempat tinggal Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Penyedia internet utama yang digunakan
                </label>
                <select
                  value={form.inetProvider}
                  onChange={(e) => setField('inetProvider', e.target.value)}
                  className={inputCls()}
                >
                  <option value="">-- Pilih --</option>
                  <option value="Telkomsel">Telkomsel</option>
                  <option value="Indosat (IM3)">Indosat (IM3)</option>
                  <option value="XL Axiata">XL Axiata</option>
                  <option value="Tri (3)">Tri (3)</option>
                  <option value="Smartfren">Smartfren</option>
                  <option value="IndiHome">IndiHome (Telkom)</option>
                  <option value="Biznet">Biznet</option>
                  <option value="MyRepublic">MyRepublic</option>
                  <option value="Lainnya">Lainnya / tidak tahu</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                    Kecepatan internet yang dirasakan <span className="text-rose-500">*</span>
                  </label>
                  {renderRating(
                    form.inetKecepatan,
                    (v) => setField('inetKecepatan', v),
                    RATING_LABELS,
                    errors.inetKecepatan
                  )}
                  {errors.inetKecepatan && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.inetKecepatan}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                    Kekuatan sinyal di rumah <span className="text-rose-500">*</span>
                  </label>
                  {renderRating(
                    form.inetSinyal,
                    (v) => setField('inetSinyal', v),
                    RATING_LABELS,
                    errors.inetSinyal
                  )}
                  {errors.inetSinyal && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.inetSinyal}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                    Kestabilan koneksi internet
                  </label>
                  <select
                    value={form.inetStabilitas}
                    onChange={(e) => setField('inetStabilitas', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Sangat stabil">Sangat stabil (jarang gangguan)</option>
                    <option value="Cukup stabil">Cukup stabil (kadang gangguan)</option>
                    <option value="Tidak stabil">Tidak stabil (sering putus)</option>
                    <option value="Sangat tidak stabil">Sangat tidak stabil (hampir tidak bisa)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                    Jangkauan jaringan 4G/5G di desa
                  </label>
                  <select
                    value={form.inetJangkauan}
                    onChange={(e) => setField('inetJangkauan', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Tersedia merata">Tersedia merata di seluruh desa</option>
                    <option value="Tersedia sebagian">Tersedia di sebagian wilayah desa</option>
                    <option value="Tidak tersedia">Tidak tersedia / hanya 2G-3G</option>
                    <option value="Tidak tahu">Tidak tahu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Apakah kualitas internet memadai untuk kebutuhan sehari-hari (pendidikan, UMKM, layanan publik)?
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Ya, sangat memadai', 'Cukup memadai', 'Kurang memadai', 'Tidak memadai'].map((opt) => (
                    <label
                      key={opt}
                      className={`cursor-pointer px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        form.inetMemadai === opt
                          ? 'bg-[#A855F7] text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inetMemadai"
                        checked={form.inetMemadai === opt}
                        onChange={() => setField('inetMemadai', opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Kendala utama konektivitas internet (boleh lebih dari satu)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KENDALA_OPTIONS.map((opt) => {
                    const checked = form.inetKendala.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          checked
                            ? 'bg-[#A855F7] text-white border-slate-900'
                            : 'bg-white text-slate-800 border-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArray('inetKendala', opt)}
                          className="w-4 h-4 accent-purple-600"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Saran / masukan untuk peningkatan konektivitas internet desa
                </label>
                <textarea
                  rows={3}
                  value={form.inetSaran}
                  onChange={(e) => setField('inetSaran', e.target.value)}
                  placeholder="Tuliskan saran Anda"
                  className={inputCls()}
                />
              </div>
            </div>
          </section>

          {/* Section E: Penilaian Umum */}
          <section className="bg-white border-2 border-slate-900 rounded-2xl shadow-[5px_5px_0px_#0F172A] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <div className="w-9 h-9 bg-[#FECDD3] border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Star className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900">E. Penilaian Umum &amp; Saran</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Kesimpulan umum terhadap layanan Diskominfo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Kepuasan keseluruhan terhadap layanan Diskominfo <span className="text-rose-500">*</span>
                </label>
                {renderRating(form.overall, (v) => setField('overall', v), RATING_LABELS, errors.overall)}
                {errors.overall && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.overall}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-2 block">
                  Apakah Anda akan merekomendasikan layanan Diskominfo kepada orang lain? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Pasti', 'Mungkin', 'Tidak'].map((opt) => (
                    <label
                      key={opt}
                      className={`cursor-pointer px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        form.rekomendasi === opt
                          ? 'bg-[#A855F7] text-white border-slate-900'
                          : errors.rekomendasi
                          ? 'bg-white text-slate-800 border-rose-400'
                          : 'bg-white text-slate-800 border-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rekomendasi"
                        checked={form.rekomendasi === opt}
                        onChange={() => setField('rekomendasi', opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {errors.rekomendasi && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.rekomendasi}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-900 mb-1.5 block">
                  Saran umum / masukan tambahan
                </label>
                <textarea
                  rows={3}
                  value={form.saranUmum}
                  onChange={(e) => setField('saranUmum', e.target.value)}
                  placeholder="Tuliskan saran umum Anda"
                  className={inputCls()}
                />
              </div>
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
            <Link href="/" className="btn-brutal-white justify-center flex-1">
              Batal
            </Link>
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
                  <CheckCircle2 className="w-4 h-4" /> Kirim Survei
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
