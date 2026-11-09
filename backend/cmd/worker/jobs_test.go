package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestClassifyWorkplace(t *testing.T) {
	tests := []struct {
		location string
		remote   bool
		want     string
	}{
		{"", false, "Unknown"},
		{"Remote - India", false, "Remote"},
		{"Bengaluru", true, "Remote"},
		{"New York (Hybrid)", false, "Hybrid"},
		{"London, UK", false, "On-site"},
	}
	for _, test := range tests {
		if got := classifyWorkplace(test.location, test.remote); got != test.want {
			t.Errorf("classifyWorkplace(%q, %t) = %q, want %q", test.location, test.remote, got, test.want)
		}
	}
}

func TestSafeURL(t *testing.T) {
	if got := safeURL("https://example.com/jobs/1", "https://fallback.example"); got != "https://example.com/jobs/1" {
		t.Fatalf("safeURL preserved URL = %q", got)
	}
	for _, value := range []string{"http://example.com", "javascript:alert(1)", "not a URL", ""} {
		if got := safeURL(value, "https://fallback.example"); got != "https://fallback.example" {
			t.Errorf("safeURL(%q) = %q, want fallback", value, got)
		}
	}
}

func TestParseTime(t *testing.T) {
	if got := parseTime("2026-11-10T00:00:00Z"); got == nil || !got.Equal(time.Date(2026, 11, 10, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("RFC3339 time parsed incorrectly: %v", got)
	}
	if got := parseTime("1731196800"); got == nil || got.Unix() != 1731196800 {
		t.Fatalf("seconds timestamp parsed incorrectly: %v", got)
	}
	if got := parseTime("not-a-date"); got != nil {
		t.Fatalf("invalid timestamp parsed as %v", got)
	}
}

func TestSplitEnvValidatesAndDeduplicatesBoards(t *testing.T) {
	const key = "JOB_GREENHOUSE_BOARDS_TEST"
	previous, existed := os.LookupEnv(key)
	defer func() {
		if existed {
			_ = os.Setenv(key, previous)
		} else {
			_ = os.Unsetenv(key)
		}
	}()
	_ = os.Setenv(key, "Airbnb, airbnb, bad.value, valid_board")
	got := splitEnv(key, []string{"fallback"})
	want := []string{"airbnb", "valid_board"}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("splitEnv() = %#v, want %#v", got, want)
	}
}

func TestFetchJobsNormalizesProviderPayloads(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/arbeitnow":
			_ = json.NewEncoder(w).Encode(map[string]any{"data": []any{map[string]any{"slug": "role-1", "title": "Engineer", "company_name": "Acme", "location": "Remote", "remote": true, "url": "https://acme.example/jobs/1", "tags": []string{"Go"}}}})
		case "/greenhouse":
			_ = json.NewEncoder(w).Encode(map[string]any{"jobs": []any{map[string]any{"id": 42, "title": "Designer", "location": map[string]any{"name": "New York (Hybrid)"}, "absolute_url": "https://acme.example/jobs/2", "departments": []any{map[string]any{"name": "Design"}}}}})
		default:
			_ = json.NewEncoder(w).Encode([]any{map[string]any{"id": "lever-1", "text": "Analyst", "categories": map[string]any{"location": "London", "team": "Data", "commitment": "Full-time"}, "hostedUrl": "https://acme.example/jobs/3"}})
		}
	}))
	defer server.Close()

	cases := []struct {
		path, kind, title, workplace string
	}{
		{"/arbeitnow", "arbeitnow", "Engineer", "Remote"},
		{"/greenhouse", "greenhouse", "Designer", "Hybrid"},
		{"/lever", "lever", "Analyst", "On-site"},
	}
	for _, test := range cases {
		jobs, err := fetchJobs(context.Background(), "Test", server.URL+test.path, test.kind, "Acme")
		if err != nil {
			t.Fatalf("fetchJobs(%s): %v", test.kind, err)
		}
		if len(jobs) != 1 || jobs[0].Title != test.title || jobs[0].Workplace != test.workplace || jobs[0].URL == "" {
			t.Errorf("fetchJobs(%s) = %#v", test.kind, jobs)
		}
	}
}
