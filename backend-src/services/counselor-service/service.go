package counselor_service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"mindlab/pkg/types"
)

// CounselorService manages counselor onboarding, credential verification, and scheduling
type CounselorService struct {
	counselorStore CounselorStore
	credentialSvc  CredentialVerifier
	statutoryTracker *HKStatutoryTracker
	logger         *slog.Logger
}

type CounselorStore interface {
	GetCounselor(ctx context.Context, counselorID string) (*types.Counselor, error)
	UpdateOnlineStatus(ctx context.Context, counselorID string, online bool) error
	UpdateSchedule(ctx context.Context, counselorID string, schedule Schedule) error
	FindAvailable(ctx context.Context, region types.Region, specialties []string, languages []string) ([]types.Counselor, error)
}

type CredentialVerifier interface {
	VerifyCertificate(ctx context.Context, counselorID string, region types.Region) (*CredentialCheckResult, error)
	VerifyBackground(ctx context.Context, counselorID string, region types.Region) (*BackgroundCheckResult, error)
}

type Schedule struct {
	WeeklySlots []TimeSlot `json:"weekly_slots"`
	Timezone    string     `json:"timezone"`
}

type TimeSlot struct {
	DayOfWeek int       `json:"day_of_week"` // 0=Sunday
	StartTime string    `json:"start_time"`  // "09:00"
	EndTime   string    `json:"end_time"`    // "17:00"
}

type CredentialCheckResult struct {
	Valid         bool      `json:"valid"`
	ExpiryDate    time.Time `json:"expiry_date"`
	LicenseType   string    `json:"license_type"`
	VerifiedAt    time.Time `json:"verified_at"`
}

type BackgroundCheckResult struct {
	Valid    bool      `json:"valid"`
	CheckedAt time.Time `json:"checked_at"`
}

// HKStatutoryTracker tracks Hong Kong statutory counselor registration (CR-004)
type HKStatutoryTracker struct {
	Monitoring          bool   `json:"monitoring"`
	EstimatedDate       string `json:"estimated_date"`
	SwitchWindowMonths  int    `json:"switch_window_months"`
	CurrentStandard     string `json:"current_standard"`     // "HKPCA"
	FallbackStandard    string `json:"fallback_standard"`    // "同等资历（经平台专业委员会评审）"
}

func NewCounselorService(store CounselorStore, verifier CredentialVerifier, logger *slog.Logger) *CounselorService {
	return &CounselorService{
		counselorStore: store,
		credentialSvc:  verifier,
		statutoryTracker: &HKStatutoryTracker{
			Monitoring:         true,
			EstimatedDate:      "2027-Q2", // Hong Kong pending legislation
			SwitchWindowMonths: 6,
			CurrentStandard:    "HKPCA认证",
			FallbackStandard:   "同等资历（经平台专业委员会评审）",
		},
		logger: logger,
	}
}

// VerifyBeforeSession performs real-time credential check before each counseling session
// This is a mandatory compliance check (CR-004)
func (s *CounselorService) VerifyBeforeSession(ctx context.Context, counselorID string, region types.Region) error {
	counselor, err := s.counselorStore.GetCounselor(ctx, counselorID)
	if err != nil {
		return fmt.Errorf("counselor not found: %w", err)
	}
	_ = counselor // used below for region check

	// Certificate validity check
	certResult, err := s.credentialSvc.VerifyCertificate(ctx, counselorID, region)
	if err != nil {
		return fmt.Errorf("certificate verification failed: %w", err)
	}
	if !certResult.Valid {
		return &CredentialError{
			Code:    "COUNSELOR_002",
			Message: "辅导员资质校验失败：证书无效或已过期",
		}
	}

	// Background check validity (must be within 12 months)
	bgResult, err := s.credentialSvc.VerifyBackground(ctx, counselorID, region)
	if err != nil {
		return fmt.Errorf("background check failed: %w", err)
	}
	if !bgResult.Valid {
		return &CredentialError{
			Code:    "COUNSELOR_002",
			Message: "辅导员资质校验失败：背景审查过期",
		}
	}

	// 🇭🇰 HK-specific: statutory registration tracking
	if region == types.RegionHK {
		s.logger.Info("hk_statutory_check",
			"counselor_id", counselorID,
			"current_standard", s.statutoryTracker.CurrentStandard,
			"monitoring", s.statutoryTracker.Monitoring,
		)
	}

	s.logger.Info("counselor_verified", "counselor_id", counselorID, "region", region)
	return nil
}

// UpdateSchedule updates counselor availability (PUT /v1/counselors/me/schedule)
func (s *CounselorService) UpdateSchedule(ctx context.Context, counselorID string, schedule Schedule) error {
	return s.counselorStore.UpdateSchedule(ctx, counselorID, schedule)
}

// SetOnlineStatus updates counselor online status for matching
func (s *CounselorService) SetOnlineStatus(ctx context.Context, counselorID string, online bool) error {
	return s.counselorStore.UpdateOnlineStatus(ctx, counselorID, online)
}

// GetHKStatutoryTracker returns the HK statutory registration tracking status (CR-004)
func (s *CounselorService) GetHKStatutoryTracker() *HKStatutoryTracker {
	return s.statutoryTracker
}

// SwitchToStatutoryStandard switches HK counselor standard when statutory registration becomes law
func (s *CounselorService) SwitchToStatutoryStandard(newStandard string) {
	s.statutoryTracker.CurrentStandard = newStandard
	s.logger.Info("hk_standard_switched", "new_standard", newStandard)
}

// CredentialError for counselor credential failures
type CredentialError struct {
	Code    string
	Message string
}

func (e *CredentialError) Error() string { return e.Message }

// OnboardingConfig defines per-region counselor onboarding requirements
type OnboardingConfig struct {
	Region               types.Region `json:"region"`
	PrimaryStandard      string       `json:"primary_standard"`
	FallbackStandard     string       `json:"fallback_standard,omitempty"`
	StatutoryRequired    bool         `json:"statutory_required"`
	MandatoryTraining    []string     `json:"mandatory_training"`
	BackgroundCheckType  string       `json:"background_check_type"`
}

var OnboardingConfigs = map[types.Region]OnboardingConfig{
	types.RegionHK: {
		Region:           types.RegionHK,
		PrimaryStandard:  "HKPCA认证",
		FallbackStandard: "同等资历（经平台专业委员会评审）",
		StatutoryRequired: false, // pending legislation
		MandatoryTraining: []string{"平台规范", "当地法规", "用语合规"},
		BackgroundCheckType: "性罪行定罪记录查核",
	},
	types.RegionTW: {
		Region:            types.RegionTW,
		PrimaryStandard:   "有效心理师证书（心理师法强制）",
		StatutoryRequired: true,
		MandatoryTraining: []string{"平台规范", "当地法规", "自杀防治守门人培训"}, // CR-005: 强制准入
		BackgroundCheckType: "良民证",
	},
	types.RegionGB: {
		Region:            types.RegionGB,
		PrimaryStandard:   "BACP/UKCP注册",
		StatutoryRequired: false, // voluntary for counsellors, mandatory for psychologists (HCPC)
		MandatoryTraining: []string{"平台规范", "当地法规", "Safeguarding", "用语合规"},
		BackgroundCheckType: "DBS核查",
	},
}
