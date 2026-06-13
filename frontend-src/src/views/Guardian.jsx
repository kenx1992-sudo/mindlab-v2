'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';
import { getGuardianSettings, setGuardianSettings, verifyGuardianPin } from '@/lib/guardianMode';
import { getMoodEntries } from '@/lib/moodJournal';
import { pushUserSync } from '@/lib/userSync';

export default function Guardian() {
  const { lang } = useMindlabLocale();
  const [g, setG] = useState(() => getGuardianSettings());
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(!getGuardianSettings().guardianPin);
  const moods = getMoodEntries().slice(0, 14);

  function save(partial) {
    setG(setGuardianSettings(partial));
    pushUserSync();
  }

  if (!unlocked && g.guardianPin) {
    return (
      <div className="px-5 pt-10 pb-10 max-w-md mx-auto">
        <Link to="/profile" className="text-xs text-muted-foreground flex items-center gap-1 mb-6">
          <ChevronLeft className="w-4 h-4" /> {t('profileTitle', lang)}
        </Link>
        <h1 className="font-playfair text-xl font-bold mb-4">{t('guardianPinTitle', lang)}</h1>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm mb-4"
        />
        <button
          type="button"
          onClick={() => verifyGuardianPin(pinInput) && setUnlocked(true)}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium"
        >
          {t('guardianUnlock', lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-10 max-w-md mx-auto">
      <Link to="/profile" className="text-xs text-muted-foreground flex items-center gap-1 mb-6">
        <ChevronLeft className="w-4 h-4" /> {t('profileTitle', lang)}
      </Link>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="font-playfair text-2xl font-bold">{t('guardianPageTitle', lang)}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('guardianPageDesc', lang)}</p>

      <label className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-4 mb-3 cursor-pointer">
        <span className="text-sm">{t('guardianIsMinor', lang)}</span>
        <input type="checkbox" checked={g.isMinor} onChange={(e) => save({ isMinor: e.target.checked })} className="w-5 h-5 accent-primary" />
      </label>
      <label className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-4 mb-3 cursor-pointer">
        <span className="text-sm">{t('guardianConsented', lang)}</span>
        <input type="checkbox" checked={g.guardianConsented} onChange={(e) => save({ guardianConsented: e.target.checked })} className="w-5 h-5 accent-primary" />
      </label>
      <input
        value={g.guardianEmail}
        onChange={(e) => save({ guardianEmail: e.target.value })}
        placeholder={t('guardianEmail', lang)}
        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm mb-3"
      />
      <input
        type="password"
        value={g.guardianPin}
        onChange={(e) => save({ guardianPin: e.target.value })}
        placeholder={t('guardianPinSet', lang)}
        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm mb-6"
      />

      <h2 className="font-semibold text-sm mb-2">{t('guardianMoodDigest', lang)}</h2>
      <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto">
        {moods.length === 0 ? (
          <li className="text-xs text-muted-foreground">{t('moodJournalDesc', lang)}</li>
        ) : (
          moods.map((m) => (
            <li key={m.id} className="text-xs bg-muted/30 rounded-xl px-3 py-2 border border-border/60">
              {new Date(m.createdAt).toLocaleDateString()} · {m.score}/5{m.note ? ` · ${m.note}` : ''}
            </li>
          ))
        )}
      </ul>
      <Link to="/sessions" className="block text-center py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium">
        {t('companionTitle', lang)}
      </Link>
    </div>
  );
}
