'use client';

import React, { useEffect, useState } from 'react';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import type { FieldType, FormField, FormOption } from '@/lib/api';
import { FIELD_TYPE_LABEL, generateId } from '@/lib/utils';

interface FieldEditorProps {
  field: FormField | null;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'currency_idr',
  'email',
  'nik',
  'select',
  'radio',
  'checkbox',
  'date',
  'time',
  'datetime',
  'file_upload',
  'regional_purbalingga',
  'rating',
  'linear_scale',
];

const CHOICE_TYPES: FieldType[] = ['select', 'radio', 'checkbox'];

function emptyField(): FormField {
  return {
    id: generateId('f'),
    type: 'text',
    label: '',
    placeholder: '',
    helpText: '',
    required: false,
    options: [],
    validation: {},
    config: {},
  };
}

export function FieldEditor({ field, onSave, onClose }: FieldEditorProps) {
  const [draft, setDraft] = useState<FormField>(field || emptyField());
  const [optionValue, setOptionValue] = useState('');
  const [optionLabel, setOptionLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(field || emptyField());
    setOptionValue('');
    setOptionLabel('');
    setError('');
  }, [field]);

  const isChoice = CHOICE_TYPES.includes(draft.type);
  const isNumeric = draft.type === 'number' || draft.type === 'currency_idr';
  const isTextLike = ['text', 'textarea', 'email', 'nik'].includes(draft.type);
  const isScale = draft.type === 'rating' || draft.type === 'linear_scale';
  const isFile = draft.type === 'file_upload';

  const update = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateValidation = (key: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      validation: { ...(current.validation || {}), [key]: value },
    }));
  };

  const updateConfig = (key: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      config: { ...(current.config || {}), [key]: value },
    }));
  };

  const addOption = () => {
    const label = optionLabel.trim() || optionValue.trim();
    const value =
      optionValue.trim() ||
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    if (!value) {
      setError('Label atau nilai opsi wajib diisi.');
      return;
    }
    const options = draft.options || [];
    if (options.some((option) => option.value === value)) {
      setError('Nilai opsi sudah digunakan.');
      return;
    }
    update('options', [...options, { value, label }]);
    setOptionValue('');
    setOptionLabel('');
    setError('');
  };

  const removeOption = (index: number) => {
    update('options', (draft.options || []).filter((_, i) => i !== index));
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    const options = [...(draft.options || [])];
    const next = index + direction;
    if (next < 0 || next >= options.length) return;
    [options[index], options[next]] = [options[next], options[index]];
    update('options', options);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.label.trim()) {
      setError('Label field wajib diisi.');
      return;
    }
    if (isChoice && (draft.options || []).length === 0) {
      setError('Tambahkan minimal satu opsi untuk field pilihan.');
      return;
    }
    if (isScale) {
      const min = Number(draft.config?.min ?? 1);
      const max = Number(draft.config?.max ?? 5);
      if (min >= max) {
        setError('Nilai minimum skala harus lebih kecil dari maksimum.');
        return;
      }
    }

    const clean: FormField = {
      ...draft,
      label: draft.label.trim(),
      placeholder: draft.placeholder?.trim() || '',
      helpText: draft.helpText?.trim() || '',
      options: isChoice ? draft.options || [] : [],
    };
    onSave(clean);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="my-4 w-full max-w-3xl rounded-xl border-2 border-slate-900 bg-[#FFFDF5] shadow-brutal-lg"
      >
        <div className="flex items-center justify-between border-b-2 border-slate-900 bg-[#FFE600] px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
              Form Builder
            </p>
            <h2 className="text-lg font-black">{field ? 'Edit Field' : 'Tambah Field'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border-2 border-slate-900 bg-white p-1.5 hover:bg-slate-100"
            aria-label="Tutup editor field"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {error ? (
            <div className="rounded-lg border-2 border-rose-900 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                Label Field <span className="text-rose-600">*</span>
              </span>
              <input
                value={draft.label}
                onChange={(event) => update('label', event.target.value)}
                placeholder="Contoh: Nomor Induk Kependudukan"
                className="input-brutal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                Tipe Field <span className="text-rose-600">*</span>
              </span>
              <select
                value={draft.type}
                onChange={(event) => update('type', event.target.value as FieldType)}
                className="input-brutal"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FIELD_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                ID Field
              </span>
              <input
                value={draft.id}
                onChange={(event) =>
                  update('id', event.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))
                }
                className="input-brutal font-mono text-xs"
              />
              <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                Digunakan sebagai kunci jawaban. Jangan diubah setelah form menerima respons.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                Placeholder
              </span>
              <input
                value={draft.placeholder || ''}
                onChange={(event) => update('placeholder', event.target.value)}
                placeholder="Teks bantuan di dalam input"
                className="input-brutal"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
              Teks Bantuan
            </span>
            <input
              value={draft.helpText || ''}
              onChange={(event) => update('helpText', event.target.value)}
              placeholder="Keterangan tambahan di bawah field"
              className="input-brutal"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border-2 border-slate-900 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(event) => update('required', event.target.checked)}
              className="h-4 w-4 rounded border-2 border-slate-900"
            />
            <span>
              <span className="block text-xs font-black">Wajib diisi</span>
              <span className="block text-[10px] font-semibold text-slate-500">
                Responden tidak dapat mengirim formulir tanpa mengisi field ini.
              </span>
            </span>
          </label>

          {isChoice ? (
            <div className="rounded-lg border-2 border-slate-900 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                  Opsi Pilihan
                </p>
                <span className="text-[10px] font-bold text-slate-400">
                  {(draft.options || []).length} opsi
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {(draft.options || []).length === 0 ? (
                  <p className="rounded-md border-2 border-dashed border-slate-300 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">
                    Belum ada opsi. Tambahkan minimal satu.
                  </p>
                ) : (
                  (draft.options || []).map((option: FormOption, index) => (
                    <div
                      key={`${option.value}-${index}`}
                      className="flex items-center gap-2 rounded-md border-2 border-slate-900 bg-[#FFFDF5] px-2 py-1.5"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black">{option.label}</p>
                        <p className="truncate font-mono text-[10px] text-slate-400">{option.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => moveOption(index, -1)}
                        className="rounded border border-slate-300 px-1 text-[10px] font-black disabled:opacity-30"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOption(index, 1)}
                        className="rounded border border-slate-300 px-1 text-[10px] font-black disabled:opacity-30"
                        disabled={index === (draft.options || []).length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded border border-rose-300 p-1 text-rose-600"
                        aria-label={`Hapus opsi ${option.label}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={optionLabel}
                  onChange={(event) => setOptionLabel(event.target.value)}
                  placeholder="Label opsi"
                  className="input-brutal"
                />
                <input
                  value={optionValue}
                  onChange={(event) => setOptionValue(event.target.value)}
                  placeholder="Nilai opsi"
                  className="input-brutal font-mono text-xs"
                />
                <button type="button" onClick={addOption} className="btn-brutal-white px-3 py-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Tambah
                </button>
              </div>
            </div>
          ) : null}

          {isTextLike ? (
            <div className="grid gap-4 rounded-lg border-2 border-slate-900 bg-white p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Panjang Minimum
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.validation?.minLength ?? ''}
                  onChange={(event) =>
                    updateValidation(
                      'minLength',
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  className="input-brutal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Panjang Maksimum
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.validation?.maxLength ?? ''}
                  onChange={(event) =>
                    updateValidation(
                      'maxLength',
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  className="input-brutal"
                />
              </label>
            </div>
          ) : null}

          {isNumeric ? (
            <div className="grid gap-4 rounded-lg border-2 border-slate-900 bg-white p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Nilai Minimum
                </span>
                <input
                  type="number"
                  value={draft.validation?.min ?? ''}
                  onChange={(event) =>
                    updateValidation(
                      'min',
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  className="input-brutal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Nilai Maksimum
                </span>
                <input
                  type="number"
                  value={draft.validation?.max ?? ''}
                  onChange={(event) =>
                    updateValidation(
                      'max',
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  className="input-brutal"
                />
              </label>
            </div>
          ) : null}

          {isScale ? (
            <div className="grid gap-4 rounded-lg border-2 border-slate-900 bg-white p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Nilai Terendah
                </span>
                <input
                  type="number"
                  value={draft.config?.min ?? 1}
                  onChange={(event) => updateConfig('min', Number(event.target.value))}
                  className="input-brutal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Nilai Tertinggi
                </span>
                <input
                  type="number"
                  value={draft.config?.max ?? 5}
                  onChange={(event) => updateConfig('max', Number(event.target.value))}
                  className="input-brutal"
                />
              </label>
            </div>
          ) : null}

          {isFile ? (
            <div className="grid gap-4 rounded-lg border-2 border-slate-900 bg-white p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Ekstensi Diizinkan
                </span>
                <input
                  value={(draft.validation?.allowedExtensions || []).join(', ')}
                  onChange={(event) =>
                    updateValidation(
                      'allowedExtensions',
                      event.target.value
                        .split(',')
                        .map((item) => item.trim().replace(/^\./, '').toLowerCase())
                        .filter(Boolean)
                    )
                  }
                  placeholder="jpg, png, pdf"
                  className="input-brutal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Ukuran Maksimum (MB)
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.validation?.maxSizeInMB ?? 5}
                  onChange={(event) => updateValidation('maxSizeInMB', Number(event.target.value))}
                  className="input-brutal"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-slate-900 bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="btn-brutal-white">
            Batal
          </button>
          <button type="submit" className="btn-brutal-emerald">
            Simpan Field
          </button>
        </div>
      </form>
    </div>
  );
}
