package crisis

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"mindlab/pkg/types"
)

// Detector implements dual-path crisis detection (keyword + semantic)
type Detector struct {
	keywordMatcher   *KeywordMatcher
	semanticAnalyzer *SemanticAnalyzer
	eventBus         CrisisEventBus
	mu               sync.RWMutex
}

// CrisisEventBus abstracts NATS for crisis event broadcasting
type CrisisEventBus interface {
	PublishCrisisAlert(ctx context.Context, alert *CrisisAlert) error
	PublishDictSync(ctx context.Context, region types.Region, dict *CrisisDictionaryV2) error
}

// CrisisAlert is the event payload for crisis notifications
type CrisisAlert struct {
	UserID       string                 `json:"user_id"`
	SessionID    string                 `json:"session_id"`
	Region       types.Region           `json:"region"`
	RiskLevel    types.RiskLevel        `json:"risk_level"`
	TriggeredBy  string                 `json:"triggered_by"`
	Resources    []types.CrisisResource `json:"resources"`
	Timestamp    time.Time              `json:"timestamp"`
}

func NewDetector(eventBus CrisisEventBus) *Detector {
	return &Detector{
		keywordMatcher:   NewKeywordMatcher(),
		semanticAnalyzer: NewSemanticAnalyzer(),
		eventBus:         eventBus,
	}
}

// DetectV2 performs three-layer crisis detection (DEF-S001 V2 fix)
// Layer 1: Client-side keyword detection (already done by frontend)
// Layer 2: Server-side keyword + semantic pattern detection
// Layer 3: Server-side NLP semantic analysis
//
// POST /api/crisis/detect-v2
func (d *Detector) DetectV2(ctx context.Context, req *CrisisDetectV2Request) (*CrisisDetectV2Response, error) {
	result := &CrisisDetectV2Response{
		Region:    req.Region,
		Layer:     2,
		Resources: types.CrisisHotlines[req.Region],
	}

	// Layer 2: Server-side keyword + semantic pattern matching
	keywordResult := d.keywordMatcher.MatchV2(req.Message, req.Region)
	semanticResult := d.semanticAnalyzer.MatchPatterns(req.Message, req.Region)

	// Combine keyword and semantic pattern results
	result.MatchedKeywords = keywordResult.MatchedTerms
	result.MatchedPatterns = semanticResult.MatchedPatternIDs
	result.KeywordCategories = keywordResult.Categories

	// Determine risk from Layer 2
	layer2Risk := higherRisk(keywordResult.RiskLevel, semanticResult.RiskLevel)
	layer2Confidence := max(keywordResult.Confidence, semanticResult.Confidence)

	// Layer 3: NLP semantic analysis (enabled when client or Layer 2 requests it)
	var nlpResult *SemanticAnalysisResult
	if req.EnableSemanticAnalysis || req.EnableContextAnalysis || layer2Risk >= types.RiskMedium {
		var err error
		nlpResult, err = d.semanticAnalyzer.Analyze(ctx, req.Message, req.ConversationHistory, req.Region)
		if err != nil {
			// NLP failure: continue with Layer 2 results only
			nlpResult = &SemanticAnalysisResult{RiskLevel: types.RiskNone, Confidence: 0.0}
		} else {
			result.Layer = 3
			result.NLPSignals = nlpResult.Signals
		}
	}

	// Final risk determination: take highest across all layers
	finalRisk := layer2Risk
	finalConfidence := layer2Confidence
	triggeredBy := "keyword"

	if nlpResult != nil && nlpResult.RiskLevel != types.RiskNone {
		if riskOrder(nlpResult.RiskLevel) > riskOrder(finalRisk) {
			finalRisk = nlpResult.RiskLevel
			triggeredBy = "semantic"
		}
		finalConfidence = max(finalConfidence, nlpResult.Confidence)
	}

	// Critical override
	if keywordResult.RiskLevel == types.RiskCritical {
		finalRisk = types.RiskCritical
		finalConfidence = 1.0
		triggeredBy = "keyword"
	}

	result.RiskLevel = finalRisk
	result.Confidence = finalConfidence
	result.TriggeredBy = triggeredBy
	result.Detected = finalRisk == types.RiskHigh || finalRisk == types.RiskCritical

	return result, nil
}

// Detect (legacy) — kept for backward compatibility
func (d *Detector) Detect(ctx context.Context, message string, region types.Region, history []string) (*types.CrisisDetectionResult, error) {
	keywordResult := d.keywordMatcher.MatchV2(message, region)
	semanticResult, _ := d.semanticAnalyzer.Analyze(ctx, message, history, region)
	if semanticResult == nil {
		semanticResult = &SemanticAnalysisResult{RiskLevel: types.RiskNone, Confidence: 0.0}
	}

	result := &types.CrisisDetectionResult{
		RiskLevel:            higherRisk(keywordResult.RiskLevel, semanticResult.RiskLevel),
		LocalCrisisResources: types.CrisisHotlines[region],
	}

	if keywordResult.RiskLevel == types.RiskCritical {
		result.RiskLevel = types.RiskCritical
		result.Confidence = 1.0
		result.TriggeredBy = "keyword"
		result.MatchedTerms = keywordResult.MatchedTerms
	} else if keywordResult.RiskLevel >= semanticResult.RiskLevel {
		result.TriggeredBy = "keyword"
		result.Confidence = keywordResult.Confidence
		result.MatchedTerms = keywordResult.MatchedTerms
	} else {
		result.TriggeredBy = "semantic"
		result.Confidence = semanticResult.Confidence
	}

	return result, nil
}

// --- V2 Request/Response Types (synced with frontend def-s001-crisis-detection-v2.ts) ---

type CrisisDetectV2Request struct {
	Message              string        `json:"message" validate:"required"`
	Region               types.Region  `json:"region" validate:"required"`
	ClientMatchedKeywords []string     `json:"client_matched_keywords,omitempty"`
	ClientMatchedPatterns []string     `json:"client_matched_patterns,omitempty"`
	ClientConfidence     float64       `json:"client_confidence,omitempty"`
	EnableSemanticAnalysis bool         `json:"enable_semantic_analysis"`
	EnableContextAnalysis  bool         `json:"enable_context_analysis"`
	ConversationHistory  []string      `json:"conversation_history,omitempty"`
}

type CrisisDetectV2Response struct {
	Detected          bool                 `json:"detected"`
	RiskLevel         types.RiskLevel      `json:"risk_level"`
	Confidence        float64              `json:"confidence"`
	MatchedKeywords   []string             `json:"matched_keywords,omitempty"`
	MatchedPatterns   []string             `json:"matched_patterns,omitempty"`
	KeywordCategories []string             `json:"keyword_categories,omitempty"`
	NLPSignals        []string             `json:"nlp_signals,omitempty"`
	TriggeredBy       string               `json:"triggered_by"` // "keyword" / "semantic" / "pattern"
	Layer             int                  `json:"layer"`        // 2 or 3
	Region            types.Region         `json:"region"`
	Resources         []types.CrisisResource `json:"resources"`
}

// --- V2 Keyword Matcher (9 categories, 50+ keywords, synced with frontend) ---

type CrisisCategory string

const (
	CatSuicide       CrisisCategory = "suicide"
	CatSelfHarm      CrisisCategory = "self_harm"
	CatHopelessness  CrisisCategory = "hopelessness"
	CatMeans         CrisisCategory = "means"
	CatIdeation      CrisisCategory = "ideation"
)

type CrisisKeyword struct {
	Word     string         `json:"word"`
	Level    int            `json:"level"` // 1=immediate, 2=high risk, 3=context needed
	Category CrisisCategory `json:"category"`
	Regions  []string       `json:"regions"` // empty = all regions
}

type CrisisDictionaryV2 struct {
	Version  string           `json:"version"`
	Keywords []CrisisKeyword  `json:"keywords"`
	Patterns []SemanticPattern `json:"patterns"`
}

type KeywordMatcherV2Result struct {
	RiskLevel    types.RiskLevel
	Confidence   float64
	MatchedTerms []string
	Categories   []string
}

type KeywordMatcher struct {
	dictV2      *CrisisDictionaryV2
	mu          sync.RWMutex
}

func NewKeywordMatcher() *KeywordMatcher {
	km := &KeywordMatcher{}
	km.dictV2 = buildV2Dictionary()
	return km
}

// buildV2Dictionary creates the V2 crisis dictionary synced with frontend
// 9 categories, 50+ keywords across 3 regions
func buildV2Dictionary() *CrisisDictionaryV2 {
	return &CrisisDictionaryV2{
		Version: "v2.0",
		Keywords: []CrisisKeyword{
			// ═══ Level 1: Direct match (immediate intervention) ═══
			// Suicide
			{Word: "自殺", Level: 1, Category: CatSuicide, Regions: []string{"HK", "TW"}},
			{Word: "自杀", Level: 1, Category: CatSuicide, Regions: []string{"TW"}},
			{Word: "想死", Level: 1, Category: CatSuicide, Regions: []string{"HK", "TW"}},
			{Word: "結束生命", Level: 1, Category: CatSuicide, Regions: []string{"HK", "TW"}},
			{Word: "结束生命", Level: 1, Category: CatSuicide, Regions: []string{"TW"}},
			{Word: "唔想活", Level: 1, Category: CatSuicide, Regions: []string{"HK"}},
			{Word: "不想活", Level: 1, Category: CatSuicide, Regions: []string{"TW"}},
			{Word: "離開呢個世界", Level: 1, Category: CatSuicide, Regions: []string{"HK"}},
			{Word: "離開這個世界", Level: 1, Category: CatSuicide, Regions: []string{"TW"}},
			{Word: "世界冇我更好", Level: 1, Category: CatSuicide, Regions: []string{"HK"}},
			{Word: "世界沒有我更好", Level: 1, Category: CatSuicide, Regions: []string{"TW"}},
			{Word: "suicide", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "kill myself", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "end my life", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "don't want to live", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "no reason to live", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "better off dead", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},
			{Word: "want to die", Level: 1, Category: CatSuicide, Regions: []string{"GB"}},

			// Means (self-harm methods)
			{Word: "跳樓", Level: 1, Category: CatMeans, Regions: []string{"HK", "TW"}},
			{Word: "跳楼", Level: 1, Category: CatMeans, Regions: []string{"TW"}},
			{Word: "割脈", Level: 1, Category: CatMeans, Regions: []string{"HK"}},
			{Word: "割腕", Level: 1, Category: CatMeans, Regions: []string{"TW"}},
			{Word: "食安眠藥", Level: 1, Category: CatMeans, Regions: []string{"HK"}},
			{Word: "吃安眠藥", Level: 1, Category: CatMeans, Regions: []string{"TW"}},
			{Word: "食炭", Level: 1, Category: CatMeans, Regions: []string{"HK"}},
			{Word: "燒炭", Level: 1, Category: CatMeans, Regions: []string{"HK", "TW"}},
			{Word: "jump off", Level: 1, Category: CatMeans, Regions: []string{"GB"}},
			{Word: "overdose", Level: 1, Category: CatMeans, Regions: []string{"GB"}},
			{Word: "self-harm", Level: 1, Category: CatSelfHarm, Regions: []string{"GB"}},
			{Word: "hurt myself", Level: 1, Category: CatSelfHarm, Regions: []string{"GB"}},
			{Word: "cut myself", Level: 1, Category: CatSelfHarm, Regions: []string{"GB"}},

			// ═══ Level 2: High risk (requires semantic confirmation) ═══
			// Hopelessness
			{Word: "生存冇意義", Level: 2, Category: CatHopelessness, Regions: []string{"HK"}},
			{Word: "活著沒意義", Level: 2, Category: CatHopelessness, Regions: []string{"TW"}},
			{Word: "唔想再受", Level: 2, Category: CatHopelessness, Regions: []string{"HK"}},
			{Word: "不想再受苦", Level: 2, Category: CatHopelessness, Regions: []string{"TW"}},
			{Word: "冇人關心我", Level: 2, Category: CatHopelessness, Regions: []string{"HK"}},
			{Word: "沒有人在乎我", Level: 2, Category: CatHopelessness, Regions: []string{"TW"}},
			{Word: "我係負累", Level: 2, Category: CatHopelessness, Regions: []string{"HK"}},
			{Word: "我是負擔", Level: 2, Category: CatHopelessness, Regions: []string{"TW"}},
			{Word: "not worth living", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},
			{Word: "no one cares", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},
			{Word: "i'm a burden", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},
			{Word: "can't go on", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},
			{Word: "nothing matters", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},
			{Word: "give up", Level: 2, Category: CatHopelessness, Regions: []string{"GB"}},

			// ═══ Level 3: Pattern matching (requires context analysis) ═══
			// Ideation
			{Word: "寫遺書", Level: 3, Category: CatIdeation, Regions: []string{"HK", "TW"}},
			{Word: "写遗书", Level: 3, Category: CatIdeation, Regions: []string{"TW"}},
			{Word: "安排後事", Level: 3, Category: CatIdeation, Regions: []string{"HK", "TW"}},
			{Word: "安排后事", Level: 3, Category: CatIdeation, Regions: []string{"TW"}},
			{Word: "道別", Level: 3, Category: CatIdeation, Regions: []string{"HK", "TW"}},
			{Word: "最後一次", Level: 3, Category: CatIdeation, Regions: []string{"HK", "TW"}},
			{Word: "say goodbye", Level: 3, Category: CatIdeation, Regions: []string{"GB"}},
			{Word: "last time", Level: 3, Category: CatIdeation, Regions: []string{"GB"}},
			{Word: "suicide note", Level: 3, Category: CatIdeation, Regions: []string{"GB"}},
			{Word: "final letter", Level: 3, Category: CatIdeation, Regions: []string{"GB"}},
		},
		Patterns: buildV2SemanticPatterns(),
	}
}

// MatchV2 performs keyword matching against V2 dictionary
func (km *KeywordMatcher) MatchV2(message string, region types.Region) *KeywordMatcherV2Result {
	km.mu.RLock()
	defer km.mu.RUnlock()

	if km.dictV2 == nil {
		return &KeywordMatcherV2Result{RiskLevel: types.RiskNone}
	}

	lowerMsg := strings.ToLower(message)
	regionStr := string(region)

	var matchedTerms []string
	var categories []string
	maxLevel := 0
	confidence := 0.0

	for _, kw := range km.dictV2.Keywords {
		// Check region applicability
		regionMatch := len(kw.Regions) == 0
		for _, r := range kw.Regions {
			if r == regionStr {
				regionMatch = true
				break
			}
		}
		if !regionMatch {
			continue
		}

		if strings.Contains(lowerMsg, strings.ToLower(kw.Word)) {
			matchedTerms = append(matchedTerms, kw.Word)
			catStr := string(kw.Category)
			if !contains(categories, catStr) {
				categories = append(categories, catStr)
			}
			if kw.Level < maxLevel || maxLevel == 0 {
				maxLevel = kw.Level
			}
			switch kw.Level {
			case 1:
				confidence = max(confidence, 0.95)
			case 2:
				confidence = max(confidence, 0.85)
			case 3:
				confidence = max(confidence, 0.70)
			}
		}
	}

	var riskLevel types.RiskLevel
	switch maxLevel {
	case 1:
		riskLevel = types.RiskCritical
	case 2:
		riskLevel = types.RiskHigh
	case 3:
		riskLevel = types.RiskMedium
	default:
		riskLevel = types.RiskNone
	}

	return &KeywordMatcherV2Result{
		RiskLevel:    riskLevel,
		Confidence:   confidence,
		MatchedTerms: matchedTerms,
		Categories:   categories,
	}
}

// GetDictionaryV2 returns current V2 dictionary for frontend sync
func (km *KeywordMatcher) GetDictionaryV2() *CrisisDictionaryV2 {
	km.mu.RLock()
	defer km.mu.RUnlock()
	return km.dictV2
}

// UpdateDictionaryV2 hot-reloads V2 dictionary (etcd watch)
func (km *KeywordMatcher) UpdateDictionaryV2(dict *CrisisDictionaryV2) {
	km.mu.Lock()
	defer km.mu.Unlock()
	km.dictV2 = dict
}

// --- V2 Semantic Pattern Matcher (15+ patterns, synced with frontend SEMANTIC_PATTERNS) ---

type SemanticPattern struct {
	ID              string        `json:"id"`
	Pattern         string        `json:"pattern"` // regex
	Regions         []string      `json:"regions"`
	Confidence      float64       `json:"confidence"`
	RequiresContext bool          `json:"requires_context"`
	compiled        *regexp.Regexp
}

type SemanticPatternResult struct {
	RiskLevel          types.RiskLevel
	Confidence         float64
	MatchedPatternIDs  []string
}

func buildV2SemanticPatterns() []SemanticPattern {
	patterns := []SemanticPattern{
		// 🇭🇰 Cantonese patterns
		{ID: "hk-hopeless-1", Pattern: `(冇|無).*(意義|意思|希望|將來|出路)`, Regions: []string{"HK"}, Confidence: 0.75, RequiresContext: true},
		{ID: "hk-isolation-1", Pattern: `(冇人|無人).*(陪|理|傾|關心|在乎)`, Regions: []string{"HK"}, Confidence: 0.70, RequiresContext: true},
		{ID: "hk-method-1", Pattern: `(跳|去).*(樓|天台|頂)`, Regions: []string{"HK"}, Confidence: 0.80, RequiresContext: false},
		{ID: "hk-burden-1", Pattern: `(我係|我係個).*(負累|包袱|多餘)`, Regions: []string{"HK"}, Confidence: 0.75, RequiresContext: true},
		{ID: "hk-method-2", Pattern: `(食|吞|食落).*(藥|安眠藥|藥丸)`, Regions: []string{"HK"}, Confidence: 0.80, RequiresContext: false},

		// 🇹🇼 Traditional Chinese patterns
		{ID: "tw-hopeless-1", Pattern: `(沒有|無).*(意義|希望|將來|出路|價值)`, Regions: []string{"TW"}, Confidence: 0.75, RequiresContext: true},
		{ID: "tw-isolation-1", Pattern: `(沒有人|無人).*(陪伴|在乎|關心|理解|傾聽)`, Regions: []string{"TW"}, Confidence: 0.70, RequiresContext: true},
		{ID: "tw-method-1", Pattern: `(跳|去).*(樓|天台|頂|橋)`, Regions: []string{"TW"}, Confidence: 0.80, RequiresContext: false},
		{ID: "tw-burden-1", Pattern: `(我是|我是個).*(負擔|包袱|多餘|累贅)`, Regions: []string{"TW"}, Confidence: 0.75, RequiresContext: true},
		{ID: "tw-method-2", Pattern: `(吃|吞|服用).*(藥|安眠藥|藥丸|過量)`, Regions: []string{"TW"}, Confidence: 0.80, RequiresContext: false},

		// 🇬🇧 British English patterns
		{ID: "gb-hopeless-1", Pattern: `(don't|doesn't|won't).*(matter|care|help|point|hope|future)`, Regions: []string{"GB"}, Confidence: 0.70, RequiresContext: true},
		{ID: "gb-isolation-1", Pattern: `(no one|nobody|alone|lonely).*(cares|understands|listens|notices)`, Regions: []string{"GB"}, Confidence: 0.70, RequiresContext: true},
		{ID: "gb-method-1", Pattern: `(bridge|building|cliff|train|rope|pills|tablets).*(jump|fall|jump off|step|take)`, Regions: []string{"GB"}, Confidence: 0.85, RequiresContext: false},
		{ID: "gb-method-2", Pattern: `(how to|ways to|method to).*(die|end it|kill|finish)`, Regions: []string{"GB"}, Confidence: 0.90, RequiresContext: false},
		{ID: "gb-burden-1", Pattern: `(i'm|i am).*(burden|waste|better off|without me)`, Regions: []string{"GB"}, Confidence: 0.75, RequiresContext: true},
	}

	// Pre-compile regexes
	for i := range patterns {
		compiled, err := regexp.Compile("(?i)" + patterns[i].Pattern)
		if err == nil {
			patterns[i].compiled = compiled
		}
	}

	return patterns
}

// MatchPatterns performs semantic pattern matching (Layer 2)
func (sa *SemanticAnalyzer) MatchPatterns(message string, region types.Region) *SemanticPatternResult {
	sa.mu.RLock()
	defer sa.mu.RUnlock()

	result := &SemanticPatternResult{RiskLevel: types.RiskNone}
	regionStr := string(region)

	for _, p := range sa.patterns {
		if p.compiled == nil {
			continue
		}
		regionMatch := false
		for _, r := range p.Regions {
			if r == regionStr {
				regionMatch = true
				break
			}
		}
		if !regionMatch {
			continue
		}

		if p.compiled.MatchString(message) {
			result.MatchedPatternIDs = append(result.MatchedPatternIDs, p.ID)
			result.Confidence = max(result.Confidence, p.Confidence)

			if !p.RequiresContext {
				// High confidence pattern → upgrade risk
				result.RiskLevel = higherRisk(result.RiskLevel, types.RiskHigh)
			} else {
				// Context-dependent → medium risk baseline
				result.RiskLevel = higherRisk(result.RiskLevel, types.RiskMedium)
			}
		}
	}

	return result
}

// --- Semantic Analyzer (Layer 3) ---

type SemanticAnalyzer struct {
	modelCache map[types.Region]interface{}
	patterns   []SemanticPattern
	mu         sync.RWMutex
}

type SemanticAnalysisResult struct {
	RiskLevel  types.RiskLevel
	Confidence float64
	Signals    []string
}

func NewSemanticAnalyzer() *SemanticAnalyzer {
	return &SemanticAnalyzer{
		modelCache: make(map[types.Region]interface{}),
		patterns:   buildV2SemanticPatterns(),
	}
}

func (sa *SemanticAnalyzer) Analyze(ctx context.Context, message string, history []string, region types.Region) (*SemanticAnalysisResult, error) {
	result := &SemanticAnalysisResult{RiskLevel: types.RiskNone, Confidence: 0.0}

	combined := strings.ToLower(message)
	for _, h := range history {
		combined += " " + strings.ToLower(h)
	}

	escalationIndicators := []string{
		"不需要我", "不再需要", "better off without", "no one would care",
		"don't want to be here", "tired of living", "活著沒意義",
		"nothing matters", "what's the point", "有咩意義",
	}

	negativeCount := 0
	for _, indicator := range escalationIndicators {
		if strings.Contains(combined, indicator) {
			negativeCount++
		}
	}

	if negativeCount >= 3 {
		return &SemanticAnalysisResult{RiskLevel: types.RiskHigh, Confidence: 0.80, Signals: []string{"escalating_negative_pattern"}}, nil
	}
	if negativeCount >= 2 {
		return &SemanticAnalysisResult{RiskLevel: types.RiskMedium, Confidence: 0.70, Signals: []string{"repeated_negative_sentiment"}}, nil
	}
	if negativeCount >= 1 {
		return &SemanticAnalysisResult{RiskLevel: types.RiskLow, Confidence: 0.60, Signals: []string{"negative_sentiment_detected"}}, nil
	}

	return result, nil
}

// --- Intervention ---

type Intervention struct {
	detector *Detector
	eventBus CrisisEventBus
}

func NewIntervention(detector *Detector, eventBus CrisisEventBus) *Intervention {
	return &Intervention{detector: detector, eventBus: eventBus}
}

func (i *Intervention) TriggerCrisisIntervention(ctx context.Context, userID string, sessionID string, region types.Region, result *types.CrisisDetectionResult) error {
	alert := &CrisisAlert{
		UserID: userID, SessionID: sessionID, Region: region,
		RiskLevel: result.RiskLevel, TriggeredBy: result.TriggeredBy,
		Resources: result.LocalCrisisResources, Timestamp: time.Now(),
	}
	return i.eventBus.PublishCrisisAlert(ctx, alert)
}

// SyncDictionaryToFrontend pushes V2 dictionary to frontend via NATS
func (d *Detector) SyncDictionaryToFrontend(ctx context.Context, region types.Region) error {
	dict := d.keywordMatcher.GetDictionaryV2()
	if dict == nil {
		return fmt.Errorf("no V2 dictionary loaded")
	}
	return d.eventBus.PublishDictSync(ctx, region, dict)
}

func IsCrisisPath(result *types.CrisisDetectionResult) bool {
	return result.RiskLevel == types.RiskHigh || result.RiskLevel == types.RiskCritical
}

func ShouldForceIntervention(result *types.CrisisDetectionResult) bool {
	return result.RiskLevel == types.RiskCritical
}

func DegradedModeFallback(region types.Region) *types.CrisisDetectionResult {
	return &types.CrisisDetectionResult{
		RiskLevel: types.RiskHigh, Confidence: 0.5,
		TriggeredBy: "degraded_mode", LocalCrisisResources: types.CrisisHotlines[region],
	}
}

func (d *Detector) HealthCheck(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	if d.keywordMatcher.GetDictionaryV2() == nil {
		return fmt.Errorf("V2 crisis dictionary not loaded")
	}
	return nil
}

// --- Helpers ---

func higherRisk(a, b types.RiskLevel) types.RiskLevel {
	if riskOrder(a) >= riskOrder(b) {
		return a
	}
	return b
}

func riskOrder(r types.RiskLevel) int {
	switch r {
	case types.RiskNone: return 0
	case types.RiskLow: return 1
	case types.RiskMedium: return 2
	case types.RiskHigh: return 3
	case types.RiskCritical: return 4
	}
	return 0
}

func max(a, b float64) float64 {
	if a > b { return a }
	return b
}

func contains(ss []string, s string) bool {
	for _, v := range ss {
		if v == s { return true }
	}
	return false
}
