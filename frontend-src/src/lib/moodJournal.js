const MOOD_KEY = 'mindlab_mood_journal';
const REFLECTION_KEY = 'mindlab_session_reflections';
const FEEDBACK_KEY = 'mindlab_message_feedback';

export const MOOD_EMOJI = [
  { score: 1, emoji: '😔', label: { 'zh-HK': '好低落', 'zh-TW': '好低落', en: 'Very low' } },
  { score: 2, emoji: '😕', label: { 'zh-HK': '有啲悶', 'zh-TW': '有點悶', en: 'Low' } },
  { score: 3, emoji: '😐', label: { 'zh-HK': '一般', 'zh-TW': '普通', en: 'Okay' } },
  { score: 4, emoji: '🙂', label: { 'zh-HK': '還好', 'zh-TW': '還可以', en: 'Alright' } },
  { score: 5, emoji: '😊', label: { 'zh-HK': '輕鬆啲', 'zh-TW': '輕鬆一點', en: 'Lighter' } },
];

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getMoodEntries() {
  return readJson(MOOD_KEY, []);
}

export function addMoodEntry({ score, note = '', sessionId = null, tags = [] }) {
  const entry = {
    id: `mood_${Date.now()}`,
    score,
    note: note.trim(),
    sessionId,
    tags,
    createdAt: new Date().toISOString(),
  };
  const list = [entry, ...getMoodEntries()].slice(0, 200);
  writeJson(MOOD_KEY, list);
  return entry;
}

export function getSessionReflections() {
  return readJson(REFLECTION_KEY, {});
}

export function saveSessionReflection(sessionId, data) {
  const all = getSessionReflections();
  all[sessionId] = { ...data, updatedAt: new Date().toISOString() };
  writeJson(REFLECTION_KEY, all);
  return all[sessionId];
}

export function getSessionReflection(sessionId) {
  return getSessionReflections()[sessionId] || null;
}

export function getMessageFeedback(sessionId) {
  return readJson(FEEDBACK_KEY, {})[sessionId] || {};
}

export function setMessageFeedback(sessionId, messageIndex, feedback) {
  const all = readJson(FEEDBACK_KEY, {});
  const sessionMap = { ...(all[sessionId] || {}) };
  if (feedback) sessionMap[messageIndex] = feedback;
  else delete sessionMap[messageIndex];
  all[sessionId] = sessionMap;
  writeJson(FEEDBACK_KEY, all);
}
