'use client';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t, normalizeLanguage } from '@/lib/locale';
import { getLegalDoc, LEGAL_PATHS } from '@/lib/legalContent';

export default function Legal() {
  const { doc } = useParams();
  const { lang } = useMindlabLocale();
  const safeLang = normalizeLanguage(lang);

  if (doc !== 'privacy' && doc !== 'terms') {
    return <Navigate to={LEGAL_PATHS.privacy} replace />;
  }

  const content = getLegalDoc(doc, safeLang);
  if (!content) return null;

  const otherPath = doc === 'privacy' ? LEGAL_PATHS.terms : LEGAL_PATHS.privacy;
  const otherLabel = doc === 'privacy' ? t('termsOfUse', lang) : t('privacyPolicy', lang);

  return (
    <div className="px-5 pt-10 pb-12 max-w-md mx-auto">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-6 hover:text-foreground"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t('legalBack', lang)}
      </Link>

      <h1 className="font-playfair text-2xl font-bold text-foreground mb-1">{content.title}</h1>
      <p className="text-[10px] text-muted-foreground mb-6">
        {t('legalUpdated', lang)} {content.updated}
      </p>

      <p className="text-sm text-muted-foreground leading-relaxed mb-8">{content.intro}</p>

      <div className="space-y-6">
        {content.sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-sm font-semibold text-foreground mb-2">{section.h}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{section.p}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4">
        <Link to={otherPath} className="text-xs text-primary underline underline-offset-2">
          {otherLabel}
        </Link>
        <Link to="/help" className="text-xs text-primary underline underline-offset-2">
          {t('helpTitle', lang)}
        </Link>
      </div>
    </div>
  );
}
