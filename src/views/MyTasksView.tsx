'use client';

import { useEffect, useRef, useState } from 'react';
import BackHeader from '@/components/BackHeader';

interface MyTasksViewProps {
  initData: string;
  onBack: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  invited:   { label: 'ПРИГЛАШЁН',   color: '#ffc800', bg: 'rgba(255,200,0,0.1)',   border: 'rgba(255,200,0,0.3)',   icon: '📨' },
  accepted:  { label: 'ПРИНЯТО',     color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.3)',   icon: '✅' },
  published: { label: 'НА ПРОВЕРКЕ', color: '#b400ff', bg: 'rgba(180,0,255,0.08)', border: 'rgba(180,0,255,0.3)',   icon: '🔍' },
  verified:  { label: 'ПРОВЕРЕН',    color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)',   icon: '💚' },
  paid:      { label: 'ОПЛАЧЕН',     color: '#00ff88', bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.4)',   icon: '💸' },
  rejected:  { label: 'ОТКЛОНЁН',    color: '#ff0080', bg: 'rgba(255,0,128,0.08)', border: 'rgba(255,0,128,0.3)',   icon: '❌' },
};

// verified = money already on balance. 'paid' step removed — no separate payout step.
const STEPS = ['accepted', 'published', 'verified'];
const STEP_LABELS = ['Принято', 'На проверке', 'Начислено ✓'];

function ProgressBar({ status }: { status: string }) {
  const idx = STEPS.indexOf(status);
  if (idx < 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= idx ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)',
            boxShadow: i <= idx ? '0 0 6px var(--neon-cyan)' : 'none',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 5 }}>
        {STEP_LABELS.map((l, i) => (
          <div key={l} style={{ flex: 1, fontSize: 9, color: i <= idx ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)', letterSpacing: '0.03em', textAlign: i === 0 ? 'left' : i === STEPS.length - 1 ? 'right' : 'center' }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProofUploader({ assignmentId, initData, onUploaded }: { assignmentId: string; initData: string; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [base64, setBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Максимум 8 MB'); return; }
    setError('');
    setPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setBase64(reader.result as string);
  };

  const handleSubmit = async () => {
    if (!base64) return;
    setUploading(true);
    setError('');
    try {
      const res = await fetch('/api/assignments/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ assignmentId, base64Image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      onUploaded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        Опубликуйте сторис и загрузите скриншот статистики публикации:
      </p>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--neon-pink)', marginBottom: 8, padding: '8px 12px', background: 'rgba(255,0,128,0.08)', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          borderRadius: 10, border: '1px dashed rgba(0,229,255,0.25)',
          background: 'rgba(0,229,255,0.03)', cursor: 'pointer',
          position: 'relative', overflow: 'hidden',
          aspectRatio: preview ? '16/9' : '3/1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12, transition: 'all 0.2s',
        }}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', borderRadius: '50%', padding: 10, color: 'var(--neon-cyan)', fontSize: 18 }}>📷</div>
            </div>
            <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: 'var(--neon-green)', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 4, padding: '2px 8px' }}>
              ✓ ЗАГРУЖЕНО
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нажмите для выбора скриншота</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>PNG, JPG, до 8 MB</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {base64 && (
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="cyber-btn-primary"
          style={{ width: '100%', padding: '13px', fontSize: 13, cursor: uploading ? 'wait' : 'pointer', border: 'none', opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ НА ПРОВЕРКУ →'}
        </button>
      )}
    </div>
  );
}

export default function MyTasksView({ initData, onBack }: MyTasksViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!initData) { setLoading(false); return; }
    fetch('/api/my-assignments', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.json())
      .then(d => setAssignments(d.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [initData]);

  const handleProofUploaded = () => {
    setLoading(true);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader
        title="Мои задания"
        subtitle={assignments.length > 0 ? `${assignments.length} заданий` : 'Нет заданий'}
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
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{s.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 8px' }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{c?.title || 'Кампания'}</div>
                    {c?.geo && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>📍 {c.geo}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                      {(c?.rewardPerStory || 0).toLocaleString()}₽
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>за сторис</div>
                  </div>
                </div>

                {/* Progress */}
                <ProgressBar status={a.status} />

                {/* Proof uploader for accepted status */}
                {a.status === 'accepted' && (
                  <ProofUploader
                    assignmentId={a.id}
                    initData={initData}
                    onUploaded={handleProofUploaded}
                  />
                )}

                {/* Published — waiting message */}
                {a.status === 'published' && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(180,0,255,0.06)', border: '1px solid rgba(180,0,255,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      ⏳ Пруф отправлен на проверку. Обычно это занимает 1–24 часа.
                    </div>
                  </div>
                )}

                {/* Verified = money already credited to balance */}
                {(a.status === 'verified' || a.status === 'paid') && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#00ff88', lineHeight: 1.5, fontWeight: 600 }}>
                      💸 {(c?.rewardPerStory || 0).toLocaleString()}₽ начислены на ваш баланс!
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
                  {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
