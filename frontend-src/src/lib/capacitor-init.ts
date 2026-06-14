'use client';

import { useEffect } from 'react';

export function useCapacitorInit() {
  useEffect(() => {
    const init = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });

        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch {
        // Not running in Capacitor (web browser)
      }
    };
    init();
  }, []);
}
