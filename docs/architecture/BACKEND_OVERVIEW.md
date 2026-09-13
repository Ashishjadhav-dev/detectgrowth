# DetectGrowth Backend Overview

## Goal
Build a backend that matches the current DetectGrowth UI without creating unnecessary service sprawl.

## Recommended shape
- Keep it as a modular monolith inside the same repo for now.
- Use a single API namespace, ideally `/api/v1`.
- Treat Postgres as the source of truth.
- Keep auth, tenancy, RBAC, and audit logging in the shared foundation layer.
- Keep product modules isolated by domain so the UI can grow without coupling.

## Backend layers
- `auth` for sign-in, sign-up, sessions, recovery, and SSO
- `tenancy` for workspaces, memberships, invites, and roles
- `catalog` for companies, people, and signals
- `prospecting` for opportunities, lists, watchlists, and saved searches
- `automation` for alerts, tasks, imports, integrations, and jobs
- `insights` for dashboard aggregates, research, ICP, and analytics

## API conventions
- Use JSON only.
- Return a stable envelope for success and errors.
- Keep list endpoints paginated.
- Scope every request to a workspace.
- Require explicit permissions for any workspace data.
- Prefer server-side filters and sorting for all table views.

## Implementation order
1. Auth and tenancy
2. Core domain tables
3. List/search endpoints
4. Detail and timeline endpoints
5. Automation and integrations
6. Analytics and research jobs

## Runtime decisions
- Session cookies for browser auth.
- Background jobs for research, enrichment, imports, and alert delivery.
- Server validation on every write endpoint.
- Soft deletes only where recovery matters.

