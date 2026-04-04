'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window { Telegram: any; }
}

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function OnboardingPage() {
  const [initData, setInitData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    socialUsername: '',
    geo: '',
    niche: '',
    avgStoryViews: '',
    pricePerStory: ''
  });

  const [base64Image, setBase64Image] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setInitData(window.Telegram.WebApp.initData || '');
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fillTestData = () => {
    setFormData({
      socialUsername: '@test_channel',
      geo: 'Москва',
      niche: 'lifestyle',
      avgStoryViews: '5000',
      pricePerStory: '15000'
    });
    const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    setBase64Image(testBase64);
    setPreviewUrl(testBase64);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Файл слишком большой. Максимум 5 MB.');
      return;
    }
    setErrorMsg('');
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setBase64Image(reader.result as string);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!initData) {
      setErrorMsg('Запустите из Telegram Mini App!');
      return;
    }
    if (!base64Image) {
      setErrorMsg('Пожалуйста, загрузите скриншот статистики.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, base64Image, initData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при отправке анкеты');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', position: 'relative', zIndex: 1
      }}>
        {/* Glow orb */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.3), transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 0 40px rgba(0,255,136,0.4), 0 0 80px rgba(0,255,136,0.1)',
          animation: 'pulse-glow 2s ease-in-out infinite',
          color: 'var(--neon-green)'
        }}>
          <CheckIcon />
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--neon-green)', marginBottom: 12, textTransform: 'uppercase' }}>
          СИСТЕМА ПРИНЯЛА
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Анкета <span style={{ color: 'var(--neon-cyan)' }}>отправлена</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 36, maxWidth: 300, lineHeight: 1.6 }}>
          Скриншот передан на проверку AI. После верификации ваш профиль станет активным в бирже.
        </p>
        <div className="cyber-card" style={{
          padding: '14px 20px', marginBottom: 32, width: '100%', maxWidth: 320,
          display: 'flex', gap: 12, alignItems: 'center',
          background: 'rgba(0,229,255,0.04)'
        }}>
          <div style={{ fontSize: 22 }}>⏱</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'left' }}>
            Обычно проверка занимает <b style={{ color: 'var(--text-primary)' }}>1-2 часа</b>
          </div>
        </div>
        <button
          onClick={() => window.Telegram?.WebApp?.close?.()}
          className="cyber-btn-primary"
          style={{ width: '100%', maxWidth: 320, padding: '16px', fontSize: 13, cursor: 'pointer', border: 'none' }}
        >
          ЗАКРЫТЬ ПРИЛОЖЕНИЕ
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 20px 40px',
      position: 'relative', zIndex: 1
    }}>
      {/* Header */}
      {/* Back button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: 8, padding: '7px 9px',
            cursor: 'pointer', color: 'var(--neon-cyan)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Назад</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--neon-purple)', textTransform: 'uppercase', marginBottom: 6 }}>
            // РЕГИСТРАЦИЯ_АГЕНТА
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Анкета<br/><span style={{ color: 'var(--neon-cyan)' }}>креатора</span>
          </h1>
        </div>
        {(!initData || process.env.NODE_ENV !== 'production') && (
          <button
            type="button"
            onClick={fillTestData}
            style={{
              marginTop: 4,
              fontSize: 11, padding: '6px 12px',
              background: 'rgba(255,200,0,0.1)',
              border: '1px solid rgba(255,200,0,0.3)',
              color: '#ffc800', borderRadius: 6,
              cursor: 'pointer', letterSpacing: '0.04em'
            }}
          >
            🧪 ТЕСТ
          </button>
        )}
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(255,0,128,0.08)',
          border: '1px solid rgba(255,0,128,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--neon-pink)'
        }}>
          <AlertIcon />
          <span style={{ fontSize: 13 }}>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Username */}
        <div>
          <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Канал / Username
          </label>
          <input
            required
            name="socialUsername"
            value={formData.socialUsername}
            onChange={handleChange}
            placeholder="@my_channel"
            className="cyber-input"
            style={inputStyle}
          />
        </div>

        {/* Niche + Geo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Тематика
            </label>
            <select
              required
              name="niche"
              value={formData.niche}
              onChange={handleChange}
              className="cyber-input"
              style={inputStyle}
            >
              <option value="" disabled>Выбрать...</option>
              <option value="lifestyle">Лайфстайл</option>
              <option value="crypto">Крипта</option>
              <option value="tech">Технологии</option>
              <option value="beauty">Бьюти</option>
              <option value="business">Бизнес</option>
              <option value="travel">Путешествия</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Город/ГЕО
            </label>
            <input
              required
              name="geo"
              value={formData.geo}
              onChange={handleChange}
              placeholder="Москва"
              className="cyber-input"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Views + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Просмотры
            </label>
            <input
              required
              type="number"
              name="avgStoryViews"
              value={formData.avgStoryViews}
              onChange={handleChange}
              placeholder="5000"
              className="cyber-input"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Цена (₽)
            </label>
            <input
              required
              type="number"
              name="pricePerStory"
              value={formData.pricePerStory}
              onChange={handleChange}
              placeholder="15000"
              className="cyber-input"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Скриншот статистики
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cyber-card"
            style={{
              aspectRatio: '16/9',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              borderStyle: 'dashed',
              borderColor: previewUrl ? 'rgba(0,229,255,0.3)' : 'rgba(0,229,255,0.15)',
              transition: 'all 0.2s',
            }}
          >
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    background: 'rgba(0,229,255,0.15)',
                    border: '1px solid rgba(0,229,255,0.4)',
                    borderRadius: '50%', padding: 12,
                    color: 'var(--neon-cyan)'
                  }}>
                    <CameraIcon />
                  </div>
                </div>
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  fontSize: 10, color: 'var(--neon-green)',
                  background: 'rgba(0,255,136,0.1)',
                  border: '1px solid rgba(0,255,136,0.3)',
                  borderRadius: 4, padding: '2px 8px'
                }}>✓ ЗАГРУЖЕНО</div>
              </>
            ) : (
              <>
                <div style={{ color: 'rgba(0,229,255,0.4)', marginBottom: 12 }}>
                  <UploadIcon />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нажмите для загрузки</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>PNG, JPG, до 5 MB</p>
              </>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="cyber-btn-primary"
          style={{
            width: '100%', padding: '16px', fontSize: 13,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            border: 'none', marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {isSubmitting ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              ОТПРАВКА...
            </>
          ) : 'ОТПРАВИТЬ АНКЕТУ →'}
        </button>
      </form>
    </div>
  );
}
