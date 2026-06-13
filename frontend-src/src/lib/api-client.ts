'use client';
const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090')
  : 'http://localhost:8090';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mindlab_token');
}

export async function apiFetch(path: string, options: Record<string, any> = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...options.headers,
  };
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || 'API error');
  }
  return res.json();
}

// Entity CRUD (replaces base44.entities.*)
// Supports Base44-style signatures: filter({...}, sort, limit)
export const db = {
  userProfile: {
    get: (userId: string) => apiFetch('/api/v1/users/' + userId),
    update: (userId: string, data: any) => apiFetch('/api/v1/users/' + userId, { method: 'PATCH', body: JSON.stringify(data) }),
    create: (data: any) => apiFetch('/api/v1/users', { method: 'POST', body: JSON.stringify(data) }),
    filter: (filter: any, sort?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (filter?.user_id) params.set('user_id', filter.user_id);
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return apiFetch('/api/v1/users?' + params.toString());
    },
  },
  chatSession: {
    create: (data: any) => apiFetch('/api/v1/sessions', { method: 'POST', body: JSON.stringify(data) }),
    filter: (filter: any, sort?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (filter?.user_id) params.set('user_id', filter.user_id);
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return apiFetch('/api/v1/sessions?' + params.toString());
    },
  },
  chatMessage: {
    send: (sessionId: string, message: string, region: string) => apiFetch('/api/v1/sessions/' + sessionId + '/messages', { method: 'POST', body: JSON.stringify({ message, region }) }),
  },
  consent: {
    create: (data: any) => apiFetch('/api/v1/consents', { method: 'POST', body: JSON.stringify(data) }),
  },
  appointment: {
    create: (data: any) => apiFetch('/api/v1/appointments', { method: 'POST', body: JSON.stringify(data) }),
    list: (sort?: string) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      return apiFetch('/api/v1/appointments?' + params.toString());
    },
  },
  skinUnlock: {
    create: (data: any) => apiFetch('/api/v1/skins/unlock', { method: 'POST', body: JSON.stringify(data) }),
  },
  milestone: {
    filter: (filter: any, sort?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (filter?.user_id) params.set('user_id', filter.user_id);
      if (filter?.status) params.set('status', filter.status);
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return apiFetch('/api/v1/milestones?' + params.toString());
    },
    generate: (data: any) => apiFetch('/api/v1/milestones/generate', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch('/api/v1/milestones/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
  },
};

// Functions (replaces base44.functions.invoke)
export const functions = {
  companionChat: (data: any) => apiFetch('/api/v1/chat/companion', { method: 'POST', body: JSON.stringify(data) }),
  generateMilestones: (data: any) => apiFetch('/api/v1/milestones/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (data: any) => apiFetch('/api/v1/milestones/' + data.milestone_id, { method: 'PATCH', body: JSON.stringify(data) }),
  createSubscription: (data: any) => apiFetch('/api/v1/payments/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  verifySubscription: (data: any) => apiFetch('/api/v1/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  purchaseSkin: (data: any) => apiFetch('/api/v1/payments/skin', { method: 'POST', body: JSON.stringify(data) }),
  verifySkinPurchase: (data: any) => apiFetch('/api/v1/payments/skin/verify', { method: 'POST', body: JSON.stringify(data) }),
};
