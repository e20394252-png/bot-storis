'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HomeViewProps {
  initData: string;
  tgUser: any;
  onGoToTasks: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending:  { label: 'НА ПРОВЕРКЕ', color: '#ffc800', bg: 'rgba(255,200,0,0.1)',  border: 'rgba(255,200,0,0.3)' },
    approved: { label: 'АКТИВЕН',     color: 'var(--neon-green)', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)' },
    rejected: { label: 'ОТКЛОНЁН',    color: 'var(--neon-pink)', bg: 'rgba(255,0,128,0.08)', border: 'rgba(255,0,128,0.3)' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: '3px 8px',
    }}>{s.label}</span>
  );
}

export default function HomeView({ initData, tgUser, onGoToTasks }: HomeViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state each time initData changes (handles mobile late-init)
    setProfile(null);
    setCampaigns([]);

    if (!initData) {
      // Wait a bit — Telegram SDK might not have loaded yet
      const t = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(t);
    }

    setLoading(true);
    Promise.all([
      fetch('/api/me', { headers: { 'x-telegram-init-data': initData } }).then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([meData, campData]) => {
      setProfile(meData.profile ?? null);
      setCampaigns(campData.campaigns || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [initData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ИНИЦИАЛИЗАЦИЯ...</span>
      </div>
    );
  }

  const NICHE_BADGE: Record<string, string> = {
    crypto: 'cyber-badge-purple', beauty: 'cyber-badge-pink',
    tech: 'cyber-badge', lifestyle: 'cyber-badge', business: 'cyber-badge',
  };

  // === No profile → onboarding CTA ===
  if (!profile) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: 6, fontSize: 11, color: 'var(--neon-purple)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          // НОВЫЙ_АГЕНТ
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Добро пожаловать в <span style={{ color: 'var(--neon-cyan)' }}>Биржу Сторис</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
          Зарегистрируйся как креатор, пройди верификацию AI и получай оплачиваемые задания.
        </p>
        <div className="cyber-card" style={{ padding: '20px', marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(180,0,255,0.06))' }}>
          {[['01', 'Заполни анкету', 'username, тематика, ГЕО, цена'],
            ['02', 'AI-верификация', 'Загрузи скриншот статистики'],
            ['03', 'Принимай задания', 'Появляешься в списке для рекламодателей']
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--neon-cyan)', opacity: 0.6, flexShrink: 0, paddingTop: 2 }}>{num}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          className="cyber-btn-primary"
          onClick={() => router.push('/onboarding')}
          style={{ width: '100%', padding: '16px', fontSize: 13, cursor: 'pointer', border: 'none' }}
        >
          ПОДАТЬ АНКЕТУ →
        </button>
      </div>
    );
  }

  // === Pending ===
  if (profile.status === 'pending') {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,0,0.25), transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 24,
          boxShadow: '0 0 30px rgba(255,200,0,0.2)',
        }}>⏳</div>
        <StatusBadge status="pending" />
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '16px 0 10px' }}>Анкета на проверке</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, marginBottom: 32 }}>
          AI анализирует ваш скриншот статистики. Обычно это занимает от нескольких минут до 2 часов.
        </p>
        <div className="cyber-card" style={{ width: '100%', padding: '14px 18px', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{profile.socialUsername}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.niche} · {profile.geo} · {profile.avgStoryViews?.toLocaleString()} просм.</div>
          </div>
        </div>
      </div>
    );
  }

  // === Rejected ===
  if (profile.status === 'rejected') {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,128,0.25), transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 24,
        }}>❌</div>
        <StatusBadge status="rejected" />
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '16px 0 10px' }}>Верификация не пройдена</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, marginBottom: 32 }}>
          AI не смог подтвердить подлинность скриншота. Попробуйте загрузить другой скриншот с чёткой статистикой.
        </p>
        <button
          className="cyber-btn-primary"
          onClick={() => router.push('/onboarding')}
          style={{ width: '100%', maxWidth: 300, padding: '14px', fontSize: 13, cursor: 'pointer', border: 'none' }}
        >
          ПОВТОРИТЬ ВЕРИФИКАЦИЮ →
        </button>
      </div>
    );
  }

  // === Approved — main dashboard ===
  return (
    <div style={{ padding: '20px 20px 0' }}>
      {/* Balance card */}
      <div className="cyber-card" style={{
        padding: '20px',
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,229,255,0.06))',
        borderColor: 'rgba(0,255,136,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Баланс кошелька</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
            {(profile.balance || 0).toLocaleString()} ₽
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusBadge status="approved" />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{profile.socialUsername}</div>
        </div>
      </div>

      {/* Campaigns preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Доступные задания
        </div>
        <button onClick={onGoToTasks} style={{ fontSize: 10, color: 'var(--neon-cyan)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}>
          ВСЕ →
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="cyber-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Пока нет активных кампаний</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Загляните позже</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.slice(0, 3).map((c: any) => (
            <div key={c.id} className="cyber-card" style={{ padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className={`cyber-badge ${NICHE_BADGE[c.niche] || 'cyber-badge'}`}>{c.niche || 'Общее'}</span>
                    {c.geo && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.geo}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                    {c.rewardPerStory?.toLocaleString()}₽
                  </div>
                </div>
              </div>
            </div>
          ))}
          {campaigns.length > 3 && (
            <button onClick={onGoToTasks} className="cyber-btn" style={{ padding: '12px', fontSize: 13, cursor: 'pointer', width: '100%' }}>
              Ещё {campaigns.length - 3} заданий →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
