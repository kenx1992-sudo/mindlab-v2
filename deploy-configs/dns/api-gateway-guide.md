# Mindlab API网关 + 地区路由配置

## 架构概览

```
用户 → GeoDNS → Istio Gateway (*.mindlab.ai:443)
                   ├── VirtualService: mindlab-global (前端路由)
                   │     ├── x-region=hk → mindlab-hk namespace
                   │     ├── x-region=tw → mindlab-tw namespace  
                   │     └── x-region=gb → mindlab-gb namespace
                   └── VirtualService: mindlab-api (API路由)
                         ├── /api/crisis* → 优先路由 + 3次重试
                         └── /v1/* → 默认路由
```

## Istio 配置（已在k8s/istio/virtualservice.yaml中定义）

### 关键配置说明

1. **地区路由匹配优先级：**
   - Header `x-region` > QueryParam `region` > GeoIP fallback
   - 前端：x-forwarded-for正则匹配国家码
   - API：x-region header显式指定

2. **危机检测API特殊处理：**
   - `/api/crisis/detect-v2` 路径优先匹配
   - 3次重试，每次5s超时
   - 总超时15s
   - 熔断：3次5xx → 30s弹出

3. **数据本地化合规：**
   - 🇭🇰 HK: 所有请求必须在HK集群处理
   - 🇹🇼 TW: 所有请求必须在TW集群处理
   - 🇬🇧 GB: OSA合规，所有请求必须在GB集群处理
   - **严禁跨区域路由用户数据**

## Istio 安装

```bash
# 安装 Istio + Gateway API
istioctl install --set profile=production

# 启用必要插件
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons/kiali.yaml

# 部署 Mindlab 路由配置
kubectl apply -f k8s/istio/virtualservice.yaml
```

## 验证路由

```bash
# 测试HK路由
curl -H "x-region: hk" https://api.mindlab.ai/v1/sessions

# 测试TW路由
curl -H "x-region: tw" https://api.mindlab.ai/v1/sessions

# 测试GB路由
curl -H "x-region: gb" https://api.mindlab.ai/v1/sessions

# 测试危机检测路由（应走优先路由+重试）
curl -X POST -H "x-region: hk" -H "Content-Type: application/json" \
  -d '{"message":"我想死","region":"HK"}' \
  https://api.mindlab.ai/api/crisis/detect-v2
```
