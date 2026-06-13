'use client';
// ===== Mindlab Counselor Transfer Components (G-003/G-004) =====
// 真人辅导申请 + AI→真人转接流程 + 结构化摘要展示

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, type TransferRequest, type RegionCode, type RiskLevel, type CrisisResource, CRISIS_RESOURCES } from '@/lib/sessionStore';

// ── 转接状态 ──
type TransferPhase = 'idle' | 'requesting' | 'matching' | 'connected' | 'failed' | 'timeout';

// ── 地区化文案 ──
const TRANSFER_TEXTS: Record<RegionCode, {
  requestTitle: string;
  requestBody: string;
  requestButton: string;
  matchingTitle: string;
  matchingBody: string;
  matchedTitle: string;
  matchedBody: string;
  startSession: string;
  failedTitle: string;
  failedBody: string;
  retry: string;
  backToAI: string;
  timeoutTitle: string;
  timeoutBody: string;
  summaryTitle: string;
  cancelConfirm: string;
}> = {
  hk: {
    requestTitle: '請求真人輔導',
    requestBody: '你可以隨時切換到持證認證心理輔導員（HKPCA認證），獲得更深入嘅支援。我哋會將你嘅對話摘要（唔含原文）安全咁傳遞畀輔導員。',
    requestButton: '申請轉接真人輔導',
    matchingTitle: '正在為你匹配輔導員...',
    matchingBody: '請稍等，我哋正在根據你嘅需求匹配最合適嘅認證心理輔導員。平均等待時間≤5分鐘。',
    matchedTitle: '輔導員已準備好',
    matchedBody: '已為你匹配到合適嘅認證心理輔導員。點擊下方按鈕開始對話。',
    startSession: '開始對話',
    failedTitle: '暫時無法匹配',
    failedBody: '目前冇可用嘅輔導員，請稍後再試，或者繼續同AI心理陪伴夥伴對話。',
    retry: '重新嘗試',
    backToAI: '返回AI對話',
    timeoutTitle: '等待超時',
    timeoutBody: '已等待超過5分鐘，暫時未有輔導員可以接手。你可以繼續同AI心理陪伴夥伴對話，或者稍後再試。',
    summaryTitle: '轉接摘要',
    cancelConfirm: '確定取消轉接？',
  },
  tw: {
    requestTitle: '請求真人諮商',
    requestBody: '您可以隨時切換到領證諮商心理師，獲得更深入的支援。我們會將您的對話摘要（不含原文）安全地傳遞給心理師。',
    requestButton: '申請轉接真人諮商',
    matchingTitle: '正在為您匹配諮商心理師...',
    matchingBody: '請稍候，我們正在根據您的需求匹配最合適的領證諮商心理師。平均等待時間≤5分鐘。',
    matchedTitle: '諮商心理師已準備好',
    matchedBody: '已為您匹配到合適的領證諮商心理師。點擊下方按鈕開始對話。',
    startSession: '開始對話',
    failedTitle: '暫時無法匹配',
    failedBody: '目前沒有可用的諮商心理師，請稍後再試，或繼續與AI心理陪伴夥伴對話。',
    retry: '重新嘗試',
    backToAI: '返回AI對話',
    timeoutTitle: '等待逾時',
    timeoutBody: '已等待超過5分鐘，暫時沒有諮商心理師可以接手。您可以繼續與AI心理陪伴夥伴對話，或稍後再試。',
    summaryTitle: '轉接摘要',
    cancelConfirm: '確定取消轉接？',
  },
  gb: {
    requestTitle: 'Request a wellbeing counsellor',
    requestBody: 'You can switch to a certified wellbeing counsellor (BACP/UKCP registered) at any time for deeper support. We will securely share a structured summary (not your full conversation) with the counsellor.',
    requestButton: 'Request counsellor transfer',
    matchingTitle: 'Matching you with a counsellor...',
    matchingBody: 'Please wait while we match you with the most suitable registered wellbeing counsellor. Average wait time ≤5 minutes.',
    matchedTitle: 'Counsellor is ready',
    matchedBody: 'We\'ve matched you with a suitable wellbeing counsellor. Click below to start your session.',
    startSession: 'Start session',
    failedTitle: 'Unable to match',
    failedBody: 'No counsellors are currently available. Please try again later, or continue chatting with your AI companion.',
    retry: 'Try again',
    backToAI: 'Back to AI chat',
    timeoutTitle: 'Wait time exceeded',
    timeoutBody: 'We\'ve waited over 5 minutes without a counsellor becoming available. You can continue chatting with your AI companion, or try again later.',
    summaryTitle: 'Transfer summary',
    cancelConfirm: 'Cancel transfer?',
  },
};

// ── 结构化摘要卡片 (G-004: 转接时传递) ──
interface TransferSummaryCardProps {
  summary: TransferRequest;
  region: RegionCode;
}

function TransferSummaryCard({ summary, region }: TransferSummaryCardProps) {
  const riskColors: Record<RiskLevel, string> = {
    none: 'var(--color-success)',
    low: 'var(--color-secondary)',
    medium: 'var(--color-warning)',
    high: 'var(--color-danger)',
    critical: 'var(--color-danger-dark)',
  };

  const urgencyLabels: Record<string, Record<RegionCode, string>> = {
    normal: { hk: '一般', tw: '一般', gb: 'Normal' },
    urgent: { hk: '緊急', tw: '緊急', gb: 'Urgent' },
    emergency: { hk: '極度緊急', tw: '極度緊急', gb: 'Emergency' },
  };

  return (
    <div style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface)',
      boxShadow: 'var(--shadow-medium)',
      border: '1px solid var(--color-background-alt)',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
        marginBottom: 'var(--space-3)',
      }}>
        {TRANSFER_TEXTS[region].summaryTitle}
      </h3>

      {/* 风险等级 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        background: `${riskColors[summary.risk_level]}15`,
      }}>
        <div style={{
          width: 10, height: 10,
          borderRadius: 'var(--radius-full)',
          background: riskColors[summary.risk_level],
        }} />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: riskColors[summary.risk_level],
        }}>
          Risk: {summary.risk_level.toUpperCase()}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {urgencyLabels[summary.urgency]?.[region]}
        </span>
      </div>

      {/* 情绪摘要 */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-1)',
        }}>
          {region === 'gb' ? 'Emotional state' : '情緒狀態'}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text)',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          {summary.emotion_summary}
        </div>
      </div>

      {/* 话题标签 */}
      {summary.topic_tags && summary.topic_tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          {summary.topic_tags.map((tag) => (
            <span key={tag} style={{
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-background)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 当地危机资源 */}
      {summary.local_crisis_resources.length > 0 && (
        <div style={{
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-danger-dark)',
            marginBottom: 'var(--space-2)',
          }}>
            {region === 'gb' ? 'Crisis resources' : '危機資源'}
          </div>
          {summary.local_crisis_resources.map((r) => (
            <div key={r.number} style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}>
              {r.name}: <strong style={{ color: 'var(--color-danger-dark)' }}>{r.number}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 转接进度展示 (G-004) ──
export function TransferProgress() {
  const region = useSessionStore((s) => s.region);
  const dispatch = useSessionStore((s) => s.dispatch);
  const sessionState = useSessionStore((s) => s.current);
  const texts = TRANSFER_TEXTS[region];

  const [phase, setPhase] = useState<TransferPhase>('matching');
  const [elapsed, setElapsed] = useState(0);
  const [matchTime, setMatchTime] = useState<number | null>(null);

  // 等待计时
  useEffect(() => {
    if (phase !== 'matching') return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= 300) { // 5分钟超时
          setPhase('timeout');
          dispatch({ type: 'COUNSELOR_TIMEOUT' });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, dispatch]);

  // 接入真实API轮询转接状态
  const sessionId = useSessionStore((s) => s.sessionId);
  useEffect(() => {
    if (phase !== 'matching' || !sessionId) return;

    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval>;

    const pollTransferStatus = async () => {
      try {
        const region = useSessionStore.getState().region;
        const apiBase = (typeof window !== 'undefined')
          ? (window as unknown as Record<string, string>)[`NEXT_PUBLIC_API_BASE_${region.toUpperCase()}`] || '/api'
          : '/api';
        const res = await fetch(`${apiBase}/transfer/status?session_id=${sessionId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // 非致命错误，继续轮询
          console.warn('[TransferProgress] Poll failed:', res.status);
          return;
        }

        const data = await res.json();
        const status: string = data.status;
        const counselorId: string | null = data.counselor_id ?? null;
        const counselorName: string | null = data.counselor_name ?? null;

        if (cancelled) return;

        if (status === 'matched' && counselorId) {
          setMatchTime(elapsed);
          setPhase('connected');
          dispatch({ type: 'COUNSELOR_ACCEPT', counselorId });
        } else if (status === 'failed_timeout' || status === 'failed_no_counselor') {
          setPhase('timeout');
          dispatch({ type: 'COUNSELOR_TIMEOUT' });
        } else if (status === 'failed_permission' || status === 'failed_nats' || status === 'failed_unknown') {
          setPhase('failed');
        }
        // status === 'broadcasting' | 'matching' → 继续轮询
      } catch (err) {
        console.warn('[TransferProgress] Poll error:', err);
      }
    };

    // 首次立即请求，之后每3秒轮询
    pollTransferStatus();
    pollInterval = setInterval(pollTransferStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [phase, sessionId, elapsed, dispatch]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── 匹配中 ── */}
        {phase === 'matching' && (
          <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{
                width: 64, height: 64,
                borderRadius: 'var(--radius-full)',
                border: '4px solid var(--color-background-alt)',
                borderTopColor: 'var(--color-primary)',
                margin: '0 auto var(--space-6)',
              }}
            />
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-3)',
            }}>
              {texts.matchingTitle}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-4)',
            }}>
              {texts.matchingBody}
            </p>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-4)',
            }}>
              {formatTime(elapsed)}
            </div>
            <motion.button
              onClick={() => {
                dispatch({ type: 'COUNSELOR_TIMEOUT' });
                setPhase('idle');
              }}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                border: '1px solid var(--color-background-alt)',
                cursor: 'pointer',
              }}
            >
              {texts.cancelConfirm}
            </motion.button>
          </motion.div>
        )}

        {/* ── 已连接 ── */}
        {phase === 'connected' && (
          <motion.div key="connected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{
                width: 72, height: 72,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-6)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </motion.div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-3)',
            }}>
              {texts.matchedTitle}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-6)',
            }}>
              {texts.matchedBody}
              {matchTime !== null && (
                <span style={{ display: 'block', marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>
                  {region === 'gb' ? `Matched in ${matchTime}s` : `匹配用咗 ${matchTime} 秒`}
                </span>
              )}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: 'var(--space-4) var(--space-8)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-secondary)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              {texts.startSession}
            </motion.button>
          </motion.div>
        )}

        {/* ── 超时 ── */}
        {phase === 'timeout' && (
          <motion.div key="timeout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>⏰</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: 'var(--space-3)',
            }}>
              {texts.timeoutTitle}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-6)',
            }}>
              {texts.timeoutBody}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <motion.button
                onClick={() => setPhase('matching')}
                whileHover={{ scale: 1.02 }}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {texts.retry}
              </motion.button>
              <motion.button
                onClick={() => setPhase('idle')}
                whileHover={{ scale: 1.02 }}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-background-alt)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {texts.backToAI}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
