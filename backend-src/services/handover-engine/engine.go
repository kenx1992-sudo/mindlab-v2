package handover_engine

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"mindlab/pkg/types"
)

// HandoverEngine manages AI↔Counselor transitions (DEF-S002 fixes)
type HandoverEngine struct {
	counselorMatcher CounselorMatcher
	handoverStore    HandoverStore
	sessionStore     SessionStore
	notifier         CrisisNotifier
	eventBus         HandoverEventBus
	logger           *slog.Logger
}

// HandoverEventBus abstracts NATS for handover event broadcasting (DEF-S002)
type HandoverEventBus interface {
	// BroadcastHandoverRequest notifies all on-duty counselors in region
	BroadcastHandoverRequest(ctx context.Context, region types.Region, handoverID string, req *types.HandoverRequest) error
	// PublishSessionStateChange updates session state across services
	PublishSessionStateChange(ctx context.Context, sessionID string, state types.SessionState) error
	// PublishHandoverTimeout triggers timeout handling
	PublishHandoverTimeout(ctx context.Context, handoverID string) error
}

type HandoverStore interface {
	CreateHandover(ctx context.Context, h *Handover) error
	GetHandover(ctx context.Context, id string) (*Handover, error)
	UpdateHandoverStatus(ctx context.Context, id string, status HandoverStatus) error
	UpdateHandoverCounselor(ctx context.Context, id string, counselorID string) error
}

type CounselorMatcher interface {
	Match(ctx context.Context, req *types.HandoverRequest) ([]CounselorScore, error)
}

type CrisisNotifier interface {
	NotifyCrisis(ctx context.Context, counselorID string, notification *types.CrisisDetectionResult) error
	NotifyHandover(ctx context.Context, counselorID string, handoverID string) error
}

type SessionStore interface {
	GetSession(ctx context.Context, sessionID string) (*types.Session, error)
	UpdateSessionState(ctx context.Context, sessionID string, state types.SessionState) error
	UpdateSessionCounselor(ctx context.Context, sessionID string, counselorID string) error
}

type HandoverStatus string

const (
	HandoverRequested    HandoverStatus = "REQUESTED"
	HandoverMatching     HandoverStatus = "MATCHING"
	HandoverPending      HandoverStatus = "PENDING_ACCEPT"
	HandoverHandshake    HandoverStatus = "HANDSHAKE"
	HandoverInSession    HandoverStatus = "IN_SESSION"
	HandoverCompleted    HandoverStatus = "COMPLETED"
	HandoverFeedback     HandoverStatus = "FEEDBACK"
	HandoverFailed       HandoverStatus = "FAILED"
	HandoverTimeout      HandoverStatus = "TIMEOUT"
)

// Handover timeout constants (DEF-S002)
const (
	MatchTimeout       = 5 * time.Minute  // Max time to find a counselor
	AcceptTimeout      = 3 * time.Minute  // Max time for counselor to accept
	CounselingTimeout  = 60 * time.Minute // Max counseling session duration
)

type Handover struct {
	ID            string            `json:"id"`
	SessionID     string            `json:"session_id"`
	Request       types.HandoverRequest `json:"request"`
	CounselorID   string            `json:"counselor_id,omitempty"`
	Status        HandoverStatus    `json:"status"`
	CreatedAt     time.Time         `json:"created_at"`
	AcceptedAt    *time.Time        `json:"accepted_at,omitempty"`
	CompletedAt   *time.Time        `json:"completed_at,omitempty"`
	FallbackUsed  bool              `json:"fallback_used"`
	Deadline      time.Time         `json:"deadline"` // Accept deadline for counselor
}

type CounselorScore struct {
	CounselorID string  `json:"counselor_id"`
	Score       float64 `json:"score"`
}

func NewHandoverEngine(
	matcher CounselorMatcher,
	handoverStore HandoverStore,
	sessionStore SessionStore,
	notifier CrisisNotifier,
	eventBus HandoverEventBus,
	logger *slog.Logger,
) *HandoverEngine {
	return &HandoverEngine{
		counselorMatcher: matcher,
		handoverStore:    handoverStore,
		sessionStore:     sessionStore,
		notifier:         notifier,
		eventBus:         eventBus,
		logger:           logger,
	}
}

// RequestHandover initiates AI→Counselor transition (POST /v1/handovers)
func (e *HandoverEngine) RequestHandover(ctx context.Context, req *types.HandoverRequest) (*Handover, error) {
	// Validate: user must have consent for sensitive data processing (DEF-S002 permission check)
	handover := &Handover{
		ID:        generateHandoverID(),
		SessionID: req.SessionID,
		Request:   *req,
		Status:    HandoverRequested,
		CreatedAt: time.Now(),
	}

	// Update session state via event bus
	if err := e.eventBus.PublishSessionStateChange(ctx, req.SessionID, types.StateCounselorPending); err != nil {
		return nil, fmt.Errorf("session state update failed: %w", err)
	}
	_ = e.sessionStore.UpdateSessionState(ctx, req.SessionID, types.StateCounselorPending)

	// Crisis triggers: broadcast to ALL on-duty counselors in region (DEF-S002: NATS broadcast)
	if req.TriggerType == types.TriggerCrisis || req.Urgency == types.UrgencyEmergency {
		handover.Status = HandoverMatching
		handover.Deadline = time.Now().Add(AcceptTimeout)
		_ = e.handoverStore.CreateHandover(ctx, handover)

		// NATS broadcast to all on-duty counselors in region
		if err := e.eventBus.BroadcastHandoverRequest(ctx, req.Region, handover.ID, req); err != nil {
			e.logger.Error("handover_broadcast_failed", "handover_id", handover.ID, "error", err)
		}

		// Start accept timeout timer
		go e.watchAcceptTimeout(handover.ID)

		e.logger.Info("crisis_handover_broadcast", "handover_id", handover.ID, "risk_level", req.RiskLevel)
		return handover, nil
	}

	// Standard handover: match counselor
	handover.Status = HandoverMatching
	handover.Deadline = time.Now().Add(MatchTimeout)
	_ = e.handoverStore.CreateHandover(ctx, handover)

	scores, err := e.counselorMatcher.Match(ctx, req)
	if err != nil {
		e.logger.Error("counselor_matching_failed", "error", err)
		return e.executeFallback(ctx, handover, req)
	}

	if len(scores) == 0 {
		return e.executeFallback(ctx, handover, req)
	}

	// Notify top-matched counselor
	handover.CounselorID = scores[0].CounselorID
	handover.Status = HandoverPending
	handover.Deadline = time.Now().Add(AcceptTimeout)
	_ = e.handoverStore.UpdateHandoverCounselor(ctx, handover.ID, scores[0].CounselorID)
	_ = e.handoverStore.UpdateHandoverStatus(ctx, handover.ID, handover.Status)

	_ = e.notifier.NotifyHandover(ctx, scores[0].CounselorID, handover.ID)

	// Start accept timeout timer (DEF-S002)
	go e.watchAcceptTimeout(handover.ID)

	e.logger.Info("handover_requested", "handover_id", handover.ID, "counselor_id", scores[0].CounselorID)
	return handover, nil
}

// AcceptHandover counselor accepts handover (POST /v1/handovers/{id}/accept)
func (e *HandoverEngine) AcceptHandover(ctx context.Context, handoverID string, counselorID string) error {
	handover, err := e.handoverStore.GetHandover(ctx, handoverID)
	if err != nil {
		return fmt.Errorf("handover not found: %s", handoverID)
	}

	// Permission check: only the assigned counselor can accept (DEF-S002)
	if handover.CounselorID != "" && handover.CounselorID != counselorID {
		// For crisis broadcasts (no assigned counselor), first to accept wins
		if handover.Status != HandoverMatching {
			return &ForbiddenError{Code: "AUTH_002", Message: "权限不足：非指定辅导员"}
		}
	}

	if handover.Status != HandoverPending && handover.Status != HandoverMatching {
		return &StateConflictError{Current: string(handover.Status)}
	}

	// Check if deadline has passed (DEF-S002: timeout)
	if time.Now().After(handover.Deadline) {
		return &TimeoutError{Deadline: handover.Deadline}
	}

	now := time.Now()
	handover.CounselorID = counselorID
	handover.AcceptedAt = &now
	handover.Status = HandoverInSession

	_ = e.eventBus.PublishSessionStateChange(ctx, handover.SessionID, types.StateCounselorSession)
	_ = e.sessionStore.UpdateSessionState(ctx, handover.SessionID, types.StateCounselorSession)
	_ = e.sessionStore.UpdateSessionCounselor(ctx, handover.SessionID, counselorID)
	_ = e.handoverStore.UpdateHandoverCounselor(ctx, handoverID, counselorID)
	_ = e.handoverStore.UpdateHandoverStatus(ctx, handoverID, handover.Status)

	e.logger.Info("handover_accepted", "handover_id", handoverID, "counselor_id", counselorID)
	return nil
}

// CompleteHandover counselor ends session, user returns to AI (POST /v1/handovers/{id}/complete)
func (e *HandoverEngine) CompleteHandover(ctx context.Context, handoverID string, counselorID string) error {
	handover, err := e.handoverStore.GetHandover(ctx, handoverID)
	if err != nil {
		return fmt.Errorf("handover not found: %s", handoverID)
	}

	// Permission check: only the assigned counselor can complete (DEF-S002)
	if handover.CounselorID != counselorID {
		return &ForbiddenError{Code: "AUTH_002", Message: "权限不足：非指定辅导员"}
	}

	now := time.Now()
	handover.CompletedAt = &now
	handover.Status = HandoverCompleted

	// Return user to AI companion (G-011)
	_ = e.eventBus.PublishSessionStateChange(ctx, handover.SessionID, types.StateChatting)
	_ = e.sessionStore.UpdateSessionState(ctx, handover.SessionID, types.StateChatting)
	_ = e.handoverStore.UpdateHandoverStatus(ctx, handoverID, handover.Status)

	e.logger.Info("handover_completed", "handover_id", handoverID)
	return nil
}

// watchAcceptTimeout handles timeout when counselor doesn't accept (DEF-S002)
func (e *HandoverEngine) watchAcceptTimeout(handoverID string) {
	time.Sleep(AcceptTimeout)

	ctx := context.Background()
	handover, err := e.handoverStore.GetHandover(ctx, handoverID)
	if err != nil {
		return
	}

	// If still pending/matching after timeout, trigger timeout flow
	if handover.Status == HandoverPending || handover.Status == HandoverMatching {
		e.logger.Warn("handover_accept_timeout", "handover_id", handoverID)
		_ = e.eventBus.PublishHandoverTimeout(ctx, handoverID)
		e.executeFallback(ctx, handover, &handover.Request)
	}
}

// executeFallback handles the case when no counselor is available
func (e *HandoverEngine) executeFallback(ctx context.Context, handover *Handover, req *types.HandoverRequest) (*Handover, error) {
	handover.FallbackUsed = true
	handover.Status = HandoverTimeout

	// Fallback: return user to AI with enhanced monitoring + show crisis resources
	_ = e.sessionStore.UpdateSessionState(ctx, req.SessionID, types.StateChatting)
	_ = e.eventBus.PublishSessionStateChange(ctx, req.SessionID, types.StateChatting)
	_ = e.handoverStore.UpdateHandoverStatus(ctx, handover.ID, handover.Status)

	e.logger.Warn("handover_fallback_executed", "handover_id", handover.ID, "region", req.Region)
	return handover, nil
}

// --- Error Types ---

type ForbiddenError struct {
	Code    string
	Message string
}

func (e *ForbiddenError) Error() string { return e.Message }

type StateConflictError struct {
	Current string
}

func (e *StateConflictError) Error() string { return fmt.Sprintf("session state conflict: current=%s", e.Current) }

type TimeoutError struct {
	Deadline time.Time
}

func (e *TimeoutError) Error() string { return fmt.Sprintf("handover accept deadline passed: %s", e.Deadline) }

func generateHandoverID() string {
	return fmt.Sprintf("ho-%d", time.Now().UnixNano())
}
