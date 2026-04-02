'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    // Read initData from Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setInitData(window.Telegram.WebApp.initData || '');
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Файл слишком большой. Максимум 5 MB.');
      return;
    }

    // Prepare preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setBase64Image(reader.result as string);
    };
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
        body: JSON.stringify({
          ...formData,
          base64Image,
          initData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при отправке анкеты');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Анкета принята!</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          Ваш скриншот статистики отправлен на проверку искусственному интеллекту. 
          Как только он подтвердит подлинность — ваш аккаунт станет активен.
        </p>
        <button 
          onClick={() => window.Telegram?.WebApp?.close?.()}
          className="w-full max-w-xs bg-blue-500 text-white rounded-xl py-3.5 font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
        >
          Закрыть приложение
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-5 pb-24">
      <h1 className="text-2xl font-bold mb-2">Анкета креатора</h1>
      <p className="text-gray-400 text-sm mb-6">
        Заполните данные о вашем блоге и прикрепите статистику
      </p>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Платформа / Username</label>
          <input 
            required
            name="socialUsername"
            value={formData.socialUsername}
            onChange={handleChange}
            placeholder="Например, @my_channel"
            className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3.5 border border-white/5 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Тематика</label>
            <select 
              required
              name="niche"
              value={formData.niche}
              onChange={handleChange}
              className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3.5 border border-white/5 focus:border-blue-500 focus:outline-none transition-colors appearance-none"
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
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Город</label>
            <input 
              required
              name="geo"
              value={formData.geo}
              onChange={handleChange}
              placeholder="Москва"
              className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3.5 border border-white/5 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Просмотры</label>
            <input 
              required
              type="number"
              name="avgStoryViews"
              value={formData.avgStoryViews}
              onChange={handleChange}
              placeholder="1500"
              className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3.5 border border-white/5 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Цена (₽)</label>
            <input 
              required
              type="number"
              name="pricePerStory"
              value={formData.pricePerStory}
              onChange={handleChange}
              placeholder="15000"
              className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3.5 border border-white/5 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="pt-2">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Скриншот статистики</label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${
              previewUrl ? 'border-white/20 bg-black' : 'border-white/10 bg-[#1c1c1e] hover:border-blue-500/50'
            }`}
          >
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Нажмите для загрузки фото</p>
              </>
            )}
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full mt-6 bg-blue-500 text-white rounded-xl py-4 font-medium text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Отправка...
            </>
          ) : (
            'Отправить анкету'
          )}
        </button>
      </form>
    </div>
  );
}
