'use client';
// ===== Mindlab Profile & Data Management (G-006/G-007/G-008) =====
// 个人中心 — 一键数据删除、数据存储位置展示、隐私设置、未成年人保护状态

'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, type RegionCode, MINOR_AGE_THRESHOLDS } from '@/lib/sessionStore';

// ── 地区化文案 ──
const PROFILE_TEXTS: Record<RegionCode, {
  title: string;
  dataSection: string;
  dataLocation: string;
  dataLocationDesc: string;
  encryptionNote: string;
  deleteButton: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  deleteConfirmButton: string;
  deleteCancelButton: string;
  deleteSuccess: string;
  derivativeSection: string;
  derivativeStatus: string;
  derivativeRevoke: string;
  derivativeRevokeConfirm: string;
  minorSection: string;
  minorStatus: string;
  minorAgeThreshold: string;
  privacySection: string;
  crisisEntry: string;
}> = {
  hk: {
    title: '個人中心',
    dataSection: '數據管理',
    dataLocation: '數據存儲位置',
    dataLocationDesc: '你嘅所有數據加密存儲於香港，唔會傳輸至其他地區。',
    encryptionNote: 'AES-256加密存儲 | TLS 1.3傳輸',
    deleteButton: '刪除所有數據',
    deleteConfirmTitle: '確認刪除所有數據？',
    deleteConfirmBody: '呢個操作唔可以撤銷。你嘅對話記錄、情緒檔案、個人資料將喺30分鐘內徹底刪除。刪除後你將無法恢復任何數據。',
    deleteConfirmButton: '確認刪除',
    deleteCancelButton: '取消',
    deleteSuccess: '所有數據已刪除',
    derivativeSection: '衍生數據',
    derivativeStatus: '衍生數據授權狀態',
    derivativeRevoke: '撤回衍生數據授權',
    derivativeRevokeConfirm: '撤回後，你嘅情緒檔案同測評結果將喺72小時內刪除或匿名化。基本AI對話功能唔受影響。',
    minorSection: '未成年人保護',
    minorStatus: '未成年人保護模式',
    minorAgeThreshold: '監護人同意門檻：16歲以下',
    privacySection: '私隱設定',
    crisisEntry: '緊急支援',
  },
  tw: {
    title: '個人中心',
    dataSection: '資料管理',
    dataLocation: '資料儲存位置',
    dataLocationDesc: '您的所有資料加密儲存於臺灣，不會傳輸至其他地區。',
    encryptionNote: 'AES-256加密儲存 | TLS 1.3傳輸',
    deleteButton: '刪除所有資料',
    deleteConfirmTitle: '確認刪除所有資料？',
    deleteConfirmBody: '此操作無法撤銷。您的對話記錄、情緒檔案、個人資料將於30分鐘內徹底刪除。刪除後您將無法恢復任何資料。',
    deleteConfirmButton: '確認刪除',
    deleteCancelButton: '取消',
    deleteSuccess: '所有資料已刪除',
    derivativeSection: '衍生資料',
    derivativeStatus: '衍生資料授權狀態',
    derivativeRevoke: '撤回衍生資料授權',
    derivativeRevokeConfirm: '撤回後，您的情緒檔案與測評結果將於72小時內刪除或匿名化。基本AI對話功能不受影響。',
    minorSection: '未成年人保護',
    minorStatus: '未成年人保護模式',
    minorAgeThreshold: '監護人同意門檻：18歲以下',
    privacySection: '隱私設定',
    crisisEntry: '緊急支援',
  },
  gb: {
    title: 'Profile',
    dataSection: 'Data Management',
    dataLocation: 'Data storage location',
    dataLocationDesc: 'All your data is encrypted and stored in the United Kingdom. It will not be transferred to other regions.',
    encryptionNote: 'AES-256 encryption at rest | TLS 1.3 in transit',
    deleteButton: 'Delete all my data',
    deleteConfirmTitle: 'Delete all data?',
    deleteConfirmBody: 'This action cannot be undone. Your conversation history, emotional profiles, and personal data will be permanently deleted within 30 minutes. You will not be able to recover any data after deletion.',
    deleteConfirmButton: 'Confirm deletion',
    deleteCancelButton: 'Cancel',
    deleteSuccess: 'All data deleted',
    derivativeSection: 'Derivative Data',
    derivativeStatus: 'Derivative data authorisation status',
    derivativeRevoke: 'Revoke derivative data authorisation',
    derivativeRevokeConfirm: 'After revocation, your emotional profiles and assessment results will be deleted or anonymised within 72 hours. Basic AI conversation features are not affected.',
    minorSection: 'Minor Protection',
    minorStatus: 'Minor protection mode',
    minorAgeThreshold: 'Parental consent threshold: under 13',
    privacySection: 'Privacy Settings',
    crisisEntry: 'Crisis support',
  },
};

// ── 数据存储位置组件 ──
function DataLocationInfo({ region }: { region: RegionCode }) {
  const texts = PROFILE_TEXTS[region];
  const locationMap: Record<RegionCode, { flag: string; name: string }> = {
    hk: { flag: '🇭🇰', name: region === 'gb' ? 'Hong Kong' : '香港' },
    tw: { flag: '🇹🇼', name: region === 'gb' ? 'Taiwan' : '臺灣' },
    gb: { flag: '🇬🇧', name: 'United Kingdom' },
  };
  const loc = locationMap[region];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(45, 90, 74, 0.06)',
        border: '1px solid rgba(45, 90, 74, 0.15)',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--color-primary)',
        marginBottom: 'var(--space-2)',
      }}>
        {texts.dataLocation}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-2)',
      }}>
        <span style={{ fontSize: 24 }}>{loc.flag}</span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-text)',
        }}>
          {loc.name}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        {texts.dataLocationDesc}
      </p>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        marginTop: 'var(--space-2)',
      }}>
        🔒 {texts.encryptionNote}
      </div>
    </motion.div>
  );
}

// ── 一键数据删除组件 ──
function DataDeletion({ region }: { region: RegionCode }) {
  const texts = PROFILE_TEXTS[region];
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      // TODO: 调用 DELETE /api/user/data — 覆盖所有地区数据
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟
      setDeleted(true);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  if (deleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid var(--color-success)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 32 }}>✅</span>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--color-success)',
          marginTop: 'var(--space-2)',
        }}>
          {texts.deleteSuccess}
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <motion.button
        onClick={() => setShowConfirm(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-danger)',
          color: 'white',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        {texts.deleteButton}
      </motion.button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal)' as unknown as number,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: 'var(--space-4)',
            }}
            role="alertdialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-8)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: 48 }}>⚠️</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-danger-dark)',
                textAlign: 'center',
                marginBottom: 'var(--space-3)',
              }}>
                {texts.deleteConfirmTitle}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-6)',
              }}>
                {texts.deleteConfirmBody}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <motion.button
                  onClick={() => setShowConfirm(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-background-alt)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {texts.deleteCancelButton}
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-danger)',
                    color: 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isDeleting ? '...' : texts.deleteConfirmButton}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 个人中心主组件 ──
export default function ProfilePage() {
  const region = useSessionStore((s) => s.region);
  const derivativeConsented = useSessionStore((s) => s.derivativeDataConsented);
  const isMinor = useSessionStore((s) => s.isMinor);
  const texts = PROFILE_TEXTS[region];

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: 'var(--space-6)',
      background: 'var(--color-background)',
      minHeight: '100vh',
    }}>
      {/* 标题 */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 700,
        color: 'var(--color-primary)',
        marginBottom: 'var(--space-8)',
      }}>
        {texts.title}
      </h1>

      {/* ── 数据管理 ── */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-4)',
        }}>
          📦 {texts.dataSection}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <DataLocationInfo region={region} />
          <DataDeletion region={region} />
        </div>
      </section>

      {/* ── 衍生数据授权状态 ── */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-4)',
        }}>
          📊 {texts.derivativeSection}
        </h2>
        <div style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: derivativeConsented ? 'var(--space-3)' : 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text)',
            }}>
              {texts.derivativeStatus}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: derivativeConsented ? 'var(--color-success)' : 'var(--color-text-muted)',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              background: derivativeConsented ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background-alt)',
            }}>
              {derivativeConsented
                ? (region === 'gb' ? 'Authorised' : '已授權')
                : (region === 'gb' ? 'Not authorised' : '未授權')}
            </span>
          </div>
          {derivativeConsented && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--color-secondary-dark)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                border: '1px solid var(--color-secondary)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => {
                // TODO: 调用撤回API — 撤回后72h内删除/匿名化
                alert(texts.derivativeRevokeConfirm);
              }}
            >
              {texts.derivativeRevoke}
            </motion.button>
          )}
        </div>
      </section>

      {/* ── 未成年人保护 ── */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-4)',
        }}>
          🛡️ {texts.minorSection}
        </h2>
        <div style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-2)',
          }}>
            {texts.minorStatus}: <strong style={{ color: isMinor ? 'var(--color-secondary-dark)' : 'var(--color-primary)' }}>
              {isMinor
                ? (region === 'gb' ? 'Active' : '已啟用')
                : (region === 'gb' ? 'Not active' : '未啟用')}
            </strong>
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            {texts.minorAgeThreshold}（{MINOR_AGE_THRESHOLDS[region]}{region === 'gb' ? '' : '歲'}）
          </div>
        </div>
      </section>

      {/* ── 紧急支援入口 ── */}
      <section>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // TODO: 导航至危机资源页或弹出CrisisModal
          }}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger)',
            color: 'white',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {texts.crisisEntry}
        </motion.button>
      </section>
    </div>
  );
}
