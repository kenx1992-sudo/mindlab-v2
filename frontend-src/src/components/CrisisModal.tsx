'use client';
// ===== Mindlab Crisis Detection & Modal =====
// G-002: 危机识别与强制干预 — 弹窗不可关闭、不可绕过

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, type CrisisResource, type RegionCode, type RiskLevel } from '@/lib/sessionStore';

// ── 各地区危机热线资源 (PRD §5.1) ──
export const CRISIS_RESOURCES: Record<RegionCode, CrisisResource[]> = {
  hk: [
    { name: '撒瑪利亞會', number: '2389 2222', description: '24小時情緒支援熱線' },
    { name: '生命熱線', number: '2382 0000', description: '24小時自殺危機支援' },
    { name: '醫管局精神健康專線', number: '2466 7350', description: '精神健康評估及轉介' },
  ],
  tw: [
    { name: '1925安心專線', number: '1925', description: '24小時安心服務' },
    { name: '1995生命線', number: '1995', description: '24小時協談專線' },
    { name: '張老師專線', number: '0800-788-995', description: '輔導與諮商服務' },
  ],
  gb: [
    { name: 'Samaritans', number: '116 123', description: '24/7 free listening service' },
    { name: 'NHS Mental Health', number: '111', description: 'Non-emergency medical advice' },
    { name: 'Shout', number: '85258', description: '24/7 text-based crisis support' },
  ],
};

// ── 危机关键词本地预检词库（客户端即时检测，后端并行深度检测） ──
const CRISIS_KEYWORDS: Record<RegionCode, string[]> = {
  hk: [
    '自殺', '想死', '唔想活', '結束生命', '跳樓', '割脈', '食安眠藥',
    '生存冇意義', '世界冇我更好', '唔想再受', '離開呢個世界',
  ],
  tw: [
    '自殺', '想死', '不想活', '結束生命', '跳樓', '割腕', '吃安眠藥',
    '活著沒意義', '世界沒有我更好', '不想再受苦', '離開這個世界',
  ],
  gb: [
    'suicide', 'kill myself', 'end my life', 'don\'t want to live',
    'no reason to live', 'better off dead', 'jump off', 'overdose',
    'self-harm', 'hurt myself', 'not worth living',
  ],
};

// ── 危机检测 Hook ──
export function useCrisisDetection() {
  const region = useSessionStore((s) => s.region);
  const crisisDetected = useSessionStore((s) => s.crisisDetected);
  const dispatch = useSessionStore((s) => s.dispatch);

  const checkMessage = useCallback(
    (message: string): boolean => {
      const keywords = CRISIS_KEYWORDS[region];
      const lowerMessage = message.toLowerCase();
      const detected = keywords.some((keyword) =>
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (detected && !crisisDetected) {
        dispatch({ type: 'DETECT_CRISIS', riskLevel: 'critical' });
      }

      return detected;
    },
    [region, crisisDetected, dispatch]
  );

  return { checkMessage, crisisDetected };
}

// ── 危机热线展示组件 ──
interface CrisisHotlineProps {
  resource: CrisisResource;
  index: number;
}

function CrisisHotlineCard({ resource, index }: CrisisHotlineProps) {
  const telUri = `tel:${resource.number.replace(/[^0-9+]/g, '')}`;

  return (
    <motion.a
      href={telUri}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
      className="crisis-hotline-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-5)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        border: '2px solid var(--color-danger)',
        textDecoration: 'none',
        color: 'var(--color-text)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 电话图标 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </div>

      {/* 热线信息 */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-danger-dark)',
          letterSpacing: 'var(--tracking-wide)',
        }}>
          {resource.number}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-1)',
        }}>
          {resource.name}
        </div>
        {resource.description && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
          }}>
            {resource.description}
          </div>
        )}
      </div>

      {/* 拨打指示 */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.a>
  );
}

// ── 危机弹窗（不可关闭） ──
// 设计原则：不可被用户关闭/绕过/跳过
// - 无关闭按钮
// - Escape键无效
// - 点击外部不关闭
// - 浏览器后退拦截
// - 焦点陷阱锁定
// - z-index: 9999
// 仅当用户拨打热线或点击「我已获得帮助」后可解除

interface CrisisModalProps {
  onClose: () => void; // 仅在用户确认获得帮助后触发
}

export function CrisisModal({ onClose }: CrisisModalProps) {
  const region = useSessionStore((s) => s.region);
  const resources = CRISIS_RESOURCES[region];
  const modalRef = useRef<HTMLDivElement>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // 焦点陷阱
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'a[href], button, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // 初始聚焦
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止Escape关闭
      if (e.key === 'Escape') {
        e.preventDefault();
        return;
      }

      // 焦点陷阱循环
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // 阻止浏览器后退
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = '';
    };
  }, []);

  // 地区化标题
  const localeTexts: Record<RegionCode, { title: string; subtitle: string; acknowledge: string; confirm: string }> = {
    hk: {
      title: '你有需要，即刻有人陪',
      subtitle: '你唔係一個人，有人願意聽你講。請聯絡以下24小時熱線：',
      acknowledge: '我已撥打熱線 / 獲得幫助',
      confirm: '確認返回',
    },
    tw: {
      title: '你不是一個人，有人願意聽你說',
      subtitle: '請聯繫以下24小時專線，專業人員隨時為你提供協助：',
      acknowledge: '我已撥打專線 / 獲得協助',
      confirm: '確認返回',
    },
    gb: {
      title: 'You are not alone',
      subtitle: 'Please reach out to one of these 24/7 crisis services. Someone is here to listen:',
      acknowledge: 'I have called a helpline / received help',
      confirm: 'Confirm return',
    },
  };

  const texts = localeTexts[region];

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="crisis-title"
        aria-describedby="crisis-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-crisis)' as unknown as number,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(239, 68, 68, 0.12)',
          backdropFilter: 'blur(8px)',
          padding: 'var(--space-4)',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-background)',
            boxShadow: 'var(--shadow-crisis)',
            padding: 'var(--space-8)',
          }}
        >
          {/* 危机图标 — 脉冲动画 */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-6)',
            }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </motion.div>

          {/* 标题 */}
          <h2
            id="crisis-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--color-danger-dark)',
              textAlign: 'center',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {texts.title}
          </h2>

          {/* 副标题 */}
          <p
            id="crisis-subtitle"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {texts.subtitle}
          </p>

          {/* 热线列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
            {resources.map((resource, index) => (
              <CrisisHotlineCard key={resource.number} resource={resource} index={index} />
            ))}
          </div>

          {/* 确认区域 */}
          <div style={{
            borderTop: '1px solid var(--color-background-alt)',
            paddingTop: 'var(--space-6)',
          }}>
            {!acknowledged ? (
              <motion.button
                onClick={() => setAcknowledged(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
              >
                {texts.acknowledge}
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-success)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {region === 'gb' ? 'Glad you reached out 💚' : '好開心你願意尋求幫助 💚'}
                </p>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {texts.confirm}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
