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

func main() {
	databaseURL := envOr("DATABASE_URL", "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable")
	db, err := sql.Open("pgx", databaseURL)
	if err != nil { log.Fatal(err) }
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	workspaceID, err := ensureWorkspace(ctx, db)
	cancel()
	if err != nil { log.Fatalf("workspace: %v", err) }

	interval := durationEnv("SIGNAL_POLL_INTERVAL", 10*time.Minute)
	query := envOr("GDELT_QUERY", "startup OR funding OR hiring OR \"product launch\"")
	log.Printf("signal worker started; polling every %s", interval)

	for {
		if err := collectGDELT(context.Background(), db, workspaceID, query); err != nil { log.Printf("GDELT: %v", err) }
		if err := collectHackerNews(context.Background(), db, workspaceID); err != nil { log.Printf("Hacker News: %v", err) }
		time.Sleep(interval)
	}
}

func collectGDELT(ctx context.Context, db *sql.DB, workspaceID, query string) error {
	endpoint := "https://api.gdeltproject.org/api/v2/doc/doc?" + url.Values{
		"query": []string{query}, "mode": []string{"artlist"}, "format": []string{"json"}, "maxrecords": []string{"50"}, "sort": []string{"datedesc"},
	}.Encode()
	var result gdeltResponse
	if err := getJSON(ctx, endpoint, &result); err != nil { return err }
	for _, article := range result.Articles {
		if article.URL == "" || article.Title == "" { continue }
		_, err := db.ExecContext(ctx, `
			INSERT INTO signals (workspace_id, signal_type, title, description, impact, confidence, source_type, source_url, detected_at)
			VALUES ($1, 'news_event', $2, $3, 'medium', 70, 'gdelt', $4, now()) ON CONFLICT (workspace_id, source_url) WHERE source_url IS NOT NULL DO NOTHING`,
			workspaceID, article.Title, "News detected on "+article.Domain, article.URL)
		if err != nil { return err }
	}
	log.Printf("GDELT: processed %d articles", len(result.Articles))
	markIntegration(ctx, db, workspaceID, "gdelt")
	return nil
}

func collectHackerNews(ctx context.Context, db *sql.DB, workspaceID string) error {
	var ids []int
	if err := getJSON(ctx, "https://hacker-news.firebaseio.com/v0/topstories.json", &ids); err != nil { return err }
	limit := 20
	if len(ids) < limit { limit = len(ids) }
	for _, id := range ids[:limit] {
		var item hnItem
		if err := getJSON(ctx, fmt.Sprintf("https://hacker-news.firebaseio.com/v0/item/%d.json", id), &item); err != nil { continue }
		if item.Title == "" { continue }
		itemURL := item.URL
		if itemURL == "" { itemURL = fmt.Sprintf("https://news.ycombinator.com/item?id=%d", item.ID) }
		_, err := db.ExecContext(ctx, `
			INSERT INTO signals (workspace_id, signal_type, title, description, impact, confidence, source_type, source_url, detected_at)
			VALUES ($1, 'technology_event', $2, $3, 'low', 60, 'hacker_news', $4, now()) ON CONFLICT (workspace_id, source_url) WHERE source_url IS NOT NULL DO NOTHING`,
			workspaceID, item.Title, "Hacker News discussion by "+item.By, itemURL)
		if err != nil { return err }
	}
	log.Printf("Hacker News: processed %d stories", limit)
	markIntegration(ctx, db, workspaceID, "hacker_news")
	return nil
}

func markIntegration(ctx context.Context, db *sql.DB, workspaceID, provider string) {
	_, _ = db.ExecContext(ctx, `INSERT INTO integration_connections (workspace_id, provider, kind, status, last_synced_at, updated_at) VALUES ($1, $2, 'public', 'connected', now(), now()) ON CONFLICT (workspace_id, provider) DO UPDATE SET status = 'connected', last_synced_at = now(), error_message = '', updated_at = now()`, workspaceID, provider)
}

func getJSON(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil { return err }
	req.Header.Set("User-Agent", "DetectGrowth/0.1 signal-worker")
	response, err := http.DefaultClient.Do(req)
	if err != nil { return err }
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 { body, _ := io.ReadAll(io.LimitReader(response.Body, 1000)); return fmt.Errorf("HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body))) }
	return json.NewDecoder(response.Body).Decode(target)
}

func ensureWorkspace(ctx context.Context, db *sql.DB) (string, error) {
	var id string
	err := db.QueryRowContext(ctx, `SELECT id::text FROM workspaces ORDER BY created_at LIMIT 1`).Scan(&id)
	if err == sql.ErrNoRows { err = db.QueryRowContext(ctx, `INSERT INTO workspaces (name, slug) VALUES ('DetectGrowth Local', 'detectgrowth-local') RETURNING id::text`).Scan(&id) }
	return id, err
}

func envOr(key, fallback string) string { if value := os.Getenv(key); value != "" { return value }; return fallback }
func durationEnv(key string, fallback time.Duration) time.Duration { value := os.Getenv(key); if value == "" { return fallback }; parsed, err := time.ParseDuration(value); if err != nil { log.Printf("invalid %s=%q; using %s", key, value, fallback); return fallback }; return parsed }
