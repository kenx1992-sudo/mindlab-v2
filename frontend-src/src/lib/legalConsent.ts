'use client';
import { db } from '@/lib/api-client';
import { ensureMindlabUserId } from '@/lib/userSync';

export const PROFILE_LEGAL_CONSENT_KEY = 'mindlab_consent';
export const PROFILE_LEGAL_LOCKED_KEY = 'mindlab_profile_legal_locked';

export function isProfileLegalConsentLocked() {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(PROFILE_LEGAL_LOCKED_KEY) === 'true' ||
    localStorage.getItem('mindlab_consent_done') === 'true'
  );
}

export function isProfileLegalConsentChecked() {
  if (typeof window === 'undefined') return false;
  return isProfileLegalConsentLocked() || localStorage.getItem(PROFILE_LEGAL_CONSENT_KEY) === 'true';
}

export async function lockProfileLegalConsent() {
  if (typeof window === 'undefined') return { ok: false };
  localStorage.setItem(PROFILE_LEGAL_CONSENT_KEY, 'true');
  localStorage.setItem(PROFILE_LEGAL_LOCKED_KEY, 'true');

  const userId = ensureMindlabUserId();
  try {
    await db.userProfile.update(userId, {
      personal_liability_acknowledged: true,
    });
    await db.consent.create({ user_id: userId, consent_type: 'privacy_terms', granted: true });
    window.dispatchEvent(new Event('mindlab-onboarding-changed'));
    return { ok: true };
  } catch {
    return { ok: true, localOnly: true };
  }
}
