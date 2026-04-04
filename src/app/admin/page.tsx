import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET || '12345';

  if (params.key !== adminSecret) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050510', color: '#e0e8ff',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, textAlign: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Доступ запрещён</h1>
        <p style={{ color: '#6870a0', fontSize: 14 }}>
          Введите ключ в URL: <code style={{ color: '#00e5ff' }}>/admin?key=ВАШ_КЛЮЧ</code>
        </p>
      </div>
    );
  }

  const prisma = getPrisma();
  const profiles = await prisma.creatorProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const statusStyle: Record<string, { color: string; bg: string; border: string; label: string }> = {
    pending:  { color: '#ffc800', bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)',   label: 'На проверке' },
    approved: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.3)',   label: 'Одобрен' },
    rejected: { color: '#ff0080', bg: 'rgba(255,0,128,0.1)',   border: 'rgba(255,0,128,0.3)',   label: 'Отклонён' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: '#e0e8ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid rgba(0,229,255,0.12)',
        background: 'rgba(5,5,20,0.95)',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#00e5ff', letterSpacing: '0.1em', opacity: 0.7 }}>// ADMIN_PANEL</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
            Биржа Сторис <span style={{ color: '#00e5ff' }}>Admin</span>
          </h1>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: '#00ff88' }}>
          {profiles.length} анкет
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(0,229,255,0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(0,229,255,0.03)' }}>
                {['Канал', 'Telegram', 'ГЕО', 'Ниша', 'Просмотры', 'Цена ₽', 'Статус', 'Дата'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6870a0', letterSpacing: '0.04em', fontSize: 11, textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#6870a0' }}>
                    Нет зарегистрированных пользователей
                  </td>
                </tr>
              ) : profiles.map((p: any) => {
                const s = statusStyle[p.status] || statusStyle.pending;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#00e5ff' }}>
                      {p.socialUsername || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#a0a8c0' }}>
                      @{p.user?.username || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#a0a8c0' }}>{p.geo || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#a0a8c0' }}>{p.niche || '—'}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>
                      {p.avgStoryViews?.toLocaleString() || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#00ff88' }}>
                      {p.pricePerStory?.toLocaleString() || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                        borderRadius: 4, padding: '3px 10px'
                      }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: '#6870a0' }}>
                      {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
