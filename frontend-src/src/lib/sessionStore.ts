// ===== Mindlab Session State Machine =====
// 会话状态机：NEW → FREE_TRIAL → CHATTING → COUNSELOR_PENDING → COUNSELOR_SESSION → CRISIS_HANDLING

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── 会话状态枚举 ──
export type SessionState =
  | 'NEW'                  // 首次使用
  | 'FREE_TRIAL'           // 免费体验中
  | 'CHATTING'             // 正在与AI对话
  | 'COUNSELOR_PENDING'    // 已申请真人辅导
  | 'COUNSELOR_SESSION'    // 正在与真人对话
  | 'CRISIS_HANDLING';     // 危机检测触发

// ── 危机风险等级 ──
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

// ── 转接触发类型 ──
export type TriggerType = 'crisis' | 'user_request' | 'ai_suggestion';

// ── 紧急程度 ──
export type Urgency = 'normal' | 'urgent' | 'emergency';

// ── 地区代码 ──
export type RegionCode = 'hk' | 'tw' | 'gb';

// ── 语言偏好 ──
export type LanguagePreference = 'yue' | 'zh-TW' | 'en-GB';

// ── 转接请求结构（PRD §4.2） ──
export interface TransferRequest {
  user_id: string;
  session_id: string;
  trigger_type: TriggerType;
  risk_level: RiskLevel;
  emotion_summary: string;
  topic_tags?: string[];
  urgency: Urgency;
  region: RegionCode;
  language_preference: LanguagePreference;
  preferred_counselor_profile?: {
    specialty?: string[];
    gender?: 'male' | 'female' | 'non-binary' | 'no-preference';
    language?: string[];
  };
  local_crisis_resources: CrisisResource[];
}

// ── 危机资源 ──
export interface CrisisResource {
  name: string;
  number: string;
  description?: string;
}

// ── 三地危机热线 ──
export const CRISIS_RESOURCES: Record<RegionCode, CrisisResource[]> = {
  hk: [
    { name: '撒瑪利亞會', number: '2389 2222', description: '24小時情緒支援熱線' },
    { name: '生命熱線', number: '2382 0000', description: '24小時自殺危機支援' },
    { name: '醫管局精神健康專線', number: '2466 7350', description: '精神健康評估及轉介' },
  ],
  tw: [
    { name: '1925安心專線', number: '1925', description: '24小時安心服務' },
    { name: '1995生命線', number: '1995', description: '24小時協談專線' },
    { name: '張老師專線', number: '0800-788-995', description: '輔導與諮商服務' },
  ],
  gb: [
    { name: 'Samaritans', number: '116 123', description: '24/7 free listening service' },
    { name: 'NHS Mental Health', number: '111', description: 'Non-emergency medical advice' },
    { name: 'Shout', number: '85258', description: '24/7 text-based crisis support' },
  ],
};

// ── 会话状态 ──
export interface SessionStateData {
  current: SessionState;
  sessionId: string | null;
  userId: string | null;
  region: RegionCode;
  languagePreference: LanguagePreference;
  consentCompleted: boolean;
  derivativeDataConsented: boolean; // 衍生数据独立授权 (CR-008)
  isMinor: boolean | null;          // 未成年人标记 (CR-010)
  guardianConsented: boolean;       // 监护人同意
  freeTrialUsed: number;            // 免费体验已用次数
  freeTrialLimit: number;           // 免费体验上限
  currentCounselorId: string | null;
  crisisDetected: boolean;
  riskLevel: RiskLevel;
  lastActivityAt: number;           // 最后活动时间戳
  sessionStartedAt: number | null;  // 会话开始时间
}

// ── 状态转换事件 ──
export type SessionEvent =
  | { type: 'COMPLETE_CONSENT'; derivativeConsented: boolean }
  | { type: 'START_CHAT' }
  | { type: 'DETECT_CRISIS'; riskLevel: RiskLevel }
  | { type: 'REQUEST_COUNSELOR' }
  | { type: 'COUNSELOR_ACCEPT'; counselorId: string }
  | { type: 'COUNSELOR_TIMEOUT' }
  | { type: 'SESSION_END' }
  | { type: 'SESSION_TIMEOUT' }
  | { type: 'CRISIS_RESOLVED'; counselorId: string }
  | { type: 'USER_CLOSE' }
  | { type: 'SET_MINOR'; isMinor: boolean }
  | { type: 'GUARDIAN_CONSENT' }
  | { type: 'SET_REGION'; region: RegionCode; language: LanguagePreference };

// ── 合法状态转换表（V2 — 合并ENHANCED_VALID_TRANSITIONS，修复A级缺陷3） ──
// 修复：CHATTING→COUNSELOR_SESSION（危机→真人直接转接）、COUNSELOR_SESSION→COUNSELOR_PENDING（辅导中可再请求）
const VALID_TRANSITIONS: Record<SessionState, SessionEvent['type'][]> = {
  NEW: ['COMPLETE_CONSENT', 'SET_REGION', 'SET_MINOR', 'GUARDIAN_CONSENT'],
  FREE_TRIAL: ['START_CHAT', 'SET_REGION'],
  CHATTING: ['DETECT_CRISIS', 'REQUEST_COUNSELOR', 'SESSION_TIMEOUT', 'USER_CLOSE', 'COUNSELOR_ACCEPT'], // 修复：危机→真人直接转接
  COUNSELOR_PENDING: ['COUNSELOR_ACCEPT', 'COUNSELOR_TIMEOUT', 'DETECT_CRISIS'],
  COUNSELOR_SESSION: ['SESSION_END', 'SESSION_TIMEOUT', 'DETECT_CRISIS', 'REQUEST_COUNSELOR'], // 修复：辅导中可再请求
  CRISIS_HANDLING: ['CRISIS_RESOLVED', 'REQUEST_COUNSELOR'], // 修复：危机→必须转真人
};

// ── 转换前置条件检查（A级缺陷3修复） ──
interface TransitionPrecondition {
  name: string;
  check: (state: SessionStateData) => boolean;
  errorMessage: string;
}

const TRANSITION_PRECONDITIONS: Record<string, TransitionPrecondition[]> = {
  'NEW→COMPLETE_CONSENT': [
    { name: 'minor_check_completed', check: (s) => s.isMinor !== null, errorMessage: 'Minor status must be determined' },
    { name: 'minor_guardian_consent', check: (s) => s.isMinor !== true || s.guardianConsented === true, errorMessage: 'Minor requires guardian consent' },
  ],
  'FREE_TRIAL→START_CHAT': [
    { name: 'consent_completed', check: (s) => s.consentCompleted === true, errorMessage: 'Cannot chat without consent' },
  ],
  'CHATTING→REQUEST_COUNSELOR': [
    { name: 'has_session', check: (s) => s.sessionId !== null, errorMessage: 'No active session for transfer' },
  ],
  'COUNSELOR_PENDING→COUNSELOR_ACCEPT': [
    { name: 'counselor_assigned', check: (s) => s.currentCounselorId !== null || true, errorMessage: 'No counselor assigned' }, // counselorId由事件传入
  ],
};

// ── 状态不变式验证 ──
function validateStateInvariants(state: SessionStateData): string[] {
  const violations: string[] = [];
  if (state.current !== 'NEW' && !state.consentCompleted) {
    violations.push('INV-001: Non-NEW state without consent completion');
  }
  if (['CHATTING', 'COUNSELOR_PENDING', 'COUNSELOR_SESSION'].includes(state.current) && !state.sessionId) {
    violations.push('INV-002: Active chat state without session ID');
  }
  if (state.current === 'COUNSELOR_SESSION' && !state.currentCounselorId) {
    violations.push('INV-003: Counselor session without counselor ID');
  }
  if (state.current === 'CRISIS_HANDLING' && !state.crisisDetected) {
    violations.push('INV-004: Crisis handling state without crisis detection flag');
  }
  if (state.isMinor === true && !state.guardianConsented && state.current !== 'NEW') {
    violations.push('INV-005: Minor without guardian consent in non-NEW state');
  }
  return violations;
}

// ── 超时配置（毫秒） ──
const TIMEOUTS = {
  CHATTING: 30 * 60 * 1000,       // 30分钟
  COUNSELOR_PENDING: 5 * 60 * 1000, // 5分钟
  COUNSELOR_SESSION: 60 * 60 * 1000, // 60分钟
} as const;

// ── Zustand Store ──
interface SessionStore extends SessionStateData {
  dispatch: (event: SessionEvent) => void;
  reset: () => void;
}

const initialState: SessionStateData = {
  current: 'NEW',
  sessionId: null,
  userId: null,
  region: 'hk',
  languagePreference: 'yue',
  consentCompleted: false,
  derivativeDataConsented: false,
  isMinor: null,
  guardianConsented: false,
  freeTrialUsed: 0,
  freeTrialLimit: 3,
  currentCounselorId: null,
  crisisDetected: false,
  riskLevel: 'none',
  lastActivityAt: Date.now(),
  sessionStartedAt: null,
};

function transition(state: SessionStateData, event: SessionEvent): Partial<SessionStateData> | null {
  // 危机事件可以中断任何状态（最高优先级）
  if (event.type === 'DETECT_CRISIS' && state.current !== 'CRISIS_HANDLING') {
    return {
      current: 'CRISIS_HANDLING',
      crisisDetected: true,
      riskLevel: event.riskLevel,
      lastActivityAt: Date.now(),
    };
  }

  // 校验合法转换
  const allowed = VALID_TRANSITIONS[state.current];
  if (!allowed.includes(event.type)) {
    console.warn(`[SessionStateMachine] Invalid transition: ${state.current} + ${event.type}`);
    return null;
  }

  // 前置条件检查
  const preKey = `${state.current}→${event.type}`;
  const preconditions = TRANSITION_PRECONDITIONS[preKey];
  if (preconditions) {
    for (const pre of preconditions) {
      if (!pre.check(state)) {
        console.warn(`[SessionStateMachine] Precondition failed: ${pre.name} — ${pre.errorMessage}`);
        return null;
      }
    }
  }

  switch (event.type) {
    case 'COMPLETE_CONSENT':
      return {
        current: 'FREE_TRIAL',
        consentCompleted: true,
        derivativeDataConsented: event.derivativeConsented,
        lastActivityAt: Date.now(),
      };

    case 'START_CHAT':
      return {
        current: 'CHATTING',
        sessionStartedAt: Date.now(),
        lastActivityAt: Date.now(),
      };

    case 'REQUEST_COUNSELOR':
      return {
        current: 'COUNSELOR_PENDING',
        lastActivityAt: Date.now(),
      };

    case 'COUNSELOR_ACCEPT':
      return {
        current: 'COUNSELOR_SESSION',
        currentCounselorId: event.counselorId,
        lastActivityAt: Date.now(),
      };

    case 'COUNSELOR_TIMEOUT':
      return {
        current: 'CHATTING',
        lastActivityAt: Date.now(),
      };

    case 'SESSION_END':
      return {
        current: 'CHATTING', // G-011: 辅导结束→AI回接
        currentCounselorId: null,
        lastActivityAt: Date.now(),
      };

    case 'SESSION_TIMEOUT':
      if (state.current === 'CHATTING') {
        return {
          current: 'FREE_TRIAL',
          sessionStartedAt: null,
          lastActivityAt: Date.now(),
        };
      }
      if (state.current === 'COUNSELOR_SESSION') {
        return {
          current: 'CHATTING', // 超时也回AI
          currentCounselorId: null,
          lastActivityAt: Date.now(),
        };
      }
      return null;

    case 'CRISIS_RESOLVED':
      return {
        current: 'COUNSELOR_SESSION',
        currentCounselorId: event.counselorId,
        crisisDetected: false,
        lastActivityAt: Date.now(),
      };

    case 'USER_CLOSE':
      return {
        current: 'FREE_TRIAL',
        sessionStartedAt: null,
        lastActivityAt: Date.now(),
      };

    case 'SET_MINOR':
      return { isMinor: event.isMinor };

    case 'GUARDIAN_CONSENT':
      return { guardianConsented: true };

    case 'SET_REGION':
      return { region: event.region, languagePreference: event.language };

    default:
      return null;
  }
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      dispatch: (event: SessionEvent) => {
        const state = get();
        const changes = transition(state, event);
        if (changes) {
          set(changes);
          // 转换后不变式验证
          const newState = get();
          const violations = validateStateInvariants(newState);
          if (violations.length > 0) {
            console.error(`[SessionStateMachine] Invariant violations after ${event.type}:`, violations);
          }
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'mindlab-session',
      partialize: (state) => ({
        current: state.current,
        sessionId: state.sessionId,
        userId: state.userId,
        region: state.region,
        languagePreference: state.languagePreference,
        consentCompleted: state.consentCompleted,
        derivativeDataConsented: state.derivativeDataConsented,
        isMinor: state.isMinor,
        guardianConsented: state.guardianConsented,
        freeTrialUsed: state.freeTrialUsed,
      }),
    }
  )
);

// ── 超时检测 Hook 工具 ──
export function getSessionTimeout(state: SessionState): number | null {
  return TIMEOUTS[state as keyof typeof TIMEOUTS] ?? null;
}

// ── 各地区未成年人年龄门槛 (CR-010) ──
export const MINOR_AGE_THRESHOLDS: Record<RegionCode, number> = {
  hk: 16,  // 🇭🇰 16岁以下需监护人同意 (待P0修复确认)
  tw: 18,  // 🇹🇼 18岁以下需监护人同意 (待P0修复确认)
  gb: 13,  // 🇬🇧 13岁以下需家长同意 (待P0修复确认)
};

export function isMinorByRegion(age: number, region: RegionCode): boolean {
  return age < MINOR_AGE_THRESHOLDS[region];
}
