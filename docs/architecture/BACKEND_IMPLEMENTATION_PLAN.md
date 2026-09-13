# DetectGrowth Backend Implementation Plan

## 1. Purpose

This document defines the implementation plan for turning the current DetectGrowth Next.js UI prototype into a production-ready, multi-tenant SaaS application.

The repository currently contains a well-structured frontend with typed mock data. The backend architecture, API contracts, and database schema are documented, but the runtime backend has not yet been implemented.

This plan prioritizes a modular monolith: the backend will initially live in the same Next.js repository, with clear domain boundaries that allow individual workers or services to be extracted later.

## 2. Current state

### Already available

- Next.js 15 App Router
- React 19 and strict TypeScript
- Tailwind UI and reusable components
- Feature-oriented UI structure
- Routes for dashboard, discovery, companies, people, signals, opportunities, lists, ICP, research, integrations, settings, auth, and onboarding
- Typed mock data in `src/data/mock.ts`
- API contracts in `docs/architecture/API_CONTRACTS.md`
- Database design in `docs/architecture/DATABASE_SCHEMA.md`
- Backend principles in `docs/architecture/BACKEND_OVERVIEW.md`

### Not yet implemented

- Database connection and migrations
- Authentication and sessions
- Workspace resolution and tenant isolation
- RBAC and permission enforcement
- API route handlers
- Server-side validation
- Business/service layer
- Background jobs
- External integrations
- Production data fetching from the frontend
- Automated backend and end-to-end tests

## 3. Recommended technology choices

| Area | Recommendation | Reason |
|---|---|---|
| Web/API runtime | Next.js Route Handlers | Already installed and keeps deployment simple |
| Database | PostgreSQL | Relational data, tenant isolation, analytics, and search-friendly indexes |
| ORM | Prisma or Drizzle | Type-safe queries and migrations; choose one and use it consistently |
| Authentication | Auth.js, Clerk, or Supabase Auth | Avoid implementing password security and session rotation manually |
| Validation | Zod | Shared request and response schemas between server and UI |
| Jobs | Redis + BullMQ | Handles enrichment, imports, reports, and alert delivery asynchronously |
| File storage | S3-compatible storage | CSV imports, exports, and report files |
| Monitoring | Sentry plus structured logs | Error tracking and request-level diagnosis |
| Unit/API tests | Vitest | Fast TypeScript-native test runner |
| Browser tests | Playwright | Validates real user flows across the App Router |

The exact vendors can change. The important decision is to keep the interfaces vendor-neutral, especially for authentication, storage, enrichment, and integrations.

## 4. Target architecture

```text
src/
  app/
    api/
      v1/
        health/route.ts
        auth/
        workspaces/
        dashboard/
        companies/
        people/
        signals/
        opportunities/
        lists/
        tasks/
        research-jobs/
        icp-profiles/
        integrations/
        imports/
        analytics/
  server/
    auth/
      current-user.ts
      session.ts
    db/
      client.ts
      migrations/
    http/
      errors.ts
      response.ts
      pagination.ts
    tenancy/
      workspace-context.ts
      require-workspace.ts
    permissions/
      permissions.ts
      require-permission.ts
    validators/
      common.ts
      companies.ts
      people.ts
    repositories/
      companies-repository.ts
      people-repository.ts
    services/
      companies-service.ts
      opportunities-service.ts
      research-service.ts
    jobs/
      queue.ts
      processors/
    integrations/
      provider.ts
      adapters/
  types/
    api.ts
```

### Layer responsibilities

1. Route handlers parse the request, authenticate it, resolve the workspace, validate input, call a service, and serialize the response.
2. Services contain business rules and transactions.
3. Repositories contain database access and always receive an explicit workspace scope where applicable.
4. Validators define request and query schemas.
5. The UI calls API/query functions and does not own business logic.

Do not put database queries directly in React components or duplicate authorization checks across UI screens.

## 5. Request lifecycle

Every protected request should follow this sequence:

```text
HTTP request
  → request ID and logging context
  → session authentication
  → workspace resolution
  → permission check
  → query/body validation
  → service method
  → repository/database transaction
  → audit event where needed
  → stable JSON response
```

Every domain query must be workspace-scoped. A route should never fetch a record by ID alone. It should verify both the record ID and the active workspace ID in the same query or transaction.

## 6. Data model implementation order

### Foundation tables

Implement first:

- `users`
- `workspaces`
- `roles`
- `permissions`
- `role_permissions`
- `workspace_memberships`
- `invitations`
- `sessions`
- `audit_logs`

Required constraints:

- Unique user email
- Unique workspace slug
- Unique workspace/user membership pair
- Unique permission key
- Foreign keys on every relationship
- `created_at` and `updated_at` timestamps
- Indexed workspace IDs

### Core product tables

Implement next:

- `companies`
- `people`
- `company_people`
- `signals`
- `signal_evidence`
- `opportunities`
- `opportunity_score_factors`
- `opportunity_notes`
- `lists`
- `list_items`
- `saved_searches`
- `tasks`
- `activity_events`
- `bookmarks`

### Automation and intelligence tables

Implement after the core CRUD flows:

- `research_jobs`
- `research_reports`
- `icp_profiles`
- `icp_matches`
- `alerts`
- `alert_history`
- `notifications`
- `integrations`
- `integration_sync_runs`
- `imports`
- `import_mappings`
- `background_jobs`

Use explicit status fields for long-running work, for example `queued`, `running`, `completed`, `failed`, and `cancelled`.

## 7. API implementation roadmap

### Milestone 1: Health and account foundation

Implement:

- `GET /api/v1/health`
- `POST /api/v1/auth/sign-up`
- `POST /api/v1/auth/sign-in`
- `POST /api/v1/auth/sign-out`
- `POST /api/v1/auth/refresh` if the selected auth provider requires it
- `GET /api/v1/me`
- `PATCH /api/v1/me`

Acceptance criteria:

- Unauthenticated requests receive a consistent `401` response.
- Sessions use secure, HTTP-only cookies where cookie sessions are selected.
- Passwords are never stored or logged by application code.
- Sign-in and sign-out work through the existing auth screen.

### Milestone 2: Workspaces and permissions

Implement workspace creation, membership, invitations, role assignment, and workspace switching.

Required checks:

- A user can access only workspaces where they have an active membership.
- Only authorized roles can invite, remove, or modify members.
- Every write operation records an audit event.

### Milestone 3: Companies vertical slice

Implement the first complete product workflow:

- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:companyId`
- `PATCH /api/v1/companies/:companyId`
- `DELETE /api/v1/companies/:companyId`
- Company people, signals, activity, notes, growth, and recommendations endpoints as read models become available

List query requirements:

- `q` search
- `page` and `limit`
- `sort` and `order`
- Validated filters for industry, location, employee range, revenue range, and status
- Maximum page size, such as 100
- Total count or cursor metadata

Frontend completion means replacing the relevant mock imports with a typed API query layer and adding loading, error, empty, and retry states.

### Milestone 4: People, signals, and opportunities

Implement these in order:

1. People list and detail
2. Signals list, detail, evidence, and timeline
3. Opportunities list, detail, score, explanation, and recommendations

Business rules should live in services. For example, changing an opportunity stage may create an activity event and update `last_activity_at` in one transaction.

### Milestone 5: Lists, tasks, and activity

Implement saved views and workflow management:

- Lists and list items
- Saved searches
- Bookmarks
- Tasks
- Activity feed
- Notifications

Ensure list item additions are idempotent so repeated client requests do not create duplicates.

### Milestone 6: Dashboard, ICP, and research

Implement dashboard summaries as server-side aggregate queries rather than sending raw tables to the browser.

Research and ICP matching should be asynchronous:

```text
POST /api/v1/research-jobs
  → create queued job
  → enqueue worker task
  → return job ID

GET /api/v1/research-jobs/:id
  → return status and progress

GET /api/v1/research-jobs/:id/report
  → return completed report
```

### Milestone 7: Imports and integrations

Implement CSV imports before third-party integrations because imports establish the mapping, validation, deduplication, and job patterns needed by integrations.

Import workflow:

1. Upload file
2. Create import record
3. Inspect headers
4. Return mapping suggestions
5. Validate a preview batch
6. Confirm processing
7. Process asynchronously
8. Store row-level errors and summary counts

Integration tokens must be encrypted at rest and must never be returned to the client.

## 8. API conventions

### Success response

```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "workspaceId": "ws_123"
  }
}
```

### List response

```json
{
  "data": [],
  "meta": {
    "requestId": "req_123",
    "workspaceId": "ws_123",
    "page": 1,
    "limit": 25,
    "total": 120,
    "hasNextPage": true
  }
}
```

### Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "fields": {}
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Use stable error codes such as `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, and `INTERNAL_ERROR`.

## 9. Frontend integration plan

Create a typed API client with separate query and mutation functions:

```text
src/lib/api/
  client.ts
  companies.ts
  people.ts
  signals.ts
  opportunities.ts
```

Recommended migration order:

1. Dashboard summary
2. Companies
3. People
4. Signals
5. Opportunities
6. Lists and tasks
7. Research and ICP

For each feature:

- Define API response types.
- Add server-side query functions.
- Replace mock imports.
- Add URL-backed filters and pagination.
- Add loading and error states.
- Add optimistic updates only after the basic mutation works reliably.

## 10. Security requirements

Required before production:

- Workspace isolation tests for every resource
- Permission checks on every protected write route
- Input validation on every body, query, and path parameter
- Rate limiting for authentication and expensive endpoints
- Secure session cookie configuration
- CSRF protection if cookie-based mutations are used
- Encryption for OAuth and integration credentials
- No secrets in client bundles or logs
- File type, size, and content validation for imports
- Audit logging for membership, permission, and sensitive data changes
- Database backups and tested restore procedures

The most important automated security test is: a user in Workspace A cannot read, update, delete, or infer records belonging to Workspace B.

## 11. Background job design

Jobs should be idempotent, retryable, observable, and safe to run more than once.

Each job should store:

- Job type
- Workspace ID
- Actor user ID where relevant
- Input reference, not sensitive payloads
- Status
- Progress
- Attempt count
- Error code and message
- Started and completed timestamps

Initial job types:

- `research.generate-report`
- `icp.run-matching`
- `imports.process`
- `integrations.sync`
- `alerts.deliver`
- `analytics.refresh`

## 12. Testing strategy

### Unit tests

Test validators, permission rules, scoring logic, filtering, deduplication, and service behavior.

### API integration tests

Test status codes, response shapes, validation failures, authentication, permissions, pagination, and transaction behavior.

### Tenant isolation tests

Create two workspaces with similar records and verify all read/write endpoints enforce workspace boundaries.

### End-to-end tests

Cover:

- Sign up and sign in
- Create workspace
- Invite member
- Browse companies
- Create and update opportunity
- Add a list item
- Start a research job
- Upload and process an import

### Quality gates

Every pull request should pass:

```text
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:e2e
```

## 13. Environments and deployment

Use three environments:

- Local: developer database and local worker
- Staging: production-like database and external service test credentials
- Production: protected database, worker, storage, and monitoring

Deployment components:

- Next.js web/API application
- PostgreSQL database
- Redis instance
- Background worker
- Object storage
- Error monitoring

Run migrations as an explicit deployment step. Do not silently mutate production schema from application startup.

## 14. Suggested delivery sequence

### Sprint 1: Backend foundation

- Select auth provider and ORM
- Add environment validation
- Add database client
- Add migrations
- Add health route
- Add API response/error helpers

### Sprint 2: Auth and tenancy

- Authentication flows
- Users and workspaces
- Memberships, roles, and permissions
- Workspace context middleware/helpers
- Tenant isolation tests

### Sprint 3: Companies

- Companies schema and repository
- CRUD services and routes
- Search/filter/pagination
- Frontend API integration
- API tests

### Sprint 4: People, signals, opportunities

- Schemas and repositories
- Detail and timeline endpoints
- Opportunity scoring
- Activity and audit events
- Frontend integration

### Sprint 5: Lists, tasks, dashboard

- Saved searches
- Lists and bookmarks
- Tasks and notifications
- Dashboard aggregate endpoints

### Sprint 6: Jobs and intelligence

- Redis and worker
- Research jobs
- ICP matching
- Alerts
- Progress and failure states

### Sprint 7: Imports and integrations

- CSV import pipeline
- Provider adapter interface
- First integration
- Sync history and retries

### Sprint 8: Production hardening

- Security review
- Performance review
- Accessibility and frontend error states
- Monitoring and alerts
- Backup/restore test
- Staging launch

## 15. Definition of done

The backend is ready for an initial production launch when:

- Users can authenticate and belong to workspaces.
- Workspace and permission checks are enforced server-side.
- Companies, people, signals, and opportunities use real database data.
- The main dashboard reads server-side aggregates.
- Core mutations are validated, transactional, and audited where appropriate.
- Background jobs handle slow work.
- API and tenant-isolation tests pass.
- Production errors and job failures are observable.
- Database backups and migrations are operational.
- The frontend no longer depends on `src/data/mock.ts` for core flows.

## 16. Immediate next action

Start with the Companies vertical slice after setting up authentication and tenancy. It is the smallest feature that exercises database modeling, workspace security, validation, pagination, detail pages, mutations, and frontend integration. Once it works, use it as the reference implementation for the remaining domains.
