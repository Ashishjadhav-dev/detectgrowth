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
	mux.HandleFunc("GET /api/v1/companies", api.listCompanies)
	mux.HandleFunc("POST /api/v1/companies", api.createCompany)
	mux.HandleFunc("GET /api/v1/companies/{companyID}", api.getCompany)
	mux.HandleFunc("GET /api/v1/people", api.listPeople)
	mux.HandleFunc("GET /api/v1/signals", api.listSignals)
	mux.HandleFunc("GET /api/v1/opportunities", api.listOpportunities)
	mux.HandleFunc("GET /api/v1/opportunities/{opportunityID}", api.getOpportunity)
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
	err := a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM companies WHERE workspace_id = $1`, a.workspaceID).Scan(&companies)
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM people WHERE workspace_id = $1`, a.workspaceID).Scan(&people)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM signals WHERE workspace_id = $1`, a.workspaceID).Scan(&signals)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM opportunities WHERE workspace_id = $1`, a.workspaceID).Scan(&opportunities)
	}
	if err == nil {
		err = a.db.QueryRowContext(r.Context(), `SELECT COALESCE(SUM(expected_value), 0), COALESCE(AVG(score), 0) FROM opportunities WHERE workspace_id = $1 AND status = 'open'`, a.workspaceID).Scan(&pipelineValue, &averageScore)
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
		Meta: map[string]any{"requestId": requestID(r), "workspaceId": a.workspaceID},
	})
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
		WHERE s.workspace_id = $1 ORDER BY s.detected_at DESC NULLS LAST, s.created_at DESC LIMIT 5`, a.workspaceID)
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
		WHERE o.workspace_id = $1 ORDER BY o.score DESC NULLS LAST LIMIT 5`, a.workspaceID)
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
		WHERE w.workspace_id = $1 ORDER BY w.score DESC, c.name LIMIT 10`, a.workspaceID)
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
		ORDER BY pipeline_stage`, a.workspaceID)
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
		WHERE c.workspace_id = $1 GROUP BY c.id, c.name ORDER BY signal_count DESC, c.name LIMIT 5`, a.workspaceID)
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
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, body, created_at FROM dashboard_insights WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 10`, a.workspaceID)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load insights."); return }
	defer rows.Close()
	data := make([]map[string]string, 0)
	for rows.Next() { var id, body string; var created time.Time; if err := rows.Scan(&id, &body, &created); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read insights."); return }; data = append(data, map[string]string{"id": id, "text": body, "age": created.Format(time.RFC3339)}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardTasksHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, label, urgency, due, completed FROM tasks WHERE workspace_id = $1 ORDER BY completed, created_at DESC LIMIT 25`, a.workspaceID)
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
	err := a.db.QueryRowContext(r.Context(), `UPDATE tasks SET completed = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3 RETURNING id::text, label, urgency, due, completed`, *input.Completed, r.PathValue("taskID"), a.workspaceID).Scan(&id, &label, &urgency, &due, &completed)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Task not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to update task."); return }
	task["id"], task["label"], task["urgency"], task["due"], task["completed"] = id, label, urgency, due, completed
	writeJSON(w, http.StatusOK, apiResponse{Data: task, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) dashboardActivityHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, body, created_at FROM activity_events WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 10`, a.workspaceID)
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
		ORDER BY updated_at DESC`, a.workspaceID, search)
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

func (a *app) listPeople(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, name, COALESCE(title, ''), COALESCE(department, ''), COALESCE(decision_score, 0) FROM people WHERE workspace_id = $1 AND ($2 = '%%' OR name ILIKE $2 OR title ILIKE $2 OR department ILIKE $2) ORDER BY decision_score DESC NULLS LAST, name LIMIT 100`, a.workspaceID, query)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load people."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, name, title, department string; var score int; if err := rows.Scan(&id, &name, &title, &department, &score); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read people."); return }; data = append(data, map[string]any{"id": id, "name": name, "title": title, "department": department, "score": score}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) getCompany(w http.ResponseWriter, r *http.Request) {
	var company Company
	err := a.db.QueryRowContext(r.Context(), `SELECT id::text, name, COALESCE(domain, ''), COALESCE(industry, ''), COALESCE(location, ''), COALESCE(employee_range, ''), status, created_at, updated_at FROM companies WHERE id = $1 AND workspace_id = $2`, r.PathValue("companyID"), a.workspaceID).Scan(&company.ID, &company.Name, &company.Domain, &company.Industry, &company.Location, &company.EmployeeRange, &company.Status, &company.CreatedAt, &company.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Company not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load company."); return }
	companySignals := make([]map[string]any, 0)
	rows, err := a.db.QueryContext(r.Context(), `SELECT id::text, title, COALESCE(description, ''), INITCAP(impact), COALESCE(detected_at, created_at) FROM signals WHERE workspace_id = $1 AND company_id = $2 ORDER BY COALESCE(detected_at, created_at) DESC LIMIT 20`, a.workspaceID, company.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() { var id, title, description, impact string; var detected time.Time; if err := rows.Scan(&id, &title, &description, &impact, &detected); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read company signals."); return }; companySignals = append(companySignals, map[string]any{"id": id, "type": title, "description": description, "impact": impact, "time": detected.Format(time.RFC3339)}) }
	}
	writeJSON(w, http.StatusOK, apiResponse{Data: map[string]any{"id": company.ID, "name": company.Name, "domain": company.Domain, "industry": company.Industry, "location": company.Location, "employeeRange": company.EmployeeRange, "status": company.Status, "createdAt": company.CreatedAt, "updatedAt": company.UpdatedAt, "signals": companySignals}, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listSignals(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT s.id::text, s.title, COALESCE(c.name, 'Unknown company'), COALESCE(s.description, ''), COALESCE(s.detected_at, s.created_at), INITCAP(s.impact), COALESCE(s.confidence, 0) FROM signals s LEFT JOIN companies c ON c.id = s.company_id WHERE s.workspace_id = $1 AND ($2 = '%%' OR s.title ILIKE $2 OR COALESCE(c.name, '') ILIKE $2 OR COALESCE(s.description, '') ILIKE $2) ORDER BY COALESCE(s.detected_at, s.created_at) DESC LIMIT 100`, a.workspaceID, query)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load signals."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, title, company, description, impact string; var timeValue time.Time; var confidence float64; if err := rows.Scan(&id, &title, &company, &description, &timeValue, &impact, &confidence); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read signals."); return }; data = append(data, map[string]any{"id": id, "type": title, "company": company, "description": description, "time": timeValue.Format(time.RFC3339), "impact": impact, "confidence": confidence}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) listOpportunities(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.QueryContext(r.Context(), `SELECT o.id::text, COALESCE(c.name, ''), COALESCE(c.industry, ''), COALESCE(c.location, ''), COALESCE(o.score, 0), COALESCE(c.employee_range, ''), COALESCE(o.pipeline_stage, 'new') FROM opportunities o LEFT JOIN companies c ON c.id = o.company_id WHERE o.workspace_id = $1 ORDER BY o.score DESC NULLS LAST LIMIT 100`, a.workspaceID)
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load opportunities."); return }
	defer rows.Close()
	data := make([]map[string]any, 0)
	for rows.Next() { var id, company, industry, location, employees, stage string; var score int; if err := rows.Scan(&id, &company, &industry, &location, &score, &employees, &stage); err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to read opportunities."); return }; data = append(data, map[string]any{"id": id, "company": company, "industry": industry, "location": location, "score": score, "employees": employees, "stage": stage}) }
	writeJSON(w, http.StatusOK, apiResponse{Data: data, Meta: map[string]any{"requestId": requestID(r), "total": len(data)}})
}

func (a *app) getOpportunity(w http.ResponseWriter, r *http.Request) {
	var opportunity map[string]any = map[string]any{}
	var id, company, industry, location, employees, stage, status string
	var score int
	err := a.db.QueryRowContext(r.Context(), `SELECT o.id::text, COALESCE(c.name, ''), COALESCE(c.industry, ''), COALESCE(c.location, ''), COALESCE(o.score, 0), COALESCE(c.employee_range, ''), o.pipeline_stage, o.status FROM opportunities o LEFT JOIN companies c ON c.id = o.company_id WHERE o.id = $1 AND o.workspace_id = $2`, r.PathValue("opportunityID"), a.workspaceID).Scan(&id, &company, &industry, &location, &score, &employees, &stage, &status)
	if errors.Is(err, sql.ErrNoRows) { writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Opportunity not found."); return }
	if err != nil { writeError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "Unable to load opportunity."); return }
	opportunity["id"], opportunity["company"], opportunity["industry"], opportunity["location"], opportunity["score"], opportunity["employees"], opportunity["stage"], opportunity["status"] = id, company, industry, location, score, employees, stage, status
	writeJSON(w, http.StatusOK, apiResponse{Data: opportunity, Meta: map[string]any{"requestId": requestID(r)}})
}

func (a *app) listLists(w http.ResponseWriter, r *http.Request) {
	query := "%" + strings.TrimSpace(r.URL.Query().Get("q")) + "%"
	rows, err := a.db.QueryContext(r.Context(), `SELECT l.id::text, l.name, l.type, COUNT(i.id), l.updated_at FROM lists l LEFT JOIN list_items i ON i.list_id = l.id WHERE l.workspace_id = $1 AND ($2 = '%%' OR l.name ILIKE $2) GROUP BY l.id ORDER BY l.updated_at DESC`, a.workspaceID, query)
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
	err := a.db.QueryRowContext(r.Context(), `INSERT INTO lists (workspace_id, name, type) VALUES ($1, $2, $3) RETURNING id::text, name, type, updated_at`, a.workspaceID, strings.TrimSpace(input.Name), input.Type).Scan(&id, &name, &listType, &updated)
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
		a.workspaceID, strings.TrimSpace(input.Name), strings.TrimSpace(input.Domain), strings.TrimSpace(input.Industry), strings.TrimSpace(input.Location), strings.TrimSpace(input.EmployeeRange), input.Status,
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
