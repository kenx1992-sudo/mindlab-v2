'use client';
import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Palette, ArrowLeft, Lock, Crown, Sparkles, Loader2 } from 'lucide-react';
import { db, functions } from '@/lib/api-client';
import { tryApplyTheme } from '@/lib/applyTheme';
import {
  DEFAULT_THEME_ID,
  FREE_SKIN_IDS,
  PREMIUM_SKIN_IDS,
  SKIN_BUNDLE_ID,
  SKIN_BUNDLE_PRICE_HKD,
  THEMES,
  getStoredThemeId,
} from '@/lib/themes';
import {
  getLocalUnlockedSkins,
  isPlusActive,
  unlockSkinLocally,
  canUseSkin,
} from '@/lib/skinAccess';
import { pullUserSync } from '@/lib/userSync';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';

function genUserId() {
  let id = localStorage.getItem('mindlab_user_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('mindlab_user_id', id);
  }
  return id;
}

function SwatchStrip({ swatch }) {
  const { lang } = useMindlabLocale();
  return (
    <div className="flex gap-1.5 mt-3">
      {[
        { c: swatch.bg, label: t('themesSwatchBg', lang) },
        { c: swatch.primary, label: t('themesSwatchPrimary', lang) },
        { c: swatch.accent, label: t('themesSwatchAccent', lang) },
      ].map(({ c, label }) => (
        <div key={label} className="flex-1">
          <div className="h-8 rounded-lg border border-border/60" style={{ background: c }} />
          <p className="text-[9px] text-muted-foreground mt-1 text-center">{label}</p>
        </div>
      ))}
    </div>
  );
}

function MiniChat({ primary, mode, swatch }) {
  const isDark = mode === 'dark';
  const userBg = isDark ? `${primary}44` : `${primary}22`;
  const assistantBg = isDark ? 'hsl(0 0% 100% / 0.1)' : 'white';
  const textColor = isDark ? 'hsl(210 25% 93%)' : '#333';
  const { lang } = useMindlabLocale();
  const assistantText = t('chatPreviewAssistantSlow', lang);
  const userText = t('chatPreviewUserTired', lang);
  return (
    <div
      className={`mt-3 rounded-xl border p-2.5 space-y-1.5 ${isDark ? '' : 'border-border/50 bg-muted/30'}`}
      style={isDark ? { background: swatch.bg, borderColor: 'hsl(0 0% 100% / 0.12)' } : undefined}
    >
      <div
        className="text-[10px] px-2.5 py-1.5 rounded-xl rounded-bl-sm max-w-[85%] border"
        style={{
          background: assistantBg,
          color: textColor,
          borderColor: isDark ? 'hsl(0 0% 100% / 0.1)' : undefined,
        }}
      >
        {assistantText}
      </div>
      <div
        className="text-[10px] px-2.5 py-1.5 rounded-xl rounded-br-sm max-w-[85%] ml-auto"
        style={{ background: userBg, border: `1px solid ${primary}66`, color: textColor }}
      >
        {userText}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  index,
  selected,
  unlocked,
  plus,
  onSelect,
  onPurchase,
  purchasing,
}) {
  const { lang } = useMindlabLocale();
  const locked = theme.tier === 'premium' && !canUseSkin(theme.id, { plusActive: plus, unlocked });
  const isDefault = theme.id === DEFAULT_THEME_ID;
  const tagline = lang === 'en' ? (theme.taglineEn || theme.tagline) : theme.tagline;
  const tierLabel = theme.tier === 'free' ? t('themesTierFree', lang) : t('themesTierPaid', lang);
  const modeLabel = theme.mode === 'dark' ? t('themesModeDark', lang) : t('themesModeLight', lang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`calm-card rounded-2xl p-4 ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground font-mono">
            {index + 1} · {tierLabel}
          </p>
          <p className="font-playfair font-semibold text-foreground text-lg">{lang === 'en' ? theme.name : theme.nameZh}</p>
          <p className="text-xs text-muted-foreground">
            {theme.name} · {modeLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isDefault && (
            <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">{t('themesDefaultBadge', lang)}</span>
          )}
          {selected && (
            <span className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" /> {t('themesInUse', lang)}
            </span>
          )}
          {locked && (
            <span className="flex items-center gap-1 text-[10px] text-foreground/70">
              <Lock className="w-3 h-3" /> {t('themesLocked', lang)}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{tagline}</p>
      <SwatchStrip swatch={theme.swatch} />
      <MiniChat primary={theme.swatch.primary} mode={theme.mode} swatch={theme.swatch} />

      <div className="mt-4 flex gap-2">
        {!locked ? (
          <button
            type="button"
            onClick={() => onSelect(theme.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground"
          >
            {t('themesApply', lang)}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={purchasing === theme.id}
              onClick={() => onPurchase(theme.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {purchasing === theme.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('themesUnlockPrice', lang, theme.priceHkd)}
            </button>
            <Link
              to="/subscription"
              className="px-3 py-2.5 rounded-xl text-xs font-medium border border-border/80 text-muted-foreground hover:text-foreground flex items-center gap-1"
              title={t('themesPlusTip', lang)}
            >
              <Crown className="w-3.5 h-3.5" />
              Plus
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function ThemePicker() {
  const { lang } = useMindlabLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState(getStoredThemeId());
  const [unlocked, setUnlocked] = useState(getLocalUnlockedSkins);
  const [plus] = useState(isPlusActive);
  const [purchasing, setPurchasing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const persistUnlocks = useCallback(async (skinIds, source, sessionId) => {
    const userId = genUserId();
    unlockSkinLocally(skinIds);
    setUnlocked(getLocalUnlockedSkins());
    for (const skin_id of skinIds) {
      try {
        await db.skinUnlock.create({
          user_id: userId,
          skin_id,
          source,
          stripe_session_id: sessionId || '',
        });
      } catch {
        /* offline / duplicate ok */
      }
    }
  }, []);

  useEffect(() => {
    pullUserSync().catch(() => {});
  }, []);

  useEffect(() => {
    const checkoutId = searchParams.get('skin_checkout');
    if (!checkoutId) return;

    (async () => {
      try {
        const res = await functions.verifySkinPurchase({ sessionId: checkoutId });
        const data = res;
        if (!data?.ok || !data.unlocked_skins?.length) {
          showToast(data?.error || t('themesToastVerifyFailed', lang));
          return;
        }
        const source = data.skin_id === SKIN_BUNDLE_ID ? 'bundle' : 'purchase';
        await persistUnlocks(data.unlocked_skins, source, checkoutId);
        const first = data.unlocked_skins[0];
        const applied = tryApplyTheme(first);
        setActive(applied.theme?.id || first);
        showToast(t('themesToastApplied', lang));
      } catch {
        showToast(t('themesToastVerifyError', lang));
      } finally {
        searchParams.delete('skin_checkout');
        searchParams.delete('skin_cancelled');
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, setSearchParams, persistUnlocks]);

  function handleSelect(id) {
    const result = tryApplyTheme(id);
    if (!result.ok) {
      showToast(t('themesToastNeedUnlock', lang));
      return;
    }
    setActive(result.theme.id);
  }

  async function handlePurchase(skinId) {
    if (window.self !== window.top) {
      showToast(t('themesToastPaidInside', lang));
      return;
    }
    setPurchasing(skinId);
    try {
      const res = await functions.purchaseSkin( {
        skinId,
        userId: genUserId(),
        successUrl: `${window.location.origin}/themes?skin_checkout={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/themes?skin_cancelled=true`,
      });
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      showToast(res?.error || t('themesToastCheckoutFailed', lang));
    } catch {
      showToast(t('themesToastBuyFailed', lang));
    } finally {
      setPurchasing(null);
    }
  }

  const freeThemes = THEMES.filter((t) => FREE_SKIN_IDS.includes(t.id));
  const premiumThemes = THEMES.filter((t) => PREMIUM_SKIN_IDS.includes(t.id));
  const bundleLocked = !plus && PREMIUM_SKIN_IDS.some((id) => !unlocked.includes(id));

  return (
    <div className="px-5 pt-10 pb-10">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-6 hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" /> {t('themesBackToMine', lang)}
      </Link>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-primary/30 bg-primary/10 text-sm text-foreground px-4 py-3"
        >
          {toast}
        </motion.div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <Palette className="w-5 h-5 text-accent" />
        <h1 className="font-playfair text-2xl font-bold text-foreground">{t('themesTitle', lang)}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
        {t('themesIntroDefault', lang)} <strong className="text-foreground">{t('themesIntroNameForestDawn', lang)}</strong>
        {t('themesIntroRest', lang)}
      </p>
      {plus && (
        <p className="text-xs text-accent mb-4 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" /> {t('themesPlusUnlocked', lang)}
        </p>
      )}

      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> {t('themesSectionFree', lang)}
      </h2>
      <div className="space-y-4 mb-8">
        {freeThemes.map((theme, i) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            index={i}
            selected={active === theme.id}
            unlocked={unlocked}
            plus={plus}
            onSelect={handleSelect}
            onPurchase={handlePurchase}
            purchasing={purchasing}
          />
        ))}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-accent" /> {t('themesSectionPaid', lang)}
      </h2>
      <div className="space-y-4 mb-6">
        {premiumThemes.map((theme, i) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            index={i + freeThemes.length}
            selected={active === theme.id}
            unlocked={unlocked}
            plus={plus}
            onSelect={handleSelect}
            onPurchase={handlePurchase}
            purchasing={purchasing}
          />
        ))}
      </div>

      {bundleLocked && (
        <div className="calm-card rounded-2xl p-4 border border-accent/30">
          <p className="font-playfair font-semibold text-foreground">{t('themesBundleTitle', lang)}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            {t('themesBundleUnlockSavings', lang, premiumThemes.reduce((s, t) => s + t.priceHkd, 0) - SKIN_BUNDLE_PRICE_HKD)}
          </p>
          <button
            type="button"
            disabled={purchasing === SKIN_BUNDLE_ID}
            onClick={() => handlePurchase(SKIN_BUNDLE_ID)}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {purchasing === SKIN_BUNDLE_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('themesBundleUnlockBtn', lang, SKIN_BUNDLE_PRICE_HKD)}
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground mt-8">
        {t('themesPaidFooter', lang)}
      </p>
    </div>
  );
}


