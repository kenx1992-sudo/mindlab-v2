'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Download,
  Sparkles,
  Heart,
  X,
} from 'lucide-react';
import { db, functions } from '@/lib/api-client';
import { t, normalizeLanguage } from '@/lib/locale';
import {
  MOOD_EMOJI,
  addMoodEntry,
  saveSessionReflection,
  getMessageFeedback,
  setMessageFeedback,
} from '@/lib/moodJournal';
import { formatChatTranscript, downloadChatText, copyChatText } from '@/lib/chatExport';
import { ensureMindlabUserId } from '@/lib/userSync';

function fallbackSummary(messages, lang) {
  const userCount = messages.filter((m) => m.role === 'user').length;
  if (lang === 'en') {
    return {
      summary: `You shared about ${userCount} message(s) in this session. Take a moment to rest — I'm glad you reached out.`,
      mood_tags: ['reflection', 'care'],
      mood_score: 3,
    };
  }
  if (lang === 'zh-TW') {
    return {
      summary: `這次對話你大約說了 ${userCount} 則訊息。願你稍作休息，謝謝你願意說出來。`,
      mood_tags: ['整理', '陪伴'],
      mood_score: 3,
    };
  }
  return {
    summary: `今次對話你大約講咗 ${userCount} 句。願你稍作休息，多謝你願意講出嚟。`,
    mood_tags: ['整理', '陪伴'],
    mood_score: 3,
  };
}

export function MessageFeedback({ sessionId, index, lang, feedback, onFeedback }) {
  return (
    <div className="flex gap-1 mt-1.5">
      <button
        type="button"
        aria-label="helpful"
        onClick={() => onFeedback(index, feedback === 'up' ? null : 'up')}
        className={`p-1 rounded-lg ${feedback === 'up' ? 'text-accent bg-accent/15' : 'text-muted-foreground/60 hover:text-foreground'}`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label="not helpful"
        onClick={() => onFeedback(index, feedback === 'down' ? null : 'down')}
        className={`p-1 rounded-lg ${feedback === 'down' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground/60 hover:text-foreground'}`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CompanionSessionTools({
  messages,
  sessionId,
  lang,
  region,
  companionName,
  onRetestMbti,
  onChangeCompanion,
  onToast,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const [moodScore, setMoodScore] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const safeLang = normalizeLanguage(lang);

  async function handleSummary() {
    setMenuOpen(false);
    if (messages.filter((m) => m.role === 'user' || m.role === 'assistant').length < 2) {
      onToast?.(safeLang === 'en' ? 'Chat a bit more first.' : '先傾多幾句再整理摘要。');
      return;
    }
    setSummaryOpen(true);
    setSummaryLoading(true);
    try {
      const res = await functions.companionChat({
        session_id: sessionId,
        user_id: ensureMindlabUserId(),
        action: 'summarize',
        transcript: messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        language: lang,
        region,
      });
      const data = res || {};
      const payload = {
        summary: data.summary || '',
        mood_tags: data.mood_tags || [],
        mood_score: data.mood_score ?? 3,
      };
      if (!payload.summary) throw new Error('empty');
      setSummary(payload);
      saveSessionReflection(sessionId, payload);
    } catch {
      const fb = fallbackSummary(messages, safeLang);
      setSummary(fb);
      saveSessionReflection(sessionId, fb);
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleExport() {
    setMenuOpen(false);
    const chatMsgs = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    if (!chatMsgs.length) {
      onToast?.(t('exportEmpty', lang));
      return;
    }
    const text = formatChatTranscript(chatMsgs, companionName, safeLang);
    downloadChatText(text);
    copyChatText(text).catch(() => {});
    onToast?.(t('exportDownloaded', lang));
  }

  function saveMood() {
    const tags = summary?.mood_tags || [];
    addMoodEntry({ score: moodScore, note: moodNote, sessionId, tags });
    setMoodOpen(false);
    setMoodNote('');
    onToast?.(safeLang === 'en' ? 'Mood saved.' : safeLang === 'zh-TW' ? '已記下心情。' : '已記低心情。');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label={t('menuTitle', lang)}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[90] bg-black/30"
              onClick={() => setMenuOpen(false)}
              aria-label="close menu"
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-5 top-[4.5rem] z-[95] w-52 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
            >
              <button type="button" onClick={handleSummary} className="w-full text-left px-4 py-3 text-xs hover:bg-muted/50 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> {t('endSession', lang)}
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setMoodOpen(true); }}
                className="w-full text-left px-4 py-3 text-xs hover:bg-muted/50 flex items-center gap-2 border-t border-border/60"
              >
                <Heart className="w-3.5 h-3.5 text-accent" /> {t('logMood', lang)}
              </button>
              <button type="button" onClick={handleExport} className="w-full text-left px-4 py-3 text-xs hover:bg-muted/50 flex items-center gap-2 border-t border-border/60">
                <Download className="w-3.5 h-3.5" /> {t('exportChat', lang)}
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onRetestMbti?.(); }} className="w-full text-left px-4 py-3 text-xs hover:bg-muted/50 border-t border-border/60">
                {t('retestMbti', lang)}
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onChangeCompanion?.(); }} className="w-full text-left px-4 py-3 text-xs hover:bg-muted/50 border-t border-border/60">
                {t('changeCompanion', lang)}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {summaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border p-5 max-h-[80vh] overflow-y-auto"
            >
              <motion.div className="flex items-center justify-between mb-3">
                <h3 className="font-playfair font-semibold text-foreground">{t('summaryTitle', lang)}</h3>
                <button type="button" onClick={() => setSummaryOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground">{t('summaryLoading', lang)}</p>
              ) : summary ? (
                <>
                  <p className="text-sm leading-relaxed text-foreground mb-3">{summary.summary}</p>
                  {summary.mood_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {summary.mood_tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSummaryOpen(false); setMoodOpen(true); setMoodScore(summary.mood_score || 3); }}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    {t('logMood', lang)}
                  </button>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moodOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center p-4"
          >
            <motion.div className="w-full max-w-md rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-playfair font-semibold">{t('moodTitle', lang)}</h3>
                <button type="button" onClick={() => setMoodOpen(false)} className="p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-between gap-1 mb-4">
                {MOOD_EMOJI.map((m) => (
                  <button
                    key={m.score}
                    type="button"
                    onClick={() => setMoodScore(m.score)}
                    className={`flex-1 py-2 rounded-xl text-xl border transition-all ${moodScore === m.score ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              <label className="text-xs text-muted-foreground block mb-1">{t('moodNote', lang)}</label>
              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-4 resize-none"
              />
              <button type="button" onClick={saveMood} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                {t('moodSave', lang)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function useMessageFeedback(sessionId) {
  const feedbackMap = sessionId ? getMessageFeedback(sessionId) : {};
  function setFeedback(index, value) {
    if (!sessionId) return;
    setMessageFeedback(sessionId, index, value);
  }
  return { feedbackMap, setFeedback };
}

