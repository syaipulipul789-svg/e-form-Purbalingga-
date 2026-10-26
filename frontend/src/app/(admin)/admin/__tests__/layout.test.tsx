import { render, screen, waitFor } from '@testing-library/react';
import AdminLayout from '../layout';
import { AuthProvider } from '@/lib/auth';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/admin',
}));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const SUPER_ADMIN = {
  id: 'u1',
  nama: 'Super Admin Diskominfo',
  email: 'superadmin@purbalinggakab.go.id',
  role: 'SUPER_ADMIN',
  opd: {
    id: 'o1',
    kode_opd: 'DISKOMINFO',
    nama_opd: 'Dinas Komunikasi dan Informatika',
  },
};

describe('AdminLayout (guard akses)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockRouter.replace.mockClear();
    global.fetch = jest.fn();
  });

  it('tanpa token -> redirect ke /login dan konten admin tidak dirender', async () => {
    render(
      <AuthProvider>
        <AdminLayout>
          <div>Konten Rahasia Admin</div>
        </AdminLayout>
      </AuthProvider>,
    );

    expect(screen.getByText(/Memeriksa sesi Anda/)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('Konten Rahasia Admin')).not.toBeInTheDocument();
  });

  it('token valid ber-role SUPER_ADMIN -> merender shell + menu khusus super admin', async () => {
    localStorage.setItem('eform_token', 'token-valid');
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'OK', data: SUPER_ADMIN }),
    );

    render(
      <AuthProvider>
        <AdminLayout>
          <div>Konten Rahasia Admin</div>
        </AdminLayout>
      </AuthProvider>,
    );

    expect(await screen.findByText('Super Admin Diskominfo')).toBeInTheDocument();
    expect(screen.getByText('Konten Rahasia Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Semua Formulir' })).toHaveAttribute('href', '/admin/forms');
    expect(screen.getByRole('link', { name: 'Respons Masuk' })).toHaveAttribute('href', '/admin/responses');
    expect(screen.getByRole('link', { name: 'OPD & Pengguna' })).toHaveAttribute('href', '/admin/opd');
    expect(screen.getByRole('link', { name: 'Monitoring Sistem' })).toHaveAttribute('href', '/admin/monitoring');
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toHaveAttribute('href', '/admin/audit');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('token valid ber-role ADMIN_OPD -> menu admin OPD tanpa menu super admin', async () => {
    localStorage.setItem('eform_token', 'token-valid');
    const adminOpd = {
      ...SUPER_ADMIN,
      role: 'ADMIN_OPD',
      nama: 'Admin Dinkes',
      email: 'admin.dinkes@purbalinggakab.go.id',
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'OK', data: adminOpd }),
    );

    render(
      <AuthProvider>
        <AdminLayout>
          <div>Konten Rahasia Admin</div>
        </AdminLayout>
      </AuthProvider>,
    );

    expect(await screen.findByText('Admin Dinkes')).toBeInTheDocument();
    expect(screen.getByText('Formulir Saya')).toBeInTheDocument();
    expect(screen.getByText('Respons Masuk')).toBeInTheDocument();
    expect(screen.queryByText('OPD & Pengguna')).not.toBeInTheDocument();
    expect(screen.queryByText('Monitoring Sistem')).not.toBeInTheDocument();
  });
});