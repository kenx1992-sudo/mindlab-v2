'use client';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, Shield, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';

export default function Home() {
  const { lang } = useMindlabLocale();

  const steps = [
    { n: '1', title: t('homeStep1Title', lang), desc: t('homeStep1Desc', lang) },
    { n: '2', title: t('homeStep2Title', lang), desc: t('homeStep2Desc', lang) },
    { n: '3', title: t('homeStep3Title', lang), desc: t('homeStep3Desc', lang) },
  ];

  const promises = [
    { icon: Heart, title: t('homePromiseChatTitle', lang), desc: t('homePromiseChatDesc', lang) },
    { icon: Shield, title: t('homePromiseSafeTitle', lang), desc: t('homePromiseSafeDesc', lang) },
  ];

  return (
    <div className="min-h-screen pb-4">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="calm-hero px-6 pt-14 pb-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 right-6 w-32 h-32 rounded-full bg-[hsl(38_70%_55%/0.12)] blur-3xl" />
          <div className="absolute bottom-4 left-0 w-48 h-48 rounded-full bg-[hsl(158_35%_35%/0.15)] blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-1.5 text-accent/90 text-xs font-medium mb-4 px-3 py-1 rounded-full border border-accent/25 bg-accent/10">
            {t('homeBrandRow', lang)}
          </div>
          <h1 className="font-playfair text-[1.75rem] font-semibold text-foreground leading-snug mb-3">
            {t('homeHeroLine1', lang)}
            <br />
            <span className="text-accent italic">{t('homeHeroLine2', lang)}</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[28ch]">
            {t('homeHeroSub', lang)}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/sessions"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-3.5 rounded-2xl calm-glow-ring hover:opacity-95 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" />
              {t('homeCtaPrimary', lang)}
            </Link>
            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-2 border border-border/80 text-foreground/90 font-medium text-sm px-5 py-3 rounded-2xl bg-card/40 hover:bg-card/70 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              {t('homeCtaSecondary', lang)}
            </Link>
          </div>
        </motion.div>
      </motion.section>

      <section className="px-6 py-8">
        <h2 className="font-playfair text-lg font-semibold text-foreground mb-4">{t('homeStepsTitle', lang)}</h2>
        <div className="space-y-3">
          {steps.map(({ n, title, desc }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="calm-card rounded-2xl p-4 flex gap-4"
            >
              <span className="w-8 h-8 rounded-xl bg-accent/15 text-accent text-sm font-bold flex items-center justify-center flex-shrink-0">
                {n}
              </span>
              <div>
                <p className="font-medium text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {promises.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="calm-card rounded-2xl p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-xs text-foreground">{title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-4">
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-5 text-center">
          <p className="font-playfair text-sm font-semibold text-foreground/90 mb-1">{t('homeHumanTitle', lang)}</p>
          <p className="text-muted-foreground text-xs leading-relaxed mb-3">
            {t('homeHumanDesc', lang)}
          </p>
          <Link to="/help" className="text-xs text-accent underline underline-offset-2">
            {t('homeHumanLink', lang)}
          </Link>
        </div>
      </section>
    </div>
  );
}
