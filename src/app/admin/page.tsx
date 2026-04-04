import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { notifyProofApproved, notifyProofRejected } from '@/lib/notify';
import PendingButton from '@/components/PendingButton';

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
  const [profiles, campaigns, pendingProofs, pendingWithdrawals] = await Promise.all([
    prisma.creatorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.assignment.findMany({
      where: { status: 'published' },
      include: { campaign: true, creator: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.withdrawal.findMany({
      where: { status: 'pending' },
      include: { user: { include: { creatorProfile: true } } },
      orderBy: { createdAt: 'desc' },
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
        requirements: formData.get('requirements') as string || null,
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

  async function broadcastCampaign(formData: FormData) {
    'use server';
    const prismaInner = getPrisma();
    const campaignId = formData.get('campaignId') as string;
    const _key = formData.get('_key') as string;

    const campaign = await prismaInner.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) redirect(`/admin?key=${_key}&tab=campaigns`);

    // Get all approved creators with telegram accounts
    const creators = await prismaInner.creatorProfile.findMany({
      where: { status: 'approved' },
      include: { user: true },
    });

    // Fire-and-forget: send to each creator
    // We import notifyNewCampaign dynamically to keep this server-action friendly
    const { notifyNewCampaign } = await import('@/lib/notify');

    let sent = 0;
    for (const creator of creators) {
      if (creator.user?.telegram_id) {
        await notifyNewCampaign(
          creator.user.telegram_id,
          campaign!.title,
          campaign!.rewardPerStory,
        ).catch(() => {}); // ignore individual failures
        sent++;
      }
    }

    console.log(`[broadcast] Sent campaign "${campaign!.title}" to ${sent} creators`);

    // Save the broadcast timestamp
    await prismaInner.campaign.update({
      where: { id: campaignId },
      data: { broadcastedAt: new Date() },
    });

    redirect(`/admin?key=${_key}&tab=campaigns`);
  }

  async function verifyProof(formData: FormData) {
    'use server';
    const prismaInner = getPrisma();
    const assignmentId = formData.get('assignmentId') as string;
    const action = formData.get('action') as string;
    const _key = formData.get('_key') as string;

    const assignment = await prismaInner.assignment.findUnique({
      where: { id: assignmentId },
      include: { campaign: true, creator: { include: { user: true } } },
    });
    if (!assignment) redirect(`/admin?key=${_key}&tab=proofs`);

    const telegramId = assignment!.creator?.user?.telegram_id;
    const username = assignment!.creator?.user?.username;
    const campaignTitle = assignment!.campaign?.title || 'Кампания';
    const reward = assignment!.campaign?.rewardPerStory || 0;

    if (action === 'verify') {
      await prismaInner.$transaction([
        prismaInner.assignment.update({ where: { id: assignmentId }, data: { status: 'verified' } }),
        prismaInner.creatorProfile.update({
          where: { id: assignment!.creatorId },
          data: { balance: { increment: reward } },
        }),
        prismaInner.campaign.update({
          where: { id: assignment!.campaignId },
          data: { creatorsNeeded: { decrement: 1 } },
        }),
      ]);
      // Notify creator about payment
      if (telegramId) {
        notifyProofApproved(telegramId, campaignTitle, reward, username).catch(console.error);
      }
    } else {
      await prismaInner.assignment.update({ where: { id: assignmentId }, data: { status: 'rejected' } });
      // Notify creator about rejection
      if (telegramId) {
        notifyProofRejected(telegramId, campaignTitle, username).catch(console.error);
      }
    }
    revalidatePath('/admin');
    redirect(`/admin?key=${_key}&tab=proofs`);
  }

  async function processWithdrawal(formData: FormData) {
    'use server';
    const prismaInner = getPrisma();
    const withdrawalId = formData.get('withdrawalId') as string;
    const action = formData.get('action') as string; // 'paid' | 'reject'
    const _key = formData.get('_key') as string;

    if (action === 'paid') {
      await prismaInner.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'paid' } });
    } else {
      // Refund balance on rejection
      const w = await prismaInner.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: { user: { include: { creatorProfile: true } } },
      });
      if (w?.user?.creatorProfile) {
        await prismaInner.$transaction([
          prismaInner.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'rejected' } }),
          prismaInner.creatorProfile.update({
            where: { id: w.user.creatorProfile.id },
            data: { balance: { increment: w.amount } },
          }),
        ]);
      }
    }
    revalidatePath('/admin');
    redirect(`/admin?key=${_key}&tab=withdrawals`);
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
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(0,229,255,0.08)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tabBtn('stats', '📊 Дашборд', 0)}
        {tabBtn('creators', 'Креаторы', profiles.length)}
        {tabBtn('campaigns', 'Кампании', campaigns.length)}
        {tabBtn('proofs', '🔍 Проверка', pendingProofs.length)}
        {tabBtn('withdrawals', '💸 Выводы', pendingWithdrawals.length)}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── STATS TAB ─────────────────────────────────── */}
        {activeTab === 'stats' && (() => {
          const approved = profiles.filter((p: any) => p.status === 'approved').length;
          const pending  = profiles.filter((p: any) => p.status === 'pending').length;
          const activeCamps = campaigns.filter((c: any) => c.status === 'active').length;
          const totalPaid = pendingWithdrawals.reduce((s: number, w: any) => s + w.amount, 0);
          const stats = [
            { label: 'Всего креаторов',       value: profiles.length.toString(),  color: '#00e5ff' },
            { label: 'Одобрено',              value: approved.toString(),          color: '#00ff88' },
            { label: 'На верификации',        value: pending.toString(),           color: '#ffc800' },
            { label: 'Активных кампаний',     value: activeCamps.toString(),       color: '#00e5ff' },
            { label: 'Сторис на проверке',    value: pendingProofs.length.toString(), color: '#b400ff' },
            { label: 'Заявок на вывод (₽)',   value: totalPaid.toLocaleString(),    color: '#ff0080' },
          ];
          return (
            <div>
              <div style={{ fontSize: 10, color: '#b400ff', letterSpacing: '0.1em', marginBottom: 20 }}>// DASHBOARD_STATS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {stats.map(s => (
                  <div key={s.label} style={{ background: '#0d0d24', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 12, padding: '20px' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#6870a0', marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#b400ff', letterSpacing: '0.1em', marginBottom: 14 }}>// ПОСЛЕДНИЕ_ПРУФЫ</div>
              <div style={{ background: '#0d0d24', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 12, overflow: 'hidden' }}>
                {pendingProofs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#6870a0' }}>Нет пруфов на проверке</div>
                ) : pendingProofs.slice(0, 5).map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>@{a.creator?.user?.username || '—'}</div>
                      <div style={{ fontSize: 11, color: '#6870a0' }}>{a.campaign?.title}</div>
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#00ff88' }}>{a.campaign?.rewardPerStory?.toLocaleString()}₽</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
                  <textarea name="description" rows={2} placeholder="Краткое описание кампании..." style={{ ...c.inp, resize: 'vertical' as const }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, color: '#00e5ff', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ТЗ НА СТОРИС (задание для креатора) *</label>
                  <textarea name="requirements" rows={4} required placeholder="Опишите подробно что нужно сделать: что снять, что упомянуть, хэштеги, ссылки и т.д." style={{ ...c.inp, resize: 'vertical' as const }} />
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
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {/* Broadcast button */}
                              <form action={broadcastCampaign} style={{ display: 'inline' }}>
                                <input type="hidden" name="campaignId" value={camp.id} />
                                <input type="hidden" name="_key" value={key} />
                                <PendingButton
                                  label="📢 Разослать"
                                  pendingLabel="Рассылка..."
                                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}
                                />
                              </form>
                              {/* Delete button */}
                              <form action={deleteCampaign} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={camp.id} />
                                <input type="hidden" name="_key" value={key} />
                                <PendingButton
                                  label="Удалить"
                                  pendingLabel="..."
                                  style={{ background: 'rgba(255,0,128,0.1)', border: '1px solid rgba(255,0,128,0.3)', color: '#ff0080', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}
                                />
                              </form>
                            </div>
                            {/* Broadcast timestamp badge */}
                            {camp.broadcastedAt && (
                              <div style={{ marginTop: 6, fontSize: 10, color: '#00e5ff', opacity: 0.6 }}>
                                📨 {new Date(camp.broadcastedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
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
        {/* ── PROOFS TAB ─────────────────────────────────── */}
        {activeTab === 'proofs' && (
          <div>
            {pendingProofs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6870a0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div>Нет пруфов на проверке</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {pendingProofs.map((a: any) => (
                  <div key={a.id} style={{ background: '#0d0d24', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,229,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{a.campaign?.title}</div>
                        <div style={{ fontSize: 12, color: '#6870a0', marginTop: 2 }}>
                          {a.creator?.socialUsername || a.creator?.user?.username || '—'} · {a.campaign?.rewardPerStory?.toLocaleString()}₽
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#b400ff', background: 'rgba(180,0,255,0.1)', border: '1px solid rgba(180,0,255,0.3)', borderRadius: 4, padding: '4px 10px', fontWeight: 700 }}>НА ПРОВЕРКЕ</div>
                    </div>
                    {a.proofUrl && (
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
                        <div style={{ fontSize: 10, color: '#6870a0', letterSpacing: '0.08em', marginBottom: 10 }}>// СКРИНШОТ_ПРУФА</div>
                        <img src={a.proofUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid rgba(0,229,255,0.15)', objectFit: 'contain', display: 'block' }} />
                      </div>
                    )}
                    <div style={{ padding: '14px 20px', display: 'flex', gap: 12 }}>
                      <form action={verifyProof} style={{ flex: 1 }}>
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <input type="hidden" name="action" value="verify" />
                        <input type="hidden" name="_key" value={key} />
                        <PendingButton
                          label={`✓ ОДОБРИТЬ +${a.campaign?.rewardPerStory?.toLocaleString()}₽`}
                          pendingLabel="Одобряем..."
                          style={{ width: '100%', padding: '11px', fontSize: 13, background: 'linear-gradient(135deg, #00e5ff, #00ff88)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700 }}
                        />
                      </form>
                      <form action={verifyProof} style={{ flex: 1 }}>
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="_key" value={key} />
                        <PendingButton
                          label="✗ ОТКЛОНИТЬ"
                          pendingLabel="Отклоняем..."
                          style={{ width: '100%', padding: '11px', fontSize: 13, background: 'rgba(255,0,128,0.1)', border: '1px solid rgba(255,0,128,0.3)', borderRadius: 8, color: '#ff0080', fontWeight: 700 }}
                        />
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── WITHDRAWALS TAB ─────────────────────────────── */}
        {activeTab === 'withdrawals' && (
          <div>
            {pendingWithdrawals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6870a0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div>Нет заявок на вывод</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pendingWithdrawals.map((w: any) => (
                  <div key={w.id} style={{ background: '#0d0d24', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,229,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: '#00ff88' }}>{w.amount.toLocaleString()} ₽</div>
                        <div style={{ fontSize: 12, color: '#6870a0', marginTop: 2 }}>
                          @{w.user?.username || '—'} · {new Date(w.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#ffc800', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 4, padding: '4px 10px', fontWeight: 700 }}>ОЖИДАЕТ</div>
                    </div>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
                      <div style={{ fontSize: 10, color: '#6870a0', letterSpacing: '0.08em', marginBottom: 6 }}>// РЕКВИЗИТЫ</div>
                      <div style={{ fontSize: 13, color: '#e0e8ff', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{w.details}</div>
                    </div>
                    <div style={{ padding: '14px 20px', display: 'flex', gap: 12 }}>
                      <form action={processWithdrawal} style={{ flex: 1 }}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <input type="hidden" name="action" value="paid" />
                        <input type="hidden" name="_key" value={key} />
                        <button type="submit" style={{ width: '100%', padding: '11px', fontSize: 13, background: 'linear-gradient(135deg, #00e5ff, #00ff88)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                          ✓ ВЫПЛАЧЕНО
                        </button>
                      </form>
                      <form action={processWithdrawal} style={{ flex: 1 }}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="_key" value={key} />
                        <button type="submit" style={{ width: '100%', padding: '11px', fontSize: 13, background: 'rgba(255,0,128,0.1)', border: '1px solid rgba(255,0,128,0.3)', borderRadius: 8, color: '#ff0080', fontWeight: 700, cursor: 'pointer' }}>
                          ✗ ОТКЛОНИТЬ
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
