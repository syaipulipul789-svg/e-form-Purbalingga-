import { fireEvent, render, screen } from '@testing-library/react';
import AdminResponsesPage from '../page';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));

const form = {
  id: 'form-dinsos',
  slug: 'bansos-lansia',
  title: 'Bantuan Lansia',
  description: null,
  status: 'PUBLISHED',
  total_responses: 1,
  start_date: null,
  end_date: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

describe('AdminResponsesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'ADMIN_OPD' } });
    (apiFetch as jest.Mock).mockImplementation((path: string) => {
      if (path === '/forms?page=1&limit=100') {
        return Promise.resolve({ items: [form], page: 1, limit: 100, total: 1 });
      }
      if (path === '/forms/form-dinsos') {
        return Promise.resolve({
          ...form,
          banner_url: null,
          schema: {
            sections: [{
              id: 'data',
              title: 'Data Pemohon',
              fields: [{ id: 'nama', type: 'text', label: 'Nama lengkap', required: true }],
            }],
          },
          settings: {},
        });
      }
      return Promise.resolve({
        items: [{
          id: 'response-1',
          form_id: 'form-dinsos',
          registration_number: 'REG-001',
          respondent_identifier: null,
          answers: { nama: 'Siti', f_nik: '3303123456789012' },
          metadata: {},
          submitted_at: '2026-10-15T08:00:00Z',
        }],
        page: 1,
        limit: 20,
        total: 1,
      });
    });
  });

  it('menampilkan keterangan cakupan semua OPD untuk Super Admin', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'SUPER_ADMIN' } });
    render(<AdminResponsesPage />);

    expect(screen.getByText(/formulir dari seluruh OPD/i)).toBeInTheDocument();
    expect(await screen.findByText('Siti')).toBeInTheDocument();
  });

  it('memuat respons per formulir dan menampilkan detail dengan NIK tersamarkan', async () => {
    render(<AdminResponsesPage />);

    expect(await screen.findByText('Siti')).toBeInTheDocument();
    expect(screen.getByText('REG-001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat' }));

    expect(await screen.findByText('Nama lengkap')).toBeInTheDocument();
    expect(screen.getByText('••••••••••••9012')).toBeInTheDocument();
    expect(screen.queryByText('3303123456789012')).not.toBeInTheDocument();
  });
});
