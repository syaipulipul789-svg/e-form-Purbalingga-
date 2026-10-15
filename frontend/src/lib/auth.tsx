'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, clearToken, getToken, setToken } from '@/lib/api';
import type { AuthUser, LoginResponse } from '@/types';

const USER_KEY = 'eform_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const storedToken = getToken();
      if (!storedToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      setTokenState(storedToken);

      try {
        const me = await apiFetch<AuthUser>('/auth/me');
        if (!cancelled) {
          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        }
      } catch {
        clearToken();
        localStorage.removeItem(USER_KEY);
        if (!cancelled) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return ctx;
}