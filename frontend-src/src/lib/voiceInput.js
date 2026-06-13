import { normalizeLanguage } from '@/lib/locale';

export function speechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speechLangFor(locale) {
  const safe = normalizeLanguage(locale);
  if (safe === 'en') return 'en-US';
  if (safe === 'zh-TW') return 'zh-TW';
  return 'zh-HK';
}

export function createSpeechRecognizer(locale, { onResult, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = speechLangFor(locale);
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    if (text) onResult?.(text);
  };
  rec.onerror = (e) => onError?.(e);
  rec.onend = () => onEnd?.();
  return rec;
}
