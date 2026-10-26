import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminFormsPage from '../page';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));

const form = {
  id: 'form-dinsos',
  slug: 'bansos-lansia',
  title: 'Bantuan Lansia',
  description: 'Form pendataan',
  status: 'DRAFT',
  total_responses: 0,
  start_date: null,
  end_date: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

describe('AdminFormsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'ADMIN_OPD', opd: { nama_opd: 'Dinsos' } },
    });
    (apiFetch as jest.Mock).mockResolvedValue({
      items: [form],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('memberi Super Admin akses melihat seluruh formulir dan menjelaskan OPD formulir baru', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        role: 'SUPER_ADMIN',
        opd: { id: 'opd-diskominfo', nama_opd: 'Diskominfo' },
      },
    });
    render(<AdminFormsPage />);

    expect(await screen.findByText('Bantuan Lansia')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Semua Formulir' })).toBeInTheDocument();
    expect(screen.getByText(/seluruh OPD/i)).toBeInTheDocument();
    expect(screen.getByText(/OPD pada akun Anda/i)).toBeInTheDocument();
  });

  it('memuat formulir dan memperbarui status melalui API', async () => {
    render(<AdminFormsPage />);

    expect(await screen.findByText('Bantuan Lansia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terbitkan' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/forms/form-dinsos/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
    });
  });

  it('membuat formulir baru dengan kolom wajib sebagai draft', async () => {
    (apiFetch as jest.Mock).mockImplementation((path: string) => {
      if (path === '/forms') return Promise.resolve({ id: 'new-form' });
      return Promise.resolve({ items: [form], page: 1, limit: 10, total: 1 });
    });

    render(<AdminFormsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Buat formulir' }));
    fireEvent.change(screen.getByLabelText('Judul formulir'), {
      target: { value: 'Pendataan Bantuan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tambah kolom' }));
    fireEvent.change(screen.getByPlaceholderText('Contoh: Nama lengkap'), {
      target: { value: 'Nama pemohon' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan formulir' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/forms', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"title":"Pendataan Bantuan"'),
      }));
    });
  });
});
