'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertTriangle, RotateCcw, Crown, Mic, MicOff } from 'lucide-react';
import { speechRecognitionSupported, createSpeechRecognizer } from '@/lib/voiceInput';
import { guardianBlocksChat } from '@/lib/guardianMode';
import { pullUserSync, ensureMindlabUserId } from '@/lib/userSync';
import CompanionSessionTools, { MessageFeedback, useMessageFeedback } from '@/components/CompanionSessionTools';
import { t } from '@/lib/locale';
import { db, functions } from '@/lib/api-client';
import { Link } from 'react-router-dom';
import ConsentGate from '@/components/ConsentGate';
import MbtiCompanionPicker from '@/components/MbtiCompanionPicker';
import {
  loadCompanionChoice,
  clearCompanionChoice,
  buildCompanionLlmContext,
} from '@/lib/mbtiCompanions';
import { useMindlabLocale } from '@/hooks/useMindlabLocale';
import { getChatStarters, localeToContextOptions, REGION_OPTIONS } from '@/lib/locale';

const SESSION_KEY = 'mindlab_chat_session_id';

function genSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function telHref(num) {
  if (!num || typeof num !== 'string') return null;
  const digits = num.replace(/[\s-]/g, '');
  return digits ? `tel:${digits}` : null;
}

function CrisisRow({ item, lang }) {
  if (typeof item === 'string') return <li className="calm-alert-detail text-xs leading-relaxed">{item}</li>;
  const name =
    (lang === 'en' && (item?.nameEn || item?.name_en))
      ? item.nameEn || item.name_en
      : item?.name || item?.Name || (lang === 'en' ? 'Support line' : '支援熱線');
  const phone = item?.phone_number || item?.PhoneNumber || item?.number || '';
  const href = telHref(phone);
  const is24h = item?.available_24h === true || item?.Available24h === true;
  return (
    <li className="rounded-xl bg-black/20 border border-amber-500/25 px-3 py-2.5 text-xs">
      <div className="calm-alert-detail font-medium">{name}</div>
      {phone && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {href ? (
            <a href={href} className="calm-alert-phone text-accent font-semibold underline underline-offset-2">{phone}</a>
          ) : (
            <span className="calm-alert-phone font-semibold">{phone}</span>
          )}
          {is24h && <span className="calm-alert-body text-[10px]">{lang === 'en' ? '24 hours' : '24小時'}</span>}
        </div>
      )}
    </li>
  );
}

export default function Companion() {
  const { lang, region, setRegion, isEnglish } = useMindlabLocale();
  const localeOpts = localeToContextOptions(lang);
  const starters = getChatStarters(lang);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null
  );
  const [consentDone, setConsentDone] = useState(() => localStorage.getItem('mindlab_consent_done') === 'true');
  const [companionChoice, setCompanionChoice] = useState(() => loadCompanionChoice());
  const [showMbtiPicker, setShowMbtiPicker] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [roundsRemaining, setRoundsRemaining] = useState(null);
  const [toast, setToast] = useState('');
  const [mbtiPickerMode, setMbtiPickerMode] = useState(null);
  const [feedbackTick, setFeedbackTick] = useState(0);
  const bottomRef = useRef(null);
  const regionInit = useRef(false);
  const { feedbackMap, setFeedback } = useMessageFeedback(sessionId);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  void feedbackTick;

  useEffect(() => {
    pullUserSync().catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      const newId = genSessionId();
      sessionStorage.setItem(SESSION_KEY, newId);
      setSessionId(newId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!regionInit.current) { regionInit.current = true; return; }
    const newId = genSessionId();
    sessionStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([]);
    setCrisis(null);
    setLimitReached(false);
    setRoundsRemaining(null);
  }, [region, lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, crisis, limitReached]);

  useEffect(() => {
    window.dispatchEvent(new Event('mindlab-onboarding-changed'));
  }, [consentDone, companionChoice, showMbtiPicker]);

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || !sessionId || busy || limitReached) return;
    setInput('');
    setCrisis(null);
    setMessages(m => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await functions.companionChat({
        session_id: sessionId,
        user_id: ensureMindlabUserId(),
        message: text,
        region,
        language: lang,
        plus_active: typeof window !== 'undefined' && localStorage.getItem('mindlab_plus_active') === 'true',
        companion_source: companionChoice?.source || 'mbti',
        companion_name: companionChoice?.displayName,
        companion_tagline: companionChoice?.tagline || companionChoice?.subtitle,
        companion_persona_context: buildCompanionLlmContext(companionChoice, localeOpts),
        mbti_type: companionChoice?.mbti,
        companion_mbti_style: companionChoice?.source === 'mbti' ? companionChoice.mbtiStyle : undefined,
        user_mbti_type: companionChoice?.userMbti,
        companion_figure:
          companionChoice?.source === 'mbti' && companionChoice.mbtiStyle === 'plain'
            ? undefined
            : companionChoice?.figure?.name,
        companion_tone: companionChoice?.type?.tone,
        companion_figure_context: buildCompanionLlmContext(companionChoice, localeOpts),
      });
      const data = res;
      if (data.crisis_detected) {
        setCrisis(data.crisis_resources || []);
        return;
      }
      if (data.limit_reached) {
        setLimitReached(true);
        return;
      }
      if (data.rounds_remaining !== undefined) setRoundsRemaining(data.rounds_remaining);
      const reply = data.reply || '';
      if (reply) setMessages(m => [...m, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'system', text: t('sendError', lang) }]);
    } finally {
      setBusy(false);
    }
  }

  function resetSession() {
    const newId = genSessionId();
    sessionStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([]);
    setCrisis(null);
    setLimitReached(false);
    setRoundsRemaining(null);
  }

  function resetCompanion() {
    clearCompanionChoice();
    setCompanionChoice(null);
    setMbtiPickerMode(null);
    setShowMbtiPicker(true);
    resetSession();
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }

  function handleFeedback(index, value) {
    setFeedback(index, value);
    setFeedbackTick((n) => n + 1);
  }

  if (!consentDone) {
    return <ConsentGate region={region} lang={lang} onComplete={() => setConsentDone(true)} />;
  }

  if (guardianBlocksChat()) {
    return (
      <div className="px-5 pt-16 pb-10 text-center max-w-md mx-auto">
        <p className="font-playfair text-xl font-semibold mb-3">{t('guardianBlockedTitle', lang)}</p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('guardianBlockedBody', lang)}</p>
        <Link to="/guardian" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-2xl text-sm font-medium">
          {t('guardianSetup', lang)}
        </Link>
      </div>
    );
  }

  function toggleVoice() {
    if (!speechRecognitionSupported()) {
      showToast(lang === 'en' ? 'Voice not supported in this browser.' : '此瀏覽器不支援語音輸入。');
      return;
    }
    if (listening) {
      recRef.current?.stop?.();
      setListening(false);
      return;
    }
    const rec = createSpeechRecognizer(lang, {
      onResult: (text) => setInput((v) => (v ? `${v} ${text}` : text)),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  if (!companionChoice || showMbtiPicker) {
    return (
      <MbtiCompanionPicker
        lang={lang}
        retestUserMbtiOnly={mbtiPickerMode === 'retest'}
        changeCompanionOnly={mbtiPickerMode === 'change'}
        onComplete={(choice) => {
          const loaded = choice || loadCompanionChoice();
          if (loaded) {
            setCompanionChoice(loaded);
            setShowMbtiPicker(false);
            setMbtiPickerMode(null);
            resetSession();
          }
        }}
      />
    );
  }

  return (
    <motion.div className="relative flex flex-col h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)]">
      {toast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 rounded-full bg-card border border-border text-xs text-foreground shadow-lg">
          {toast}
        </div>
      )}
      <motion.div className="px-5 pt-8 pb-3 border-b border-border/60 bg-card/50 backdrop-blur-md flex items-center justify-between flex-shrink-0">
        <motion.div>
          <h1 className="font-playfair text-lg font-semibold text-foreground">{t('companionTitle', lang)}</h1>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            {(() => {
              const c = companionChoice;
              if (isEnglish && c.source === 'mbti' && c.type) {
                if (c.mbtiStyle === 'custom') {
                  return `${c.displayName} · ${c.mbti} (${c.type.nameEn})`;
                }
                return `${c.type.nameEn} companion · ${c.mbti}`;
              }
              return (
                <>
                  {c.displayName}
                  {c.subtitle ? ` · ${c.subtitle}` : ''}
                </>
              );
            })()}
            {companionChoice.source === 'mbti' &&
              companionChoice.userMbti &&
              !companionChoice.sameType && (
                <span className="text-muted-foreground/80">
                  {isEnglish ? ` · You: ${companionChoice.userMbti}` : ` · 你係 ${companionChoice.userMbti}`}
                </span>
              )}
          </p>
        </motion.div>
        <div className="flex items-center gap-2">
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="text-xs border border-border/80 rounded-xl px-2.5 py-1.5 bg-background/80 text-foreground"
          >
            {REGION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <CompanionSessionTools
            messages={messages}
            sessionId={sessionId}
            lang={lang}
            region={region}
            companionName={companionChoice.displayName}
            onRetestMbti={() => { setMbtiPickerMode('retest'); setShowMbtiPicker(true); }}
            onChangeCompanion={() => { setMbtiPickerMode('change'); setShowMbtiPicker(true); }}
            onToast={showToast}
          />
          <button
            type="button"
            onClick={resetCompanion}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={t('companionResetTitle', lang)}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <div className="px-4 py-2 bg-muted/30 border-b border-border/40 flex-shrink-0">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
          {t('companionDisclaimer', lang)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && sessionId && (
          <div className="text-center py-10 px-2">
            <p className="text-3xl mb-4 opacity-90">🌙</p>
            <p className="text-foreground text-sm font-medium mb-2">
              {isEnglish && companionChoice.source === 'mbti' && companionChoice.mbtiStyle === 'plain' && companionChoice.type
                ? `Hi — I'm here as your ${companionChoice.type.nameEn} mentor (${companionChoice.mbti}).`
                : isEnglish &&
                    companionChoice.source === 'mbti' &&
                    companionChoice.mbtiStyle === 'custom'
                  ? `Hi — I'm ${companionChoice.displayName}, your custom ${companionChoice.mbti} mentor.`
                : <>{t('companionPresetGreeting', lang, companionChoice.displayName)}</>}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4 max-w-[28ch] mx-auto">
              {companionChoice.source === 'mbti' && isEnglish && companionChoice.mbtiStyle === 'plain' && (
                <>
                  I&apos;ll stay within the {companionChoice.type?.nameEn} ({companionChoice.mbti}) MBTI companion voice — supportive, not a persona of a real person.
                  {companionChoice.userMbti && !companionChoice.sameType && (
                    <> You identify as {companionChoice.userMbti}; you chose a different companion temperament.</>
                  )}
                </>
              )}
              {companionChoice.source === 'mbti' && isEnglish && companionChoice.mbtiStyle === 'custom' && (
                <>
                  Custom persona with {companionChoice.type?.nameEn} ({companionChoice.mbti}) tone — not a real person or character.
                  {companionChoice.userMbti && !companionChoice.sameType && (
                    <> You are {companionChoice.userMbti}; you tuned a different companion temperament.</>
                  )}
                </>
              )}
              {companionChoice.source === 'mbti' && !isEnglish && companionChoice.mbtiStyle === 'plain' && (
                <>
                  我係 {companionChoice.mbti}（{companionChoice.type?.nameZh}/{companionChoice.type?.nameEn}）類型嘅 MBTI 陪伴者，用呢種類型嘅方式陪你慢慢諗、慢慢講——唔扮演任何真人。
                  {companionChoice.userMbti && !companionChoice.sameType && (
                    <> 你係 {companionChoice.userMbti}，揀咗唔同氣質嘅陪伴。</>
                  )}
                </>
              )}
              {companionChoice.source === 'mbti' && !isEnglish && companionChoice.mbtiStyle === 'custom' && (
                <>
                  我係你自訂嘅「{companionChoice.displayName}」，用 {companionChoice.mbti}（{companionChoice.type?.nameZh}）語氣陪你——唔扮演任何真人或角色。
                  {companionChoice.userMbti && !companionChoice.sameType && (
                    <> 你係 {companionChoice.userMbti}，陪伴氣質由你親自調節。</>
                  )}
                </>
              )}
              {companionChoice.source === 'preset' && (
                <>
                  {isEnglish
                    ? `${companionChoice.preset?.taglineEn || companionChoice.preset?.tagline}. ${companionChoice.preset?.descriptionEn || companionChoice.preset?.description || ''}`
                    : `${companionChoice.preset?.tagline}。${companionChoice.preset?.description}`}
                </>
              )}
              {companionChoice.source === 'custom' && (
                <>{t('companionCustomFallback', lang)}</>
              )}
            </p>
          </div>
        )}

        {roundsRemaining !== null && roundsRemaining <= 5 && roundsRemaining > 0 && (
          <div className="rounded-xl bg-accent/10 border border-accent/25 px-3 py-2 text-xs text-accent text-center">
            {t('roundsLeft', lang, roundsRemaining)}
          </div>
        )}

        {limitReached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center mx-1 calm-glow-ring"
          >
            <Crown className="w-8 h-8 text-accent mx-auto mb-3" />
            <p className="font-playfair font-semibold text-foreground mb-1">{t('limitTitle', lang)}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {t('limitBody', lang)}
            </p>
            <Link
              to="/subscription"
              className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-2xl"
            >
              {t('limitCta', lang)}
            </Link>
          </motion.div>
        )}

        {crisis && crisis.length > 0 && (
          <div className="calm-alert-crisis rounded-2xl p-3.5 text-sm">
            <div className="flex items-center gap-2 calm-alert-title mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-accent" />
              {t('crisisTitle', lang)}
            </div>
            <p className="calm-alert-body text-xs mb-3">
              {t('crisisBody', lang)}
            </p>
            <ul className="space-y-2">
              {crisis.map((item, i) => <CrisisRow key={i} item={item} lang={lang} />)}
            </ul>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'ml-auto bubble-user rounded-br-md'
                : msg.role === 'assistant'
                  ? 'mr-auto bubble-assistant rounded-bl-md'
                  : 'mx-auto bg-muted/50 text-muted-foreground text-center text-xs max-w-full px-4 py-2 rounded-xl border border-border/50'
            }`}
          >
            {msg.text}
            {msg.role === 'assistant' && (
              <MessageFeedback
                sessionId={sessionId}
                index={i}
                lang={lang}
                feedback={feedbackMap[i]}
                onFeedback={handleFeedback}
              />
            )}
          </motion.div>
        ))}

        {busy && sessionId && (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && sessionId && !limitReached && !busy && (
        <div className="flex-shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-md px-4 pt-3 pb-2">
          <p className="text-[11px] text-center text-muted-foreground mb-2 font-medium">
            {t('chatPickStarter', lang)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={busy || limitReached}
                className="text-xs px-3.5 py-2.5 rounded-full border border-primary/35 bg-primary/10 text-foreground font-medium hover:border-primary/60 hover:bg-primary/15 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-border/60 bg-card/60 backdrop-blur-md px-4 py-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={limitReached ? t('inputLimit', lang) : t('inputPlaceholder', lang)}
          disabled={!sessionId || busy || limitReached}
          rows={1}
          className="flex-1 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm outline-none focus:border-primary/60 resize-none placeholder:text-muted-foreground/50 leading-relaxed max-h-28"
          style={{ minHeight: '44px' }}
        />
        {speechRecognitionSupported() && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!sessionId || busy || limitReached}
            className={`rounded-2xl p-2.5 flex-shrink-0 border ${listening ? 'border-accent bg-accent/20 text-accent' : 'border-border text-muted-foreground'}`}
            aria-label={listening ? t('voiceStop', lang) : t('voiceListen', lang)}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => send()}
          disabled={!sessionId || busy || !input.trim() || limitReached}
          className="rounded-2xl bg-primary text-primary-foreground p-2.5 disabled:opacity-40 flex-shrink-0 calm-glow-ring"
          aria-label={t('companionSendAria', lang)}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

