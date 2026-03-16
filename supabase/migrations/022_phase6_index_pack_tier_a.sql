-- =============================================================
-- MIGRATION 022: Phase 6 Index Pack — Tier A (Critical)
-- Date: 2026-03-16
-- Purpose:
--   Add critical indexes identified in the Phase 6 index inspection
--   report. These indexes address the highest-impact query paths:
--
--   1. RLS write hot-path: every INSERT/UPDATE on 7 domain tables
--      evaluates WHERE om.user_id = auth.uid() AND om.role != 'viewer'.
--      Without a composite (user_id, role) index the planner uses the
--      existing user_id index then heap-fetches each row to check role.
--
--   2. work_items status filter: all list queries and dashboard
--      aggregations filter by (project_id, status). Without this
--      composite the planner scans the full project partition.
--
--   3. defects status filter: same pattern as work_items — list
--      queries and dashboard health widgets filter by status.
--
--   4. timeline_events composite: the table is append-only and grows
--      indefinitely. The existing separate project_id and timestamp
--      indexes force an index merge. A composite eliminates the merge
--      and provides pre-sorted access for pagination.
--
--   5. defects.inspection_id FK: listDefects accepts an inspectionId
--      filter. Without an index this becomes a full project-partition
--      scan despite filtering to a single inspection.
--
-- All indexes use CREATE INDEX IF NOT EXISTS for idempotency.
-- No schema changes. No RLS policy changes. Additive only.
-- =============================================================

-- -------------------------------------------------------------
-- A-01: organization_members (user_id, role)
--
-- Supports: ALL INSERT/UPDATE RLS policies on work_items, defects,
--   inspections, corrective_actions, evidence, projects,
--   timeline_events (migration 016 pattern):
--
--   WHERE om.user_id = auth.uid() AND om.role != 'viewer'
--
-- Without this index: planner uses org_members_user_id_idx to find
--   the user's rows, then heap-fetches each row to evaluate role.
-- With this index: both conditions resolved directly from the index
--   leaf — zero heap fetch required.
--
-- Write overhead: negligible. organization_members rows are created
--   once at signup and updated only on role assignment. Very low
--   write frequency.
-- -------------------------------------------------------------
create index if not exists idx_org_members_user_id_role
  on organization_members (user_id, role);

-- -------------------------------------------------------------
-- A-02: work_items (project_id, status)
--
-- Supports:
--   - listWorkItems(status=...) — status filter after project scope
--   - DashboardService.getWorkItemStatusCounts — GROUP BY status IN (ids)
--   - DashboardService.getWorkItemProgressStats — project-scoped fetch
--   - All dashboard health and metrics widgets
--
-- Without this index: every project-scoped work item query scans
--   the full project partition and then filters by status in memory.
-- With this index: queries with status filter use the composite
--   directly; pagination (LIMIT/OFFSET) becomes an index range scan.
--
-- Write overhead: low. Work item status changes are frequent but
--   the index is narrow (two columns, both short text/uuid).
-- -------------------------------------------------------------
create index if not exists idx_work_items_project_id_status
  on work_items (project_id, status);

-- -------------------------------------------------------------
-- A-03: defects (project_id, status)
--
-- Supports:
--   - listDefects(status=...) — status filter after project scope
--   - DashboardService.getDefectStatusCounts — open/critical counts
--   - DashboardService.getRiskSummary — filters non-closed critical
--   - Quality page defect list filtered by status
--
-- Same rationale as A-02 for work_items.
--
-- Write overhead: low. Defect status transitions are less frequent
--   than work item progress updates.
-- -------------------------------------------------------------
create index if not exists idx_defects_project_id_status
  on defects (project_id, status);

-- -------------------------------------------------------------
-- A-04: timeline_events (project_id, timestamp)
--
-- Supports:
--   - listTimelineEvents — always filters project_id, orders by
--     timestamp DESC; pagination uses LIMIT/OFFSET on this sort
--   - DashboardService.getTableCount("timeline_events", ...) — COUNT
--   - Timeline page full render
--   - All date-range filtered timeline queries
--
-- Without this index: planner uses separate project_id and timestamp
--   indexes and merges the results (Bitmap Index Merge), or chooses
--   the project_id index and sorts the full project partition.
--   As timeline_events grows (append-only, never deleted), this
--   becomes the most expensive table to query without this index.
-- With this index: index range scan covers both the project filter
--   and the timestamp sort in a single pass. LIMIT 50 uses the
--   first 50 entries directly from the index — no sort step.
--
-- NOTE: The existing standalone timeline_events_timestamp_idx
--   (on timestamp only) becomes largely redundant after this
--   composite is active for project-scoped queries. It is NOT
--   dropped here — verify query plans in production before dropping.
--
-- Write overhead: medium. Timeline events are written on every domain
--   operation. The composite index adds marginally more per-write
--   cost than the existing project_id index. Acceptable tradeoff
--   given the table's read-heavy, append-only, never-shrinking nature.
-- -------------------------------------------------------------
create index if not exists idx_timeline_events_project_id_timestamp
  on timeline_events (project_id, timestamp desc);

-- -------------------------------------------------------------
-- A-05: defects (inspection_id)
--
-- Supports:
--   - listDefects(inspectionId=...) — direct FK lookup
--   - Quality page defect-by-inspection panel
--
-- inspection_id is a FK column on defects with no supporting index.
-- A query listDefects({ inspectionId: 'xxx' }) currently scans
-- the entire defects_project_id_idx partition and filters by
-- inspection_id. On a project with 500+ defects across 20 inspections
-- this is a 500-row scan returning ~25 rows.
-- With this index: direct lookup from inspection_id value.
--
-- Write overhead: minimal. inspection_id is set at insert and
--   almost never updated.
-- -------------------------------------------------------------
create index if not exists idx_defects_inspection_id
  on defects (inspection_id);
