'use client';

import { useEffect, useState } from 'react';
import BackHeader from '@/components/BackHeader';

interface MyTasksViewProps {
  initData: string;
  onBack: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  invited:   { label: 'ПРИГЛАШЁН',    color: '#ffc800', bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)',   icon: '📨' },
  accepted:  { label: 'ПРИНЯТО',      color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.3)',   icon: '✅' },
  published: { label: 'ОПУБЛИКОВАН',  color: '#b400ff', bg: 'rgba(180,0,255,0.08)', border: 'rgba(180,0,255,0.3)',   icon: '📸' },
  verified:  { label: 'ПРОВЕРЕН',     color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)',   icon: '🔍' },
  paid:      { label: 'ОПЛАЧЕН',      color: '#00ff88', bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.4)',   icon: '💸' },
  rejected:  { label: 'ОТКЛОНЁН',     color: '#ff0080', bg: 'rgba(255,0,128,0.08)', border: 'rgba(255,0,128,0.3)',   icon: '❌' },
};

const STEPS = ['accepted', 'published', 'verified', 'paid'];

function ProgressBar({ status }: { status: string }) {
  const idx = STEPS.indexOf(status);
  if (idx < 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s', boxShadow: i <= idx ? '0 0 6px var(--neon-cyan)' : 'none' }} />
      ))}
    </div>
  );
}

export default function MyTasksView({ initData, onBack }: MyTasksViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initData) { setLoading(false); return; }
    fetch('/api/my-assignments', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.json())
      .then(d => setAssignments(d.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader
        title="Мои задания"
        subtitle={assignments.length > 0 ? `${assignments.length} активных` : 'Нет заданий'}
        onBack={onBack}
      />

      <div style={{ padding: '20px', flex: 1 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Нет активных заданий</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 32px' }}>
              Откликнитесь на кампании во вкладке «Задания», чтобы начать зарабатывать
            </p>
            <button onClick={onBack} className="cyber-btn" style={{ padding: '12px 24px', fontSize: 13, cursor: 'pointer' }}>
              ← К заданиям
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {assignments.map((a: any) => {
            const s = STATUS_MAP[a.status] || STATUS_MAP.accepted;
            const c = a.campaign;
            return (
              <div key={a.id} className="cyber-card" style={{ padding: '18px' }}>
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                        borderRadius: 4, padding: '3px 8px',
                      }}>{s.label}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                      {c?.title || 'Кампания'}
                    </div>
                    {c?.geo && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>📍 {c.geo}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                      {(c?.rewardPerStory || 0).toLocaleString()}₽
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar status={a.status} />

                {/* Action button for accepted */}
                {a.status === 'accepted' && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                      Опубликуйте сторис и загрузите скриншот для получения оплаты
                    </p>
                    <button className="cyber-btn-primary" style={{
                      width: '100%', padding: '12px', fontSize: 12,
                      cursor: 'not-allowed', border: 'none', opacity: 0.6,
                    }}>
                      📸 ЗАГРУЗИТЬ ПРУФ (скоро)
                    </button>
                  </div>
                )}

                {/* Date */}
                <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                  Принято: {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
