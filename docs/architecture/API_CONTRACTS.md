# DetectGrowth API Contracts

## Base
- Version prefix: `/api/v1`
- All data endpoints are workspace-scoped
- All list endpoints should support pagination and server-side filtering
- Common query params: `q`, `page`, `limit`, `sort`, `order`

## Health
- `GET /api/v1/health`

## Auth and account
- `POST /api/v1/auth/sign-up`
- `POST /api/v1/auth/sign-in`
- `POST /api/v1/auth/sign-out`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/mfa/challenge`
- `POST /api/v1/auth/mfa/verify`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:sessionId`
- `GET /api/v1/me`
- `PATCH /api/v1/me`

## Workspaces, roles, RBAC
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/:workspaceId`
- `PATCH /api/v1/workspaces/:workspaceId`
- `GET /api/v1/workspaces/:workspaceId/members`
- `POST /api/v1/workspaces/:workspaceId/members/invite`
- `PATCH /api/v1/workspaces/:workspaceId/members/:memberId`
- `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`
- `GET /api/v1/workspaces/:workspaceId/roles`
- `POST /api/v1/workspaces/:workspaceId/roles`
- `PATCH /api/v1/workspaces/:workspaceId/roles/:roleId`
- `DELETE /api/v1/workspaces/:workspaceId/roles/:roleId`

## Dashboard
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/insights`
- `GET /api/v1/dashboard/activity`
- `GET /api/v1/dashboard/tasks`

## Companies
- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:companyId`
- `PATCH /api/v1/companies/:companyId`
- `DELETE /api/v1/companies/:companyId`
- `GET /api/v1/companies/:companyId/people`
- `GET /api/v1/companies/:companyId/signals`
- `GET /api/v1/companies/:companyId/activity`
- `GET /api/v1/companies/:companyId/notes`
- `POST /api/v1/companies/:companyId/notes`
- `GET /api/v1/companies/:companyId/growth`
- `GET /api/v1/companies/:companyId/recommendations`
- `POST /api/v1/companies/:companyId/bookmarks`
- `DELETE /api/v1/companies/:companyId/bookmarks`

## People
- `GET /api/v1/people`
- `POST /api/v1/people`
- `GET /api/v1/people/:personId`
- `PATCH /api/v1/people/:personId`
- `DELETE /api/v1/people/:personId`
- `GET /api/v1/people/:personId/activity`
- `GET /api/v1/people/:personId/signals`
- `GET /api/v1/people/:personId/engagement`
- `POST /api/v1/people/:personId/bookmarks`
- `DELETE /api/v1/people/:personId/bookmarks`

## Signals
- `GET /api/v1/signals`
- `GET /api/v1/signals/:signalId`
- `GET /api/v1/signals/:signalId/evidence`
- `GET /api/v1/signals/:signalId/timeline`
- `POST /api/v1/signals/:signalId/bookmarks`
- `DELETE /api/v1/signals/:signalId/bookmarks`

## Opportunities
- `GET /api/v1/opportunities`
- `GET /api/v1/opportunities/:opportunityId`
- `PATCH /api/v1/opportunities/:opportunityId`
- `GET /api/v1/opportunities/:opportunityId/score`
- `GET /api/v1/opportunities/:opportunityId/score/explanation`
- `GET /api/v1/opportunities/:opportunityId/recommendations`

## Lists, saved views, watchlists
- `GET /api/v1/lists`
- `POST /api/v1/lists`
- `GET /api/v1/lists/:listId`
- `PATCH /api/v1/lists/:listId`
- `DELETE /api/v1/lists/:listId`
- `GET /api/v1/lists/:listId/items`
- `POST /api/v1/lists/:listId/items`
- `DELETE /api/v1/lists/:listId/items/:itemId`
- `GET /api/v1/saved-searches`
- `POST /api/v1/saved-searches`
- `GET /api/v1/saved-searches/:savedSearchId`
- `PATCH /api/v1/saved-searches/:savedSearchId`
- `DELETE /api/v1/saved-searches/:savedSearchId`
- `POST /api/v1/saved-searches/:savedSearchId/run`

## Alerts and notifications
- `GET /api/v1/alerts`
- `POST /api/v1/alerts`
- `GET /api/v1/alerts/:alertId`
- `PATCH /api/v1/alerts/:alertId`
- `DELETE /api/v1/alerts/:alertId`
- `GET /api/v1/alerts/:alertId/history`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:notificationId/read`
- `PATCH /api/v1/notifications/read-all`

## Tasks and activity
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:taskId`
- `DELETE /api/v1/tasks/:taskId`
- `GET /api/v1/activity`

## Research and ICP
- `GET /api/v1/research-jobs`
- `POST /api/v1/research-jobs`
- `GET /api/v1/research-jobs/:researchJobId`
- `GET /api/v1/research-jobs/:researchJobId/report`
- `POST /api/v1/research-jobs/:researchJobId/cancel`
- `GET /api/v1/icp-profiles`
- `POST /api/v1/icp-profiles`
- `GET /api/v1/icp-profiles/:icpProfileId`
- `PATCH /api/v1/icp-profiles/:icpProfileId`
- `POST /api/v1/icp-profiles/:icpProfileId/run-matching`

## Integrations and imports
- `GET /api/v1/integrations`
- `POST /api/v1/integrations/connect`
- `PATCH /api/v1/integrations/:integrationId`
- `DELETE /api/v1/integrations/:integrationId`
- `GET /api/v1/integrations/:integrationId/sync-runs`
- `POST /api/v1/imports`
- `GET /api/v1/imports`
- `GET /api/v1/imports/:importId`
- `POST /api/v1/imports/:importId/mapping`
- `POST /api/v1/imports/:importId/process`

## Analytics and market intelligence
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/growth`
- `GET /api/v1/analytics/signals`
- `GET /api/v1/analytics/engagement`
- `GET /api/v1/analytics/pipeline`
- `GET /api/v1/market-intelligence/summary`
- `GET /api/v1/market-intelligence/industries`
- `GET /api/v1/market-intelligence/geography`
- `GET /api/v1/market-intelligence/funding`
- `GET /api/v1/market-intelligence/hiring`
- `GET /api/v1/market-intelligence/technology`

## Response shape
Recommended success payload:
```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "workspaceId": "ws_123"
  }
}
```

Recommended error payload:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this workspace."
  }
}
```

## Notes
- Use consistent permission checks for every write route.
- Keep search, filter, and sort logic in the backend for all table-heavy screens.
- Favor read models for dashboard and detail pages if joins become expensive.

