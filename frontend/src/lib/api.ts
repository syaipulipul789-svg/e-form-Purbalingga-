export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088/api/v1';

export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '');

export interface PublicFormOPD {
  id: string;
  kode_opd: string;
  nama_opd: string;
  singkatan?: string | null;
}

export interface PublicForm {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  banner_url?: string | null;
  status: string;
  schema: FormSchema;
  settings: FormSettings;
  total_responses: number;
  start_date?: string | null;
  end_date?: string | null;
  is_open: boolean;
  closed_reason?: string;
  opd: PublicFormOPD;
}

export interface UploadResult {
  file_id: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export interface SubmitResult {
  submission_id: string;
  registration_number: string;
  submitted_at: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_OPD';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type VerificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVISION';

export interface OPDSummary {
  id: string;
  kode_opd: string;
  nama_opd: string;
  singkatan?: string | null;
}

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  opd_id?: string | null;
  opd?: OPDSummary | null;
  is_active: boolean;
}

export interface LoginResult {
  token: string;
  expires_in: number;
  user: AuthUser;
}

export interface FormOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  allowedExtensions?: string[];
  maxSizeInMB?: number;
}

export interface FieldConfig {
  min?: number | null;
  max?: number | null;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency_idr'
  | 'email'
  | 'nik'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file_upload'
  | 'regional_purbalingga'
  | 'rating'
  | 'linear_scale';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: FormOption[];
  validation?: FieldValidation;
  config?: FieldConfig;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  version?: number | string;
  sections: FormSection[];
}

export interface FormSettings {
  is_public: boolean;
  require_nik: boolean;
  one_response_per_nik: boolean;
  max_submissions: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface AdminFormSummary {
  id: string;
  opd_id: string;
  creator_id: string;
  slug: string;
  title: string;
  description?: string | null;
  banner_url?: string | null;
  status: FormStatus;
  total_responses: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  opd: OPDSummary;
}

export interface AdminForm extends AdminFormSummary {
  schema: FormSchema;
  settings: FormSettings;
}

export interface AdminFormPayload {
  title: string;
  slug: string;
  description?: string | null;
  banner_url?: string | null;
  status: FormStatus;
  schema: FormSchema;
  settings: FormSettings;
  opd_id?: string;
}

export interface AdminResponse {
  id: string;
  form_id: string;
  registration_number?: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  verification_status: VerificationStatus;
  verification_note?: string | null;
  verified_by?: string | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  submitted_at: string;
}

export interface ResponseSummary {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  revision: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface RecentResponse {
  id: string;
  form_id: string;
  form_title: string;
  form_slug: string;
  registration_number?: string | null;
  verification_status: VerificationStatus;
  submitted_at: string;
}

export interface TopForm {
  id: string;
  slug: string;
  title: string;
  total_responses: number;
  status: FormStatus;
}

export interface DashboardSummary {
  total_forms: number;
  published_forms: number;
  draft_forms: number;
  closed_forms: number;
  total_responses: number;
  responses_today: number;
  responses_this_month: number;
  pending_verification: number;
  response_trend: TrendPoint[];
  recent_responses: RecentResponse[];
  top_forms: TopForm[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ResponsePageMeta extends PageMeta {
  summary: ResponseSummary;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: unknown;
  error?: {
    code?: string;
    details?: unknown;
  };
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) return { success: response.ok };

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiRequestError(
      'Respons server tidak dapat dibaca',
      response.status,
      'INVALID_RESPONSE'
    );
  }
}

async function requestEnvelope<T>(
  path: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...init,
    });
  } catch {
    throw new ApiRequestError(
      'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
      0,
      'NETWORK_ERROR'
    );
  }

  const envelope = await readEnvelope<T>(response);
  if (!response.ok || !envelope.success) {
    throw new ApiRequestError(
      envelope.message || 'Permintaan ke server gagal',
      response.status,
      envelope.error?.code,
      envelope.error?.details
    );
  }

  return envelope;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const envelope = await requestEnvelope<T>(path, init);
  if (envelope.data === undefined) {
    throw new ApiRequestError('Data respons kosong', 200, 'EMPTY_RESPONSE');
  }
  return envelope.data;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const raw = query.toString();
  return raw ? `?${raw}` : '';
}

export function resolveFileUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function listPublicForms(): Promise<PublicForm[]> {
  return request<PublicForm[]>('/public/forms');
}

export async function getPublicForm(slug: string): Promise<PublicForm> {
  return request<PublicForm>(`/public/forms/${encodeURIComponent(slug)}`);
}

export async function uploadSubmissionFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  return request<UploadResult>('/public/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function submitPublicForm(
  slug: string,
  respondentNik: string,
  answers: Record<string, unknown>,
  idempotencyKey: string
): Promise<SubmitResult> {
  return request<SubmitResult>(
    `/public/forms/${encodeURIComponent(slug)}/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        respondent_nik: respondentNik,
        answers,
      }),
    }
  );
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}

export async function logoutAdmin(): Promise<void> {
  await request<{ logged_out: boolean }>('/auth/logout', { method: 'POST' });
}

export async function listOPD(): Promise<OPDSummary[]> {
  return request<OPDSummary[]>('/opd');
}

export async function getDashboardSummary(opdId?: string): Promise<DashboardSummary> {
  return request<DashboardSummary>(`/dashboard/summary${buildQuery({ opd_id: opdId })}`);
}

export async function listAdminForms(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  opd_id?: string;
}): Promise<{ data: AdminFormSummary[]; meta: PageMeta }> {
  const envelope = await requestEnvelope<AdminFormSummary[]>(
    `/forms${buildQuery(params)}`
  );
  return {
    data: envelope.data || [],
    meta: envelope.meta as PageMeta,
  };
}

export async function getAdminForm(id: string): Promise<AdminForm> {
  return request<AdminForm>(`/forms/${id}`);
}

export async function createAdminForm(payload: AdminFormPayload): Promise<AdminForm> {
  return request<AdminForm>('/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminForm(
  id: string,
  payload: AdminFormPayload
): Promise<AdminForm> {
  return request<AdminForm>(`/forms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminFormStatus(
  id: string,
  status: FormStatus
): Promise<AdminForm> {
  return request<AdminForm>(`/forms/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminForm(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/forms/${id}`, { method: 'DELETE' });
}

export async function listAdminResponses(
  formId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    verification_status?: string;
    kode_kec?: string;
    date_from?: string;
    date_to?: string;
  }
): Promise<{ data: AdminResponse[]; meta: ResponsePageMeta }> {
  const envelope = await requestEnvelope<AdminResponse[]>(
    `/forms/${formId}/responses${buildQuery(params)}`
  );
  return {
    data: envelope.data || [],
    meta: envelope.meta as ResponsePageMeta,
  };
}

export async function getAdminResponse(
  formId: string,
  responseId: string
): Promise<AdminResponse> {
  return request<AdminResponse>(`/forms/${formId}/responses/${responseId}`);
}

export async function verifyAdminResponse(
  formId: string,
  responseId: string,
  status: VerificationStatus,
  note: string
): Promise<AdminResponse> {
  return request<AdminResponse>(
    `/forms/${formId}/responses/${responseId}/verification`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    }
  );
}

export async function exportAdminResponses(
  formId: string,
  format: 'csv' | 'xlsx',
  params: {
    search?: string;
    verification_status?: string;
    kode_kec?: string;
    date_from?: string;
    date_to?: string;
  }
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(
    `${API_BASE}/forms/${formId}/export${buildQuery({ ...params, format })}`,
    { credentials: 'include' }
  );
  if (!response.ok) {
    const envelope = await readEnvelope<never>(response);
    throw new ApiRequestError(
      envelope.message || 'Ekspor gagal',
      response.status,
      envelope.error?.code,
      envelope.error?.details
    );
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob: await response.blob(),
    filename: match?.[1] || `respons.${format}`,
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak diketahui';
}
