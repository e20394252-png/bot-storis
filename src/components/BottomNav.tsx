'use client';

type Tab = 'home' | 'tasks' | 'my-tasks' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const TaskIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: 'home',     label: 'Главная',  Icon: HomeIcon },
  { id: 'tasks',    label: 'Задания',  Icon: SearchIcon },
  { id: 'my-tasks', label: 'Мои',     Icon: TaskIcon },
  { id: 'profile',  label: 'Профиль', Icon: ProfileIcon },
];

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      background: 'rgba(5,5,20,0.97)',
      borderTop: '1px solid rgba(0,229,255,0.12)',
      backdropFilter: 'blur(24px)',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 0 12px',
              color: active ? 'var(--neon-cyan)' : 'var(--text-muted)',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {/* active indicator line */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 0, left: '20%', right: '20%',
                height: 2,
                background: 'var(--neon-cyan)',
                borderRadius: '0 0 2px 2px',
                boxShadow: '0 0 8px var(--neon-cyan)',
              }} />
            )}
            <div style={{
              padding: active ? '5px 14px' : '5px 14px',
              background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
              borderRadius: 8,
              transition: 'background 0.15s',
            }}>
              <Icon active={active} />
            </div>
            <span style={{ fontSize: 10, letterSpacing: '0.04em', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
