import { getStoredThemeId, getTheme, THEME_STORAGE_KEY, DEFAULT_THEME_ID } from './themes';
import { canUseSkin, getAccessibleThemeId } from './skinAccess';

export function applyTheme(themeId, { force = false } = {}) {
  const allowedId = force ? themeId : getAccessibleThemeId(themeId);
  const theme = getTheme(allowedId);
  if (!theme || typeof document === 'undefined') return theme;

  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  return theme;
}

export function initTheme() {
  const stored = getStoredThemeId();
  const allowed = getAccessibleThemeId(stored);
  if (allowed !== stored) {
    localStorage.setItem(THEME_STORAGE_KEY, allowed);
  }
  return applyTheme(allowed);
}

export function tryApplyTheme(themeId) {
  if (!canUseSkin(themeId)) {
    return { ok: false, theme: applyTheme(DEFAULT_THEME_ID), reason: 'locked' };
  }
  return { ok: true, theme: applyTheme(themeId) };
}
