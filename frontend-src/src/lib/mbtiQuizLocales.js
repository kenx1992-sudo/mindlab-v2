/** MBTI 測驗題 — 三語 */

const QUIZ_HK = [
  { id: 'ei-1', axis: 'EI', text: '心累嗰陣，你通常會…', a: { label: '搵人傾計、外出散心', letter: 'E' }, b: { label: '自己靜靜唞、留番畀自己', letter: 'I' } },
  { id: 'ei-2', axis: 'EI', text: '傾心事時，你比較喜歡…', a: { label: '邊講邊整理思路', letter: 'E' }, b: { label: '諗清楚先開口', letter: 'I' } },
  { id: 'sn-1', axis: 'SN', text: '面對煩惱，你會先留意…', a: { label: '具體發生咗咩事', letter: 'S' }, b: { label: '背後代表咩意義', letter: 'N' } },
  { id: 'sn-2', axis: 'SN', text: '你覺得安慰最有效係…', a: { label: '實際建議同行動步驟', letter: 'S' }, b: { label: '被理解同睇到可能性', letter: 'N' } },
  { id: 'tf-1', axis: 'TF', text: '朋友向你訴苦，你會先…', a: { label: '幫佢分析點解會咁', letter: 'T' }, b: { label: '先陪佢感受情緒', letter: 'F' } },
  { id: 'tf-2', axis: 'TF', text: '你希望自己被點樣回應？', a: { label: '坦白直接、講重點', letter: 'T' }, b: { label: '溫柔包容、唔批判', letter: 'F' } },
  { id: 'jp-1', axis: 'JP', text: '面對壓力，你傾向…', a: { label: '盡快定計劃、有安排', letter: 'J' }, b: { label: '隨機應變、睇吓點先', letter: 'P' } },
  { id: 'jp-2', axis: 'JP', text: '傾完心事之後，你想…', a: { label: '有清晰下一步', letter: 'J' }, b: { label: '留啲空間慢慢消化', letter: 'P' } },
];

const QUIZ_TW = [
  { id: 'ei-1', axis: 'EI', text: '心累的時候，你通常會…', a: { label: '找人聊聊、出門走走', letter: 'E' }, b: { label: '自己安靜休息、留點空間', letter: 'I' } },
  { id: 'ei-2', axis: 'EI', text: '傾訴時，你比較喜歡…', a: { label: '邊說邊整理思緒', letter: 'E' }, b: { label: '想清楚再開口', letter: 'I' } },
  { id: 'sn-1', axis: 'SN', text: '面對煩惱，你會先注意…', a: { label: '具體發生了什麼', letter: 'S' }, b: { label: '背後的意義', letter: 'N' } },
  { id: 'sn-2', axis: 'SN', text: '你覺得安慰最有效的是…', a: { label: '實際建議與行動步驟', letter: 'S' }, b: { label: '被理解與看見可能', letter: 'N' } },
  { id: 'tf-1', axis: 'TF', text: '朋友向你訴苦，你會先…', a: { label: '幫他分析原因', letter: 'T' }, b: { label: '先陪他感受情緒', letter: 'F' } },
  { id: 'tf-2', axis: 'TF', text: '你希望自己被怎麼回應？', a: { label: '坦白直接、講重點', letter: 'T' }, b: { label: '溫柔包容、不批判', letter: 'F' } },
  { id: 'jp-1', axis: 'JP', text: '面對壓力，你傾向…', a: { label: '盡快訂計畫、有安排', letter: 'J' }, b: { label: '隨機應變、再看狀況', letter: 'P' } },
  { id: 'jp-2', axis: 'JP', text: '聊完心事之後，你想…', a: { label: '有清楚下一步', letter: 'J' }, b: { label: '留點空間慢慢消化', letter: 'P' } },
];

const QUIZ_EN = [
  { id: 'ei-1', axis: 'EI', text: 'When you feel drained, you usually…', a: { label: 'Talk to someone or go out', letter: 'E' }, b: { label: 'Rest alone and recharge', letter: 'I' } },
  { id: 'ei-2', axis: 'EI', text: 'When sharing feelings, you prefer…', a: { label: 'Thinking aloud as you talk', letter: 'E' }, b: { label: 'Sorting thoughts before speaking', letter: 'I' } },
  { id: 'sn-1', axis: 'SN', text: 'With worries, you notice first…', a: { label: 'What actually happened', letter: 'S' }, b: { label: 'What it might mean', letter: 'N' } },
  { id: 'sn-2', axis: 'SN', text: 'Comfort works best when…', a: { label: 'There are practical steps', letter: 'S' }, b: { label: 'You feel understood', letter: 'N' } },
  { id: 'tf-1', axis: 'TF', text: 'When a friend vents, you first…', a: { label: 'Help analyse why', letter: 'T' }, b: { label: 'Sit with their feelings', letter: 'F' } },
  { id: 'tf-2', axis: 'TF', text: 'You want responses that are…', a: { label: 'Direct and clear', letter: 'T' }, b: { label: 'Gentle and non-judgmental', letter: 'F' } },
  { id: 'jp-1', axis: 'JP', text: 'Under pressure, you tend to…', a: { label: 'Plan and structure quickly', letter: 'J' }, b: { label: 'Adapt as things unfold', letter: 'P' } },
  { id: 'jp-2', axis: 'JP', text: 'After a heavy talk, you want…', a: { label: 'A clear next step', letter: 'J' }, b: { label: 'Space to process slowly', letter: 'P' } },
];

export function getMbtiQuiz(lang = 'zh-HK') {
  if (lang === 'en') return QUIZ_EN;
  if (lang === 'zh-TW') return QUIZ_TW;
  return QUIZ_HK;
}
