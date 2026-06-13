# Mindlab 快速上線部署指南 (Vercel + Railway + Supabase)

## 架構

```
用戶 → Vercel (Next.js Frontend) → Railway (Go Backend) → Supabase (PostgreSQL)
                                    ↓
                              Volces ARK (DeepSeek V4 Pro LLM)
```

## Step 1: Supabase (Database)

1. 去 https://supabase.com 開 account，create new project
2. 去 SQL Editor，paste `backend-src/schema.sql` 內容，run
3. 抄低 connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

## Step 2: Railway (Backend)

1. 去 https://railway.app 開 account
2. New Project → Deploy from GitHub repo
3. 指去 `mindlab-full-package/backend-src`
4. Set environment variables:
   ```
   PORT=8080
   APP_REGION=HK
   DB_HOST=db.[PROJECT-ID].supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=[YOUR-PASSWORD]
   LLM_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
   LLM_API_KEY=ark-9e6f365f-a34c-4f56-914b-da1bf6983696-0cb2c
   LLM_MODEL=deepseek-v4-pro
   KB_PATH=/app/knowledge-base
   STRIPE_SECRET_KEY=sk_live_xxx (optional)
   STRIPE_WEBHOOK_SECRET=whsec_xxx (optional)
   ```
5. Railway 會自動 detect Go project 同 build
6. 抄低 backend URL: `https://mindlab-backend.up.railway.app`

## Step 3: Vercel (Frontend)

1. 去 https://vercel.com 開 account
2. Import GitHub repo → 指去 `mindlab-full-package/frontend-src`
3. Framework: Next.js
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://mindlab-backend.up.railway.app
   NEXT_PUBLIC_REGION=HK
   NEXT_PUBLIC_LOCALE=zh-HK
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx (optional)
   ```
5. Deploy!
6. 抄低 frontend URL: `https://mindlab.vercel.app`

## Step 4: Domain (Optional)

1. 買 domain (mindlab.ai 或其他)
2. Vercel: Settings → Domains → Add
3. Railway: Settings → Domains → Add (for API subdomain)

## 成本估算

| 服務 | 免費額度 | 夠唔夠用 |
|------|---------|---------|
| Vercel | 100GB bandwidth, 6000 build mins | ✅ 初期夠 |
| Railway | $5 credit, 500hrs/mo | ✅ 初期夠 |
| Supabase | 500MB DB, 2GB bandwidth | ✅ 初期夠 |
| Volces ARK | Pay-as-you-go | ~$0.50/1M tokens |

## 環境變數一覽

### Backend (Railway)
```
PORT=8080
APP_REGION=HK
DB_HOST=xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xxx
LLM_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
LLM_API_KEY=ark-xxx
LLM_MODEL=deepseek-v4-pro
KB_PATH=/app/knowledge-base
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://xxx.up.railway.app
NEXT_PUBLIC_REGION=HK
NEXT_PUBLIC_LOCALE=zh-HK
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```
