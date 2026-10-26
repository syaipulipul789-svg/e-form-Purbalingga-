import { render, screen } from '@testing-library/react';
import AdminMonitoringPage from '../page';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

describe('AdminMonitoringPage', () => {
  it('menampilkan kesehatan layanan dan metrik sistem', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      status: 'healthy',
      database: 'healthy',
      total_opd: 3,
      total_users: 4,
      active_users: 3,
      total_forms: 5,
      published_forms: 2,
      total_responses: 18,
      checked_at: '2026-10-26T10:00:00Z',
    });

    render(<AdminMonitoringPage />);

    expect(await screen.findByText('Beroperasi normal')).toBeInTheDocument();
    expect(screen.getByText('Terhubung')).toBeInTheDocument();
    expect(screen.getByText('Respons terkumpul')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/admin/superadmin/monitoring');
  });
});
