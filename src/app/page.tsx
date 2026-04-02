'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((WebApp) => {
        if (WebApp.default.initDataUnsafe?.user) {
          setUser(WebApp.default.initDataUnsafe.user);
        }
      });
    }
  }, []);

  return (
    <main className="p-4 max-w-md mx-auto space-y-6">
      <header className="flex items-center space-x-4 border-b border-gray-800 pb-4">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="avatar" className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">?</div>
        )}
        <div>
          <h1 className="text-xl font-bold">{user?.first_name || 'Инфлюенсер'}</h1>
          <p className="text-sm text-gray-400">@{user?.username || 'user'}</p>
        </div>
      </header>

      <section className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-gray-400 text-sm mb-1">Твой баланс</h2>
        <p className="text-3xl font-bold font-mono">0 ₽</p>
      </section>

      <button
        onClick={() => window.location.href = '/onboarding'}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium transition-colors text-center shadow-lg shadow-blue-900/20"
      >
        Заполнить анкету (Стать исполнителем)
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl font-medium transition-colors text-center border border-gray-700">
          Найти задания
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl font-medium transition-colors text-center border border-gray-700">
          Мои задания
        </button>
      </div>

    </main>
  );
}
