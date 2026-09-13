# DetectGrowth Go API

This directory contains the backend service for DetectGrowth. The Next.js application remains the frontend; this service owns the `/api/v1` API contract.

PostgreSQL and Redis local infrastructure is defined in the repository-level `docker-compose.yml`. Apply migrations in numeric order from `backend/migrations/`.

## Current status

The current local foundation includes:

- `GET /api/v1/health`
- `GET /api/v1/companies?q=...`
- `POST /api/v1/companies`
- JSON response and error envelopes
- CORS for the local Next.js app
- PostgreSQL-backed company, dashboard, people, signal, opportunity, and list APIs
- PostgreSQL-backed sign-up, sign-in, sign-out, and session lookup APIs
- HTTP-only, hashed, 30-day development sessions

The free-source signal worker is available at `cmd/worker`. It polls GDELT and Hacker News and stores deduplicated events in PostgreSQL.

The dashboard refreshes its API data every 30 seconds in the browser. The worker adds public-source signals from GDELT and Hacker News; LinkedIn, Google, and Instagram require provider credentials and are not faked as free public APIs.

## Run locally

Go 1.22 or newer is required:

```bash
go run ./cmd/server
```

In a second backend terminal, run the signal worker:

```bash
go run ./cmd/worker
```

Optional worker settings:

```env
SIGNAL_POLL_INTERVAL=10m
GDELT_QUERY=startup OR funding OR hiring
```

Start local infrastructure from the repository root:

```bash
docker compose up -d postgres redis
for migration in backend/migrations/*.sql; do
  psql "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable" -f "$migration"
done
```

The API listens on `http://localhost:8080` by default. Set `PORT` to change the port.

## Example

```bash
curl http://localhost:8080/api/v1/health

curl -i -X POST http://localhost:8080/api/v1/auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ashish","email":"ashish@example.com","password":"password123"}'

curl -X POST http://localhost:8080/api/v1/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Inc","domain":"acme.example"}'
```
