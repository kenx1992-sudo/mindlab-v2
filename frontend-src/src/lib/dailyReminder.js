const REMINDER_KEY = 'mindlab_daily_reminder';

const DEFAULT = { enabled: false, hour: 20, minute: 0, lastShownDate: null };

export function getDailyReminder() {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setDailyReminder(partial) {
  const next = { ...getDailyReminder(), ...partial };
  localStorage.setItem(REMINDER_KEY, JSON.stringify(next));
  return next;
}

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

/** 開 app 時輕提示（唔依賴背景 push） */
export function maybeShowDailyReminder(lang = 'zh-HK') {
  const prefs = getDailyReminder();
  if (!prefs.enabled) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (prefs.lastShownDate === today) return null;

  const now = new Date();
  const afterTime =
    now.getHours() > prefs.hour ||
    (now.getHours() === prefs.hour && now.getMinutes() >= prefs.minute);
  if (!afterTime) return null;

  const message =
    lang === 'en'
      ? 'A gentle check-in: how are you feeling today?'
      : lang === 'zh-TW'
        ? '輕輕問一句：今天過得還好嗎？'
        : '輕輕問一句：今日過得點呀？';

  setDailyReminder({ lastShownDate: today });

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const title = lang === 'en' ? 'Mindlab' : lang === 'zh-TW' ? '自由心事' : '自由心事';
      new Notification(title, { body: message, tag: 'mindlab-daily' });
    } catch {
      /* ignore */
    }
  }

  return message;
}
