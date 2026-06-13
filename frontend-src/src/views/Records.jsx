'use client';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, functions } from '@/lib/api-client';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';
import { getMoodEntries } from '@/lib/moodJournal';
import { getSessionReflections } from '@/lib/moodJournal';
import { ensureMindlabUserId } from '@/lib/userSync';
import { Calendar, Heart, Sparkles } from 'lucide-react';

const TABS = [
  { id: 'appointments', icon: Calendar },
  { id: 'mood', icon: Heart },
  { id: 'chat', icon: Sparkles },
];

export default function Records() {
  const { lang } = useMindlabLocale();
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const moods = getMoodEntries();
  const reflections = Object.entries(getSessionReflections());

  useEffect(() => {
    const uid = ensureMindlabUserId();
    db.appointment.list('-date')
      .then((data) => {
        const mine = (data || []).filter(
          (a) =>
            a.user_id === uid ||
            String(a.notes || '').includes(uid) ||
            (a.client_email && a.client_email === uid)
        );
        setAppointments(mine.length ? mine : data || []);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 pt-10 pb-10">
      <Link to="/sessions" className="text-primary text-xs font-medium mb-3 inline-block">
        ← {t('companionTitle', lang)}
      </Link>
      <h1 className="font-playfair text-2xl font-bold mb-4">{t('recordsTitle', lang)}</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border ${
              tab === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {id === 'appointments' ? t('recordsAppointments', lang) : id === 'mood' ? t('recordsMood', lang) : t('recordsChat', lang)}
          </button>
        ))}
      </div>

      {loading && tab === 'appointments' && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {tab === 'appointments' && !loading && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('recordsNoAppts', lang)}
              <Link to="/book" className="block text-primary mt-2">{t('bookTitle', lang)}</Link>
            </p>
          ) : (
            appointments.map((a) => (
              <div key={a.id} className="calm-card rounded-2xl p-4 border border-border">
                <p className="font-semibold text-sm">{a.client_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.date} · {a.time_slot} · {a.status}</p>
                {a.concerns && <p className="text-xs mt-2 text-muted-foreground">{a.concerns}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'mood' && (
        <ul className="space-y-2">
          {moods.length === 0 ? (
            <li className="text-sm text-muted-foreground text-center py-8">{t('moodJournalDesc', lang)}</li>
          ) : (
            moods.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                {new Date(m.createdAt).toLocaleString()} · {m.score}/5
                {m.note && <p className="text-xs text-muted-foreground mt-1">{m.note}</p>}
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'chat' && (
        <ul className="space-y-3">
          {reflections.length === 0 ? (
            <li className="text-sm text-muted-foreground text-center py-8">
              {t('recordsNoChat', lang)}
            </li>
          ) : (
            reflections.map(([sid, r]) => (
              <li key={sid} className="rounded-2xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{sid.slice(0, 20)}…</p>
                <p className="text-sm leading-relaxed">{r.summary}</p>
                {r.mood_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.mood_tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{tag}</span>
                    ))}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}