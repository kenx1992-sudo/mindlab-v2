'use client';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t, normalizeLanguage } from '@/lib/locale';
import { displayMoodTag } from '@/lib/i18nDisplay';
import { getMoodEntries, MOOD_EMOJI } from '@/lib/moodJournal';

export default function MoodJournal() {
  const { lang } = useMindlabLocale();
  const entries = getMoodEntries();
  const safeLang = normalizeLanguage(lang);

  return (
    <div className="px-5 pt-10 pb-10">
      <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> {t('profileTitle', lang)}
      </Link>
      <h1 className="font-playfair text-2xl font-bold text-foreground mb-1">{t('moodJournal', lang)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('moodJournalDesc', lang)}</p>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          {t('moodJournalEmpty', lang)}
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const mood = MOOD_EMOJI.find((m) => m.score === e.score);
            return (
              <li key={e.id} className="calm-card rounded-2xl px-4 py-3.5 border border-border/80">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-2xl">{mood?.emoji || '😐'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {mood?.label[safeLang] || mood?.label['zh-HK']}
                </p>
                {e.note && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.note}</p>}
                {e.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                        {displayMoodTag(tag, safeLang)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}