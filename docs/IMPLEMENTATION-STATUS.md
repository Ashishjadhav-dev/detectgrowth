# Functional workspace release

The application runs without the external Go API. Next.js handles local accounts,
HTTP-only sessions, and workspace records. Demo login seeds realistic sample data;
registered accounts also start with sample records that can be edited and deleted.

## Delivered

- Account registration, returning sign-in, one-click demo login, logout, profile
  changes, password changes, and seven-day server-validated sessions.
- Workspace-isolated company, contact, signal, opportunity, and list CRUD; search,
  category filters, saved records, CSV export, notes, and pipeline stage changes.
- Persisted dashboard tasks, job bookmarks, preferences, and notification read state.
- Responsive card layouts, mobile navigation and job dialogs, focus trapping,
  keyboard chart exploration, and full-surface chart hover.
- Deterministic sample jobs by default. `JOBS_DATA_MODE=live` enables public feeds.
- `npm run build` checks compilation, lint, and types.
- `TEST_BASE_URL=http://localhost:3002 npm run test:api` tests the running server.
- `npm run test:e2e` tests desktop and mobile against port 3002 by default.

## Local storage adapter

`AUTH_DATA_DIR` defaults to `.data` in the project directory. This directory is
ignored by Git and contains hashed credentials, sessions, and workspace records.
Back it up and keep it private. Use a single Node server with a writable persistent
volume for this adapter. It is **not** a multi-instance or serverless database.

The production Next.js application can be run with `npm run build` followed by
`npm run start`. The browser uses `/api/v1` service contracts, so replacing the
server adapter does not require rewriting page components.

## Production dependencies and limits

- Deploying to Vercel or multiple instances requires replacing the local storage
  adapter with a persistent database. The repository's existing Go/Postgres backend
  is a possible adapter, but its authentication and data contracts need integration
  testing before setting `NEXT_PUBLIC_API_URL` to that backend. The current local
  session is not a session in the external backend.
- Integration switches persist workspace configuration; they do not authorize
  third-party OAuth accounts or run ingestion workers.
- Notification preferences persist; email digests require an email provider and
  scheduler. Research summarizes stored evidence, not a connected AI service.
- Growth chart history is sample data; dashboard summary counts reflect the
  workspace records. Historical comparisons require a real history dataset.
- Workspace roles, team invitations, billing, and multi-user authorization are not
  implemented. Do not claim these capabilities based on the demo.
- Browser checks cover Chromium desktop and mobile viewport emulation. Physical
  iOS/Android devices and other browser engines still require testing.

## Branch structure

Feature branches are stacked: `feat/auth-session-foundation` →
`feat/workspace-data-persistence` → `feat/responsive-product-flows`.
The last branch contains the preceding changes. No branch is merged into develop
or release-next automatically.
