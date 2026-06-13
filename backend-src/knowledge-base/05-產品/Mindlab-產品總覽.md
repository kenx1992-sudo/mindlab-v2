---
tags: [產品]
---

# Mindlab 產品總覽

呢度連結返你個 app 嘅實際設定,方便將「輔導理念」同「產品實作」對齊。

## 核心
- 主聊天:`src/pages/Companion.jsx` → 後端 `companionChat`
- AI 模型:Gemini 3.5 Flash(`gemini_3_flash`),喺 `base44/functions/companionChat/entry.ts`
- 語言:zh-HK / zh-TW / en

## 輔導理念點落地到 prompt
companionChat 嘅 system prompt 應體現:
- [[主動聆聽]]、[[情緒驗證]]:唔說教、唔機械化
- [[開放式提問]]:一次一條
- [[危機應對原則]]:關鍵詞觸發即彈熱線(已實作)

## 將來:路線 B(RAG)
呢個 vault 嘅 `.md` 可做檢索來源:
1. 將筆記內容存做 Base44 entity(如 `CounselKnowledge`)。
2. 用戶講嘢 → 檢索最相關筆記 → 加入 prompt context。
3. AI 答案就會「根據你呢套輔導材料」。

## 相關專案文檔(repo docs/)
- 上架清單:`docs/LAUNCH_CHECKLIST.md`
- 後台體檢:`docs/BASE44_BACKEND_AUDIT.md`
- 手機測試:`docs/SMOKE_TEST.md`
