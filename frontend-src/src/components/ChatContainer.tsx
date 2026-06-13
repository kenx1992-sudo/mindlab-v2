'use client';
// ===== Mindlab AI Chat Container (G-001) =====
// AI心理陪伴对话界面 — 多语言、危机拦截、服务边界声明、合规标注

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, type RegionCode } from '@/lib/sessionStore';
import { useCrisisDetection, CrisisModal } from '@/components/CrisisModal';

// ── 消息类型 ──
export type MessageRole = 'user' | 'ai' | 'system' | 'service_boundary';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  aiLabelled?: boolean;      // AI消息是否已附加合规标注
  riskLevel?: string;        // 风险等级（系统消息用）
  isStreaming?: boolean;      // 是否正在流式输出
}

// ── 服务边界声明文案 (G-007) ──
const SERVICE_BOUNDARY: Record<RegionCode, { start: string; end: string }> = {
  hk: {
    start: '🌿 本服務為心理支持，非醫療診斷或治療。如有心理健康問題，請尋求專業醫療機構幫助。',
    end: '🌿 感謝你嘅分享。請記住：本服務為心理支持，非醫療診斷或治療。如需專業幫助，請聯絡相關機構。',
  },
  tw: {
    start: '🌿 本服務為心理支持，非醫療診斷或治療。如有心理健康問題，請尋求專業醫療機構幫助。',
    end: '🌿 感謝你的分享。請記住：本服務為心理支持，非醫療診斷或治療。如需專業協助，請聯繫相關機構。',
  },
  gb: {
    start: '🌿 This is a mental wellbeing support service, not medical treatment. If you need medical help, please contact a healthcare professional.',
    end: '🌿 Thank you for sharing. Please remember: this is mental wellbeing support, not medical treatment. If you need professional help, please reach out.',
  },
};

// ── AI合规标注 (合规约束: AI回复自动附加标注) ──
const AI_LABEL: Record<RegionCode, string> = {
  hk: 'AI生成內容，僅供參考',
  tw: 'AI生成內容，僅供參考',
  gb: 'AI-generated content, for reference only',
};

// ── AI品牌形象组件（🌿植物意象，非拟人化） ──
function AICompanionAvatar() {
  return (
    <motion.div
      className="ai-companion-avatar"
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        repeat: Infinity,
        duration: 4,
        ease: 'easeInOut',
      }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-full)',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: 18 }}>🌿</span>
    </motion.div>
  );
}

// ── AI打字指示器 ──
function AITypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <AICompanionAvatar />
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            style={{
              width: 8,
              height: 8,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── 服务边界声明组件 (G-007) ──
interface ServiceBoundaryProps {
  type: 'start' | 'end';
}

function ServiceBoundary({ type }: ServiceBoundaryProps) {
  const region = useSessionStore((s) => s.region);
  const text = SERVICE_BOUNDARY[region][type];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{
        margin: 'var(--space-4) 0',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-background-alt)',
        borderLeft: `3px solid var(--color-secondary)`,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}
      role="note"
      aria-label={region === 'gb' ? 'Service boundary notice' : '服務邊界聲明'}
    >
      {text}
    </motion.div>
  );
}

// ── 消息气泡组件 ──
interface MessageBubbleProps {
  message: ChatMessage;
  region: RegionCode;
}

function MessageBubble({ message, region }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai';
  const isSystem = message.role === 'system';

  if (message.role === 'service_boundary') {
    return <ServiceBoundary type={message.content as 'start' | 'end'} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) 0',
      }}
    >
      {/* AI头像 */}
      {isAI && <AICompanionAvatar />}

      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {/* 气泡内容 */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: isUser
              ? 'var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg)'
              : 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
            background: isUser
              ? 'var(--color-primary)'
              : isSystem
              ? 'var(--color-danger-light)'
              : 'var(--color-surface)',
            color: isUser ? 'white' : 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-relaxed)',
            boxShadow: isUser ? 'none' : 'var(--shadow-soft)',
          }}
        >
          {message.content}
        </div>

        {/* AI合规标注 */}
        {isAI && message.aiLabelled && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              paddingLeft: 'var(--space-1)',
            }}
          >
            {AI_LABEL[region]}
          </div>
        )}

        {/* 时间戳 */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textAlign: isUser ? 'right' : 'left',
            paddingLeft: 'var(--space-1)',
            paddingRight: 'var(--space-1)',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString(
            region === 'gb' ? 'en-GB' : region === 'tw' ? 'zh-TW' : 'zh-HK',
            { hour: '2-digit', minute: '2-digit' }
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── 请求真人辅导按钮 (G-003) ──
function CounselorRequestButton({ onClick }: { onClick: () => void }) {
  const region = useSessionStore((s) => s.region);
  const labels: Record<RegionCode, string> = {
    hk: '請求真人輔導',
    tw: '請求真人諮商',
    gb: 'Request a counsellor',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-secondary)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-soft)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      {labels[region]}
    </motion.button>
  );
}

// ── 危机入口按钮 (始终可见) ──
function CrisisEntryButton({ onClick }: { onClick: () => void }) {
  const region = useSessionStore((s) => s.region);
  const labels: Record<RegionCode, string> = {
    hk: '緊急支援',
    tw: '緊急支援',
    gb: 'Crisis support',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={region === 'gb' ? 'Emergency crisis support' : '緊急危機支援'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-danger)',
        color: 'white',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      {labels[region]}
    </motion.button>
  );
}

// ── 主对话容器 ──
export default function ChatContainer() {
  const region = useSessionStore((s) => s.region);
  const sessionState = useSessionStore((s) => s.current);
  const dispatch = useSessionStore((s) => s.dispatch);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [serviceBoundaryShown, setServiceBoundaryShown] = useState<'start' | 'end' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { checkMessage, crisisDetected } = useCrisisDetection();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 会话开始时展示服务边界声明
  useEffect(() => {
    if (sessionState === 'CHATTING' && messages.length === 0) {
      setMessages([{
        id: 'boundary-start',
        role: 'service_boundary',
        content: 'start',
        timestamp: Date.now(),
      }]);
      setServiceBoundaryShown('start');
    }
  }, [sessionState]);

  // 危机检测触发弹窗
  useEffect(() => {
    if (crisisDetected) {
      setShowCrisisModal(true);
    }
  }, [crisisDetected]);

  // 发送消息
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // 1. 客户端危机关键词预检
    const isCrisis = checkMessage(trimmed);

    // 2. 添加用户消息
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    if (isCrisis) return; // 危机弹窗已触发，暂停对话

    // 3. 会话状态转换
    if (sessionState === 'FREE_TRIAL') {
      dispatch({ type: 'START_CHAT' });
    }

    // 4. 模拟AI回复（实际接入SSE流式API）
    setIsTyping(true);
    try {
      // TODO: 替换为真实API调用 POST /api/chat
      // const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: trimmed, session_id, locale }) });
      // SSE流式处理

      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: getSimulatedResponse(trimmed, region),
        timestamp: Date.now(),
        aiLabelled: true, // 合规标注自动附加
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      // 错误处理
      console.error('Chat API error:', error);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, checkMessage, sessionState, dispatch, region]);

  // 键盘发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 请求真人辅导
  const handleCounselorRequest = () => {
    dispatch({ type: 'REQUEST_COUNSELOR' });
    // TODO: 调用转接API
  };

  // 危机弹窗关闭
  const handleCrisisClose = () => {
    setShowCrisisModal(false);
  };

  // 输入区占位文案
  const placeholders: Record<RegionCode, string> = {
    hk: '講下你嘅感受...',
    tw: '說說你的感受...',
    gb: 'Share how you\'re feeling...',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        background: 'var(--color-background)',
      }}
    >
      {/* ── 顶栏 ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-background-alt)',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <AICompanionAvatar />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--color-primary)',
            }}>
              {region === 'gb' ? 'AI mental wellbeing companion' : 'AI心理陪伴夥伴'}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
            }}>
              {region === 'gb' ? 'Always here for you' : region === 'tw' ? '陪伴你，走过去' : '陪住你，每一刻'}
            </div>
          </div>
        </div>
        <CrisisEntryButton onClick={() => {
          dispatch({ type: 'DETECT_CRISIS', riskLevel: 'high' });
          setShowCrisisModal(true);
        }} />
      </header>

      {/* ── 消息区域 ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
        role="log"
        aria-label={region === 'gb' ? 'Chat messages' : '對話訊息'}
        aria-live="polite"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} region={region} />
        ))}
        <AnimatePresence>
          {isTyping && <AITypingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* ── 底部输入区 ── */}
      <footer
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--color-background-alt)',
          background: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {/* 请求真人辅导按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CounselorRequestButton onClick={handleCounselorRequest} />
        </div>

        {/* 输入框 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[region]}
            rows={1}
            aria-label={region === 'gb' ? 'Type your message' : '輸入訊息'}
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--color-background-alt)',
              background: 'var(--color-background)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text)',
              resize: 'none',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
              minHeight: 44,
              maxHeight: 120,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-background-alt)';
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              background: inputValue.trim() ? 'var(--color-primary)' : 'var(--color-background-alt)',
              color: inputValue.trim() ? 'white' : 'var(--color-text-muted)',
              border: 'none',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all var(--transition-fast)',
            }}
            aria-label={region === 'gb' ? 'Send message' : '發送訊息'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </footer>

      {/* ── 危机弹窗 ── */}
      <AnimatePresence>
        {showCrisisModal && <CrisisModal onClose={handleCrisisClose} />}
      </AnimatePresence>
    </div>
  );
}

// ── 模拟AI回复（开发阶段，后端接入后移除） ──
function getSimulatedResponse(message: string, region: RegionCode): string {
  if (region === 'gb') {
    return "Thank you for sharing that with me. I'm here to listen. 💚 What's been on your mind the most lately?";
  }
  if (region === 'tw') {
    return '謝謝你願意分享，我在這裡陪著你 🌿 最近最讓你困擾的是什麼呢？';
  }
  return '多謝你願意講出嚟，我陪住你 🌿 最近最令你困擾嘅係咩呢？';
}
