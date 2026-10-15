import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
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
  usePathname: () => '/login',
}));

function makeLoginResponse(role: string) {
  return {
    success: true,
    message: 'Login berhasil',
    data: {
      token: 'token-test',
      expires_in: 86400,
      user: {
        id: 'u1',
        nama: 'Admin Dinkes',
        email: 'admin.dinkes@purbalinggakab.go.id',
        role,
        opd: {
          id: 'o1',
          kode_opd: 'DINKES',
          nama_opd: 'Dinas Kesehatan Kabupaten Purbalingga',
        },
      },
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockRouter.replace.mockClear();
    global.fetch = jest.fn();
  });

  it('login sukses -> memanggil /auth/login lalu redirect ke /admin', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(makeLoginResponse('ADMIN_OPD')),
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await user.type(
      screen.getByPlaceholderText('nama@...purbalinggakab.go.id'),
      'admin.dinkes@purbalinggakab.go.id',
    );
    await user.type(
      screen.getByPlaceholderText('Masukkan kata sandi'),
      'Purbalingga2026!',
    );
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/admin');
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /masuk/i })).toBeEnabled();
    });

    const loginCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]: [string]) => String(url).includes('/auth/login'),
    );
    expect(loginCall).toBeTruthy();
  });

  it('password salah -> menampilkan pesan error dan tidak redirect', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          message: 'Email atau password salah',
          error: { code: 'INVALID_CREDENTIALS' },
        },
        401,
      ),
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await user.type(
      screen.getByPlaceholderText('nama@...purbalinggakab.go.id'),
      'admin.dinkes@purbalinggakab.go.id',
    );
    await user.type(screen.getByPlaceholderText('Masukkan kata sandi'), 'salah');
    await user.click(screen.getByRole('button', { name: /masuk/i }));

    expect(
      await screen.findByText('Email atau password salah'),
    ).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('pengunjung yang sudah login otomatis diarahkan ke /admin', async () => {
    const auth = makeLoginResponse('SUPER_ADMIN').data;
    localStorage.setItem('eform_token', 'token-tersimpan');
    localStorage.setItem('eform_user', JSON.stringify(auth.user));
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, message: 'OK', data: auth.user }),
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/admin');
    });
  });
});