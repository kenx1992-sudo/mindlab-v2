'use client';
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090')
  : 'http://localhost:8090';

const ANON_KEY = 'mindlab_anon_token';

export function getMindlabAnonToken(): string {
  if (typeof window === 'undefined') return 'anon_ssr_' + Date.now();
  let t = sessionStorage.getItem(ANON_KEY);
  if (!t) {
    t = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
    sessionStorage.setItem(ANON_KEY, t);
  }
  return t;
}

export function mindlabHeaders(region: string = 'HK'): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Region': region,
    'X-Anonymous-Token': getMindlabAnonToken(),
  };
}

export async function mindlabFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const p = path.startsWith('/') ? path : '/' + path;
  const url = API_BASE + p;
  const headers = new Headers(init.headers as Record<string, string> || {});
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}

export async function mindlabHealthCheck(): Promise<{ ok: boolean; status: number; body?: any; error?: string }> {
  try {
    const res = await mindlabFetch('/healthz', { method: 'GET' });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || String(e) };
  }
}
