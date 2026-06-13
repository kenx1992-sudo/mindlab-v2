---
tags: [質檢報告, mentor]
---

# 08 質檢報告

Mentor LLM 自動質檢系統輸出嘅報告會放喺呢度。

## 報告格式

每個報告檔名：`quality-YYYY-MM-DDTHH-mm-ss.md`

內容包括：
- **總覽**：各維度平均分（聆聽、驗證、探索、陪伴、語氣、簡潔）
- **常見問題**：最常出現嘅 flag 統計
- **詳細結果**：每個測試案例嘅逐項評分 + 改善建議

## 點樣產生報告

```bash
# 用內置測試集（5 個標準案例）
npm run mentor:quality -- --sample

# 指定語言
npm run mentor:quality -- --sample --lang zh-TW
npm run mentor:quality -- --sample --lang en

# 互動模式（手動貼對話）
npm run mentor:quality -- --interactive

# 從 JSON 檔案
npm run mentor:quality -- --file path/to/logs.json
```

## 評分維度（1-10）

| 維度 | 說明 |
|------|------|
| 聆聽 | 有冇用自己嘅話反映返對方講嘅重點 |
| 驗證 | 有冇承認對方感受合理、可理解（最重要） |
| 探索 | 有冇適當問一條開放式問題 |
| 陪伴 | 有冇傳達「我喺度陪你」而唔係「等我幫你解決」 |
| 語氣 | 語言夠唔夠自然、溫暖、似朋友 |
| 簡潔 | 係咪 2-4 句，唔太長 |

## 分數解讀

- 🟢 8-10：優質回應，跟足四步
- 🟡 6-7：合格，有小問題
- 🔴 <6：需要改善，睇建議

## 相關

- [[../06-Prompt實驗室/當前-Prompt]]
- [[../06-Prompt實驗室/測試記錄]]
- [[../07-訓練數據/README]]
