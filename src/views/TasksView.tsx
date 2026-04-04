'use client';

import { useEffect, useState } from 'react';
import BackHeader from '@/components/BackHeader';

interface TasksViewProps {
  initData: string;
  onBack: () => void;
  onOpenCampaign: (id: string) => void;
}

const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Лайфстайл', crypto: 'Крипта', tech: 'Технологии',
  beauty: 'Бьюти', business: 'Бизнес', travel: 'Путешествия', other: 'Другое',
};
const NICHE_BADGE: Record<string, string> = {
  crypto: 'cyber-badge-purple', beauty: 'cyber-badge-pink', tech: 'cyber-badge',
};

export default function TasksView({ initData, onBack, onOpenCampaign }: TasksViewProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNiche, setFilterNiche] = useState('all');
  const [applying, setApplying] = useState<string | null>(null);
  // campaignId → assignment status ('accepted','published','verified','rejected')
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const headers = initData ? { 'x-telegram-init-data': initData } as HeadersInit : undefined;
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()),
      initData
        ? fetch('/api/my-assignments', { headers }).then(r => r.json())
        : Promise.resolve({ assignments: [] }),
    ]).then(([campData, myData]) => {
      setCampaigns(campData.campaigns || []);
      // Build map: campaignId → assignment status
      const map: Record<string, string> = {};
      for (const a of (myData.assignments || [])) {
        map[a.campaignId] = a.status;
      }
      setStatusMap(map);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [initData]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApply = async (campaignId: string) => {
    if (!initData) { showToast('Откройте приложение через Telegram', false); return; }
    setApplying(campaignId);
    try {
      const res = await fetch('/api/campaigns/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setStatusMap(prev => ({ ...prev, [campaignId]: 'accepted' }));
      showToast('Вы успешно откликнулись! ✓', true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setApplying(null);
    }
  };

  const filtered = filterNiche === 'all' ? campaigns : campaigns.filter(c => c.niche === filterNiche);
  const niches = ['all', ...Array.from(new Set(campaigns.map(c => c.niche).filter(Boolean)))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Задания" subtitle={`${campaigns.length} активных кампаний`} onBack={onBack} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, padding: '12px 20px', borderRadius: 10,
          background: toast.ok ? 'rgba(0,255,136,0.15)' : 'rgba(255,0,128,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(0,255,136,0.4)' : 'rgba(255,0,128,0.4)'}`,
          color: toast.ok ? '#00ff88' : '#ff0080',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding: '16px 20px', flex: 1 }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {niches.map(n => (
            <button key={n} onClick={() => setFilterNiche(n)} style={{
              flexShrink: 0,
              padding: '6px 14px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
              fontWeight: 600, letterSpacing: '0.04em',
              background: filterNiche === n ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: filterNiche === n ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: filterNiche === n ? 'var(--neon-cyan)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>
              {n === 'all' ? 'Все' : (NICHE_LABELS[n] || n)}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет доступных заданий</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
              {filterNiche === 'all' ? 'Рекламодатели ещё не добавили кампании' : 'Попробуйте другую тематику'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 20 }}>
          {filtered.map((c: any) => {
            const assignStatus = statusMap[c.id];
            const isApplied = assignStatus && assignStatus !== 'rejected';
            const isApplying = applying === c.id;
            return (
              <div
                key={c.id}
                className="cyber-card"
                onClick={() => onOpenCampaign(c.id)}
                style={{ padding: '18px', cursor: 'pointer' }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`cyber-badge ${NICHE_BADGE[c.niche] || 'cyber-badge'}`}>
                        {NICHE_LABELS[c.niche] || c.niche || 'Общее'}
                      </span>
                      {c.geo && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 {c.geo}</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{c.title}</div>
                    {c.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        {c.description.slice(0, 100)}{c.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)', lineHeight: 1 }}>
                      {(c.rewardPerStory || 0).toLocaleString()}₽
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>за сторис</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🎯 {c.creatorsNeeded} мест</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>💰 {(c.budget || 0).toLocaleString()}₽</span>
                  </div>
                  {isApplied ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                      color: 'var(--neon-green)', background: 'rgba(0,255,136,0.1)',
                      border: '1px solid rgba(0,255,136,0.3)', borderRadius: 6, padding: '6px 14px'
                    }}>✓ УЧАСТВУЮ</span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                      color: 'var(--neon-cyan)', background: 'rgba(0,229,255,0.08)',
                      border: '1px solid rgba(0,229,255,0.25)', borderRadius: 6, padding: '6px 14px'
                    }}>Подробнее →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
