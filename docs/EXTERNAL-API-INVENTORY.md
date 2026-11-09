# External API inventory

This document lists network services referenced by the application. It separates
actual programmatic integrations from ordinary outbound links.

## Job listing integrations

| Service | Endpoint | Used by | Purpose | Authentication |
| --- | --- | --- | --- | --- |
| Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` | `src/app/api/jobs/route.ts` | Public job-board feed | None |
| Remotive | `https://remotive.com/api/remote-jobs` | `src/app/api/jobs/route.ts`, `backend/cmd/worker/main.go` | Public remote job feed | None |
| Himalayas | `https://himalayas.app/jobs/api/search` | `src/app/api/jobs/route.ts` | Public remote job search with country and keyword filters | None; API key optional for higher limits |
| Adzuna India | `https://api.adzuna.com/v1/api/jobs/in/search/{page}` | `src/app/api/jobs/route.ts`, `backend/cmd/worker/main.go` | India job aggregator | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{board}/jobs` | `src/app/api/jobs/route.ts` | Public company career-board feed | None |
| Lever | `https://api.lever.co/v0/postings/{company}` | `src/app/api/jobs/route.ts` | Public company career-board feed | None |
| Google Favicon service | `https://www.google.com/s2/favicons` | `src/features/jobs/jobs-view.tsx` | Company-logo fallback | None |

The job API normalizes these sources into the internal `JobListing` type. Feed
requests have a timeout, bounded board input, HTTPS-only outbound job URLs, and
best-effort failure isolation. Live ingestion should eventually move to a
background worker and database rather than fetching third-party feeds during a
user request.

## Resume and language services

| Service | Endpoint | Used by | Purpose | Authentication |
| --- | --- | --- | --- | --- |
| LanguageTool | `https://api.languagetool.org/v2/check` | `src/lib/resume-analysis.ts` | Grammar and spelling checks | None |
| Datamuse | `https://api.datamuse.com/words` | `src/lib/resume-analysis.ts` | Related-word and keyword enrichment | None |
| unpkg | `https://unpkg.com/pdfjs-dist@6.4.299/.../pdf.worker.min.mjs` | `src/lib/resume-analysis.ts` | PDF.js worker asset | None |

## AI and email services

| Service | Endpoint | Used by | Purpose | Authentication |
| --- | --- | --- | --- | --- |
| OpenAI Responses API | Configured through the `openai` SDK | `src/app/api/ai/personalize/route.ts` | Resume, cover-letter, interview, and LinkedIn personalization | `OPENAI_API_KEY` |
| Resend | `https://api.resend.com/emails` | `backend/cmd/server/main.go` | Account and email delivery from the Go backend | `RESEND_API_KEY` |

## Signal-worker integrations

| Service | Endpoint | Used by | Purpose | Authentication |
| --- | --- | --- | --- | --- |
| GDELT | `https://api.gdeltproject.org/api/v2/doc/doc` | `backend/cmd/worker/main.go` | Public news and company-signal discovery | None |
| Hacker News Firebase API | `https://hacker-news.firebaseio.com/v0` | `backend/cmd/worker/main.go` | Public technology-news signal discovery | None |

## Outbound links that are not API integrations

The networking page links users to LinkedIn Jobs, Wellfound, and Indeed. These
are ordinary browser links; the application does not call their APIs.

LinkedIn is intentionally not included as a job-feed provider. LinkedIn's
official Job Posting API is an authorized Talent Solutions partner API for
posting and managing a customer's jobs; it is not a general public search API
for importing LinkedIn's job-search results. LinkedIn's User Agreement also
prohibits unauthorized scraping and automated copying of the service. A future
LinkedIn integration therefore requires explicit LinkedIn approval and an
appropriate partner agreement. Until then, the compliant options are to link
users to LinkedIn Jobs or ingest the same employers' authorized ATS feeds
(such as Greenhouse or Lever) when available.

## Internal APIs

These are application-owned endpoints, not open APIs:

- `/api/jobs`
- `/api/auth/[action]`
- `/api/v1/[...segments]`
- `/api/ai/personalize`
- The optional external Go API configured with `NEXT_PUBLIC_API_URL`

Before production launch, each external integration should have an owner,
timeout, retry policy, rate-limit policy, privacy review, monitoring, and a
documented fallback behavior.
