'use client';

import BackHeader from '@/components/BackHeader';

interface MyTasksViewProps {
  onBack: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  invited:   { label: 'ПРИГЛАШЁН',  color: '#ffc800', bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)' },
  accepted:  { label: 'ПРИНЯТО',    color: 'var(--neon-cyan)',  bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.3)' },
  published: { label: 'ОПУБЛИКОВАН', color: 'var(--neon-purple)', bg: 'rgba(180,0,255,0.08)', border: 'rgba(180,0,255,0.3)' },
  verified:  { label: 'ПРОВЕРЕН',   color: 'var(--neon-green)', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)' },
  paid:      { label: 'ОПЛАЧЕН',    color: 'var(--neon-green)', bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.4)' },
  rejected:  { label: 'ОТКЛОНЁН',   color: 'var(--neon-pink)',  bg: 'rgba(255,0,128,0.08)', border: 'rgba(255,0,128,0.3)' },
};

export default function MyTasksView({ onBack }: MyTasksViewProps) {
  // TODO: fetch from /api/my-assignments
  const assignments: any[] = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Мои задания" subtitle="Принятые кампании" onBack={onBack} />

      <div style={{ padding: '20px' }}>
        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Нет активных заданий</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 32px' }}>
              Откликнитесь на кампании в разделе «Задания», чтобы начать зарабатывать
            </p>
            <button onClick={onBack} className="cyber-btn" style={{ padding: '12px 24px', fontSize: 13, cursor: 'pointer' }}>
              ← Перейти к заданиям
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {assignments.map((a: any) => {
              const s = STATUS_MAP[a.status] || STATUS_MAP.invited;
              return (
                <div key={a.id} className="cyber-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{a.campaign?.title}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                        borderRadius: 4, padding: '3px 8px',
                      }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                      {a.campaign?.rewardPerStory?.toLocaleString()}₽
                    </div>
                  </div>
                  {a.status === 'accepted' && (
                    <button className="cyber-btn-primary" style={{ width: '100%', padding: '11px', fontSize: 12, cursor: 'pointer', border: 'none', marginTop: 4 }}>
                      ЗАГРУЗИТЬ ПРУФ →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
