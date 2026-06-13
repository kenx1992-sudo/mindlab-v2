---
tags: [訓練數據, few-shot]
---

# 07 訓練數據

你嘅輔導經驗寫成「用戶一句 → 理想回應」，餵畀 Mindlab AI 學語氣。

## 點寫一條

複製 [[條目模板]]，每條一個 `.md` 檔，放喺呢個資料夾。

| frontmatter | 意思 |
|-------------|------|
| `useInPrompt: true` | 會被 `npm run sync:few-shot` 塞入 `companionChat`（每語言最多 5 條） |
| `lang: zh-HK` | 粵語 / `zh-TW` 台灣繁體 / `en` 英文 |
| `tags` | 情境標籤，方便 Obsidian 搜尋 |

## 從 Canva 俾資料（輕量，避免 Cursor OOM）

1. **開新 Cursor Chat**（唔好繼續超長 thread）
2. 第一條貼：

```text
輕量模式：只寫 knowledge-base，唔跑 npm run supervisor/build/ci，唔開 subagent，唔開 Obsidian，唔建 Canvas。
我會用純文字俾 Canva 內容，請寫入 07-訓練數據。
```

3. Canva 內文字 **複製貼上**（唔好一次過貼好多張高清圖）
4. 話 Agent：**「寫落去」**
5. 可選：原始草稿放 [[inbox/README|inbox/]]

## 同步去 AI

```bash
npm run sync:few-shot    # 更新 companionChat prompt
npm run export:training  # 輸出 JSONL（將來 Vertex tune）
```

改完要 **Base44 Publish `companionChat`** 先會上線。

## 相關

- [[示範對答-粵語]] — 精選範例展示
- [[當前-Prompt]] — 守則草稿
- [[測試記錄]] — 五句標準測試
