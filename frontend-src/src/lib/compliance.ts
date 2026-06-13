// ===== Mindlab Compliance & Brand Filter Utilities =====
// 品牌用语合规工具 — 黑白名单过滤、合规标注、各地区特殊用语

import type { RegionCode } from '@/lib/sessionStore';

// ── 全球通用黑名单（合规审查报告 §7.1） ──
const GLOBAL_BLACKLIST_EN = [
  'diagnose', 'treat', 'cure', 'prescribe', 'therapy', 'patient', 'clinical',
  '100% effective', 'guaranteed cure', 'always works', 'never fails',
  'replaces therapists', 'better than therapy', 'AI therapy',
  'mentally ill', 'crazy', 'insane', 'psycho',
  'you must talk to us now', 'don\'t delay or else',
];

const GLOBAL_BLACKLIST_ZH = [
  '诊断', '治疗', '治愈', '处方', '患者', '临床',
  '保证治愈', '100%有效', '绝对有效', '永不失败',
  'AI取代心理师', '比治疗更好', 'AI治疗',
  '你有精神病', '疯子', '变态',
  '你必须立刻跟我们谈', '不然后果严重',
];

// ── 地区特殊黑名单（合规审查报告 §7.3） ──
const REGION_BLACKLIST: Record<RegionCode, string[]> = {
  hk: [], // 🇭🇰 使用「辅导员」而非「心理师」；使用「支援」而非「支持」（港式习惯）
  tw: ['諮詢'], // 🇹🇼 禁用「諮詢」替代「諮商」— 心理师法法定用词
  gb: ['wellness', 'therapist'], // 🇬🇧 禁用「wellness」用「wellbeing」；禁用「therapist」用「counsellor」
};

// ── 全球通用白名单（合规审查报告 §7.2） ──
export const BRAND_WHITELIST: Record<RegionCode, {
  serviceName: string;
  aiName: string;
  counselorName: string;
  boundary: string;
  crisisTerm: string;
}> = {
  hk: {
    serviceName: '心理輔導與情緒支援服務',
    aiName: 'AI心理陪伴夥伴',
    counselorName: '認證心理輔導員（HKPCA認證）',
    boundary: '本服務為心理支持，非醫療診斷或治療',
    crisisTerm: '危機支援',
  },
  tw: {
    serviceName: '心理諮商與情緒支持服務',
    aiName: 'AI心理陪伴夥伴',
    counselorName: '諮商心理師',
    boundary: '本服務為心理支持，非醫療診斷或治療',
    crisisTerm: '危機支援',
  },
  gb: {
    serviceName: 'Mental wellbeing support service',
    aiName: 'AI mental wellbeing companion',
    counselorName: 'Wellbeing counsellor (BACP/UKCP registered)',
    boundary: 'Mental wellbeing support, not medical treatment',
    crisisTerm: 'Crisis support',
  },
};

// ── AI回复合规标注常量 ──
export const AI_DISCLAIMER: Record<RegionCode, string> = {
  hk: 'AI生成內容，僅供參考',
  tw: 'AI生成內容，僅供參考',
  gb: 'AI-generated content, for reference only',
};

// ── 服务边界声明 (G-007) ──
export const SERVICE_BOUNDARY: Record<RegionCode, { start: string; end: string }> = {
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

// ── 品牌Slogan ──
export const BRAND_SLOGAN: Record<RegionCode, string> = {
  hk: '陪住你，每一刻',
  tw: '陪伴你，走过去',
  gb: 'Always here for you',
};

// ── 各地区辅导员称谓规范 ──
export const COUNSELOR_TITLE: Record<RegionCode, { display: string; cert: string }> = {
  hk: { display: '認證心理輔導員', cert: 'HKPCA認證' },
  tw: { display: '諮商心理師', cert: '領證諮商心理師' },
  gb: { display: 'Wellbeing counsellor', cert: 'BACP/UKCP registered' },
};

// ── 未成年人年龄门槛 (CR-010, 待P0修复确认) ──
// 🇭🇰 16岁以下需监护人同意
// 🇹🇼 18岁以下需监护人同意
// 🇬🇧 13岁以下须家长同意；13-17岁可自行同意但须确保理解能力
export const MINOR_AGE: Record<RegionCode, number> = {
  hk: 16,
  tw: 18,
  gb: 13,
};

// ── 危机热线资源 ──
export const CRISIS_HOTLINES: Record<RegionCode, Array<{ name: string; number: string; desc: string }>> = {
  hk: [
    { name: '撒瑪利亞會', number: '2389 2222', desc: '24小時情緒支援熱線' },
    { name: '生命熱線', number: '2382 0000', desc: '24小時自殺危機支援' },
    { name: '醫管局精神健康專線', number: '2466 7350', desc: '精神健康評估及轉介' },
  ],
  tw: [
    { name: '1925安心專線', number: '1925', desc: '24小時安心服務' },
    { name: '1995生命線', number: '1995', desc: '24小時協談專線' },
    { name: '張老師專線', number: '0800-788-995', desc: '輔導與諮商服務' },
  ],
  gb: [
    { name: 'Samaritans', number: '116 123', desc: '24/7 free listening service' },
    { name: 'NHS Mental Health', number: '111', desc: 'Non-emergency medical advice' },
    { name: 'Shout', number: '85258', desc: '24/7 text-based crisis support' },
  ],
};

// ── 品牌用语过滤函数 ──
export interface FilterResult {
  clean: boolean;
  violations: Array<{ word: string; category: string }>;
}

export function filterBrandCompliance(text: string, region: RegionCode): FilterResult {
  const violations: Array<{ word: string; category: string }> = [];
  const lowerText = text.toLowerCase();

  // 全球英文黑名单
  for (const word of GLOBAL_BLACKLIST_EN) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push({ word, category: 'global_en' });
    }
  }

  // 全球中文黑名单
  for (const word of GLOBAL_BLACKLIST_ZH) {
    if (text.includes(word)) {
      violations.push({ word, category: 'global_zh' });
    }
  }

  // 地区特殊黑名单
  for (const word of REGION_BLACKLIST[region]) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push({ word, category: `region_${region}` });
    }
  }

  return { clean: violations.length === 0, violations };
}

// ── 安全输出包装：AI回复自动附加合规标注 ──
export function wrapAIResponse(content: string, region: RegionCode): string {
  return `${content}\n\n---\n*${AI_DISCLAIMER[region]}*`;
}

// ── 获取地区化的支付方式文案 ──
export const PAYMENT_METHODS: Record<RegionCode, Array<{ id: string; name: string; currency: string }>> = {
  hk: [
    { id: 'stripe', name: '信用卡 (Stripe)', currency: 'HKD' },
    { id: 'fps', name: '轉數快 (FPS)', currency: 'HKD' },
  ],
  tw: [
    { id: 'credit_card', name: '信用卡', currency: 'TWD' },
    { id: 'line_pay', name: 'Line Pay', currency: 'TWD' },
  ],
  gb: [
    { id: 'stripe', name: 'Card payment (Stripe)', currency: 'GBP' },
  ],
};

// ── 定价信息 ──
export const PRICING: Record<RegionCode, {
  aiBasic: string;
  aiPremium: { monthly: string; quarterly: string; yearly: string };
  counselor: string;
}> = {
  hk: {
    aiBasic: '免費',
    aiPremium: { monthly: 'HK$88/月', quarterly: 'HK$228/季', yearly: 'HK$788/年' },
    counselor: 'HK$500/次',
  },
  tw: {
    aiBasic: '免費',
    aiPremium: { monthly: 'NT$299/月', quarterly: 'NT$799/季', yearly: 'NT$2,499/年' },
    counselor: 'NT$1,500-3,000/次',
  },
  gb: {
    aiBasic: 'Free',
    aiPremium: { monthly: '£9.99/mo', quarterly: '£24.99/qtr', yearly: '£79.99/yr' },
    counselor: '£50-80/session',
  },
};
