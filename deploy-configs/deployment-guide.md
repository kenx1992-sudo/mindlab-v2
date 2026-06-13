# Mindlab 生产部署手册

**版本:** 1.0 | **日期:** 2026-04-26 | **作者:** Charlie (Backend Engineer)

---

## 一、前置条件

| 组件 | 版本 | 用途 |
|------|------|------|
| Kubernetes | ≥1.28 | 容器编排 |
| Helm | ≥3.14 | 包管理 |
| Istio | ≥1.21 | 服务网格 |
| cert-manager | ≥1.14 | TLS证书管理 |
| kubectl | ≥1.28 | 集群管理 |
| Harbor | ≥2.10 | 私有镜像仓库 |

## 二、镜像仓库配置（Docker Hub替代方案）

> ⚠️ Docker Hub网络不可达，必须使用私有仓库

### 推荐方案：Harbor私有仓库

```bash
# 一键部署Harbor
bash deploy/scripts/registry-setup.sh harbor

# 构建并推送镜像
docker build -t harbor.mindlab.ai/mindlab/backend:latest -f Dockerfile.backend .
docker push harbor.mindlab.ai/mindlab/backend:latest

# 离线环境方案
bash deploy/scripts/registry-setup.sh offline
# 生成 mindlab-images.tar.gz，传输到目标集群后导入
```

### 备选方案
- **AWS ECR:** `bash deploy/scripts/registry-setup.sh aws`
- **GCP Artifact Registry:** `bash deploy/scripts/registry-setup.sh gcp`
- **阿里云ACR:** `bash deploy/scripts/registry-setup.sh aliyun`

## 三、集群初始化

```bash
# 1. 创建命名空间
kubectl apply -f k8s/base/namespaces.yaml

# 2. 创建密钥（替换REPLACE_ME）
kubectl apply -f k8s/base/secrets.yaml

# 3. 部署基础设施
kubectl apply -f k8s/base/infra/infra.yaml -n mindlab-hk
kubectl apply -f k8s/base/infra/infra.yaml -n mindlab-tw
kubectl apply -f k8s/base/infra/infra.yaml -n mindlab-gb

# 4. 部署ConfigMap（三地区）
kubectl apply -f k8s/hk/configmap.yaml
kubectl apply -f k8s/tw/configmap.yaml
kubectl apply -f k8s/gb/configmap.yaml

# 5. 安装Istio + cert-manager
istioctl install --set profile=production
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
```

## 四、灰度部署流程（HK → TW → GB）

### Step 1: 🇭🇰 HK Canary（1 pod观察2分钟）

```bash
bash deploy/scripts/deploy.sh canary-hk
```

- 部署1个backend pod + 1个frontend pod
- 等待2分钟观察期
- 自动运行smoke test: /healthz + /api/health
- **如果失败 → 自动rollback**

### Step 2: 🇭🇰 HK Full Scale

```bash
# canary通过后扩容
bash deploy/scripts/deploy.sh full-hk
```

- Backend扩到3副本, Frontend扩到2副本
- HPA接管后续自动扩缩

### Step 3: 🇹🇼 TW 部署

```bash
bash deploy/scripts/deploy.sh tw
```

- 等HK完全稳定后再部署TW
- 自动验证api-tw.mindlab.ai/healthz

### Step 4: 🇬🇧 GB 部署

```bash
bash deploy/scripts/deploy.sh gb
```

- GB需要额外OSA合规验证
- 自动验证api-gb.mindlab.ai/healthz

### 查看部署状态

```bash
bash deploy/scripts/deploy.sh status
```

### 回滚

```bash
bash deploy/scripts/deploy.sh rollback-hk   # 回滚HK
bash deploy/scripts/deploy.sh rollback-tw   # 回滚TW
bash deploy/scripts/deploy.sh rollback-gb   # 回滚GB
```

## 五、DNS + SSL 配置

详见 [dns-ssl-guide.md](./dns/dns-ssl-guide.md)

关键步骤：
1. GeoDNS配置mindlab.ai → 三地区LB
2. cert-manager自动签发Let's Encrypt证书
3. Wildcard证书用于Istio Gateway
4. GB区域启用HSTS (UK GDPR)

## 六、API网关 + 地区路由

详见 [api-gateway-guide.md](./dns/api-gateway-guide.md)

- Istio VirtualService按x-region header路由
- /api/crisis/* 优先路由 + 3次重试
- 熔断器：3次5xx → 30s弹出
- **数据本地化：严禁跨区域路由用户数据**

## 七、监控告警

### 安装 Prometheus + Grafana

```bash
# Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Mindlab自定义规则
kubectl apply -f deploy/monitoring/prometheus-rules.yaml

# 导入Grafana Dashboard
kubectl create configmap mindlab-dashboard \
  --from-file=dashboard.json=deploy/monitoring/grafana-dashboard.json \
  -n monitoring
```

### 关键告警

| 告警 | 级别 | 条件 | 响应 |
|------|------|------|------|
| CrisisDetectionLatencyHigh | P0 Critical | P95 > 1s持续2min | 立即响应，检查NLP服务 |
| CrisisDetectionErrorRate | P0 Critical | 5xx > 1%持续1min | 立即响应，降级模式 |
| OSAReviewFailures | P0 Critical | OSA引擎报错 | 立即响应，GB合规风险 |
| ComplianceFilterBypass | P0 Critical | 绕过检测>5次 | 安全团队介入 |
| BackendHighErrorRate | P1 Warning | 5xx > 5% | 5min内排查 |
| CrisisQueueDepthHigh | P1 Warning | 队列>50 | HPA自动扩容 |

## 八、本地联调

```bash
# 完整前后端联调环境
cd mindlab
docker-compose -f docker-compose.dev.yml up --build

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# 危机检测: POST http://localhost:8080/api/crisis/detect-v2
```

## 九、验收检查清单

- [ ] Harbor私有仓库可推送/拉取镜像
- [ ] HK canary部署通过smoke test
- [ ] HK full scale后HPA正常工作
- [ ] TW部署通过，ConfigMap中守门人培训强制启用
- [ ] GB部署通过，OSA审查功能正常
- [ ] DNS三地区解析正确，数据本地化合规
- [ ] SSL证书自动签发和续期
- [ ] Istio地区路由：x-region=hk/tw/gb路由正确
- [ ] 危机检测P95延迟 < 1s
- [ ] Prometheus告警全部配置到位
- [ ] Grafana dashboard可查看
- [ ] 回滚流程验证通过
