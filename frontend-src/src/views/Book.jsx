'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageCircle } from 'lucide-react';
import { db, functions } from '@/lib/api-client';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { t } from '@/lib/locale';
import { ensureMindlabUserId } from '@/lib/userSync';

export default function Book() {
  const { lang, region } = useMindlabLocale();
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    date: '',
    time_slot: '',
    concerns: '',
    mode: 'video',
    session_type: 'individual',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!form.client_name.trim() || !form.date || !form.time_slot) return;
    setBusy(true);
    setError(null);
    try {
      const uid = ensureMindlabUserId();
      await db.appointment.create({
        ...form,
        client_name: form.client_name.trim(),
        user_id: uid,
        status: 'pending',
        notes: `region:${region}`,
        counsellor: region === 'TW' ? t('bookCounsellor', 'zh-TW') : region === 'GB' ? t('bookCounsellor', 'en') : t('bookCounsellor', 'zh-HK'),
      });
      setDone(true);
    } catch {
      setError(t('bookError', lang));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="px-5 pt-16 pb-10 text-center max-w-md mx-auto">
        <p className="font-playfair text-xl font-semibold mb-3">{t('bookSuccess', lang)}</p>
        <Link to="/records" className="text-primary text-sm underline">{t('recordsTitle', lang)}</Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-10 max-w-md mx-auto">
      <h1 className="font-playfair text-2xl font-bold mb-1 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary" /> {t('bookTitle', lang)}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{t('bookPhase2', lang)}{t('bookSubmit', lang)}</p>
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder={lang === 'en' ? 'Your name' : '姓名'} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm" />
        <input type="email" placeholder="Email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm" />
        <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm" />
        <input required placeholder={lang === 'en' ? 'Preferred time' : '偏好時段'} value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm" />
        <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm">
          <option value="video">{lang === 'en' ? 'Video' : '視像'}</option>
          <option value="phone">{lang === 'en' ? 'Phone' : '電話'}</option>
          <option value="in-person">{lang === 'en' ? 'In person' : '面對面'}</option>
        </select>
        <textarea rows={3} placeholder={lang === 'en' ? 'What would you like support with?' : '想傾咩…'} value={form.concerns} onChange={(e) => setForm({ ...form, concerns: e.target.value })} className="w-full rounded-xl border border-border px-4 py-3 text-sm resize-none" />
        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {t('bookSubmit', lang)}
        </button>
      </form>
      <Link to="/sessions" className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="w-4 h-4" /> {t('companionTitle', lang)}
      </Link>
    </div>
  );
}
