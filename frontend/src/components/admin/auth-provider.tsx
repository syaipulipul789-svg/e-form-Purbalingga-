'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutAdmin, type AuthUser } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setUser(null);
      router.replace('/login');
    }
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-6">
        <div className="card-brutal max-w-sm w-full text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl border-2 border-slate-900 bg-[#FFE600] shadow-brutal-sm flex items-center justify-center">
            <span className="font-black text-lg">PBG</span>
          </div>
          <p className="font-black text-slate-900">
            {loading ? 'Memeriksa sesi admin…' : 'Mengalihkan ke halaman login…'}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Portal Admin E-Form Kabupaten Purbalingga
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
