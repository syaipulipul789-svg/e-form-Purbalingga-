import { ApiError, apiFetch, clearToken, getToken, setToken } from '../api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mengembalikan data dari envelope sukses', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'OK', data: { id: 1 } }),
      );

    const data = await apiFetch<{ id: number }>('/ping');
    expect(data).toEqual({ id: 1 });
  });

  it('menyisipkan header Authorization Bearer dari localStorage', async () => {
    setToken('abc123');
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, message: 'OK', data: null }));

    await apiFetch('/auth/me');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc123');
  });

  it('tidak menyisipkan token saat opsi auth=false', async () => {
    setToken('abc123');
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, message: 'OK', data: null }));

    await apiFetch('/auth/login', { method: 'POST', auth: false });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('melempar ApiError berisi code, details dan status saat HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          message: 'Email atau password salah',
          error: {
            code: 'INVALID_CREDENTIALS',
            details: { field: 'password' },
          },
        },
        401,
      ),
    );

    const promise = apiFetch('/auth/login');
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau password salah',
      details: { field: 'password' },
    });
  });

  it('memakai pesan default saat respon error tanpa message', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ success: false }, 500));

    await expect(apiFetch('/x')).rejects.toThrow('Terjadi kesalahan');
  });

  it('getToken / setToken / clearToken memanfaatkan localStorage', () => {
    expect(getToken()).toBeNull();

    setToken('tok-123');
    expect(getToken()).toBe('tok-123');

    clearToken();
    expect(getToken()).toBeNull();
  });
});