import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminDashboardPage from '../page';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

const adminDinsos = {
  id: 'u-dinsos',
  nama: 'Admin Dinas Sosial',
  email: 'admin.dinsos@purbalinggakab.go.id',
  role: 'ADMIN_OPD' as const,
  opd: {
    id: 'opd-dinsos',
    kode_opd: 'DINSOS',
    nama_opd: 'Dinas Sosial Kabupaten Purbalingga',
    singkatan: 'Dinsos',
  },
};

function form(overrides: Partial<{
  id: string;
  slug: string;
  title: string;
  status: string;
  total_responses: number;
}> = {}) {
  return {
    id: 'form-lansia',
    slug: 'bantuan-kesejahteraan-sosial-lansia',
    title: 'Verifikasi Calon Penerima Program Asistensi Sosial Lanjut Usia',
    description: null,
    status: 'PUBLISHED',
    total_responses: 4,
    start_date: null,
    end_date: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('AdminDashboardPage untuk Admin OPD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: adminDinsos });
  });

  it('menampilkan ringkasan data formulir dari API untuk akun Dinsos', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      items: [
        form(),
        form({ id: 'form-draft', slug: 'pendataan', title: 'Pendataan Lansia', status: 'DRAFT', total_responses: 1 }),
      ],
      page: 1,
      limit: 100,
      total: 2,
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText('Verifikasi Calon Penerima Program Asistensi Sosial Lanjut Usia')).toBeInTheDocument();
    expect(screen.getByText('Total Formulir')).toBeInTheDocument();
    expect(screen.getByText('Formulir Terbit')).toBeInTheDocument();
    expect(screen.getByText('Total Respons Masuk')).toBeInTheDocument();
    expect(screen.getByText('Formulir Draft')).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('5', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat form publik/ })).toHaveAttribute(
      'href',
      '/f/bantuan-kesejahteraan-sosial-lansia',
    );
    expect(apiFetch).toHaveBeenCalledWith('/forms?page=1&limit=100');
  });

  it('menampilkan pesan ketika data dashboard gagal dimuat', async () => {
    (apiFetch as jest.Mock).mockRejectedValue(new Error('Server tidak tersedia'));

    render(<AdminDashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server tidak tersedia');
  });
});
