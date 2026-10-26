import { render, screen } from '@testing-library/react';
import AdminAuditPage from '../page';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

describe('AdminAuditPage', () => {
  it('menampilkan aktor, aksi, dan objek dari audit log', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      items: [{
        id: 'audit-1',
        actor_id: 'user-admin',
        actor_name: 'Super Admin',
        actor_email: 'admin@example.go.id',
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: 'new-user',
        entity_name: 'Operator Baru',
        details: { email: 'operator@example.go.id', role: 'OPERATOR' },
        ip_address: '127.0.0.1',
        created_at: '2026-10-26T10:00:00Z',
      }],
      page: 1,
      limit: 20,
      total: 1,
    });

    render(<AdminAuditPage />);

    expect(await screen.findByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Menambahkan pengguna')).toBeInTheDocument();
    expect(screen.getByText('Operator Baru')).toBeInTheDocument();
    expect(screen.getByText('operator@example.go.id')).toBeInTheDocument();
  });
});
