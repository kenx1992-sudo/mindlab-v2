import { normalizeLanguage } from '@/lib/locale';

const SESSION_TAG_ZH_TO_EN = {
  '工作壓力': 'Work stress',
  '人際關係': 'Relationships',
  '個人成長': 'Personal growth',
  '家庭': 'Family',
  '焦慮': 'Anxiety',
  '孤獨感': 'Loneliness',
  '自我價值': 'Self-esteem',
  '悲傷失落': 'Grief',
  '學業': 'Study',
  '職業發展': 'Career',
  '健康': 'Health',
  '其他': 'Other',
  '整理': 'Reflection',
  '陪伴': 'Care',
};

const MILESTONE_CATEGORY_ZH_TO_EN = {
  '情緒調節': 'Emotional regulation',
  '人際關係': 'Relationships',
  '自我照顧': 'Self-care',
  '思維練習': 'Thinking practice',
  '行動小步': 'Small steps',
  mindfulness: 'Mindfulness',
};

const MOOD_TAG_ZH_TO_EN = {
  整理: 'Reflection',
  陪伴: 'Care',
};

function hasHan(s) {
  return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
}

/** Session / filter tag shown in UI */
export function displaySessionTag(tag, lang = 'zh-HK') {
  if (!tag) return tag;
  const safe = normalizeLanguage(lang);
  if (safe !== 'en') return tag;
  return SESSION_TAG_ZH_TO_EN[tag] || (!hasHan(tag) ? tag : 'Topic');
}

/** Milestone category chip from backend */
export function displayMilestoneCategory(category, lang = 'zh-HK') {
  if (!category) return category;
  const safe = normalizeLanguage(lang);
  if (safe !== 'en') return category;
  return MILESTONE_CATEGORY_ZH_TO_EN[category] || (!hasHan(category) ? category : 'Growth');
}

/** Mood / summary tags stored in Chinese */
export function displayMoodTag(tag, lang = 'zh-HK') {
  if (!tag) return tag;
  const safe = normalizeLanguage(lang);
  if (safe !== 'en') return tag;
  return MOOD_TAG_ZH_TO_EN[tag] || SESSION_TAG_ZH_TO_EN[tag] || (!hasHan(tag) ? tag : tag);
}
