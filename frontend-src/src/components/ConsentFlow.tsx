'use client';
// ===== Mindlab Consent Flow (G-005/G-008) =====
// 知情同意流程 — 含衍生数据独立授权(CR-008)、未成年人监护人同意(G-008)

'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, isMinorByRegion, type RegionCode } from '@/lib/sessionStore';

// ── 步骤定义 ──
interface ConsentStep {
  id: string;
  type: 'info' | 'consent' | 'derivative' | 'minor' | 'complete';
}

const CONSENT_STEPS: ConsentStep[] = [
  { id: 'welcome', type: 'info' },
  { id: 'service_boundary', type: 'info' },
  { id: 'privacy_policy', type: 'consent' },
  { id: 'derivative_data', type: 'derivative' },    // 衍生数据独立授权 (CR-008)
  { id: 'minor_check', type: 'minor' },              // 未成年人检测 (G-008)
  { id: 'complete', type: 'complete' },
];

// ── 各地区知情同意文案 ──
const CONSENT_TEXTS: Record<RegionCode, {
  welcome: { title: string; body: string };
  serviceBoundary: { title: string; body: string };
  privacyTitle: string;
  privacyBody: string;
  privacyConsent: string;
  derivativeTitle: string;
  derivativeBody: string;
  derivativeConsent: string;
  ageQuestion: string;
  guardianTitle: string;
  guardianBody: string;
  guardianConsent: string;
  complete: string;
  next: string;
  back: string;
  agree: string;
}> = {
  hk: {
    welcome: {
      title: '歡迎嚟到 Mindlab 🌿',
      body: '我哋係一個心理陪伴平台，提供7×24小時AI心理陪伴夥伴同持證真人輔導員。喺開始之前，請先了解我哋嘅服務性質同你嘅權利。',
    },
    serviceBoundary: {
      title: '服務性質聲明',
      body: '⚠️ 重要：本服務為心理支持，非醫療診斷或治療。如有心理健康問題，請尋求專業醫療機構幫助。Mindlab嘅AI心理陪伴夥伴唔會做診斷、唔會開處方、唔會畀治療建議。',
    },
    privacyTitle: '私隱政策同意',
    privacyBody: '你嘅對話內容會加密存儲於香港，唔會傳輸至其他地區。你可以隨時喺個人中心一鍵刪除所有數據。根據《個人資料（私隱）條例》，我哋承諾遵守六項保障資料原則。',
    privacyConsent: '我已閱讀並同意《私隱政策》',
    derivativeTitle: '衍生數據授權',
    derivativeBody: '平台會基於你嘅對話內容生成情緒檔案同心理測評結果等衍生數據。呢啲數據會幫助我哋更好咁了解你嘅情緒變化。你可以隨時撤回呢項授權，撤回後衍生數據將喺72小時內刪除或匿名化。',
    derivativeConsent: '我同意生成並使用我嘅衍生數據（可隨時撤回）',
    ageQuestion: '你今年幾歲？',
    guardianTitle: '監護人同意',
    guardianBody: '根據香港法規，16歲以下使用者需要監護人同意先可以使用本服務。請由你嘅監護人閱讀並確認以下內容。',
    guardianConsent: '本人為該未成年人嘅監護人，已閱讀並同意上述條款',
    complete: '一切準備就緒！開始你嘅心靈之旅 🌿',
    next: '繼續',
    back: '返回',
    agree: '同意並繼續',
  },
  tw: {
    welcome: {
      title: '歡迎來到 Mindlab 🌿',
      body: '我們是一個心理陪伴平台，提供7×24小時AI心理陪伴夥伴與持證諮商心理師。在開始之前，請先了解我們的服務性質與您的權利。',
    },
    serviceBoundary: {
      title: '服務性質聲明',
      body: '⚠️ 重要：本服務為心理支持，非醫療診斷或治療。如有心理健康問題，請尋求專業醫療機構幫助。Mindlab的AI心理陪伴夥伴不會做診斷、不會開處方、不會給治療建議。',
    },
    privacyTitle: '隱私政策同意',
    privacyBody: '您的對話內容會加密存儲於臺灣，不會傳輸至其他地區。您可以隨時在個人中心一鍵刪除所有數據。根據《個人資料保護法》，心理健康資料屬特種資料，須經書面同意方可處理。',
    privacyConsent: '我已閱讀並同意《隱私政策》',
    derivativeTitle: '衍生資料授權',
    derivativeBody: '平台會基於您的對話內容生成情緒檔案與心理測評結果等衍生資料。這些資料會幫助我們更好地了解您的情緒變化。您可以隨時撤回此項授權，撤回後衍生資料將於72小時內刪除或匿名化。',
    derivativeConsent: '我同意生成並使用我的衍生資料（可隨時撤回）',
    ageQuestion: '您今年幾歲？',
    guardianTitle: '監護人同意',
    guardianBody: '根據臺灣法規，18歲以下使用者需要監護人同意始可使用本服務。請由您的監護人閱讀並確認以下內容。',
    guardianConsent: '本人為該未成年人之監護人，已閱讀並同意上述條款',
    complete: '一切準備就緒！開始您的心靈之旅 🌿',
    next: '繼續',
    back: '返回',
    agree: '同意並繼續',
  },
  gb: {
    welcome: {
      title: 'Welcome to Mindlab 🌿',
      body: 'We are a mental wellbeing support platform, providing a 24/7 AI mental wellbeing companion and certified wellbeing counsellors. Before we begin, please understand our service nature and your rights.',
    },
    serviceBoundary: {
      title: 'Service Nature Statement',
      body: '⚠️ Important: This is a mental wellbeing support service, not medical treatment. If you need medical help, please contact a healthcare professional. Mindlab\'s AI mental wellbeing companion will not diagnose, prescribe, or give treatment advice.',
    },
    privacyTitle: 'Privacy Policy Consent',
    privacyBody: 'Your conversation content is encrypted and stored in the United Kingdom. It will not be transferred to other regions. You can delete all your data at any time via your profile. Under UK GDPR, your mental health data is classified as special category data and requires explicit consent.',
    privacyConsent: 'I have read and agree to the Privacy Policy',
    derivativeTitle: 'Derivative Data Authorisation',
    derivativeBody: 'The platform will generate derivative data such as emotional profiles and assessment results based on your conversations. This data helps us better understand your emotional trends. You can withdraw this authorisation at any time — derivative data will be deleted or anonymised within 72 hours of withdrawal.',
    derivativeConsent: 'I consent to the generation and use of my derivative data (withdrawable at any time)',
    ageQuestion: 'How old are you?',
    guardianTitle: 'Parental Consent',
    guardianBody: 'Under UK law, users under 13 require parental consent to use this service. Please have your parent or guardian read and confirm the following.',
    guardianConsent: 'I am the parent/guardian of this minor and have read and agree to the above terms',
    complete: 'You\'re all set! Begin your wellbeing journey 🌿',
    next: 'Continue',
    back: 'Back',
    agree: 'Agree and continue',
  },
};

// ── 知情同意主流程 ──
export default function ConsentFlow() {
  const region = useSessionStore((s) => s.region);
  const dispatch = useSessionStore((s) => s.dispatch);
  const texts = CONSENT_TEXTS[region];

  const [currentStep, setCurrentStep] = useState(0);
  const [privacyConsented, setPrivacyConsented] = useState(false);
  const [derivativeConsented, setDerivativeConsented] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [guardianConsented, setGuardianConsented] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const step = CONSENT_STEPS[currentStep];
  const isMinor = userAge !== null && isMinorByRegion(userAge, region);

  const goNext = useCallback(() => {
    setDirection(1);
    if (currentStep < CONSENT_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    dispatch({
      type: 'COMPLETE_CONSENT',
      derivativeConsented,
    });
    if (isMinor && guardianConsented) {
      dispatch({ type: 'SET_MINOR', isMinor: true });
      dispatch({ type: 'GUARDIAN_CONSENT' });
    } else {
      dispatch({ type: 'SET_MINOR', isMinor: false });
    }
  }, [dispatch, derivativeConsented, isMinor, guardianConsented]);

  // 动画变体
  const slideVariants = {
    enter: (d: number) => ({ x: d * 100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: -d * 100, opacity: 0 }),
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
        background: 'var(--color-background)',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-medium)',
          overflow: 'hidden',
        }}
      >
        {/* 进度条 */}
        <div
          style={{
            height: 4,
            background: 'var(--color-background-alt)',
          }}
        >
          <motion.div
            animate={{ width: `${((currentStep + 1) / CONSENT_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              height: '100%',
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>

        <div style={{ padding: 'var(--space-8)', minHeight: 400, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── 步骤1: 欢迎页 ── */}
            {step.id === 'welcome' && (
              <motion.div key="welcome" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}
                >
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: 36,
                  }}>
                    🌿
                  </div>
                </motion.div>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textAlign: 'center',
                  marginBottom: 'var(--space-4)',
                }}>
                  {texts.welcome.title}
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {texts.welcome.body}
                </p>
              </motion.div>
            )}

            {/* ── 步骤2: 服务边界 ── */}
            {step.id === 'service_boundary' && (
              <motion.div key="boundary" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-danger-dark)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {texts.serviceBoundary.title}
                </h2>
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger-light)',
                  border: '1px solid var(--color-danger)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {texts.serviceBoundary.body}
                </div>
              </motion.div>
            )}

            {/* ── 步骤3: 隐私政策同意 ── */}
            {step.id === 'privacy_policy' && (
              <motion.div key="privacy" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {texts.privacyTitle}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-6)',
                }}>
                  {texts.privacyBody}
                </p>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  cursor: 'pointer',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: privacyConsented ? 'rgba(45, 90, 74, 0.08)' : 'var(--color-background)',
                  border: `2px solid ${privacyConsented ? 'var(--color-primary)' : 'var(--color-background-alt)'}`,
                  transition: 'all var(--transition-fast)',
                }}>
                  <input
                    type="checkbox"
                    checked={privacyConsented}
                    onChange={(e) => setPrivacyConsented(e.target.checked)}
                    style={{ marginTop: 3, width: 20, height: 20, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    {texts.privacyConsent}
                  </span>
                </label>
              </motion.div>
            )}

            {/* ── 步骤4: 衍生数据独立授权 (CR-008) ── */}
            {step.id === 'derivative_data' && (
              <motion.div key="derivative" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {texts.derivativeTitle}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-6)',
                }}>
                  {texts.derivativeBody}
                </p>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  cursor: 'pointer',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: derivativeConsented ? 'rgba(45, 90, 74, 0.08)' : 'var(--color-background)',
                  border: `2px solid ${derivativeConsented ? 'var(--color-primary)' : 'var(--color-background-alt)'}`,
                  transition: 'all var(--transition-fast)',
                }}>
                  <input
                    type="checkbox"
                    checked={derivativeConsented}
                    onChange={(e) => setDerivativeConsented(e.target.checked)}
                    style={{ marginTop: 3, width: 20, height: 20, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    {texts.derivativeConsent}
                  </span>
                </label>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-3)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {region === 'gb'
                    ? 'This consent is independent from the Privacy Policy. You may use the service without granting this, but some features (e.g., emotional profiles) will be unavailable.'
                    : '此授權獨立於私隱政策。不授權仍可使用基本服務，但情緒檔案等功能將無法使用。'}
                </p>
              </motion.div>
            )}

            {/* ── 步骤5: 未成年人检测 (G-008) ── */}
            {step.id === 'minor_check' && (
              <motion.div key="minor" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {texts.ageQuestion}
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={userAge ?? ''}
                    onChange={(e) => setUserAge(parseInt(e.target.value) || null)}
                    placeholder={region === 'gb' ? 'Age' : '年齡'}
                    style={{
                      width: 120,
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '2px solid var(--color-background-alt)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-lg)',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* 未成年人监护人同意 */}
                <AnimatePresence>
                  {isMinor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(232, 184, 109, 0.1)',
                        border: '2px solid var(--color-secondary)',
                        marginBottom: 'var(--space-4)',
                      }}>
                        <h3 style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-lg)',
                          fontWeight: 700,
                          color: 'var(--color-secondary-dark)',
                          marginBottom: 'var(--space-3)',
                        }}>
                          {texts.guardianTitle}
                        </h3>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--leading-relaxed)',
                          marginBottom: 'var(--space-4)',
                        }}>
                          {texts.guardianBody}
                        </p>
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-3)',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={guardianConsented}
                            onChange={(e) => setGuardianConsented(e.target.checked)}
                            style={{ marginTop: 3, width: 20, height: 20, accentColor: 'var(--color-secondary)' }}
                          />
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text)',
                            lineHeight: 'var(--leading-relaxed)',
                          }}>
                            {texts.guardianConsent}
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── 步骤6: 完成 ── */}
            {step.id === 'complete' && (
              <motion.div key="complete" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    style={{
                      width: 80, height: 80,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto var(--space-6)',
                      fontSize: 40,
                    }}
                  >
                    🌿
                  </motion.div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    {texts.complete}
                  </h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 底部导航 ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-8)',
          borderTop: '1px solid var(--color-background-alt)',
        }}>
          <motion.button
            onClick={goBack}
            disabled={currentStep === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: 'var(--space-3) var(--space-5)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: currentStep === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              border: `2px solid ${currentStep === 0 ? 'var(--color-background-alt)' : 'var(--color-background-alt)'}`,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.5 : 1,
            }}
          >
            {texts.back}
          </motion.button>

          {step.id === 'complete' ? (
            <motion.button
              onClick={handleComplete}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-secondary)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {region === 'gb' ? 'Start chatting' : '開始對話'}
            </motion.button>
          ) : (
            <motion.button
              onClick={goNext}
              disabled={
                (step.id === 'privacy_policy' && !privacyConsented) ||
                (step.id === 'minor_check' && userAge === null) ||
                (step.id === 'minor_check' && isMinor && !guardianConsented)
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-md)',
                background: (
                  (step.id === 'privacy_policy' && !privacyConsented) ||
                  (step.id === 'minor_check' && (userAge === null || (isMinor && !guardianConsented)))
                ) ? 'var(--color-background-alt)' : 'var(--color-primary)',
                color: (
                  (step.id === 'privacy_policy' && !privacyConsented) ||
                  (step.id === 'minor_check' && (userAge === null || (isMinor && !guardianConsented)))
                ) ? 'var(--color-text-muted)' : 'white',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                border: 'none',
                cursor: (
                  (step.id === 'privacy_policy' && !privacyConsented) ||
                  (step.id === 'minor_check' && (userAge === null || (isMinor && !guardianConsented)))
                ) ? 'not-allowed' : 'pointer',
              }}
            >
              {step.id === 'privacy_policy' || step.id === 'derivative_data' || step.id === 'minor_check'
                ? texts.agree
                : texts.next}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
