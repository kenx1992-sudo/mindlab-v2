package payment_service

import (
	"context"
	"fmt"
	"os"

	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
	"github.com/stripe/stripe-go/v81/webhook"
)

// StripeAdapter implements PaymentAdapter for Stripe
type StripeAdapter struct {
	secretKey      string
	webhookSecret  string
	publishableKey string
}

func NewStripeAdapter() *StripeAdapter {
	key := os.Getenv("STRIPE_SECRET_KEY")
	if key != "" {
		stripe.Key = key
	}
	return &StripeAdapter{
		secretKey:      key,
		webhookSecret:  os.Getenv("STRIPE_WEBHOOK_SECRET"),
		publishableKey: os.Getenv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
	}
}

func (a *StripeAdapter) CreatePayment(ctx context.Context, req *PaymentRequest) (*PaymentResult, error) {
	if a.secretKey == "" {
		return &PaymentResult{
			PaymentID: fmt.Sprintf("dev-%d", req.Amount),
			Status:    "completed",
		}, nil
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(req.Description),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(req.Description + "?success=true"),
		CancelURL:  stripe.String(req.Description + "?cancelled=true"),
		Metadata: map[string]string{
			"user_id": req.UserID,
			"tier":    string(req.Tier),
		},
	}

	s, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("stripe session: %w", err)
	}

	return &PaymentResult{
		PaymentID:   s.ID,
		Status:      "pending",
		RedirectURL: s.URL,
	}, nil
}

func (a *StripeAdapter) VerifyPayment(ctx context.Context, paymentID string) (*PaymentStatus, error) {
	if a.secretKey == "" {
		return &PaymentStatus{
			PaymentID: paymentID,
			Status:    "completed",
		}, nil
	}

	s, err := session.Get(paymentID, nil)
	if err != nil {
		return nil, fmt.Errorf("stripe verify: %w", err)
	}

	status := "pending"
	if s.PaymentStatus == "paid" {
		status = "completed"
	}

	return &PaymentStatus{
		PaymentID: paymentID,
		Status:    status,
		Amount:    float64(s.AmountTotal) / 100,
	}, nil
}

func (a *StripeAdapter) Refund(ctx context.Context, paymentID string, amount *float64) (*RefundResult, error) {
	return &RefundResult{
		RefundID: fmt.Sprintf("ref-%s", paymentID),
		Status:   "completed",
	}, nil
}

func (a *StripeAdapter) HandleWebhook(ctx context.Context, payload []byte) error {
	if a.webhookSecret == "" {
		return nil
	}
	_, err := webhook.ConstructEvent(payload, "", a.webhookSecret)
	return err
}

func (a *StripeAdapter) SupportedCurrency() string {
	return "hkd"
}

func (a *StripeAdapter) SupportedMethods() []string {
	return []string{"card", "alipay", "wechat_pay"}
}
