package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"mindlab/pkg/compliance"
	"mindlab/pkg/crisis"
	"mindlab/pkg/llm"
	"mindlab/pkg/middleware"
	pgstore "mindlab/pkg/store"
	"mindlab/pkg/types"

	ai_companion "mindlab/services/ai-companion"
	user_service "mindlab/services/user-service"
	payment_service "mindlab/services/payment-service"
)
// ============================================================
// In-memory stores (replace with PostgreSQL in production)
// ============================================================
type MemStore struct {
	users     map[string]*types.User
	sessions  map[string]*types.Session
	messages  map[string][]types.Message
	consents  map[string][]types.Consent
	mu        sync.RWMutex
}

var store = &MemStore{
	users:    make(map[string]*types.User),
	sessions: make(map[string]*types.Session),
	messages: make(map[string][]types.Message),
	consents: make(map[string][]types.Consent),
}

// SessionStore impl
func (s *MemStore) GetSession(ctx context.Context, id string) (*types.Session, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	if sess, ok := s.sessions[id]; ok { return sess, nil }
	return nil, fmt.Errorf("session not found")
}
func (s *MemStore) CreateSession(ctx context.Context, sess *types.Session) error {
	s.mu.Lock(); defer s.mu.Unlock()
	s.sessions[sess.ID] = sess; return nil
}
func (s *MemStore) UpdateSessionState(ctx context.Context, id string, state types.SessionState) error {
	s.mu.Lock(); defer s.mu.Unlock()
	if sess, ok := s.sessions[id]; ok { sess.State = state; return nil }
	return fmt.Errorf("session not found")
}
func (s *MemStore) DeleteSession(ctx context.Context, id string) error {
	s.mu.Lock(); defer s.mu.Unlock()
	delete(s.sessions, id); return nil
}

// MessageStore impl
func (s *MemStore) StoreMessage(ctx context.Context, msg *types.Message) error {
	s.mu.Lock(); defer s.mu.Unlock()
	s.messages[msg.SessionID] = append(s.messages[msg.SessionID], *msg); return nil
}
func (s *MemStore) GetMessages(ctx context.Context, sessionID string, limit int) ([]types.Message, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	msgs := s.messages[sessionID]
	if limit > 0 && len(msgs) > limit { msgs = msgs[len(msgs)-limit:] }
	return msgs, nil
}

// ConsentChecker impl
func (s *MemStore) HasConsent(ctx context.Context, userID string, consentType types.ConsentType) (bool, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	// Dev mode: auto-consent when no DB is connected
	if dbStore == nil {
		return true, nil
	}
	for _, c := range s.consents[userID] {
		if c.Type == consentType && c.RevokedAt == nil { return true, nil }
	}
	return false, nil
}
func (s *MemStore) HasDerivedDataConsent(ctx context.Context, userID string, dataType string) (bool, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	// Dev mode: auto-consent when no DB is connected
	if dbStore == nil {
		return true, nil
	}
	for _, c := range s.consents[userID] {
		if c.Type == types.ConsentDerivedData && c.DataType == dataType && c.RevokedAt == nil { return true, nil }
	}
	return false, nil
}

// UserStore impl
func (s *MemStore) CreateUser(ctx context.Context, user *types.User) error {
	s.mu.Lock(); defer s.mu.Unlock()
	s.users[user.ID] = user; return nil
}
func (s *MemStore) GetUser(ctx context.Context, id string) (*types.User, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	if u, ok := s.users[id]; ok { return u, nil }
	return nil, fmt.Errorf("user not found")
}
func (s *MemStore) DeleteUser(ctx context.Context, id string) error {
	s.mu.Lock(); defer s.mu.Unlock()
	delete(s.users, id); return nil
}
func (s *MemStore) HardDeleteUser(ctx context.Context, id string) error { return s.DeleteUser(ctx, id) }
func (s *MemStore) DeleteUserSessions(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserMessages(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserEmotionProfiles(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserConsents(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserPayments(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserFeedback(ctx context.Context, id string) error { return nil }
func (s *MemStore) DeleteUserComplaints(ctx context.Context, id string) error { return nil }
func (s *MemStore) GetDataLocations(ctx context.Context, id string) ([]user_service.DataLocation, error) { return nil, nil }

// ConsentStore impl
func (s *MemStore) RecordConsent(ctx context.Context, c *types.Consent) error {
	s.mu.Lock(); defer s.mu.Unlock()
	s.consents[c.UserID] = append(s.consents[c.UserID], *c); return nil
}
func (s *MemStore) RevokeConsent(ctx context.Context, userID string, ct types.ConsentType) error {
	s.mu.Lock(); defer s.mu.Unlock()
	now := time.Now()
	for i, c := range s.consents[userID] {
		if c.Type == ct && c.RevokedAt == nil { s.consents[userID][i].RevokedAt = &now; return nil }
	}
	return fmt.Errorf("consent not found")
}
func (s *MemStore) GetConsents(ctx context.Context, userID string) ([]types.Consent, error) {
	s.mu.RLock(); defer s.mu.RUnlock()
	return s.consents[userID], nil
}

// ============================================================
// Global services
// ============================================================
var (
	aiEngine    *ai_companion.AICompanionEngine
	userSvc     *user_service.UserService
	crisisDet   *crisis.Detector
	complianceSvc *compliance.Service
	llmClient    *llm.Client
	dbStore      *pgstore.PostgresStore
	paymentSvc   *payment_service.PaymentService
	auditMW     *middleware.AuditMiddleware
	logger      *slog.Logger
)

func main() {
	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	// Init services
	auditMW = middleware.NewAuditMiddleware(logger)
	complianceSvc = compliance.NewService(compliance.NewAuditLogger())
	crisisDet = crisis.NewDetector(nil) // eventBus=nil for now
	llmClient = llm.NewClient(nil) // uses env vars: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL

	// Try PostgreSQL connection, fallback to in-memory store
	// Support both DATABASE_URL (Railway) and individual DB_* vars
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		dbHost := os.Getenv("DB_HOST")
		if dbHost != "" {
			connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
				dbHost,
				os.Getenv("DB_PORT"),
				os.Getenv("DB_USER"),
				os.Getenv("DB_PASSWORD"),
				os.Getenv("DB_NAME"),
			)
		}
	}
	if connStr != "" {
		pgStore, err := pgstore.NewPostgresStore(connStr)
		if err != nil {
			logger.Warn("postgres_connect_failed", "error", err, "msg", "falling back to in-memory store")
		} else {
			dbStore = pgStore
			logger.Info("postgres_connected")
		}
	}

	// Use PostgresStore if available, otherwise MemStore
	var sessionStore ai_companion.SessionStore = store
	var messageStore ai_companion.MessageStore = store
	var consentChecker ai_companion.ConsentChecker = store
	if dbStore != nil {
		sessionStore = dbStore
		messageStore = dbStore
		consentChecker = dbStore
	}

	aiEngine = ai_companion.NewAICompanionEngine(
		crisisDet, complianceSvc,
		sessionStore, messageStore, consentChecker,
		llmClient,
		logger,
	)

	userSvc = user_service.NewUserService(
		store, store, nil, // userStore, consentStore, eventBus=nil
		nil, // encryptor=nil for dev
		logger,
	)

	// Init payment service with Stripe adapter
	stripeAdapter := payment_service.NewStripeAdapter()
	paymentSvc = payment_service.NewPaymentService(
		map[types.Region]payment_service.PaymentAdapter{
			types.RegionHK: stripeAdapter,
			types.RegionTW: stripeAdapter,
			types.RegionGB: stripeAdapter,
		},
		nil, // subscription manager (placeholder)
		nil, // reconciler (placeholder)
		logger,
	)

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }

	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status":"ok"})
	})

	// ============================================================
	// Auth routes
	// ============================================================
	mux.HandleFunc("/api/v1/auth/register", corsMiddleware(handleRegister))
	mux.HandleFunc("/api/v1/auth/login", corsMiddleware(handleLogin))

	// ============================================================
	// User routes
	// ============================================================
	mux.HandleFunc("/api/v1/users/", corsMiddleware(handleUsers))
	mux.HandleFunc("/api/v1/users", corsMiddleware(handleUsers))

	// ============================================================
	// Session & Chat routes
	// ============================================================
	mux.HandleFunc("/api/v1/sessions", corsMiddleware(handleSessions))
	mux.HandleFunc("/api/v1/sessions/", corsMiddleware(handleSessionByID))
	mux.HandleFunc("/api/v1/chat/companion", corsMiddleware(handleCompanionChat))

	// ============================================================
	// Consent routes
	// ============================================================
	mux.HandleFunc("/api/v1/consents", corsMiddleware(handleConsents))

	// ============================================================
	// Milestones routes
	// ============================================================
	mux.HandleFunc("/api/v1/milestones", corsMiddleware(handleMilestones))
	mux.HandleFunc("/api/v1/milestones/", corsMiddleware(handleMilestoneByID))

	// ============================================================
	// Appointments routes
	// ============================================================
	mux.HandleFunc("/api/v1/appointments", corsMiddleware(handleAppointments))

	// ============================================================
	// Payments routes
	// ============================================================
	mux.HandleFunc("/api/v1/payments/", corsMiddleware(handlePayments))

	// ============================================================
	// Skins routes
	// ============================================================
	mux.HandleFunc("/api/v1/skins/", corsMiddleware(handleSkins))

	srv := &http.Server{
		Addr: ":" + port, Handler: mux,
		ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second,
	}

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}()

	log.Printf("Mindlab API starting on :%s", port)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

// ============================================================
// HTTP Handlers
// ============================================================

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost { writeError(w, 405, "METHOD_001", "method not allowed"); return }
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Region   string `json:"region"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
	if req.Email == "" || req.Password == "" { writeError(w, 400, "VALID_001", "email and password required"); return }

	region := types.RegionHK
	if req.Region == "TW" { region = types.RegionTW } else if req.Region == "GB" { region = types.RegionGB }

	var userID string
	if dbStore != nil {
		// Write to PostgreSQL
		user := &types.User{
			ID: fmt.Sprintf("u-%d", time.Now().UnixNano()),
			Region: region, Email: req.Email, DisplayName: req.Name,
			Subscription: types.TierAIFree, CreatedAt: time.Now(),
		}
		if err := dbStore.CreateUser(r.Context(), user); err != nil { logger.Error("register_db_failed", "error", err); writeError(w, 500, "REG_001", err.Error()); return }
		userID = user.ID
		// Auto-grant consent in PostgreSQL
		if err := dbStore.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: userID,
			Type: types.ConsentTermsOfService, Version: "v1", GrantedAt: time.Now(),
		}); err != nil {
			logger.Error("consent_create_failed", "error", err)
		}
		if err := dbStore.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: userID,
			Type: types.ConsentSensitiveData, Version: "v1", GrantedAt: time.Now(),
		}); err != nil {
			logger.Error("consent_create_failed", "error", err)
		}
		logger.Info("user_registered", "user_id", userID, "region", region, "minor", false)
	} else {
		user, err := userSvc.Register(r.Context(), req.Email, region, 18, req.Password)
		if err != nil { writeError(w, 500, "REG_001", err.Error()); return }
		userID = user.ID
		// Auto-grant consent in MemStore
		store.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: userID,
			Type: types.ConsentTermsOfService, Version: "v1", GrantedAt: time.Now(),
		})
		store.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: userID,
			Type: types.ConsentSensitiveData, Version: "v1", GrantedAt: time.Now(),
		})
	}

	writeJSON(w, 201, map[string]interface{}{
		"user_id": userID, "token": "dev-token-" + userID, "region": region,
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost { writeError(w, 405, "METHOD_001", "method not allowed"); return }
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }

	// Dev mode: accept any email, create user if not exists
	store.mu.RLock()
	var found *types.User
	for _, u := range store.users {
		if u.Email == req.Email { found = u; break }
	}
	store.mu.RUnlock()

	if found == nil {
		// Auto-register in dev mode
		user, _ := userSvc.Register(r.Context(), req.Email, types.RegionHK, 18, req.Password)
		store.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: user.ID,
			Type: types.ConsentTermsOfService, Version: "v1", GrantedAt: time.Now(),
		})
		store.RecordConsent(r.Context(), &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: user.ID,
			Type: types.ConsentSensitiveData, Version: "v1", GrantedAt: time.Now(),
		})
		writeJSON(w, 200, map[string]interface{}{
			"user_id": user.ID, "token": "dev-token-" + user.ID, "region": "HK",
		})
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"user_id": found.ID, "token": "dev-token-" + found.ID, "region": found.Region,
	})
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	userID := extractUserID(r)
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/users/"), "/")

	switch r.Method {
	case http.MethodGet:
		// GET /api/v1/users or /api/v1/users/:id
		targetID := userID
		if len(parts) > 0 && parts[0] != "" { targetID = parts[0] }
		user, err := store.GetUser(r.Context(), targetID)
		if err != nil { writeError(w, 404, "USER_001", "user not found"); return }
		writeJSON(w, 200, user)
	case http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		user, err := store.GetUser(r.Context(), userID)
		if err != nil { writeError(w, 404, "USER_001", "user not found"); return }
		if v, ok := patch["language_preference"]; ok { user.DisplayName = fmt.Sprint(v) }
		writeJSON(w, 200, user)
	case http.MethodPost:
		var data types.User
		if err := json.NewDecoder(r.Body).Decode(&data); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		data.ID = fmt.Sprintf("u-%d", time.Now().UnixNano())
		data.CreatedAt = time.Now()
		store.CreateUser(r.Context(), &data)
		writeJSON(w, 201, data)
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleSessions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		userID := r.URL.Query().Get("user_id")
		if userID == "" { writeError(w, 400, "VALID_001", "user_id required"); return }
		store.mu.RLock()
		var sessions []types.Session
		for _, s := range store.sessions {
			if s.UserID == userID { sessions = append(sessions, *s) }
		}
		store.mu.RUnlock()
		if sessions == nil { sessions = []types.Session{} }
		writeJSON(w, 200, sessions)
	case http.MethodPost:
		var req struct {
			UserID string `json:"user_id"`
			Region string `json:"region"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		region := types.RegionHK
		if req.Region == "TW" { region = types.RegionTW } else if req.Region == "GB" { region = types.RegionGB }
		session, err := aiEngine.CreateSession(r.Context(), req.UserID, region)
		if err != nil { writeError(w, 500, "SESSION_001", err.Error()); return }
		writeJSON(w, 201, session)
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleSessionByID(w http.ResponseWriter, r *http.Request) {
	sessionID := strings.TrimPrefix(r.URL.Path, "/api/v1/sessions/")
	if sessionID == "" || sessionID == "/" { writeError(w, 400, "VALID_001", "session_id required"); return }
	sessionID = strings.TrimSuffix(sessionID, "/")

	// Check if it's a messages sub-route
	if strings.Contains(sessionID, "/messages") {
		sid := strings.TrimSuffix(strings.Split(sessionID, "/messages")[0], "/")
		handleMessages(w, r, sid)
		return
	}

	switch r.Method {
	case http.MethodGet:
		sess, err := store.GetSession(r.Context(), sessionID)
		if err != nil { writeError(w, 404, "SESSION_002", "session not found"); return }
		writeJSON(w, 200, sess)
	case http.MethodDelete:
		store.DeleteSession(r.Context(), sessionID)
		writeJSON(w, 200, map[string]string{"status":"deleted"})
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleMessages(w http.ResponseWriter, r *http.Request, sessionID string) {
	switch r.Method {
	case http.MethodPost:
		var req struct {
			Message string `json:"message"`
			Region  string `json:"region"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		region := types.RegionHK
		if req.Region == "TW" { region = types.RegionTW } else if req.Region == "GB" { region = types.RegionGB }

		result, err := aiEngine.SendMessage(r.Context(), sessionID, "", req.Message, region)
		if err != nil { writeError(w, 500, "CHAT_001", err.Error()); return }
		writeJSON(w, 200, result)
	case http.MethodGet:
		msgs, _ := store.GetMessages(r.Context(), sessionID, 50)
		if msgs == nil { msgs = []types.Message{} }
		writeJSON(w, 200, msgs)
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleCompanionChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost { writeError(w, 405, "METHOD_001", "method not allowed"); return }
	var req struct {
		SessionID string `json:"session_id"`
		UserID    string `json:"user_id"`
		Message   string `json:"message"`
		Region    string `json:"region"`
		Language  string `json:"language"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }

	region := types.RegionHK
	if req.Region == "TW" { region = types.RegionTW } else if req.Region == "GB" { region = types.RegionGB }

	// Auto-create session if needed
	if req.SessionID == "" {
		session, err := aiEngine.CreateSession(r.Context(), req.UserID, region)
		if err != nil { writeError(w, 500, "SESSION_001", err.Error()); return }
		req.SessionID = session.ID
	}

	result, err := aiEngine.SendMessage(r.Context(), req.SessionID, req.UserID, req.Message, region)
	if err != nil { writeError(w, 500, "CHAT_001", err.Error()); return }

	writeJSON(w, 200, result)
}

func handleConsents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var req struct {
			UserID      string `json:"user_id"`
			ConsentType string `json:"consent_type"`
			Granted     bool   `json:"granted"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		ct := types.ConsentType(req.ConsentType)
		c := &types.Consent{
			ID: fmt.Sprintf("c-%d", time.Now().UnixNano()), UserID: req.UserID,
			Type: ct, Version: "v1", GrantedAt: time.Now(),
		}
		if dbStore != nil {
			dbStore.RecordConsent(r.Context(), c)
		} else {
			store.RecordConsent(r.Context(), c)
		}
		writeJSON(w, 201, c)
	case http.MethodGet:
		userID := r.URL.Query().Get("user_id")
		var consents []types.Consent
		if dbStore != nil {
			consents, _ = dbStore.GetConsents(r.Context(), userID)
		} else {
			consents, _ = store.GetConsents(r.Context(), userID)
		}
		if consents == nil { consents = []types.Consent{} }
		writeJSON(w, 200, consents)
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleMilestones(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, 200, []interface{}{})
	case http.MethodPost:
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)
		writeJSON(w, 201, map[string]interface{}{
			"id": fmt.Sprintf("m-%d", time.Now().UnixNano()), "milestones": []string{},
		})
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleMilestoneByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/milestones/")
	if strings.Contains(id, "generate") {
		writeJSON(w, 200, map[string]interface{}{"milestones": []string{}})
		return
	}
	switch r.Method {
	case http.MethodPatch:
		writeJSON(w, 200, map[string]string{"status":"updated","id":id})
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handleAppointments(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, 200, []interface{}{})
	case http.MethodPost:
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)
		writeJSON(w, 201, map[string]interface{}{
			"id": fmt.Sprintf("a-%d", time.Now().UnixNano()), "status": "pending",
		})
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

func handlePayments(w http.ResponseWriter, r *http.Request) {
	action := strings.TrimPrefix(r.URL.Path, "/api/v1/payments/")
	switch {
	case strings.Contains(action, "subscribe"):
		if r.Method != http.MethodPost { writeError(w, 405, "METHOD_001", "method not allowed"); return }
		var req struct {
			PlanID     string `json:"planId"`
			UserID     string `json:"userId"`
			SuccessURL string `json:"successUrl"`
			CancelURL  string `json:"cancelUrl"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		result, err := paymentSvc.Checkout(r.Context(), &payment_service.PaymentRequest{
			UserID:      req.UserID,
			Region:      types.RegionHK,
			Amount:      88.00,
			Method:      "stripe",
			Tier:        types.TierAIPlus,
			Description: req.PlanID,
		})
		if err != nil { writeError(w, 500, "PAY_001", err.Error()); return }
		writeJSON(w, 200, result)
	case strings.Contains(action, "verify"):
		if r.Method != http.MethodPost { writeError(w, 405, "METHOD_001", "method not allowed"); return }
		var req struct {
			SessionID string `json:"sessionId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil { writeError(w, 400, "PARSE_001", "invalid body"); return }
		status, err := paymentSvc.Checkout(r.Context(), &payment_service.PaymentRequest{
			UserID: "verify", Region: types.RegionHK, Amount: 0, Method: "stripe",
		})
		if err != nil { writeError(w, 500, "PAY_002", err.Error()); return }
		_ = status
		writeJSON(w, 200, map[string]interface{}{"ok": true, "plus_active": true, "plan_id": "companion_monthly"})
	case strings.Contains(action, "skin"):
		writeJSON(w, 200, map[string]interface{}{"ok": true})
	default:
		writeError(w, 404, "NOT_FOUND", "payment endpoint not found")
	}
}

func handleSkins(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		writeJSON(w, 201, map[string]string{"status":"unlocked"})
	default:
		writeError(w, 405, "METHOD_001", "method not allowed")
	}
}

// ============================================================
// Helpers
// ============================================================

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]interface{}{
		"error": map[string]string{"code": code, "message": msg},
	})
}

func extractUserID(r *http.Request) string {
	// In dev mode, extract from URL or use default
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/users/"), "/")
	if len(parts) > 0 && parts[0] != "" { return parts[0] }
	return "dev-user"
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Region, X-Anonymous-Token")
		if r.Method == http.MethodOptions { w.WriteHeader(204); return }
		next(w, r)
	}
}

