package types

import "time"

// Region represents deployment region
type Region string

const (
	RegionHK Region = "HK"
	RegionTW Region = "TW"
	RegionGB Region = "GB"
)

// SessionState represents the state machine of a session
type SessionState string

const (
	StateNew              SessionState = "NEW"
	StateFreeTrial        SessionState = "FREE_TRIAL"
	StateChatting         SessionState = "CHATTING"
	StateCounselorPending SessionState = "COUNSELOR_PENDING"
	StateCounselorSession SessionState = "COUNSELOR_SESSION"
	StateCrisisHandling   SessionState = "CRISIS_HANDLING"
)

// ValidTransitions defines allowed state transitions
var ValidTransitions = map[SessionState][]SessionState{
	StateNew:              {StateFreeTrial, StateChatting},
	StateFreeTrial:        {StateChatting},
	StateChatting:         {StateCounselorPending, StateCrisisHandling, StateNew},
	StateCounselorPending: {StateCounselorSession, StateChatting},
	StateCounselorSession: {StateChatting, StateCrisisHandling},
	StateCrisisHandling:   {StateCounselorSession, StateCounselorPending},
}

// RiskLevel represents crisis risk severity
type RiskLevel string

const (
	RiskNone     RiskLevel = "none"
	RiskLow      RiskLevel = "low"
	RiskMedium   RiskLevel = "medium"
	RiskHigh     RiskLevel = "high"
	RiskCritical RiskLevel = "critical"
)

// TriggerType defines why a handover was triggered
type TriggerType string

const (
	TriggerCrisis       TriggerType = "crisis"
	TriggerUserRequest  TriggerType = "user_request"
	TriggerAISuggestion TriggerType = "ai_suggestion"
)

// UrgencyLevel represents handover urgency
type UrgencyLevel string

const (
	UrgencyNormal    UrgencyLevel = "normal"
	UrgencyUrgent    UrgencyLevel = "urgent"
	UrgencyEmergency UrgencyLevel = "emergency"
)

// ConsentType defines consent categories
type ConsentType string

const (
	ConsentTermsOfService ConsentType = "terms_of_service"
	ConsentPrivacyPolicy  ConsentType = "privacy_policy"
	ConsentDataProcessing ConsentType = "data_processing"
	ConsentSensitiveData  ConsentType = "sensitive_data"
	ConsentDerivedData    ConsentType = "derived_data"
	ConsentMinorGuardian  ConsentType = "minor_guardian"
	ConsentCrossRegion    ConsentType = "cross_region"
)

// PricingTier defines subscription tiers
type PricingTier string

const (
	TierAIFree    PricingTier = "ai_free"
	TierAIPlus    PricingTier = "ai_plus"
	TierCounselor PricingTier = "counselor"
	TierEAP       PricingTier = "eap"
)

// --- Core Domain Models ---

type User struct {
	ID           string     `json:"id" db:"id"`
	Region       Region     `json:"region" db:"region"`
	Email        string     `json:"email" db:"email"`
	DisplayName  string     `json:"display_name" db:"display_name"`
	MinorFlag    bool       `json:"minor_flag" db:"minor_flag"`
	GuardianID   *string    `json:"guardian_id,omitempty" db:"guardian_id"`
	Subscription PricingTier `json:"subscription" db:"subscription"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Session struct {
	ID          string       `json:"id" db:"id"`
	UserID      string       `json:"user_id" db:"user_id"`
	State       SessionState `json:"state" db:"state"`
	Region      Region       `json:"region" db:"region"`
	CounselorID *string      `json:"counselor_id,omitempty" db:"counselor_id"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	EndedAt     *time.Time   `json:"ended_at,omitempty" db:"ended_at"`
}

type Message struct {
	ID          string    `json:"id" db:"id"`
	SessionID   string    `json:"session_id" db:"session_id"`
	Role        string    `json:"role" db:"role"` // user / ai / counselor / system
	Content     string    `json:"-" db:"content"` // encrypted, never expose in JSON
	RiskLevel   RiskLevel `json:"risk_level" db:"risk_level"`
	EmotionTags []string  `json:"emotion_tags,omitempty" db:"emotion_tags"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Consent struct {
	ID         string      `json:"id" db:"id"`
	UserID     string      `json:"user_id" db:"user_id"`
	Type       ConsentType `json:"type" db:"type"`
	DataType   string      `json:"data_type,omitempty" db:"data_type"`
	DataScope  string      `json:"data_scope,omitempty" db:"data_scope"`
	GrantedAt  time.Time   `json:"granted_at" db:"granted_at"`
	RevokedAt  *time.Time  `json:"revoked_at,omitempty" db:"revoked_at"`
	Version    string      `json:"version" db:"version"`
	IPAddress  string      `json:"ip_address" db:"ip_address"`
	UserAgent  string      `json:"user_agent" db:"user_agent"`
}

type Counselor struct {
	ID            string   `json:"id" db:"id"`
	UserID        string   `json:"user_id" db:"user_id"`
	Region        Region   `json:"region" db:"region"`
	LicenseType   string   `json:"license_type" db:"license_type"`
	Specialties   []string `json:"specialties" db:"specialties"`
	Languages     []string `json:"languages" db:"languages"`
	CertValid     bool     `json:"cert_valid" db:"cert_valid"`
	Online        bool     `json:"online" db:"online"`
}

type HandoverRequest struct {
	UserID               string               `json:"user_id" validate:"required"`
	SessionID            string               `json:"session_id" validate:"required"`
	TriggerType          TriggerType          `json:"trigger_type" validate:"required"`
	RiskLevel            RiskLevel            `json:"risk_level" validate:"required"`
	EmotionSummary       string               `json:"emotion_summary" validate:"required"`
	TopicTags            []string             `json:"topic_tags,omitempty"`
	Urgency              UrgencyLevel         `json:"urgency" validate:"required"`
	Region               Region               `json:"region" validate:"required"`
	LanguagePreference   string               `json:"language_preference" validate:"required"`
	PreferredCounselor   *CounselorPreference `json:"preferred_counselor_profile,omitempty"`
	LocalCrisisResources []CrisisResource     `json:"local_crisis_resources" validate:"required"`
}

type CounselorPreference struct {
	Specialties []string `json:"specialties,omitempty"`
	Gender      string   `json:"gender,omitempty"`
	Language    string   `json:"language,omitempty"`
}

type CrisisResource struct {
	Name        string `json:"name"`
	PhoneNumber string `json:"phone_number"`
	Region      Region `json:"region"`
	Available24h bool  `json:"available_24h"`
}

type CrisisDetectionResult struct {
	RiskLevel            RiskLevel        `json:"risk_level"`
	Confidence           float64          `json:"confidence"`
	TriggeredBy          string           `json:"triggered_by"` // "keyword" / "semantic"
	MatchedTerms         []string         `json:"matched_terms,omitempty"`
	LocalCrisisResources []CrisisResource `json:"local_crisis_resources"`
}

type AuditLog struct {
	ID         string    `json:"id" db:"id"`
	Timestamp  time.Time `json:"timestamp" db:"timestamp"`
	ActorID    string    `json:"actor_id" db:"actor_id"`
	ActorType  string    `json:"actor_type" db:"actor_type"`
	Action     string    `json:"action" db:"action"`
	Resource   string    `json:"resource" db:"resource"`
	ResourceID string    `json:"resource_id" db:"resource_id"`
	Region     Region    `json:"region" db:"region"`
	Detail     string    `json:"-" db:"detail"` // encrypted
	IPAddress  string    `json:"ip_address" db:"ip_address"`
	RequestID  string    `json:"request_id" db:"request_id"`
}

// MinorProtectionConfig defines per-region minor protection policy (compliance CR-010)
type MinorProtectionConfig struct {
	Region              Region `json:"region"`
	GuardianConsentAge  int    `json:"guardian_consent_age"`
	SelfConsentAge      int    `json:"self_consent_age"`
	SafeguardingAge     int    `json:"safeguarding_age"`
	CapacityTestRequired bool  `json:"capacity_test_required"`
	ExtraReview         bool   `json:"extra_review"`
}

var MinorProtectionPolicies = map[Region]MinorProtectionConfig{
	RegionHK: {Region: RegionHK, GuardianConsentAge: 16, SelfConsentAge: 16, SafeguardingAge: 16, ExtraReview: true},
	RegionTW: {Region: RegionTW, GuardianConsentAge: 18, SelfConsentAge: 18, SafeguardingAge: 18, ExtraReview: true},
	RegionGB: {Region: RegionGB, GuardianConsentAge: 13, SelfConsentAge: 13, SafeguardingAge: 18, CapacityTestRequired: true, ExtraReview: true},
}

// CrisisHotlines per region (G-009)
var CrisisHotlines = map[Region][]CrisisResource{
	RegionHK: {
		{Name: "撒瑪利亞會", PhoneNumber: "2389 2222", Region: RegionHK, Available24h: true},
		{Name: "生命熱線", PhoneNumber: "2382 0000", Region: RegionHK, Available24h: true},
		{Name: "醫管局", PhoneNumber: "2466 7350", Region: RegionHK, Available24h: true},
	},
	RegionTW: {
		{Name: "安心專線", PhoneNumber: "1925", Region: RegionTW, Available24h: true},
		{Name: "生命線", PhoneNumber: "1995", Region: RegionTW, Available24h: true},
		{Name: "張老師", PhoneNumber: "0800-788-995", Region: RegionTW, Available24h: false},
	},
	RegionGB: {
		{Name: "Samaritans", PhoneNumber: "116 123", Region: RegionGB, Available24h: true},
		{Name: "NHS", PhoneNumber: "111", Region: RegionGB, Available24h: true},
		{Name: "Shout", PhoneNumber: "85258", Region: RegionGB, Available24h: true},
	},
}

// WordFilterResult for compliance service
type WordFilterResult struct {
	Passed               bool              `json:"passed"`
	BlockedTerms         []string          `json:"blocked_terms,omitempty"`
	SuggestedReplacements map[string]string `json:"suggested_replacements,omitempty"`
	RiskCategory         string            `json:"risk_category,omitempty"`
}

// APIResponse unified response
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
	RequestID string      `json:"request_id"`
	Timestamp int64       `json:"timestamp"`
}

// APIError unified error
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}
