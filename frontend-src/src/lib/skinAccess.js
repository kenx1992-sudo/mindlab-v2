import {
  DEFAULT_THEME_ID,
  FREE_SKIN_IDS,
  PREMIUM_SKIN_IDS,
  SKIN_BUNDLE_ID,
  SKIN_BUNDLE_PRICE_HKD,
} from './themes';

export const UNLOCKED_SKINS_KEY = 'mindlab_unlocked_skins';
export const PLUS_ACTIVE_KEY = 'mindlab_plus_active';
export const PLUS_PLAN_KEY = 'mindlab_plus_plan';
export const PLUS_GIFT_SKIN_KEY = 'mindlab_plus_gift_skin';

export function getLocalUnlockedSkins() {
  if (typeof window === 'undefined') return [...FREE_SKIN_IDS];
  try {
    const raw = localStorage.getItem(UNLOCKED_SKINS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return [...new Set([...FREE_SKIN_IDS, ...parsed])];
  } catch {
    return [...FREE_SKIN_IDS];
  }
}

export function setLocalUnlockedSkins(ids) {
  const premiumOnly = ids.filter((id) => !FREE_SKIN_IDS.includes(id));
  localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(premiumOnly));
}

export function unlockSkinLocally(skinIdOrIds) {
  const ids = Array.isArray(skinIdOrIds) ? skinIdOrIds : [skinIdOrIds];
  const next = [...new Set([...getLocalUnlockedSkins(), ...ids])];
  setLocalUnlockedSkins(next);
  return next;
}

export function isPlusActive() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PLUS_ACTIVE_KEY) === 'true';
}

export function setPlusActive(active) {
  localStorage.setItem(PLUS_ACTIVE_KEY, active ? 'true' : 'false');
}

/** 'companion_monthly' | 'unlimited_monthly' | 'unlimited_yearly' | null */
export function getPlusPlan() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLUS_PLAN_KEY) || null;
}

export function setPlusPlan(planId) {
  if (planId) localStorage.setItem(PLUS_PLAN_KEY, planId);
  else localStorage.removeItem(PLUS_PLAN_KEY);
}

/** The one premium skin gifted to companion_monthly subscribers */
export function getPlusGiftSkin() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLUS_GIFT_SKIN_KEY) || null;
}

export function setPlusGiftSkin(skinId) {
  if (skinId) localStorage.setItem(PLUS_GIFT_SKIN_KEY, skinId);
  else localStorage.removeItem(PLUS_GIFT_SKIN_KEY);
}

export function canUseSkin(skinId, { plusActive = isPlusActive(), unlocked = getLocalUnlockedSkins(), plan = getPlusPlan(), giftSkin = getPlusGiftSkin() } = {}) {
  if (FREE_SKIN_IDS.includes(skinId)) return true;
  // unlimited plans unlock all skins
  if (plusActive && (plan === 'unlimited_monthly' || plan === 'unlimited_yearly')) return true;
  // companion_monthly: only the chosen gift skin is unlocked via plus
  if (plusActive && plan === 'companion_monthly') return skinId === giftSkin;
  // fallback for legacy plus_active without plan info
  if (plusActive && !plan) return true;
  return unlocked.includes(skinId);
}

export function isPremiumSkin(skinId) {
  return PREMIUM_SKIN_IDS.includes(skinId);
}

export function getAccessibleThemeId(preferredId, opts) {
  return canUseSkin(preferredId, opts) ? preferredId : DEFAULT_THEME_ID;
}

export { SKIN_BUNDLE_ID, SKIN_BUNDLE_PRICE_HKD };