# DetectGrowth Go API

This directory contains the backend service for DetectGrowth. The Next.js application remains the frontend; this service owns the `/api/v1` API contract.

PostgreSQL and Redis local infrastructure is defined in the repository-level `docker-compose.yml`. The initial schema is in `backend/migrations/001_initial_schema.sql`.

## Current status

The initial foundation includes:

- `GET /api/v1/health`
- `GET /api/v1/companies?q=...`
- `POST /api/v1/companies`
- JSON response and error envelopes
- CORS for the local Next.js app
- An in-memory company store for local API wiring

The in-memory store is intentionally temporary. The next code milestone is wiring the Go repositories to PostgreSQL, then adding workspace-aware authentication and permission checks.

## Run locally

Go 1.22 or newer is required:

```bash
go run ./cmd/server
```

Start local infrastructure from the repository root:

```bash
docker compose up -d postgres redis
psql "postgres://detectgrowth:detectgrowth_local@localhost:5432/detectgrowth?sslmode=disable" -f backend/migrations/001_initial_schema.sql
```

The API listens on `http://localhost:8080` by default. Set `PORT` to change the port.

## Example

```bash
curl http://localhost:8080/api/v1/health

curl -X POST http://localhost:8080/api/v1/companies \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Inc","domain":"acme.example"}'
```
