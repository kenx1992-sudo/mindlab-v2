'use client';
import { useState, useEffect } from 'react';
import { db, functions } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SessionTagBadge from '@/components/SessionTagBadge';
import { displaySessionTag } from '@/lib/i18nDisplay';
import { getLanguage } from '@/lib/locale';

function formatDate(dateStr, region = 'HK') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const locale = region === 'GB' ? 'en-GB' : region === 'TW' ? 'zh-TW' : 'zh-HK';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CH_UI = {
  'zh-HK': {
    title: '對話記錄', newChat: '新對話', subtitle: 'AI 自動為每次對話分類標籤',
    searchPlaceholder: '搜尋對話摘要…', allBtn: '全部', rounds: (n) => `${n} 回合`,
    empty: '還沒有對話記錄', emptyFiltered: '沒有符合篩選嘅記錄',
    startFirst: '開始第一次對話', inProgress: '對話進行中，標籤將自動生成',
  },
  'zh-TW': {
    title: '對話記錄', newChat: '新對話', subtitle: 'AI 自動為每次對話分類標籤',
    searchPlaceholder: '搜尋對話摘要…', allBtn: '全部', rounds: (n) => `${n} 回合`,
    empty: '還沒有對話記錄', emptyFiltered: '沒有符合篩選條件的記錄',
    startFirst: '開始第一次對話', inProgress: '對話進行中，標籤將自動生成',
  },
  en: {
    title: 'Chat History', newChat: 'New chat', subtitle: 'AI automatically tags each conversation',
    searchPlaceholder: 'Search summaries…', allBtn: 'All', rounds: (n) => `${n} round${n !== 1 ? 's' : ''}`,
    empty: 'No conversations yet', emptyFiltered: 'No results matching your filter',
    startFirst: 'Start your first conversation', inProgress: 'In progress — tags will be generated automatically',
  },
};

export default function ChatHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [search, setSearch] = useState('');
  const userId = localStorage.getItem('mindlab_user_id');
  const lang = getLanguage();
  const u = CH_UI[lang] || CH_UI['zh-HK'];
  const region = (sessionStorage.getItem('mindlab_region') || 'HK').toUpperCase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    db.chatSession.list({ user_id: userId }, '-created_date', 30)
      .then(data => { setSessions(data.filter(s => s.round_count > 0)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const allTags = [...new Set(sessions.flatMap(s => s.tags || []))];

  const filtered = sessions.filter(s => {
    const tagMatch = !activeTag || (s.tags || []).includes(activeTag);
    const searchMatch = !search || (s.summary_snippet || '').toLowerCase().includes(search.toLowerCase());
    return tagMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-playfair text-2xl font-bold text-foreground">{u.title}</h1>
        <Link to="/sessions" className="text-xs text-primary font-medium">{u.newChat}</Link>
      </div>
      <p className="text-muted-foreground text-sm mb-5">{u.subtitle}</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder={u.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              !activeTag ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {u.allBtn}
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                activeTag === tag ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {displaySessionTag(tag, lang)}
            </button>
          ))}
        </div>
      )}

      {/* Sessions list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground/25 mb-3" />
          <p className="text-muted-foreground text-sm">
            {sessions.length === 0 ? u.empty : u.emptyFiltered}
          </p>
          {sessions.length === 0 && (
            <Link to="/sessions" className="mt-3 text-xs text-primary underline underline-offset-2">{u.startFirst}</Link>
          )}
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="calm-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(session.created_date, region)}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {u.rounds(session.round_count)}
                  </span>
                </div>

                {session.summary_snippet && (
                  <p className="text-sm text-foreground leading-relaxed mb-2.5">{session.summary_snippet}</p>
                )}

                {(session.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {session.tags.map(tag => (
                      <SessionTagBadge
                        key={tag}
                        tag={tag}
                        lang={lang}
                        active={activeTag === tag}
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      />
                    ))}
                  </div>
                )}

                {!session.summary_snippet && !(session.tags || []).length && (
                  <p className="text-xs text-muted-foreground italic">{u.inProgress}</p>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}