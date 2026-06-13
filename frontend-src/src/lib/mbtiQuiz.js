import { getMbtiQuiz as getQuizByLang } from '@/lib/mbtiQuizLocales';

/** 8 題迷你 MBTI 傾向測試（E/I S/N T/F J/P 各 2 題）— 預設廣東話 */
export const MBTI_QUIZ = [
  {
    id: 'ei-1',
    axis: 'EI',
    text: '心累嗰陣，你通常會…',
    a: { label: '搵人傾計、外出散心', letter: 'E' },
    b: { label: '自己靜靜唞、留番畀自己', letter: 'I' },
  },
  {
    id: 'ei-2',
    axis: 'EI',
    text: '傾心事時，你比較喜歡…',
    a: { label: '邊講邊整理思路', letter: 'E' },
    b: { label: '諗清楚先開口', letter: 'I' },
  },
  {
    id: 'sn-1',
    axis: 'SN',
    text: '面對煩惱，你會先留意…',
    a: { label: '具體發生咗咩事', letter: 'S' },
    b: { label: '背後代表咩意義', letter: 'N' },
  },
  {
    id: 'sn-2',
    axis: 'SN',
    text: '你覺得安慰最有效係…',
    a: { label: '實際建議同行動步驟', letter: 'S' },
    b: { label: '被理解同睇到可能性', letter: 'N' },
  },
  {
    id: 'tf-1',
    axis: 'TF',
    text: '朋友向你诉苦，你會先…',
    a: { label: '幫佢分析點解會咁', letter: 'T' },
    b: { label: '先陪佢感受情緒', letter: 'F' },
  },
  {
    id: 'tf-2',
    axis: 'TF',
    text: '你希望自己被點樣回應？',
    a: { label: '坦白直接、講重點', letter: 'T' },
    b: { label: '溫柔包容、唔批判', letter: 'F' },
  },
  {
    id: 'jp-1',
    axis: 'JP',
    text: '面對壓力，你傾向…',
    a: { label: '盡快定計劃、有安排', letter: 'J' },
    b: { label: '隨機應變、睇吓點先', letter: 'P' },
  },
  {
    id: 'jp-2',
    axis: 'JP',
    text: '傾完心事之後，你想…',
    a: { label: '有清晰下一步', letter: 'J' },
    b: { label: '留啲空間慢慢消化', letter: 'P' },
  },
];

export function getMbtiQuiz(lang = 'zh-HK') {
  return getQuizByLang(lang);
}

export function scoreMbtiQuiz(answers, lang = 'zh-HK') {
  const quiz = getMbtiQuiz(lang);
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  quiz.forEach((q) => {
    const pick = answers[q.id];
    if (pick === 'a') scores[q.a.letter] += 1;
    if (pick === 'b') scores[q.b.letter] += 1;
  });
  const code =
    (scores.E >= scores.I ? 'E' : 'I') +
    (scores.S >= scores.N ? 'S' : 'N') +
    (scores.T >= scores.F ? 'T' : 'F') +
    (scores.J >= scores.P ? 'J' : 'P');
  return { code, scores };
}
