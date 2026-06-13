'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';
import {
  getDailyReminder,
  setDailyReminder,
  requestNotificationPermission,
} from '@/lib/dailyReminder';

export default function NotificationSettings() {
  const { lang } = useMindlabLocale();
  const [prefs, setPrefs] = useState(() => getDailyReminder());
  const [saved, setSaved] = useState(false);

  function update(partial) {
    const next = setDailyReminder(partial);
    setPrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function onToggle(enabled) {
    if (enabled) {
      const perm = await requestNotificationPermission();
      if (perm === 'denied') {
        alert(t('notifBlocked', lang));
        return;
      }
    }
    update({ enabled });
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> {t('profileTitle', lang)}
      </Link>
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-primary" />
        <h1 className="font-playfair text-2xl font-bold text-foreground">{t('reminderTitle', lang)}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('reminderDesc', lang)}</p>

      <label className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-4 mb-4 cursor-pointer">
        <span className="text-sm font-medium">{t('reminderEnable', lang)}</span>
        <input
          type="checkbox"
          checked={prefs.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
      </label>

      <p className="text-xs text-muted-foreground mb-2">{t('reminderTime', lang)}</p>
      <div className="flex gap-2 mb-6">
        <select
          value={prefs.hour}
          onChange={(e) => update({ hour: Number(e.target.value) })}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
          disabled={!prefs.enabled}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
          ))}
        </select>
        <select
          value={prefs.minute}
          onChange={(e) => update({ minute: Number(e.target.value) })}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
          disabled={!prefs.enabled}
        >
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>
          ))}
        </select>
      </div>

      {saved && <p className="text-xs text-accent text-center">{t('reminderSaved', lang)}</p>}
    </div>
  );
}