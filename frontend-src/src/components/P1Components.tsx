'use client';
// ===== Mindlab P1 Feature Components (G-010 ~ G-015 + G-021) =====
// 辅导员匹配系统 / 真人→AI回接 / 情绪档案 / 自助工具箱 / 支付集成 / AI微调适配 / 投诉反馈

'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegionCode } from '@/lib/sessionStore';

// ═══════════════════════════════════════════════════
// G-010: 辅导员匹配系统
// ═══════════════════════════════════════════════════

interface CounselorProfile {
  id: string;
  displayName: string;
  certification: string;
  specialties: string[];
  languages: string[];
  available: boolean;
  rating?: number;
  nextAvailable?: string;
}

const MATCH_TEXTS: Record<RegionCode, {
  title: string;
  filterSpecialty: string;
  filterLanguage: string;
  available: string;
  unavailable: string;
  nextAvailable: string;
  rating: string;
  select: string;
  allSpecialties: string[];
}> = {
  hk: {
    title: '輔導員匹配',
    filterSpecialty: '專長範疇',
    filterLanguage: '語言',
    available: '可預約',
    unavailable: '暫不可用',
    nextAvailable: '下次可用',
    rating: '評分',
    select: '選擇此輔導員',
    allSpecialties: ['焦慮', '抑鬱', '產後', '創傷', '青少年', '關係', '哀傷', '壓力管理'],
  },
  tw: {
    title: '心理師匹配',
    filterSpecialty: '專長領域',
    filterLanguage: '語言',
    available: '可預約',
    unavailable: '暫不可用',
    nextAvailable: '下次可用',
    rating: '評分',
    select: '選擇此心理師',
    allSpecialties: ['焦慮', '憂鬱', '產後', '創傷', '青少年', '關係', '哀傷', '壓力管理'],
  },
  gb: {
    title: 'Counsellor matching',
    filterSpecialty: 'Specialty',
    filterLanguage: 'Language',
    available: 'Available',
    unavailable: 'Unavailable',
    nextAvailable: 'Next available',
    rating: 'Rating',
    select: 'Select this counsellor',
    allSpecialties: ['Anxiety', 'Depression', 'Postnatal', 'Trauma', 'Youth', 'Relationships', 'Bereavement', 'Stress'],
  },
};

export function CounselorMatchSystem({ region }: { region: RegionCode }) {
  const texts = MATCH_TEXTS[region];
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // TODO: 接入 getAvailableCounselors API
  const mockCounselors: CounselorProfile[] = [
    {
      id: 'c1',
      displayName: region === 'gb' ? 'Dr. Sarah Mitchell' : region === 'tw' ? '林心理師' : '陳輔導員',
      certification: region === 'hk' ? 'HKPCA認證' : region === 'tw' ? '領證諮商心理師' : 'BACP Registered',
      specialties: [texts.allSpecialties[0], texts.allSpecialties[1]],
      languages: region === 'hk' ? ['粵語', '英語'] : region === 'tw' ? ['繁中'] : ['English'],
      available: true,
      rating: 4.8,
    },
    {
      id: 'c2',
      displayName: region === 'gb' ? 'James Wilson' : region === 'tw' ? '王心理師' : '李輔導員',
      certification: region === 'hk' ? 'HKPCA認證' : region === 'tw' ? '領證諮商心理師' : 'UKCP Registered',
      specialties: [texts.allSpecialties[3], texts.allSpecialties[4]],
      languages: region === 'hk' ? ['粵語'] : region === 'tw' ? ['繁中'] : ['English'],
      available: false,
      rating: 4.5,
      nextAvailable: region === 'gb' ? 'Tomorrow 10:00' : '明天 10:00',
    },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 700,
        color: 'var(--color-primary)',
        marginBottom: 'var(--space-6)',
      }}>
        {texts.title}
      </h2>

      {/* 筛选器 */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>
            {texts.filterSpecialty}
          </label>
          <select
            value={selectedSpecialty || ''}
            onChange={(e) => setSelectedSpecialty(e.target.value || null)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--color-background-alt)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-surface)',
            }}
          >
            <option value="">{region === 'gb' ? 'All' : '全部'}</option>
            {texts.allSpecialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>
            {texts.filterLanguage}
          </label>
          <select
            value={selectedLanguage || ''}
            onChange={(e) => setSelectedLanguage(e.target.value || null)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--color-background-alt)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-surface)',
            }}
          >
            <option value="">{region === 'gb' ? 'All' : '全部'}</option>
            {region === 'hk' && <option value="yue">粵語</option>}
            {region === 'hk' && <option value="en">英語</option>}
            {region === 'tw' && <option value="zh-TW">繁中</option>}
            {region === 'gb' && <option value="en-GB">English</option>}
          </select>
        </div>
      </div>

      {/* 辅导员列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {mockCounselors.map((counselor) => (
          <motion.div
            key={counselor.id}
            whileHover={{ y: -2 }}
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-soft)',
              border: counselor.available ? '2px solid var(--color-primary)' : '2px solid var(--color-background-alt)',
              opacity: counselor.available ? 1 : 0.7,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>
                  {counselor.displayName}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {counselor.certification}
                </div>
              </div>
              <span style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                background: counselor.available ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background-alt)',
                color: counselor.available ? 'var(--color-success)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
              }}>
                {counselor.available ? texts.available : texts.unavailable}
              </span>
            </div>

            {/* 专长标签 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {counselor.specialties.map((s) => (
                <span key={s} style={{
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-background)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary)',
                }}>{s}</span>
              ))}
            </div>

            {/* 语言+评分+选择 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {counselor.languages.join(', ')}
                {counselor.rating && <span style={{ marginLeft: 'var(--space-3)' }}>⭐ {counselor.rating}</span>}
              </div>
              {counselor.available ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {texts.select}
                </motion.button>
              ) : (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {texts.nextAvailable}: {counselor.nextAvailable}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// G-011: 真人→AI回接
// ═══════════════════════════════════════════════════

const HANDOFF_TEXTS: Record<RegionCode, { title: string; body: string; continueButton: string; feedbackPrompt: string }> = {
  hk: { title: '輔導結束', body: '多謝你同輔導員嘅對話。如果你想繼續傾，AI心理陪伴夥伴會陪你。', continueButton: '繼續同AI傾', feedbackPrompt: '對今次輔導有咩感受？' },
  tw: { title: '諮商結束', body: '感謝您與心理師的對話。如果您想繼續聊聊，AI心理陪伴夥伴會陪伴您。', continueButton: '繼續與AI聊聊', feedbackPrompt: '對本次諮商有什麼感受？' },
  gb: { title: 'Session ended', body: 'Thank you for your session. If you\'d like to continue chatting, your AI companion is here for you.', continueButton: 'Continue with AI', feedbackPrompt: 'How was your session?' },
};

export function CounselorHandoff({ region, onContinue }: { region: RegionCode; onContinue: () => void }) {
  const texts = HANDOFF_TEXTS[region];
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-8)', textAlign: 'center' }}
    >
      <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🌿</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>
        {texts.title}
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-6)' }}>
        {texts.body}
      </p>

      {/* 快速反馈 */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
          {texts.feedbackPrompt}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              onClick={() => setRating(star)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28 }}
            >
              {star <= rating ? '⭐' : '☆'}
            </motion.button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={region === 'gb' ? 'Optional feedback...' : '可選填回饋...'}
          rows={2}
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-background-alt)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>

      <motion.button
        onClick={onContinue}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary)',
          color: 'white',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        {texts.continueButton}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// G-012: 个人情绪档案 — 趋势图组件
// ═══════════════════════════════════════════════════

const EMOTION_TEXTS: Record<RegionCode, { title: string; period7d: string; period30d: string; period90d: string; improving: string; stable: string; declining: string; noData: string }> = {
  hk: { title: '情緒檔案', period7d: '7日', period30d: '30日', period90d: '90日', improving: '好轉中 📈', stable: '平穩 ➡️', declining: '需關注 📉', noData: '暫無數據' },
  tw: { title: '情緒檔案', period7d: '7天', period30d: '30天', period90d: '90天', improving: '好轉中 📈', stable: '平穩 ➡️', declining: '需關注 📉', noData: '暫無資料' },
  gb: { title: 'Emotional profile', period7d: '7 days', period30d: '30 days', period90d: '90 days', improving: 'Improving 📈', stable: 'Stable ➡️', declining: 'Needs attention 📉', noData: 'No data yet' },
};

export function EmotionProfileChart({ region }: { region: RegionCode }) {
  const texts = EMOTION_TEXTS[region];
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // TODO: 接入 getEmotionProfile API
  // 模拟7天数据
  const mockData = [
    { day: 'M', score: 45 },
    { day: 'T', score: 52 },
    { day: 'W', score: 48 },
    { day: 'T', score: 55 },
    { day: 'F', score: 60 },
    { day: 'S', score: 58 },
    { day: 'S', score: 62 },
  ];

  const maxScore = 100;
  const chartHeight = 120;
  const chartWidth = 300;

  return (
    <div style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)' }}>
          {texts.title}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {([['7d', texts.period7d], ['30d', texts.period30d], ['90d', texts.period90d]] as const).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                background: period === p ? 'var(--color-primary)' : 'transparent',
                color: period === p ? 'white' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                border: period === p ? 'none' : '1px solid var(--color-background-alt)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 简易SVG趋势图 */}
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1={0} y1={chartHeight - (y / maxScore) * chartHeight} x2={chartWidth} y2={chartHeight - (y / maxScore) * chartHeight} stroke="var(--color-background-alt)" strokeWidth={1} />
        ))}
        {/* 数据线 */}
        <polyline
          points={mockData.map((d, i) => `${(i / (mockData.length - 1)) * chartWidth},${chartHeight - (d.score / maxScore) * chartHeight}`).join(' ')}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 数据点 */}
        {mockData.map((d, i) => (
          <g key={i}>
            <circle
              cx={(i / (mockData.length - 1)) * chartWidth}
              cy={chartHeight - (d.score / maxScore) * chartHeight}
              r={4}
              fill="var(--color-primary)"
            />
            <text
              x={(i / (mockData.length - 1)) * chartWidth}
              y={chartHeight + 16}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-body)', fontSize: 10, fill: 'var(--color-text-muted)' }}
            >
              {d.day}
            </text>
          </g>
        ))}
      </svg>

      {/* 趋势标签 */}
      <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
        {texts.improving}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// G-013: 自助工具箱
// ═══════════════════════════════════════════════════

const TOOLS: Record<RegionCode, Array<{ id: string; type: string; icon: string; title: string; desc: string; minutes: number }>> = {
  hk: [
    { id: 'breathing', type: 'breathing', icon: '🫁', title: '4-7-8呼吸練習', desc: '快速平靜情緒嘅呼吸技巧', minutes: 3 },
    { id: 'meditation', type: 'meditation', icon: '🧘', title: '正念冥想', desc: '5分鐘靜觀練習', minutes: 5 },
    { id: 'cbt', type: 'cbt', icon: '🧠', title: '認知重構練習', desc: '識別同調整負面思維模式', minutes: 10 },
    { id: 'journal', type: 'journal', icon: '📝', title: '情緒日記', desc: '記低你嘅感受同行動', minutes: 5 },
  ],
  tw: [
    { id: 'breathing', type: 'breathing', icon: '🫁', title: '4-7-8呼吸練習', desc: '快速平靜情緒的呼吸技巧', minutes: 3 },
    { id: 'meditation', type: 'meditation', icon: '🧘', title: '正念冥想', desc: '5分鐘靜觀練習', minutes: 5 },
    { id: 'cbt', type: 'cbt', icon: '🧠', title: '認知重構練習', desc: '辨識並調整負面思考模式', minutes: 10 },
    { id: 'journal', type: 'journal', icon: '📝', title: '情緒日記', desc: '記錄您的感受與行動', minutes: 5 },
  ],
  gb: [
    { id: 'breathing', type: 'breathing', icon: '🫁', title: '4-7-8 Breathing', desc: 'A quick calming technique', minutes: 3 },
    { id: 'meditation', type: 'meditation', icon: '🧘', title: 'Mindfulness Meditation', desc: '5-minute guided practice', minutes: 5 },
    { id: 'cbt', type: 'cbt', icon: '🧠', title: 'Cognitive Restructuring', desc: 'Identify and adjust negative thought patterns', minutes: 10 },
    { id: 'journal', type: 'journal', icon: '📝', title: 'Mood Journal', desc: 'Record your feelings and actions', minutes: 5 },
  ],
};

export function SelfHelpToolbox({ region }: { region: RegionCode }) {
  const tools = TOOLS[region];
  const title = region === 'gb' ? 'Self-help toolkit' : '自助工具箱';

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-6)' }}>
        🧰 {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        {tools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -4, boxShadow: 'var(--shadow-medium)' }}
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-soft)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 'var(--space-3)' }}>{tool.icon}</div>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              {tool.title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
              {tool.desc}
            </p>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-background)',
            }}>
              ⏱ {tool.minutes} min
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// G-014: 当地支付集成（UI组件）
// ═══════════════════════════════════════════════════

const PAYMENT_TEXTS: Record<RegionCode, { title: string; selectMethod: string; payButton: string }> = {
  hk: { title: '付款', selectMethod: '選擇付款方式', payButton: '立即付款' },
  tw: { title: '付款', selectMethod: '選擇付款方式', payButton: '立即付款' },
  gb: { title: 'Payment', selectMethod: 'Select payment method', payButton: 'Pay now' },
};

const PAYMENT_METHODS: Record<RegionCode, Array<{ id: string; name: string; icon: string }>> = {
  hk: [
    { id: 'stripe', name: '信用卡 (Stripe)', icon: '💳' },
    { id: 'fps', name: '轉數快 (FPS)', icon: '🔄' },
  ],
  tw: [
    { id: 'credit_card', name: '信用卡', icon: '💳' },
    { id: 'line_pay', name: 'Line Pay', icon: '💚' },
  ],
  gb: [
    { id: 'stripe', name: 'Card payment (Stripe)', icon: '💳' },
  ],
};

export function PaymentSelector({ region, amount, onPayment }: { region: RegionCode; amount: string; onPayment: (methodId: string) => void }) {
  const texts = PAYMENT_TEXTS[region];
  const methods = PAYMENT_METHODS[region];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-soft)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }}>
        {texts.title}
      </h3>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
        {amount}
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          {texts.selectMethod}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {methods.map((m) => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: selected === m.id ? 'rgba(45, 90, 74, 0.08)' : 'var(--color-background)',
              border: `2px solid ${selected === m.id ? 'var(--color-primary)' : 'transparent'}`,
              cursor: 'pointer',
            }}>
              <input type="radio" name="payment" value={m.id} checked={selected === m.id} onChange={() => setSelected(m.id)} style={{ accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>{m.name}</span>
            </label>
          ))}
        </div>
      </div>
      <motion.button
        onClick={() => selected && onPayment(selected)}
        disabled={!selected}
        whileHover={{ scale: selected ? 1.02 : 1 }}
        whileTap={{ scale: selected ? 0.98 : 1 }}
        style={{
          width: '100%', padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: selected ? 'var(--color-secondary)' : 'var(--color-background-alt)',
          color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-lg)', fontWeight: 700,
          border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        {texts.payButton}
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// G-021: 投诉反馈
// ═══════════════════════════════════════════════════

const FEEDBACK_TEXTS: Record<RegionCode, {
  title: string; ratingLabel: string; categoryLabel: string;
  categories: Record<string, string>; commentPlaceholder: string;
  submit: string; highRiskNote: string; success: string;
}> = {
  hk: {
    title: '意見回饋', ratingLabel: '評分', categoryLabel: '類別',
    categories: { ai_quality: 'AI對話質素', counselor_behavior: '輔導員行為', technical: '技術故障', other: '其他' },
    commentPlaceholder: '請描述你嘅經驗（可選）...',
    submit: '提交', highRiskNote: '涉及輔導員行為或數據問題嘅回饋將自動升級至合規團隊',
    success: '感謝你嘅回饋！我哋會喺48小時內回覆。',
  },
  tw: {
    title: '意見回饋', ratingLabel: '評分', categoryLabel: '類別',
    categories: { ai_quality: 'AI對話品質', counselor_behavior: '心理師行為', technical: '技術故障', other: '其他' },
    commentPlaceholder: '請描述您的經驗（可選）...',
    submit: '提交', highRiskNote: '涉及心理師行為或資料問題的回饋將自動升級至合規團隊',
    success: '感謝您的回饋！我們會在48小時內回覆。',
  },
  gb: {
    title: 'Feedback', ratingLabel: 'Rating', categoryLabel: 'Category',
    categories: { ai_quality: 'AI quality', counselor_behavior: 'Counsellor behavior', technical: 'Technical issue', other: 'Other' },
    commentPlaceholder: 'Describe your experience (optional)...',
    submit: 'Submit', highRiskNote: 'Feedback about counsellor behavior or data issues will be automatically escalated to the compliance team',
    success: 'Thank you for your feedback! We will respond within 48 hours.',
  },
};

export function FeedbackForm({ region, sessionId }: { region: RegionCode; sessionId: string }) {
  const texts = FEEDBACK_TEXTS[region];
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('other');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isHighRisk = category === 'counselor_behavior';

  const handleSubmit = () => {
    // TODO: 调用 submitFeedback API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <span style={{ fontSize: 48 }}>✅</span>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-primary)', fontWeight: 600, marginTop: 'var(--space-4)' }}>
          {texts.success}
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-5)', maxWidth: 480, margin: '0 auto' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-5)' }}>
        {texts.title}
      </h3>

      {/* 评分 */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          {texts.ratingLabel}
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button key={star} onClick={() => setRating(star)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32 }}>
              {star <= rating ? '⭐' : '☆'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 类别 */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          {texts.categoryLabel}
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-background-alt)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', background: 'var(--color-surface)' }}>
          {Object.entries(texts.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* 高风险提示 */}
      {isHighRisk && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-danger)', marginBottom: 'var(--space-4)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-danger-dark)' }}>
            ⚠️ {texts.highRiskNote}
          </p>
        </motion.div>
      )}

      {/* 评论 */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={texts.commentPlaceholder} rows={4}
          style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-background-alt)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', resize: 'none', outline: 'none' }} />
      </div>

      <motion.button onClick={handleSubmit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        {texts.submit}
      </motion.button>
    </div>
  );
}
