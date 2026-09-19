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
- App Router
- Server and Client Components
- Responsive reusable UI components

### Backend

- Go
- REST APIs
- Server-side sessions
- Background workers
- PostgreSQL
- pgx

### Infrastructure

- Docker Compose
- PostgreSQL 16
- Redis 7
- Vercel-ready frontend deployment

> Redis is provisioned as part of the local infrastructure and is intended for caching, rate limiting, distributed coordination, and other infrastructure use cases as the system evolves.

---

# Architecture

```mermaid
flowchart LR
    U[User] --> FE[Next.js Frontend]

    FE --> API[Go REST API]

    API --> AUTH[Authentication / Sessions]
    API --> DOMAIN[Domain Services]

    DOMAIN --> DB[(PostgreSQL)]

    WORKER[Background Worker] --> EXT[External Data Sources]
    WORKER --> DB

    API -. caching / coordination .-> REDIS[(Redis)]
