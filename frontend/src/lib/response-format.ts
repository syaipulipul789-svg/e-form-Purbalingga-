export interface FileAnswer {
  file_id?: string;
  file_url: string;
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${key}: ${displayValue(item)}`)
    .join(' · ');
}

export function isFileAnswer(value: unknown): value is FileAnswer {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).file_url === 'string'
  );
}

export function getAnswerName(answers: Record<string, unknown>): string {
  const entry = Object.entries(answers).find(([key]) => /(^|[_-])nama($|[_-])|nama/i.test(key));
  return entry ? displayValue(entry[1]) : 'Pemohon';
}

export function maskSensitiveValue(value: unknown): string {
  const text = displayValue(value);
  if (!/^\d{10,}$/.test(text)) return text;
  return `${'•'.repeat(text.length - 4)}${text.slice(-4)}`;
}

export function responseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
