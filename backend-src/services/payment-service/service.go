package payment_service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"mindlab/pkg/types"
)

// PaymentService handles multi-region payment processing with adapter pattern
type PaymentService struct {
	adapters     map[types.Region]PaymentAdapter
	subscription SubscriptionManager
	reconciler   Reconciler
	logger       *slog.Logger
}

// PaymentAdapter abstracts region-specific payment providers
type PaymentAdapter interface {
	CreatePayment(ctx context.Context, req *PaymentRequest) (*PaymentResult, error)
	VerifyPayment(ctx context.Context, paymentID string) (*PaymentStatus, error)
	Refund(ctx context.Context, paymentID string, amount *float64) (*RefundResult, error)
	HandleWebhook(ctx context.Context, payload []byte) error
	SupportedCurrency() string
	SupportedMethods() []string
}

type SubscriptionManager interface {
	CreateSubscription(ctx context.Context, userID string, plan types.PricingTier, region types.Region) (*Subscription, error)
	CancelSubscription(ctx context.Context, subscriptionID string) error
	GetSubscription(ctx context.Context, userID string) (*Subscription, error)
}

type Reconciler interface {
	Reconcile(ctx context.Context, region types.Region, since time.Time) (*ReconciliationReport, error)
}

type PaymentRequest struct {
	UserID      string          `json:"user_id"`
	Region      types.Region    `json:"region"`
	Amount      float64         `json:"amount"`
	Currency    string          `json:"currency"`
	Method      string          `json:"method"` // "stripe" / "fps" / "line_pay"
	Tier        types.PricingTier `json:"tier"`
	IdempotencyKey string       `json:"idempotency_key"`
	Description string          `json:"description"`
}

type PaymentResult struct {
	PaymentID   string `json:"payment_id"`
	Status      string `json:"status"` // "pending" / "completed" / "failed"
	RedirectURL string `json:"redirect_url,omitempty"`
}

type PaymentStatus struct {
	PaymentID string    `json:"payment_id"`
	Status    string    `json:"status"`
	Amount    float64   `json:"amount"`
	CreatedAt time.Time `json:"created_at"`
}

type RefundResult struct {
	RefundID string `json:"refund_id"`
	Status   string `json:"status"`
}

type Subscription struct {
	ID           string          `json:"id"`
	UserID       string          `json:"user_id"`
	Plan         types.PricingTier `json:"plan"`
	Region       types.Region    `json:"region"`
	Status       string          `json:"status"` // "active" / "cancelled" / "expired"
	CurrentPeriodEnd time.Time   `json:"current_period_end"`
	CreatedAt    time.Time       `json:"created_at"`
}

type ReconciliationReport struct {
	TotalPayments   int     `json:"total_payments"`
	TotalAmount     float64 `json:"total_amount"`
	Discrepancies   int     `json:"discrepancies"`
	DiscrepancyAmount float64 `json:"discrepancy_amount"`
}

func NewPaymentService(adapters map[types.Region]PaymentAdapter, subMgr SubscriptionManager, reconciler Reconciler, logger *slog.Logger) *PaymentService {
	return &PaymentService{
		adapters:     adapters,
		subscription: subMgr,
		reconciler:   reconciler,
		logger:       logger,
	}
}

// Checkout initiates a payment (POST /v1/payments/checkout)
func (s *PaymentService) Checkout(ctx context.Context, req *PaymentRequest) (*PaymentResult, error) {
	adapter, ok := s.adapters[req.Region]
	if !ok {
		return nil, fmt.Errorf("no payment adapter for region %s", req.Region)
	}

	// Set currency based on region
	req.Currency = regionCurrency(req.Region)

	result, err := adapter.CreatePayment(ctx, req)
	if err != nil {
		s.logger.Error("payment_failed", "user_id", req.UserID, "region", req.Region, "error", err)
		return nil, &PaymentError{Code: "PAYMENT_001", Message: "支付失败"}
	}

	s.logger.Info("payment_created", "payment_id", result.PaymentID, "user_id", req.UserID, "region", req.Region)
	return result, nil
}

// CreateSubscription starts a subscription (POST /v1/subscriptions)
func (s *PaymentService) CreateSubscription(ctx context.Context, userID string, plan types.PricingTier, region types.Region) (*Subscription, error) {
	sub, err := s.subscription.CreateSubscription(ctx, userID, plan, region)
	if err != nil {
		return nil, fmt.Errorf("subscription creation failed: %w", err)
	}

	s.logger.Info("subscription_created", "subscription_id", sub.ID, "user_id", userID, "plan", plan, "region", region)
	return sub, nil
}

// CancelSubscription cancels a subscription (DELETE /v1/subscriptions/{id})
func (s *PaymentService) CancelSubscription(ctx context.Context, subscriptionID string) error {
	if err := s.subscription.CancelSubscription(ctx, subscriptionID); err != nil {
		return fmt.Errorf("subscription cancellation failed: %w", err)
	}
	s.logger.Info("subscription_cancelled", "subscription_id", subscriptionID)
	return nil
}

// HandleWebhook processes payment provider webhooks
func (s *PaymentService) HandleWebhook(ctx context.Context, region types.Region, payload []byte) error {
	adapter, ok := s.adapters[region]
	if !ok {
		return fmt.Errorf("no payment adapter for region %s", region)
	}
	return adapter.HandleWebhook(ctx, payload)
}

// FallbackPayment switches to backup payment channel (PRD §9.3)
func (s *PaymentService) FallbackPayment(ctx context.Context, req *PaymentRequest, primaryError error) (*PaymentResult, error) {
	s.logger.Warn("payment_fallback_triggered", "region", req.Region, "primary_error", primaryError)

	switch req.Region {
	case types.RegionHK:
		// HK: Stripe → FPS
		if req.Method == "stripe" {
			req.Method = "fps"
			s.logger.Info("switching_to_fps", "user_id", req.UserID)
			return s.Checkout(ctx, req)
		}
	case types.RegionTW:
		// TW: Line Pay → Credit Card (Stripe)
		if req.Method == "line_pay" {
			req.Method = "stripe"
			s.logger.Info("switching_to_stripe_cc", "user_id", req.UserID)
			return s.Checkout(ctx, req)
		}
	case types.RegionGB:
		// GB: Single channel (Stripe), no fallback
		return nil, fmt.Errorf("no fallback payment available for GB: %w", primaryError)
	}

	return nil, fmt.Errorf("no fallback available: %w", primaryError)
}

func regionCurrency(region types.Region) string {
	switch region {
	case types.RegionHK:
		return "HKD"
	case types.RegionTW:
		return "TWD"
	case types.RegionGB:
		return "GBP"
	default:
		return "USD"
	}
}

// PaymentError for payment failures
type PaymentError struct {
	Code    string
	Message string
}

func (e *PaymentError) Error() string { return e.Message }
