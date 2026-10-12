'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export interface KecamatanItem {
  kode_kec: number;
  nama_kecamatan: string;
  kode_kab: string;
}

export interface DesaItem {
  kode_desa: number;
  kode_kec: number;
  nama_desa: string;
}

export interface RegionalValue {
  kode_kec?: number;
  nama_kecamatan?: string;
  kode_desa?: number;
  nama_desa?: string;
}

interface PurbalinggaRegionalSelectProps {
  value?: RegionalValue;
  onChange?: (val: RegionalValue) => void;
  required?: boolean;
}

export default function PurbalinggaRegionalSelect({
  value,
  onChange,
  required = true,
}: PurbalinggaRegionalSelectProps) {
  const [kecamatanList, setKecamatanList] = useState<KecamatanItem[]>([]);
  const [desaList, setDesaList] = useState<DesaItem[]>([]);
  const [selectedKec, setSelectedKec] = useState<number | undefined>(value?.kode_kec);
  const [selectedDesa, setSelectedDesa] = useState<number | undefined>(value?.kode_desa);
  const [loadingKec, setLoadingKec] = useState<boolean>(true);
  const [loadingDesa, setLoadingDesa] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  // 1. Fetch seluruh 18 Kecamatan Purbalingga
  useEffect(() => {
    async function fetchKecamatan() {
      try {
        setLoadingKec(true);
        setErrorMsg(null);
        const res = await fetch(`${apiBase}/wilayah/kecamatan`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setKecamatanList(data.data);
        } else {
          // Fallback data awal jika backend belum terkoneksi
          setKecamatanList([
            { kode_kec: 330315, nama_kecamatan: 'PADAMARA', kode_kab: '3303' },
            { kode_kec: 330305, nama_kecamatan: 'PURBALINGGA', kode_kab: '3303' },
            { kode_kec: 330309, nama_kecamatan: 'BOBOTSARI', kode_kab: '3303' },
            { kode_kec: 330308, nama_kecamatan: 'MREBET', kode_kab: '3303' },
            { kode_kec: 330306, nama_kecamatan: 'KALIMANAH', kode_kab: '3303' },
          ]);
        }
      } catch (err) {
        console.warn('Menggunakan fallback data kecamatan:', err);
        setKecamatanList([
          { kode_kec: 330315, nama_kecamatan: 'PADAMARA', kode_kab: '3303' },
          { kode_kec: 330305, nama_kecamatan: 'PURBALINGGA', kode_kab: '3303' },
          { kode_kec: 330309, nama_kecamatan: 'BOBOTSARI', kode_kab: '3303' },
        ]);
      } finally {
        setLoadingKec(false);
      }
    }
    fetchKecamatan();
  }, [apiBase]);

  // 2. Chaining: Saat Kecamatan Dipilih, Ambil Daftar Desa Terkait
  useEffect(() => {
    if (!selectedKec) {
      setDesaList([]);
      setSelectedDesa(undefined);
      return;
    }

    async function fetchDesa(kodeKec: number) {
      try {
        setLoadingDesa(true);
        const res = await fetch(`${apiBase}/wilayah/desa?kode_kec=${kodeKec}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setDesaList(data.data);
        } else {
          setDesaList([
            { kode_desa: 3303152001, kode_kec: kodeKec, nama_desa: 'KARANGPULE' },
            { kode_desa: 3303151004, kode_kec: kodeKec, nama_desa: 'KARANGSENTUL' },
            { kode_desa: 3303152002, kode_kec: kodeKec, nama_desa: 'SOKAWERA' },
            { kode_desa: 3303152009, kode_kec: kodeKec, nama_desa: 'PADAMARA' },
          ]);
        }
      } catch (err) {
        console.warn('Menggunakan fallback data desa:', err);
        setDesaList([
          { kode_desa: 3303152001, kode_kec: kodeKec, nama_desa: 'KARANGPULE' },
          { kode_desa: 3303151004, kode_kec: kodeKec, nama_desa: 'KARANGSENTUL' },
        ]);
      } finally {
        setLoadingDesa(false);
      }
    }

    fetchDesa(selectedKec);
  }, [selectedKec, apiBase]);

  const handleKecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setSelectedKec(val);
    setSelectedDesa(undefined);

    const foundKec = kecamatanList.find((k) => k.kode_kec === val);
    if (onChange) {
      onChange({
        kode_kec: val,
        nama_kecamatan: foundKec?.nama_kecamatan,
        kode_desa: undefined,
        nama_desa: undefined,
      });
    }
  };

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setSelectedDesa(val);

    const foundKec = kecamatanList.find((k) => k.kode_kec === selectedKec);
    const foundDesa = desaList.find((d) => d.kode_desa === val);

    if (onChange) {
      onChange({
        kode_kec: selectedKec,
        nama_kecamatan: foundKec?.nama_kecamatan,
        kode_desa: val,
        nama_desa: foundDesa?.nama_desa,
      });
    }
  };

  return (
    <div className="p-5 bg-[#F0FDF4] border-2 border-black rounded-lg shadow-[4px_4px_0px_#121212] transition-all">
      {/* Header Badge Neobrutalism */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-[#059669] text-white font-extrabold text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_#121212] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Wilayah Purbalingga
          </span>
          <span className="text-xs font-bold text-neutral-700">Kode Kab: 3303</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-400 rounded">
          Chaining API Sidami
        </span>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-100 border-2 border-black rounded text-xs font-bold text-rose-800 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Grid Chaining Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropdown 1: Kecamatan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-black flex items-center gap-1">
            Kecamatan {required && <span className="text-rose-600">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedKec || ''}
              onChange={handleKecChange}
              disabled={loadingKec}
              className="cursor-pointer w-full px-3 py-2.5 bg-white text-black text-sm font-bold border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-neutral-100 disabled:cursor-not-allowed appearance-none"
            >
              <option value="">
                {loadingKec ? 'Memuat data kecamatan...' : '-- Pilih Kecamatan --'}
              </option>
              {kecamatanList.map((kec) => (
                <option key={kec.kode_kec} value={kec.kode_kec}>
                  {kec.nama_kecamatan} ({kec.kode_kec})
                </option>
              ))}
            </select>
            {loadingKec && (
              <Loader2 className="w-4 h-4 text-neutral-500 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Dropdown 2: Desa / Kelurahan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-black flex items-center gap-1">
            Desa / Kelurahan {required && <span className="text-rose-600">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedDesa || ''}
              onChange={handleDesaChange}
              disabled={!selectedKec || loadingDesa}
              className="cursor-pointer w-full px-3 py-2.5 bg-white text-black text-sm font-bold border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed appearance-none"
            >
              <option value="">
                {!selectedKec
                  ? '-- Pilih Kecamatan Terlebih Dahulu --'
                  : loadingDesa
                  ? 'Memuat desa...'
                  : '-- Pilih Desa / Kelurahan --'}
              </option>
              {desaList.map((desa) => (
                <option key={desa.kode_desa} value={desa.kode_desa}>
                  {desa.nama_desa}
                </option>
              ))}
            </select>
            {loadingDesa && (
              <Loader2 className="w-4 h-4 text-neutral-500 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Selected Indicator */}
      {selectedKec && selectedDesa && (
        <div className="mt-3 pt-3 border-t-2 border-black/10 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Wilayah terpilih: Kec.{' '}
            {kecamatanList.find((k) => k.kode_kec === selectedKec)?.nama_kecamatan}, Desa{' '}
            {desaList.find((d) => d.kode_desa === selectedDesa)?.nama_desa}
          </span>
        </div>
      )}
    </div>
  );
}
