'use client';
import { useState, useEffect } from 'react';
import { db, functions } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, SkipForward, RefreshCw, Trophy, Circle, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionTagBadge from '@/components/SessionTagBadge';
import { displayMilestoneCategory } from '@/lib/i18nDisplay';
import { getLanguage } from '@/lib/locale';

const UI = {
  'zh-HK': {
    title: '成長里程碑', subtitle: '根據你的對話話題，AI 為你設定專屬小任務',
    completedLabel: '已完成任務', streakLabel: '連續完成天數', activeLabel: '進行中任務',
    newBtn: '新任務', generating: '生成中…',
    noUser: '開始對話後即可解鎖成長里程碑', noUserLink: '開始對話',
    emptyTitle: '還沒有進行中的任務', emptyHint: '點擊「新任務」讓 AI 根據你的對話生成個人化建議',
    generateBtn: '✨ 生成我的任務',
    activeHeading: (n) => `進行中 · ${n} 個任務`,
    completedHeading: (n) => `已完成 · ${n} 個`,
    doneBtn: '完成了！', skipBtn: '略過',
    mediumDiff: '稍有挑戰',
    completedOn: (d) => `完成於 ${new Date(d).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}`,
  },
  'zh-TW': {
    title: '成長里程碑', subtitle: '根據您的對話主題，AI 為您設定專屬小任務',
    completedLabel: '已完成任務', streakLabel: '連續完成天數', activeLabel: '進行中任務',
    newBtn: '新任務', generating: '生成中…',
    noUser: '開始對話後即可解鎖成長里程碑', noUserLink: '開始對話',
    emptyTitle: '還沒有進行中的任務', emptyHint: '點擊「新任務」讓 AI 根據您的對話生成個人化建議',
    generateBtn: '✨ 生成我的任務',
    activeHeading: (n) => `進行中 · ${n} 個任務`,
    completedHeading: (n) => `已完成 · ${n} 個`,
    doneBtn: '完成了！', skipBtn: '略過',
    mediumDiff: '稍有挑戰',
    completedOn: (d) => `完成於 ${new Date(d).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`,
  },
  en: {
    title: 'Growth Milestones', subtitle: 'AI-personalised micro-tasks based on your conversation topics',
    completedLabel: 'Completed', streakLabel: 'Day streak', activeLabel: 'In progress',
    newBtn: 'New task', generating: 'Generating…',
    noUser: 'Start a conversation to unlock growth milestones', noUserLink: 'Start chatting',
    emptyTitle: 'No tasks in progress',  emptyHint: 'Tap "New task" to let AI generate personalised suggestions from your conversations',
    generateBtn: '✨ Generate my tasks',
    activeHeading: (n) => `In progress · ${n} task${n !== 1 ? 's' : ''}`,
    completedHeading: (n) => `Completed · ${n}`,
    doneBtn: 'Done!', skipBtn: 'Skip',
    mediumDiff: 'Challenging',
    completedOn: (d) => `Completed ${new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
  },
};

const CATEGORY_COLORS = {
  '情緒調節': 'bg-blue-50 text-blue-700 border-blue-200',
  '人際關係': 'bg-pink-50 text-pink-700 border-pink-200',
  '自我照顧': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '思維練習': 'bg-purple-50 text-purple-700 border-purple-200',
  '行動小步': 'bg-amber-50 text-amber-700 border-amber-200',
  'mindfulness': 'bg-teal-50 text-teal-700 border-teal-200',
};

const CATEGORY_EMOJI = {
  '情緒調節': '💙', '人際關係': '🌸', '自我照顧': '🌿',
  '思維練習': '🧠', '行動小步': '👣', 'mindfulness': '🧘',
};

export default function Milestones() {
  const userId = localStorage.getItem('mindlab_user_id');
  const lang = getLanguage();
  const u = UI[lang] || UI['zh-HK'];
  const region = (sessionStorage.getItem('mindlab_region') || 'HK').toUpperCase();

  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadMilestones();
  }, [userId]);

  async function loadMilestones() {
    setLoading(true);
    const [act, done] = await Promise.all([
      db.milestone.list({ user_id: userId, status: 'active' }, '-created_date', 20),
      db.milestone.list({ user_id: userId, status: 'completed' }, '-updated_date', 10),
    ]);
    setActive(act);
    setCompleted(done);
    setLoading(false);
  }

  async function generateNew() {
    if (!userId || generating) return;
    setGenerating(true);
    // Gather tags from recent sessions
    const sessions = await db.chatSession.list({ user_id: userId }, '-created_date', 10);
    const tags = [...new Set(sessions.flatMap(s => s.tags || []))].slice(0, 6);
    await functions.generateMilestones({ user_id: userId, tags, region });
    await loadMilestones();
    setGenerating(false);
  }

  async function updateStatus(milestone, status) {
    setUpdating(milestone.id);
    await functions.updateMilestone({ milestone_id: milestone.id, status });
    await loadMilestones();
    setUpdating(null);
  }

  const completedCount = completed.length;
  const streakDays = Math.min(completedCount, 7);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">{u.noUser}</p>
        <Link to="/sessions" className="mt-3 text-xs text-primary underline underline-offset-2">{u.noUserLink}</Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-playfair text-2xl font-bold text-foreground">{u.title}</h1>
        <button
          onClick={generateNew}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? u.generating : u.newBtn}
        </button>
      </div>
      <p className="text-muted-foreground text-sm mb-5">{u.subtitle}</p>

      {/* Stats bar */}
      <div className="calm-card rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground">{completedCount}</p>
            <p className="text-[11px] text-muted-foreground">{u.completedLabel}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex items-center gap-2 flex-1">
          <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground">{streakDays}</p>
            <p className="text-[11px] text-muted-foreground">{u.streakLabel}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex items-center gap-2 flex-1">
          <Circle className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground">{active.length}</p>
            <p className="text-[11px] text-muted-foreground">{u.activeLabel}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Active milestones */}
          {active.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/25 mb-3" />
              <p className="text-muted-foreground text-sm mb-1">{u.emptyTitle}</p>
              <p className="text-xs text-muted-foreground mb-4">{u.emptyHint}</p>
              <button
                onClick={generateNew}
                disabled={generating}
                className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
              >
                {generating ? u.generating : u.generateBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              <h2 className="text-sm font-semibold text-foreground mb-2">{u.activeHeading(active.length)}</h2>
              <AnimatePresence>
                {active.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="calm-card rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 flex-shrink-0">
                        {CATEGORY_EMOJI[m.category] || '⭐'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{m.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[m.category] || 'bg-muted text-muted-foreground border-border'}`}>
                            {displayMilestoneCategory(m.category, lang)}
                          </span>
                          {m.difficulty === 'medium' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-medium">{u.mediumDiff}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.description}</p>
                        {(m.source_tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {m.source_tags.slice(0, 3).map(t => <SessionTagBadge key={t} tag={t} lang={lang} />)}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(m, 'completed')}
                            disabled={updating === m.id}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                              {u.doneBtn}
                            </button>
                            <button
                              onClick={() => updateStatus(m, 'skipped')}
                              disabled={updating === m.id}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-2 rounded-xl border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                              {u.skipBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Completed milestones */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" /> {u.completedHeading(completed.length)}
              </h2>
              <div className="space-y-2">
                {completed.map(m => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-border/60 bg-muted/30 p-4 flex items-center gap-3 opacity-70"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-through">{m.title}</p>
                      {m.completed_date && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {u.completedOn(m.completed_date)}
                        </p>
                      )}
                    </div>
                    <span className="text-lg">{CATEGORY_EMOJI[m.category] || '⭐'}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}