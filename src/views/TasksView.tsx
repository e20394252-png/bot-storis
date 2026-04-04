'use client';

import { useEffect, useState } from 'react';
import BackHeader from '@/components/BackHeader';

interface TasksViewProps {
  onBack: () => void;
}

const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Лайфстайл', crypto: 'Крипта', tech: 'Технологии',
  beauty: 'Бьюти', business: 'Бизнес', travel: 'Путешествия', other: 'Другое',
};
const NICHE_BADGE: Record<string, string> = {
  crypto: 'cyber-badge-purple', beauty: 'cyber-badge-pink', tech: 'cyber-badge',
};

export default function TasksView({ onBack }: TasksViewProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNiche, setFilterNiche] = useState('all');

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterNiche === 'all' ? campaigns : campaigns.filter(c => c.niche === filterNiche);
  const niches = ['all', ...Array.from(new Set(campaigns.map(c => c.niche).filter(Boolean)))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Задания" subtitle="Доступные кампании" onBack={onBack} />

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
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Рекламодатели ещё не добавили кампании</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c: any) => (
            <div key={c.id} className="cyber-card" style={{ padding: '18px', cursor: 'pointer' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`cyber-badge ${NICHE_BADGE[c.niche] || 'cyber-badge'}`}>
                      {NICHE_LABELS[c.niche] || c.niche}
                    </span>
                    {c.geo && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 {c.geo}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{c.title}</div>
                  {c.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      {c.description.slice(0, 80)}{c.description.length > 80 ? '...' : ''}
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
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    🎯 {c.creatorsNeeded} мест
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    💰 бюджет {(c.budget || 0).toLocaleString()}₽
                  </span>
                </div>
                <button className="cyber-btn" style={{ fontSize: 11, padding: '6px 16px', cursor: 'pointer' }}>
                  Откликнуться
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
