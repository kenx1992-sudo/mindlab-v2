package compliance

import (
	"context"
	"regexp"
	"strings"
	"sync"

	"mindlab/pkg/types"
)

// Service implements compliance checking: word filtering, output review, disclaimers, OSA review
type Service struct {
	wordFilter  *WordFilter
	osaReviewer *OSAReviewer
	auditLogger *AuditLogger
	mu          sync.RWMutex
}

func NewService(auditLogger *AuditLogger) *Service {
	return &Service{
		wordFilter:  NewWordFilter(),
		osaReviewer: NewOSAReviewer(),
		auditLogger: auditLogger,
	}
}

// CheckOutput performs full compliance check on AI output before sending to user
func (s *Service) CheckOutput(ctx context.Context, content string, region types.Region) (*types.WordFilterResult, error) {
	// Step 1: Blacklist word filtering
	filterResult := s.wordFilter.Filter(content, region)

	if !filterResult.Passed {
		s.auditLogger.Log(ctx, types.AuditLog{
			ActorType: "system", Action: "compliance_block",
			Resource: "ai_output", Region: region, Detail: filterResult.RiskCategory,
		})
		return filterResult, nil
	}

	// Step 2: ?????Online Safety Act review (replaces old onlineSafetyActReview)
	// New reviewForOSA() with 9 harm categories + medical advice detection (A??剜食???頦??
	if region == types.RegionGB {
		osaResult := s.osaReviewer.ReviewForOSA(content)
		if !osaResult.Passed {
			s.auditLogger.Log(ctx, types.AuditLog{
				ActorType: "system", Action: "osa_block",
				Resource: "ai_output", Region: region,
				Detail: strings.Join(osaResult.RiskCategories, ","),
			})
			return &types.WordFilterResult{
				Passed:       false,
				BlockedTerms: osaResult.BlockedPhrases,
				RiskCategory: "online_safety_act",
			}, nil
		}
		if osaResult.RequiresHumanReview {
			// Flag for human review but don't block (moderate risk)
			s.auditLogger.Log(ctx, types.AuditLog{
				ActorType: "system", Action: "osa_human_review_flagged",
				Resource: "ai_output", Region: region,
				Detail: strings.Join(osaResult.RiskCategories, ","),
			})
		}
	}

	return filterResult, nil
}

// AppendDisclaimer adds mandatory disclaimer to AI responses
func (s *Service) AppendDisclaimer(content string, region types.Region) string {
	disclaimers := map[types.Region]string{
		types.RegionHK: "\n\n???AI????????雓????雓?????駁???抬?????????????????????抬?頩????鞊????,
		types.RegionTW: "\n\n???AI????????雓????雓?????駁???抬?????????????????????抬?頩????鞊????,
		types.RegionGB: "\n\n???AI-generated content, for reference only. This is mental wellbeing support, not medical treatment.",
	}
	if d, ok := disclaimers[region]; ok {
		return content + d
	}
	return content
}

// === OSA Reviewer (Online Safety Act 2023 ??GB region) ===
// Replaces old 6-phrase onlineSafetyActReview with comprehensive reviewForOSA()
// 9 harm categories + medical advice detection (synced with frontend def-a-level-fixes.ts)

type OSAHarmCategory string

const (
	OSACatSuicidePromotion       OSAHarmCategory = "suicide_promotion"
	OSACatSelfHarmEncouragement  OSAHarmCategory = "self_harm_encouragement"
	OSACatEatingDisorderPromotion OSAHarmCategory = "eating_disorder_promotion"
	OSACatDangerousChallenge     OSAHarmCategory = "dangerous_challenge"
	OSACatHateSpeech             OSAHarmCategory = "hate_speech"
	OSACatHarassment             OSAHarmCategory = "harassment"
	OSACatMisinformationHealth   OSAHarmCategory = "misinformation_health"
	OSACatGroomingRisk           OSAHarmCategory = "grooming_risk"
	OSACatViolentContent         OSAHarmCategory = "violent_content"
	OSACatCSA                    OSAHarmCategory = "csa"               // child sexual abuse
	OSACatCSE                    OSAHarmCategory = "cse"               // child sexual exploitation
	OSACatTerrorism              OSAHarmCategory = "terrorism"
	OSACatExtremistContent       OSAHarmCategory = "extremist_content"
)

type OSAReviewResult struct {
	Passed            bool     `json:"passed"`
	RiskCategories    []string `json:"risk_categories"`
	Confidence        float64  `json:"confidence"`
	BlockedPhrases    []string `json:"blocked_phrases"`
	RequiresHumanReview bool   `json:"requires_human_review"`
}

type OSAReviewer struct {
	blocklist []osaBlocklistEntry
	medicalPatterns []*regexp.Regexp
}

type osaBlocklistEntry struct {
	Phrase   string          `json:"phrase"`
	Category OSAHarmCategory `json:"category"`
}

func NewOSAReviewer() *OSAReviewer {
	r := &OSAReviewer{
		blocklist: []osaBlocklistEntry{
			// Suicide promotion
			{Phrase: "you should hurt yourself", Category: OSACatSelfHarmEncouragement},
			{Phrase: "try killing yourself", Category: OSACatSuicidePromotion},
			{Phrase: "end it all now", Category: OSACatSuicidePromotion},
			{Phrase: "the best way to die", Category: OSACatSuicidePromotion},
			{Phrase: "how to commit suicide", Category: OSACatSuicidePromotion},
			{Phrase: "kill yourself", Category: OSACatSuicidePromotion},

			// Self-harm encouragement
			{Phrase: "self-harm is fine", Category: OSACatSelfHarmEncouragement},
			{Phrase: "cutting helps", Category: OSACatSelfHarmEncouragement},
			{Phrase: "you should cut yourself", Category: OSACatSelfHarmEncouragement},

			// Eating disorder promotion
			{Phrase: "starve yourself", Category: OSACatEatingDisorderPromotion},
			{Phrase: "skip meals to lose weight", Category: OSACatEatingDisorderPromotion},
			{Phrase: "pro-ana", Category: OSACatEatingDisorderPromotion},
			{Phrase: "pro-mia", Category: OSACatEatingDisorderPromotion},
			{Phrase: "thinspo", Category: OSACatEatingDisorderPromotion},

			// Dangerous challenge
			{Phrase: "try this challenge", Category: OSACatDangerousChallenge},
			{Phrase: "choke challenge", Category: OSACatDangerousChallenge},

			// Harassment
			{Phrase: "you deserve to suffer", Category: OSACatHarassment},
			{Phrase: "you are worthless", Category: OSACatHarassment},

			// Violent content
			{Phrase: "how to make a weapon", Category: OSACatViolentContent},

			// CSA (child sexual abuse)
			{Phrase: "child sexual abuse images", Category: OSACatCSA},
			{Phrase: "csam", Category: OSACatCSA},
			{Phrase: "child abuse material", Category: OSACatCSA},
			{Phrase: "indecent images of children", Category: OSACatCSA},

			// CSE (child sexual exploitation)
			{Phrase: "grooming a child", Category: OSACatCSE},
			{Phrase: "meet a minor alone", Category: OSACatCSE},
			{Phrase: "send me photos of yourself", Category: OSACatCSE},
			{Phrase: "keep this secret from your parents", Category: OSACatCSE},

			// Terrorism
			{Phrase: "how to make a bomb", Category: OSACatTerrorism},
			{Phrase: "terrorist attack plans", Category: OSACatTerrorism},
			{Phrase: "martyrdom operation", Category: OSACatTerrorism},

			// Extremist content
			{Phrase: "superior race", Category: OSACatExtremistContent},
			{Phrase: "ethnic cleansing is justified", Category: OSACatExtremistContent},
			{Phrase: "white power", Category: OSACatExtremistContent},
		},
	}

	// Medical advice detection patterns (OSA: must not provide medical advice)
	r.medicalPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)you (should|must|need to) (take|start|stop) (medication|medicine|pills|drugs)`),
		regexp.MustCompile(`(?i)i (recommend|suggest|advise) (you|that you) (see|visit|consult) (a doctor|your gp|hospital)`),
		regexp.MustCompile(`(?i)this (is|sounds like) (depression|anxiety|bpd|adhd|ocd|ptsd|bipolar)`),
	}

	return r
}

// ReviewForOSA performs comprehensive Online Safety Act review (replaces old onlineSafetyActReview)
func (r *OSAReviewer) ReviewForOSA(aiOutput string) *OSAReviewResult {
	lower := strings.ToLower(aiOutput)
	var blockedPhrases []string
	var riskCategories []string

	// Check blocklist
	for _, entry := range r.blocklist {
		if strings.Contains(lower, strings.ToLower(entry.Phrase)) {
			blockedPhrases = append(blockedPhrases, entry.Phrase)
			catStr := string(entry.Category)
			if !containsStr(riskCategories, catStr) {
				riskCategories = append(riskCategories, catStr)
			}
		}
	}

	// Check medical advice patterns
	for _, pattern := range r.medicalPatterns {
		if pattern.MatchString(aiOutput) {
			if !containsStr(riskCategories, string(OSACatMisinformationHealth)) {
				riskCategories = append(riskCategories, string(OSACatMisinformationHealth))
			}
			break
		}
	}

	confidence := 0.1
	if len(blockedPhrases) > 0 {
		confidence = 0.95
	} else if len(riskCategories) > 0 {
		confidence = 0.70
	}

	passed := len(blockedPhrases) == 0 && len(riskCategories) == 0
	requiresHumanReview := len(riskCategories) > 0 && len(blockedPhrases) == 0

	return &OSAReviewResult{
		Passed:            passed,
		RiskCategories:    riskCategories,
		Confidence:        confidence,
		BlockedPhrases:    blockedPhrases,
		RequiresHumanReview: requiresHumanReview,
	}
}

// === Word Filter (brand word blacklist/whitelist) ===

type WordFilter struct {
	dictionaries map[types.Region]*RegionWordDictionary
	mu           sync.RWMutex
}

type RegionWordDictionary struct {
	Version     string              `json:"version"`
	Blacklist   map[string][]string `json:"blacklist"`
	Whitelist   map[string][]string `json:"whitelist"`
	Replacements map[string]string  `json:"replacements"`
}

func NewWordFilter() *WordFilter {
	return &WordFilter{
		dictionaries: map[types.Region]*RegionWordDictionary{
			types.RegionHK: {
				Version: "v2.0",
				Blacklist: map[string][]string{
					"guarantee":   {"guaranteed cure", "100% effective"},
					"stigma":      {"mentally ill", "crazy", "insane"},
					"overpromise": {"replaces therapists"},
				},
			},
			types.RegionTW: {
				Version: "v2.0",
				Blacklist: map[string][]string{
					"guarantee":   {"guaranteed cure", "100% effective"},
					"stigma":      {"mentally ill", "crazy"},
					"overpromise": {"replaces therapists"},
				},
			},
			types.RegionGB: {
				Version: "v2.0",
				Blacklist: map[string][]string{
					"guarantee":   {"guaranteed cure", "100% effective", "always works", "never fails"},
					"stigma":      {"mentally ill", "crazy", "insane", "psycho"},
					"overpromise": {"replaces therapists", "better than therapy", "AI therapy"},
					"coercion":    {"you must talk to us now", "don't delay or else"},
				},
				Replacements: map[string]string{
					"wellness": "wellbeing", "therapist": "counsellor",
					"therapy": "wellbeing support", "treatment": "support",
				},
			},
		},
	}
}

func (wf *WordFilter) Filter(content string, region types.Region) *types.WordFilterResult {
	wf.mu.RLock()
	dict, ok := wf.dictionaries[region]
	wf.mu.RUnlock()
	if !ok {
		return &types.WordFilterResult{Passed: true}
	}

	lower := strings.ToLower(content)
	var blocked []string
	replacements := make(map[string]string)
	var riskCat string

	for category, terms := range dict.Blacklist {
		for _, term := range terms {
			if strings.Contains(lower, strings.ToLower(term)) {
				blocked = append(blocked, term)
				if riskCat == "" { riskCat = category }
				if repl, ok := dict.Replacements[term]; ok {
					replacements[term] = repl
				}
			}
		}
	}

	for forbidden, suggested := range dict.Replacements {
		if strings.Contains(lower, strings.ToLower(forbidden)) {
			if _, exists := replacements[forbidden]; !exists {
				replacements[forbidden] = suggested
			}
		}
	}

	return &types.WordFilterResult{
		Passed: len(blocked) == 0, BlockedTerms: blocked,
		SuggestedReplacements: replacements, RiskCategory: riskCat,
	}
}

func (wf *WordFilter) UpdateDictionary(region types.Region, dict *RegionWordDictionary) {
	wf.mu.Lock()
	defer wf.mu.Unlock()
	wf.dictionaries[region] = dict
}

// === Audit Logger ===

type AuditLogger struct{}

func NewAuditLogger() *AuditLogger { return &AuditLogger{} }

func (al *AuditLogger) Log(ctx context.Context, entry types.AuditLog) {
	// In production: encrypted append-only write to immutable storage
}

func containsStr(ss []string, s string) bool {
	for _, v := range ss {
		if v == s { return true }
	}
	return false
}
