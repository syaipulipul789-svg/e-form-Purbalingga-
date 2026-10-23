'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { FormField } from '@/lib/api';
import { FIELD_TYPE_LABEL, cn } from '@/lib/utils';

interface SortableFieldProps {
  field: FormField;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableField({ field, index, onEdit, onDelete }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-3 py-2.5',
        isDragging && 'relative z-20 shadow-brutal-lg ring-4 ring-[#38BDF8]/40'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Geser field ${field.label}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-slate-900 bg-[#F1F5F9] text-[10px] font-black">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-slate-900">
          {field.label || '(tanpa label)'}
          {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <span className="rounded bg-slate-100 px-1.5 py-0.5">
            {FIELD_TYPE_LABEL[field.type] || field.type}
          </span>
          <span className="font-mono text-slate-400">{field.id}</span>
          {field.options?.length ? <span>{field.options.length} opsi</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded border-2 border-slate-900 bg-white p-1.5 hover:bg-[#FFE600]"
          aria-label={`Edit field ${field.label}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border-2 border-slate-900 bg-white p-1.5 text-rose-700 hover:bg-rose-100"
          aria-label={`Hapus field ${field.label}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
