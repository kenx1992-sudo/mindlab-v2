package ai_companion

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"mindlab/pkg/compliance"
	"mindlab/pkg/crisis"
	"mindlab/pkg/llm"
	"mindlab/pkg/types"
)

// AICompanionEngine provides 7x24 AI psychological companion service
type AICompanionEngine struct {
	crisisDetector  *crisis.Detector
	complianceSvc   *compliance.Service
	sessionStore    SessionStore
	messageStore    MessageStore
	consentChecker  ConsentChecker
	llmClient       *llm.Client
	kbPath          string
	logger          *slog.Logger
}

// SessionStore interface for session persistence
type SessionStore interface {
	GetSession(ctx context.Context, sessionID string) (*types.Session, error)
	CreateSession(ctx context.Context, session *types.Session) error
	UpdateSessionState(ctx context.Context, sessionID string, state types.SessionState) error
	DeleteSession(ctx context.Context, sessionID string) error
}

// MessageStore interface for message persistence
type MessageStore interface {
	StoreMessage(ctx context.Context, msg *types.Message) error
	GetMessages(ctx context.Context, sessionID string, limit int) ([]types.Message, error)
}

// ConsentChecker interface for consent validation
type ConsentChecker interface {
	HasConsent(ctx context.Context, userID string, consentType types.ConsentType) (bool, error)
	HasDerivedDataConsent(ctx context.Context, userID string, dataType string) (bool, error)
}

func NewAICompanionEngine(
	crisisDetector *crisis.Detector,
	complianceSvc *compliance.Service,
	sessionStore SessionStore,
	messageStore MessageStore,
	consentChecker ConsentChecker,
	llmClient *llm.Client,
	logger *slog.Logger,
) *AICompanionEngine {
	kbPath := os.Getenv("KB_PATH")
	if kbPath == "" {
		kbPath = "/app/knowledge-base"
	}
	return &AICompanionEngine{
		crisisDetector: crisisDetector,
		complianceSvc:  complianceSvc,
		sessionStore:   sessionStore,
		messageStore:   messageStore,
		consentChecker: consentChecker,
		llmClient:      llmClient,
		kbPath:         kbPath,
		logger:         logger,
	}
}

// loadKBFile reads a knowledge base markdown file
func (e *AICompanionEngine) loadKBFile(relPath string) string {
	path := filepath.Join(e.kbPath, relPath)
	data, err := os.ReadFile(path)
	if err != nil {
		e.logger.Warn("kb_load_failed", "path", relPath, "error", err)
		return ""
	}
	return string(data)
}

// systemPrompt returns the AI companion system prompt based on region and language
func (e *AICompanionEngine) systemPrompt(region types.Region, language string) string {
	var sb strings.Builder

	sb.WriteString(`你係 Mindlab 心理輔導 AI 夥伴，一個 7x24 心理健康支援服務。

## 核心原則
- 你係心理支援，唔係醫療診斷或治療
- 保持同理心、不批判、積極聆聽
- 唔可以提供藥物建議或診斷
- 察覺危機信號時，提供當地求助資源
- 尊重用戶私隱，唔會儲存敏感個人資料

## 陪伴回應四步法（核心框架）
每次回應跟以下四步：

1. **聆聽 (Listen)** — 仔細理解用戶表達嘅情緒同處境，唔急於回應
2. **驗證 (Validate)** — 認同用戶感受係正常嘅，「你咁樣覺得係好合理嘅」
3. **探索 (Explore)** — 用開放式問題引導用戶講多啲，幫佢整理思緒
4. **陪伴 (Offer presence)** — 讓用戶知道你喺度陪住佢，唔係孤單一人

重要：四步唔係死板順序，而係一個循環。用戶需要更多聆聽時就返去第一步。
每次回應聚焦 1-2 步，唔好一次過做晒四步。

## 回應風格
- 用溫暖、支持性嘅語氣，似朋友傾計
- 先認同用戶感受，再引導思考
- 避免長篇大論，保持對話自然流暢（2-4句為佳）
- 適當時候用開放式問題引導用戶表達更多
- 唔好急於俾解決方案，先聆聽同理解
- 避免使用「你應該...」，改用「你有冇諗過...」或「或者可以...」

## 安全守則
- 如果用戶提及自殺、自殘、暴力，立即提供危機熱線
- 唔可以鼓勵任何危險行為
- 如果用戶需要專業診斷，建議尋求註冊心理學家或醫生
- 察覺用戶情緒持續低落超過兩星期，建議考慮尋求專業協助
`)

	// Region-specific additions
	switch region {
	case types.RegionHK:
		sb.WriteString(`
## 香港地區
- 使用廣東話口語回應（唔係書面語）
- 熟悉香港文化同生活壓力（住屋、學業、工作、家庭）
- 危機熱線：撒瑪利亞會 2389 2222（24小時）、生命熱線 2382 0000（24小時）、明愛向晴軒 18288
`)
	case types.RegionTW:
		sb.WriteString(`
## 台灣地區
- 使用繁體中文（台灣用語）回應
- 熟悉台灣文化同生活壓力
- 危機熱線：安心專線 1925（24小時）、生命線 1995
`)
	case types.RegionGB:
		sb.WriteString(`
## 英國地區
- Use English to respond
- Familiar with UK culture and NHS system
- Crisis: Samaritans 116 123 (24h), NHS 111, Shout 85258 (text)
`)
	}

	// Language override
	if language == "en" && region != types.RegionGB {
		sb.WriteString("\nPlease respond in English.\n")
	} else if language == "zh-TW" && region != types.RegionTW {
		sb.WriteString("\n請用繁體中文（台灣用語）回應。\n")
	}

	return sb.String()
}

// CreateSession creates a new AI companion session (POST /v1/sessions)
func (e *AICompanionEngine) CreateSession(ctx context.Context, userID string, region types.Region) (*types.Session, error) {
	// Verify user has completed informed consent (G-005)
	hasConsent, err := e.consentChecker.HasConsent(ctx, userID, types.ConsentTermsOfService)
	if err != nil {
		return nil, fmt.Errorf("consent check failed: %w", err)
	}
	if !hasConsent {
		return nil, &ComplianceError{Code: "CONSENT_001", Message: "請先完成服務條款同意"}
	}

	hasSensitive, err := e.consentChecker.HasConsent(ctx, userID, types.ConsentSensitiveData)
	if err != nil {
		return nil, fmt.Errorf("sensitive consent check failed: %w", err)
	}
	if !hasSensitive {
		return nil, &ComplianceError{Code: "CONSENT_001", Message: "請先同意敏感資料處理"}
	}

	session := &types.Session{
		ID:        generateID(),
		UserID:    userID,
		State:     types.StateChatting,
		Region:    region,
		CreatedAt: time.Now(),
	}

	if err := e.sessionStore.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("session creation failed: %w", err)
	}

	e.logger.Info("session_created", "session_id", session.ID, "user_id", userID, "region", region)
	return session, nil
}

// SendMessage processes a user message and returns AI response
func (e *AICompanionEngine) SendMessage(ctx context.Context, sessionID string, userID string, content string, region types.Region) (*SendMessageResult, error) {
	// Load session and validate
	session, err := e.sessionStore.GetSession(ctx, sessionID)
	if err != nil {
		return nil, &NotFoundError{Resource: "session", ID: sessionID}
	}
	if session.UserID != userID {
		return nil, &ForbiddenError{Code: "REGION_001", Message: "用戶與會話不匹配"}
	}
	if session.State != types.StateChatting && session.State != types.StateFreeTrial {
		return nil, &StateConflictError{Current: string(session.State)}
	}

	// === Crisis Detection ===
	crisisResult, err := e.crisisDetector.Detect(ctx, content, region, nil)
	if err != nil {
		e.logger.Error("crisis_detection_failed", "session_id", sessionID, "error", err)
		crisisResult = crisis.DegradedModeFallback(region)
	}

	if crisis.IsCrisisPath(crisisResult) {
		_ = e.sessionStore.UpdateSessionState(ctx, sessionID, types.StateCrisisHandling)
		intervention := crisis.NewIntervention(e.crisisDetector, nil)
		_ = intervention.TriggerCrisisIntervention(ctx, userID, sessionID, region, crisisResult)
		return &SendMessageResult{
			Type:            "crisis_intervention",
			CrisisResources: crisisResult.LocalCrisisResources,
			RiskLevel:       crisisResult.RiskLevel,
		}, nil
	}

	// === Compliance Review ===
	filterResult, err := e.complianceSvc.CheckOutput(ctx, content, region)
	if err != nil {
		return nil, fmt.Errorf("compliance check failed: %w", err)
	}
	if !filterResult.Passed {
		return &SendMessageResult{
			Type:         "compliance_blocked",
			BlockedTerms: filterResult.BlockedTerms,
			Replacements: filterResult.SuggestedReplacements,
		}, nil
	}

	// === Build conversation history ===
	historyMsgs, _ := e.messageStore.GetMessages(ctx, sessionID, 10)
	var llmHistory []llm.Message
	for _, m := range historyMsgs {
		role := m.Role
		if role == "ai" {
			role = "assistant"
		}
		llmHistory = append(llmHistory, llm.Message{Role: role, Content: m.Content})
	}

	// === LLM API call ===
	prompt := e.systemPrompt(region, "")
	aiResponse, err := e.llmClient.Chat(ctx, prompt, content, llmHistory)
	if err != nil {
		e.logger.Error("llm_call_failed", "session_id", sessionID, "error", err)
		aiResponse = "對唔住，我暫時未能回應。請稍後再試，或者你可以打危機熱線求助。"
	}

	// === Safety output review ===
	outputCheck, err := e.complianceSvc.CheckOutput(ctx, aiResponse, region)
	if err != nil {
		return nil, fmt.Errorf("output safety check failed: %w", err)
	}
	if !outputCheck.Passed {
		e.logger.Error("ai_output_blocked", "session_id", sessionID, "category", outputCheck.RiskCategory)
		return &SendMessageResult{
			Type:         "output_blocked",
			BlockedTerms: outputCheck.BlockedTerms,
		}, nil
	}

	// === Append disclaimer ===
	if !strings.Contains(aiResponse, "非醫療診斷") {
		aiResponse = e.complianceSvc.AppendDisclaimer(aiResponse, region)
	}

	// Store messages
	userMsg := &types.Message{
		ID:        generateID(),
		SessionID: sessionID,
		Role:      "user",
		Content:   content,
		RiskLevel: crisisResult.RiskLevel,
		CreatedAt: time.Now(),
	}
	aiMsg := &types.Message{
		ID:        generateID(),
		SessionID: sessionID,
		Role:      "ai",
		Content:   aiResponse,
		RiskLevel: types.RiskNone,
		CreatedAt: time.Now(),
	}
	_ = e.messageStore.StoreMessage(ctx, userMsg)
	_ = e.messageStore.StoreMessage(ctx, aiMsg)

	return &SendMessageResult{
		Type:     "ai_response",
		Response: aiResponse,
	}, nil
}

// EndSession ends an AI companion session
func (e *AICompanionEngine) EndSession(ctx context.Context, sessionID string, userID string) error {
	session, err := e.sessionStore.GetSession(ctx, sessionID)
	if err != nil {
		return &NotFoundError{Resource: "session", ID: sessionID}
	}
	if session.UserID != userID {
		return &ForbiddenError{Code: "REGION_001", Message: "用戶與會話不匹配"}
	}

	now := time.Now()
	session.EndedAt = &now
	return e.sessionStore.UpdateSessionState(ctx, sessionID, types.StateNew)
}

// SendMessageResult wraps the response for message sending
type SendMessageResult struct {
	Type            string                 `json:"type"`
	Response        string                 `json:"response,omitempty"`
	CrisisResources []types.CrisisResource `json:"crisis_resources,omitempty"`
	RiskLevel       types.RiskLevel        `json:"risk_level,omitempty"`
	BlockedTerms    []string               `json:"blocked_terms,omitempty"`
	Replacements    map[string]string      `json:"replacements,omitempty"`
}

// --- Error Types ---

type ComplianceError struct {
	Code    string
	Message string
}

func (e *ComplianceError) Error() string { return e.Message }

type NotFoundError struct {
	Resource string
	ID       string
}

func (e *NotFoundError) Error() string { return fmt.Sprintf("%s not found: %s", e.Resource, e.ID) }

type ForbiddenError struct {
	Code    string
	Message string
}

func (e *ForbiddenError) Error() string { return e.Message }

type StateConflictError struct {
	Current string
}

func (e *StateConflictError) Error() string {
	return fmt.Sprintf("session state conflict: current=%s", e.Current)
}

// --- Helpers ---

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func ValidateSessionTransition(from, to types.SessionState) error {
	allowed, ok := types.ValidTransitions[from]
	if !ok {
		return errors.New("invalid source state")
	}
	for _, s := range allowed {
		if s == to {
			return nil
		}
	}
	return fmt.Errorf("invalid transition: %s -> %s", from, to)
}
