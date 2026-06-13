/**
 * 16 MBTI · 陪伴者類型 + 每型 3 位「曾走過低谷的名人」
 * 名單與遴選標準見 mbtiValleyMentors.js
 */
import {
  VALLEY_MENTOR_FIGURES_BY_TYPE,
  FIGURE_NAME_EN,
  VALLEY_MENTOR_REQUIRED_CRITERIA,
  VALLEY_MENTOR_SUGGESTED_CRITERIA,
  VALLEY_MENTOR_REQUIRED_CRITERIA_EN,
  VALLEY_MENTOR_SUGGESTED_CRITERIA_EN,
} from '@/lib/mbtiValleyMentors';
import {
  getPresetById,
  buildPresetLlmContext,
  buildCustomLlmContext,
} from '@/lib/presetCompanions';
import { localeToContextOptions, normalizeLanguage, replyStyleInstruction } from '@/lib/locale';

export {
  FIGURE_NAME_EN,
  VALLEY_MENTOR_REQUIRED_CRITERIA,
  VALLEY_MENTOR_SUGGESTED_CRITERIA,
  VALLEY_MENTOR_REQUIRED_CRITERIA_EN,
  VALLEY_MENTOR_SUGGESTED_CRITERIA_EN,
};

export const MBTI_DISCLAIMER =
  '下列公眾人物僅為坊間常見嘅 MBTI 類型參考，未經本人或官方認證；陪伴對話由 AI 以類型語氣進行，唔扮演任何真人。';
export const MBTI_DISCLAIMER_EN =
  'Public-figure references are informal MBTI community guesses, not verified. Companion chat uses an MBTI-style tone and does not role-play any real person.';

/** 揀 MBTI 陪伴者時，名人參考區塊說明 */
export const MBTI_POSSIBLE_CELEBRITIES_NOTE =
  '坊間常被歸類為此類型嘅公眾人物（僅供參考，類型學說具爭議，亦唔代表該名人本人立場）。';
export const MBTI_POSSIBLE_CELEBRITIES_NOTE_EN =
  'Public figures often guessed to be this type (for reference only; typology is debated and does not represent the person’s own view).';

/** 「只用類型」模式嘅 figure id（唔對應具體歷史人物） */
export const MBTI_PLAIN_FIGURE_ID = '__plain_mbti__';
export const MBTI_CUSTOM_FIGURE_ID = '__custom_mbti__';

export const MBTI_ORDER = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

const MBTI_TYPE_META = {
  ISTJ: {
    nameZh: '物流師',
    nameEn: 'Logistician',
    tagline: '穩重可靠 · 條理清晰',
    taglineEn: 'Steady · Structured · Reliable',
    tone: '務實、有條理，用人生低谷中學到嘅紀律同步驟陪你行過難關。',
    toneEn: 'Practical and structured — steady, step-by-step support without pressure.',
  },
  ISFJ: {
    nameZh: '守衛者',
    nameEn: 'Defender',
    tagline: '細心守護 · 默默陪伴',
    taglineEn: 'Caring · Gentle · Attentive',
    tone: '記得細節，用自身曾服務、受苦嘅故事輕輕陪你。',
    toneEn: 'Noticing small details and offering quiet, caring companionship.',
  },
  INFJ: {
    nameZh: '提倡者',
    nameEn: 'Advocate',
    tagline: '深度共感 · 溫柔堅定',
    taglineEn: 'Deep empathy · Calm strength',
    tone: '能聽見言外之意，用曾受苦仍選擇愛同公義嘅故事陪你。',
    toneEn: 'Reading between the lines with gentle conviction and meaning-focused support.',
  },
  INTJ: {
    nameZh: '建築師',
    nameEn: 'Architect',
    tagline: '洞察本質 · 清晰方向',
    taglineEn: 'Insightful · Clear direction',
    tone: '用曾迷失、被誤解嘅經歷，幫你睇清問題核心。',
    toneEn: 'Clarifying the core of what’s happening, with calm, grounded guidance.',
  },
  ISTP: {
    nameZh: '鑒賞家',
    nameEn: 'Virtuoso',
    tagline: '冷靜應對 · 少說多做',
    taglineEn: 'Calm · Practical · Hands-on',
    tone: '唔多廢話，用逆境中親手解決問題嘅故事陪你穩住。',
    toneEn: 'Calm, minimal words — helping you steady yourself with practical next steps.',
  },
  ISFP: {
    nameZh: '探險家',
    nameEn: 'Adventurer',
    tagline: '感性柔和 · 活在當下',
    taglineEn: 'Gentle · Present · Feeling-led',
    tone: '用藝術同真我表達渡過黑暗嘅故事，陪你感受當下。',
    toneEn: 'Soft, present support — helping you feel what’s here without judgment.',
  },
  INFP: {
    nameZh: '調停者',
    nameEn: 'Mediator',
    tagline: '理想溫柔 · 重視價值',
    taglineEn: 'Kind ideals · Values-first',
    tone: '尊重你嘅價值，用文學同理想中跌落谷底再站起嘅故事陪你。',
    toneEn: 'Values-respecting, gentle companionship with thoughtful reframes.',
  },
  INTP: {
    nameZh: '邏輯學家',
    nameEn: 'Logician',
    tagline: '好奇分析 · 邏輯清晰',
    taglineEn: 'Curious · Analytical · Clear',
    tone: '用追問同失敗實驗嘅故事，陪你理性梳理情緒。',
    toneEn: 'Careful questions and clear thinking to help you untangle feelings.',
  },
  ESTP: {
    nameZh: '企業家',
    nameEn: 'Entrepreneur',
    tagline: '直爽行動 · 面對現實',
    taglineEn: 'Direct · Action-oriented',
    tone: '爽快直接，用硬漢式跌倒再起故事拉你返現實。',
    toneEn: 'Direct and steady — helping you move from stuck to action, one step at a time.',
  },
  ESFP: {
    nameZh: '表演者',
    nameEn: 'Entertainer',
    tagline: '開朗溫暖 · 點亮心情',
    taglineEn: 'Warm · Uplifting · Human',
    tone: '用舞台背後脆弱同復原嘅故事，令你唔使扮堅強。',
    toneEn: 'Warm and uplifting — making it safe to be unfiltered and real.',
  },
  ENFP: {
    nameZh: '競選者',
    nameEn: 'Campaigner',
    tagline: '熱情好奇 · 看見可能',
    taglineEn: 'Curious · Hopeful possibilities',
    tone: '充滿可能性，用年輕面對極權同絕望嘅故事點亮你。',
    toneEn: 'Kind, curious, possibility-seeing support without pushing optimism.',
  },
  ENTP: {
    nameZh: '辯論家',
    nameEn: 'Debater',
    tagline: '機智靈活 · 換角度想',
    taglineEn: 'Witty · Flexible perspectives',
    tone: '用機智同失敗實驗，幫你鬆動卡住嘅想法。',
    toneEn: 'Playful reframes and new angles to loosen stuck thoughts — gently.',
  },
  ESTJ: {
    nameZh: '總經理',
    nameEn: 'Executive',
    tagline: '有條不紊 · 推動前行',
    taglineEn: 'Structured · Forward-moving',
    tone: '幫你訂小目標，用戰時領導同紀律渡低谷嘅故事。',
    toneEn: 'Clear structure and small goals — steady forward movement without pressure.',
  },
  ESFJ: {
    nameZh: '執政官',
    nameEn: 'Consul',
    tagline: '關懷社群 · 重視連結',
    taglineEn: 'Caring · Connection-focused',
    tone: '重視關係，用公眾人物背後家庭同壓力嘅故事陪你。',
    toneEn: 'Warm connection and gentle check-ins, helping you feel supported.',
  },
  ENFJ: {
    nameZh: '主人公',
    nameEn: 'Protagonist',
    tagline: '鼓舞人心 · 看見你的光',
    taglineEn: 'Encouraging · Sees your strengths',
    tone: '善於鼓勵，用監禁同迫害中仍選希望嘅故事。',
    toneEn: 'Encouraging and steady — helping you reconnect with your strengths and values.',
  },
  ENTJ: {
    nameZh: '指揮官',
    nameEn: 'Commander',
    tagline: '果斷清晰 · 直面挑戰',
    taglineEn: 'Decisive · Clear priorities',
    tone: '直接幫你排優先，用敗仗、被逐、東山再起嘅故事。',
    toneEn: 'Clear priorities and pragmatic steps — supportive, not harsh.',
  },
};

export const MBTI_TYPES = Object.fromEntries(
  MBTI_ORDER.map((code) => [
    code,
    {
      code,
      ...MBTI_TYPE_META[code],
      figures: VALLEY_MENTOR_FIGURES_BY_TYPE[code] || [],
    },
  ])
);

/** 根據用戶 MBTI 推薦陪伴者類型（官配 / 互補）— 陪伴者可以同用戶類型不同 */
export const MBTI_COMPANION_RECOMMENDATIONS = {
  ISTJ: [
    { code: 'ESFP', label: '官配', labelEn: 'Best match', reason: '一個穩陣一個帶氣氛，互補日常節奏', reasonEn: 'A steady anchor plus a warm energiser — balances the pace of daily life.' },
    { code: 'ESTP', label: '互補', labelEn: 'Complement', reason: '幫你由規劃走入行動', reasonEn: 'Helps you move from planning into action.' },
    { code: 'ISFJ', label: '同溫', labelEn: 'Similar', reason: '同樣重承諾，傾計節奏接近', reasonEn: 'Similar rhythm and shared reliability.' },
  ],
  ISFJ: [
    { code: 'ESTP', label: '官配', reason: '你守護細節，佢幫你放鬆同試新嘢' },
    { code: 'ESFP', label: '互補', reason: '溫暖陪伴，鼓勵你為自己留位' },
    { code: 'INFJ', label: '深度', reason: '一齊談感受同意義' },
  ],
  INFJ: [
    { code: 'ENTP', label: '官配', reason: '你重內在，佢幫你打開可能性' },
    { code: 'ENFP', label: '互補', reason: '理想主義拍檔，互相看見潛能' },
    { code: 'INTJ', label: '同頻', reason: '深度思考，少廢話' },
  ],
  INTJ: [
    { code: 'ENFP', label: '官配', reason: '你見結構，佢見人同可能性' },
    { code: 'ENTP', label: '互補', reason: '智力拍檔，辯論中成長' },
    { code: 'INFJ', label: '深度', reason: '長線視野，重視意義' },
  ],
  ISTP: [
    { code: 'ESFJ', label: '官配', reason: '你獨立解決，佢幫你連結感受' },
    { code: 'ESTJ', label: '互補', reason: '實際問題一齊拆解' },
    { code: 'INTP', label: '同溫', reason: '少說多做，畀你空間' },
  ],
  ISFP: [
    { code: 'ESTJ', label: '官配', reason: '你重感受，佢幫你落地執行' },
    { code: 'ENTJ', label: '互補', reason: '鼓勵你把才華變成行動' },
    { code: 'INFP', label: '同頻', reason: '尊重價值，唔施壓' },
  ],
  INFP: [
    { code: 'ENTJ', label: '官配', reason: '你重理想，佢幫你見到下一步' },
    { code: 'ENFJ', label: '互補', reason: '溫柔推你走出內在世界' },
    { code: 'INFJ', label: '深度', reason: '價值觀相近，肯聽你講' },
  ],
  INTP: [
    { code: 'ENTJ', label: '官配', reason: '你分析，佢幫你收斂成行動' },
    { code: 'ENFJ', label: '互補', reason: '連結邏輯同人心' },
    { code: 'INTJ', label: '同頻', reason: '尊重思考空間' },
  ],
  ESTP: [
    { code: 'ISFJ', label: '官配', reason: '你快行動，佢幫你照顧細節同感受' },
    { code: 'ISTJ', label: '互補', reason: '穩住節奏，唔使你獨扛' },
    { code: 'ESFP', label: '活力', reason: '一齊活在當下' },
  ],
  ESFP: [
    { code: 'ISTJ', label: '官配', reason: '你帶歡樂，佢幫你定錨' },
    { code: 'ISFJ', label: '互補', reason: '被細心看見的需要' },
    { code: 'ENFP', label: '同溫', reason: '輕鬆、唔評價' },
  ],
  ENFP: [
    { code: 'INTJ', label: '官配', reason: '你發散熱情，佢幫你聚焦' },
    { code: 'INFJ', label: '互補', reason: '深度理解你嘅理想' },
    { code: 'ENTP', label: '活力', reason: '一齊探索新可能' },
  ],
  ENTP: [
    { code: 'INFJ', label: '官配', reason: '你外放思辨，佢幫你接住情緒同意義' },
    { code: 'INTJ', label: '神仙組', reason: '獨立思考，可以深度辯論' },
    { code: 'ENFP', label: '活力拍檔', reason: '一齊腦洞，唔悶' },
  ],
  ESTJ: [
    { code: 'ISFP', label: '官配', reason: '你重效率，佢提醒你慢下感受' },
    { code: 'ISTP', label: '互補', reason: '實事求是，少講廢話' },
    { code: 'ESFJ', label: '同溫', reason: '重責任，講得出做得到' },
  ],
  ESFJ: [
    { code: 'ISFP', label: '官配', reason: '你照顧他人，佢教你照顧自己' },
    { code: 'INFP', label: '互補', reason: '溫柔、重視真實感受' },
    { code: 'ENFJ', label: '同頻', reason: '同樣溫暖有感染力' },
  ],
  ENFJ: [
    { code: 'INFP', label: '官配', reason: '你鼓舞他人，佢幫你處理自己內心' },
    { code: 'ISFP', label: '互補', reason: '安靜陪伴，唔搶戲' },
    { code: 'INFJ', label: '深度', reason: '價值同願景相近' },
  ],
  ENTJ: [
    { code: 'INFP', label: '官配', reason: '你推進目標，佢提醒你內在價值' },
    { code: 'INTP', label: '互補', reason: '策略同分析互補' },
    { code: 'INTJ', label: '同頻', reason: '直接、有遠見' },
  ],
};

const REC_LABEL_EN = {
  官配: 'Best match',
  互補: 'Complement',
  同溫: 'Similar',
  深度: 'Depth',
  同頻: 'Aligned',
  活力: 'Energy',
  神仙組: 'Power pair',
  活力拍檔: 'Spark partner',
};

function hasHanText(s) {
  return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
}

export function displayRecLabel(item, lang = 'zh-HK') {
  if (!item?.label) return item?.label;
  if (lang !== 'en') return item.label;
  return item.labelEn || REC_LABEL_EN[item.label] || item.label;
}

export function displayRecReason(item, lang = 'zh-HK') {
  if (!item?.reason) return item.reason;
  if (lang !== 'en') return item.reason;
  if (item.reasonEn) return item.reasonEn;
  if (!hasHanText(item.reason)) return item.reason;
  return 'A companion temperament that pairs well with your type.';
}

export function displayTypeText(type, field, lang = 'zh-HK') {
  if (!type) return '';
  const enKey = `${field}En`;
  if (lang === 'en') return type[enKey] || type[field] || '';
  return type[field] || '';
}

export function getRecommendedCompanionTypes(userMbtiCode) {
  const code = userMbtiCode?.toUpperCase();
  return MBTI_COMPANION_RECOMMENDATIONS[code] || [];
}

/** 推薦類型置頂，其餘按 MBTI_ORDER 排序 */
export function getCompanionBrowseList(userMbtiCode) {
  const recommended = getRecommendedCompanionTypes(userMbtiCode);
  const recCodes = new Set(recommended.map((r) => r.code));
  const others = MBTI_ORDER.filter((c) => !recCodes.has(c)).map((code) => ({
    code,
    label: null,
    reason: null,
    recommended: false,
  }));
  const recItems = recommended.map((r) => ({
    ...r,
    recommended: true,
  }));
  return [...recItems, ...others];
}

export function getMbtiType(code) {
  return MBTI_TYPES[code?.toUpperCase()] || null;
}

export function getFigure(typeCode, figureId) {
  if (!figureId || figureId === MBTI_PLAIN_FIGURE_ID || figureId === MBTI_CUSTOM_FIGURE_ID) return null;
  const t = getMbtiType(typeCode);
  return t?.figures.find((f) => f.id === figureId) || t?.figures[0] || null;
}

/** 組裝俾 LLM 嘅人物故事上下文 */
export function buildFigureLlmContext(figure, type, options = {}) {
  if (!figure) return '';
  const enCtx = options.english === true;
  if (enCtx) {
    const nm = figure.nameEn || figure.nameZh || figure.name;
    return [
      `Style inspiration: "${nm}" as a ${type?.code || ''} (${type?.nameEn || ''}) archetype mentor — not role-playing the real person.`,
      `Documented low points (may cite briefly as parables): ${(figure.lows || []).join('; ')}.`,
      `Story threads you may borrow: ${(figure.stories || []).join('; ')}.`,
      'Always frame stories as gentle metaphors; never claim you are that historical figure.',
      'Your outward stance is a simulated MBTI companion mentor informed by this figure\'s documented struggles.',
    ].join('\n');
  }
  const en = figure.nameEn ? `；Western reference name: ${figure.nameEn}` : '';
  return [
    `人物（中文稱呼）：${figure.nameZh || figure.name}${en}（${type?.code || ''} ${type?.nameZh || ''}／${type?.nameEn || ''} 風格靈感）`,
    `低谷：${(figure.lows || []).join('；')}`,
    `可分享故事線：${(figure.stories || []).join('；')}`,
    '當用戶處於困難時，可以輕輕引用上述公開經歷作陪伴，但必須說明係「分享佢嘅故事」，絕不可聲稱自己就是該名人或親歷其事。',
    '你的對外身份係「名人經歷分享」陪伴者：語感借該人物與 MBTI 類型特質，而唔係名人本人。',
  ].join('\n');
}

export const COMPANION_SETUP_KEY = 'mindlab_companion_setup_done';
export const COMPANION_SOURCE_KEY = 'mindlab_companion_source';
/** 用戶自己嘅 MBTI */
export const USER_MBTI_TYPE_KEY = 'mindlab_user_mbti_type';
/** 陪伴者所屬 MBTI 類型（可以同用戶不同） */
export const MBTI_TYPE_KEY = 'mindlab_mbti_type';
export const COMPANION_FIGURE_KEY = 'mindlab_companion_figure_id';
export const PRESET_ID_KEY = 'mindlab_companion_preset_id';
export const CUSTOM_NAME_KEY = 'mindlab_companion_custom_name';
export const CUSTOM_PERSONALITY_KEY = 'mindlab_companion_custom_personality';
export const CUSTOM_MBTI_NAME_KEY = 'mindlab_custom_mbti_name';
export const CUSTOM_MBTI_PERSONALITY_KEY = 'mindlab_custom_mbti_personality';

function clearTypeSpecificKeys() {
  localStorage.removeItem(USER_MBTI_TYPE_KEY);
  localStorage.removeItem(MBTI_TYPE_KEY);
  localStorage.removeItem(COMPANION_FIGURE_KEY);
  localStorage.removeItem(PRESET_ID_KEY);
  localStorage.removeItem(CUSTOM_NAME_KEY);
  localStorage.removeItem(CUSTOM_PERSONALITY_KEY);
  localStorage.removeItem(CUSTOM_MBTI_NAME_KEY);
  localStorage.removeItem(CUSTOM_MBTI_PERSONALITY_KEY);
}

export function loadCompanionChoice() {
  if (typeof window === 'undefined') return null;

  const lang = normalizeLanguage(localStorage.getItem('mindlab_lang') || 'zh-HK');
  const source = localStorage.getItem(COMPANION_SOURCE_KEY);
  if (source === 'preset') {
    const preset = getPresetById(localStorage.getItem(PRESET_ID_KEY));
    if (!preset) return null;
    return {
      source: 'preset',
      displayName: lang === 'en' ? (preset.nameEn || preset.name) : preset.name,
      subtitle: lang === 'en' ? (preset.taglineEn || preset.tagline) : preset.tagline,
      tagline: lang === 'en' ? (preset.taglineEn || preset.tagline) : preset.tagline,
      preset,
    };
  }
  if (source === 'custom') {
    const customName = localStorage.getItem(CUSTOM_NAME_KEY)?.trim();
    const customPersonality = localStorage.getItem(CUSTOM_PERSONALITY_KEY)?.trim() || '';
    if (!customName) return null;
    return {
      source: 'custom',
      displayName: customName,
      subtitle: lang === 'en' ? 'Custom companion' : '自訂陪伴',
      customName,
      customPersonality,
    };
  }

  const companionMbti = localStorage.getItem(MBTI_TYPE_KEY);
  const userMbti =
    localStorage.getItem(USER_MBTI_TYPE_KEY) || companionMbti;
  let figureId = localStorage.getItem(COMPANION_FIGURE_KEY);
  if (!companionMbti || !figureId) return null;
  const type = getMbtiType(companionMbti);
  if (!type) return null;
  const userType = userMbti ? getMbtiType(userMbti) : null;
  const sameType =
    userMbti?.toUpperCase() === companionMbti.toUpperCase();

  // 舊版「揀名人傾偈」已改為純 MBTI 陪伴者
  if (figureId !== MBTI_PLAIN_FIGURE_ID && figureId !== MBTI_CUSTOM_FIGURE_ID) {
    figureId = MBTI_PLAIN_FIGURE_ID;
    localStorage.setItem(COMPANION_FIGURE_KEY, MBTI_PLAIN_FIGURE_ID);
  }

  if (figureId === MBTI_PLAIN_FIGURE_ID) {
    return {
      source: 'mbti',
      mbtiStyle: 'plain',
      displayName: lang === 'en' ? `${type.nameEn} · MBTI companion` : `${type.nameZh}・MBTI 陪伴者`,
      subtitle: `${companionMbti.toUpperCase()} · ${type.nameEn}`,
      tagline: lang === 'en' ? (type.taglineEn || type.tagline) : type.tagline,
      mbti: companionMbti.toUpperCase(),
      userMbti: userMbti?.toUpperCase() || null,
      userType,
      sameType,
      figureId,
      figure: null,
      type,
    };
  }

  if (figureId === MBTI_CUSTOM_FIGURE_ID) {
    const customName = localStorage.getItem(CUSTOM_MBTI_NAME_KEY)?.trim();
    const customPersonality = localStorage.getItem(CUSTOM_MBTI_PERSONALITY_KEY)?.trim() || '';
    if (!customName) return null;
    return {
      source: 'mbti',
      mbtiStyle: 'custom',
      displayName: customName,
      subtitle: lang === 'en' ? `${companionMbti.toUpperCase()} · Custom persona` : `${companionMbti.toUpperCase()} · 自訂人格`,
      tagline: lang === 'en' ? (type.taglineEn || type.tagline) : type.tagline,
      mbti: companionMbti.toUpperCase(),
      userMbti: userMbti?.toUpperCase() || null,
      userType,
      sameType,
      figureId,
      figure: null,
      type,
      customName,
      customPersonality,
    };
  }

  return null;
}

export function saveCompanionChoice(userMbti, companionMbti, figureId) {
  clearTypeSpecificKeys();
  localStorage.setItem(COMPANION_SETUP_KEY, 'true');
  localStorage.setItem(COMPANION_SOURCE_KEY, 'mbti');
  localStorage.setItem(USER_MBTI_TYPE_KEY, userMbti.toUpperCase());
  localStorage.setItem(MBTI_TYPE_KEY, companionMbti.toUpperCase());
  localStorage.setItem(COMPANION_FIGURE_KEY, figureId);
}

export function saveCustomMbtiCompanionChoice(userMbti, companionMbti, name, personality) {
  clearTypeSpecificKeys();
  localStorage.setItem(COMPANION_SETUP_KEY, 'true');
  localStorage.setItem(COMPANION_SOURCE_KEY, 'mbti');
  localStorage.setItem(USER_MBTI_TYPE_KEY, userMbti.toUpperCase());
  localStorage.setItem(MBTI_TYPE_KEY, companionMbti.toUpperCase());
  localStorage.setItem(COMPANION_FIGURE_KEY, MBTI_CUSTOM_FIGURE_ID);
  localStorage.setItem(CUSTOM_MBTI_NAME_KEY, name.trim());
  localStorage.setItem(CUSTOM_MBTI_PERSONALITY_KEY, (personality || '').trim());
}

export function savePresetCompanionChoice(presetId) {
  clearTypeSpecificKeys();
  localStorage.setItem(COMPANION_SETUP_KEY, 'true');
  localStorage.setItem(COMPANION_SOURCE_KEY, 'preset');
  localStorage.setItem(PRESET_ID_KEY, presetId);
}

export function saveCustomCompanionChoice(name, personality) {
  clearTypeSpecificKeys();
  localStorage.setItem(COMPANION_SETUP_KEY, 'true');
  localStorage.setItem(COMPANION_SOURCE_KEY, 'custom');
  localStorage.setItem(CUSTOM_NAME_KEY, name.trim());
  localStorage.setItem(CUSTOM_PERSONALITY_KEY, (personality || '').trim());
}

export function clearCompanionChoice() {
  localStorage.removeItem(COMPANION_SETUP_KEY);
  localStorage.removeItem(COMPANION_SOURCE_KEY);
  clearTypeSpecificKeys();
}

/** 只更新用戶 MBTI，保留陪伴者設定 */
export function saveUserMbtiType(userMbti) {
  if (!userMbti) return null;
  localStorage.setItem(USER_MBTI_TYPE_KEY, userMbti.toUpperCase());
  return loadCompanionChoice();
}

/** MBTI 陪伴者（純類型）上下文 */
function mergeLocaleOptions(options = {}) {
  const lang = normalizeLanguage(options.language);
  return { ...localeToContextOptions(lang), ...options, language: lang };
}

export function buildPlainMentorLlmContext(type, userMbtiCode, companionMbtiCode, options = {}) {
  if (!type) return '';
  const opts = mergeLocaleOptions(options);
  const enCtx = opts.english === true;
  if (enCtx) {
    const diffNote =
      userMbtiCode &&
      companionMbtiCode &&
      userMbtiCode.toUpperCase() !== companionMbtiCode.toUpperCase()
        ? `The user's own MBTI is ${userMbtiCode}; they chose companion tone from ${companionMbtiCode}.`
        : userMbtiCode
          ? `User MBTI: ${userMbtiCode}.`
          : '';
    return [
      `Companion mode: MBTI archetype mentor for ${type.code} (${type.nameEn}). You do NOT portray any real person.`,
      `Tone guidance (stay natural, not stereotype jokes): ${type.toneEn || type.tone}`,
      diffNote,
      'Sound like a grounded mentor informed by this personality style — warm, non-pressuring.',
    ]
      .filter(Boolean)
      .join('\n');
  }
  const diffNote =
    userMbtiCode &&
    companionMbtiCode &&
    userMbtiCode.toUpperCase() !== companionMbtiCode.toUpperCase()
      ? `用戶自己嘅類型係 ${userMbtiCode}；陪伴者模擬係 ${companionMbtiCode}（刻意揀咗唔同氣質）。`
      : userMbtiCode
        ? `用戶類型：${userMbtiCode}。`
        : '';
  return [
    '陪伴模式：「MBTI 陪伴者」——你只係用該類型嘅典型思維方式、價值觀同理路嚟陪伴對方，唔扮演任何真人或歷史人物。',
    `扮演嘅類型：${type.code}（中文意象：${type.nameZh}；English archetype: ${type.nameEn}）。`,
    `語氣與切入方式參考：${type.tone}`,
    diffNote,
    '保持溫暖、唔施壓；唔好用刻板標籤嘲笑對方；唔好用「你個類型一定會」嘅絕對句式。',
    opts.taiwan ? '用台灣國語口語陪伴；唔做醫療診斷。' : replyStyleInstruction(opts.language),
  ]
    .filter(Boolean)
    .join('\n');
}

/** 自訂 MBTI 人格陪伴（用戶命名 + 可調類型語氣） */
export function buildCustomMbtiLlmContext(
  type,
  customName,
  customPersonality,
  userMbtiCode,
  companionMbtiCode,
  options = {}
) {
  if (!type || !customName) return '';
  const opts = mergeLocaleOptions(options);
  const enCtx = opts.english === true;
  const diffNote =
    userMbtiCode &&
    companionMbtiCode &&
    userMbtiCode.toUpperCase() !== companionMbtiCode.toUpperCase()
      ? enCtx
        ? `User MBTI: ${userMbtiCode}; companion styled as ${companionMbtiCode}.`
        : `用戶類型 ${userMbtiCode}；陪伴者以 ${companionMbtiCode} 語氣模擬。`
      : userMbtiCode
        ? enCtx
          ? `User MBTI: ${userMbtiCode}.`
          : `用戶類型：${userMbtiCode}。`
        : '';
  if (enCtx) {
    return [
      `Companion mode: user-defined MBTI persona "${customName}" — inspired by ${type.code} (${type.nameEn}), NOT a real person.`,
      `Archetype tone (natural, not stereotypes): ${type.toneEn || type.tone}`,
      customPersonality ? `User personality notes: ${customPersonality}` : '',
      'You may loosely reference public character typing communities (e.g. Personality Database) only as style hints — never claim to be a celebrity or fictional character.',
      diffNote,
      'Warm, non-pressuring Cantonese-friendly support; no medical diagnosis.',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `陪伴模式：用戶自訂 MBTI 人格「${customName}」——以 ${type.code}（${type.nameZh}／${type.nameEn}）嘅典型語氣為底，唔扮演任何真人或影視角色本人。`,
    `類型語氣參考：${type.tone}`,
    customPersonality ? `用戶自訂性格與傾偈偏好：${customPersonality}` : '',
    '可輕微參考 Personality Database 等公開人格類型討論作語氣靈感，但絕不可聲稱自己係某明星、虛構角色或歷史人物本人。',
    diffNote,
    opts.taiwan ? '用台灣國語口語，溫暖、唔施壓；唔做醫療診斷。' : replyStyleInstruction(opts.language),
  ]
    .filter(Boolean)
    .join('\n');
}

/** 統一組裝俾 companionChat 嘅人設上下文 */
export function buildCompanionLlmContext(choice, contextOpts = {}) {
  if (!choice) return '';
  const opts = mergeLocaleOptions(contextOpts);
  if (choice.source === 'preset') {
    return buildPresetLlmContext(choice.preset, opts);
  }
  if (choice.source === 'custom') {
    return buildCustomLlmContext(choice.customName, choice.customPersonality, opts);
  }
  if (choice.source === 'mbti' && choice.mbtiStyle === 'plain') {
    return buildPlainMentorLlmContext(choice.type, choice.userMbti, choice.mbti, opts);
  }
  if (choice.source === 'mbti' && choice.mbtiStyle === 'custom') {
    return buildCustomMbtiLlmContext(
      choice.type,
      choice.customName,
      choice.customPersonality,
      choice.userMbti,
      choice.mbti,
      opts
    );
  }
  return buildPlainMentorLlmContext(choice.type, choice.userMbti, choice.mbti, opts);
}
