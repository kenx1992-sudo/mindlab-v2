export function formatChatTranscript(messages, companionName, lang = 'zh-HK') {
  const title =
    lang === 'en'
      ? 'MindLab companion chat export'
      : lang === 'zh-TW'
        ? '自由心事 · 陪伴對話匯出'
        : '自由心事 · 陪伴對話匯出';
  const disclaimer =
    lang === 'en'
      ? 'Emotional support only — not medical advice. In crisis, call local emergency services.'
      : lang === 'zh-TW'
        ? '情緒陪伴服務，非醫療診斷。如有危機請聯絡當地緊急或專線。'
        : '情緒陪伴服務，非醫療診斷。如有危機請聯絡當地緊急或專線。';
  const youLabel = lang === 'en' ? 'You' : lang === 'zh-TW' ? '你' : '你';
  const botLabel = companionName || (lang === 'en' ? 'Companion' : '陪伴者');

  const lines = [
    title,
    new Date().toLocaleString(),
    '',
    ...messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const who = m.role === 'user' ? youLabel : botLabel;
        return `${who}: ${m.text}`;
      }),
    '',
    `--- ${disclaimer} ---`,
  ];
  return lines.join('\n');
}

export function downloadChatText(text, filename = 'mindlab-chat.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyChatText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}
