import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminOPDPage from '../page';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

const opd = {
  id: 'opd-1',
  kode_opd: 'DINSOS',
  nama_opd: 'Dinas Sosial',
  singkatan: 'Dinsos',
  logo_url: null,
  total_users: 1,
  total_forms: 2,
  created_at: '2026-10-01T00:00:00Z',
};

const user = {
  id: 'user-1',
  opd_id: 'opd-1',
  opd_name: 'Dinas Sosial',
  nama: 'Operator Sosial',
  email: 'operator@example.go.id',
  role: 'OPERATOR' as const,
  is_active: true,
  created_at: '2026-10-01T00:00:00Z',
};

describe('AdminOPDPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiFetch as jest.Mock).mockImplementation((path: string) =>
      Promise.resolve(path.endsWith('/opds') ? [opd] : [user]),
    );
  });

  it('menampilkan OPD dan akun dengan status aktif', async () => {
    render(<AdminOPDPage />);

    expect(await screen.findAllByText('Dinas Sosial')).toHaveLength(2);
    expect(screen.getByText('Operator Sosial')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('membuat pengguna terikat ke OPD yang dipilih', async () => {
    (apiFetch as jest.Mock).mockImplementation((path: string) => {
      if (path.endsWith('/opds')) return Promise.resolve([opd]);
      if (path.endsWith('/users')) return Promise.resolve([user]);
      return Promise.resolve({});
    });

    render(<AdminOPDPage />);
    expect(await screen.findByText('Operator Sosial')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /Tambah pengguna/ }));
    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Operator Baru' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'baru@example.go.id' } });
    fireEvent.change(screen.getByLabelText('Password awal'), { target: { value: 'password-aman-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pengguna' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/admin/superadmin/users', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"opd_id":"opd-1"'),
      }));
    });
  });
});
