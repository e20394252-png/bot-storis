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

const W_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'В обработке', color: '#ffc800' },
  paid:    { label: 'Выплачено',   color: '#00ff88' },
  rejected:{ label: 'Отклонено',  color: '#ff0080' },
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="cyber-card" style={{ padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: accent ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function ProfileView({ initData, tgUser, onBack }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Withdrawal form state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount] = useState('');
  const [wDetails, setWDetails] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');
  const [wSuccess, setWSuccess] = useState(false);

  const load = () => {
    if (!initData) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch('/api/me', { headers: { 'x-telegram-init-data': initData } }).then(r => r.json()),
      fetch('/api/withdrawals', { headers: { 'x-telegram-init-data': initData } }).then(r => r.json()),
    ]).then(([meData, wData]) => {
      setProfile(meData.profile);
      setUser(meData.user);
      setWithdrawals(wData.withdrawals || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [initData]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWError('');
    setWLoading(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ amount: parseInt(wAmount), details: wDetails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWSuccess(true);
      setWAmount('');
      setWDetails('');
      setShowWithdraw(false);
      load(); // refresh balance
    } catch (err: any) {
      setWError(err.message);
    } finally {
      setWLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending:  { label: 'На проверке', color: '#ffc800' },
    approved: { label: 'Активен',     color: 'var(--neon-green)' },
    rejected: { label: 'Отклонён',    color: 'var(--neon-pink)' },
  };

  const inp = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Профиль" subtitle="Ваши данные и баланс" onBack={onBack} />

      <div style={{ padding: '20px', paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Avatar block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              {tgUser?.photo_url ? (
                <img src={tgUser.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(0,229,255,0.4)', boxShadow: '0 0 16px rgba(0,229,255,0.25)' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(180,0,255,0.2))', border: '2px solid rgba(0,229,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--neon-cyan)' }}>
                  {tgUser?.first_name?.[0] || '?'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{tgUser?.first_name || 'Пользователь'}</div>
                {tgUser?.username && <div style={{ fontSize: 12, color: 'var(--neon-cyan)', opacity: 0.7 }}>@{tgUser.username}</div>}
                {profile && (
                  <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: statusMap[profile.status]?.color || 'var(--text-muted)' }}>
                    ● {statusMap[profile.status]?.label || profile.status}
                  </div>
                )}
              </div>
            </div>

            {!profile ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Анкета ещё не заполнена</p>
                <button className="cyber-btn-primary" onClick={() => router.push('/onboarding')} style={{ padding: '14px 32px', fontSize: 13, cursor: 'pointer', border: 'none' }}>
                  ЗАПОЛНИТЬ АНКЕТУ →
                </button>
              </div>
            ) : (
              <>
                {/* ── Balance card ── */}
                <div className="cyber-card" style={{
                  padding: '20px', marginBottom: 16,
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,229,255,0.06))',
                  borderColor: 'rgba(0,255,136,0.2)',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Ваш баланс</div>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)', marginBottom: 14 }}>
                    {(profile.balance || 0).toLocaleString()} ₽
                  </div>

                  {wSuccess && (
                    <div style={{ fontSize: 12, color: 'var(--neon-green)', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                      ✅ Заявка на вывод создана! Ожидайте обработки.
                    </div>
                  )}

                  {profile.balance >= 1000 && !showWithdraw && (
                    <button onClick={() => { setShowWithdraw(true); setWSuccess(false); }} className="cyber-btn-primary" style={{ width: '100%', padding: '12px', fontSize: 13, cursor: 'pointer', border: 'none' }}>
                      💸 ВЫВЕСТИ СРЕДСТВА
                    </button>
                  )}
                  {profile.balance < 1000 && profile.balance > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Минимальная сумма вывода — 1000 ₽ (у вас {profile.balance.toLocaleString()} ₽)
                    </div>
                  )}

                  {/* Withdrawal form */}
                  {showWithdraw && (
                    <form onSubmit={handleWithdraw} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--neon-cyan)', letterSpacing: '0.1em', marginBottom: 2 }}>// ЗАЯВКА_НА_ВЫВОД</div>
                      {wError && (
                        <div style={{ fontSize: 12, color: 'var(--neon-pink)', background: 'rgba(255,0,128,0.08)', border: '1px solid rgba(255,0,128,0.25)', borderRadius: 6, padding: '8px 12px' }}>{wError}</div>
                      )}
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>СУММА (мин. 1000 ₽, макс. {profile.balance.toLocaleString()} ₽)</label>
                        <input type="number" required min={1000} max={profile.balance} value={wAmount} onChange={e => setWAmount(e.target.value)} placeholder="1000" style={inp} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>РЕКВИЗИТЫ (номер карты, СБП, кошелёк)</label>
                        <textarea required rows={2} value={wDetails} onChange={e => setWDetails(e.target.value)} placeholder="Тинькофф / Сбер / USDT TRC20..." style={{ ...inp, resize: 'vertical' as const }} />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => setShowWithdraw(false)} style={{ flex: 1, padding: '11px', fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                          Отмена
                        </button>
                        <button type="submit" disabled={wLoading} className="cyber-btn-primary" style={{ flex: 2, padding: '11px', fontSize: 13, cursor: wLoading ? 'wait' : 'pointer', border: 'none', opacity: wLoading ? 0.7 : 1 }}>
                          {wLoading ? 'ОТПРАВКА...' : 'ПОДАТЬ ЗАЯВКУ →'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <Stat label="Просмотры сторис" value={(profile.avgStoryViews || 0).toLocaleString()} />
                  <Stat label="Заданий выполнено" value="0" />
                </div>

                {/* Profile details */}
                <div className="cyber-card" style={{ padding: '18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>// ДАННЫЕ_ПРОФИЛЯ</div>
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

                {/* Withdrawal history */}
                {withdrawals.length > 0 && (
                  <div className="cyber-card" style={{ padding: '18px', marginBottom: 14 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>// ИСТОРИЯ_ВЫПЛАТ</div>
                    {withdrawals.map((w: any) => {
                      const ws = W_STATUS[w.status] || W_STATUS.pending;
                      return (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--neon-green)' }}>{w.amount.toLocaleString()} ₽</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(w.createdAt).toLocaleDateString('ru-RU')}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: ws.color }}>{ws.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button className="cyber-btn" onClick={() => router.push('/onboarding')} style={{ width: '100%', padding: '13px', fontSize: 13, cursor: 'pointer' }}>
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
