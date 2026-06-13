# 🌿 Mindlab — 全球化心理輔導平台

## 快速啟動（Docker Compose 一鍵部署）

```bash
docker compose up -d
```

- 前端：http://localhost:3001
- 後端：http://localhost:8090/healthz
- 三地區同一個網站，自動根據語言切換：/hk /tw /gb

## 目錄結構

| 目錄 | 說明 |
|------|------|
| frontend-built/ | 前端可運行產物（Next.js standalone） |
| frontend-src/ | 前端源碼（Next.js + TypeScript） |
| backend-built/ | 後端可運行產物（Go 二進制 + schema.sql） |
| backend-src/ | 後端源碼（Go + Gin） |
| docker-compose.yml | 本地開發環境配置 |
| k8s-configs/ | K8s 生產部署配置（HK/TW/GB 三地） |
| deploy-configs/ | 部署腳本、監控、DNS/SSL 指南 |

## 三地區說明

Mindlab 是一個網站，通過地區自動檢測或 URL 路徑切換：
- 🇭🇰 香港 /hk — 粵語+英語，HKPCA認證輔導員
- 🇹🇼 台灣 /tw — 繁中，領證諮商心理師
- 🇬🇧 英國 /gb — 英式英語，BACP/UKCP註冊輔導員

## 技術棧

- 前端：Next.js 16 + TypeScript + Zustand
- 後端：Go 1.22 + Gin + PostgreSQL + Redis + NATS
- 部署：Docker + K8s + Istio + cert-manager
