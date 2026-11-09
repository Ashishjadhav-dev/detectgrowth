# DetectGrowth

DetectGrowth is a full-stack B2B growth intelligence SaaS built to help teams discover companies, monitor business signals, manage opportunities, and organize research workflows.

The project demonstrates production-style frontend architecture, REST API design, authentication, multi-tenant workspace isolation, persistent data flows, background processing, and responsive SaaS UX.

---

## Core Features

### Authentication & Account Security
- Sign up and sign in
- Server-managed sessions
- Protected application routes
- Account recovery
- Recovery codes
- Session revocation after password/reset flows

### Workspace Management
- Workspace-scoped application data
- Persistent company and opportunity records
- Workspace-aware backend queries
- Multi-tenant architecture foundation

### Company Intelligence
- Company discovery and management
- Growth signal tracking
- Company-level research workflows
- Search and filtering

### Signals
- Business signal ingestion
- External source processing
- Background worker architecture
- Duplicate prevention using database constraints

### Opportunities
- Create and manage opportunities
- Associate opportunities with workspace data
- Persistent CRUD workflows

### Dashboard
- Growth metrics
- Interactive trend visualization
- 7 / 30 / 90 day ranges
- Refresh states
- API-backed data with resilient fallback states
- Responsive desktop and mobile UX

---

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Reusable feature + UI component architecture

## Run the frontend

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

The frontend uses `NEXT_PUBLIC_API_URL` for API requests and defaults to
`http://localhost:8080`. Copy `.env.example` to `.env.local` when connecting
to a different backend.

### AI personalization

Resume rewriting, cover letters, interview feedback, and LinkedIn optimization
use the server-side OpenAI Responses API route. Add `OPENAI_API_KEY` and
optionally `OPENAI_MODEL` to the Next.js server environment. The key must not
use a `NEXT_PUBLIC_` prefix. Requests are sent with provider storage disabled;
production deployments should add consent, retention, redaction, rate limits,
and usage monitoring.

## Run the backend locally

The backend requires Go 1.22+, PostgreSQL, and Redis. Copy
`backend/.env.example` to `backend/.env`, then start the infrastructure and
apply the migrations:

```bash
docker compose up -d postgres redis
for migration in backend/migrations/*.sql; do
  psql "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable" -f "$migration"
done
```

In separate terminals, start the API and optional signal worker:

```bash
cd backend && go run ./cmd/server
cd backend && go run ./cmd/worker
```

For a Vercel deployment, set `NEXT_PUBLIC_API_URL` to the publicly reachable
backend URL. Vercel deploys the Next.js frontend; PostgreSQL, Redis, and the Go
API/worker need to run on a separate host or managed service.

## Quality checks
```bash
npm run typecheck
npm run lint
npm run build

cd backend && go test ./...
```

## One-shot container deployment

The repository includes `docker-compose.production.yml` for deploying the web
app, Go API, job/signal worker, PostgreSQL, Redis, and migrations as one
Compose project. Copy the required production values into a shell environment
or an uncommitted `.env` file, then run:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Required values are `POSTGRES_PASSWORD` and `JWT_SECRET`. For a public
deployment, set `API_PUBLIC_URL` to the externally reachable Go API URL; it is
baked into the browser bundle because the browser must be able to send session
requests to the API. Set `FRONTEND_ORIGIN`, `APP_URL`, `COOKIE_SECURE=true`,
and a strong `JWT_SECRET` for HTTPS production. The `migrations` service runs
all SQL migrations before the API, worker, and web services start.

This Compose deployment is a single release operation, but it still runs
multiple containers. PostgreSQL and Redis volumes must be backed up, and the
API/worker need a host or platform that supports persistent processes. Docker
image builds should be performed with Docker Desktop or a CI builder enabled.

## Structure
- `src/app` routes
- `src/components/ui` primitives
- `src/components/layout` shell
- `src/features` feature-level sections
- `src/data` realistic mock data
- `src/lib` shared utilities

The UI keeps presentation data typed, with API-backed feature views and local
fallback/demo content where the backend contract is not yet complete.

## Backend contract
- `docs/architecture/BACKEND_OVERVIEW.md`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATABASE_SCHEMA.md`

These docs define the backend shape for the product so the implementation can stay consistent with the UI and multi-tenant model.
