'use client';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, functions } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { User, Mail, Globe, Bell, HelpCircle, LogOut, ChevronRight, Shield, FileText, CreditCard, Palette, Heart } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';
import { LEGAL_PATHS } from '@/lib/legalContent';
import {
  isProfileLegalConsentChecked,
  isProfileLegalConsentLocked,
  lockProfileLegalConsent,
} from '@/lib/legalConsent';
import { pushUserSync, pullUserSync, linkAuthUser } from '@/lib/userSync';

export default function Profile() {
  const [user, setUser] = useState(null);
  const { lang, region, setLanguage, setRegion, langOptions, regionOptions } = useMindlabLocale();
  const [consent, setConsent] = useState(() => isProfileLegalConsentChecked());
  const [consentLocked, setConsentLocked] = useState(() => isProfileLegalConsentLocked());
  const [consentSaving, setConsentSaving] = useState(false);

  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    useAuth().user.then((u) => { setUser(u); linkAuthUser(); pullUserSync(); }).catch(() => {});
    setConsent(isProfileLegalConsentChecked());
    setConsentLocked(isProfileLegalConsentLocked());
  }, []);

  async function handleSync() {
    await pushUserSync();
    setSyncMsg(t('syncDone', lang));
    setTimeout(() => setSyncMsg(''), 2500);
  }

  function handleRegion(v) {
    setRegion(v);
    sessionStorage.removeItem('mindlab_chat_session_id');
  }
  function handleLang(v) {
    setLanguage(v);
    sessionStorage.removeItem('mindlab_chat_session_id');
  }
  async function handleConsent(checked) {
    if (consentLocked || !checked) return;
    setConsentSaving(true);
    const result = await lockProfileLegalConsent();
    setConsent(true);
    setConsentLocked(true);
    setConsentSaving(false);
    if (result?.ok) {
      await pushUserSync().catch(() => {});
    }
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <h1 className="font-playfair text-2xl font-bold text-foreground mb-6">{t('profileTitle', lang)}</h1>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="calm-hero rounded-2xl p-5 mb-6 text-foreground border border-border/50"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="font-playfair font-bold text-lg">{user?.full_name || t('profileGuest', lang)}</p>
              <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3" />
                {user?.email || t('profileNotLogged', lang)}
              </p>
            </div>
          </div>
          {!user && (
            <button
              onClick={() => window.location.href = "/login"}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition-opacity"
            >
              {t('login', lang)}
            </button>
          )}
        </div>
      </motion.div>

      {/* Region */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm text-foreground">{t('regionLabel', lang)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {regionOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleRegion(value)}
              className={`text-xs py-2.5 rounded-xl border font-medium transition-all ${
                region === value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-1">{t('regionHint', lang)}</p>
      </section>

      {/* Language */}
      <section className="mb-6">
        <p className="font-semibold text-sm text-foreground mb-3">{t('languageLabel', lang)}</p>
        <div className="space-y-2">
          {langOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleLang(value)}
              className={`w-full text-left text-sm py-3 px-4 rounded-xl border font-medium transition-all flex items-center justify-between ${
                lang === value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              {label}
              {lang === value && <span className="text-xs opacity-70">✓</span>}
            </button>
            ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-1">{t('langHint', lang)}</p>
      </section>

      {/* Privacy consent */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm text-foreground">{t('privacyAndConsent', lang)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label
            className={`flex items-start gap-3 ${consentLocked ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={consent}
              disabled={consentLocked || consentSaving}
              onChange={(e) => handleConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0 disabled:opacity-70"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              {t('privacyConsentLabel', lang)}
              {consentSaving && (
                <span className="block text-[10px] text-primary mt-1">{t('consentSaving', lang)}</span>
              )}
              {consentLocked && !consentSaving && (
                <span className="block text-[10px] text-primary/80 mt-1">{t('consentLockedNote', lang)}</span>
              )}
            </span>
          </label>
          <div className="flex gap-3 pt-1">
            <Link to={LEGAL_PATHS.privacy} className="text-xs text-primary underline underline-offset-2">
              {t('privacyPolicy', lang)}
            </Link>
            <Link to={LEGAL_PATHS.terms} className="text-xs text-primary underline underline-offset-2">
              {t('termsOfUse', lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Links */}
      <div className="space-y-2 mb-6">
        {[
          { icon: Palette, label: t('navSkinStore', lang), desc: t('navSkinDesc', lang), to: '/themes' },
          { icon: CreditCard, label: t('navMembership', lang), desc: t('navMembershipDesc', lang), to: '/subscription' },
          { icon: Bell, label: t('notifications', lang), desc: t('reminderDesc', lang), to: '/notifications' },
          { icon: Heart, label: t('moodJournal', lang), desc: t('moodJournalDesc', lang), to: '/mood-journal' },
          { icon: Shield, label: t('guardianPageTitle', lang), desc: t('guardianPageDesc', lang), to: '/guardian' },
          { icon: HelpCircle, label: t('navHelpCenter', lang), desc: t('navHelpCenterDesc', lang), to: '/help' },
          { icon: FileText, label: t('navRecordsLink', lang), desc: t('navRecordsLinkDesc', lang), to: '/records' },
        ].map(({ icon: Icon, label, desc, to }) => {
          const inner = (
            <div className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          );
          return to ? (
            <Link key={label} to={to} className="flex items-center bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-primary/30 transition-all">
              {inner}
            </Link>
          ) : (
            <button key={label} className="w-full flex items-center bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-primary/30 transition-all">
              {inner}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={handleSync} className="w-full mb-4 py-3 rounded-2xl border border-primary/40 text-primary text-sm font-medium">
        {t('syncNow', lang)}
      </button>
      {syncMsg && <p className="text-xs text-accent text-center mb-4">{syncMsg}</p>}

      {user ? (
        <button
          onClick={() => useAuth().logout()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> {t('logout', lang)}
        </button>
      ) : (
        <button
          onClick={() => window.location.href = "/login"}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition-opacity calm-glow-ring"
        >
          <LogOut className="w-4 h-4 rotate-180" /> {t('login', lang)}
        </button>
      )}
    </div>
  );
}