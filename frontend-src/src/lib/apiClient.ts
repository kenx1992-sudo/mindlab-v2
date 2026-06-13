// ===== Mindlab API Client — 前后端联调适配层 =====
// 统一封装所有后端API调用，含请求/响应类型、错误处理、地区适配、重试逻辑

import type { RegionCode, RiskLevel, TransferRequest, CrisisResource } from '@/lib/sessionStore';

// ── API Base URL（按地区路由） ──
const API_BASE: Record<RegionCode, string> = {
  hk: process.env.NEXT_PUBLIC_API_BASE_HK || '/api',
  tw: process.env.NEXT_PUBLIC_API_BASE_TW || '/api',
  gb: process.env.NEXT_PUBLIC_API_BASE_GB || '/api',
};

// ── 通用请求配置 ──
interface RequestConfig {
  region: RegionCode;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// ── API错误类 ──
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public region?: RegionCode
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ── 通用请求封装（含重试+超时） ──
async function request<T>(
  path: string,
  options: RequestInit & { region: RegionCode; timeout?: number; retries?: number }
): Promise<T> {
  const { region, timeout = 10000, retries = 2, ...fetchOptions } = options;
  const retryDelay = 1000;
  const base = API_BASE[region];
  const url = `${base}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (retries ?? 0); attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Region': region,
          'X-Locale': region,
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new APIError(
          response.status,
          body.code || 'UNKNOWN',
          body.message || `HTTP ${response.status}`,
          region
        );
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      // 不重试 4xx 错误
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // 重试前等待
      if (attempt < (retries ?? 0)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new APIError(0, 'NETWORK_ERROR', 'Network request failed', region);
}

// ===== AI对话 API =====

export interface ChatRequest {
  message: string;
  session_id: string;
  locale: RegionCode;
  conversation_history?: Array<{ role: 'user' | 'ai'; content: string }>;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  crisis_detected: boolean;
  risk_level: RiskLevel;
  ai_labelled: boolean;
  timestamp: number;
}

// SSE流式响应
export interface ChatStreamChunk {
  token: string;
  done: boolean;
  crisis_detected?: boolean;
  risk_level?: RiskLevel;
}

export async function sendChatMessage(
  params: ChatRequest,
  region: RegionCode
): Promise<ChatResponse> {
  return request<ChatResponse>('/chat', {
    method: 'POST',
    region,
    body: JSON.stringify(params),
    timeout: 30000, // AI回复可能较慢
  });
}

// SSE流式对话
export function createChatSSEStream(
  params: ChatRequest,
  region: RegionCode
): EventSource | null {
  if (typeof window === 'undefined') return null;

  const base = API_BASE[region];
  // SSE通过POST请求，需要使用fetch+ReadableStream
  // 此处返回一个自定义EventTarget模拟EventSource
  return null; // TODO: 实现SSE流式连接
}

export async function sendChatMessageStream(
  params: ChatRequest,
  region: RegionCode,
  onChunk: (chunk: ChatStreamChunk) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  const base = API_BASE[region];
  const controller = new AbortController();

  try {
    const response = await fetch(`${base}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Region': region,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new APIError(response.status, 'STREAM_ERROR', 'Failed to start stream', region);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const chunk = JSON.parse(data) as ChatStreamChunk;
            onChunk(chunk);
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ===== 危机检测 API =====

export interface CrisisDetectRequest {
  message: string;
  session_id: string;
  locale: RegionCode;
}

export interface CrisisDetectResponse {
  detected: boolean;
  risk_level: RiskLevel;
  resources: CrisisResource[];
  confidence: number;
}

export async function detectCrisis(
  params: CrisisDetectRequest,
  region: RegionCode
): Promise<CrisisDetectResponse> {
  return request<CrisisDetectResponse>('/crisis/detect', {
    method: 'POST',
    region,
    body: JSON.stringify(params),
    timeout: 3000, // SLO ≤3s
    retries: 0, // 危机检测不重试，走客户端预检兜底
  });
}

// ===== 转接 API =====

export interface TransferRequestParams extends Omit<TransferRequest, 'local_crisis_resources'> {}

export interface TransferResponse {
  transfer_id: string;
  counselor_id?: string;
  counselor_name?: string;
  counselor_cert?: string;
  estimated_wait_seconds: number;
  status: 'matching' | 'matched' | 'failed';
}

export interface TransferAcceptRequest {
  transfer_id: string;
  counselor_id: string;
}

export interface TransferAcceptResponse {
  session_id: string;
  websocket_url: string;
}

export async function requestTransfer(
  params: TransferRequestParams,
  region: RegionCode
): Promise<TransferResponse> {
  const resources = getLocalCrisisResources(region);
  return request<TransferResponse>('/transfer/request', {
    method: 'POST',
    region,
    body: JSON.stringify({ ...params, local_crisis_resources: resources }),
    timeout: 5000,
  });
}

export async function acceptTransfer(
  params: TransferAcceptRequest,
  region: RegionCode
): Promise<TransferAcceptResponse> {
  return request<TransferAcceptResponse>('/transfer/accept', {
    method: 'POST',
    region,
    body: JSON.stringify(params),
    timeout: 5000,
  });
}

// ===== 知情同意 API =====

export interface ConsentRequest {
  user_id: string;
  consent_types: Array<'privacy' | 'derivative_data' | 'minor_guardian'>;
  locale: RegionCode;
  minor_consent?: boolean;
  guardian_info?: {
    name: string;
    relationship: string;
    signature: string;
  };
  derivative_data_consented: boolean;
}

export interface ConsentResponse {
  consent_id: string;
  recorded_at: string;
  consented_types: string[];
}

export async function recordConsent(
  params: ConsentRequest,
  region: RegionCode
): Promise<ConsentResponse> {
  return request<ConsentResponse>('/consent', {
    method: 'POST',
    region,
    body: JSON.stringify(params),
    timeout: 10000,
  });
}

// ===== 用户数据 API =====

export interface UserDataDeleteResponse {
  deletion_id: string;
  scheduled_at: string;
  estimated_completion_minutes: number;
  regions_affected: RegionCode[];
}

export async function deleteAllUserData(
  userId: string,
  region: RegionCode
): Promise<UserDataDeleteResponse> {
  return request<UserDataDeleteResponse>(`/user/${userId}/data`, {
    method: 'DELETE',
    region,
    timeout: 15000,
  });
}

// ===== 情绪档案 API (G-012 P1) =====

export interface EmotionProfile {
  user_id: string;
  current_mood: string;
  mood_score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  weekly_data: Array<{ date: string; score: number; mood: string }>;
  last_updated: string;
}

export async function getEmotionProfile(
  userId: string,
  region: RegionCode,
  period: '7d' | '30d' | '90d' = '30d'
): Promise<EmotionProfile> {
  return request<EmotionProfile>(`/user/${userId}/emotion?period=${period}`, {
    method: 'GET',
    region,
    timeout: 10000,
  });
}

// ===== 衍生数据授权撤回 API (CR-008) =====

export interface DerivativeConsentResponse {
  consent_id: string;
  status: 'active' | 'revoked';
  revoked_at?: string;
  data_deletion_eta?: string; // 撤回后72h内删除
}

export async function revokeDerivativeConsent(
  userId: string,
  region: RegionCode
): Promise<DerivativeConsentResponse> {
  return request<DerivativeConsentResponse>(`/user/${userId}/derivative-consent`, {
    method: 'DELETE',
    region,
    timeout: 10000,
  });
}

// ===== 辅导员匹配 API (G-010 P1) =====

export interface CounselorProfile {
  counselor_id: string;
  display_name: string;
  certification: string;
  specialties: string[];
  languages: string[];
  available: boolean;
  next_available?: string;
  rating?: number;
}

export interface CounselorMatchResponse {
  counselors: CounselorProfile[];
  total_available: number;
}

export async function getAvailableCounselors(
  region: RegionCode,
  filters?: { specialty?: string; language?: string }
): Promise<CounselorMatchResponse> {
  const params = new URLSearchParams();
  if (filters?.specialty) params.set('specialty', filters.specialty);
  if (filters?.language) params.set('language', filters.language);

  return request<CounselorMatchResponse>(`/counselors?${params.toString()}`, {
    method: 'GET',
    region,
    timeout: 10000,
  });
}

// ===== 自助工具箱 API (G-013 P1) =====

export interface SelfHelpTool {
  id: string;
  type: 'cbt' | 'meditation' | 'breathing' | 'journal';
  title: string;
  description: string;
  duration_minutes: number;
  locale: RegionCode;
}

export async function getSelfHelpTools(region: RegionCode): Promise<SelfHelpTool[]> {
  return request<SelfHelpTool[]>('/tools/self-help', {
    method: 'GET',
    region,
    timeout: 10000,
  });
}

// ===== 投诉反馈 API (G-021 P1) =====

export interface FeedbackRequest {
  session_id: string;
  rating: number; // 1-5
  comment?: string;
  category: 'ai_quality' | 'counselor_behavior' | 'technical' | 'other';
  is_high_risk: boolean; // 涉及辅导员不当行为/数据泄露自动标记
}

export interface FeedbackResponse {
  feedback_id: string;
  created_at: string;
  estimated_response_hours: number; // 48h内
}

export async function submitFeedback(
  params: FeedbackRequest,
  region: RegionCode
): Promise<FeedbackResponse> {
  return request<FeedbackResponse>('/feedback', {
    method: 'POST',
    region,
    body: JSON.stringify(params),
    timeout: 10000,
  });
}

// ===== 辅助函数 =====

function getLocalCrisisResources(region: RegionCode): CrisisResource[] {
  const resources: Record<RegionCode, CrisisResource[]> = {
    hk: [
      { name: '撒瑪利亞會', number: '2389 2222' },
      { name: '生命熱線', number: '2382 0000' },
      { name: '醫管局', number: '2466 7350' },
    ],
    tw: [
      { name: '1925安心專線', number: '1925' },
      { name: '1995生命線', number: '1995' },
      { name: '張老師', number: '0800-788-995' },
    ],
    gb: [
      { name: 'Samaritans', number: '116 123' },
      { name: 'NHS', number: '111' },
      { name: 'Shout', number: '85258' },
    ],
  };
  return resources[region];
}
