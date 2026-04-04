'use client';

import { useEffect, useState } from 'react';
import BackHeader from '@/components/BackHeader';

interface CampaignDetailViewProps {
  campaignId: string;
  initData: string;
  onBack: () => void;
}

const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Лайфстайл', crypto: 'Крипта', tech: 'Технологии',
  beauty: 'Бьюти', business: 'Бизнес', travel: 'Путешествия', other: 'Другое',
};

export default function CampaignDetailView({ campaignId, initData, onBack }: CampaignDetailViewProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignStatus, setAssignStatus] = useState<string | null>(null); // existing assignment status
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const headers = initData ? { 'x-telegram-init-data': initData } as HeadersInit : undefined;
    Promise.all([
      fetch(`/api/campaigns/${campaignId}`).then(r => r.json()),
      initData
        ? fetch('/api/my-assignments', { headers }).then(r => r.json())
        : Promise.resolve({ assignments: [] }),
    ]).then(([campData, myData]) => {
      setCampaign(campData.campaign || null);
      const existing = (myData.assignments || []).find((a: any) => a.campaignId === campaignId);
      setAssignStatus(existing?.status ?? null);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignId, initData]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApply = async () => {
    if (!initData) { showToast('Откройте приложение через Telegram', false); return; }
    setApplying(true);
    try {
      const res = await fetch('/api/campaigns/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setAssignStatus('accepted');
      showToast('✓ Вы откликнулись! Публикуйте сторис и загрузите пруф.', true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid var(--neon-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BackHeader title="Кампания" onBack={onBack} />
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Кампания не найдена
        </div>
      </div>
    );
  }

  const spotsLeft = campaign.creatorsNeeded ?? 0;
  const isBlocked = assignStatus && assignStatus !== 'rejected';
  const isRejected = assignStatus === 'rejected';
  const canApply = !isBlocked && spotsLeft > 0;

  const statusLabel: Record<string, string> = {
    accepted: '✓ Вы откликнулись — загрузите пруф после публикации',
    published: '⏳ Пруф на проверке',
    verified: '💸 Награда начислена на баланс',
    paid: '💸 Награда начислена на баланс',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackHeader title="Детали кампании" onBack={onBack} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, padding: '12px 20px', borderRadius: 10,
          background: toast.ok ? 'rgba(0,255,136,0.15)' : 'rgba(255,0,128,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(0,255,136,0.4)' : 'rgba(255,0,128,0.4)'}`,
          color: toast.ok ? '#00ff88' : '#ff0080',
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding: '20px', flex: 1 }}>

        {/* Hero reward */}
        <div style={{
          textAlign: 'center', padding: '28px 20px', marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,229,255,0.06))',
          border: '1px solid rgba(0,255,136,0.15)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>НАГРАДА ЗА ОДНУ СТОРИС</div>
          <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'monospace', color: 'var(--neon-green)', lineHeight: 1 }}>
            {(campaign.rewardPerStory || 0).toLocaleString()}₽
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>🎯 {spotsLeft > 0 ? `${spotsLeft} мест осталось` : 'Мест нет'}</span>
            <span>💰 Бюджет {(campaign.budget || 0).toLocaleString()}₽</span>
          </div>
        </div>

        {/* Campaign info */}
        <div className="cyber-card" style={{ padding: '18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="cyber-badge">{NICHE_LABELS[campaign.niche] || campaign.niche || 'Общее'}</span>
            {campaign.geo && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>📍 {campaign.geo}</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 10, letterSpacing: '-0.01em' }}>{campaign.title}</div>
          {campaign.description && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {campaign.description}
            </div>
          )}
        </div>

        {/* Task requirements */}
        {campaign.requirements && (
          <div className="cyber-card" style={{ padding: '18px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--neon-cyan)', marginBottom: 12 }}>// ТЗ_НА_СТОРИС</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {campaign.requirements}
            </div>
          </div>
        )}

        {/* Current assignment status */}
        {assignStatus && statusLabel[assignStatus] && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
            fontSize: 13, color: 'var(--neon-cyan)',
          }}>
            {statusLabel[assignStatus]}
          </div>
        )}

        {/* Rejected — can retry */}
        {isRejected && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)',
            fontSize: 13, color: '#ffc800',
          }}>
            ⚠️ Пруф был отклонён. Вы можете откликнуться повторно.
          </div>
        )}

        {/* No spots */}
        {!isBlocked && spotsLeft <= 0 && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.2)',
            fontSize: 13, color: 'var(--neon-pink)',
          }}>
            ❌ Все места заняты
          </div>
        )}
      </div>

      {/* Sticky bottom button */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,229,255,0.08)', background: 'rgba(5,5,20,0.95)', backdropFilter: 'blur(20px)' }}>
        {isBlocked ? (
          <div style={{
            textAlign: 'center', padding: '14px', borderRadius: 10,
            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)',
            fontSize: 13, color: 'var(--neon-green)', fontWeight: 600,
          }}>
            ✓ Вы уже участвуете в этой кампании
          </div>
        ) : (
          <button
            className="cyber-btn-primary"
            disabled={applying || !canApply}
            onClick={handleApply}
            style={{
              width: '100%', padding: '16px', fontSize: 14,
              cursor: applying || !canApply ? 'not-allowed' : 'pointer',
              border: 'none', opacity: !canApply ? 0.5 : 1,
            }}
          >
            {applying ? 'ОТПРАВКА...' : isRejected ? '↩ ПОВТОРИТЬ ОТКЛИК' : '✓ ОТКЛИКНУТЬСЯ'}
          </button>
        )}
      </div>
    </div>
  );
}
