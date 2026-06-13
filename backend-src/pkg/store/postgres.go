package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"mindlab/pkg/types"

	_ "github.com/lib/pq"
)

// PostgresStore implements all store interfaces using PostgreSQL
type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(connStr string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("db open: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db ping: %w", err)
	}
	return &PostgresStore{db: db}, nil
}

func (s *PostgresStore) Close() error {
	return s.db.Close()
}

// --- UserStore ---

func (s *PostgresStore) CreateUser(ctx context.Context, user *types.User) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO users (id, region, email, display_name, minor_flag, subscription, password_hash, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, user.ID, user.Region, user.Email, user.DisplayName, user.MinorFlag, user.Subscription, "dev-hash", user.CreatedAt)
	return err
}

func (s *PostgresStore) GetUser(ctx context.Context, id string) (*types.User, error) {
	u := &types.User{}
	err := s.db.QueryRowContext(ctx, `
		SELECT id, region, email, display_name, minor_flag, subscription, created_at
		FROM users WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(&u.ID, &u.Region, &u.Email, &u.DisplayName, &u.MinorFlag, &u.Subscription, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (s *PostgresStore) UpdateUser(ctx context.Context, user *types.User) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE users SET display_name=$2, subscription=$3, updated_at=NOW()
		WHERE id=$1 AND deleted_at IS NULL
	`, user.ID, user.DisplayName, user.Subscription)
	return err
}

func (s *PostgresStore) DeleteUser(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE users SET deleted_at=NOW() WHERE id=$1`, id)
	return err
}

// --- SessionStore ---

func (s *PostgresStore) GetSession(ctx context.Context, id string) (*types.Session, error) {
	sess := &types.Session{}
	var counselorID sql.NullString
	var endedAt sql.NullTime
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, state, region, counselor_id, created_at, ended_at
		FROM sessions WHERE id = $1
	`, id).Scan(&sess.ID, &sess.UserID, &sess.State, &sess.Region, &counselorID, &sess.CreatedAt, &endedAt)
	if err != nil {
		return nil, err
	}
	if counselorID.Valid {
		sess.CounselorID = &counselorID.String
	}
	if endedAt.Valid {
		sess.EndedAt = &endedAt.Time
	}
	return sess, nil
}

func (s *PostgresStore) CreateSession(ctx context.Context, sess *types.Session) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, state, region, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, sess.ID, sess.UserID, sess.State, sess.Region, sess.CreatedAt)
	return err
}

func (s *PostgresStore) UpdateSessionState(ctx context.Context, id string, state types.SessionState) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE sessions SET state=$2 WHERE id=$1
	`, id, state)
	return err
}

func (s *PostgresStore) DeleteSession(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE sessions SET ended_at=NOW() WHERE id=$1`, id)
	return err
}

// --- MessageStore ---

func (s *PostgresStore) StoreMessage(ctx context.Context, msg *types.Message) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO messages (id, session_id, role, content, risk_level, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, msg.ID, msg.SessionID, msg.Role, msg.Content, msg.RiskLevel, msg.CreatedAt)
	return err
}

func (s *PostgresStore) GetMessages(ctx context.Context, sessionID string, limit int) ([]types.Message, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, session_id, role, content, risk_level, created_at
		FROM messages WHERE session_id = $1
		ORDER BY created_at DESC LIMIT $2
	`, sessionID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []types.Message
	for rows.Next() {
		var m types.Message
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &m.RiskLevel, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

// --- ConsentChecker ---

func (s *PostgresStore) HasConsent(ctx context.Context, userID string, consentType types.ConsentType) (bool, error) {
	var count int
	err := s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM consents
		WHERE user_id=$1 AND type=$2 AND revoked_at IS NULL
	`, userID, consentType).Scan(&count)
	return count > 0, err
}

func (s *PostgresStore) HasDerivedDataConsent(ctx context.Context, userID string, dataType string) (bool, error) {
	var count int
	err := s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM consents
		WHERE user_id=$1 AND type='derived_data' AND data_type=$2 AND revoked_at IS NULL
	`, userID, dataType).Scan(&count)
	return count > 0, err
}

func (s *PostgresStore) RecordConsent(ctx context.Context, c *types.Consent) error {
	ip := c.IPAddress
	if ip == "" {
		ip = "127.0.0.1"
	}
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO consents (id, user_id, type, data_type, granted_at, version, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, c.ID, c.UserID, c.Type, c.DataType, c.GrantedAt, c.Version, ip, c.UserAgent)
	return err
}

func (s *PostgresStore) GetConsents(ctx context.Context, userID string) ([]types.Consent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, user_id, type, data_type, granted_at, revoked_at, version, ip_address, user_agent
		FROM consents WHERE user_id=$1 ORDER BY granted_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var consents []types.Consent
	for rows.Next() {
		var c types.Consent
		var revokedAt sql.NullTime
		if err := rows.Scan(&c.ID, &c.UserID, &c.Type, &c.DataType, &c.GrantedAt, &revokedAt, &c.Version, &c.IPAddress, &c.UserAgent); err != nil {
			return nil, err
		}
		if revokedAt.Valid {
			c.RevokedAt = &revokedAt.Time
		}
		consents = append(consents, c)
	}
	return consents, nil
}
