'use client';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { mindlabFetch, mindlabHeaders } from '@/lib/mindlabApi';

const SESSION_KEY = 'mindlab_chat_session_id';

function telHref(num) {
  if (!num || typeof num !== 'string') return null;
  const digits = num.replace(/\s/g, '').replace(/-/g, '');
  if (!digits) return null;
  return `tel:${digits}`;
}

function CrisisResourceRow({ item }) {
  if (typeof item === 'string') {
    return (
      <li className="text-xs leading-relaxed text-amber-900">
        {item}
      </li>
    );
  }
  const name = item?.name || item?.Name || '';
  const phone = item?.phone_number || item?.PhoneNumber || item?.number || '';
  const href = telHref(phone);
  const sub =
    item?.available_24h === true || item?.Available24h === true
      ? '24小時'
      : item?.available_24h === false || item?.Available24h === false
        ? ''
        : '';
  return (
    <li className="rounded-lg bg-white/80 border border-amber-200/80 px-3 py-2 text-xs">
      <div className="font-medium text-amber-950">{name || '支援熱線'}</div>
      {phone && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {href ? (
            <a href={href} className="text-primary font-semibold underline underline-offset-2">
              {phone}
            </a>
          ) : (
            <span className="font-semibold">{phone}</span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      )}
    </li>
  );
}

function loadRegion() {
  if (typeof window === 'undefined') return 'HK';
  return sessionStorage.getItem('mindlab_region') || 'HK';
}

export default function CompanionChat() {
  const [region, setRegion] = useState(loadRegion);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [bootErr, setBootErr] = useState(null);
  const [crisis, setCrisis] = useState(null);
  const bottomRef = useRef(null);
  const regionInit = useRef(false);

  useEffect(() => {
    sessionStorage.setItem('mindlab_region', region);
    if (!regionInit.current) {
      regionInit.current = true;
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([]);
    setBootErr(null);
    setCrisis(null);
  }, [region]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, crisis]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sessionId) return;
      setBusy(true);
      setBootErr(null);
      try {
        const res = await mindlabFetch('/api/v1/chat/session', {
          method: 'POST',
          headers: mindlabHeaders(region),
          body: JSON.stringify({ region, language: region === 'GB' ? 'en' : 'zh' }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setBootErr(data?.error?.message || `建立對話失敗 (${res.status})`);
          return;
        }
        const sid = data.session_id;
        if (!sid) {
          setBootErr('伺服器未返回 session_id');
          return;
        }
        sessionStorage.setItem(SESSION_KEY, sid);
        setSessionId(sid);
      } catch (e) {
        if (!cancelled) setBootErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, region]);

  async function send() {
    const text = input.trim();
    if (!text || !sessionId || busy) return;
    setInput('');
    setCrisis(null);
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await mindlabFetch('/api/v1/chat/message', {
        method: 'POST',
        headers: mindlabHeaders(region),
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          region,
          language: region === 'GB' ? 'en' : 'zh',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: 'system', text: data?.error?.message || `請求失敗 (${res.status})` },
        ]);
        return;
      }
      if (data.crisis_detected) {
        setCrisis(data.crisis_resources || []);
        return;
      }
      const reply = data.reply || data.message || '（暫無回覆文字）';
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'system', text: e instanceof Error ? e.message : String(e) },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function newSession() {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([]);
    setCrisis(null);
    setBootErr(null);
    window.location.reload();
  }

  return (
    <div className="px-4 pt-8 pb-28 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-playfair text-xl font-bold text-foreground">陪伴對話</h1>
          <p className="text-muted-foreground text-xs mt-0.5">經 Hybrid 連接 Mindlab Go</p>
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card"
        >
          <option value="HK">香港</option>
          <option value="TW">台灣</option>
          <option value="GB">UK</option>
        </select>
      </div>

      <Link
        to="/records"
        className="flex items-center justify-between text-xs text-primary mb-3 py-2 px-3 rounded-xl bg-accent/50"
      >
        <span>預約與輔導紀錄（Base44）</span>
        <ChevronRight className="w-4 h-4" />
      </Link>

      {bootErr && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm p-3 mb-3">
          {bootErr}
          <p className="text-xs mt-2 text-muted-foreground">
            請確認已於本機啟動 Go（預設 :8080），並執行 npm run dev。
          </p>
        </div>
      )}

      {crisis && crisis.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-3 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            你而家嘅感受好重要
          </div>
          <p className="text-xs text-amber-900/90 mb-3">
            若你有傷害自己或他人嘅念頭，請聯絡當地支援（可直接撳號碼）。
          </p>
          <ul className="space-y-2">
            {crisis.map((item, i) => (
              <CrisisResourceRow key={i} item={item} />
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && sessionId && !bootErr && (
          <p className="text-muted-foreground text-sm text-center py-8">
            慢慢講都得，我哋喺度聽。
          </p>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : msg.role === 'assistant'
                  ? 'mr-auto bg-card border border-border text-foreground'
                  : 'mx-auto bg-muted text-muted-foreground text-center max-w-full'
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs px-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            思考中…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={sessionId ? '輸入你想講嘅嘢…' : '建立對話中…'}
          disabled={!sessionId || busy}
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={send}
          disabled={!sessionId || busy || !input.trim()}
          className="rounded-2xl bg-primary text-primary-foreground p-3 disabled:opacity-40"
          aria-label="送出"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={newSession}
        className="text-center text-xs text-muted-foreground underline mt-2"
      >
        新開一段對話
      </button>
    </div>
  );
}
