'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, AlertCircle, Loader2, Zap } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { isPlusActive, setPlusActive } from '@/lib/skinAccess';
import { startSubscriptionCheckout, verifySubscriptionCheckout } from '@/lib/stripeBilling';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';

function buildPlans(lang) {
  return [
    {
      id: 'free',
      name: lang === 'en' ? 'Trial' : '體驗',
      priceLabel: lang === 'en' ? 'Free' : '免費',
      period: '',
      icon: Sparkles,
      color: 'border-border',
      badgeColor: 'bg-secondary text-secondary-foreground',
      features:
        lang === 'en'
          ? ['20 free messages', 'Crisis resources', 'Basic privacy protection']
          : lang === 'zh-TW'
            ? ['20 則陪伴對話', '危機支援資源', '基本隱私保護']
            : ['20 條陪伴對話', '危機熱線資源', '基本私隱保護'],
      popular: false,
      purchasable: false,
    },
    {
      id: 'companion_monthly',
      name: lang === 'en' ? 'Plus' : '陪伴 Plus',
      priceLabel: 'HK$88',
      period: lang === 'en' ? '/ mo' : '/ 月',
      icon: Crown,
      color: 'border-primary',
      badgeColor: 'bg-primary text-primary-foreground',
      features:
        lang === 'en'
          ? ['3,000 messages / month', 'All skins', 'Priority responses', '3-region language support']
          : lang === 'zh-TW'
            ? ['每月 3,000 則陪伴對話', '全部外觀 Skin', '優先回應', '三地語言支援']
            : ['每月 3,000 條陪伴對話', '全部外觀 Skin', '優先回應', '三地語言支援'],
      popular: true,
      purchasable: true,
    },
    {
      id: 'unlimited_combined',
      name: lang === 'en' ? 'Unlimited' : '陪伴無限',
      icon: Zap,
      color: 'border-accent/60',
      badgeColor: 'bg-accent/20 text-accent-foreground',
      features:
        lang === 'en'
          ? ['Unlimited messages', 'All skins', 'Top priority responses', '3-region language support', 'Advanced mood insights']
          : lang === 'zh-TW'
            ? ['無限陪伴對話', '全部外觀 Skin', '最優先回應', '三地語言支援', '進階情緒洞察報告']
            : ['無限陪伴對話', '全部外觀 Skin', '最優先回應', '三地語言支援', '進階情緒洞察報告'],
      popular: false,
      purchasable: true,
      combined: true,
      monthly: { id: 'unlimited_monthly', priceLabel: 'HK$188', period: lang === 'en' ? '/ mo' : '/ 月' },
      yearly: { id: 'unlimited_yearly', priceLabel: 'HK$1,888', period: lang === 'en' ? '/ yr' : '/ 年', saving: lang === 'en' ? 'Save HK$368' : '慳 HK$368' },
    },
  ];
}

export default function Subscription() {
  const { lang } = useMindlabLocale();
  const [loading, setLoading] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [unlimitedYearly, setUnlimitedYearly] = useState(true);
  const sessionId = searchParams.get('session_id');
  const legacySuccess = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');
  const plusActive = isPlusActive();
  const plans = buildPlans(lang);

  useEffect(() => {
    if (!sessionId) {
      if (legacySuccess) {
        setPlusActive(true);
        setVerified({ legacy: true });
      }
      return;
    }

    let cancelledEffect = false;
    (async () => {
      setVerifying(true);
      setError(null);
      try {
        const data = await verifySubscriptionCheckout(sessionId);
        if (!cancelledEffect) {
          setVerified(data);
          setSearchParams({}, { replace: true });
        }
      } catch (e) {
        if (!cancelledEffect) {
          setError(e instanceof Error ? e.message : (lang === 'en' ? 'Payment verification failed.' : '付款驗證失敗'));
        }
      } finally {
        if (!cancelledEffect) setVerifying(false);
      }
    })();

    return () => { cancelledEffect = true; };
  }, [sessionId, legacySuccess, setSearchParams]);

  const handleSubscribe = async (plan) => {
    setError(null);
    if (!plan.purchasable) return;

    if (window.self !== window.top) {
      window.top.location.href = window.location.href;
      return;
    }

    setLoading(plan.id);
    try {
      const data = await startSubscriptionCheckout(plan.id);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error || (lang === 'en' ? 'Could not start checkout.' : '無法建立付款連結。'));
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === 'en' ? 'Payment request failed.' : '付款請求失敗'));
    } finally {
      setLoading(null);
    }
  };

  const showSuccess = verified || (legacySuccess && plusActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-10 pb-8"
    >
      {verifying && (
        <div className="calm-card rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          {t('payVerifying', lang)}
        </div>
      )}

      {showSuccess && !verifying && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="calm-card calm-alert-success rounded-2xl p-4 mb-6 flex items-start gap-3"
        >
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="calm-alert-title text-sm">{t('paySubscribed', lang)}</p>
            <p className="calm-alert-body text-xs mt-0.5">
              {t('paySubscribedBody', lang)}
              {verified?.plan_id ? `（${verified.plan_id}）` : ''}
            </p>
          </div>
        </motion.div>
      )}

      {cancelled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="calm-card calm-alert-warn rounded-2xl p-4 mb-6 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="calm-alert-title text-sm">{t('payCancelledTitle', lang)}</p>
            <p className="calm-alert-body text-xs mt-0.5">{t('payCancelledBody', lang)}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-2">{t('subTitle', lang)}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t('subSub', lang)}
          <br />
          <span className="text-xs">{t('subDisclaimer', lang)}</span>
        </p>
        {plusActive && (
          <p className="text-xs text-accent mt-2 font-medium">{t('subPlusActive', lang)}</p>
        )}
        <Link to="/sessions" className="inline-block mt-3 text-primary text-sm font-medium underline underline-offset-2">
          {t('subBackToChat', lang)}
        </Link>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm p-3"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => {
          const Icon = plan.icon;

          if (plan.combined) {
            const activeSub = unlimitedYearly ? plan.yearly : plan.monthly;
            const activePlanId = activeSub.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`calm-card rounded-2xl border-2 ${plan.color} p-5 relative overflow-hidden`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.badgeColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-playfair font-bold text-foreground text-lg leading-tight">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-bold text-primary">{activeSub.priceLabel}</span>
                      <span className="text-muted-foreground text-xs">{activeSub.period}</span>
                      {unlimitedYearly && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{plan.yearly.saving}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monthly / Yearly toggle */}
                <div className="flex items-center gap-2 mb-4 p-1 bg-muted/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUnlimitedYearly(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${!unlimitedYearly ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                  >
                    {lang === 'en' ? 'Monthly' : '月付'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlimitedYearly(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${unlimitedYearly ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                  >
                    {lang === 'en' ? 'Yearly' : '年付'}
                  </button>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                      <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSubscribe({ id: activePlanId, purchasable: true })}
                  disabled={loading === activePlanId || verifying}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 disabled:opacity-60"
                >
                  {loading === activePlanId ? t('payCtaCreating', lang) : plusActive ? t('payCtaManage', lang) : t('payCtaSubscribe', lang)}
                </button>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`calm-card rounded-2xl border-2 ${plan.color} p-5 relative overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {t('popularBadge', lang)}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.badgeColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-foreground text-lg leading-tight">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold text-primary">{plan.priceLabel}</span>
                    {plan.period && <span className="text-muted-foreground text-xs">{plan.period}</span>}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.purchasable ? (
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id || verifying}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
                  } disabled:opacity-60`}
                >
                  {loading === plan.id
                    ? t('payCtaCreating', lang)
                    : plusActive
                      ? t('payCtaManage', lang)
                      : t('payCtaSubscribe', lang)}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl text-sm font-medium text-center bg-muted text-muted-foreground">
                  {t('payDefaultPlanLabel', lang)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
        {t('payFooter', lang)}
      </p>
    </motion.div>
  );
}