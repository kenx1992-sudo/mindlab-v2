import { normalizeLanguage } from '@/lib/locale';

const P = {
  hubTag: { 'zh-HK': '陪伴者配對', 'zh-TW': '陪伴者配對', en: 'Companion setup' },
  hubTitle: { 'zh-HK': '揀個啱你嘅陪伴者', 'zh-TW': '選一個適合你的陪伴者', en: 'Choose your companion' },
  hubDesc: {
    'zh-HK': 'MBTI 類型陪伴、推薦角色，或自訂人格——全部只係情緒支援語氣，唔扮演真人。',
    'zh-TW': 'MBTI 類型陪伴、推薦角色，或自訂人格——都是情緒支援語氣，不扮演真人。',
    en: 'MBTI companion, recommended personas, or custom — emotional support tone only, not real people.',
  },
  mbtiMode: { 'zh-HK': 'MBTI 陪伴', 'zh-TW': 'MBTI 陪伴', en: 'MBTI companion' },
  mbtiModeDesc: {
    'zh-HK': '用類型語氣陪你，參考名人僅供了解類型',
    'zh-TW': '用類型語氣陪你，名人僅供了解類型',
    en: 'Type-based tone; celebrities are references only',
  },
  presetMode: { 'zh-HK': '推薦陪伴角色', 'zh-TW': '推薦陪伴角色', en: 'Recommended companions' },
  presetModeDesc: { 'zh-HK': '八個原創角色，廣東話、溫暖、唔施壓', 'zh-TW': '八個原創角色，溫暖、不施壓', en: 'Eight original personas, warm and gentle' },
  customMode: { 'zh-HK': '自訂陪伴者', 'zh-TW': '自訂陪伴者', en: 'Custom companion' },
  customModeDesc: { 'zh-HK': '自己起名、寫性格', 'zh-TW': '自己取名、寫性格', en: 'Name and personality your way' },
  quizBtn: { 'zh-HK': '8 題快速測試', 'zh-TW': '8 題快速測驗', en: '8-question quiz' },
  manualBtn: { 'zh-HK': '我已經知道自己嘅類型', 'zh-TW': '我已經知道自己的類型', en: 'I already know my type' },
  backMbti: { 'zh-HK': '返回 MBTI 模式', 'zh-TW': '返回 MBTI 模式', en: 'Back to MBTI' },
  quizResult: { 'zh-HK': '測試結果', 'zh-TW': '測驗結果', en: 'Quiz result' },
  quizResultDesc: {
    'zh-HK': '以下係你嘅類型（可改選）。確認後會幫你推薦適合嘅陪伴者氣質。',
    'zh-TW': '以下是你的類型（可改選）。確認後會推薦適合的陪伴氣質。',
    en: 'Your suggested type (you can change it). Next, pick a companion temperament.',
  },
  continueType: { 'zh-HK': '用我嘅類型', 'zh-TW': '用我的類型', en: 'Use my type' },
  orPick: { 'zh-HK': '或者撳上面任何類型，確認 MBTI 陪伴者。', 'zh-TW': '或點選上方任一類型，確認 MBTI 陪伴者。', en: 'Or tap any type above to confirm.' },
  changeType: { 'zh-HK': '換陪伴類型', 'zh-TW': '更換陪伴類型', en: 'Change type' },
  mbtiCompanion: { 'zh-HK': 'MBTI 陪伴者', 'zh-TW': 'MBTI 陪伴者', en: 'MBTI companion' },
  celebritiesNote: { 'zh-HK': '坊間常被歸類為', 'zh-TW': '坊間常被歸類為', en: 'Often typed as' },
  celebritiesSuffix: { 'zh-HK': '嘅名人', 'zh-TW': '的名人', en: ' celebrities' },
  customPersona: { 'zh-HK': '或者改為自訂 MBTI 人格 →', 'zh-TW': '或改為自訂 MBTI 人格 →', en: 'Or custom MBTI persona →' },
  startBriefing: { 'zh-HK': '睇說明並開始 MBTI 陪伴', 'zh-TW': '看說明並開始 MBTI 陪伴', en: 'Briefing & start' },
  backCompanion: { 'zh-HK': '返回 MBTI 陪伴者', 'zh-TW': '返回 MBTI 陪伴者', en: 'Back' },
  customTitle: { 'zh-HK': '自訂 MBTI 人格', 'zh-TW': '自訂 MBTI 人格', en: 'Custom MBTI persona' },
  customSubtitle: { 'zh-HK': '為陪伴者起名同調性格', 'zh-TW': '為陪伴者取名與調整性格', en: 'Name & tune your mentor' },
  nameLabel: { 'zh-HK': '陪伴者名字', 'zh-TW': '陪伴者名字', en: 'Companion name' },
  namePh: { 'zh-HK': '例如：阿柔、夜貓、樹洞…', 'zh-TW': '例如：小柔、夜貓、樹洞…', en: 'e.g. Luna, Coach K…' },
  toneLabel: { 'zh-HK': '陪伴者 MBTI 語氣', 'zh-TW': '陪伴者 MBTI 語氣', en: 'MBTI tone' },
  styleLabel: { 'zh-HK': '性格與傾偈風格', 'zh-TW': '性格與聊天風格', en: 'Personality & style' },
  minChars: { 'zh-HK': '至少 8 個字，最多 400 字', 'zh-TW': '至少 8 個字，最多 400 字', en: 'At least 8 characters, max 400' },
  mentorContinue: { 'zh-HK': '睇導師說明並繼續', 'zh-TW': '看導師說明並繼續', en: 'Mentor briefing →' },
  introTitle: { 'zh-HK': 'MBTI 陪伴說明', 'zh-TW': 'MBTI 陪伴說明', en: 'MBTI companion intro' },
  introAgree: { 'zh-HK': '下一步：開始陪伴對話', 'zh-TW': '下一步：開始陪伴對話', en: 'Next — start chat' },
  saveFail: { 'zh-HK': '儲存失敗，請再揀一次或重新整理頁面。', 'zh-TW': '儲存失敗，請再選一次或重新整理。', en: 'Save failed. Please try again.' },
  pickTypeFirst: { 'zh-HK': '請先揀陪伴類型。', 'zh-TW': '請先選擇陪伴類型。', en: 'Pick a companion type first.' },
  pickUserType: { 'zh-HK': '請先確認你嘅 MBTI 類型。', 'zh-TW': '請先確認你的 MBTI 類型。', en: 'Confirm your MBTI type first.' },
  fillCustom: { 'zh-HK': '請填寫自訂陪伴者資料。', 'zh-TW': '請填寫自訂陪伴者資料。', en: 'Fill in custom companion details.' },
  presetPick: { 'zh-HK': '揀一個推薦角色', 'zh-TW': '選一個推薦角色', en: 'Pick a recommended companion' },
  customPickTitle: { 'zh-HK': '自訂陪伴者', 'zh-TW': '自訂陪伴者', en: 'Custom companion' },
  customPickDesc: { 'zh-HK': '為陪伴者起名，寫低你想佢點同你傾', 'zh-TW': '為陪伴者取名，寫下你想他怎麼陪你聊', en: 'Name them and describe how they should talk with you' },
  saveToLibrary: { 'zh-HK': '儲存到陪伴者庫', 'zh-TW': '儲存到陪伴者庫', en: 'Save to library' },
  libraryTitle: { 'zh-HK': '我嘅陪伴者庫', 'zh-TW': '我的陪伴者庫', en: 'My companion library' },
  libraryEmpty: {
    'zh-HK': '尚未儲存任何陪伴者。完成自訂後可儲存到庫。',
    'zh-TW': '尚未儲存任何陪伴者。完成自訂後可儲存到庫。',
    en: 'No saved companions yet. Save one after customizing.',
  },
  librarySaved: { 'zh-HK': '已儲存到陪伴者庫', 'zh-TW': '已儲存到陪伴者庫', en: 'Saved to library' },
  back: { 'zh-HK': '返回', 'zh-TW': '返回', en: 'Back' },
  mbtiHubDesc: {
    'zh-HK': '先用小測試或手動揀你嘅類型，再揀陪伴氣質——以 MBTI 陪伴者同你傾，並可參考坊間常被歸類為該類型的名人。',
    'zh-TW': '先用小測驗或手動選你的類型，再選陪伴氣質——以 MBTI 陪伴者與你聊，並可參考坊間常被歸類為該類型的名人。',
    en: 'Confirm your type, pick a companion temperament, then chat as an MBTI companion (with optional reference celebrities for that type).',
  },
  hubIntro: {
    'zh-HK': 'MBTI 模式會先做類型確認，再揀陪伴氣質。亦可試推薦角色或自訂陪伴者。',
    'zh-TW': 'MBTI 模式會先做類型確認，再選陪伴氣質。亦可試推薦角色或自訂陪伴者。',
    en: 'MBTI flow confirms your type first, then companion tone. Or try presets / custom.',
  },
  presetPickHint: {
    'zh-HK': '撳一下角色卡片即可開始陪伴',
    'zh-TW': '點一下角色卡片即可開始陪伴',
    en: 'Tap a card to start',
  },
  customCreateTitle: { 'zh-HK': '創造你嘅陪伴者', 'zh-TW': '創造你的陪伴者', en: 'Create your companion' },
  customCreateDesc: {
    'zh-HK': '幫佢起個名，再寫低你想佢點樣同你傾偈——愈具體，陪伴感愈貼你。',
    'zh-TW': '幫他取名，再寫下你想他怎麼陪你聊——愈具體，陪伴感愈貼你。',
    en: 'Name them and describe how they should talk with you — the more specific, the better.',
  },
  customNameLabel: { 'zh-HK': '角色名稱', 'zh-TW': '角色名稱', en: 'Name' },
  customStyleLabel: { 'zh-HK': '性格與傾偈風格', 'zh-TW': '性格與聊天風格', en: 'Personality & style' },
  customStylePh: {
    'zh-HK': '例如：語氣慢啲、唔好連環問問題、偶爾用輕鬆比喻…',
    'zh-TW': '例如：語氣慢一點、不要連環問問題、偶爾用輕鬆比喻…',
    en: 'e.g. gentle pace, no rapid-fire questions, light metaphors…',
  },
  startChat: { 'zh-HK': '開始陪伴對話', 'zh-TW': '開始陪伴對話', en: 'Start companion chat' },
  figurePickTitle: { 'zh-HK': '揀名人經歷分享', 'zh-TW': '選名人經歷分享', en: 'Pick a figure for life-story sharing' },
  selectCriteria: { 'zh-HK': '人選必要條件', 'zh-TW': '人選必要條件', en: 'Selection criteria' },
  selectPreferred: { 'zh-HK': '建議條件', 'zh-TW': '建議條件', en: 'Also preferred' },
  figurePickNote: {
    'zh-HK': '揀人物後會先見說明。每位都有公開記錄嘅人生經歷，用嚟分享陪伴，唔係本人。',
    'zh-TW': '選人物後會先看說明。每位都有公開記錄的人生經歷，用來分享陪伴，不是本人。',
    en: 'Pick a muse — briefing before chat. Each has documented lows and comeback arcs.',
  },
  userCompanionNote: {
    'zh-HK': '你係',
    'zh-TW': '你是',
    en: 'You are ',
  },
  companionFrom: {
    'zh-HK': '，陪伴風格來自',
    'zh-TW': '，陪伴風格來自',
    en: ', companion style from ',
  },
  reloadType: { 'zh-HK': '無法載入類型資料，請重新揀選。', 'zh-TW': '無法載入類型資料，請重新選擇。', en: 'Could not load type data. Pick again.' },
  repickType: { 'zh-HK': '重新揀類型', 'zh-TW': '重新選類型', en: 'Pick type again' },
  changeStyle: { 'zh-HK': '換對話方式', 'zh-TW': '更換對話方式', en: 'Change style' },
  quizProgress: { 'zh-HK': '題', 'zh-TW': '題', en: ' questions' },
  prevQuestion: { 'zh-HK': '上一題', 'zh-TW': '上一題', en: 'Previous' },
  manualTitle: { 'zh-HK': '你嘅 MBTI 類型', 'zh-TW': '你的 MBTI 類型', en: 'Your MBTI type' },
  manualDesc: {
    'zh-HK': '先確認自己類型，之後再揀陪伴者氣質同對話模式。',
    'zh-TW': '先確認自己的類型，之後再選陪伴者氣質與對話模式。',
    en: 'Confirm your type, then pick a companion temperament and chat style.',
  },
  confirmMyType: { 'zh-HK': '確認我係呢個類型', 'zh-TW': '確認我是這個類型', en: 'Confirm this type' },
  orOtherTypes: { 'zh-HK': '或者揀其他作為你嘅類型：', 'zh-TW': '或者選其他作為你的類型：', en: 'Or choose another type:' },
  changeYourType: { 'zh-HK': '改你嘅類型', 'zh-TW': '更改你的類型', en: 'Change your type' },
  yourTypeLine: { 'zh-HK': '你嘅類型：', 'zh-TW': '你的類型：', en: 'Your type: ' },
  pickCompanionTitle: { 'zh-HK': '揀陪伴者類型', 'zh-TW': '選陪伴者類型', en: 'Pick companion type' },
  pickCompanionDesc: {
    'zh-HK': '跟住會確認 MBTI 陪伴者，並顯示坊間常被歸類為該類型的名人（僅供參考）。',
    'zh-TW': '接著會確認 MBTI 陪伴者，並顯示坊間常被歸類為該類型的名人（僅供參考）。',
    en: 'Next you confirm an MBTI companion and may see reference celebrities for that type (for context only).',
  },
  recommendedForYou: { 'zh-HK': '為你推薦', 'zh-TW': '為你推薦', en: 'Recommended for you' },
  all16Types: { 'zh-HK': '全部 16 類型', 'zh-TW': '全部 16 類型', en: 'All 16 types' },
  youBadge: { 'zh-HK': '你', 'zh-TW': '你', en: 'You' },
  companionTemperamentNote: {
    'zh-HK': '你係',
    'zh-TW': '你是',
    en: 'You are ',
  },
  companionTemperamentAs: {
    'zh-HK': '，將以',
    'zh-TW': '，將以',
    en: '; companion voice: ',
  },
  companionTemperamentSuffix: {
    'zh-HK': ' 氣質作為 MBTI 陪伴者',
    'zh-TW': ' 氣質作為 MBTI 陪伴者',
    en: ' MBTI companion',
  },
  companionStyleFrom: {
    'zh-HK': '，陪伴風格來自',
    'zh-TW': '，陪伴風格來自',
    en: '; style from ',
  },
  chatTonePlain: {
    'zh-HK': '類型語氣陪你傾偈——溫柔陪伴，唔扮演任何真人或明星。',
    'zh-TW': '類型語氣陪你聊天——溫柔陪伴，不扮演任何真人或明星。',
    en: 'voice — warm support, not a real person or celebrity.',
  },
  lowsLabel: { 'zh-HK': '低谷：', 'zh-TW': '低谷：', en: 'Lows: ' },
  pickFigureFirst: { 'zh-HK': '先撳上面揀一位人物', 'zh-TW': '請先點選上方一位人物', en: 'Select a figure above first' },
  backEdit: { 'zh-HK': '返回修改', 'zh-TW': '返回修改', en: 'Back to edit' },
  figureCardEn: {
    'zh-HK': '',
    'zh-TW': '',
    en: 'Public life story reference — documented lows and resilience themes for gentle reflection, not impersonation.',
  },
  figureBriefingWith: {
    'zh-HK': '睇說明並開始同',
    'zh-TW': '看說明並開始與',
    en: 'Briefing & start with ',
  },
  figureBriefingSuffix: { 'zh-HK': ' 傾', 'zh-TW': ' 聊', en: '' },
};

export function pickerT(key, lang = 'zh-HK') {
  const safe = normalizeLanguage(lang);
  const row = P[key];
  if (!row) return key;
  return row[safe] || row['zh-HK'] || key;
}

export function pickerL(lang, hk, tw, en) {
  const safe = normalizeLanguage(lang);
  if (safe === 'en') return en;
  if (safe === 'zh-TW') return tw ?? hk;
  return hk;
}
