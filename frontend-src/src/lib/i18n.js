/**
 * 三地語言字典
 * HK = 廣東話（繁體）
 * TW = 繁體中文（台灣腔）
 * GB = English
 */

export const T = {
  // ── ConsentGate ──────────────────────────────────────────────
  consent_steps: {
    HK: ['非醫療聲明', '個人責任', '危機資源', '數據選項'],
    TW: ['非醫療聲明', '個人責任', '危機資源', '資料選項'],
    GB: ['Non-medical Notice', 'Personal Responsibility', 'Crisis Resources', 'Data Options'],
  },
  consent_step_of: {
    HK: (n, total, label) => `${n} / ${total} — ${label}`,
    TW: (n, total, label) => `${n} / ${total} — ${label}`,
    GB: (n, total, label) => `${n} / ${total} — ${label}`,
  },

  // Step 0
  consent_s0_title: { HK: '使用前須知', TW: '使用前須知', GB: 'Before You Begin' },
  consent_s0_subtitle: { HK: '自由心事並非醫療服務', TW: '自由心事並非醫療服務', GB: 'Mindlab is not a medical service' },
  consent_s0_bullets: {
    HK: [
      '陪伴對話提供情緒支援，唔係心理治療或醫療診斷。',
      '唔可以取代精神科醫生、心理學家或其他醫療專業人員嘅服務。',
      '如你正面對緊急或嚴重精神健康危機，請立即聯絡醫療服務。',
    ],
    TW: [
      '陪伴對話提供情緒支持，不是心理治療或醫療診斷。',
      '不能取代精神科醫師、心理師或其他醫療專業人員的服務。',
      '如您正面臨緊急或嚴重的心理健康危機，請立即聯繫醫療服務。',
    ],
    GB: [
      'Companion conversations provide emotional support — not therapy or medical diagnosis.',
      'This service cannot replace psychiatrists, psychologists, or other medical professionals.',
      'If you are in immediate crisis, please contact emergency services.',
    ],
  },
  consent_s0_cta: { HK: '我明白，繼續', TW: '我了解，繼續', GB: 'I understand, continue' },

  // Step 1
  consent_s1_title: { HK: '個人責任確認', TW: '個人責任確認', GB: 'Personal Responsibility' },
  consent_s1_intro: {
    HK: '使用自由心事服務，即表示你明白及同意以下各點：',
    TW: '使用自由心事服務，即表示您了解並同意以下各點：',
    GB: 'By using Mindlab, you acknowledge and agree to the following:',
  },
  consent_s1_bullets: {
    HK: [
      '你對自己嘅使用行為及決定負上個人責任。',
      '本服務不會就任何因使用而引起嘅後果承擔法律責任。',
      '如有緊急危機，你會主動聯絡緊急服務或危機熱線。',
    ],
    TW: [
      '您對自己的使用行為及決定負個人責任。',
      '本服務不就任何因使用而產生的後果承擔法律責任。',
      '如有緊急危機，您將主動聯絡緊急服務或危機專線。',
    ],
    GB: [
      'You take personal responsibility for your actions and decisions while using this service.',
      'This service does not accept legal liability for any consequences arising from its use.',
      'In an emergency, you will proactively contact emergency services or a crisis line.',
    ],
  },
  consent_s1_checkbox: {
    HK: '我明白以上聲明，並同意承擔個人責任。',
    TW: '我了解以上聲明，並同意承擔個人責任。',
    GB: 'I understand the above and agree to take personal responsibility.',
  },
  consent_s1_cta: { HK: '確認，繼續', TW: '確認，繼續', GB: 'Confirm & continue' },

  // Step 2
  consent_s2_title: { HK: '危機時請聯絡', TW: '危機時請聯繫', GB: 'Crisis Resources' },
  consent_s2_body: {
    HK: '如你或身邊嘅人有即時危險或傷害自己嘅念頭，請立即致電以下熱線：',
    TW: '如果您或身邊的人有立即危險或傷害自己的念頭，請立即撥打以下專線：',
    GB: 'If you or someone near you is in immediate danger or having thoughts of self-harm, please call one of these lines immediately:',
  },
  consent_s2_emergency: {
    HK: '緊急服務：香港 999 · 台灣 110 · 英國 999',
    TW: '緊急服務：台灣 110 / 119 · 香港 999 · 英國 999',
    GB: 'Emergency: UK 999 · HK 999 · TW 110',
  },
  consent_s2_cta: { HK: '知道了，繼續', TW: '我知道了，繼續', GB: 'Noted, continue' },

  // Step 3
  consent_s3_title: { HK: '數據使用（可選）', TW: '資料使用（選填）', GB: 'Data Options (Optional)' },
  consent_s3_body: {
    HK: '以下為可選同意，唔會影響你使用服務：',
    TW: '以下為選填同意，不影響您使用服務：',
    GB: 'The following is optional and does not affect your access:',
  },
  consent_s3_checkbox_title: {
    HK: '同意匿名衍生數據用於改善服務',
    TW: '同意以匿名衍生資料改善服務',
    GB: 'Allow anonymised data to improve the service',
  },
  consent_s3_checkbox_body: {
    HK: '你嘅對話內容唔會直接分享。我哋只會使用匿名整合數據（例如情緒趨勢）改善陪伴品質。你可以隨時撤回同意。',
    TW: '您的對話內容不會直接分享。我們只使用匿名彙整資料（例如情緒趨勢）來改善服務品質。您可隨時撤回同意。',
    GB: 'Your conversations are never shared directly. We only use anonymised aggregate data (e.g. emotional trends) to improve quality. You can withdraw consent at any time.',
  },
  consent_s3_optional_note: {
    HK: '此項為自願，唔選亦可繼續使用',
    TW: '此項為自願，不選亦可繼續使用',
    GB: 'This is voluntary — declining has no effect on your access',
  },
  consent_s3_saving: { HK: '儲存中…', TW: '儲存中…', GB: 'Saving…' },
  consent_s3_cta: { HK: '完成，開始對話', TW: '完成，開始對話', GB: 'Done — start chatting' },

  // ── Help Page ──────────────────────────────────────────────────
  help_title: { HK: '幫助中心', TW: '幫助中心', GB: 'Help Centre' },
  help_subtitle: { HK: '常見問題及危機支援熱線', TW: '常見問題及危機專線', GB: 'FAQs & crisis support lines' },
  help_faq_heading: { HK: '常見問題', TW: '常見問題', GB: 'Frequently Asked Questions' },
  help_crisis_heading: { HK: '危機支援熱線', TW: '危機支援專線', GB: 'Crisis Support Lines' },
  help_emergency_label: { HK: '如有緊急情況', TW: '如有緊急情況', GB: 'In an emergency' },

  faqs: {
    HK: [
      {
        q: '自由心事係咩服務？',
        a: '自由心事提供情緒陪伴支援。唔係醫療服務，唔做診斷或治療，純粹係陪住你、聽你講、同你一齊面對困難。',
      },
      {
        q: '陪伴者係唔係真人？',
        a: '陪伴者係自由心事嘅情緒支援系統，訓練上力求自然、同理、唔說教。真人輔導員支援將於 Phase 2 分段開放。',
      },
      {
        q: '我嘅對話有冇保密？',
        a: '所有對話內容均保密處理。我哋唔會主動向第三方披露，除非你或他人面臨即時危險。',
      },
      {
        q: '如果我處於危機狀態點算？',
        a: '請即致電下方危機熱線，或撥打當地緊急服務（香港：999，台灣：110/119，英國：999）。陪伴者並非危機介入服務。',
      },
      {
        q: '真人輔導幾時開放？',
        a: 'Phase 2 真人輔導將分段開放，港、台、英三地持牌輔導員一對一支援。請留意平台公告。',
      },
      {
        q: '會員計劃包含咩？',
        a: '會員計劃提供無限次陪伴對話、優先預約真人輔導及更多支援功能。詳情請查閱會員頁面。',
      },
    ],
    TW: [
      {
        q: '自由心事是什麼服務？',
        a: '自由心事提供情緒陪伴支持。不是醫療服務，不做診斷或治療，純粹是陪伴您、傾聽您、一起面對困難。',
      },
      {
        q: '陪伴者是真人嗎？',
        a: '陪伴者是自由心事的情緒支持系統，訓練上力求自然、同理、不說教。真人諮商師支持將於 Phase 2 陸續開放。',
      },
      {
        q: '我的對話有保密嗎？',
        a: '所有對話內容均保密處理。我們不會主動向第三方揭露，除非您或他人面臨立即危險。',
      },
      {
        q: '如果我處於危機狀態怎麼辦？',
        a: '請立即撥打下方危機專線，或撥打緊急服務（台灣：110 / 119，香港：999，英國：999）。陪伴者並非危機介入服務。',
      },
      {
        q: '真人諮商何時開放？',
        a: 'Phase 2 真人諮商將陸續開放，提供台、港、英三地持照諮商師一對一支持。請關注平台公告。',
      },
      {
        q: '會員方案包含什麼？',
        a: '會員方案提供無限次陪伴對話、優先預約真人諮商及更多支持功能。詳情請查閱會員頁面。',
      },
    ],
    GB: [
      {
        q: 'What is Mindlab?',
        a: 'Mindlab provides emotional support companionship. It is not a medical service, does not diagnose or treat, and is purely here to listen and accompany you through difficult times.',
      },
      {
        q: 'Is the companion a real person?',
        a: "The companion is Mindlab's emotional support system, trained to be natural, empathetic, and non-preachy. Human counsellor support will be introduced gradually in Phase 2.",
      },
      {
        q: 'Are my conversations confidential?',
        a: 'All conversations are handled confidentially. We do not disclose to third parties unless you or someone else is in immediate danger.',
      },
      {
        q: 'What should I do if I am in crisis?',
        a: 'Please call one of the crisis lines below or dial your local emergency service (UK: 999, HK: 999, TW: 110/119). The companion is not a crisis intervention service.',
      },
      {
        q: 'When will human counselling be available?',
        a: 'Phase 2 human counselling will roll out gradually, offering one-to-one sessions with licensed counsellors across the UK, HK and TW. Watch for platform announcements.',
      },
      {
        q: 'What does the subscription include?',
        a: 'The subscription provides unlimited companion conversations, priority access to human counsellors (Phase 2), and more. See the subscription page for details.',
      },
    ],
  },
};

/** 根據 region 取文字，fallback to HK */
export function t(key, region = 'HK') {
  const r = region?.toUpperCase();
  const entry = T[key];
  if (!entry) return key;
  return entry[r] ?? entry['HK'] ?? key;
}