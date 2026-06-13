'use client';
import { displaySessionTag } from '@/lib/i18nDisplay';
import { getLanguage } from '@/lib/locale';

const TAG_COLORS = {
  '工作壓力': 'bg-orange-100 text-orange-700 border-orange-200',
  '人際關係': 'bg-pink-100 text-pink-700 border-pink-200',
  '個人成長': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '家庭': 'bg-purple-100 text-purple-700 border-purple-200',
  '焦慮': 'bg-amber-100 text-amber-700 border-amber-200',
  '孤獨感': 'bg-blue-100 text-blue-700 border-blue-200',
  '自我價值': 'bg-teal-100 text-teal-700 border-teal-200',
  '悲傷失落': 'bg-slate-100 text-slate-700 border-slate-200',
  '學業': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '職業發展': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '健康': 'bg-green-100 text-green-700 border-green-200',
  '其他': 'bg-gray-100 text-gray-600 border-gray-200',
  'Work Stress': 'bg-orange-100 text-orange-700 border-orange-200',
  'Relationships': 'bg-pink-100 text-pink-700 border-pink-200',
  'Personal Growth': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Family': 'bg-purple-100 text-purple-700 border-purple-200',
  'Anxiety': 'bg-amber-100 text-amber-700 border-amber-200',
  'Loneliness': 'bg-blue-100 text-blue-700 border-blue-200',
  'Self-esteem': 'bg-teal-100 text-teal-700 border-teal-200',
  'Grief': 'bg-slate-100 text-slate-700 border-slate-200',
  'Study': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Career': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Health': 'bg-green-100 text-green-700 border-green-200',
  'Other': 'bg-gray-100 text-gray-600 border-gray-200',
  Reflection: 'bg-gray-100 text-gray-600 border-gray-200',
  Care: 'bg-gray-100 text-gray-600 border-gray-200',
  Topic: 'bg-gray-100 text-gray-600 border-gray-200',
};

const DEFAULT_COLOR = 'bg-secondary text-secondary-foreground border-border';

export default function SessionTagBadge({ tag, active = false, onClick = undefined, lang: langProp }) {
  const lang = langProp || getLanguage();
  const label = displaySessionTag(tag, lang);
  const colorClass = TAG_COLORS[tag] || TAG_COLORS[label] || DEFAULT_COLOR;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${colorClass} ${
        active ? 'ring-2 ring-offset-1 ring-primary/40' : 'hover:opacity-80'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {label}
    </button>
  );
}
