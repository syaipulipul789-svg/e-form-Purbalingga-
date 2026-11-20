import React from 'react';
import { FormEditor } from '@/components/admin/form-builder/form-editor';

export default function EditFormPage({ params }: { params: { id: string } }) {
  return <FormEditor formId={params.id} />;
}
