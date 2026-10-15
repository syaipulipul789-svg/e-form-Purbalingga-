'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!token || !user) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center gap-4 bg-brutal-grid">
        <div className="w-16 h-16 bg-[#059669] border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[4px_4px_0px_#0F172A]">
          PBG
        </div>
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
          Memeriksa sesi Anda...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#0F172A] bg-brutal-grid">
      {/* Top accent bar */}
      <div className="bg-[#FFE600] text-slate-900 py-2 px-4 border-b-2 border-slate-900">
        <div className="max-w-7xl mx-auto text-center text-[11px] font-black tracking-tight">
          PANEL ADMINISTRASI • E-FORM KABUPATEN PURBALINGGA
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <AdminHeader />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <AdminSidebar />

          <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}