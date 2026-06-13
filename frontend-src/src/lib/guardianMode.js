const KEY = 'mindlab_guardian_settings';

const DEFAULT = {
  isMinor: false,
  guardianConsented: false,
  guardianPin: '',
  guardianEmail: '',
  digestEnabled: false,
};

export function getGuardianSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT };
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT };
  }
}

export function setGuardianSettings(partial) {
  const next = { ...getGuardianSettings(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function guardianBlocksChat() {
  const g = getGuardianSettings();
  return g.isMinor && !g.guardianConsented;
}

export function verifyGuardianPin(pin) {
  const g = getGuardianSettings();
  if (!g.guardianPin) return true;
  return String(pin) === String(g.guardianPin);
}
