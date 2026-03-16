# AMMAP Database Index Plan — Phase 6
**Classification:** Engineering / Performance  
**Scope:** Production-grade index analysis based on real query patterns, RLS paths, and schema inspection  
**Methodology:** Full static analysis of all 16 migration files + all query/service files  
**Status:** PLANNING ONLY — No migrations created yet  
**Date:** March 2026

---

## 1. Executive Summary

AMMAP has a solid foundation of single-column indexes on `project_id` across all domain tables. These indexes are correct and necessary. However, the system is missing:

1. **Composite indexes** that cover the actual filter+sort patterns used in list queries and dashboard aggregations
2. **Composite indexes on the RLS join path** (`organization_members.organization_id + user_id`) — this subquery executes on every row evaluated by every RLS policy
3. **A `status` filter index** on `work_items`, `defects`, `inspections`, `corrective_actions` — status filtering is the primary filter on all list pages and dashboard aggregations
4. **A `timestamp` + `project_id` composite index** on `timeline_events` — the current separate indexes force a two-index merge that degrades as event volume grows
5. **Missing indexes** on `defects.inspection_id`, `defects.severity`, `work_items.status`, and `organization_members.role`

The dashboard service (`DashboardService`) is the highest-risk query path. It issues **5 unbounded full-table scans per project** on every page load, all in JavaScript after fetching entire result sets with no DB-level aggregation. Indexes will reduce individual query cost but the architectural pattern (fetch-all + in-JS aggregate) limits the ceiling benefit.

**Final recommendation: Safe to create migration pack after small query cleanup** (dashboard service specifically).

---

## 2. Existing Index Inventory

### organizations
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `organizations_pkey` | `id` | PK (B-tree) | migration 002 | Standard PK |
| — | `owner_id` | **None** | — | ⚠️ Missing — used in RLS SELECT policy (`owner_id = auth.uid()`) and migration 009 org-owner policy |

### organization_members
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `organization_members_pkey` | `id` | PK (B-tree) | migration 002 | Standard PK |
| `org_members_org_id_idx` | `organization_id` | B-tree | migration 002 | Covers org-scoped lookups |
| `org_members_user_id_idx` | `user_id` | B-tree | migration 002 | Covers user lookup |
| — | `(organization_id, user_id)` | **None** | — | ⚠️ Missing composite — unique constraint exists but may not be used as index efficiently by planner for the RLS join |
| — | `role` | **None** | — | ⚠️ Missing — migration 016 added `role != 'viewer'` to all write policies; role is filtered on every write operation |

### projects
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `projects_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `projects_org_id_idx` | `organization_id` | B-tree | migration 002 | Covers org-project lookups |
| — | `archived_at` | **None** | — | Low priority — only used in archive logic |

### project_members
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `project_members_pkey` | `id` | PK (B-tree) | migration 002 | Standard PK |
| `project_members_project_id_idx` | `project_id` | B-tree | migration 002 | Covers project-member lookups |
| `project_members_user_id_idx` | `user_id` | B-tree | migration 002 | Covers user-member lookups |

### spatial_nodes
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `spatial_nodes_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `spatial_nodes_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| `spatial_nodes_parent_id_idx` | `parent_id` | B-tree | migration 001 | Covers tree traversal queries |
| `spatial_nodes_project_id_type_idx` | `(project_id, type)` | B-tree composite | migration 010 | ✅ Good — covers "all zones in project" pattern |
| — | `(project_id, "order")` | **None** | — | ⚠️ Missing — all list queries ORDER BY `order`; order-sort within a project scan is not covered |

### work_items
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `work_items_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `work_items_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| `work_items_spatial_node_id_idx` | `spatial_node_id` | B-tree | migration 001 | Covers spatial filter |
| — | `(project_id, status)` | **None** | — | ⚠️ Missing — status is filtered on every list and dashboard query |
| — | `(project_id, assigned_to)` | **None** | — | ⚠️ Missing — `assignedTo` filter present in `listWorkItems` |
| — | `due_date` | **None** | — | Low — used in overdue task calculation |

### defects
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `defects_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `defects_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| `defects_spatial_node_id_idx` | `spatial_node_id` | B-tree | migration 001 | Covers spatial filter |
| — | `inspection_id` | **None** | — | ⚠️ Missing — `listDefects` accepts `inspectionId` filter; FK column with no index |
| — | `(project_id, status)` | **None** | — | ⚠️ Missing — status filtered on every list + dashboard |
| — | `(project_id, severity)` | **None** | — | ⚠️ Missing — severity filtered on risk summary and defect list page |
| — | `(project_id, severity, status)` | **None** | — | Composite for dashboard critical-open filter; optional |

### corrective_actions
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `corrective_actions_pkey` | `id` | PK (B-tree) | migration 007 | Standard PK |
| `corrective_actions_project_id_idx` | `project_id` | B-tree | migration 007 | Covers project-scoped queries |
| `corrective_actions_defect_id_idx` | `defect_id` | B-tree | migration 007 | ✅ Good — covers list-by-defect pattern |
| — | `(project_id, status)` | **None** | — | ⚠️ Missing — status filtered in list queries |

### inspections
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `inspections_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `inspections_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| — | `spatial_node_id` | **None** | — | ⚠️ Missing — `listInspections` accepts `spatialNodeId` filter; FK with no index |
| — | `(project_id, status)` | **None** | — | ⚠️ Missing — status filtered on list queries |
| — | `scheduled_date` | **None** | — | Low priority — potential future sort |

### evidence
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `evidence_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `evidence_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| `evidence_spatial_node_id_idx` | `spatial_node_id` | B-tree | migration 001 | ✅ Covers spatial filter |
| `evidence_defect_id_idx` | `defect_id` | B-tree | migration 001 | ✅ Covers list-by-defect |
| `evidence_work_item_id_idx` | `work_item_id` | B-tree | migration 001 | ✅ Covers list-by-work-item |
| — | `(project_id, type)` | **None** | — | ⚠️ Missing — type filtered in `listEvidence` |
| — | `created_at` | **None** | — | Low — potential sort for evidence timeline |

### progress_records
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `progress_records_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `progress_records_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| — | `spatial_node_id` | **None** | — | Low — no live queries filter by this yet |
| — | `recorded_at` | **None** | — | Low — potential sort for progress history |

### timeline_events
| Index | Columns | Type | Source | Notes |
|---|---|---|---|---|
| `timeline_events_pkey` | `id` | PK (B-tree) | migration 001 | Standard PK |
| `timeline_events_project_id_idx` | `project_id` | B-tree | migration 001 | Covers project-scoped queries |
| `timeline_events_timestamp_idx` | `timestamp` | B-tree | migration 001 | Covers timestamp range filter |
| — | `(project_id, timestamp)` | **None** | — | ⚠️ Missing composite — the two separate indexes require an index merge for queries filtering both; composite is significantly faster |
| — | `(project_id, type)` | **None** | — | ⚠️ Missing — `type` filtered in `listTimelineEvents` |

---

## 3. Query Pattern Analysis

### Core List Queries

| Query / Function | Table(s) | WHERE | ORDER BY | JOINs | Limit? | Growth Risk |
|---|---|---|---|---|---|---|
| `listWorkItems` | `work_items` | `project_id` + optional `status`, `assigned_to` | none | none | **No** | **High** — primary work tracking table |
| `listDefects` | `defects` | `project_id` + optional `status`, `severity`, `inspection_id` | none | none | **No** | **High** — accumulates with each inspection |
| `listInspections` | `inspections` | `project_id` + optional `status`, `spatial_node_id` | none | none | **No** | Medium |
| `listCorrectiveActions` | `corrective_actions` | `defect_id` only | `created_at ASC` | none | **No** | Medium — bounded by defect count |
| `listEvidence` | `evidence` | `project_id` + optional `type` | none | none | **No** | **High** — photo/video uploads grow fastest |
| `listTimelineEvents` | `timeline_events` | `project_id` + optional `type`, `from`, `to` | `timestamp ASC` | none | **No** | **High** — append-only, never deleted |
| `listSpatialNodes` | `spatial_nodes` | `project_id` + optional `type`, `parent_id` | `"order" ASC` | none | No | Low — bounded by project structure |
| `listProjectsByOrganization` | `projects` | `organization_id` | `created_at DESC` | none | No | Low — projects per org bounded |

### Dashboard Queries (DashboardService)

| Method | Tables Queried | Pattern | Notes |
|---|---|---|---|
| `getProjectHealth` | `work_items`, `defects` | Full unbounded fetch, JS aggregation | 2 queries per project |
| `getProjectMetrics` | `work_items`, `defects`, `evidence`, `timeline_events`, `spatial_nodes` | Full unbounded fetch, JS aggregation | 5 queries per project |
| `getRiskSummary` | `defects`, `spatial_nodes` | Full fetch, JS group-by spatialNodeId | 2 queries |
| `getOrgHealth` | `work_items`, `defects` × N projects | N parallel pairs of full fetches | **2N queries for org dashboard** — critical at scale |
| `getOrgMetrics` | `work_items`, `defects`, `evidence`, `timeline_events`, `spatial_nodes` × N | N×5 queries | **5N queries** — worst pattern in codebase |
| `getOrgRiskSummary` | `defects`, `spatial_nodes` × N | N×2 queries | 2N queries |

**Dashboard critical pattern:** `getOrgMetrics` with 10 projects issues **50 simultaneous unbounded queries**. No index plan eliminates this architectural problem — it requires DB-side aggregation (COUNT + GROUP BY) as a Phase 6.1 task.

### RLS Subquery (executed on every row of every policy evaluation)

```sql
SELECT p.id FROM projects p
JOIN organization_members om ON om.organization_id = p.organization_id
WHERE om.user_id = auth.uid()
  AND om.role != 'viewer'   -- added by migration 016
```

This subquery runs for **every row** in every SELECT, INSERT, UPDATE policy across all 7 domain tables. At scale this is the single most-executed query in the system.

### Evidence Lookup Queries (currently mock-only)

| Query | Filter | Index Available? |
|---|---|---|
| `listEvidenceByDefect(defectId)` | `defect_id` | ✅ `evidence_defect_id_idx` |
| `listEvidenceByWorkItem(workItemId)` | `work_item_id` | ✅ `evidence_work_item_id_idx` |
| `listEvidenceBySpatialNode(spatialNodeId)` | `spatial_node_id` | ✅ `evidence_spatial_node_id_idx` |

These are correctly indexed already. The evidence lookup pattern is solid.

### Profile Query
| Query | Table | Filter | Index |
|---|---|---|---|
| `listOrgProfiles` | `profiles` | none (full table) | `profiles_pkey` only |

`profiles` schema not in migrations (Supabase Auth-managed). No index recommendation possible without schema inspection.

---

## 4. RLS Access Path Analysis

All project-scoped RLS policies use this subquery pattern (or a variant):

```sql
-- Standard org-scoped pattern (migrations 004, 006, 007, 013, 014)
project_id IN (
  SELECT p.id FROM projects p
  JOIN organization_members om ON om.organization_id = p.organization_id
  WHERE om.user_id = auth.uid()
)

-- Role-enforced write pattern (migration 016)
project_id IN (
  SELECT p.id FROM projects p
  JOIN organization_members om ON om.organization_id = p.organization_id
  WHERE om.user_id = auth.uid()
    AND om.role != 'viewer'
)
```

| Table | Policy Access Path | Columns Used | Index Need | Severity |
|---|---|---|---|---|
| ALL domain tables | `om.user_id = auth.uid()` | `organization_members.user_id` | ✅ `org_members_user_id_idx` exists | Covered |
| ALL domain tables | `om.organization_id = p.organization_id` | `organization_members.organization_id` | ✅ `org_members_org_id_idx` exists | Covered |
| ALL domain tables (write) | `om.role != 'viewer'` | `organization_members.role` | ⚠️ **No index** | **High** — every write policy scans role |
| ALL domain tables | `p.organization_id` (join) | `projects.organization_id` | ✅ `projects_org_id_idx` exists | Covered |
| `organization_members` SELECT | `organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())` | `organizations.owner_id` | ⚠️ **No index** | Medium — owner management queries |
| `organizations` UPDATE/DELETE | `owner_id = auth.uid()` | `organizations.owner_id` | ⚠️ **No index** | Medium |
| `projects` UPDATE | `id IN (SELECT project_id FROM project_members WHERE user_id=auth.uid() AND role='manager')` | `project_members.(user_id, role)` | ⚠️ **No composite index** | Medium |

**Key insight:** The RLS subquery `WHERE om.user_id = auth.uid() AND om.role != 'viewer'` currently uses `org_members_user_id_idx` to find rows for the user, then filters by role. With a composite index `(user_id, role)`, the planner can satisfy both conditions from the index directly — no heap fetch for the role column.

---

## 5. Critical Index Recommendations (Tier A)

These indexes should be created before any large-scale usage. Each addresses either the RLS hot path or the most-used list query pattern.

### A-01 — `idx_org_members_user_id_role`
```sql
CREATE INDEX idx_org_members_user_id_role
  ON organization_members (user_id, role);
```
- **Table:** `organization_members`
- **Reason:** Migration 016 added `role != 'viewer'` to ALL write RLS policies. Every INSERT and UPDATE on 7 domain tables evaluates `WHERE om.user_id = auth.uid() AND om.role != 'viewer'`. Without this composite, the planner uses `org_members_user_id_idx` and then re-fetches the heap to check `role`. With it, both conditions are satisfied from the index leaf — zero heap fetch.
- **Supports:** All INSERT/UPDATE RLS policies on `work_items`, `defects`, `inspections`, `corrective_actions`, `evidence`, `projects`, `timeline_events`
- **Benefit:** Eliminates heap fetch on the most-executed subquery in the system
- **Write overhead:** Negligible — `organization_members` has very low write frequency (role assignments are rare operations)

### A-02 — `idx_work_items_project_id_status`
```sql
CREATE INDEX idx_work_items_project_id_status
  ON work_items (project_id, status);
```
- **Table:** `work_items`
- **Reason:** `listWorkItems` filters by `project_id` + optional `status`. Dashboard `getProjectHealth`/`getProjectMetrics` fetch ALL work items then filter by `status` in JavaScript — a composite index covering both columns allows the DB to return only the rows for the requested status.
- **Supports:** `listWorkItems(status=...)`, `DashboardService.getProjectHealth`, `DashboardService.getProjectMetrics`
- **Benefit:** Reduces rows returned for status-filtered queries from N (all project items) to M (items with status), avoiding full project scan
- **Write overhead:** Low — work item status changes are frequent but the index is narrow (project_id + status text)

### A-03 — `idx_defects_project_id_status`
```sql
CREATE INDEX idx_defects_project_id_status
  ON defects (project_id, status);
```
- **Table:** `defects`
- **Reason:** `listDefects` filters by `project_id` + optional `status`. Dashboard filters open/in_progress defects. Risk summary filters critical/high severity defects by status.
- **Supports:** `listDefects(status=...)`, `DashboardService.getProjectHealth`, `DashboardService.getRiskSummary`
- **Benefit:** Same as A-02 — avoids full project defect scan for status-filtered queries
- **Write overhead:** Low — defect status changes are less frequent than work item updates

### A-04 — `idx_timeline_events_project_id_timestamp`
```sql
CREATE INDEX idx_timeline_events_project_id_timestamp
  ON timeline_events (project_id, timestamp);
```
- **Table:** `timeline_events`
- **Reason:** `listTimelineEvents` always filters by `project_id` and orders by `timestamp`. The current separate `project_id_idx` and `timestamp_idx` force an index merge or a project scan sorted in memory. As timeline_events grows (append-only, never deleted), this becomes the most critical table for index performance. A composite eliminates both the merge and the sort.
- **Supports:** `listTimelineEvents`, timeline page, `DashboardService.getProjectMetrics`
- **Benefit:** Eliminates index merge, provides pre-sorted timestamp order within project scope
- **Write overhead:** Medium — timeline events are written on every domain operation. The composite index has a slightly higher per-write cost than the existing single-column `project_id` index. This is acceptable given the read-heavy nature of the timeline.

### A-05 — `idx_defects_inspection_id`
```sql
CREATE INDEX idx_defects_inspection_id
  ON defects (inspection_id);
```
- **Table:** `defects`
- **Reason:** `listDefects` accepts an `inspectionId` filter. `inspection_id` is a FK column with no supporting index. A query like `listDefects({ inspectionId: 'xxx' })` currently does a full `defects_project_id_idx` scan + filter, or a full sequential scan if the planner chooses.
- **Supports:** `listDefects(inspectionId=...)`, quality page defect-by-inspection view
- **Benefit:** FK index — turns inspection-scoped defect lookup from O(project defects) to O(defects for that inspection)
- **Write overhead:** Minimal — `inspection_id` is set at insert and rarely changed

---

## 6. Recommended Indexes (Tier B)

These indexes materially improve performance and should be added soon but are not emergency-critical.

### B-01 — `idx_defects_project_id_severity`
```sql
CREATE INDEX idx_defects_project_id_severity
  ON defects (project_id, severity);
```
- **Reason:** Dashboard risk summary filters `severity IN ('critical', 'high')`. Currently fetches all defects then filters in JS. With pagination added (Phase 6 WS5), a severity-filtered query needs this index.
- **Supports:** `DashboardService.getRiskSummary`, `DashboardService.getOrgRiskSummary`, defect list filtered by severity
- **Benefit:** Avoids full project defect scan for severity-filtered dashboard widgets
- **Write overhead:** Low

### B-02 — `idx_inspections_project_id_status`
```sql
CREATE INDEX idx_inspections_project_id_status
  ON inspections (project_id, status);
```
- **Reason:** `listInspections` filters by `status`. Quality page shows status-grouped inspections.
- **Supports:** `listInspections(status=...)`, quality page
- **Write overhead:** Low

### B-03 — `idx_inspections_spatial_node_id`
```sql
CREATE INDEX idx_inspections_spatial_node_id
  ON inspections (spatial_node_id);
```
- **Reason:** `listInspections` accepts `spatialNodeId` filter. `spatial_node_id` is a FK column with no supporting index on this table (unlike `defects` which has `defects_spatial_node_id_idx`). Missing FK index for map workspace inspection panel.
- **Supports:** Map workspace inspection panel, spatial-filtered inspection queries
- **Write overhead:** Minimal

### B-04 — `idx_corrective_actions_project_id_status`
```sql
CREATE INDEX idx_corrective_actions_project_id_status
  ON corrective_actions (project_id, status);
```
- **Reason:** Future list queries filtering by status within a project. Also useful for dashboard corrective action completion metrics.
- **Supports:** Future `listCorrectiveActions(status=...)`, quality domain aggregations
- **Write overhead:** Low

### B-05 — `idx_organizations_owner_id`
```sql
CREATE INDEX idx_organizations_owner_id
  ON organizations (owner_id);
```
- **Reason:** Migration 009 adds RLS policy: `organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())`. This subquery runs on every `organization_members` SELECT for org owners. Currently does a sequential scan of `organizations`.
- **Supports:** `organization_members` SELECT RLS policy for org owners, org management UI
- **Write overhead:** Negligible — organizations table is tiny and rarely written

### B-06 — `idx_evidence_project_id_type`
```sql
CREATE INDEX idx_evidence_project_id_type
  ON evidence (project_id, type);
```
- **Reason:** `listEvidence` accepts `type` filter. Evidence is the fastest-growing table (photo/video uploads). A composite covering both filters avoids a project-wide evidence scan when filtering by type.
- **Supports:** `listEvidence(type=...)`, evidence page type filter
- **Write overhead:** Low — writes to evidence are relatively infrequent (per upload)

### B-07 — `idx_work_items_project_id_assigned_to`
```sql
CREATE INDEX idx_work_items_project_id_assigned_to
  ON work_items (project_id, assigned_to);
```
- **Reason:** `listWorkItems` accepts `assignedTo` filter. My work / team work views depend on this filter. As a project scales to hundreds of assignees, this becomes critical.
- **Supports:** `listWorkItems(assignedTo=...)`, team work views, dashboard per-user task list
- **Write overhead:** Low

---

## 7. Optional Indexes (Tier C)

Nice-to-have. Only implement if query volume warrants it.

### C-01 — `idx_timeline_events_project_id_type`
```sql
CREATE INDEX idx_timeline_events_project_id_type
  ON timeline_events (project_id, type);
```
- **Reason:** `listTimelineEvents` accepts optional `type` filter. Currently low-cardinality filter unlikely to be selective enough to justify an index unless event volume exceeds 10,000+ per project.
- **Supports:** `listTimelineEvents(type=...)`
- **Note:** The A-04 composite covers `(project_id, timestamp)` which is the primary access pattern. This is supplementary.

### C-02 — `idx_work_items_due_date`
```sql
CREATE INDEX idx_work_items_due_date
  ON work_items (due_date)
  WHERE due_date IS NOT NULL;
```
- **Reason:** Dashboard `overdueTasks` calculation currently fetches all tasks and filters in JS. A partial index on `due_date` would support a DB-side overdue query. Only useful if dashboard is refactored to use DB aggregations.
- **Note:** Partial index (only rows where `due_date IS NOT NULL`) keeps it compact.

### C-03 — `idx_project_members_user_id_role`
```sql
CREATE INDEX idx_project_members_user_id_role
  ON project_members (user_id, role);
```
- **Reason:** Projects UPDATE RLS policy: `id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'manager')`. With Phase 6 WS2 (project assignment enforcement), this subquery runs on every project UPDATE. The composite handles both conditions from the index.
- **Priority:** Only becomes critical after WS2 is activated.

### C-04 — `idx_spatial_nodes_project_id_order`
```sql
CREATE INDEX idx_spatial_nodes_project_id_order
  ON spatial_nodes (project_id, "order");
```
- **Reason:** `listSpatialNodes` always orders by `"order"`. The existing `project_id_idx` requires a sort step after index scan. With this composite, the planner can return rows in sort order directly from the index.
- **Note:** The existing `spatial_nodes_project_id_type_idx` covers (project_id, type) — if type filter is present, that index is used. This is for unfiltered ordered fetches only.

### C-05 — `idx_corrective_actions_spatial_node_id`
```sql
CREATE INDEX idx_corrective_actions_spatial_node_id
  ON corrective_actions (spatial_node_id);
```
- **Reason:** FK column, no index. Only useful once map workspace queries corrective actions by spatial node. Currently no live query does this.

### C-06 — `idx_evidence_created_at`
```sql
CREATE INDEX idx_evidence_created_at
  ON evidence (created_at DESC);
```
- **Reason:** Once evidence list page adds a "recent first" sort, this supports it. Currently no sort is applied in `listEvidence`.

---

## 8. Pagination Readiness

| Query | Why Index Alone Is Not Enough | Pagination Needed? |
|---|---|---|
| `listWorkItems` | Even with `(project_id, status)` index, a project with 500+ work items returns all rows in one response. Supabase default row limit is 1,000 but memory/serialization cost starts at ~200 rows. | **Yes — high priority** |
| `listDefects` | Defects accumulate per inspection. 10 inspections × 20 defects = 200+ rows per project. Severity/status indexes help filtering but not volume. | **Yes — high priority** |
| `listEvidence` | Evidence is the fastest-growing table. Photos/videos can reach 1,000+ per project quickly. `(project_id, type)` index helps filter but not total volume. | **Yes — critical** |
| `listTimelineEvents` | Append-only, never deleted. A busy project generates 10–50 events per day. At 1 year: 3,650–18,250 events per project. The `(project_id, timestamp)` composite makes range queries fast but pagination is still required for reasonable page loads. | **Yes — critical** |
| `listInspections` | Lower volume — typically 10–50 per project phase. Index helps enough that pagination is lower priority. | Yes — recommended |
| `listCorrectiveActions` | Bounded by defect count. 1–5 CAs per defect is typical. Index on `defect_id` handles this well. | Optional |
| `listSpatialNodes` | Bounded by project structure. A large site might have 200–300 nodes total. `(project_id, type)` index handles well. | Low priority |
| `DashboardService.getOrgMetrics` | **Index does not fix this at all.** It fetches all rows from 5 tables per project then aggregates in JavaScript. For 10 projects with 500 work items each, this is 5,000 JS objects created and discarded per dashboard load. Requires refactoring to DB-level COUNT/GROUP BY queries. | **Architectural refactor required** |

---

## 9. Anti-Patterns and Warnings

### W-01 — Dashboard fetch-all-then-aggregate pattern
**Severity: Critical at scale**  
`DashboardService` fetches entire result sets from 5 tables per project and aggregates in JavaScript. Indexes reduce the per-query cost but cannot fix the N×5 query pattern. For an org with 10 active projects, `getOrgMetrics` issues 50 concurrent unbounded queries. This must be refactored to use Postgres `COUNT`, `SUM`, `GROUP BY`, or Supabase RPC functions before the platform goes to production at scale. Adding indexes without fixing this creates a false sense of performance safety.

### W-02 — Separate `project_id` and `timestamp` indexes on `timeline_events`
**Severity: Medium**  
The existing `timeline_events_project_id_idx` and `timeline_events_timestamp_idx` are **redundant once A-04 is created**. The composite `(project_id, timestamp)` covers all queries that either index covers and is more efficient. After creating A-04, consider dropping `timeline_events_timestamp_idx` (the standalone timestamp index is unlikely to be used by the planner when `project_id` is always in the WHERE clause). **Do not drop until A-04 is confirmed active and query plans verified.**

### W-03 — `organization_members` unique constraint vs. explicit index
**Severity: Low**  
The `UNIQUE (organization_id, user_id)` constraint on `organization_members` creates an implicit B-tree index. This covers queries `WHERE organization_id = X AND user_id = Y`. The separate `org_members_org_id_idx` and `org_members_user_id_idx` provide single-column coverage. The unique constraint index covers the composite case. This means A-01 `(user_id, role)` is the only missing composite — the `(organization_id, user_id)` composite is already implicit from the unique constraint. **No duplicate risk from A-01.**

### W-04 — Low-selectivity warning on `status` single-column indexes
**Severity: Low**  
A standalone index on `status` alone (e.g. `CREATE INDEX ON work_items(status)`) would be a waste — `status` has only 4 values with uneven distribution (`completed` typically being the majority for mature projects). The composite `(project_id, status)` is the correct approach because `project_id` provides high selectivity, and `status` provides the secondary filter. **Never create a single-column index on `status` for these tables.**

### W-05 — `role != 'viewer'` is a negative predicate in RLS
**Severity: Low**  
`om.role != 'viewer'` is a negative predicate (inequality). B-tree indexes work well with `!=` when combined with a leading equality condition (`user_id = auth.uid()`). The composite `(user_id, role)` in A-01 handles this correctly — the planner uses `user_id =` as the entry point and then checks `role != 'viewer'` on the small set of rows returned. No issue here, but worth noting that a single-column index on `role` alone would be very inefficient for this predicate.

### W-06 — Missing index is masking current performance
**Severity: Medium**  
Because the system currently uses mock data (many query functions fall back to in-memory mock arrays), the missing indexes have zero observable impact in development. This creates a false sense that the system is performant. The first real production deployment with 100+ work items per project will make all the missing composite indexes immediately observable as slow queries.

### W-07 — `listEvidenceByDefect/WorkItem/SpatialNode` are mock-only
**Severity: Informational**  
These three evidence lookup functions currently only return mock data — they have no Supabase query path. When they are wired to real DB queries, the existing indexes (`evidence_defect_id_idx`, `evidence_work_item_id_idx`, `evidence_spatial_node_id_idx`) are ready. No new indexes needed for these functions.

---

## 10. Final Recommendation

### Verdict: **Create migration pack after small query cleanup**

**Do not create the migration pack yet.** Before writing the index migration:

1. **Refactor `DashboardService.getOrgMetrics` and `getOrgHealth`** to use DB-level aggregations (COUNT/GROUP BY via Supabase RPC or direct SQL). Indexes on `work_items` and `defects` will provide maximum benefit only after this architectural fix. Creating indexes before the fix gives a partial improvement but masks the real bottleneck.

2. **Add pagination to `listWorkItems`, `listDefects`, `listEvidence`, `listTimelineEvents`** (Phase 6 WS5). The composite indexes in Tier A become dramatically more effective with pagination because the planner can use index range scans with `LIMIT` rather than full index scans. `(project_id, status) LIMIT 50` is an index range scan. `(project_id, status)` with no limit is a full index scan — still better than without, but the gain multiplies with LIMIT.

3. After those two changes, **create one migration with all Tier A + Tier B indexes** in sequence. Tier C indexes can follow in a separate migration after production query patterns are observed.

### Index Pack Contents (when ready)

**Migration: `022_phase6_indexes.sql`**

Tier A (Critical — all 5):
- `idx_org_members_user_id_role` on `organization_members(user_id, role)`
- `idx_work_items_project_id_status` on `work_items(project_id, status)`
- `idx_defects_project_id_status` on `defects(project_id, status)`
- `idx_timeline_events_project_id_timestamp` on `timeline_events(project_id, timestamp)`
- `idx_defects_inspection_id` on `defects(inspection_id)`

Tier B (Recommended — all 7):
- `idx_defects_project_id_severity` on `defects(project_id, severity)`
- `idx_inspections_project_id_status` on `inspections(project_id, status)`
- `idx_inspections_spatial_node_id` on `inspections(spatial_node_id)`
- `idx_corrective_actions_project_id_status` on `corrective_actions(project_id, status)`
- `idx_organizations_owner_id` on `organizations(owner_id)`
- `idx_evidence_project_id_type` on `evidence(project_id, type)`
- `idx_work_items_project_id_assigned_to` on `work_items(project_id, assigned_to)`

Defer to separate migration after production observation:
- Tier C (C-01 through C-06)
- `timeline_events_timestamp_idx` drop (after A-04 verified)

---

*AMMAP Database Index Plan — Phase 6 Performance Architecture*  
*Planning phase only — no migrations created*  
*March 2026*
