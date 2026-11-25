# Functional workspace release

The application runs without the external Go API. Next.js handles local accounts,
HTTP-only sessions, and workspace records. Demo login seeds realistic sample data;
registered accounts also start with sample records that can be edited and deleted.

## Delivered

- Lead discovery uses Photon and Overpass by default. Searches include a source
  link and explain which priority signal was observed. The website check can
  refine the priority and outreach draft.
- The lead shortlist persists stages and notes, exports OpenStreetMap records to
  CSV, and can create a workspace opportunity without duplicates. Demo shortlists
  live in the browser.

- Account registration, returning sign-in, one-click demo login, logout, profile
  changes, password changes, and seven-day server-validated sessions.
- Forgotten-password recovery using a code issued during registration. Recovery
  codes are stored hashed on the server, rotate after use, and revoke old sessions.
  Email verification and emailed reset links still require an email provider.
- Workspace-isolated company, contact, signal, opportunity, and list CRUD; search,
  category filters, saved records, CSV export, notes, and pipeline stage changes.
- Persisted dashboard tasks, job bookmarks, preferences, and notification read state.
- Responsive card layouts, mobile navigation and job dialogs, focus trapping,
  keyboard chart exploration, and full-surface chart hover.
- Deterministic sample jobs by default. `JOBS_DATA_MODE=live` enables public feeds.
- Resume workflow now supports PDF/DOCX extraction, content-based ATS scoring,
  role comparison, tailored resume content, cover-letter drafts, career-gap
  guidance, interview practice, profile optimization, recruiter outreach
  templates, application tracking, and saved browser job alerts.
- Optional server-side OpenAI personalization is wired for resume rewrites,
  cover letters, interview feedback, and LinkedIn profile improvements through
  `/api/ai/personalize`; configure `OPENAI_API_KEY` and `OPENAI_MODEL` to enable it.
- `npm run build` checks compilation, lint, and types.
- `TEST_BASE_URL=http://localhost:3002 npm run test:api` tests the running server.
- `npm run test:e2e` tests desktop and mobile against port 3002 by default.
  Start the test server with `JOBS_DATA_MODE=demo` for deterministic job fixture checks.

## Local storage adapter

`AUTH_DATA_DIR` defaults to `.data` in the project directory. This directory is
ignored by Git and contains hashed credentials, sessions, and workspace records.
Back it up and keep it private. Use a single Node server with a writable persistent
volume for this adapter. It is **not** a multi-instance or serverless database.

The production Next.js application can be run with `npm run build` followed by
`npm run start`. The browser uses `/api/v1` service contracts, so replacing the
server adapter does not require rewriting page components.

## Production dependencies and limits

- The filesystem adapter is intended for a single instance with a persistent
  volume. A Neon adapter is available through `DATABASE_URL`; its shared
  workspace state still needs cross-instance concurrency validation.
  Direct browser access to the optional Go backend uses a separate session and
  only covers its implemented API contracts. Set `JOBS_BACKEND_URL` to consume
  the Go jobs catalog independently.
- Integration switches persist workspace configuration; they do not authorize
  third-party OAuth accounts or run ingestion workers.
- Notification preferences persist; email digests require an email provider and
  scheduler. Research summarizes stored evidence, not a connected AI service.
- Applications and job-alert preferences persist through the workspace API with
  local fallback for offline/demo use. Browser alerts can request notification
  permission; production email alerts still require a server-side scheduler,
  delivery provider, unsubscribe handling, and a notification history model.
- Resume tailoring currently uses a local scoring rubric plus public
  LanguageTool/Datamuse enrichment. Production use should proxy or self-host
  these services and add consent, retention, and redaction controls.
- AI personalization requires an OpenAI API key, provider billing/limits,
  server-side rate limiting, usage metering, prompt/version monitoring, and
  privacy/retention controls before a public launch.
- Historical growth comparisons still require a real event history dataset.
- Workspace roles, team invitations, billing, and multi-user authorization are not
  implemented. Do not claim these capabilities based on the demo.
- Browser checks cover Chromium desktop and mobile viewport emulation. Physical
  iOS/Android devices and other browser engines still require testing.

## Branch structure

Feature branches are stacked: `feat/auth-session-foundation` →
`feat/workspace-data-persistence` → `feat/responsive-product-flows` →
`feat/account-recovery`.
The last branch contains the preceding changes. No branch is merged into develop
or release-next automatically.
