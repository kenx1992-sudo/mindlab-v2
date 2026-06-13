#!/bin/bash
# deploy.sh — Multi-region progressive deployment script
# Usage: ./deploy.sh [canary-hk|full-hk|tw|gb|rollback-hk|rollback-tw|rollback-gb|status]
set -euo pipefail

REGISTRY="${REGISTRY:-harbor.mindlab.ai}"
TAG="${TAG:-latest}"
DRY_RUN="${DRY_RUN:-false}"

log() { echo "[$(date +%H:%M:%S)] $*"; }

# ═══ Canary deployment: HK 1-pod canary ═══
deploy_canary_hk() {
  log "🇭🇰 Deploying HK canary (1 pod)..."
  kubectl set image deployment/mindlab-backend \
    backend=${REGISTRY}/mindlab/backend:${TAG} -n mindlab-hk --record
  kubectl set image deployment/mindlab-frontend \
    frontend=${REGISTRY}/mindlab/frontend:${TAG} -n mindlab-hk --record
  kubectl patch deployment mindlab-backend -n mindlab-hk \
    -p '{"spec":{"replicas":1}}'
  
  log "⏳ Waiting for canary rollout (2min observation)..."
  kubectl rollout status deployment/mindlab-backend -n mindlab-hk --timeout=120s
  sleep 120
  
  log "🧪 Running smoke tests..."
  curl -sf https://api-hk.mindlab.ai/healthz || { log "❌ Backend health check failed"; return 1; }
  curl -sf https://hk.mindlab.ai/api/health || { log "❌ Frontend health check failed"; return 1; }
  log "✅ HK canary smoke test passed"
}

# ═══ Full HK deployment ═══
deploy_full_hk() {
  log "🇭🇰 Scaling HK to full replicas..."
  kubectl patch deployment mindlab-backend -n mindlab-hk -p '{"spec":{"replicas":3}}'
  kubectl patch deployment mindlab-frontend -n mindlab-hk -p '{"spec":{"replicas":2}}'
  kubectl rollout status deployment/mindlab-backend -n mindlab-hk --timeout=300s
  log "✅ HK full deployment complete"
}

# ═══ TW deployment ═══
deploy_tw() {
  log "🇹🇼 Deploying TW..."
  kubectl apply -k k8s/tw/ -n mindlab-tw
  kubectl set image deployment/mindlab-backend \
    backend=${REGISTRY}/mindlab/backend:${TAG} -n mindlab-tw --record
  kubectl set image deployment/mindlab-frontend \
    frontend=${REGISTRY}/mindlab/frontend:${TAG} -n mindlab-tw --record
  kubectl rollout status deployment/mindlab-backend -n mindlab-tw --timeout=300s
  curl -sf https://api-tw.mindlab.ai/healthz || { log "❌ TW backend health check failed"; return 1; }
  log "✅ TW deployment complete"
}

# ═══ GB deployment ═══
deploy_gb() {
  log "🇬🇧 Deploying GB..."
  kubectl apply -k k8s/gb/ -n mindlab-gb
  kubectl set image deployment/mindlab-backend \
    backend=${REGISTRY}/mindlab/backend:${TAG} -n mindlab-gb --record
  kubectl set image deployment/mindlab-frontend \
    frontend=${REGISTRY}/mindlab/frontend:${TAG} -n mindlab-gb --record
  kubectl rollout status deployment/mindlab-backend -n mindlab-gb --timeout=300s
  curl -sf https://api-gb.mindlab.ai/healthz || { log "❌ GB backend health check failed"; return 1; }
  log "✅ GB deployment complete"
}

# ═══ Rollback ═══
rollback() {
  local region=$1
  log "⏪ Rolling back ${region}..."
  kubectl rollout undo deployment/mindlab-backend -n ${region}
  kubectl rollout undo deployment/mindlab-frontend -n ${region}
  kubectl rollout status deployment/mindlab-backend -n ${region} --timeout=120s
  log "✅ Rollback complete for ${region}"
}

# ═══ Status check ═══
status() {
  for ns in mindlab-hk mindlab-tw mindlab-gb; do
    log "📊 ${ns}:"
    kubectl get deployments -n ${ns} -o wide 2>/dev/null || log "  (not deployed)"
    echo ""
  done
}

case "${1:-status}" in
  canary-hk)   deploy_canary_hk ;;
  full-hk)     deploy_full_hk ;;
  tw)          deploy_tw ;;
  gb)          deploy_gb ;;
  rollback-hk) rollback mindlab-hk ;;
  rollback-tw) rollback mindlab-tw ;;
  rollback-gb) rollback mindlab-gb ;;
  status)      status ;;
  *)           echo "Usage: $0 {canary-hk|full-hk|tw|gb|rollback-hk|rollback-tw|rollback-gb|status}" ;;
esac
