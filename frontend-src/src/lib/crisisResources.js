/** 危機熱線 — Help 頁與前端展示用 */

export const CRISIS_LINES = {
  HK: [
    { name: '撒瑪利亞防止自殺會', nameEn: 'The Samaritans HK', phone: '23892222', display: '2389 2222', note: '24小時', noteEn: '24 hours' },
    { name: '生命熱線', nameEn: 'Suicide Prevention HK', phone: '23820000', display: '2382 0000', note: '24小時', noteEn: '24 hours' },
    { name: '醫管局精神科熱線', nameEn: 'HA psychiatric hotline', phone: '24667350', display: '2466 7350', note: '', noteEn: '' },
  ],
  TW: [
    { name: '安心專線', nameEn: 'Mental Health Hotline', phone: '1925', display: '1925', note: '24小時（自殺防治）', noteEn: '24 hours' },
    { name: '生命線', nameEn: 'Lifeline Taiwan', phone: '1995', display: '1995', note: '24小時', noteEn: '24 hours' },
  ],
  GB: [
    { name: 'Samaritans', nameEn: 'Samaritans', phone: '116123', display: '116 123', note: '24/7 免費', noteEn: '24/7 free' },
    { name: 'Mind Infoline', nameEn: 'Mind Infoline', phone: '03001233393', display: '0300 123 3393', note: '', noteEn: '' },
    { name: 'Crisis Text Line', nameEn: 'Crisis Text Line', phone: null, display: 'Text SHOUT to 85258', note: '24/7', noteEn: '24/7' },
  ],
};

export const REGION_TABS = [
  ['HK', '🇭🇰 香港'],
  ['TW', '🇹🇼 台灣'],
  ['GB', '🇬🇧 UK'],
];

export const REGION_TABS_EN = [
  ['HK', '🇭🇰 Hong Kong'],
  ['TW', '🇹🇼 Taiwan'],
  ['GB', '🇬🇧 UK'],
];

export function crisisLineLabel(line, lang) {
  if (!line) return '';
  return lang === 'en' ? line.nameEn || line.name : line.name;
}

export function crisisLineNote(line, lang) {
  if (!line?.note) return '';
  return lang === 'en' ? line.noteEn || line.note : line.note;
}

export function getRegionTabs(lang) {
  return lang === 'en' ? REGION_TABS_EN : REGION_TABS;
}
