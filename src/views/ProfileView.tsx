'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackHeader from '@/components/BackHeader';

interface ProfileViewProps {
  initData: string;
  tgUser: any;
  onBack: () => void;
}

const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Лайфстайл', crypto: 'Крипта', tech: 'Технологии',
  beauty: 'Бьюти', business: 'Бизнес', travel: 'Путешествия', other: 'Другое',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cyber-card" style={{ padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function ProfileView({ initData, tgUser, onBack }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initData) { setLoading(false); return; }
    fetch('/api/me', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.json())
      .then(d => { setProfile(d.profile); setUser(d.user); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initData]);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending:  { label: 'На проверке', color: '#ffc800' },
    approved: { label: 'Активен',     color: 'var(--neon-green)' },
    rejected: { label: 'Отклонён',    color: 'var(--neon-pink)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Профиль" subtitle="Ваши данные" onBack={onBack} />

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Avatar block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              {tgUser?.photo_url ? (
                <img src={tgUser.photo_url} alt="" style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2px solid rgba(0,229,255,0.4)',
                  boxShadow: '0 0 16px rgba(0,229,255,0.25)'
                }} />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(180,0,255,0.2))',
                  border: '2px solid rgba(0,229,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, color: 'var(--neon-cyan)'
                }}>
                  {tgUser?.first_name?.[0] || '?'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{tgUser?.first_name || 'Пользователь'}</div>
                {tgUser?.username && <div style={{ fontSize: 12, color: 'var(--neon-cyan)', opacity: 0.7 }}>@{tgUser.username}</div>}
                {profile && (
                  <div style={{
                    marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: statusMap[profile.status]?.color || 'var(--text-muted)',
                  }}>
                    ● {statusMap[profile.status]?.label || profile.status}
                  </div>
                )}
              </div>
            </div>

            {!profile ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Анкета ещё не заполнена</p>
                <button
                  className="cyber-btn-primary"
                  onClick={() => router.push('/onboarding')}
                  style={{ padding: '14px 32px', fontSize: 13, cursor: 'pointer', border: 'none' }}
                >
                  ЗАПОЛНИТЬ АНКЕТУ →
                </button>
              </div>
            ) : (
              <>
                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <Stat label="Баланс" value={`${(profile.balance || 0).toLocaleString()} ₽`} />
                  <Stat label="Просмотры" value={(profile.avgStoryViews || 0).toLocaleString()} />
                  <Stat label="Цена за сторис" value={`${(profile.pricePerStory || 0).toLocaleString()} ₽`} />
                  <Stat label="Выполнено" value="0" />
                </div>

                {/* Profile details */}
                <div className="cyber-card" style={{ padding: '18px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
                    // ДАННЫЕ_ПРОФИЛЯ
                  </div>
                  {[
                    ['Канал', profile.socialUsername],
                    ['Тематика', NICHE_LABELS[profile.niche] || profile.niche],
                    ['ГЕО / Город', profile.geo],
                  ].map(([label, value]) => value ? (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                    </div>
                  ) : null)}
                </div>

                <button
                  className="cyber-btn"
                  onClick={() => router.push('/onboarding')}
                  style={{ width: '100%', padding: '13px', fontSize: 13, cursor: 'pointer' }}
                >
                  Обновить анкету
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
