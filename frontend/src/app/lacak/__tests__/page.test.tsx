import { fireEvent, render, screen } from '@testing-library/react';
import TrackPage from '../page';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: jest.fn(),
}));

describe('TrackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('menampilkan status dan catatan publik pengajuan', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      registration_number: 'PBG-20261115-ABCDEF',
      form_title: 'Pendataan Pelaku Usaha Mikro (UMKM) & Bantuan Modal 2026',
      status: 'VERIFIED',
      public_note: 'Berkas sedang diverifikasi lapangan.',
      submitted_at: '2026-11-15T08:00:00Z',
      updated_at: '2026-11-16T08:00:00Z',
    });

    render(<TrackPage />);
    fireEvent.change(screen.getByLabelText(/Nomor registrasi/i), {
      target: { value: 'PBG-20261115-ABCDEF' },
    });
    fireEvent.change(screen.getByLabelText(/NIK/i), {
      target: { value: '3303151201900001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cek Status/i }));

    expect(await screen.findByText('Diverifikasi')).toBeInTheDocument();
    expect(screen.getByText('Berkas sedang diverifikasi lapangan.')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith(
      '/public/track',
      expect.objectContaining({ method: 'POST', auth: false }),
    );
  });

  it('menampilkan pesan saat pengajuan tidak ditemukan', async () => {
    (apiFetch as jest.Mock).mockRejectedValue(
      new Error('Pengajuan tidak ditemukan. Periksa kembali nomor registrasi dan NIK Anda.'),
    );

    render(<TrackPage />);
    fireEvent.change(screen.getByLabelText(/Nomor registrasi/i), {
      target: { value: 'PBG-20261115-ABCDEF' },
    });
    fireEvent.change(screen.getByLabelText(/NIK/i), {
      target: { value: '3303151201900001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cek Status/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak ditemukan/i);
  });
});
