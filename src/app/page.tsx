'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window { Telegram: any; }
}

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const TaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const MOCK_CAMPAIGNS = [
  { id: 1, title: 'Крипто-проект X', niche: 'Крипта', geo: 'РФ', reward: 3500, views: '5k+', slots: 8, hot: true },
  { id: 2, title: 'Beauty бренд Лукс', niche: 'Бьюти', geo: 'МСК', reward: 2200, views: '2k+', slots: 3, hot: false },
  { id: 3, title: 'IT-стартап DevFlow', niche: 'Технологии', geo: 'Any', reward: 5000, views: '10k+', slots: 5, hot: true },
];

const NICHE_COLORS: Record<string, string> = {
  'Крипта': 'cyber-badge-purple',
  'Бьюти': 'cyber-badge-pink',
  'Технологии': 'cyber-badge',
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [balance] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <header style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(0,229,255,0.1)',
        background: 'rgba(5,5,20,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="avatar" style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '2px solid rgba(0,229,255,0.4)',
              boxShadow: '0 0 12px rgba(0,229,255,0.3)'
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5ff22, #b400ff22)',
              border: '2px solid rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--neon-cyan)'
            }}>
              {user?.first_name?.[0] || '?'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>
              {user?.first_name || 'Инфлюенсер'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--neon-cyan)', opacity: 0.7 }}>
              @{user?.username || 'user'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Баланс</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>
            {balance.toLocaleString()} ₽
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '20px', paddingBottom: '90px', overflowY: 'auto' }}>

        {/* CTA banner */}
        <div className="cyber-card animate-flicker" style={{
          padding: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(180,0,255,0.08))',
          border: '1px solid rgba(0,229,255,0.25)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--neon-purple)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            ★ Стань частью системы
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 12, letterSpacing: '-0.01em' }}>
            Монетизируй свои <span style={{ color: 'var(--neon-cyan)' }}>Сторис</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
            Пройди верификацию и начни получать задания от рекламодателей
          </p>
          <Link href="/onboarding">
            <button className="cyber-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 13, cursor: 'pointer', border: 'none' }}>
              ПОДАТЬ АНКЕТУ →
            </button>
          </Link>
        </div>

        {/* Section: Active campaigns */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            КАМПАНИИ:
          </h3>
          <span style={{ fontSize: 10, color: 'var(--neon-cyan)', cursor: 'pointer' }}>ВСЕ →</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {MOCK_CAMPAIGNS.map(c => (
            <div key={c.id} className="cyber-card" style={{ padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {c.hot && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                        color: 'var(--neon-pink)', background: 'rgba(255,0,128,0.1)',
                        border: '1px solid rgba(255,0,128,0.3)',
                        borderRadius: 3, padding: '2px 6px'
                      }}>HOT</span>
                    )}
                    <span className={`cyber-badge ${NICHE_COLORS[c.niche] || 'cyber-badge'}`}>{c.niche}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.geo}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{c.title}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                    {c.reward.toLocaleString()}₽
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>за сторис</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>👁 {c.views} просм.</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🎯 {c.slots} мест</span>
                </div>
                <button className="cyber-btn" style={{ fontSize: 11, padding: '5px 14px', cursor: 'pointer' }}>
                  Откликнуться
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="cyber-card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-purple)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Активных заданий</div>
          </div>
          <div className="cyber-card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Выполнено</div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="cyber-nav" style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        zIndex: 20,
      }}>
        {[
          { id: 'home', label: 'Главная', Icon: HomeIcon },
          { id: 'tasks', label: 'Задания', Icon: TaskIcon },
          { id: 'profile', label: 'Профиль', Icon: ProfileIcon },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`cyber-nav-item ${activeTab === id ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="nav-icon-wrap" style={{ padding: '6px 18px' }}>
              <Icon />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
