import React from 'react';
import { AuthProvider } from '@/components/admin/auth-provider';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
