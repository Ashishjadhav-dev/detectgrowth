package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
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

type companyStore struct {
	mu        sync.RWMutex
	companies map[string]Company
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	store := &companyStore{companies: map[string]Company{}}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", healthHandler)
	mux.HandleFunc("GET /api/v1/companies", store.listCompanies)
	mux.HandleFunc("POST /api/v1/companies", store.createCompany)
	mux.HandleFunc("GET /api/v1/dashboard/summary", dashboardSummaryHandler)
	mux.HandleFunc("GET /api/v1/dashboard/insights", dashboardInsightsHandler)
	mux.HandleFunc("GET /api/v1/dashboard/tasks", dashboardTasksHandler)
	mux.HandleFunc("GET /api/v1/dashboard/activity", dashboardActivityHandler)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           withMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("DetectGrowth API listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: map[string]string{"status": "ok", "service": "detectgrowth-api"},
		Meta: map[string]any{"requestId": requestID(r)},
	})
}

func dashboardSummaryHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{
		Data: map[string]string{
			"newOpportunities":  "128",
			"companiesSurging":   "47",
			"newSignals":        "284",
			"peopleDiscovered":  "1,420",
			"pipelineValue":     "$8.42M",
			"averageGrowthScore": "94",
			"growthDelta":       "+18.2%",
		},
		Meta: map[string]any{"requestId": requestID(r)},
	})
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

func (s *companyStore) listCompanies(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))

	s.mu.RLock()
	companies := make([]Company, 0, len(s.companies))
	for _, company := range s.companies {
		if query == "" || strings.Contains(strings.ToLower(company.Name), query) || strings.Contains(strings.ToLower(company.Domain), query) {
			companies = append(companies, company)
		}
	}
	s.mu.RUnlock()

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

func (s *companyStore) createCompany(w http.ResponseWriter, r *http.Request) {
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

	now := time.Now().UTC()
	company := Company{
		ID:            "company_" + now.Format("20060102150405.000000000"),
		Name:          strings.TrimSpace(input.Name),
		Domain:        strings.TrimSpace(input.Domain),
		Industry:      strings.TrimSpace(input.Industry),
		Location:      strings.TrimSpace(input.Location),
		EmployeeRange: strings.TrimSpace(input.EmployeeRange),
		Status:        input.Status,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	if company.Status == "" {
		company.Status = "active"
	}

	s.mu.Lock()
	s.companies[company.ID] = company
	s.mu.Unlock()

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
