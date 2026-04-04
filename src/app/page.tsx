'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import HomeView from '@/views/HomeView';
import TasksView from '@/views/TasksView';
import MyTasksView from '@/views/MyTasksView';
import ProfileView from '@/views/ProfileView';

declare global {
  interface Window { Telegram: any; }
}

type Tab = 'home' | 'tasks' | 'my-tasks' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [initData, setInitData] = useState('');
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      setInitData(tg.initData || '');
      setTgUser(tg.initDataUnsafe?.user || null);
    }
  }, []);

  // Sticky header (user info) visible on home tab
  const showHeader = activeTab === 'home';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* App-level header — only on home */}
      {showHeader && (
        <header style={{
          padding: '14px 20px 12px',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
          background: 'rgba(5,5,20,0.85)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {tgUser?.photo_url ? (
              <img src={tgUser.photo_url} alt="" style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '2px solid rgba(0,229,255,0.4)',
                boxShadow: '0 0 10px rgba(0,229,255,0.25)',
              }} />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(180,0,255,0.2))',
                border: '2px solid rgba(0,229,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'var(--neon-cyan)',
              }}>
                {tgUser?.first_name?.[0] || '?'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{tgUser?.first_name || 'Инфлюенсер'}</div>
              {tgUser?.username && (
                <div style={{ fontSize: 11, color: 'var(--neon-cyan)', opacity: 0.65 }}>@{tgUser.username}</div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>БИРЖА СТОРИС</div>
          </div>
        </header>
      )}

      {/* Main content area */}
      <main style={{ paddingBottom: 80 }}>
        {activeTab === 'home' && (
          <HomeView
            initData={initData}
            tgUser={tgUser}
            onGoToTasks={() => setActiveTab('tasks')}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksView initData={initData} onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'my-tasks' && (
          <MyTasksView initData={initData} onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            initData={initData}
            tgUser={tgUser}
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Bottom navigation — always visible */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
