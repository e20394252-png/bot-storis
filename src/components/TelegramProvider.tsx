'use client';

import { useEffect, useState, ReactNode } from 'react';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    import('@twa-dev/sdk').then((WebApp) => {
      WebApp.default.ready();
      WebApp.default.expand();
    });
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  }

  return <>{children}</>;
}
