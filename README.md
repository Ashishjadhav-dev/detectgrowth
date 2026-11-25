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

The browser uses the same-origin Next.js APIs by default. Sign in or choose
the demo account, then open **Lead discovery**. The Go service is optional for
the local lead and career workspaces.

### DetectGrowth lead discovery

Choose a city or neighborhood, a category, and a radius. Photon resolves the
location and Overpass returns nearby OpenStreetMap businesses with any published
phone, email, and website fields. If Overpass is unavailable, Photon can return
a smaller set from the map name index. The UI marks those results as limited
because the index does little contact enrichment.

Use the public listing or website check to qualify a prospect. Save OpenStreetMap
leads to your shortlist, add notes, move leads through stages, and export filtered
results as CSV. Registered users can add a saved lead to the opportunity pipeline.
The demo shortlist lives in the current browser and example results use fictional
details.

`LEADS_DATA_MODE=osm` is the credential-free default. Use `demo` for fixtures.
`LEADS_PHOTON_URL` and `LEADS_OVERPASS_URL` can point to hosted or self-hosted
equivalents. Small interactive searches use shared public instances by default.
The regular search shows provider errors when live data is unavailable and offers
a separate example preview. The legacy `LEADS_DATA_MODE=google` option requires
`GOOGLE_MAPS_API_KEY` and provides a display-only view of Google Places results.

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

Vercel can run the Next.js routes with a supported Neon `DATABASE_URL`. The
filesystem adapter needs a writable persistent volume and a single instance.
The optional Go API and worker run on a separate host or managed service. Set
`JOBS_BACKEND_URL` to use their jobs catalog while keeping the workspace session
and lead data in Next.js. The legacy direct-Go mode selected by
`NEXT_PUBLIC_API_URL` uses a separate session and does not support the Next.js
lead shortlist or other Next.js-only workspace routes.

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

Required values are `POSTGRES_PASSWORD` and `JWT_SECRET`. By default the web
container uses a same-origin workspace API and a persistent `web-state` volume.
The Go API supplies the public jobs catalog through the internal Compose network.
Set `APP_URL` and `FRONTEND_ORIGIN` for your deployment. `API_PUBLIC_URL`
explicitly opts the browser into legacy direct-Go mode. The migrations service
runs all SQL migrations before the API, worker, and web services start.

This Compose deployment is a single release operation, but it still runs
multiple containers. PostgreSQL and Redis volumes must be backed up, and the
web state also needs a backup, and the API/worker need a host or platform that supports persistent processes. Docker
image builds should be performed with Docker Desktop or a CI builder enabled.

## Structure
- `src/app` routes
- `src/components/ui` primitives
- `src/components/layout` shell
- `src/features` feature-level sections
- `src/data` example workspace and job records
- `src/lib` shared utilities

The UI keeps presentation data typed, with API-backed feature views and local
fallback/demo content where the backend contract is not yet complete.

## Backend contract
- `docs/architecture/BACKEND_OVERVIEW.md`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATABASE_SCHEMA.md`

These docs define the backend shape for the product so the implementation can stay consistent with the UI and multi-tenant model.
