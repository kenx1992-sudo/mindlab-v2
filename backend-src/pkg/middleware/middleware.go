package middleware

import (
	"context"
	"log/slog"
	"time"

	"mindlab/pkg/types"
)

// AuditMiddleware records all operations for compliance audit trail
type AuditMiddleware struct {
	logger *slog.Logger
}

func NewAuditMiddleware(logger *slog.Logger) *AuditMiddleware {
	return &AuditMiddleware{logger: logger}
}

// RecordAuditLog creates an audit log entry for any operation
func (a *AuditMiddleware) RecordAuditLog(ctx context.Context, entry types.AuditLog) {
	entry.Timestamp = time.Now()
	// In production: write to immutable encrypted storage (e.g., append-only S3 + PostgreSQL audit table)
	a.logger.Info("audit_log",
		"actor_id", entry.ActorID,
		"actor_type", entry.ActorType,
		"action", entry.Action,
		"resource", entry.Resource,
		"resource_id", entry.ResourceID,
		"region", entry.Region,
		"request_id", entry.RequestID,
	)
}

// ConsentCheckMiddleware ensures consent is valid before allowing access
type ConsentCheckMiddleware struct{}

func NewConsentCheckMiddleware() *ConsentCheckMiddleware {
	return &ConsentCheckMiddleware{}
}

// HasConsent checks if user has the required consent type
func (c *ConsentCheckMiddleware) HasConsent(consents []types.Consent, required types.ConsentType) bool {
	for _, consent := range consents {
		if consent.Type == required && consent.RevokedAt == nil {
			return true
		}
	}
	return false
}

// HasDerivedDataConsent checks specifically for derived data consent (CR-008)
func (c *ConsentCheckMiddleware) HasDerivedDataConsent(consents []types.Consent, dataType string) bool {
	for _, consent := range consents {
		if consent.Type == types.ConsentDerivedData &&
			consent.DataType == dataType &&
			consent.RevokedAt == nil {
			return true
		}
	}
	return false
}

// RegionIsolationMiddleware ensures data access is region-scoped
type RegionIsolationMiddleware struct{}

func NewRegionIsolationMiddleware() *RegionIsolationMiddleware {
	return &RegionIsolationMiddleware{}
}

// ValidateRegionAccess ensures the requesting user can only access data in their region
func (r *RegionIsolationMiddleware) ValidateRegionAccess(userRegion types.Region, dataRegion types.Region) bool {
	return userRegion == dataRegion
}

// RateLimitMiddleware provides per-region, per-user rate limiting
type RateLimitMiddleware struct {
	// In production: Redis-based sliding window
}

func NewRateLimitMiddleware() *RateLimitMiddleware {
	return &RateLimitMiddleware{}
}

// CheckRateLimit returns true if the request is within rate limits
func (r *RateLimitMiddleware) CheckRateLimit(userID string, region types.Region) bool {
	// Per-region rate limits:
	// AI messages: 60/min per user
	// General API: 300/min per user
	// Crisis detection: unlimited (never rate-limit crisis path)
	// In production: Redis INCR + EXPIRE sliding window
	return true
}
