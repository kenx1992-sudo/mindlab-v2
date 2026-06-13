#!/bin/bash
# registry-setup.sh — Private Harbor registry setup (Docker Hub替代方案)
# 解决Docker Hub网络不可达问题
set -euo pipefail

log() { echo "[$(date +%H:%M:%S)] $*"; }

# ═══ 方案A: Harbor私有仓库 (推荐生产环境) ═══
setup_harbor() {
  log "📦 Setting up Harbor private registry..."
  
  # 1. Install Harbor via Helm
  helm repo add harbor https://helm.goharbor.io
  helm repo update
  helm install harbor harbor/harbor \
    --namespace harbor --create-namespace \
    --set expose.type=loadBalancer \
    --set expose.tls.enabled=true \
    --set expose.tls.certSource=secret \
    --set expose.tls.secret.secretName=harbor-tls \
    --set persistence.persistentVolumeClaim.registry.storageClass=standard \
    --set persistence.persistentVolumeClaim.registry.size=100Gi \
    --set harborAdminPassword="${HARBOR_ADMIN_PASSWORD:-Harbor12345}" \
    --set trivy.enabled=true \
    --wait --timeout 10m
  
  # 2. Create project
  log "Creating mindlab project in Harbor..."
  sleep 30  # Wait for Harbor API ready
  curl -sf -u "admin:${HARBOR_ADMIN_PASSWORD:-Harbor12345}" \
    -X POST "https://harbor.mindlab.ai/api/v2.0/projects" \
    -H "Content-Type: application/json" \
    -d '{"project_name":"mindlab","public":false,"metadata":{"auto_scan":"true","severity":"high"}}'
  
  # 3. Configure robot account for CI/CD
  log "Creating robot account for CI/CD..."
  curl -sf -u "admin:${HARBOR_ADMIN_PASSWORD:-Harbor12345}" \
    -X POST "https://harbor.mindlab.ai/api/v2.0/projects/mindlab/robots" \
    -H "Content-Type: application/json" \
    -d '{"name":"ci-push","duration":-1,"permissions":[{"resource":"repository","action":"push"},{"resource":"repository","action":"pull"}]}'
  
  log "✅ Harbor registry ready at harbor.mindlab.ai"
}

# ═══ 方案B: 本地registry + skopeo离线导入 (无外网环境) ═══
setup_offline() {
  log "📦 Setting up offline registry..."
  
  # 1. Start local registry
  docker run -d --name registry -p 5000:5000 \
    -v registry-data:/var/lib/registry \
    registry:2
  
  # 2. Build images locally
  docker build -t localhost:5000/mindlab/backend:latest -f Dockerfile.backend .
  docker build -t localhost:5000/mindlab/frontend:latest ./mindlab-app
  
  # 3. Push to local registry
  docker push localhost:5000/mindlab/backend:latest
  docker push localhost:5000/mindlab/frontend:latest
  
  # 4. Export for air-gapped transfer
  mkdir -p /tmp/mindlab-images
  skopeo copy docker://localhost:5000/mindlab/backend:latest \
    dir:/tmp/mindlab-images/backend
  skopeo copy docker://localhost:5000/mindlab/frontend:latest \
    dir:/tmp/mindlab-images/frontend
  tar czf mindlab-images.tar.gz -C /tmp mindlab-images
  
  log "✅ Offline images exported: mindlab-images.tar.gz"
  log "   Transfer to target cluster and: skopeo copy dir:./mindlab-images/backend docker://harbor.mindlab.ai/mindlab/backend:latest"
}

# ═══ 方案C: 云厂商容器镜像服务 ═══
setup_cloud_registry() {
  local cloud="${1:-aws}"
  case $cloud in
    aws)
      log "📦 Using AWS ECR..."
      aws ecr create-repository --repository-name mindlab/backend --region ap-east-1
      aws ecr create-repository --repository-name mindlab/frontend --region ap-east-1
      REGISTRY=$(aws ecr describe-repositories --repository-name mindlab/backend --region ap-east-1 --query 'repositories[0].repositoryUri' --output text | sed 's|/mindlab/backend||')
      log "ECR registry: ${REGISTRY}"
      ;;
    gcp)
      log "📦 Using GCP Artifact Registry..."
      gcloud artifacts repositories create mindlab --repository-format=docker --location=asia-east2
      log "GCP registry: asia-east2-docker.pkg.dev/PROJECT/mindlab"
      ;;
    aliyun)
      log "📦 Using 阿里云ACR..."
      aliyun cr CreateNamespace --Namespace mindlab
      aliyun cr CreateRepository --RepoNamespace mindlab --RepoName backend --RepoType private
      log "ACR registry: registry.cn-hongkong.aliyuncs.com/mindlab"
      ;;
  esac
  log "✅ Cloud registry configured"
}

case "${1:-harbor}" in
  harbor)   setup_harbor ;;
  offline)  setup_offline ;;
  aws)      setup_cloud_registry aws ;;
  gcp)      setup_cloud_registry gcp ;;
  aliyun)   setup_cloud_registry aliyun ;;
  *)        echo "Usage: $0 {harbor|offline|aws|gcp|aliyun}" ;;
esac
