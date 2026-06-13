'use client';
import { db } from '@/lib/api-client';
import { getLanguage, getRegion, setLanguage, setRegion } from '@/lib/locale';
import { getDailyReminder, setDailyReminder } from '@/lib/dailyReminder';
import { getMoodEntries } from '@/lib/moodJournal';
import { getLocalUnlockedSkins, isPlusActive, setPlusActive, unlockSkinLocally } from '@/lib/skinAccess';
import { getStoredThemeId } from '@/lib/themes';
import { tryApplyTheme } from '@/lib/applyTheme';
import { loadCompanionChoice } from '@/lib/mbtiCompanions';
import { getGuardianSettings } from '@/lib/guardianMode';
import { getPresetLibrary } from '@/lib/presetLibrary';

export function getMindlabUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mindlab_user_id');
}

export function ensureMindlabUserId() {
  let id = getMindlabUserId();
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('mindlab_user_id', id);
  }
  return id;
}

function snapshotLocal() {
  return {
    region: getRegion(),
    language: getLanguage(),
    theme_id: getStoredThemeId(),
    plus_active: isPlusActive(),
    unlocked_skins: getLocalUnlockedSkins(),
    daily_reminder: getDailyReminder(),
    mood_journal: getMoodEntries().slice(0, 100),
    companion_choice: loadCompanionChoice(),
    preset_library: getPresetLibrary(),
    guardian: getGuardianSettings(),
    consent_done: localStorage.getItem('mindlab_consent_done') === 'true',
    companion_setup_done: localStorage.getItem('mindlab_companion_setup_done') === 'true',
  };
}

function applyRemote(data) {
  if (!data || typeof data !== 'object') return;
  if (data.region) setRegion(String(data.region).toUpperCase());
  if (data.language) setLanguage(data.language);
  if (data.plus_active) setPlusActive(!!data.plus_active);
  if (Array.isArray(data.unlocked_skins)) unlockSkinLocally(data.unlocked_skins);
  if (data.daily_reminder) setDailyReminder(data.daily_reminder);
  if (data.theme_id) tryApplyTheme(data.theme_id);
  if (Array.isArray(data.mood_journal)) {
    localStorage.setItem('mindlab_mood_journal', JSON.stringify(data.mood_journal));
  }
  if (Array.isArray(data.preset_library)) {
    localStorage.setItem('mindlab_preset_library', JSON.stringify(data.preset_library));
  }
  if (data.guardian) {
    localStorage.setItem('mindlab_guardian_settings', JSON.stringify(data.guardian));
  }
}

export async function pushUserSync() {
  const userId = ensureMindlabUserId();
  const blob = JSON.stringify(snapshotLocal());
  try {
    await db.userProfile.update(userId, {
      sync_blob: blob,
      language_preference: getLanguage(),
      region: getRegion().toLowerCase(),
      plus_active: isPlusActive(),
    });
    return true;
  } catch {
    localStorage.setItem('mindlab_sync_blob', blob);
    return false;
  }
}

export async function pullUserSync() {
  const userId = ensureMindlabUserId();
  try {
    const row = await db.userProfile.get(userId);
    if (row?.sync_blob) {
      const data = JSON.parse(row.sync_blob);
      applyRemote(data);
      return { ok: true, source: 'cloud' };
    }
    if (row?.plus_active) setPlusActive(true);
    if (row?.language_preference) setLanguage(row.language_preference);
    if (row?.region) setRegion(String(row.region).toUpperCase());
    return { ok: true, source: 'profile' };
  } catch {
    const local = localStorage.getItem('mindlab_sync_blob');
    if (local) {
      try { applyRemote(JSON.parse(local)); return { ok: true, source: 'local' }; } catch {}
    }
    return { ok: false, source: 'none' };
  }
}

export async function linkAuthUser() {
  return ensureMindlabUserId();
}
