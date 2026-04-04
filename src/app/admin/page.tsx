import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getOrCreateAdminUser(prisma: any) {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        telegram_id: BigInt(0),
        username: 'admin',
        first_name: 'Admin',
        role: 'ADMIN',
      }
    });
  }
  return admin;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; tab?: string }>;
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
  const [profiles, campaigns] = await Promise.all([
    prisma.creatorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    }),
  ]);

  const activeTab = params.tab || 'creators';
  const key = params.key;

  // Server Actions
  async function createCampaign(formData: FormData) {
    'use server';
    const prismaInner = getPrisma();
    const admin = await getOrCreateAdminUser(prismaInner);

    await prismaInner.campaign.create({
      data: {
        advertiserId: admin.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        niche: formData.get('niche') as string || null,
        geo: formData.get('geo') as string || null,
        budget: parseInt(formData.get('budget') as string) || 0,
        creatorsNeeded: parseInt(formData.get('creatorsNeeded') as string) || 1,
        rewardPerStory: parseInt(formData.get('rewardPerStory') as string) || 0,
        status: 'active',
      }
    });
    revalidatePath('/admin');
    redirect(`/admin?key=${formData.get('_key')}&tab=campaigns`);
  }

  async function deleteCampaign(formData: FormData) {
    'use server';
    const prismaInner = getPrisma();
    const id = formData.get('id') as string;
    await prismaInner.campaign.delete({ where: { id } });
    revalidatePath('/admin');
    redirect(`/admin?key=${formData.get('_key')}&tab=campaigns`);
  }

  // ─── Styles ───────────────────────────────────────────────
  const statusStyle: Record<string, { color: string; bg: string; border: string; label: string }> = {
    pending:  { color: '#ffc800', bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)',   label: 'На проверке' },
    approved: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.3)',   label: 'Одобрен' },
    rejected: { color: '#ff0080', bg: 'rgba(255,0,128,0.1)',   border: 'rgba(255,0,128,0.3)',   label: 'Отклонён' },
  };
  const campStatusStyle: Record<string, { color: string; label: string }> = {
    draft:     { color: '#6870a0', label: 'Черновик' },
    active:    { color: '#00ff88', label: 'Активна' },
    completed: { color: '#00e5ff', label: 'Завершена' },
  };

  const c = { // common inline styles
    th:  { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 600, color: '#6870a0', letterSpacing: '0.04em', fontSize: 11, textTransform: 'uppercase' as const },
    td:  { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    inp: { width: '100%', padding: '10px 14px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8, color: '#e0e8ff', fontSize: 14, outline: 'none' } as React.CSSProperties,
  };

  const tabBtn = (id: string, label: string, count: number) => (
    <a href={`/admin?key=${key}&tab=${id}`} style={{
      padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
      background: activeTab === id ? 'rgba(0,229,255,0.12)' : 'transparent',
      border: activeTab === id ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
      color: activeTab === id ? '#00e5ff' : '#6870a0',
      textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center',
    }}>
      {label}
      <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '1px 8px', fontSize: 11 }}>{count}</span>
    </a>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: '#e0e8ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '18px 28px', borderBottom: '1px solid rgba(0,229,255,0.12)', background: 'rgba(5,5,20,0.95)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.1em', opacity: 0.6 }}>// ADMIN_PANEL</div>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Биржа Сторис <span style={{ color: '#00e5ff' }}>Admin</span></h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(0,229,255,0.08)', display: 'flex', gap: 10 }}>
        {tabBtn('creators', 'Креаторы', profiles.length)}
        {tabBtn('campaigns', 'Кампании', campaigns.length)}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── CREATORS TAB ─────────────────────────────────── */}
        {activeTab === 'creators' && (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(0,229,255,0.12)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                  {['Канал', 'Telegram', 'ГЕО', 'Ниша', 'Просмотры', 'Цена ₽', 'Статус', 'Дата'].map(h => (
                    <th key={h} style={c.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#6870a0' }}>Нет регистраций</td></tr>
                ) : profiles.map((p: any) => {
                  const s = statusStyle[p.status] || statusStyle.pending;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...c.td, color: '#00e5ff', fontWeight: 600 }}>{p.socialUsername || '—'}</td>
                      <td style={{ ...c.td, color: '#a0a8c0' }}>@{p.user?.username || '—'}</td>
                      <td style={{ ...c.td, color: '#a0a8c0' }}>{p.geo || '—'}</td>
                      <td style={{ ...c.td, color: '#a0a8c0' }}>{p.niche || '—'}</td>
                      <td style={{ ...c.td, fontFamily: 'monospace' }}>{p.avgStoryViews?.toLocaleString() || 0}</td>
                      <td style={{ ...c.td, fontFamily: 'monospace', color: '#00ff88' }}>{p.pricePerStory?.toLocaleString() || 0}</td>
                      <td style={c.td}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 10px' }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ ...c.td, fontSize: 11, color: '#6870a0' }}>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ─────────────────────────────────── */}
        {activeTab === 'campaigns' && (
          <div>
            {/* Create form */}
            <div style={{ background: '#0d0d24', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, padding: '24px', marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: '#b400ff', letterSpacing: '0.1em', marginBottom: 14 }}>// НОВАЯ_КАМПАНИЯ</div>
              <form action={createCampaign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <input type="hidden" name="_key" value={key} />

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, color: '#6870a0', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>НАЗВАНИЕ *</label>
                  <input name="title" required placeholder="Например: Реклама крипто-проекта X" style={c.inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, color: '#6870a0', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ОПИСАНИЕ</label>
                  <textarea name="description" rows={2} placeholder="Требования к публикации, особые условия..." style={{ ...c.inp, resize: 'vertical' as const }} />
                </div>
                {[
                  { name: 'niche', label: 'НИША', placeholder: 'crypto / lifestyle / beauty...' },
                  { name: 'geo',   label: 'ГЕО',  placeholder: 'Москва / РФ / Any' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize: 11, color: '#6870a0', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input name={f.name} placeholder={f.placeholder} style={c.inp} />
                  </div>
                ))}
                {[
                  { name: 'rewardPerStory', label: 'НАГРАДА ЗА СТОРИС (₽) *', placeholder: '3500' },
                  { name: 'budget',         label: 'ОБЩИЙ БЮДЖЕТ (₽) *',      placeholder: '50000' },
                  { name: 'creatorsNeeded', label: 'МЕСТ',                     placeholder: '5' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize: 11, color: '#6870a0', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input name={f.name} type="number" required placeholder={f.placeholder} style={c.inp} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" style={{
                    padding: '13px 28px', background: 'linear-gradient(135deg, #00e5ff, #b400ff)',
                    border: 'none', borderRadius: 8, color: '#000', fontWeight: 700,
                    fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer',
                  }}>
                    + СОЗДАТЬ КАМПАНИЮ
                  </button>
                </div>
              </form>
            </div>

            {/* Campaigns list */}
            {campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6870a0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>Кампаний пока нет. Создайте первую выше.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(0,229,255,0.12)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                      {['Название', 'Ниша', 'ГЕО', 'Награда', 'Бюджет', 'Мест', 'Статус', ''].map(h => (
                        <th key={h} style={c.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp: any) => {
                      const cs = campStatusStyle[camp.status] || { color: '#6870a0', label: camp.status };
                      return (
                        <tr key={camp.id}>
                          <td style={{ ...c.td, fontWeight: 600 }}>{camp.title}</td>
                          <td style={{ ...c.td, color: '#a0a8c0' }}>{camp.niche || '—'}</td>
                          <td style={{ ...c.td, color: '#a0a8c0' }}>{camp.geo || '—'}</td>
                          <td style={{ ...c.td, fontFamily: 'monospace', color: '#00ff88' }}>{camp.rewardPerStory?.toLocaleString()}₽</td>
                          <td style={{ ...c.td, fontFamily: 'monospace' }}>{camp.budget?.toLocaleString()}₽</td>
                          <td style={{ ...c.td }}>{camp.creatorsNeeded}</td>
                          <td style={c.td}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: cs.color }}>{cs.label}</span>
                          </td>
                          <td style={c.td}>
                            <form action={deleteCampaign}>
                              <input type="hidden" name="id" value={camp.id} />
                              <input type="hidden" name="_key" value={key} />
                              <button type="submit" style={{
                                background: 'rgba(255,0,128,0.1)', border: '1px solid rgba(255,0,128,0.3)',
                                color: '#ff0080', borderRadius: 6, padding: '4px 10px', fontSize: 11,
                                cursor: 'pointer', fontWeight: 600,
                              }}>
                                Удалить
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
