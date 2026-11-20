export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const TOKEN_KEY = 'eform_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: 'no-store',
  });

  const body = (await res.json().catch(() => null)) as {
    data?: T;
    message?: string;
    error?: { code?: string; details?: unknown };
  } | null;

  if (!res.ok) {
    const message =
      body?.message || 'Terjadi kesalahan, silakan coba beberapa saat lagi';
    const code = body?.error?.code;
    const details = body?.error?.details;
    throw new ApiError(message, res.status, code, details);
  }

  return body?.data as T;
}