# Mindlab DNS + SSL 配置指引

## 1. 域名规划

| 域名 | 用途 | 指向 |
|------|------|------|
| mindlab.ai | 全球入口(Istio Gateway) | Istio Ingress LB |
| hk.mindlab.ai | 🇭🇰 前端 | HK集群Ingress |
| api-hk.mindlab.ai | 🇭🇰 API | HK集群Ingress |
| tw.mindlab.ai | 🇹🇼 前端 | TW集群Ingress |
| api-tw.mindlab.ai | 🇹🇼 API | TW集群Ingress |
| gb.mindlab.ai | 🇬🇧 前端 | GB集群Ingress |
| api-gb.mindlab.ai | 🇬🇧 API | GB集群Ingress |
| harbor.mindlab.ai | 私有镜像仓库 | Harbor LB |

## 2. DNS 配置

### 2.1 全球入口（GeoDNS）
```bash
# 使用 Cloudflare/Route53 GeoDNS 按地区路由
# mindlab.ai → 自动解析到最近集群

# AWS Route53 示例
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "mindlab.ai",
      "Type": "A",
      "AliasTarget": {
        "DNSName": "mindlab-hk-alb.ap-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      },
      "Region": "ap-east-1",
      "SetIdentifier": "hk-primary"
    }
  }]
}'
```

### 2.2 地区子域名
```bash
# HK
hk.mindlab.ai      → A → HK Ingress LB IP
api-hk.mindlab.ai  → A → HK Ingress LB IP

# TW
tw.mindlab.ai      → A → TW Ingress LB IP
api-tw.mindlab.ai  → A → TW Ingress LB IP

# GB
gb.mindlab.ai      → A → GB Ingress LB IP
api-gb.mindlab.ai  → A → GB Ingress LB IP
```

### 2.3 数据本地化验证
```bash
# 确保DNS解析到正确区域
dig hk.mindlab.ai    # 应解析到HK IP段
dig tw.mindlab.ai    # 应解析到TW IP段
dig gb.mindlab.ai    # 应解析到GB/EU IP段
```

## 3. SSL/TLS 配置

### 3.1 cert-manager 自动签发
```bash
# 安装 cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# 创建 ClusterIssuer (Let's Encrypt)
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@mindlab.ai
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 3.2 Wildcard证书（Istio Gateway用）
```bash
# DNS-01 challenge for wildcard
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-wildcard
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@mindlab.ai
    privateKeySecretRef:
      name: letsencrypt-wildcard
    solvers:
      - dns01:
          cloudflare:
            email: ops@mindlab.ai
            apiTokenSecretRef:
              name: cloudflare-api-token
              key: api-token
EOF

# 签发 wildcard 证书
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: mindlab-wildcard
  namespace: istio-system
spec:
  secretName: mindlab-wildcard-tls
  issuerRef:
    name: letsencrypt-wildcard
    kind: ClusterIssuer
  dnsNames:
    - "*.mindlab.ai"
    - "mindlab.ai"
EOF
```

### 3.3 合规要求
- 🇭🇰 HK: TLS 1.2+ (PDPO)
- 🇹🇼 TW: TLS 1.2+ (PDPA)  
- 🇬🇧 GB: TLS 1.3 推荐, HSTS (UK GDPR + OSA)
  ```nginx
  # GB Ingress 额外注解
  nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
  nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  nginx.ingress.kubernetes.io/configuration-snippet: |
    more_set_headers "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload";
  ```
