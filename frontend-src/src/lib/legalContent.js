/** In-app legal documents (HK-first, non-medical emotional support). */

export const LEGAL_PATHS = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
};

const UPDATED = '2026-05-19';

export const LEGAL_DOCS = {
  privacy: {
    'zh-HK': {
      title: '私隱政策',
      updated: UPDATED,
      intro:
        '自由心事（Mindlab）重視你的私隱。本政策說明我們如何收集、使用及保護你的資料。使用本服務即表示你理解本政策。',
      sections: [
        {
          h: '1. 服務性質',
          p: '本平台提供情緒陪伴支援，並非醫療診斷、治療或危機介入服務。我們不替代持牌醫護或緊急服務。',
        },
        {
          h: '2. 我們收集的資料',
          p: '可能包括：帳戶識別、地區與語言偏好、同意記錄、陪伴對話內容（用於提供服務及安全監測）、預約資料、訂閱與付款狀態（經 Stripe 處理）、跨裝置設定同步（sync_blob）、未成年人監護設定，以及你主動提供的心情備註。',
        },
        {
          h: '3. 使用目的',
          p: '用於提供陪伴對話、危機關鍵字偵測時顯示熱線、改善服務、處理訂閱、跨裝置同步設定，以及履行法律或安全所需。',
        },
        {
          h: '4. 危機與安全',
          p: '若系統偵測到可能涉及自傷或自殺的內容，會顯示當地支援熱線，並可能記錄審計日誌（不含完整對話對外披露）。如有即時生命危險，請致電 999 或當地緊急服務。',
        },
        {
          h: '5. 分享與披露',
          p: '我們不會出售你的個人資料。僅在必要時與技術託管（如 Base44、Stripe）、法律要求或保護你與他人安全時，按最小需要原則處理。',
        },
        {
          h: '6. 保存與刪除',
          p: '資料保存於提供服務所需期間。你可透過停止使用、聯絡我們或於設定撤回同意；部分記錄因安全審計可能需保留一段時間。',
        },
        {
          h: '7. 你的權利',
          p: '你可查閱、更正或要求刪除合理範圍內的個人資料，亦可撤回非必要同意（例如衍生數據用於改善服務）。',
        },
        {
          h: '8. 聯絡我們',
          p: '如有私隱查詢，請透過應用內「幫助中心」或你註冊帳戶所綁定的聯絡方式與營運團隊聯絡。',
        },
      ],
    },
    'zh-TW': {
      title: '隱私權政策',
      updated: UPDATED,
      intro:
        '自由心事（Mindlab）重視你的隱私。本政策說明我們如何蒐集、使用及保護你的資料。使用本服務即表示你理解本政策。',
      sections: [
        {
          h: '1. 服務性質',
          p: '本平台提供情緒陪伴支援，並非醫療診斷、治療或危機介入服務。',
        },
        {
          h: '2. 我們蒐集的資料',
          p: '可能包括：帳戶識別、地區與語言、同意記錄、對話內容、預約、訂閱狀態（Stripe）、設定同步、監護人設定及心情備註等。',
        },
        {
          h: '3. 使用目的',
          p: '用於提供陪伴、危機資源提示、訂閱管理、設定同步及服務改善。',
        },
        {
          h: '4. 危機與安全',
          p: '偵測到高風險內容時會顯示專線並可能留下審計記錄。緊急情況請撥 110/119 或當地緊急服務。',
        },
        {
          h: '5. 分享與揭露',
          p: '不出售個資；僅於必要時與託管、金流或依法提供之最小範圍內處理。',
        },
        {
          h: '6. 保存與刪除',
          p: '於必要期間保存；你可要求查閱、更正或刪除合理範圍內之資料。',
        },
        {
          h: '7. 你的權利',
          p: '可查閱、更正、刪除或撤回非必要同意。',
        },
        {
          h: '8. 聯絡我們',
          p: '請透過應用內「幫助中心」或帳戶聯絡方式與我們聯繫。',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      updated: UPDATED,
      intro:
        'Mindlab (“自由心事”) respects your privacy. This policy explains what we collect, why, and how we protect it. By using the service you acknowledge this policy.',
      sections: [
        {
          h: '1. Nature of the service',
          p: 'We provide emotional companionship — not medical diagnosis, treatment, or emergency intervention.',
        },
        {
          h: '2. Data we collect',
          p: 'May include account identifiers, region/language, consent records, chat content, bookings, subscription status (via Stripe), cross-device settings sync, guardian settings, and optional mood notes.',
        },
        {
          h: '3. Purposes',
          p: 'To run companion chat, show crisis resources when needed, manage subscriptions, sync settings, and improve safety and service quality.',
        },
        {
          h: '4. Crisis & safety',
          p: 'High-risk phrases may trigger helpline information and audit logging. In immediate danger, call local emergency services (e.g. 999 UK/HK).',
        },
        {
          h: '5. Sharing',
          p: 'We do not sell personal data. Limited sharing with hosting/payment providers or when required by law or safety.',
        },
        {
          h: '6. Retention',
          p: 'Kept as long as needed for the service; you may request access, correction, or deletion within reasonable limits.',
        },
        {
          h: '7. Your rights',
          p: 'Access, rectify, delete, or withdraw optional consents where applicable.',
        },
        {
          h: '8. Contact',
          p: 'Reach us via in-app Help or your registered account contact channel.',
        },
      ],
    },
  },
  terms: {
    'zh-HK': {
      title: '使用條款',
      updated: UPDATED,
      intro:
        '歡迎使用自由心事（Mindlab）。請細閱以下條款；開始使用即表示你同意受本條款約束。',
      sections: [
        {
          h: '1. 服務說明',
          p: '本平台提供 AI 情緒陪伴對話、資源資訊及相關功能（部分為付費）。我們不保證任何治療效果或專業診斷結果。',
        },
        {
          h: '2. 非醫療聲明',
          p: '內容僅供情緒支援，不能代替醫生、精神科、心理治療或緊急服務。如有身體或心理急症，請即尋求專業協助。',
        },
        {
          h: '3. 用戶責任',
          p: '你須對自己的言論與行為負責，不得利用平台從事違法、騷擾、仇恨或傷害自己或他人的行為。',
        },
        {
          h: '4. 帳戶與年齡',
          p: '未成年人須在監護人同意下方可使用陪伴對話。你提供的資料須真實、準確。',
        },
        {
          h: '5. 訂閱與付款',
          p: '付費功能經 Stripe 處理；價格以訂閱頁顯示為準。除法律另有規定外，已付費用一般不予退款，詳情以付款時說明為準。',
        },
        {
          h: '6. 內容與知識產權',
          p: '平台介面、文案及系統設計屬營運方所有。你保留對話內容的權利，但授予我們為提供及改善服務所需之處理權限。',
        },
        {
          h: '7. 免責',
          p: '在法律允許範圍內，我們不對因使用或無法使用服務而產生的間接損失負責；服務按「現狀」提供。',
        },
        {
          h: '8. 終止與變更',
          p: '我們可暫停或終止違規帳戶，並可更新條款；重大變更將於應用內提示。繼續使用即視為接受更新。',
        },
        {
          h: '9. 適用法律',
          p: '本條款以香港特別行政區法律為主要參考；爭議先以善意協商解決。',
        },
      ],
    },
    'zh-TW': {
      title: '使用條款',
      updated: UPDATED,
      intro: '歡迎使用自由心事（Mindlab）。使用本服務即表示你同意以下條款。',
      sections: [
        { h: '1. 服務說明', p: '提供 AI 情緒陪伴及相關功能，不保證治療效果。' },
        { h: '2. 非醫療聲明', p: '不能取代醫療或緊急服務。' },
        { h: '3. 用戶責任', p: '不得從事違法或傷害行為。' },
        { h: '4. 帳戶與年齡', p: '未成年人須監護人同意。' },
        { h: '5. 訂閱與付款', p: '付款經 Stripe；退款以當時說明為準。' },
        { h: '6. 智慧財產權', p: '平台內容屬營運方；你授予必要之資料處理權。' },
        { h: '7. 免責', p: '服務按現狀提供，法律允許範圍內之免責。' },
        { h: '8. 變更', p: '條款可更新，繼續使用視為接受。' },
        { h: '9. 準據法', p: '以香港法律為主要參考。' },
      ],
    },
    en: {
      title: 'Terms of Use',
      updated: UPDATED,
      intro: 'Welcome to Mindlab. By using the service you agree to these terms.',
      sections: [
        { h: '1. Service', p: 'AI emotional companionship and related features; no guaranteed therapeutic outcome.' },
        { h: '2. Not medical', p: 'Not a substitute for licensed care or emergency services.' },
        { h: '3. Your conduct', p: 'You are responsible for lawful use; no harm to self or others.' },
        { h: '4. Minors', p: 'Guardian consent required for users under 18 where applicable.' },
        { h: '5. Payments', p: 'Subscriptions via Stripe; refunds as stated at checkout.' },
        { h: '6. IP', p: 'Platform content is ours; you grant processing rights needed to operate the service.' },
        { h: '7. Liability', p: 'Provided “as is” within limits permitted by law.' },
        { h: '8. Changes', p: 'We may update terms; continued use means acceptance.' },
        { h: '9. Law', p: 'Primarily interpreted with reference to Hong Kong law.' },
      ],
    },
  },
};

export function getLegalDoc(doc, lang) {
  const safeLang = ['zh-HK', 'zh-TW', 'en'].includes(lang) ? lang : 'zh-HK';
  const bucket = LEGAL_DOCS[doc];
  if (!bucket) return null;
  return bucket[safeLang] || bucket['zh-HK'];
}
