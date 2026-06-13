'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, functions } from '@/lib/api-client';
import { Shield, Phone, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { getGuardianSettings, setGuardianSettings } from '@/lib/guardianMode';
import { LEGAL_PATHS } from '@/lib/legalContent';
import { PROFILE_LEGAL_CONSENT_KEY, PROFILE_LEGAL_LOCKED_KEY } from '@/lib/legalConsent';
import { getLanguage, t } from '@/lib/locale';

const CRISIS_QUICK = {
  HK: [
    { name: 'The Samaritans HK', nameZh: '撒瑪利亞防止自殺會', phone: '23892222' },
    { name: 'Suicide Prevention HK', nameZh: '生命熱線', phone: '23820000' },
  ],
  TW: [
    { name: 'Mental Health Hotline', nameZh: '安心專線', phone: '1925' },
    { name: 'Lifeline', nameZh: '生命線', phone: '1995' },
  ],
  GB: [
    { name: 'Samaritans', phone: '116123' },
    { name: 'NHS Crisis', phone: '111' },
  ],
};

function genUserId() {
  let id = localStorage.getItem('mindlab_user_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('mindlab_user_id', id);
  }
  return id;
}

export default function ConsentGate({ region = 'HK', lang, onComplete }) {
  const activeLang = lang || getLanguage();
  const isEnglish = activeLang === 'en';
  const [step, setStep] = useState(0);
  const [acceptLiability, setAcceptLiability] = useState(false);
  const [acceptDerivative, setAcceptDerivative] = useState(false);
  const [isMinor, setIsMinor] = useState(() => getGuardianSettings().isMinor);
  const [guardianConsented, setGuardianConsented] = useState(() => getGuardianSettings().guardianConsented);
  const [saving, setSaving] = useState(false);

  const STEPS = [
    t('consentStepLabel1', activeLang),
    t('consentStepLabel2', activeLang),
    t('consentStepLabel3', activeLang),
    t('consentStepLabel4', activeLang),
  ];

  const crisisLines = CRISIS_QUICK[region] || CRISIS_QUICK.HK;

  function lineDisplayName(line) {
    if (isEnglish) return line.name || line.nameZh;
    return line.nameZh || line.name;
  }

  async function finish() {
    setSaving(true);
    const userId = genUserId();
    try {
      const existing = await db.userProfile.get({ user_id: userId }).catch(() => []);
      if (!existing || existing.length === 0) {
        setGuardianSettings({ isMinor, guardianConsented });
        await db.userProfile.create({
          user_id: userId,
          region: region.toLowerCase(),
          consent_completed: true,
          personal_liability_acknowledged: acceptLiability,
          derivative_data_consented: acceptDerivative,
          is_minor: isMinor,
          guardian_consented: guardianConsented,
          free_trial_used: 0,
          free_trial_limit: 20,
        });
      } else {
        setGuardianSettings({ isMinor, guardianConsented });
        await db.userProfile.update(existing[0].id, {
          consent_completed: true,
          personal_liability_acknowledged: acceptLiability,
          derivative_data_consented: acceptDerivative,
          is_minor: isMinor,
          guardian_consented: guardianConsented,
        });
      }
      await db.consent.create({
        user_id: userId,
        consent_type: 'non_medical',
        granted: true,
      });
      await db.consent.create({
        user_id: userId,
        consent_type: 'personal_liability',
        granted: acceptLiability,
      });
      await db.consent.create({
        user_id: userId,
        consent_type: 'derivative_data',
        granted: acceptDerivative,
      });
      localStorage.setItem('mindlab_consent_done', 'true');
      localStorage.setItem(PROFILE_LEGAL_CONSENT_KEY, 'true');
      localStorage.setItem(PROFILE_LEGAL_LOCKED_KEY, 'true');
      window.dispatchEvent(new Event('mindlab-onboarding-changed'));
      onComplete();
    } catch {
      localStorage.setItem('mindlab_consent_done', 'true');
      localStorage.setItem(PROFILE_LEGAL_CONSENT_KEY, 'true');
      localStorage.setItem(PROFILE_LEGAL_LOCKED_KEY, 'true');
      window.dispatchEvent(new Event('mindlab-onboarding-changed'));
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  function renderBody() {
    if (step === 0) {
      return (
        <>
          <motion.div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5">
            <Shield className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">{t('consentStep1Heading', activeLang)}</h2>
          <p className="text-sm text-foreground font-medium mb-3">{t('consentStep1Lead', activeLang)}</p>
          <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep1Bullet1', activeLang)}
            </li>
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep1Bullet2', activeLang)}
            </li>
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep1Bullet3', activeLang)}
            </li>
          </ul>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <motion.div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-accent" />
          </motion.div>
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">{t('consentStep2Heading', activeLang)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {t('consentStep2Lead', activeLang)}
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed mb-6">
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep2Bullet1', activeLang)}
            </li>
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep2Bullet2', activeLang)}
            </li>
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">•</span>{t('consentStep2Bullet3', activeLang)}
            </li>
          </ul>
          <label className="flex items-start gap-3 cursor-pointer bg-card border border-border rounded-xl p-4">
            <input
              type="checkbox"
              checked={acceptLiability}
              onChange={(e) => setAcceptLiability(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground leading-relaxed">{t('consentStep2Accept', activeLang)}</span>
          </label>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <motion.div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-5">
            <Phone className="w-7 h-7 text-destructive" />
          </motion.div>
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-2">{t('consentStep3Heading', activeLang)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {t('consentStep3Lead', activeLang)}
          </p>
          <motion.div className="space-y-3 mb-5">
            {crisisLines.map((line, i) => (
              <a
                key={i}
                href={`tel:${line.phone}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/40 transition-all"
              >
                <span className="text-sm font-medium text-foreground">{lineDisplayName(line)}</span>
                <span className="text-sm font-bold text-primary">{line.phone}</span>
              </a>
            ))}
          </motion.div>
          <motion.div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t('consentStep3EmergencyPrefix', activeLang)}
              {isEnglish ? ' HK ' : '香港 '}
              <a href="tel:999" className="font-bold text-foreground">999</a>
              {isEnglish ? ' · TW ' : ' · 台灣 '}
              <a href="tel:110" className="font-bold text-foreground">110</a>
              {isEnglish ? ' · UK ' : ' · 英國 '}
              <a href="tel:999" className="font-bold text-foreground">999</a>
            </p>
          </motion.div>
        </>
      );
    }
    return (
      <>
        <motion.div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5">
          <Check className="w-7 h-7 text-primary" />
        </motion.div>
        <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">{t('consentStep4Heading', activeLang)}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t('consentStep4Lead', activeLang)}</p>
        <label className="flex items-start gap-3 cursor-pointer bg-card border border-border rounded-xl p-4 mb-4">
          <input
            type="checkbox"
            checked={acceptDerivative}
            onChange={(e) => setAcceptDerivative(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-primary flex-shrink-0"
          />
          <motion.div>
            <p className="text-sm font-medium text-foreground mb-1">{t('consentStep4DerivativeTitle', activeLang)}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('consentStep4DerivativeBody', activeLang)}
            </p>
          </motion.div>
        </label>
        <p className="text-xs text-muted-foreground text-center mb-4">{t('consentStep4Optional', activeLang)}</p>
        <label className="flex items-start gap-3 cursor-pointer bg-card border border-border rounded-xl p-4 mb-3">
          <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} className="mt-0.5 w-5 h-5 accent-primary" />
          <span className="text-sm text-foreground">{t('consentStep4Minor', activeLang)}</span>
        </label>
        {isMinor && (
          <label className="flex items-start gap-3 cursor-pointer bg-card border border-amber-500/30 rounded-xl p-4">
            <input
              type="checkbox"
              checked={guardianConsented}
              onChange={(e) => setGuardianConsented(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary"
            />
            <span className="text-sm text-foreground leading-relaxed">
              {t('consentStep4Guardian', activeLang)}
            </span>
          </label>
        )}
      </>
    );
  }

  function renderFooterButton() {
    if (step === 0) {
      return (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          {t('consentNext', activeLang)} <ChevronRight className="w-4 h-4" />
        </button>
      );
    }
    if (step === 1) {
      return (
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!acceptLiability}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {t('consentNext', activeLang)} <ChevronRight className="w-4 h-4" />
        </button>
      );
    }
    if (step === 2) {
      return (
        <button
          type="button"
          onClick={() => setStep(3)}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          {t('consentNext', activeLang)} <ChevronRight className="w-4 h-4" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={finish}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-sm disabled:opacity-60"
      >
        {saving ? t('consentSavingBtn', activeLang) : t('consentFinish', activeLang)}
      </button>
    );
  }

  return (
    <motion.div className="fixed inset-0 z-[100] h-[100dvh] bg-background flex flex-col max-w-md mx-auto left-0 right-0 mx-auto">
      <motion.div className="px-5 pt-10 pb-4 flex-shrink-0">
        <motion.div className="flex gap-1.5 mb-1">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </motion.div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {step + 1} / {STEPS.length} — {STEPS[step]}
        </p>
      </motion.div>

      <motion.div className="flex-1 min-h-0 overflow-y-auto px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {renderBody()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="flex justify-center gap-4 mb-3">
          <Link to={LEGAL_PATHS.privacy} className="text-[11px] text-primary underline underline-offset-2">
            {t('privacyPolicy', activeLang)}
          </Link>
          <Link to={LEGAL_PATHS.terms} className="text-[11px] text-primary underline underline-offset-2">
            {t('termsOfUse', activeLang)}
          </Link>
        </div>
        {renderFooterButton()}
      </motion.div>
    </motion.div>
  );
}
