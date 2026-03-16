-- =============================================================
-- MIGRATION 023: Phase 6 Index Pack — Tier B (Recommended)
-- Date: 2026-03-16
-- Purpose:
--   Add recommended indexes that materially improve performance for
--   the main list pages, RLS management queries, and dashboard
--   aggregations. These are lower urgency than Tier A but should
--   be applied before the platform reaches production scale.
--
--   B-01: defects (project_id, severity)
--   B-02: inspections (project_id, status)
--   B-03: inspections (spatial_node_id)
--   B-04: corrective_actions (project_id, status)
--   B-05: organizations (owner_id)
--   B-06: evidence (project_id, type)
--   B-07: work_items (project_id, assigned_to)
--   B-08: project_members (user_id, role)
--
-- All indexes use CREATE INDEX IF NOT EXISTS for idempotency.
-- No schema changes. No RLS policy changes. Additive only.
-- =============================================================

-- -------------------------------------------------------------
-- B-01: defects (project_id, severity)
--
-- Supports:
--   - listDefects(severity=...) — severity filter after project scope
--   - DashboardService.getDefectSeverityCounts — GROUP BY severity IN (ids)
--   - DashboardService.getRiskZoneRows — filters severity IN ('critical','high')
--   - Risk summary widgets and org-level risk dashboard
--
-- Without this index: dashboard risk summary fetches all defects for
--   a project then filters by severity in JS (pre-refactor) or via
--   DB filter on the project_id index scan. With pagination, a query
--   like listDefects({ severity: 'critical' }) scans the full project
--   partition and then filters.
-- With this index: severity-filtered defect queries use a composite
--   range scan — e.g. WHERE project_id = X AND severity = 'critical'
--   returns only critical rows directly.
--
-- Write overhead: low. Defect severity is set at INSERT and rarely
--   updated.
-- -------------------------------------------------------------
create index if not exists idx_defects_project_id_severity
  on defects (project_id, severity);

-- -------------------------------------------------------------
-- B-02: inspections (project_id, status)
--
-- Supports:
--   - listInspections(status=...) — status filter after project scope
--   - Quality page inspection list filtered by status
--   - Inspection status grouping in project overview
--
-- Same pattern as idx_work_items_project_id_status and
-- idx_defects_project_id_status. All three tables share the same
-- list-query filter shape.
--
-- Write overhead: low. Inspection status transitions are infrequent.
-- -------------------------------------------------------------
create index if not exists idx_inspections_project_id_status
  on inspections (project_id, status);

-- -------------------------------------------------------------
-- B-03: inspections (spatial_node_id)
--
-- Supports:
--   - listInspections(spatialNodeId=...) — spatial filter
--   - Map workspace inspection panel — "all inspections at this zone"
--   - Spatial node detail view showing related inspections
--
-- spatial_node_id is a FK column on inspections with no supporting
-- index (unlike defects which has defects_spatial_node_id_idx).
-- A query filtering by spatial_node_id currently requires a full
-- table scan or project-partition scan.
--
-- Write overhead: minimal. spatial_node_id is set at INSERT and
--   rarely changed.
-- -------------------------------------------------------------
create index if not exists idx_inspections_spatial_node_id
  on inspections (spatial_node_id);

-- -------------------------------------------------------------
-- B-04: corrective_actions (project_id, status)
--
-- Supports:
--   - listCorrectiveActions with status filter (future)
--   - Quality domain completion metrics
--   - Dashboard corrective action tracking widgets
--
-- The existing corrective_actions_defect_id_idx covers per-defect
-- lookups well. This composite covers project-wide status queries
-- used by dashboard aggregations.
--
-- Write overhead: low. Corrective action status changes are less
--   frequent than defect or work item updates.
-- -------------------------------------------------------------
create index if not exists idx_corrective_actions_project_id_status
  on corrective_actions (project_id, status);

-- -------------------------------------------------------------
-- B-05: organizations (owner_id)
--
-- Supports:
--   - Migration 009 RLS policy on organization_members SELECT:
--
--       organization_id IN (
--         SELECT id FROM organizations WHERE owner_id = auth.uid()
--       )
--
--     This subquery runs on every organization_members SELECT for
--     org owners. Currently a sequential scan of the organizations
--     table.
--   - organizations UPDATE/DELETE policies:
--       USING (owner_id = auth.uid())
--     These also benefit from this index for point lookups.
--   - Org management UI — listing owned organizations.
--
-- Without this index: org owner's member list query does a full
--   sequential scan of organizations to find rows with matching
--   owner_id. Table is small now but this is a hot path.
-- With this index: direct point lookup on owner_id.
--
-- Write overhead: negligible. organizations rows are created once
--   at signup and owner_id is never changed.
-- -------------------------------------------------------------
create index if not exists idx_organizations_owner_id
  on organizations (owner_id);

-- -------------------------------------------------------------
-- B-06: evidence (project_id, type)
--
-- Supports:
--   - listEvidence(type=...) — type filter after project scope
--   - Evidence page type filter tabs (photo / video / document)
--   - DashboardService.getTableCount("evidence", ...) — uses project_id
--
-- evidence is the fastest-growing table (photo/video uploads
-- accumulate without bound). The existing evidence_project_id_idx
-- covers unfiltered project queries. This composite avoids a full
-- project-evidence scan when filtering by type.
--
-- Write overhead: low. Evidence records are inserted infrequently
--   (per upload) and type is immutable after INSERT.
-- -------------------------------------------------------------
create index if not exists idx_evidence_project_id_type
  on evidence (project_id, type);

-- -------------------------------------------------------------
-- B-07: work_items (project_id, assigned_to)
--
-- Supports:
--   - listWorkItems(assignedTo=...) — assigned-to filter
--   - "My work" views filtered by current user
--   - Team workload distribution panels
--
-- Without this index: filtering by assigned_to after project scope
--   requires scanning all work items for the project and then
--   filtering by the assigned_to value. On a project with 500+
--   work items assigned to 20 users, this scans 500 rows to
--   return ~25.
-- With this index: direct composite scan narrows to only rows
--   matching both project_id and assigned_to.
--
-- Write overhead: low. assigned_to is set at INSERT or updated
--   infrequently via task reassignment.
-- -------------------------------------------------------------
create index if not exists idx_work_items_project_id_assigned_to
  on work_items (project_id, assigned_to);

-- -------------------------------------------------------------
-- B-08: project_members (user_id, role)
--
-- Supports:
--   - projects UPDATE RLS policy (migration 002):
--
--       id IN (
--         SELECT project_id FROM project_members
--         WHERE user_id = auth.uid() AND role = 'manager'
--       )
--
--     This subquery runs on every project UPDATE for non-admin users.
--   - Phase 6 WS2 (project assignment enforcement) — once activated,
--     project-level access checks will query project_members by
--     (user_id, role) on every project-scoped RLS evaluation.
--
-- Without this index: planner uses project_members_user_id_idx to
--   find the user's memberships, then heap-fetches each row to
--   check role. Same pattern as A-01 for organization_members.
-- With this index: both conditions resolved from the index leaf
--   directly.
--
-- Write overhead: minimal. project_members rows are inserted when
--   a user is assigned to a project and rarely updated.
-- -------------------------------------------------------------
create index if not exists idx_project_members_user_id_role
  on project_members (user_id, role);
