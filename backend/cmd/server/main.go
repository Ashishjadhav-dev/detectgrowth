package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/bcrypt"
)

type Company struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Domain        string    `json:"domain"`
	Industry      string    `json:"industry"`
	Location      string    `json:"location"`
	EmployeeRange string    `json:"employeeRange"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type apiResponse struct {
	Data any            `json:"data,omitempty"`
	Meta map[string]any `json:"meta,omitempty"`
}

type apiError struct {
	Error apiErrorBody  `json:"error"`
	Meta  map[string]any `json:"meta,omitempty"`
}

type apiErrorBody struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Fields  map[string]any `json:"fields,omitempty"`
}

type app struct {
	db          *sql.DB
	workspaceID string
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := envOr("DATABASE_URL", "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable")
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	workspaceID, err := ensureWorkspace(ctx, db)
	if err != nil {
		log.Fatalf("initialize workspace: %v", err)
	}
	api := &app{db: db, workspaceID: workspaceID}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", healthHandler)
	mux.HandleFunc("POST /api/v1/auth/sign-up", api.signUp)
	mux.HandleFunc("POST /api/v1/auth/sign-in", api.signIn)
	mux.HandleFunc("POST /api/v1/auth/sign-out", api.signOut)
	mux.HandleFunc("GET /api/v1/me", api.me)
	mux.HandleFunc("GET /api/v1/research", api.research)
	mux.HandleFunc("GET /api/v1/settings/icp", api.getICP)
	mux.HandleFunc("PATCH /api/v1/settings/icp", api.updateICP)
	mux.HandleFunc("GET /api/v1/integrations", api.listIntegrations)
	mux.HandleFunc("PATCH /api/v1/integrations/{provider}", api.updateIntegration)
	mux.HandleFunc("GET /api/v1/events", api.events)
	mux.HandleFunc("GET /api/v1/companies", api.listCompanies)
	mux.HandleFunc("POST /api/v1/companies", api.createCompany)
	mux.HandleFunc("GET /api/v1/companies/{companyID}", api.getCompany)
	mux.HandleFunc("PATCH /api/v1/companies/{companyID}", api.updateCompany)
	mux.HandleFunc("DELETE /api/v1/companies/{companyID}", api.deleteCompany)
	mux.HandleFunc("GET /api/v1/people", api.listPeople)
	mux.HandleFunc("POST /api/v1/people", api.createPerson)
	mux.HandleFunc("PATCH /api/v1/people/{personID}", api.updatePerson)
	mux.HandleFunc("DELETE /api/v1/people/{personID}", api.deletePerson)
	mux.HandleFunc("GET /api/v1/signals", api.listSignals)
	mux.HandleFunc("POST /api/v1/signals", api.createSignal)
	mux.HandleFunc("PATCH /api/v1/signals/{signalID}", api.updateSignal)
	mux.HandleFunc("DELETE /api/v1/signals/{signalID}", api.deleteSignal)
	mux.HandleFunc("GET /api/v1/opportunities", api.listOpportunities)
	mux.HandleFunc("POST /api/v1/opportunities", api.createOpportunity)
	mux.HandleFunc("GET /api/v1/opportunities/{opportunityID}", api.getOpportunity)
	mux.HandleFunc("PATCH /api/v1/opportunities/{opportunityID}", api.updateOpportunity)
	mux.HandleFunc("DELETE /api/v1/opportunities/{opportunityID}", api.deleteOpportunity)
	mux.HandleFunc("GET /api/v1/lists", api.listLists)
	mux.HandleFunc("POST /api/v1/lists", api.createList)
	mux.HandleFunc("GET /api/v1/dashboard/summary", api.dashboardSummaryHandler)
	mux.HandleFunc("GET /api/v1/dashboard/insights", api.dashboardInsightsHandler)
	mux.HandleFunc("GET /api/v1/dashboard/tasks", api.dashboardTasksHandler)
	mux.HandleFunc("PATCH /api/v1/dashboard/tasks/{taskID}", api.updateDashboardTaskHandler)
	mux.HandleFunc("GET /api/v1/dashboard/activity", api.dashboardActivityHandler)
	mux.HandleFunc("GET /api/v1/dashboard/signals", api.dashboardSignalsHandler)
	mux.HandleFunc("GET /api/v1/dashboard/opportunities", api.dashboardOpportunitiesHandler)
	mux.HandleFunc("GET /api/v1/dashboard/watchlist", api.dashboardWatchlistHandler)
	mux.HandleFunc("GET /api/v1/dashboard/pipeline", api.dashboardPipelineHandler)
	mux.HandleFunc("GET /api/v1/dashboard/trending", api.dashboardTrendingHandler)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           withMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("DetectGrowth API listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}

type authUser struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Workspace map[string]any `json:"workspace"`
}

func (a *app) signUp(w http.ResponseWriter, r *http.Request) {
	var input struct { Name string `json:"name"`; Email string `json:"email"`; Password string `json:"password"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Email) == "" || len(input.Password) < 8 {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Name, email, and a password of at least 8 characters are required."); return
	}
	email := strings.ToLower(strings.TrimSpace(input.Email))
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "AUTH_ERROR", "Unable to create account."); return }
	tx, err := a.db.BeginTx(r.Context(), nil)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create account."); return }
	defer tx.Rollback()
	var userID string
	err = tx.QueryRowContext(r.Context(), `INSERT INTO users (email, name, password_hash, email_verified_at) VALUES ($1, $2, $3, now()) RETURNING id::text`, email, strings.TrimSpace(input.Name), string(hash)).Scan(&userID)
	if err != nil { writeError(w, r, http.StatusConflict, "EMAIL_IN_USE", "An account with this email already exists."); return }
	slug := "workspace-" + randomSuffix()
	var workspaceID, workspaceName string
	err = tx.QueryRowContext(r.Context(), `INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id::text, name`, strings.TrimSpace(input.Name)+"'s Workspace", slug).Scan(&workspaceID, &workspaceName)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create workspace."); return }
	var roleID string
	err = tx.QueryRowContext(r.Context(), `INSERT INTO roles (workspace_id, name, is_system) VALUES ($1, 'owner', true) RETURNING id::text`, workspaceID).Scan(&roleID)
	if err == nil { _, err = tx.ExecContext(r.Context(), `INSERT INTO workspace_memberships (workspace_id, user_id, role_id) VALUES ($1, $2, $3)`, workspaceID, userID, roleID) }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to initialize workspace."); return }
	token, tokenHash, err := newSessionToken()
	if err == nil { _, err = tx.ExecContext(r.Context(), `INSERT INTO sessions (user_id, workspace_id, token_hash, expires_at) VALUES ($1, $2, $3, now() + interval '30 days')`, userID, workspaceID, tokenHash) }
	if err != nil || tx.Commit() != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to start session."); return }
	setSessionCookie(w, token)
	writeJSON(w, http.StatusCreated, apiResponse{Data: authUser{ID: userID, Email: email, Name: strings.TrimSpace(input.Name), Workspace: map[string]any{"id": workspaceID, "name": workspaceName}}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) signIn(w http.ResponseWriter, r *http.Request) {
	var input struct { Email string `json:"email"`; Password string `json:"password"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Email) == "" || input.Password == "" { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Email and password are required."); return }
	var userID, email, name, passwordHash, workspaceID, workspaceName string
	err := a.db.QueryRowContext(r.Context(), `SELECT u.id::text, u.email, u.name, u.password_hash, wm.workspace_id::text, w.name FROM users u JOIN workspace_memberships wm ON wm.user_id = u.id JOIN workspaces w ON w.id = wm.workspace_id WHERE lower(u.email) = lower($1) AND u.status = 'active' ORDER BY wm.created_at LIMIT 1`, strings.TrimSpace(input.Email)).Scan(&userID, &email, &name, &passwordHash, &workspaceID, &workspaceName)
	if errors.Is(err, sql.ErrNoRows) || passwordHash == "" || bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)) != nil { writeError(w, r, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password."); return }
	token, tokenHash, err := newSessionToken()
	if err != nil || func() error { _, e := a.db.ExecContext(r.Context(), `INSERT INTO sessions (user_id, workspace_id, token_hash, expires_at) VALUES ($1, $2, $3, now() + interval '30 days')`, userID, workspaceID, tokenHash); return e }() != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to start session."); return }
	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, apiResponse{Data: authUser{ID: userID, Email: email, Name: name, Workspace: map[string]any{"id": workspaceID, "name": workspaceName}}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) signOut(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("detectgrowth_session"); err == nil { _, _ = a.db.ExecContext(r.Context(), `DELETE FROM sessions WHERE token_hash = $1`, hashToken(cookie.Value)) }
	http.SetCookie(w, &http.Cookie{Name: "detectgrowth_session", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]bool{"signedOut": true}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) me(w http.ResponseWriter, r *http.Request) {
	user, err := a.sessionUser(r)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in is required."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load session."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: user, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) sessionUser(r *http.Request) (authUser, error) {
	cookie, err := r.Cookie("detectgrowth_session"); if err != nil { return authUser{}, sql.ErrNoRows }
	var user authUser; var workspaceID, workspaceName string
	err = a.db.QueryRowContext(r.Context(), `SELECT u.id::text, u.email, u.name, s.workspace_id::text, w.name FROM sessions s JOIN users u ON u.id = s.user_id JOIN workspaces w ON w.id = s.workspace_id WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active'`, hashToken(cookie.Value)).Scan(&user.ID, &user.Email, &user.Name, &workspaceID, &workspaceName)
	user.Workspace = map[string]any{"id": workspaceID, "name": workspaceName}; return user, err
}

func (a *app) workspaceIDFor(r *http.Request) string {
	if user, err := a.sessionUser(r); err == nil {
		if id, ok := user.Workspace["id"].(string); ok && id != "" { return id }
	}
	return a.workspaceID
}

func newSessionToken() (string, string, error) { b := make([]byte, 32); if _, err := rand.Read(b); err != nil { return "", "", err }; token := fmt.Sprintf("%x", b); return token, hashToken(token), nil }
func hashToken(token string) string { sum := sha256.Sum256([]byte(token)); return fmt.Sprintf("%x", sum[:]) }
func randomSuffix() string { b := make([]byte, 6); if _, err := rand.Read(b); err != nil { return strconv.FormatInt(time.Now().UnixNano(), 10) }; return fmt.Sprintf("%x", b) }
func setSessionCookie(w http.ResponseWriter, token string) { http.SetCookie(w, &http.Cookie{Name: "detectgrowth_session", Value: token, Path: "/", MaxAge: 60 * 60 * 24 * 30, HttpOnly: true, SameSite: http.SameSiteLaxMode}) }

func ensureWorkspace(ctx context.Context, db *sql.DB) (string, error) {
	var id string
	err := db.QueryRowContext(ctx, `SELECT id::text FROM workspaces ORDER BY created_at LIMIT 1`).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		err = db.QueryRowContext(ctx, `INSERT INTO workspaces (name, slug) VALUES ('DetectGrowth Local', 'detectgrowth-local') RETURNING id::text`).Scan(&id)
	}
	return id, err
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: map[string]string{"status": "ok", "service": "detectgrowth-api"},
		Meta: map[string]any{"requestId": requestID(r)},
	})
}

func (a *app) dashboardSummaryHandler(w http.ResponseWriter, r *http.Request) {
	var companies, people, signals, opportunities int
	var pipelineValue, averageScore float64
	err := a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM companies WHERE workspace_id = $1`, a.workspaceIDFor(r)).Scan(&companies)
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM people WHERE workspace_id = $1`, a.workspaceIDFor(r)).Scan(&people)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM signals WHERE workspace_id = $1`, a.workspaceIDFor(r)).Scan(&signals)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM opportunities WHERE workspace_id = $1`, a.workspaceIDFor(r)).Scan(&opportunities)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COALESCE(SUM(expected_value), 0), COALESCE(AVG(score), 0) FROM opportunities WHERE workspace_id = $1 AND status = 'open'`, a.workspaceIDFor(r)).Scan(&pipelineValue, &averageScore)
	}
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load dashboard summary.")
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{
		Data: map[string]string{
			"newOpportunities":   strconv.Itoa(opportunities),
			"companiesSurging":    strconv.Itoa(companies),
			"newSignals":         strconv.Itoa(signals),
			"peopleDiscovered":   strconv.Itoa(people),
			"pipelineValue":      "$" + formatCurrency(pipelineValue),
			"averageGrowthScore": strconv.Itoa(int(averageScore + 0.5)),
			"growthDelta":        "0%",
		},
		Meta: map[string]any{"requestId": requestID(r), "workspaceId": a.workspaceIDFor(r)},
	})
}

func (a *app) research(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "A company name or domain is required."); return }
	var company Company
	err := a.db.QueryRowContext(r.Context(), `SELECT id::text, name, COALESCE(domain, ''), COALESCE(industry, ''), COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at FROM companies WHERE workspace_id = $1 AND (name ILIKE $2 OR COALESCE(domain, '') ILIKE $2) ORDER BY updated_at DESC LIMIT 1`, a.workspaceIDFor(r), "%"+query+"%").Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "No matching company exists in this workspace."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load research subject."); return }
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(detected_at, created_at), COALESCE(confidence, 0), COALESCE(source_url, '') FROM signals WHERE workspace_id = $1 AND company_id = $2 ORDER BY COALESCE(detected_at, created_at) DESC LIMIT 20`, a.workspaceIDFor(r), company.ID)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load research evidence."); return }
	defer rows.Close(); evidence := make([]map[string]any, 0)
	for rows.Next() { var id, title, description, impact, sourceURL string; var detected time.Time; var confidence float64; if err := rows.Scan(&id, &title, &description, &impact, &detected, &confidence, &sourceURL); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read research evidence."); return }; evidence = append(evidence, map[string]any{"id": id, "title": title, "description": description, "impact": impact, "detectedAt": detected.Format(time.RFC3339), "confidence": confidence, "sourceUrl": sourceURL}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"company": company, "evidence": evidence, "generatedAt": time.Now().UTC().Format(time.RFC3339)}, Meta: map[string]any{"requestId": requestID(r), "source": "workspace PostgreSQL records"}})
}

func (a *app) events(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok { writeError(w, r, http.StatusInternalServerError, "STREAM_UNAVAILABLE", "Live events are unavailable."); return }
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	workspaceID := a.workspaceIDFor(r); lastSignature := ""
	ticker := time.NewTicker(5 * time.Second); defer ticker.Stop()
	for {
		signature := ""
		err := a.db.QueryRowContext(r.Context(), `SELECT CONCAT((SELECT COUNT(*) FROM companies WHERE workspace_id = $1), ':', (SELECT COUNT(*) FROM people WHERE workspace_id = $1), ':', (SELECT COUNT(*) FROM signals WHERE workspace_id = $1), ':', (SELECT COUNT(*) FROM opportunities WHERE workspace_id = $1), ':', (SELECT COUNT(*) FROM tasks WHERE workspace_id = $1))`, workspaceID).Scan(&signature)
		if err == nil && signature != lastSignature { lastSignature = signature; _, _ = fmt.Fprintf(w, "event: dashboard\ndata: {\"signature\":%q}\n\n", signature); flusher.Flush() }
		select { case <-r.Context().Done(): return; case <-ticker.C: }
	}
}

func (a *app) getICP(w http.ResponseWriter, r *http.Request) {
	var raw []byte
	err := a.db.QueryRowContext(r.Context(), `SELECT icp FROM workspace_settings WHERE workspace_id = $1`, a.workspaceIDFor(r)).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) { raw = []byte(`{"industries":"","locations":"","employeeSize":"","revenue":"","signals":{}}`) } else if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load ICP settings."); return }
	var settings map[string]any; if err := json.Unmarshal(raw, &settings); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to parse ICP settings."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: settings, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updateICP(w http.ResponseWriter, r *http.Request) {
	var settings map[string]any
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid ICP settings payload."); return }
	raw, err := json.Marshal(settings); if err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid ICP settings payload."); return }
	_, err = a.db.ExecContext(r.Context(), `INSERT INTO workspace_settings (workspace_id, icp, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (workspace_id) DO UPDATE SET icp = EXCLUDED.icp, updated_at = now()`, a.workspaceIDFor(r), string(raw))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to save ICP settings."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: settings, Meta: map[string]any{"requestId": requestID(r)}})
}

type integrationDefinition struct { Provider string `json:"provider"`; Name string `json:"name"`; Kind string `json:"kind"`; Description string `json:"description"` }
var integrationDefinitions = []integrationDefinition{
	{Provider: "gdelt", Name: "GDELT", Kind: "public", Description: "Open global news and event data."},
	{Provider: "hacker_news", Name: "Hacker News", Kind: "public", Description: "Open technology discussions and stories."},
	{Provider: "linkedin", Name: "LinkedIn", Kind: "oauth", Description: "Requires an approved LinkedIn application and OAuth permissions."},
	{Provider: "google_business", Name: "Google Business Profile", Kind: "oauth", Description: "Requires Google OAuth and Business Profile access."},
	{Provider: "instagram", Name: "Instagram Graph", Kind: "oauth", Description: "Requires Meta app review and Instagram Graph permissions."},
}

func (a *app) listIntegrations(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT provider, kind, status, COALESCE(last_synced_at, 'epoch'), error_message FROM integration_connections WHERE workspace_id = $1`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load integrations."); return }
	defer rows.Close(); statuses := map[string]map[string]any{}
	for rows.Next() { var provider, kind, status, errorMessage string; var lastSynced time.Time; if err := rows.Scan(&provider, &kind, &status, &lastSynced, &errorMessage); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read integrations."); return }; statuses[provider] = map[string]any{"kind": kind, "status": status, "lastSyncedAt": lastSynced.Format(time.RFC3339), "error": errorMessage} }
	data := make([]map[string]any, 0, len(integrationDefinitions)); for _, definition := range integrationDefinitions { state := statuses[definition.Provider]; if state == nil { status := "not_configured"; if definition.Kind == "public" { status = "available" }; state = map[string]any{"kind": definition.Kind, "status": status, "lastSyncedAt": "", "error": ""} }; data = append(data, map[string]any{"provider": definition.Provider, "name": definition.Name, "kind": definition.Kind, "description": definition.Description, "status": state["status"], "lastSyncedAt": state["lastSyncedAt"], "error": state["error"]}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updateIntegration(w http.ResponseWriter, r *http.Request) {
	provider := r.PathValue("provider"); definition := integrationDefinition{}
	for _, candidate := range integrationDefinitions { if candidate.Provider == provider { definition = candidate; break } }
	if definition.Provider == "" { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Integration provider not found."); return }
	var input struct { Status string `json:"status"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || (input.Status != "connected" && input.Status != "disabled") { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Status must be connected or disabled."); return }
	_, err := a.db.ExecContext(r.Context(), `INSERT INTO integration_connections (workspace_id, provider, kind, status, updated_at) VALUES ($1, $2, $3, $4, now()) ON CONFLICT (workspace_id, provider) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`, a.workspaceIDFor(r), provider, definition.Kind, input.Status)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update integration."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]string{"provider": provider, "status": input.Status}, Meta: map[string]any{"requestId": requestID(r)}})
}

func formatCurrency(value float64) string {
	if value >= 1000000 { return strconv.FormatFloat(value/1000000, 'f', 2, 64) + "M" }
	if value >= 1000 { return strconv.FormatFloat(value/1000, 'f', 1, 64) + "K" }
	return strconv.FormatFloat(value, 'f', 0, 64)
}

func (a *app) dashboardSignalsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT s.id::text, s.title, COALESCE(c.name, 'Unknown company'),
		       COALESCE(s.confidence, 0), s.impact
		FROM signals s LEFT JOIN companies c ON c.id = s.company_id
		WHERE s.workspace_id = $1 ORDER BY s.detected_at DESC NULLS LAST, s.created_at DESC LIMIT 5`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load dashboard signals."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() {
		var id, title, company, impact string
		var confidence float64
		if err := rows.Scan(&id, &title, &company, &confidence, &impact); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read dashboard signals."); return }
		data = append(data, map[string]any{"id": id, "type": title, "company": company, "confidence": confidence, "impact": impact})
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardOpportunitiesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT o.id::text, COALESCE(c.name, 'Unknown company'), COALESCE(c.industry, ''),
		       COALESCE(o.score, 0), COALESCE(c.employee_range, ''),
		       COALESCE((SELECT title FROM signals s WHERE s.company_id = o.company_id ORDER BY s.detected_at DESC NULLS LAST LIMIT 1), '')
		FROM opportunities o LEFT JOIN companies c ON c.id = o.company_id
		WHERE o.workspace_id = $1 ORDER BY o.score DESC NULLS LAST LIMIT 5`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load dashboard opportunities."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() {
		var id, company, industry, employees, signal string
		var score int
		if err := rows.Scan(&id, &company, &industry, &score, &employees, &signal); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read dashboard opportunities."); return }
		data = append(data, map[string]any{"id": id, "company": company, "industry": industry, "score": score, "employees": employees, "signal": signal})
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardWatchlistHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT c.name, w.score, w.delta
		FROM watchlist_items w JOIN companies c ON c.id = w.company_id
		WHERE w.workspace_id = $1 ORDER BY w.score DESC, c.name LIMIT 10`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load watchlist."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() {
		var name, delta string
		var score int
		if err := rows.Scan(&name, &score, &delta); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read watchlist."); return }
		data = append(data, map[string]any{"name": name, "score": score, "delta": delta})
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardPipelineHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT pipeline_stage, COUNT(*), COALESCE(SUM(expected_value), 0)
		FROM opportunities WHERE workspace_id = $1 GROUP BY pipeline_stage
		ORDER BY pipeline_stage`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load dashboard pipeline."); return }
	defer rows.Close()
	data := make([]map[string]string, 0)
	for rows.Next() {
		var stage string
		var count int
		var value float64
		if err := rows.Scan(&stage, &count, &value); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read dashboard pipeline."); return }
		data = append(data, map[string]string{"title": stage, "count": strconv.Itoa(count), "value": "$" + strconv.FormatFloat(value, 'f', 0, 64)})
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardTrendingHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT c.name, COUNT(s.id) AS signal_count
		FROM companies c LEFT JOIN signals s ON s.company_id = c.id
		WHERE c.workspace_id = $1 GROUP BY c.id, c.name ORDER BY signal_count DESC, c.name LIMIT 5`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load trending companies."); return }
	defer rows.Close()
	data := make([]map[string]string, 0)
	for rows.Next() {
		var name string
		var score int
		if err := rows.Scan(&name, &score); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read trending companies."); return }
		data = append(data, map[string]string{"name": name, "score": strconv.Itoa(score), "delta": "0"})
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardInsightsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, body, created_at FROM dashboard_insights WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 10`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load insights."); return }
	defer rows.Close()
	data := make([]map[string]string, 0)
	for rows.Next() { var id, body string; var created time.Time; if err := rows.Scan(&id, &body, &created); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read insights."); return }; data = append(data, map[string]string{"id": id, "text": body, "age": created.Format(time.RFC3339)}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardTasksHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, label, urgency, due, completed FROM tasks WHERE workspace_id = $1 ORDER BY completed, created_at DESC LIMIT 25`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load tasks."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, label, urgency, due string; var completed bool; if err := rows.Scan(&id, &label, &urgency, &due, &completed); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read tasks."); return }; data = append(data, map[string]any{"id": id, "label": label, "urgency": urgency, "due": due, "completed": completed}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updateDashboardTaskHandler(w http.ResponseWriter, r *http.Request) {
	var input struct { Completed *bool `json:"completed"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Completed == nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "completed is required."); return }
	var task map[string]any = map[string]any{}
	var id, label, urgency, due string; var completed bool
	err := a.db.QueryRowContext(r.Context(), `UPDATE tasks SET completed = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3 RETURNING id::text, label, urgency, due, completed`, *input.Completed, r.PathValue("taskID"), a.workspaceIDFor(r)).Scan(&id, &label, &urgency, &due, &completed)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Task not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update task."); return }
	task["id"], task["label"], task["urgency"], task["due"], task["completed"] = id, label, urgency, due, completed
	writeJSON(w, http.StatusOK, apiResponse{Data: task, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardActivityHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, body, created_at FROM activity_events WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 10`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load activity."); return }
	defer rows.Close()
	data := make([]map[string]string, 0)
	for rows.Next() { var id, body string; var created time.Time; if err := rows.Scan(&id, &body, &created); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read activity."); return }; data = append(data, map[string]string{"id": id, "text": body, "age": created.Format(time.RFC3339)}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listCompanies(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	search := "%" + query + "%"
	rows, err := a.db.QueryContext(r.Context(), `
		SELECT id::text, name, COALESCE(domain, ''), COALESCE(industry, ''),
		       COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at
		FROM companies
		WHERE workspace_id = $1 AND ($2 = '%%' OR name ILIKE $2 OR COALESCE(domain, '') ILIKE $2)
		ORDER BY updated_at DESC`, a.workspaceIDFor(r), search)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load companies.")
		return
	}
	defer rows.Close()
	companies := make([]Company, 0)
	for rows.Next() {
		var company Company
		if err := rows.Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt); err != nil {
			writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read companies.")
			return
		}
		companies = append(companies, company)
	}
	if err := rows.Err(); err != nil {
		writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read companies.")
		return
	}

	writeJSON(w, http.StatusOK, apiResponse{
		Data: companies,
		Meta: map[string]any{
			"requestId": requestID(r),
			"page":      1,
			"limit":     len(companies),
			"total":     len(companies),
			"hasNextPage": false,
		},
	})
}

func (a *app) updateCompany(w http.ResponseWriter, r *http.Request) {
	var input struct { Name *string `json:"name"`; Domain *string `json:"domain"`; Industry *string `json:"industry"`; Location *string `json:"location"`; EmployeeRange *string `json:"employeeRange"`; Status *string `json:"status"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid company payload."); return }
	var company Company
	err := a.db.QueryRowContext(r.Context(), `UPDATE companies SET name = COALESCE($1, name), domain = COALESCE($2, domain), industry = COALESCE($3, industry), location = COALESCE($4, location), employee_range = COALESCE($5, employee_range), status = COALESCE($6, status), updated_at = now() WHERE id = $7 AND workspace_id = $8 RETURNING id::text, name, COALESCE(domain, ''), COALESCE(industry, ''), COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at`, input.Name, input.Domain, input.Industry, input.Location, input.EmployeeRange, input.Status, r.PathValue("companyID"), a.workspaceIDFor(r)).Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Company not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update company."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: company, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) deleteCompany(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.ExecContext(r.Context(), `DELETE FROM companies WHERE id = $1 AND workspace_id = $2`, r.PathValue("companyID"), a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to delete company."); return }
	count, _ := result.RowsAffected(); if count == 0 { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Company not found."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": r.PathValue("companyID"), "deleted": true}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listPeople(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, name, COALESCE(title, ''), COALESCE(department, ''), COALESCE(decision_score, 0) FROM people WHERE workspace_id = $1 AND ($2 = '%%' OR name ILIKE $2 OR title ILIKE $2 OR department ILIKE $2) ORDER BY decision_score DESC NULLS LAST, name LIMIT 100`, a.workspaceIDFor(r), query)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load people."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, name, title, department string; var score int; if err := rows.Scan(&id, &name, &title, &department, &score); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read people."); return }; data = append(data, map[string]any{"id": id, "name": name, "title": title, "department": department, "score": score}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) createPerson(w http.ResponseWriter, r *http.Request) {
	var input struct { Name string `json:"name"`; CompanyID *string `json:"companyId"`; Title string `json:"title"`; Department string `json:"department"`; Email string `json:"email"`; Phone string `json:"phone"`; LinkedInURL string `json:"linkedinUrl"`; DecisionScore *int `json:"decisionScore"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Name) == "" { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "A person name is required."); return }
	var id, name, title, department string; var score sql.NullInt64
	err := a.db.QueryRowContext(r.Context(), `INSERT INTO people (workspace_id, company_id, name, title, department, email, phone, linkedin_url, decision_score) VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), $9) RETURNING id::text, name, COALESCE(title, ''), COALESCE(department, ''), decision_score`, a.workspaceIDFor(r), input.CompanyID, strings.TrimSpace(input.Name), strings.TrimSpace(input.Title), strings.TrimSpace(input.Department), strings.TrimSpace(input.Email), strings.TrimSpace(input.Phone), strings.TrimSpace(input.LinkedInURL), input.DecisionScore).Scan(&id, &name, &title, &department, &score)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create person."); return }
	writeJSON(w, http.StatusCreated, apiResponse{Data: map[string]any{"id": id, "name": name, "title": title, "department": department, "score": score.Int64}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updatePerson(w http.ResponseWriter, r *http.Request) {
	var input struct { Name *string `json:"name"`; Title *string `json:"title"`; Department *string `json:"department"`; Email *string `json:"email"`; Phone *string `json:"phone"`; LinkedInURL *string `json:"linkedinUrl"`; DecisionScore *int `json:"decisionScore"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid person payload."); return }
	var id, name, title, department string; var score sql.NullInt64
	err := a.db.QueryRowContext(r.Context(), `UPDATE people SET name = COALESCE($1, name), title = COALESCE($2, title), department = COALESCE($3, department), email = COALESCE($4, email), phone = COALESCE($5, phone), linkedin_url = COALESCE($6, linkedin_url), decision_score = COALESCE($7, decision_score), updated_at = now() WHERE id = $8 AND workspace_id = $9 RETURNING id::text, name, COALESCE(title, ''), COALESCE(department, ''), decision_score`, input.Name, input.Title, input.Department, input.Email, input.Phone, input.LinkedInURL, input.DecisionScore, r.PathValue("personID"), a.workspaceIDFor(r)).Scan(&id, &name, &title, &department, &score)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Person not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update person."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": id, "name": name, "title": title, "department": department, "score": score.Int64}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) deletePerson(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.ExecContext(r.Context(), `DELETE FROM people WHERE id = $1 AND workspace_id = $2`, r.PathValue("personID"), a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to delete person."); return }
	count, _ := result.RowsAffected(); if count == 0 { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Person not found."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": r.PathValue("personID"), "deleted": true}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) getCompany(w http.ResponseWriter, r *http.Request) {
	var company Company
	err := a.db.QueryRowContext(r.Context(), `SELECT id::text, name, COALESCE(domain, ''), COALESCE(industry, ''), COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at FROM companies WHERE id = $1 AND workspace_id = $2`, r.PathValue("companyID"), a.workspaceIDFor(r)).Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Company not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load company."); return }
	companySignals := make([]map[string]any, 0)
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(detected_at, created_at), COALESCE(confidence, 0) FROM signals WHERE workspace_id = $1 AND company_id = $2 ORDER BY COALESCE(detected_at, created_at) DESC LIMIT 20`, a.workspaceIDFor(r), company.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() { var id, title, description, impact string; var detected time.Time; var confidence float64; if err := rows.Scan(&id, &title, &description, &impact, &detected, &confidence); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read company signals."); return }; companySignals = append(companySignals, map[string]any{"id": id, "type": title, "description": description, "impact": impact, "time": detected.Format(time.RFC3339), "confidence": confidence}) }
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": company.ID, "name": company.Name, "domain": company.Domain, "industry": company.Industry, "location": company.Location, "employeeRange": company.EmployeeRange, "status": company.Status, "createdAt": company.CreatedAt, "updatedAt": company.UpdatedAt, "signals": companySignals}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listSignals(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT s.id::text, s.title, COALESCE(c.name, 'Unknown company'), COALESCE(s.description, ''), COALESCE(s.detected_at, s.created_at), INITCAP(s.impact), COALESCE(s.confidence, 0) FROM signals s LEFT JOIN companies c ON c.id = s.company_id WHERE s.workspace_id = $1 AND ($2 = '%%' OR s.title ILIKE $2 OR COALESCE(c.name, '') ILIKE $2 OR COALESCE(s.description, '') ILIKE $2) ORDER BY COALESCE(s.detected_at, s.created_at) DESC LIMIT 100`, a.workspaceIDFor(r), query)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load signals."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, title, company, description, impact string; var timeValue time.Time; var confidence float64; if err := rows.Scan(&id, &title, &company, &description, &timeValue, &impact, &confidence); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read signals."); return }; data = append(data, map[string]any{"id": id, "type": title, "company": company, "description": description, "time": timeValue.Format(time.RFC3339), "impact": impact, "confidence": confidence}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) createSignal(w http.ResponseWriter, r *http.Request) {
	var input struct { CompanyID *string `json:"companyId"`; SignalType string `json:"signalType"`; Title string `json:"title"`; Description string `json:"description"`; Impact string `json:"impact"`; Confidence *float64 `json:"confidence"`; SourceType string `json:"sourceType"`; SourceURL string `json:"sourceUrl"`; DetectedAt *time.Time `json:"detectedAt"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Title) == "" { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "A signal title is required."); return }
	if input.SignalType == "" { input.SignalType = "business_change" }; if input.Impact == "" { input.Impact = "medium" }
	var id, title, description, impact string; var detected time.Time; var confidence sql.NullFloat64
	err := a.db.QueryRowContext(r.Context(), `INSERT INTO signals (workspace_id, company_id, signal_type, title, description, impact, confidence, source_type, source_url, detected_at) VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7, NULLIF($8, ''), NULLIF($9, ''), COALESCE($10, now())) RETURNING id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(detected_at, created_at), confidence`, a.workspaceIDFor(r), input.CompanyID, input.SignalType, strings.TrimSpace(input.Title), strings.TrimSpace(input.Description), input.Impact, input.Confidence, strings.TrimSpace(input.SourceType), strings.TrimSpace(input.SourceURL), input.DetectedAt).Scan(&id, &title, &description, &impact, &detected, &confidence)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create signal."); return }
	writeJSON(w, http.StatusCreated, apiResponse{Data: map[string]any{"id": id, "type": title, "description": description, "time": detected.Format(time.RFC3339), "impact": impact, "confidence": confidence.Float64}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updateSignal(w http.ResponseWriter, r *http.Request) {
	var input struct { Title *string `json:"title"`; Description *string `json:"description"`; Impact *string `json:"impact"`; Confidence *float64 `json:"confidence"`; SourceURL *string `json:"sourceUrl"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid signal payload."); return }
	var id, title, description, impact string; var detected time.Time; var confidence sql.NullFloat64
	err := a.db.QueryRowContext(r.Context(), `UPDATE signals SET title = COALESCE($1, title), description = COALESCE($2, description), impact = COALESCE($3, impact), confidence = COALESCE($4, confidence), source_url = COALESCE($5, source_url) WHERE id = $6 AND workspace_id = $7 RETURNING id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(detected_at, created_at), confidence`, input.Title, input.Description, input.Impact, input.Confidence, input.SourceURL, r.PathValue("signalID"), a.workspaceIDFor(r)).Scan(&id, &title, &description, &impact, &detected, &confidence)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Signal not found."); return }; if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update signal."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": id, "type": title, "description": description, "time": detected.Format(time.RFC3339), "impact": impact, "confidence": confidence.Float64}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) deleteSignal(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.ExecContext(r.Context(), `DELETE FROM signals WHERE id = $1 AND workspace_id = $2`, r.PathValue("signalID"), a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to delete signal."); return }; count, _ := result.RowsAffected(); if count == 0 { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Signal not found."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": r.PathValue("signalID"), "deleted": true}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listOpportunities(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT o.id::text, COALESCE(c.name, ''), COALESCE(c.industry, ''), COALESCE(c.location, ''), COALESCE(o.score, 0), COALESCE(c.employee_range, ''), COALESCE(o.pipeline_stage, 'new') FROM opportunities o LEFT JOIN companies c ON c.id = o.company_id WHERE o.workspace_id = $1 ORDER BY o.score DESC NULLS LAST LIMIT 100`, a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load opportunities."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, company, industry, location, employees, stage string; var score int; if err := rows.Scan(&id, &company, &industry, &location, &score, &employees, &stage); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read opportunities."); return }; data = append(data, map[string]any{"id": id, "company": company, "industry": industry, "location": location, "score": score, "employees": employees, "stage": stage}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) createOpportunity(w http.ResponseWriter, r *http.Request) {
	var input struct { CompanyID *string `json:"companyId"`; PipelineStage string `json:"stage"`; Status string `json:"status"`; Score *int `json:"score"`; Priority string `json:"priority"`; ExpectedValue *float64 `json:"expectedValue"`; NextAction string `json:"nextAction"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid opportunity payload."); return }
	if input.PipelineStage == "" { input.PipelineStage = "new" }; if input.Status == "" { input.Status = "open" }; if input.Priority == "" { input.Priority = "medium" }
	var id, company, industry, location, employees, stage, status string; var score sql.NullInt64
	err := a.db.QueryRowContext(r.Context(), `INSERT INTO opportunities (workspace_id, company_id, pipeline_stage, status, score, priority, expected_value, next_action) VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')) RETURNING id::text, COALESCE((SELECT name FROM companies WHERE id = company_id), ''), COALESCE((SELECT industry FROM companies WHERE id = company_id), ''), COALESCE((SELECT location FROM companies WHERE id = company_id), ''), COALESCE((SELECT employee_range FROM companies WHERE id = company_id), ''), pipeline_stage, status, score`, a.workspaceIDFor(r), input.CompanyID, input.PipelineStage, input.Status, input.Score, input.Priority, input.ExpectedValue, strings.TrimSpace(input.NextAction)).Scan(&id, &company, &industry, &location, &employees, &stage, &status, &score)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create opportunity."); return }
	writeJSON(w, http.StatusCreated, apiResponse{Data: map[string]any{"id": id, "company": company, "industry": industry, "location": location, "score": score.Int64, "employees": employees, "stage": stage, "status": status}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) getOpportunity(w http.ResponseWriter, r *http.Request) {
	var opportunity map[string]any = map[string]any{}
	var id, company, industry, location, employees, stage, status, companyID string
	var score int; var expectedValue float64
	err := a.db.QueryRowContext(r.Context(), `SELECT o.id::text, COALESCE(c.name, ''), COALESCE(c.industry, ''), COALESCE(c.location, ''), COALESCE(o.score, 0), COALESCE(c.employee_range, ''), o.pipeline_stage, o.status, COALESCE(o.company_id::text, ''), COALESCE(o.expected_value, 0) FROM opportunities o LEFT JOIN companies c ON c.id = o.company_id WHERE o.id = $1 AND o.workspace_id = $2`, r.PathValue("opportunityID"), a.workspaceIDFor(r)).Scan(&id, &company, &industry, &location, &score, &employees, &stage, &status, &companyID, &expectedValue)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Opportunity not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load opportunity."); return }
	opportunity["id"], opportunity["company"], opportunity["industry"], opportunity["location"], opportunity["score"], opportunity["employees"], opportunity["stage"], opportunity["status"], opportunity["expectedValue"] = id, company, industry, location, score, employees, stage, status, expectedValue
	opportunitySignals := make([]map[string]any, 0)
	if companyID != "" { rows, queryErr := a.db.QueryContext(r.Context(), `SELECT id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(confidence, 0), COALESCE(detected_at, created_at), COALESCE(source_url, '') FROM signals WHERE workspace_id = $1 AND company_id = $2 ORDER BY COALESCE(detected_at, created_at) DESC LIMIT 20`, a.workspaceIDFor(r), companyID); if queryErr == nil { defer rows.Close(); for rows.Next() { var signalID, title, description, impact, sourceURL string; var confidence float64; var detected time.Time; if scanErr := rows.Scan(&signalID, &title, &description, &impact, &confidence, &detected, &sourceURL); scanErr != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read opportunity signals."); return }; opportunitySignals = append(opportunitySignals, map[string]any{"id": signalID, "title": title, "description": description, "impact": impact, "confidence": confidence, "detectedAt": detected.Format(time.RFC3339), "sourceUrl": sourceURL}) } } }
	opportunity["signals"] = opportunitySignals
	writeJSON(w, http.StatusOK, apiResponse{Data: opportunity, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) updateOpportunity(w http.ResponseWriter, r *http.Request) {
	var input struct { PipelineStage *string `json:"stage"`; Status *string `json:"status"`; Score *int `json:"score"`; Priority *string `json:"priority"`; ExpectedValue *float64 `json:"expectedValue"`; NextAction *string `json:"nextAction"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid opportunity payload."); return }
	var id, company, industry, location, employees, stage, status string; var score sql.NullInt64
	err := a.db.QueryRowContext(r.Context(), `UPDATE opportunities SET pipeline_stage = COALESCE($1, pipeline_stage), status = COALESCE($2, status), score = COALESCE($3, score), priority = COALESCE($4, priority), expected_value = COALESCE($5, expected_value), next_action = COALESCE($6, next_action), updated_at = now() WHERE id = $7 AND workspace_id = $8 RETURNING id::text, COALESCE((SELECT name FROM companies WHERE id = company_id), ''), COALESCE((SELECT industry FROM companies WHERE id = company_id), ''), COALESCE((SELECT location FROM companies WHERE id = company_id), ''), COALESCE((SELECT employee_range FROM companies WHERE id = company_id), ''), pipeline_stage, status, score`, input.PipelineStage, input.Status, input.Score, input.Priority, input.ExpectedValue, input.NextAction, r.PathValue("opportunityID"), a.workspaceIDFor(r)).Scan(&id, &company, &industry, &location, &employees, &stage, &status, &score)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Opportunity not found."); return }; if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update opportunity."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": id, "company": company, "industry": industry, "location": location, "score": score.Int64, "employees": employees, "stage": stage, "status": status}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) deleteOpportunity(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.ExecContext(r.Context(), `DELETE FROM opportunities WHERE id = $1 AND workspace_id = $2`, r.PathValue("opportunityID"), a.workspaceIDFor(r))
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to delete opportunity."); return }; count, _ := result.RowsAffected(); if count == 0 { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Opportunity not found."); return }
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": r.PathValue("opportunityID"), "deleted": true}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listLists(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT l.id::text, l.name, l.type, COUNT(i.id), l.updated_at FROM lists l LEFT JOIN list_items i ON i.list_id = l.id WHERE l.workspace_id = $1 AND ($2 = '%%' OR l.name ILIKE $2) GROUP BY l.id ORDER BY l.updated_at DESC`, a.workspaceIDFor(r), query)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load lists."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, name, listType string; var count int; var updated time.Time; if err := rows.Scan(&id, &name, &listType, &count, &updated); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read lists."); return }; data = append(data, map[string]any{"id": id, "name": name, "type": listType, "count": count, "updated": updated.Format(time.RFC3339)}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) createList(w http.ResponseWriter, r *http.Request) {
	var input struct { Name string `json:"name"`; Type string `json:"type"` }
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Name) == "" { writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "A list name is required."); return }
	if input.Type == "" { input.Type = "manual" }
	var id, name, listType string; var updated time.Time
	err := a.db.QueryRowContext(r.Context(), `INSERT INTO lists (workspace_id, name, type) VALUES ($1, $2, $3) RETURNING id::text, name, type, updated_at`, a.workspaceIDFor(r), strings.TrimSpace(input.Name), input.Type).Scan(&id, &name, &listType, &updated)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create list."); return }
	writeJSON(w, http.StatusCreated, apiResponse{Data: map[string]any{"id": id, "name": name, "type": listType, "count": 0, "updated": updated.Format(time.RFC3339)}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) createCompany(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name          string `json:"name"`
		Domain        string `json:"domain"`
		Industry      string `json:"industry"`
		Location      string `json:"location"`
		EmployeeRange string `json:"employeeRange"`
		Status        string `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil || strings.TrimSpace(input.Name) == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "A company name is required.")
		return
	}

	if input.Status == "" {
		input.Status = "active"
	}
	var company Company
	err := a.db.QueryRowContext(r.Context(), `
		INSERT INTO companies (workspace_id, name, domain, industry, location, employee_range, status)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), $7)
		RETURNING id::text, name, COALESCE(domain, ''), COALESCE(industry, ''), COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at`,
		a.workspaceIDFor(r), strings.TrimSpace(input.Name), strings.TrimSpace(input.Domain), strings.TrimSpace(input.Industry), strings.TrimSpace(input.Location), strings.TrimSpace(input.EmployeeRange), input.Status,
	).Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to create company.")
		return
	}

	writeJSON(w, http.StatusCreated, apiResponse{
		Data: company,
		Meta: map[string]any{"requestId": requestID(r)},
	})
}

func withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	writeJSON(w, status, apiError{
		Error: apiErrorBody{Code: code, Message: message},
		Meta:  map[string]any{"requestId": requestID(r)},
	})
}

func requestID(r *http.Request) string {
	if id := r.Header.Get("X-Request-ID"); id != "" {
		return id
	}
	return "req_" + time.Now().UTC().Format("20060102150405.000000000")
}
