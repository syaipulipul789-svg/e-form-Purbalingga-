import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormPage from '../page';

const SLUG = 'bansos-umkm-purbalingga-2026';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('Halaman formulir publik UMKM', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      `form_draft_${SLUG}`,
      JSON.stringify({
        nik: '3303151201900001',
        nama: 'Budi Santoso',
        noHp: '081234567890',
        email: '',
        alamat: 'Jl. Raya Padamara',
        namaUsaha: 'Warung Berkah',
        jenisUsaha: 'Kuliner',
        alamatUsaha: 'Jl. Raya Padamara',
        lamaUsaha: '2',
        jumlahTenaga: '1',
        omzet: '1000000',
        modal: '500000',
        jenisBantuan: 'Modal usaha',
        keterangan: '',
        pernyataan: true,
      }),
    );

    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/wilayah/kecamatan')) {
        return jsonResponse({
          success: true,
          data: [{ kode_kec: 330315, nama_kecamatan: 'PADAMARA', kode_kab: '3303' }],
        });
      }
      if (url.includes('/wilayah/desa')) {
        return jsonResponse({
          success: true,
          data: [{ kode_desa: 3303152001, kode_kec: 330315, nama_desa: 'KARANGPULE' }],
        });
      }
      if (url.includes('/public/upload')) {
        return jsonResponse({
          success: true,
          data: { file_id: 'f-1', file_url: '/uploads/berkas.jpg' },
        });
      }
      if (url.includes('/public/forms/') && url.includes('/submit')) {
        return jsonResponse(
          {
            success: false,
            message: 'respons sudah pernah dikirim untuk NIK ini',
            error: { code: 'DUPLICATE_RESPONSE' },
          },
          409,
        );
      }
      return jsonResponse({ success: false, message: 'not found' }, 404);
    });

    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('menampilkan error asli dan tidak menampilkan sukses palsu saat submit ditolak', async () => {
    const user = userEvent.setup();
    const { container } = render(<FormPage params={{ slug: SLUG }} />);

    await screen.findByDisplayValue('Budi Santoso');

    const kecamatanSelect = screen.getByLabelText(/Kecamatan/i);
    await screen.findByRole('option', { name: /PADAMARA/i });
    await user.selectOptions(kecamatanSelect, '330315');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'KARANGPULE' })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/Desa \/ Kelurahan/i), '3303152001');

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThanOrEqual(2);
    await user.upload(
      fileInputs[0],
      new File(['ktp'], 'ktp.jpg', { type: 'image/jpeg' }),
    );
    await user.upload(
      fileInputs[1],
      new File(['usaha'], 'usaha.jpg', { type: 'image/jpeg' }),
    );

    await user.click(screen.getByRole('button', { name: /Kirim Formulir/i }));

    expect(
      await screen.findByText(/respons sudah pernah dikirim untuk NIK ini/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Formulir Berhasil Dikirim/i)).not.toBeInTheDocument();
  });
});
