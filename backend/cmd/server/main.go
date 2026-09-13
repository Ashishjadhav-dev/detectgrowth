package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
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
	mux.HandleFunc("GET /api/v1/companies", api.listCompanies)
	mux.HandleFunc("POST /api/v1/companies", api.createCompany)
	mux.HandleFunc("GET /api/v1/dashboard/summary", api.dashboardSummaryHandler)
	mux.HandleFunc("GET /api/v1/dashboard/insights", dashboardInsightsHandler)
	mux.HandleFunc("GET /api/v1/dashboard/tasks", dashboardTasksHandler)
	mux.HandleFunc("GET /api/v1/dashboard/activity", dashboardActivityHandler)
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
			"pipelineValue":      "$0",
			"averageGrowthScore": "0",
			"growthDelta":        "0%",
		},
		Meta: map[string]any{"requestId": requestID(r), "workspaceId": a.workspaceID},
	})
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
	writeJSON(w, http.StatusOK, apiResponse{Data: []map[string]any{}, Meta: map[string]any{"requestId": requestID(r)}})
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

func dashboardInsightsHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: []map[string]string{
			{"text": "Stripe raised $4.5B Series I two hours ago", "age": "1h ago"},
			{"text": "13 companies entered your ICP yesterday", "age": "2h ago"},
			{"text": "28 marketing roles opened across target accounts", "age": "3h ago"},
		},
		Meta: map[string]any{"requestId": requestID(r)},
	})
}

func dashboardTasksHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: []map[string]any{
			{"label": "Follow up with Databricks", "urgency": "High", "due": "Today", "completed": false},
			{"label": "Review 15 new signals", "urgency": "Medium", "due": "Today", "completed": false},
			{"label": "Call Sarah at Notion", "urgency": "High", "due": "Tomorrow", "completed": false},
			{"label": "Prepare Acme Corp proposal", "urgency": "Medium", "due": "Tomorrow", "completed": false},
			{"label": "Connect with new leads", "urgency": "Low", "due": "May 30", "completed": false},
		},
		Meta: map[string]any{"requestId": requestID(r)},
	})
}

func dashboardActivityHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: []map[string]string{
			{"text": "You added 32 companies to AI Startup lists", "age": "Just now"},
			{"text": "Sarah commented on Acme Corp", "age": "12m ago"},
			{"text": "You starred product-led growth signals", "age": "1h ago"},
			{"text": "Deal closed: NITRO - $120K", "age": "2h ago"},
		},
		Meta: map[string]any{"requestId": requestID(r)},
	})
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
