import { useEffect, useState } from 'react';
import {
  getLanguage,
  getRegion,
  setLanguage as persistLanguage,
  setRegion as persistRegion,
  setRegionAndLanguage,
  LANG_OPTIONS,
  REGION_OPTIONS,
} from '@/lib/locale';

export function useMindlabLocale() {
  const [lang, setLang] = useState(getLanguage);
  const [region, setRegion] = useState(getRegion);

  useEffect(() => {
    const refresh = () => {
      setLang(getLanguage());
      setRegion(getRegion());
    };
    window.addEventListener('mindlab-locale-changed', refresh);
    return () => window.removeEventListener('mindlab-locale-changed', refresh);
  }, []);

  return {
    lang,
    region,
    setLanguage: persistLanguage,
    setRegion: persistRegion,
    setRegionAndLanguage,
    langOptions: LANG_OPTIONS,
    regionOptions: REGION_OPTIONS,
    isEnglish: lang === 'en',
    isTaiwan: lang === 'zh-TW',
  };
}
