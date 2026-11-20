'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/components/admin/auth-provider';
import { FieldEditor } from '@/components/admin/form-builder/field-editor';
import { SortableField } from '@/components/admin/form-builder/sortable-field';
import {
  ApiRequestError,
  createAdminForm,
  errorMessage,
  getAdminForm,
  listOPD,
  updateAdminForm,
  type AdminForm,
  type AdminFormPayload,
  type FormField,
  type FormSchema,
  type FormSection,
  type FormSettings,
  type FormStatus,
  type OPDSummary,
} from '@/lib/api';
import {
  cn,
  FORM_STATUS_LABEL,
  FORM_STATUS_STYLE,
  generateId,
  slugify,
  toDateInput,
  fromDateInput,
} from '@/lib/utils';

interface FormEditorProps {
  formId?: string;
}

interface DraftState {
  title: string;
  slug: string;
  description: string;
  banner_url: string;
  status: FormStatus;
  opd_id: string;
  schema: FormSchema;
  settings: FormSettings;
}

interface EditingField {
  sectionId: string;
  index: number;
  field: FormField | null;
}

const DEFAULT_SETTINGS: FormSettings = {
  is_public: true,
  require_nik: false,
  one_response_per_nik: false,
  max_submissions: 0,
  start_date: null,
  end_date: null,
};

function newSection(index: number): FormSection {
  return {
    id: generateId('s'),
    title: `Bagian ${index}`,
    description: '',
    fields: [],
  };
}

function emptyDraft(): DraftState {
  return {
    title: '',
    slug: '',
    description: '',
    banner_url: '',
    status: 'DRAFT',
    opd_id: '',
    schema: { version: 1, sections: [newSection(1)] },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function normalizeSchema(schema?: FormSchema | null): FormSchema {
  if (!schema || !Array.isArray(schema.sections) || schema.sections.length === 0) {
    return { version: 1, sections: [newSection(1)] };
  }
  return {
    version: schema.version ?? 1,
    sections: schema.sections.map((section, index) => ({
      id: section.id || generateId('s'),
      title: section.title || `Bagian ${index + 1}`,
      description: section.description || '',
      fields: Array.isArray(section.fields) ? section.fields : [],
    })),
  };
}

function normalizeSettings(settings?: Partial<FormSettings> | null): FormSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    is_public: settings?.is_public ?? true,
    require_nik: settings?.require_nik ?? false,
    one_response_per_nik: settings?.one_response_per_nik ?? false,
    max_submissions: settings?.max_submissions ?? 0,
  };
}

function toDraft(form: AdminForm): DraftState {
  return {
    title: form.title || '',
    slug: form.slug || '',
    description: form.description || '',
    banner_url: form.banner_url || '',
    status: form.status,
    opd_id: form.opd_id || '',
    schema: normalizeSchema(form.schema),
    settings: normalizeSettings(form.settings),
  };
}

function collectFields(schema: FormSchema): FormField[] {
  return schema.sections.flatMap((section) => section.fields);
}

export function FormEditor({ formId }: FormEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [loading, setLoading] = useState(Boolean(formId));
  const [saving, setSaving] = useState<FormStatus | null>(null);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<Array<{ field?: string; label?: string; issue?: string }>>([]);
  const [notice, setNotice] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(formId));
  const [opds, setOpds] = useState<OPDSummary[]>([]);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [loadedForm, setLoadedForm] = useState<AdminForm | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getAdminForm(formId)
      .then((form) => {
        if (!active) return;
        setLoadedForm(form);
        setDraft(toDraft(form));
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [formId]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    listOPD()
      .then((items) => {
        setOpds(items);
        setDraft((current) => ({
          ...current,
          opd_id: current.opd_id || items[0]?.id || '',
        }));
      })
      .catch(() => setOpds([]));
  }, [user?.role]);

  const totalFields = useMemo(() => collectFields(draft.schema).length, [draft.schema]);
  const isArchived = loadedForm?.status === 'ARCHIVED' || draft.status === 'ARCHIVED';
  const isPublished = loadedForm?.status === 'PUBLISHED';

  const setField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateSection = (sectionId: string, patch: Partial<FormSection>) => {
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section
        ),
      },
    }));
  };

  const addSection = () => {
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: [...current.schema.sections, newSection(current.schema.sections.length + 1)],
      },
    }));
  };

  const duplicateSection = (section: FormSection) => {
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: [
          ...current.schema.sections,
          {
            ...section,
            id: generateId('s'),
            title: `${section.title} (salinan)`,
            fields: section.fields.map((field) => ({ ...field, id: generateId('f') })),
          },
        ],
      },
    }));
  };

  const deleteSection = (section: FormSection) => {
    if (!window.confirm(`Hapus bagian "${section.title}" beserta ${section.fields.length} field?`)) {
      return;
    }
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.filter((item) => item.id !== section.id),
      },
    }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= draft.schema.sections.length) return;
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: arrayMove(current.schema.sections, index, next),
      },
    }));
  };

  const saveField = (field: FormField) => {
    if (!editingField) return;
    const { sectionId, index } = editingField;
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const fields = [...section.fields];
          if (index < 0) {
            fields.push(field);
          } else {
            fields[index] = field;
          }
          return { ...section, fields };
        }),
      },
    }));
    setEditingField(null);
  };

  const deleteField = (section: FormSection, field: FormField) => {
    if (!window.confirm(`Hapus field "${field.label}"?`)) return;
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((item) =>
          item.id === section.id
            ? { ...item, fields: item.fields.filter((entry) => entry.id !== field.id) }
            : item
        ),
      },
    }));
  };

  const handleDragEnd = (sectionId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const oldIndex = section.fields.findIndex((field) => field.id === active.id);
          const newIndex = section.fields.findIndex((field) => field.id === over.id);
          if (oldIndex < 0 || newIndex < 0) return section;
          return { ...section, fields: arrayMove(section.fields, oldIndex, newIndex) };
        }),
      },
    }));
  };

  const validateDraft = (status: FormStatus): string | null => {
    if (!draft.title.trim()) return 'Judul formulir wajib diisi.';
    if (!draft.slug.trim()) return 'Slug formulir wajib diisi.';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
      return 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.';
    }
    if (status === 'PUBLISHED') {
      if (draft.schema.sections.length === 0) return 'Formulir harus memiliki minimal satu bagian.';
      for (const section of draft.schema.sections) {
        if (!section.title.trim()) return 'Setiap bagian wajib memiliki judul sebelum dipublikasikan.';
        for (const field of section.fields) {
          if (!field.label.trim()) return 'Setiap field wajib memiliki label sebelum dipublikasikan.';
          if (['select', 'radio'].includes(field.type) && (field.options || []).length === 0) {
            return `Field "${field.label}" harus memiliki minimal satu opsi.`;
          }
        }
      }
      if (totalFields === 0) return 'Formulir harus memiliki minimal satu field sebelum dipublikasikan.';
    }
    if (
      draft.settings.start_date &&
      draft.settings.end_date &&
      new Date(draft.settings.end_date) < new Date(draft.settings.start_date)
    ) {
      return 'Tanggal berakhir harus setelah tanggal mulai.';
    }
    return null;
  };

  const handleSave = async (statusOverride?: FormStatus) => {
    const status = statusOverride || draft.status;
    const validation = validateDraft(status);
    if (validation) {
      setError(validation);
      setDetails([]);
      return;
    }

    setSaving(status);
    setError('');
    setDetails([]);
    setNotice('');

    const payload: AdminFormPayload = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim() || null,
      banner_url: draft.banner_url.trim() || null,
      status,
      schema: {
        ...draft.schema,
        sections: draft.schema.sections.map((section) => ({
          ...section,
          title: section.title.trim(),
          description: section.description?.trim() || '',
          fields: section.fields.map((field) => ({
            ...field,
            label: field.label.trim(),
          })),
        })),
      },
      settings: {
        ...draft.settings,
        max_submissions: Number(draft.settings.max_submissions) || 0,
      },
      ...(user?.role === 'SUPER_ADMIN' && draft.opd_id ? { opd_id: draft.opd_id } : {}),
    };

    try {
      const saved = formId
        ? await updateAdminForm(formId, payload)
        : await createAdminForm(payload);
      setLoadedForm(saved);
      setDraft(toDraft(saved));
      setSlugTouched(true);
      setNotice(
        status === 'PUBLISHED'
          ? 'Formulir berhasil disimpan dan dipublikasikan.'
          : 'Formulir berhasil disimpan.'
      );
      if (!formId) {
        router.replace(`/admin/forms/${saved.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiRequestError && Array.isArray(err.details)) {
        setDetails(
          err.details as Array<{ field?: string; label?: string; issue?: string }>
        );
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="card-brutal flex items-center gap-3 px-6 py-5">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-black">Memuat formulir…</span>
        </div>
      </div>
    );
  }

  if (error && !loadedForm && formId) {
    return (
      <div className="card-brutal border-rose-900 bg-rose-50">
        <h1 className="text-lg font-black text-rose-950">Formulir tidak dapat dimuat</h1>
        <p className="mt-1 text-sm font-semibold text-rose-800">{error}</p>
        <Link href="/admin/forms" className="btn-brutal-white mt-4">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Formulir
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/admin/forms"
            className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke daftar formulir
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">
              {formId ? 'Edit Formulir' : 'Formulir Baru'}
            </h1>
            <span
              className={cn(
                'rounded-md border-2 border-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                FORM_STATUS_STYLE[draft.status]
              )}
            >
              {FORM_STATUS_LABEL[draft.status]}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
            Susun struktur formulir, atur aturan pengisian, lalu simpan sebagai draft atau
            publikasikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(saving) || isArchived}
            onClick={() => void handleSave(draft.status)}
            className="btn-brutal-white"
          >
            {saving === draft.status ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPublished || draft.status === 'CLOSED' ? 'Simpan Perubahan' : 'Simpan Draft'}
          </button>
          <button
            type="button"
            disabled={Boolean(saving) || isArchived}
            onClick={() => void handleSave('PUBLISHED')}
            className="btn-brutal-emerald"
          >
            {saving === 'PUBLISHED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isPublished ? 'Simpan & Publikasikan' : 'Publikasikan'}
          </button>
        </div>
      </section>

      {isArchived ? (
        <div className="flex items-start gap-3 rounded-lg border-2 border-purple-900 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Formulir ini berstatus diarsipkan. Pulihkan status ke draft melalui halaman daftar sebelum
          mengedit.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border-2 border-rose-900 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          <p>{error}</p>
          {details.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-semibold">
              {details.map((detail, index) => (
                <li key={`${detail.field}-${index}`}>
                  {detail.label || detail.field}: {detail.issue}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-900 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          <Check className="h-4 w-4" />
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card-brutal">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-black">Informasi Formulir</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Judul Formulir <span className="text-rose-600">*</span>
                </span>
                <input
                  value={draft.title}
                  disabled={isArchived}
                  onChange={(event) => {
                    const title = event.target.value;
                    setDraft((current) => ({
                      ...current,
                      title,
                      slug: !slugTouched ? slugify(title) : current.slug,
                    }));
                  }}
                  placeholder="Contoh: Pendataan Pelaku Usaha Mikro 2026"
                  className="input-brutal"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Slug URL <span className="text-rose-600">*</span>
                </span>
                <div className="flex items-center rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0F172A] focus-within:ring-2 focus-within:ring-emerald-600">
                  <span className="border-r-2 border-slate-900 bg-slate-100 px-2.5 py-2.5 font-mono text-xs font-bold text-slate-500">
                    /f/
                  </span>
                  <input
                    value={draft.slug}
                    disabled={isArchived}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setField('slug', slugify(event.target.value));
                    }}
                    placeholder="slug-formulir"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 font-mono text-xs font-semibold focus:outline-none"
                  />
                </div>
                <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                  Huruf kecil, angka, dan tanda hubung.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  URL Banner (opsional)
                </span>
                <input
                  value={draft.banner_url}
                  disabled={isArchived}
                  onChange={(event) => setField('banner_url', event.target.value)}
                  placeholder="/uploads/banners/banner.png"
                  className="input-brutal"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Deskripsi
                </span>
                <textarea
                  rows={3}
                  value={draft.description}
                  disabled={isArchived}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="Jelaskan tujuan, sasaran, dan ketentuan formulir…"
                  className="input-brutal resize-y"
                />
              </label>

              {user?.role === 'SUPER_ADMIN' ? (
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                    OPD Penanggung Jawab <span className="text-rose-600">*</span>
                  </span>
                  <select
                    value={draft.opd_id}
                    disabled={isArchived}
                    onChange={(event) => setField('opd_id', event.target.value)}
                    className="input-brutal"
                  >
                    <option value="">Pilih OPD</option>
                    {opds.map((opd) => (
                      <option key={opd.id} value={opd.id}>
                        {opd.singkatan ? `${opd.singkatan} — ` : ''}
                        {opd.nama_opd}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </section>

          <section className="card-brutal">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-sky-700" />
                  <h2 className="text-lg font-black">Struktur Formulir</h2>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {draft.schema.sections.length} bagian · {totalFields} field
                </p>
              </div>
              <button
                type="button"
                onClick={addSection}
                disabled={isArchived}
                className="btn-brutal-sky px-4 py-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Bagian
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {draft.schema.sections.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-slate-300 px-4 py-10 text-center">
                  <p className="text-sm font-black text-slate-700">Belum ada bagian</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Tambahkan bagian untuk mulai menyusun field formulir.
                  </p>
                </div>
              ) : (
                draft.schema.sections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="rounded-xl border-2 border-slate-900 bg-[#F8FAFC] p-4 shadow-brutal-xs"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#FFE600] text-xs font-black">
                        {sectionIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <input
                          value={section.title}
                          disabled={isArchived}
                          onChange={(event) =>
                            updateSection(section.id, { title: event.target.value })
                          }
                          placeholder="Judul bagian"
                          className="w-full rounded-md border-2 border-slate-900 bg-white px-3 py-1.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                        <input
                          value={section.description || ''}
                          disabled={isArchived}
                          onChange={(event) =>
                            updateSection(section.id, { description: event.target.value })
                          }
                          placeholder="Deskripsi bagian (opsional)"
                          className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(sectionIndex, -1)}
                          disabled={isArchived || sectionIndex === 0}
                          className="rounded border-2 border-slate-900 bg-white p-1.5 disabled:opacity-30"
                          aria-label="Naikkan bagian"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(sectionIndex, 1)}
                          disabled={isArchived || sectionIndex === draft.schema.sections.length - 1}
                          className="rounded border-2 border-slate-900 bg-white p-1.5 disabled:opacity-30"
                          aria-label="Turunkan bagian"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSection(section)}
                          disabled={isArchived}
                          className="rounded border-2 border-slate-900 bg-white p-1.5 hover:bg-sky-100 disabled:opacity-30"
                          aria-label="Duplikasi bagian"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(section)}
                          disabled={isArchived}
                          className="rounded border-2 border-slate-900 bg-white p-1.5 text-rose-700 hover:bg-rose-100 disabled:opacity-30"
                          aria-label="Hapus bagian"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(section.id, event)}
                      >
                        <SortableContext
                          items={section.fields.map((field) => field.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {section.fields.map((field, fieldIndex) => (
                            <SortableField
                              key={field.id}
                              field={field}
                              index={fieldIndex}
                              onEdit={() =>
                                setEditingField({ sectionId: section.id, index: fieldIndex, field })
                              }
                              onDelete={() => deleteField(section, field)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>

                      {section.fields.length === 0 ? (
                        <p className="rounded-md border-2 border-dashed border-slate-300 bg-white px-3 py-4 text-center text-[11px] font-semibold text-slate-500">
                          Belum ada field pada bagian ini.
                        </p>
                      ) : null}

                      <button
                        type="button"
                        disabled={isArchived}
                        onClick={() =>
                          setEditingField({ sectionId: section.id, index: -1, field: null })
                        }
                        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-400 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:border-slate-900 hover:bg-[#FFE600] hover:text-slate-900 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Field ke Bagian Ini
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card-brutal">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-purple-700" />
              <h2 className="text-lg font-black">Pengaturan</h2>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  key: 'is_public' as const,
                  title: 'Tampilkan ke publik',
                  description: 'Formulir dapat diakses melalui portal publik.',
                },
                {
                  key: 'require_nik' as const,
                  title: 'Wajib NIK',
                  description: 'Responden harus mengisi NIK Purbalingga yang valid.',
                },
                {
                  key: 'one_response_per_nik' as const,
                  title: 'Satu respons per NIK',
                  description: 'Cegah pengiriman ganda dari NIK yang sama.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 rounded-lg border-2 border-slate-900 bg-white px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(draft.settings[item.key])}
                    disabled={isArchived}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        settings: { ...current.settings, [item.key]: event.target.checked },
                      }))
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    <span className="block text-xs font-black">{item.title}</span>
                    <span className="block text-[10px] font-semibold leading-relaxed text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Kuota Respons
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.settings.max_submissions}
                  disabled={isArchived}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        max_submissions: Number(event.target.value) || 0,
                      },
                    }))
                  }
                  className="input-brutal"
                />
                <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                  0 berarti tanpa batas.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Mulai Dibuka
                </span>
                <input
                  type="datetime-local"
                  value={toDateInput(draft.settings.start_date)}
                  disabled={isArchived}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        start_date: fromDateInput(event.target.value),
                      },
                    }))
                  }
                  className="input-brutal"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Ditutup Pada
                </span>
                <input
                  type="datetime-local"
                  value={toDateInput(draft.settings.end_date)}
                  disabled={isArchived}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        end_date: fromDateInput(event.target.value),
                      },
                    }))
                  }
                  className="input-brutal"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border-2 border-slate-900 bg-[#FEFCE8] p-5 shadow-brutal">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-black">Ringkasan</h2>
            </div>
            <dl className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between gap-2">
                <dt>Bagian</dt>
                <dd className="font-black text-slate-900">{draft.schema.sections.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>Total field</dt>
                <dd className="font-black text-slate-900">{totalFields}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>Field wajib</dt>
                <dd className="font-black text-slate-900">
                  {collectFields(draft.schema).filter((field) => field.required).length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>Status</dt>
                <dd className="font-black text-slate-900">{FORM_STATUS_LABEL[draft.status]}</dd>
              </div>
            </dl>
            {draft.slug ? (
              <a
                href={`/f/${draft.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-between gap-2 rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-[11px] font-black hover:bg-[#FFE600]"
              >
                <span className="truncate font-mono">/f/{draft.slug}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : null}
            <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">
              Pratinjau tautan publik hanya aktif setelah formulir dipublikasikan.
            </p>
          </section>
        </aside>
      </div>

      {editingField ? (
        <FieldEditor
          field={editingField.field}
          onSave={saveField}
          onClose={() => setEditingField(null)}
        />
      ) : null}
    </div>
  );
}
