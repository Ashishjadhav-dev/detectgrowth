# DetectGrowth Database Schema

## Design goals
- Multi-tenant first
- Workspace-scoped data everywhere
- Auditability for key actions
- Easy replacement of mock data with production data
- Friendly to search and analytics

## Core identity and tenancy

### `users`
- `id` uuid, PK
- `email` unique, indexed
- `name`
- `avatar_url`
- `status` (`active`, `invited`, `disabled`)
- `email_verified_at`
- `created_at`
- `updated_at`

### `workspaces`
- `id` uuid, PK
- `name`
- `slug` unique
- `plan`
- `status`
- `created_at`
- `updated_at`

### `workspace_memberships`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `user_id` FK -> `users.id`
- `role_id` FK -> `roles.id`
- `title`
- `status`
- `created_at`
- `updated_at`
- Unique: `workspace_id + user_id`

### `roles`
- `id` uuid, PK
- `workspace_id` nullable for system roles
- `name`
- `is_system`
- `created_at`

### `permissions`
- `id` uuid, PK
- `key` unique, e.g. `companies.read`, `lists.write`
- `description`

### `role_permissions`
- `role_id` FK -> `roles.id`
- `permission_id` FK -> `permissions.id`
- Composite PK: `role_id + permission_id`

### `invitations`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `email`
- `role_id` FK -> `roles.id`
- `invited_by_user_id` FK -> `users.id`
- `token_hash`
- `expires_at`
- `accepted_at`
- `created_at`

### `sessions`
- `id` uuid, PK
- `user_id` FK -> `users.id`
- `workspace_id` FK -> `workspaces.id`
- `refresh_token_hash`
- `device_name`
- `ip_address`
- `user_agent`
- `expires_at`
- `created_at`

## CRM and intelligence data

### `companies`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `name`
- `domain`
- `industry`
- `location`
- `employee_range`
- `revenue_range`
- `ownership_type`
- `source`
- `status`
- `created_at`
- `updated_at`
- Indexes: `workspace_id`, `name`, `domain`, `industry`

### `people`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `company_id` FK -> `companies.id`
- `name`
- `title`
- `department`
- `email`
- `phone`
- `linkedin_url`
- `decision_score`
- `status`
- `created_at`
- `updated_at`
- Indexes: `workspace_id`, `company_id`, `department`, `decision_score`

### `company_people`
- `company_id` FK -> `companies.id`
- `person_id` FK -> `people.id`
- `relationship_type`
- Composite PK: `company_id + person_id`

### `signals`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `company_id` FK -> `companies.id`
- `person_id` nullable FK -> `people.id`
- `signal_type`
- `title`
- `description`
- `impact` (`high`, `medium`, `low`)
- `confidence`
- `source_type`
- `source_url`
- `detected_at`
- `created_at`
- Indexes: `workspace_id`, `company_id`, `signal_type`, `impact`, `detected_at`

### `signal_evidence`
- `id` uuid, PK
- `signal_id` FK -> `signals.id`
- `source_label`
- `source_url`
- `excerpt`
- `captured_at`

### `opportunities`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `company_id` FK -> `companies.id`
- `owner_user_id` FK -> `users.id`
- `pipeline_stage`
- `status`
- `score`
- `priority`
- `expected_value`
- `next_action`
- `last_activity_at`
- `created_at`
- `updated_at`
- Indexes: `workspace_id`, `company_id`, `owner_user_id`, `score`, `status`

### `opportunity_score_factors`
- `id` uuid, PK
- `opportunity_id` FK -> `opportunities.id`
- `factor_key`
- `label`
- `value`
- `weight`
- `delta`

### `opportunity_notes`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `opportunity_id` FK -> `opportunities.id`
- `author_user_id` FK -> `users.id`
- `body`
- `created_at`

## Lists, searches, alerts

### `lists`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `owner_user_id` FK -> `users.id`
- `name`
- `type` (`manual`, `smart`, `watchlist`)
- `description`
- `visibility`
- `created_at`
- `updated_at`

### `list_items`
- `id` uuid, PK
- `list_id` FK -> `lists.id`
- `entity_type` (`company`, `person`, `signal`, `opportunity`)
- `entity_id`
- `added_by_user_id` FK -> `users.id`
- `created_at`
- Unique: `list_id + entity_type + entity_id`

### `saved_searches`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `owner_user_id` FK -> `users.id`
- `name`
- `entity_type`
- `query_text`
- `filters_json`
- `sort_json`
- `created_at`
- `updated_at`

### `alerts`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `owner_user_id` FK -> `users.id`
- `name`
- `entity_type`
- `criteria_json`
- `delivery_json`
- `status`
- `created_at`
- `updated_at`

### `alert_deliveries`
- `id` uuid, PK
- `alert_id` FK -> `alerts.id`
- `delivery_type`
- `status`
- `sent_at`
- `payload_json`

## AI, research, and ICP

### `research_jobs`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `requested_by_user_id` FK -> `users.id`
- `company_name`
- `company_id` nullable FK -> `companies.id`
- `prompt`
- `status`
- `progress`
- `result_summary`
- `started_at`
- `completed_at`
- `created_at`

### `research_reports`
- `id` uuid, PK
- `research_job_id` FK -> `research_jobs.id`
- `report_json`
- `markdown`
- `generated_at`

### `icp_profiles`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `name`
- `industries_json`
- `locations_json`
- `employee_ranges_json`
- `revenue_ranges_json`
- `signal_weights_json`
- `fit_threshold`
- `status`
- `created_at`
- `updated_at`

### `icp_match_runs`
- `id` uuid, PK
- `icp_profile_id` FK -> `icp_profiles.id`
- `started_by_user_id` FK -> `users.id`
- `status`
- `matched_count`
- `high_fit_count`
- `result_json`
- `created_at`

## Integrations and imports

### `integrations`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `provider_key`
- `name`
- `status`
- `config_json`
- `connected_at`
- `created_at`

### `sync_runs`
- `id` uuid, PK
- `integration_id` FK -> `integrations.id`
- `status`
- `started_at`
- `completed_at`
- `stats_json`

### `imports`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `requested_by_user_id` FK -> `users.id`
- `source_type`
- `file_name`
- `status`
- `mapping_json`
- `results_json`
- `created_at`
- `updated_at`

## Tasks, activity, notifications

### `tasks`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `assigned_to_user_id` FK -> `users.id`
- `related_entity_type`
- `related_entity_id`
- `title`
- `description`
- `priority`
- `status`
- `due_at`
- `created_at`
- `updated_at`

### `activities`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `actor_user_id` nullable FK -> `users.id`
- `entity_type`
- `entity_id`
- `activity_type`
- `summary`
- `metadata_json`
- `created_at`
- Indexes: `workspace_id`, `entity_type`, `entity_id`, `created_at`

### `notifications`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `user_id` FK -> `users.id`
- `type`
- `title`
- `body`
- `read_at`
- `metadata_json`
- `created_at`

## Audit and tagging

### `audit_logs`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `actor_user_id` FK -> `users.id`
- `action`
- `entity_type`
- `entity_id`
- `before_json`
- `after_json`
- `created_at`

### `tags`
- `id` uuid, PK
- `workspace_id` FK -> `workspaces.id`
- `name`
- `color`
- `created_at`

### `taggings`
- `tag_id` FK -> `tags.id`
- `entity_type`
- `entity_id`
- `created_at`
- Composite PK: `tag_id + entity_type + entity_id`

## Suggested indexes
- Full-text or trigram index for `companies.name`, `people.name`, `signals.title`, and saved search query columns
- Composite indexes on `workspace_id + created_at` for activity-heavy tables
- Composite indexes on `workspace_id + status` for jobs and lists

## Minimum MVP tables
If you want the smallest usable version first:
- `users`
- `workspaces`
- `workspace_memberships`
- `roles`
- `permissions`
- `role_permissions`
- `companies`
- `people`
- `signals`
- `opportunities`
- `lists`
- `list_items`
- `saved_searches`
- `alerts`
- `tasks`
- `activities`
- `audit_logs`

