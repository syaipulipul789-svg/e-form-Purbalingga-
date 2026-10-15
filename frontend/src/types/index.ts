export type Role = 'SUPER_ADMIN' | 'ADMIN_OPD' | 'OPERATOR';

export interface OPDSummary {
  id: string;
  kode_opd: string;
  nama_opd: string;
  singkatan?: string | null;
  logo_url?: string | null;
}

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: Role;
  opd?: OPDSummary | null;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
  user: AuthUser;
}

export interface ApiErrorBody {
  code?: string;
  details?: unknown;
}

export interface ApiEnvelope {
  success: boolean;
  message: string;
  data?: unknown;
  error?: ApiErrorBody;
}