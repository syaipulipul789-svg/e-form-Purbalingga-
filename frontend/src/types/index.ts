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

export interface FormSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  total_responses: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormDetail extends FormSummary {
  banner_url: string | null;
  schema: {
    version?: string;
    sections?: Array<{
      id: string;
      title: string;
      description?: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        required: boolean;
        placeholder?: string;
        options?: Array<{ value: string; label: string }>;
      }>;
    }>;
  };
  settings: Record<string, unknown>;
}

export interface FormListResponse {
  items: FormSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  registration_number: string | null;
  respondent_identifier: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  submitted_at: string;
}

export interface FormResponseListResponse {
  items: FormResponse[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminOPD {
  id: string;
  kode_opd: string;
  nama_opd: string;
  singkatan: string | null;
  logo_url: string | null;
  total_users: number;
  total_forms: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  opd_id: string | null;
  opd_name: string | null;
  nama: string;
  email: string;
  role: 'ADMIN_OPD' | 'OPERATOR';
  is_active: boolean;
  created_at: string;
}

export interface AdminMetrics {
  status: 'healthy' | 'degraded';
  database: 'healthy' | 'unavailable';
  total_opd: number;
  total_users: number;
  active_users: number;
  total_forms: number;
  published_forms: number;
  total_responses: number;
  checked_at: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity_type: 'OPD' | 'USER';
  entity_id: string | null;
  entity_name: string;
  details: Record<string, string>;
  ip_address: string;
  created_at: string;
}

export interface AuditListResponse {
  items: AuditEntry[];
  page: number;
  limit: number;
  total: number;
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