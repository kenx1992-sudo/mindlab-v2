// ===== Mindlab 地区配置适配层 =====
// 三地本地化适配：Slogan/支付/热线/辅导员称谓/服务边界/文化适配

import type { RegionCode } from '@/lib/sessionStore';

// ── 地区完整配置接口 ──
export interface RegionConfig {
  code: RegionCode;
  flag: string;
  locale: string;
  languagePreference: string;
  dataLocation: string;
  currency: string;
  currencySymbol: string;

  // 品牌
  brandSlogan: string;
  brandSoulLine: string; // 品牌灵魂句

  // AI
  aiName: string;
  aiTone: string;

  // 辅导员
  counselorTitle: string;
  counselorCert: string;
  counselorRegulatory: string;

  // 服务边界
  serviceBoundaryPhrase: string;
  serviceName: string;

  // 危机热线
  crisisHotlines: Array<{ name: string; number: string; desc: string }>;

  // 支付
  paymentMethods: Array<{ id: string; name: string; icon: string }>;

  // 定价
  pricing: {
    aiBasic: string;
    aiPremiumMonthly: string;
    aiPremiumQuarterly: string;
    aiPremiumYearly: string;
    counselorPerSession: string;
  };

  // 未成年人
  minorAgeThreshold: number;
  minorRegulatoryNote: string;

  // 合规
  dataProtectionLaw: string;
  dpiaRequired: boolean;
  dpoRequired: boolean;
  dataBreachNotificationHours: number;

  // 文化
  culturalNotes: string[];
  aiCulturalAdaptation: string;
}

// ── 完整三地配置 ──
export const REGION_CONFIGS: Record<RegionCode, RegionConfig> = {
  hk: {
    code: 'hk',
    flag: '🇭🇰',
    locale: 'zh-HK',
    languagePreference: 'yue',
    dataLocation: '香港',
    currency: 'HKD',
    currencySymbol: 'HK$',

    brandSlogan: '陪住你，每一刻',
    brandSoulLine: '一個不會缺席的陪伴',

    aiName: 'AI心理陪伴夥伴',
    aiTone: '溫暖、共情、港式口語、無評判',

    counselorTitle: '認證心理輔導員',
    counselorCert: 'HKPCA認證',
    counselorRegulatory: '香港目前無心理輔導員法定註冊制度，HKPCA為行業自律組織',

    serviceBoundaryPhrase: '本服務為心理支持，非醫療診斷或治療',
    serviceName: '心理輔導與情緒支援服務',

    crisisHotlines: [
      { name: '撒瑪利亞會', number: '2389 2222', desc: '24小時情緒支援熱線' },
      { name: '生命熱線', number: '2382 0000', desc: '24小時自殺危機支援' },
      { name: '醫管局精神健康專線', number: '2466 7350', desc: '精神健康評估及轉介' },
    ],

    paymentMethods: [
      { id: 'stripe', name: '信用卡 (Stripe)', icon: '💳' },
      { id: 'fps', name: '轉數快 (FPS)', icon: '🔄' },
    ],

    pricing: {
      aiBasic: '免費',
      aiPremiumMonthly: 'HK$88/月',
      aiPremiumQuarterly: 'HK$228/季',
      aiPremiumYearly: 'HK$788/年',
      counselorPerSession: 'HK$500/次',
    },

    minorAgeThreshold: 16, // 待CR-010确认
    minorRegulatoryNote: '16歲以下需監護人同意；《預防殘酷對待兒童條例》覆蓋16歲以下',

    dataProtectionLaw: '《個人資料（私隱）條例》第486章 (PDPO)',
    dpiaRequired: false,
    dpoRequired: false,
    dataBreachNotificationHours: 72, // 建議及時通知

    culturalNotes: [
      '面子文化→匿名需求強',
      '粵語口語化AI對話更自然',
      '使用「支援」而非「支持」（港式習慣）',
      '使用「辅导员」而非「心理师」避免與HKPS混淆',
    ],
    aiCulturalAdaptation: '粵語口語為主，混合英文術語自然；語氣親切不拘謹；重視匿名性',
  },

  tw: {
    code: 'tw',
    flag: '🇹🇼',
    locale: 'zh-TW',
    languagePreference: 'zh-TW',
    dataLocation: '臺灣',
    currency: 'TWD',
    currencySymbol: 'NT$',

    brandSlogan: '陪伴你，走过去',
    brandSoulLine: '一個不會缺席的陪伴',

    aiName: 'AI心理陪伴夥伴',
    aiTone: '溫暖、共情、繁中書面語、無評判',

    counselorTitle: '諮商心理師',
    counselorCert: '領證諮商心理師（心理師法法定）',
    counselorRegulatory: '《心理師法》強制註冊，須持有有效心理師證書',

    serviceBoundaryPhrase: '本服務為心理支持，非醫療診斷或治療',
    serviceName: '心理諮商與情緒支持服務',

    crisisHotlines: [
      { name: '1925安心專線', number: '1925', desc: '24小時安心服務' },
      { name: '1995生命線', number: '1995', desc: '24小時協談專線' },
      { name: '張老師專線', number: '0800-788-995', desc: '輔導與諮商服務' },
    ],

    paymentMethods: [
      { id: 'credit_card', name: '信用卡', icon: '💳' },
      { id: 'line_pay', name: 'Line Pay', icon: '💚' },
    ],

    pricing: {
      aiBasic: '免費',
      aiPremiumMonthly: 'NT$299/月',
      aiPremiumQuarterly: 'NT$799/季',
      aiPremiumYearly: 'NT$2,499/年',
      counselorPerSession: 'NT$1,500-3,000/次',
    },

    minorAgeThreshold: 18, // 待CR-010确认
    minorRegulatoryNote: '18歲以下需監護人同意；兒少權法保障18歲以下；個資法13-18歲特別規定',

    dataProtectionLaw: '《個人資料保護法》（個資法）',
    dpiaRequired: false,
    dpoRequired: false,
    dataBreachNotificationHours: 72,

    culturalNotes: [
      '求助文化低→需降低門檻',
      '使用「諮商」而非「諮詢」（心理師法法定用詞）',
      '使用「心理師」而非「輔導員」',
      '繁中本地用語差異需注意',
    ],
    aiCulturalAdaptation: '繁中書面語，語氣溫暖但專業；避免「諮詢」用「諮商」；衛福部方案銜接語境',
  },

  gb: {
    code: 'gb',
    flag: '🇬🇧',
    locale: 'en-GB',
    languagePreference: 'en-GB',
    dataLocation: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',

    brandSlogan: 'Always here for you',
    brandSoulLine: 'A companion that never leaves',

    aiName: 'AI mental wellbeing companion',
    aiTone: 'Warm, empathetic, British English, non-judgemental',

    counselorTitle: 'Wellbeing counsellor',
    counselorCert: 'BACP/UKCP registered',
    counselorRegulatory: 'Psychologists: HCPC statutory registration; Counsellors: BACP/UKCP voluntary registration',

    serviceBoundaryPhrase: 'Mental wellbeing support, not medical treatment',
    serviceName: 'Mental wellbeing support service',

    crisisHotlines: [
      { name: 'Samaritans', number: '116 123', desc: '24/7 free listening service' },
      { name: 'NHS Mental Health', number: '111', desc: 'Non-emergency medical advice' },
      { name: 'Shout', number: '85258', desc: '24/7 text-based crisis support' },
    ],

    paymentMethods: [
      { id: 'stripe', name: 'Card payment (Stripe)', icon: '💳' },
    ],

    pricing: {
      aiBasic: 'Free',
      aiPremiumMonthly: '£9.99/mo',
      aiPremiumQuarterly: '£24.99/qtr',
      aiPremiumYearly: '£79.99/yr',
      counselorPerSession: '£50-80/session',
    },

    minorAgeThreshold: 13, // 待CR-010确认
    minorRegulatoryNote: 'Under 13: parental consent required; 13-17: own consent with capacity test; Safeguarding duty covers all under 18',

    dataProtectionLaw: 'UK GDPR + Data Protection Act 2018',
    dpiaRequired: true, // 强制
    dpoRequired: true, // 强制
    dataBreachNotificationHours: 72, // 72h内通知用户+ICO

    culturalNotes: [
      '英式含蓄→偏好异步沟通',
      '文字为主，No eye contact required',
      'NHS体系互补定位，不得暗示替代NHS',
      '使用「wellbeing」而非「wellness」',
      '使用「counsellor」而非「therapist」(CQC风险)',
    ],
    aiCulturalAdaptation: 'British English; "wellbeing" not "wellness"; reserved empathetic tone; NHS-complementary framing; Online Safety Act compliance layer',
  },
};

// ── 根据请求头/URL/浏览器语言自动检测地区 ──
export function detectRegion(headers?: { acceptLanguage?: string; pathname?: string }): RegionCode {
  // URL路径优先
  if (headers?.pathname) {
    const match = headers.pathname.match(/^\/(hk|tw|gb)/);
    if (match) return match[1] as RegionCode;
  }

  // Accept-Language检测
  if (headers?.acceptLanguage) {
    const lang = headers.acceptLanguage.toLowerCase();
    if (lang.includes('zh-hk') || lang.includes('zh-yue') || lang.includes('yue')) return 'hk';
    if (lang.includes('zh-tw') || lang.includes('zh-hant')) return 'tw';
    if (lang.includes('en-gb') || lang.includes('en-uk')) return 'gb';
  }

  // 默认香港（P0首发市场）
  return 'hk';
}

// ── 获取地区配置 ──
export function getRegionConfig(region: RegionCode): RegionConfig {
  return REGION_CONFIGS[region];
}

// ── 地区货币格式化 ──
export function formatPrice(amount: number, region: RegionCode): string {
  const config = REGION_CONFIGS[region];
  return new Intl.NumberFormat(config.locale === 'en-GB' ? 'en-GB' : config.locale === 'zh-TW' ? 'zh-TW' : 'zh-HK', {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

// ── 地区日期格式化 ──
export function formatDate(date: Date, region: RegionCode): string {
  const config = REGION_CONFIGS[region];
  const locale = config.locale === 'en-GB' ? 'en-GB' : config.locale === 'zh-TW' ? 'zh-TW' : 'zh-HK';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// ── 地区电话号码URI ──
export function getTelUri(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, '')}`;
}
