'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, LifeBuoy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { maybeShowDailyReminder } from '@/lib/dailyReminder';
import { getLanguage, t } from '@/lib/locale';

function readOnboardingOverlay(pathname) {
  if (pathname !== '/sessions' || typeof window === 'undefined') return false;
  return (
    localStorage.getItem('mindlab_consent_done') !== 'true' ||
    localStorage.getItem('mindlab_companion_setup_done') !== 'true'
  );
}

export default function Layout() {
  const location = useLocation();
  const companionActive = location.pathname === '/sessions';
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
  const [onboardingOverlay, setOnboardingOverlay] = useState(() =>
    readOnboardingOverlay(location.pathname)
  );
  const [lang, setLang] = useState(() => getLanguage());

  useEffect(() => {
    const sync = () => setLang(getLanguage());
    window.addEventListener('mindlab-locale-changed', sync);
    return () => window.removeEventListener('mindlab-locale-changed', sync);
  }, []);

  const sideNav = useMemo(
    () => [
      { path: '/', icon: Home, label: t('navHome', lang) },
      { path: '/help', icon: LifeBuoy, label: t('navHelp', lang) },
    ],
    [lang],
  );
  const profileNav = useMemo(
    () => ({ path: '/profile', icon: User, label: t('navProfileTab', lang) }),
    [lang],
  );

  useEffect(() => {
    const refresh = () => setOnboardingOverlay(readOnboardingOverlay(location.pathname));
    refresh();
    window.addEventListener('mindlab-onboarding-changed', refresh);
    return () => window.removeEventListener('mindlab-onboarding-changed', refresh);
  }, [location.pathname]);

  useEffect(() => {
    maybeShowDailyReminder(getLanguage());
  }, [location.pathname]);

  useEffect(() => {
    if (!isEmbedded) return;
    const report = () => {
      window.parent?.postMessage(
        { type: 'mindlab-height', height: document.documentElement.scrollHeight },
        '*'
      );
    };
    const ro = new ResizeObserver(report);
    ro.observe(document.body);
    report();
    return () => ro.disconnect();
  }, [isEmbedded]);

  function NavItem({ path, icon: Icon, label }) {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={cn(
          'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]',
          active ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Icon className={cn('w-5 h-5', active && 'scale-110')} strokeWidth={active ? 2.25 : 1.75} />
        <span className={cn('text-[10px] font-medium', active && 'font-semibold text-foreground')}>{label}</span>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-[4.75rem]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="calm-card rounded-2xl px-2 py-1.5 flex items-end justify-between"
        >
          <NavItem {...sideNav[0]} />

          <Link
            to="/sessions"
            className={cn(
              'relative -top-4 flex flex-col items-center gap-1',
              companionActive && 'drop-shadow-[0_0_12px_hsl(158_35%_35%/0.5)]',
            )}
          >
            <span
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 calm-glow-ring',
                companionActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gradient-to-br from-primary to-[hsl(158_28%_32%)] text-primary-foreground',
              )}
            >
              <MessageCircle className="w-6 h-6" strokeWidth={2} />
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold',
                companionActive ? 'text-accent' : 'text-muted-foreground',
              )}
            >
              {t('navCompanionTab', lang)}
            </span>
          </Link>

          <NavItem {...sideNav[1]} />
          <NavItem {...profileNav} />
        </motion.div>
      </nav>
    </div>
  );
}

