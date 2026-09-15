# DetectGrowth

A clean Next.js + TypeScript + Tailwind starter implementing the DetectGrowth product direction from the supplied reference.

## Stack
- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
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
