package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type gdeltResponse struct {
	Articles []struct {
		URL      string `json:"url"`
		Title    string `json:"title"`
		Domain   string `json:"domain"`
		SeenDate string `json:"seendate"`
	} `json:"articles"`
}

type hnItem struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	URL   string `json:"url"`
	By    string `json:"by"`
}

type normalizedJob struct {
	Source, ExternalID, Title, Company, Location, Workplace, Description, URL, Department, EmploymentType, LogoURL string
	Tags                                                                                                           []string
	PostedAt                                                                                                       *time.Time
}

func main() {
	databaseURL := envOr("DATABASE_URL", "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable")
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	workspaceID, err := ensureWorkspace(ctx, db)
	cancel()
	if err != nil {
		log.Fatalf("workspace: %v", err)
	}

	interval := durationEnv("SIGNAL_POLL_INTERVAL", 10*time.Minute)
	query := envOr("GDELT_QUERY", "startup OR funding OR hiring OR \"product launch\"")
	jobInterval := durationEnv("JOB_POLL_INTERVAL", 30*time.Minute)
	log.Printf("signal worker started; polling every %s; job sync every %s", interval, jobInterval)
	lastJobSync := time.Time{}

	for {
		if err := collectGDELT(context.Background(), db, workspaceID, query); err != nil {
			log.Printf("GDELT: %v", err)
		}
		if err := collectHackerNews(context.Background(), db, workspaceID); err != nil {
			log.Printf("Hacker News: %v", err)
		}
		if time.Since(lastJobSync) >= jobInterval {
			if err := collectJobs(context.Background(), db); err != nil {
				log.Printf("jobs: %v", err)
			} else {
				lastJobSync = time.Now()
			}
			if err := deliverJobAlerts(context.Background(), db); err != nil {
				log.Printf("job alerts: %v", err)
			}
		}
		time.Sleep(interval)
	}
}

type dueAlert struct{ ID, Query, Workplace, Frequency, Email string }

func deliverJobAlerts(ctx context.Context, db *sql.DB) error {
	apiKey := strings.TrimSpace(os.Getenv("RESEND_API_KEY"))
	if apiKey == "" {
		return nil
	}
	rows, err := db.QueryContext(ctx, `SELECT a.id::text, a.query, a.workplace, a.frequency, u.email FROM job_alerts a JOIN users u ON u.id = a.user_id WHERE a.enabled = true AND (a.last_sent_at IS NULL OR (a.frequency = 'daily' AND a.last_sent_at < now() - interval '1 day') OR (a.frequency = 'weekly' AND a.last_sent_at < now() - interval '7 days'))`)
	if err != nil {
		return err
	}
	defer rows.Close()
	alerts := make([]dueAlert, 0)
	for rows.Next() {
		var alert dueAlert
		if err := rows.Scan(&alert.ID, &alert.Query, &alert.Workplace, &alert.Frequency, &alert.Email); err != nil {
			return err
		}
		alerts = append(alerts, alert)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for _, alert := range alerts {
		jobs, err := matchingAlertJobs(ctx, db, alert.Query, alert.Workplace)
		if err != nil {
			log.Printf("alert %s query failed: %v", alert.ID, err)
			continue
		}
		if len(jobs) > 0 {
			if err := sendJobAlertEmail(ctx, alert, jobs); err != nil {
				log.Printf("alert %s delivery failed: %v", alert.ID, err)
				continue
			}
		}
		if _, err := db.ExecContext(ctx, `UPDATE job_alerts SET last_sent_at = now(), updated_at = now() WHERE id = $1`, alert.ID); err != nil {
			log.Printf("alert %s timestamp update failed: %v", alert.ID, err)
		}
	}
	return nil
}

type alertJob struct{ Title, Company, Location, URL string }

func matchingAlertJobs(ctx context.Context, db *sql.DB, query, workplace string) ([]alertJob, error) {
	rows, err := db.QueryContext(ctx, `SELECT title, company, location, url FROM job_listings WHERE status = 'active' AND ($1 = '' OR to_tsvector('simple', title || ' ' || company || ' ' || location || ' ' || department || ' ' || employment_type || ' ' || description) @@ plainto_tsquery('simple', $1)) AND ($2 = '' OR $2 = 'Any workplace' OR workplace = $2) ORDER BY posted_at DESC NULLS LAST LIMIT 10`, strings.TrimSpace(query), strings.TrimSpace(workplace))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	jobs := make([]alertJob, 0)
	for rows.Next() {
		var job alertJob
		if err := rows.Scan(&job.Title, &job.Company, &job.Location, &job.URL); err != nil {
			return nil, err
		}
		jobs = append(jobs, job)
	}
	return jobs, rows.Err()
}

func sendJobAlertEmail(ctx context.Context, alert dueAlert, jobs []alertJob) error {
	lines := make([]string, 0, len(jobs)+2)
	lines = append(lines, fmt.Sprintf("New job matches for %q:", alert.Query))
	for _, job := range jobs {
		lines = append(lines, fmt.Sprintf("- %s — %s (%s)\n  %s", job.Title, job.Company, fallback(job.Location, "Location not listed"), job.URL))
	}
	payload, err := json.Marshal(map[string]any{"from": envOr("RESEND_FROM_EMAIL", "DetectGrowth <security@example.com>"), "to": []string{alert.Email}, "subject": fmt.Sprintf("DetectGrowth: %d new job match%s", len(jobs), map[bool]string{true: "es", false: ""}[len(jobs) != 1]), "text": strings.Join(lines, "\n")})
	if err != nil {
		return err
	}
	requestContext, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(requestContext, http.MethodPost, "https://api.resend.com/emails", strings.NewReader(string(payload)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("RESEND_API_KEY"))
	req.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 2000))
		return fmt.Errorf("Resend HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}

func collectJobs(ctx context.Context, db *sql.DB) error {
	greenhouse := splitEnv("JOB_GREENHOUSE_BOARDS", []string{})
	lever := splitEnv("JOB_LEVER_BOARDS", []string{})
	feeds := []struct{ source, endpoint, kind, company string }{{"Arbeitnow", "https://www.arbeitnow.com/api/job-board-api?page=1", "arbeitnow", ""}}
	feeds = append(feeds, struct{ source, endpoint, kind, company string }{"Remotive", "https://remotive.com/api/remote-jobs?limit=100", "remotive", ""})
	feeds = append(feeds, struct{ source, endpoint, kind, company string }{"Himalayas", "https://himalayas.app/jobs/api/search?country=IN&sort=recent&page=1", "himalayas", ""})
	if appID, appKey := strings.TrimSpace(os.Getenv("ADZUNA_APP_ID")), strings.TrimSpace(os.Getenv("ADZUNA_APP_KEY")); appID != "" && appKey != "" {
		feeds = append(feeds, struct{ source, endpoint, kind, company string }{"Adzuna India", "https://api.adzuna.com/v1/api/jobs/in/search/1?" + url.Values{"app_id": []string{appID}, "app_key": []string{appKey}, "where": []string{"India"}, "results_per_page": []string{"100"}, "sort_by": []string{"date"}}.Encode(), "adzuna", ""})
	}
	for _, board := range greenhouse {
		feeds = append(feeds, struct{ source, endpoint, kind, company string }{"Greenhouse · " + displayName(board), "https://boards-api.greenhouse.io/v1/boards/" + url.PathEscape(board) + "/jobs?content=true", "greenhouse", displayName(board)})
	}
	for _, board := range lever {
		feeds = append(feeds, struct{ source, endpoint, kind, company string }{"Lever · " + displayName(board), "https://api.lever.co/v0/postings/" + url.PathEscape(board) + "?mode=json", "lever", displayName(board)})
	}
	var firstErr error
	for _, feed := range feeds {
		started := time.Now().UTC()
		jobs, err := fetchJobs(ctx, feed.source, feed.endpoint, feed.kind, feed.company)
		if err != nil {
			if firstErr == nil {
				firstErr = fmt.Errorf("%s: %w", feed.source, err)
			}
			log.Printf("%s: feed unavailable: %v", feed.source, err)
			continue
		}
		feedFailed := false
		for _, job := range jobs {
			if err := upsertJob(ctx, db, job); err != nil {
				feedFailed = true
				if firstErr == nil {
					firstErr = err
				}
				log.Printf("%s: unable to upsert job: %v", feed.source, err)
				continue
			}
		}
		if feedFailed {
			continue
		}
		_, err = db.ExecContext(ctx, `UPDATE job_listings SET status = 'expired', updated_at = now() WHERE source = $1 AND status = 'active' AND last_seen_at < $2`, feed.source, started)
		if err != nil {
			if firstErr == nil {
				firstErr = err
			}
			log.Printf("%s: unable to expire stale jobs: %v", feed.source, err)
			continue
		}
		log.Printf("%s: synchronized %d jobs", feed.source, len(jobs))
	}
	return firstErr
}

func fetchJobs(ctx context.Context, source, endpoint, kind, company string) ([]normalizedJob, error) {
	var payload any
	if err := getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}
	switch kind {
	case "arbeitnow":
		root, _ := payload.(map[string]any)
		data, _ := root["data"].([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for i, value := range data {
			row, _ := value.(map[string]any)
			id := stringValue(row["slug"])
			if id == "" {
				id = stringValue(row["id"])
				if id == "" {
					id = fmt.Sprint(i)
				}
			}
			location := stringValue(row["location"])
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: id, Title: fallback(stringValue(row["title"]), "Untitled role"), Company: fallback(stringValue(row["company_name"]), "Unknown company"), Location: location, Workplace: classifyWorkplace(location, boolValue(row["remote"])), Tags: stringSlice(row["tags"]), Description: cleanText(stringValue(row["description"])), URL: safeURL(stringValue(row["url"]), "https://www.arbeitnow.com/"), PostedAt: parseTime(row["created_at"]), Department: stringValue(row["category"]), EmploymentType: firstString(row["job_types"]), LogoURL: stringValue(row["company_logo"])})
		}
		return jobs, nil
	case "greenhouse":
		root, _ := payload.(map[string]any)
		data, _ := root["jobs"].([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for _, value := range data {
			row, _ := value.(map[string]any)
			location := ""
			if loc, ok := row["location"].(map[string]any); ok {
				location = stringValue(loc["name"])
			}
			departments := stringSliceFromMaps(row["departments"], "name")
			id := stringValue(row["id"])
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: id, Title: fallback(stringValue(row["title"]), "Untitled role"), Company: company, Location: location, Workplace: classifyWorkplace(location, false), Tags: departments, Description: cleanText(stringValue(row["content"])), URL: safeURL(stringValue(row["absolute_url"]), "https://boards.greenhouse.io/"), PostedAt: parseTime(row["updated_at"]), Department: first(departments)})
		}
		return jobs, nil
	case "remotive":
		root, _ := payload.(map[string]any)
		data, _ := root["jobs"].([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for _, value := range data {
			row, _ := value.(map[string]any)
			companyName := fallback(stringValue(row["company_name"]), "Unknown company")
			location := fallback(stringValue(row["candidate_required_location"]), "Remote")
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: stringValue(row["id"]), Title: fallback(stringValue(row["title"]), "Untitled role"), Company: companyName, Location: location, Workplace: "Remote", Tags: append(stringSlice(row["tags"]), stringValue(row["category"])), Description: cleanText(stringValue(row["description"])), URL: safeURL(stringValue(row["url"]), "https://remotive.com/"), PostedAt: parseTime(row["publication_date"]), Department: stringValue(row["category"]), EmploymentType: stringValue(row["job_type"]), LogoURL: stringValue(row["company_logo"])})
		}
		return jobs, nil
	case "himalayas":
		root, _ := payload.(map[string]any)
		data, _ := root["jobs"].([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for _, value := range data {
			row, _ := value.(map[string]any)
			companyName := fallback(stringValue(row["companyName"]), "Unknown company")
			location := "Remote / Worldwide"
			if restrictions, ok := row["locationRestrictions"].([]any); ok && len(restrictions) > 0 {
				locations := make([]string, 0, len(restrictions))
				for _, item := range restrictions {
					if restriction, ok := item.(map[string]any); ok {
						if name := fallback(stringValue(restriction["name"]), stringValue(restriction["alpha2"])); name != "" {
							locations = append(locations, name)
						}
					}
				}
				if len(locations) > 0 {
					location = strings.Join(locations, ", ")
				}
			}
			categories := stringSlice(row["categories"])
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: fallback(stringValue(row["guid"]), stringValue(row["title"])), Title: fallback(stringValue(row["title"]), "Untitled role"), Company: companyName, Location: location, Workplace: "Remote", Tags: append(categories, stringValue(row["seniority"])), Description: cleanText(fallback(stringValue(row["description"]), stringValue(row["excerpt"]))), URL: safeURL(stringValue(row["applicationLink"]), "https://himalayas.app/"), PostedAt: parseTime(row["pubDate"]), Department: first(categories), EmploymentType: stringValue(row["employmentType"]), LogoURL: stringValue(row["companyLogo"])})
		}
		return jobs, nil
	case "adzuna":
		root, _ := payload.(map[string]any)
		data, _ := root["results"].([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for _, value := range data {
			row, _ := value.(map[string]any)
			companyName, location, category := "Unknown company", "India", ""
			if companyMap, ok := row["company"].(map[string]any); ok {
				companyName = fallback(stringValue(companyMap["display_name"]), companyName)
			}
			if locationMap, ok := row["location"].(map[string]any); ok {
				location = fallback(stringValue(locationMap["display_name"]), location)
			}
			if categoryMap, ok := row["category"].(map[string]any); ok {
				category = stringValue(categoryMap["label"])
			}
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: stringValue(row["id"]), Title: fallback(stringValue(row["title"]), "Untitled role"), Company: companyName, Location: location, Workplace: classifyWorkplace(location, false), Tags: []string{category}, Description: cleanText(stringValue(row["description"])), URL: safeURL(stringValue(row["redirect_url"]), "https://www.adzuna.in/"), PostedAt: parseTime(row["created"]), Department: category, EmploymentType: fallback(stringValue(row["contract_time"]), stringValue(row["contract_type"]))})
		}
		return jobs, nil
	default:
		data, _ := payload.([]any)
		jobs := make([]normalizedJob, 0, len(data))
		for _, value := range data {
			row, _ := value.(map[string]any)
			categories, _ := row["categories"].(map[string]any)
			location := stringValue(categories["location"])
			tags := []string{}
			if team := stringValue(categories["team"]); team != "" {
				tags = append(tags, team)
			}
			if department := stringValue(categories["department"]); department != "" {
				tags = append(tags, department)
			}
			jobs = append(jobs, normalizedJob{Source: source, ExternalID: stringValue(row["id"]), Title: fallback(stringValue(row["text"]), "Untitled role"), Company: company, Location: location, Workplace: classifyWorkplace(location, false), Tags: tags, Description: cleanText(fallback(stringValue(row["descriptionPlain"]), stringValue(row["description"]))), URL: safeURL(fallback(stringValue(row["hostedUrl"]), stringValue(row["applyUrl"])), "https://jobs.lever.co/"), PostedAt: parseTime(row["createdAt"]), Department: stringValue(categories["team"]), EmploymentType: stringValue(categories["commitment"])})
		}
		return jobs, nil
	}
}

func upsertJob(ctx context.Context, db *sql.DB, job normalizedJob) error {
	tags, _ := json.Marshal(job.Tags)
	_, err := db.ExecContext(ctx, `INSERT INTO job_listings (source, external_id, title, company, location, workplace, tags, description, url, posted_at, department, employment_type, logo_url, status, last_seen_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,NULLIF($13, ''),'active',now(),now()) ON CONFLICT (source, external_id) DO UPDATE SET title=EXCLUDED.title, company=EXCLUDED.company, location=EXCLUDED.location, workplace=EXCLUDED.workplace, tags=EXCLUDED.tags, description=EXCLUDED.description, url=EXCLUDED.url, posted_at=EXCLUDED.posted_at, department=EXCLUDED.department, employment_type=EXCLUDED.employment_type, logo_url=EXCLUDED.logo_url, status='active', last_seen_at=now(), updated_at=now()`, job.Source, job.ExternalID, job.Title, job.Company, job.Location, job.Workplace, string(tags), job.Description, job.URL, job.PostedAt, job.Department, job.EmploymentType, job.LogoURL)
	return err
}

func splitEnv(key string, fallback []string) []string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	seen := map[string]bool{}
	result := make([]string, 0, 20)
	for _, item := range strings.Split(value, ",") {
		item = strings.ToLower(strings.TrimSpace(item))
		if item == "" || len(item) > 80 || seen[item] {
			continue
		}
		valid := true
		for _, char := range item {
			if !(char >= 'a' && char <= 'z') && !(char >= '0' && char <= '9') && char != '-' && char != '_' {
				valid = false
				break
			}
		}
		if valid {
			seen[item] = true
			result = append(result, item)
		}
		if len(result) == 20 {
			break
		}
	}
	if len(result) == 0 {
		return fallback
	}
	return result
}

func displayName(value string) string {
	words := strings.FieldsFunc(value, func(r rune) bool { return r == '-' || r == '_' })
	for i, word := range words {
		if word != "" {
			words[i] = strings.ToUpper(word[:1]) + word[1:]
		}
	}
	return strings.Join(words, " ")
}
func stringValue(value any) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprint(value))
}
func fallback(value, otherwise string) string {
	if value == "" {
		return otherwise
	}
	return value
}
func first(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[0]
}
func firstString(value any) string { values := stringSlice(value); return first(values) }
func stringSlice(value any) []string {
	values, ok := value.([]any)
	if !ok {
		return nil
	}
	result := make([]string, 0, len(values))
	for _, item := range values {
		if value := stringValue(item); value != "" {
			result = append(result, value)
		}
	}
	return result
}
func stringSliceFromMaps(value any, key string) []string {
	values, ok := value.([]any)
	if !ok {
		return nil
	}
	result := make([]string, 0, len(values))
	for _, item := range values {
		if row, ok := item.(map[string]any); ok {
			if value := stringValue(row[key]); value != "" {
				result = append(result, value)
			}
		}
	}
	return result
}
func boolValue(value any) bool { parsed, ok := value.(bool); return ok && parsed }
func classifyWorkplace(location string, remote bool) string {
	lower := strings.ToLower(location)
	if remote || strings.Contains(lower, "remote") || strings.Contains(lower, "work from home") {
		return "Remote"
	}
	if strings.Contains(lower, "hybrid") {
		return "Hybrid"
	}
	if location != "" {
		return "On-site"
	}
	return "Unknown"
}
func cleanText(value string) string {
	value = strings.ReplaceAll(value, "<br>", "\n")
	value = strings.ReplaceAll(value, "<br/>", "\n")
	for strings.Contains(value, "  ") {
		value = strings.ReplaceAll(value, "  ", " ")
	}
	return strings.TrimSpace(value)
}
func safeURL(value, fallbackURL string) string {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme != "https" || parsed.Host == "" {
		return fallbackURL
	}
	return parsed.String()
}
func parseTime(value any) *time.Time {
	raw := stringValue(value)
	if raw == "" {
		return nil
	}
	if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
		return &parsed
	}
	if number, err := strconv.ParseInt(raw, 10, 64); err == nil {
		if number < 10000000000 {
			number *= 1000
		}
		parsed := time.UnixMilli(number).UTC()
		return &parsed
	}
	return nil
}

func collectGDELT(ctx context.Context, db *sql.DB, workspaceID, query string) error {
	endpoint := "https://api.gdeltproject.org/api/v2/doc/doc?" + url.Values{
		"query": []string{query}, "mode": []string{"artlist"}, "format": []string{"json"}, "maxrecords": []string{"50"}, "sort": []string{"datedesc"},
	}.Encode()
	var result gdeltResponse
	if err := getJSON(ctx, endpoint, &result); err != nil {
		return err
	}
	for _, article := range result.Articles {
		if article.URL == "" || article.Title == "" {
			continue
		}
		_, err := db.ExecContext(ctx, `
			INSERT INTO signals (workspace_id, signal_type, title, description, impact, confidence, source_type, source_url, detected_at)
			VALUES ($1, 'news_event', $2, $3, 'medium', 70, 'gdelt', $4, now()) ON CONFLICT (workspace_id, source_url) WHERE source_url IS NOT NULL DO NOTHING`,
			workspaceID, article.Title, "News detected on "+article.Domain, article.URL)
		if err != nil {
			return err
		}
	}
	log.Printf("GDELT: processed %d articles", len(result.Articles))
	markIntegration(ctx, db, workspaceID, "gdelt")
	return nil
}

func collectHackerNews(ctx context.Context, db *sql.DB, workspaceID string) error {
	var ids []int
	if err := getJSON(ctx, "https://hacker-news.firebaseio.com/v0/topstories.json", &ids); err != nil {
		return err
	}
	limit := 20
	if len(ids) < limit {
		limit = len(ids)
	}
	for _, id := range ids[:limit] {
		var item hnItem
		if err := getJSON(ctx, fmt.Sprintf("https://hacker-news.firebaseio.com/v0/item/%d.json", id), &item); err != nil {
			continue
		}
		if item.Title == "" {
			continue
		}
		itemURL := item.URL
		if itemURL == "" {
			itemURL = fmt.Sprintf("https://news.ycombinator.com/item?id=%d", item.ID)
		}
		_, err := db.ExecContext(ctx, `
			INSERT INTO signals (workspace_id, signal_type, title, description, impact, confidence, source_type, source_url, detected_at)
			VALUES ($1, 'technology_event', $2, $3, 'low', 60, 'hacker_news', $4, now()) ON CONFLICT (workspace_id, source_url) WHERE source_url IS NOT NULL DO NOTHING`,
			workspaceID, item.Title, "Hacker News discussion by "+item.By, itemURL)
		if err != nil {
			return err
		}
	}
	log.Printf("Hacker News: processed %d stories", limit)
	markIntegration(ctx, db, workspaceID, "hacker_news")
	return nil
}

func markIntegration(ctx context.Context, db *sql.DB, workspaceID, provider string) {
	_, _ = db.ExecContext(ctx, `INSERT INTO integration_connections (workspace_id, provider, kind, status, last_synced_at, updated_at) VALUES ($1, $2, 'public', 'connected', now(), now()) ON CONFLICT (workspace_id, provider) DO UPDATE SET status = 'connected', last_synced_at = now(), error_message = '', updated_at = now()`, workspaceID, provider)
}

func getJSON(ctx context.Context, endpoint string, target any) error {
	const maxResponseBytes = 20 * 1024 * 1024
	requestContext, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(requestContext, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "DetectGrowth/0.1 signal-worker")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 1000))
		return fmt.Errorf("HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	return json.NewDecoder(io.LimitReader(response.Body, maxResponseBytes)).Decode(target)
}

func ensureWorkspace(ctx context.Context, db *sql.DB) (string, error) {
	var id string
	err := db.QueryRowContext(ctx, `SELECT id::text FROM workspaces ORDER BY created_at LIMIT 1`).Scan(&id)
	if err == sql.ErrNoRows {
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
func durationEnv(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		log.Printf("invalid %s=%q; using %s", key, value, fallback)
		return fallback
	}
	return parsed
}
