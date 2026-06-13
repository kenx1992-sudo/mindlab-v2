'use client';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Phone } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t, normalizeLanguage } from '@/lib/locale';
import { CRISIS_LINES, crisisLineLabel, crisisLineNote, getRegionTabs } from '@/lib/crisisResources';
import { HELP_FAQS, EMERGENCY_FOOTER } from '@/lib/helpContent';
import { LEGAL_PATHS } from '@/lib/legalContent';

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/80 rounded-2xl overflow-hidden calm-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-foreground pr-3">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  const { lang, region, setRegion } = useMindlabLocale();
  const safeLang = normalizeLanguage(lang);
  const [activeRegion, setActiveRegion] = useState(region);
  const faqs = HELP_FAQS[safeLang] || HELP_FAQS['zh-HK'];
  const emergency = EMERGENCY_FOOTER[safeLang] || EMERGENCY_FOOTER['zh-HK'];

  useEffect(() => {
    setActiveRegion(region);
  }, [region]);

  function pickRegion(v) {
    setActiveRegion(v);
    setRegion(v);
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <h1 className="font-playfair text-2xl font-bold text-foreground mb-1">{t('helpTitle', lang)}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t('helpSubtitle', lang)}</p>

      <h2 className="font-playfair text-lg font-semibold text-foreground mb-3">{t('helpFaq', lang)}</h2>
      <div className="space-y-2 mb-10">
        {faqs.map((item, i) => (
          <FaqItem key={i} {...item} />
        ))}
      </div>

      <h2 className="font-playfair text-lg font-semibold text-foreground mb-3">{t('helpCrisis', lang)}</h2>
      <p className="text-[10px] text-muted-foreground mb-3">
        {t('helpRegionNote', lang)}
      </p>
      <div className="flex gap-2 mb-4">
        {getRegionTabs(safeLang).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => pickRegion(v)}
            className={`flex-1 text-xs py-2 rounded-xl border font-medium transition-all ${
              activeRegion === v
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-8">
        {(CRISIS_LINES[activeRegion] || CRISIS_LINES.HK).map((line, i) => (
          <motion.div key={i} className="calm-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{crisisLineLabel(line, safeLang)}</p>
              {line.note && <p className="text-xs text-muted-foreground">{crisisLineNote(line, safeLang)}</p>}
            </div>
            {line.phone ? (
              <a href={`tel:${line.phone}`} className="text-sm font-bold text-primary active:opacity-70">
                {line.display}
              </a>
            ) : (
              <span className="text-xs font-semibold text-primary text-right">{line.display}</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-destructive/5 border border-destructive/20 px-4 py-4 text-center mb-8">
        <p className="text-xs text-destructive font-medium mb-1">{emergency.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{emergency.text}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-2 border-t border-border">
        <Link to={LEGAL_PATHS.privacy} className="text-xs text-primary underline underline-offset-2">
          {t('privacyPolicy', lang)}
        </Link>
        <Link to={LEGAL_PATHS.terms} className="text-xs text-primary underline underline-offset-2">
          {t('termsOfUse', lang)}
        </Link>
      </div>
    </div>
  );
}