'use client';

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export default function BackHeader({ title, subtitle, onBack }: BackHeaderProps) {
  return (
    <header style={{
      padding: '14px 16px 12px',
      borderBottom: '1px solid rgba(0,229,255,0.1)',
      background: 'rgba(5,5,20,0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 8,
          padding: '6px 8px',
          cursor: 'pointer',
          color: 'var(--neon-cyan)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        <ArrowLeft />
      </button>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
    </header>
  );
}
