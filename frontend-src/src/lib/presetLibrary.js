const KEY = 'mindlab_preset_library';

export function getPresetLibrary() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveToPresetLibrary(entry) {
  const list = getPresetLibrary();
  const item = {
    id: `lib_${Date.now()}`,
    name: entry.name?.trim(),
    personality: entry.personality?.trim() || '',
    presetId: entry.presetId || null,
    mbtiStyle: entry.mbtiStyle || 'custom',
    mbti: entry.mbti || null,
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...list].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function removeFromPresetLibrary(id) {
  const next = getPresetLibrary().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
