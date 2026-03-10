# AI PROJECT MEMORY

## Project Purpose
**ammap** is a construction project management platform with an interactive geospatial map workspace. It enables construction teams to manage projects, draw spatial zones on a Mapbox map, assign work tasks to zones, track defects/quality issues, capture evidence (photos/videos), and monitor project health via dashboards. Multi-tenant via organizations — each user belongs to one organization.

## Tech Stack
- **Framework:** Next.js 14.2 (App Router, Server Actions, RSC)
- **Language:** TypeScript 5.4
- **Database/Auth:** Supabase (PostgreSQL + Row Level Security + Auth)
- **Supabase Client:** `@supabase/ssr@0.9.0` — `createBrowserClient` / `createServerClient`
- **Map:** Mapbox GL JS 3 + `@mapbox/mapbox-gl-draw`
- **UI:** Tailwind CSS 3, Lucide React icons
- **Validation:** Zod 4
- **State:** React `useState` / `useTransition` (no global store)

## Architecture
**Modular Monolith** with Domain-Driven Design layers inside a Next.js App Router project.

```
src/
  app/          → Next.js routes (grouped by role/context)
  domains/      → Business logic: models, actions, queries, services, validation
  features/     → UI feature components (compose domain logic)
  lib/          → Shared infrastructure (Supabase clients, map context)
  components/   → Shared UI primitives
```

Each domain follows: `model → validation → actions (Server Actions) → queries → services`

## Core Modules

| Domain | Responsibility |
|---|---|
| `domains/project` | CRUD for projects, linked to organizations |
| `domains/spatial` | Spatial node tree (site → building → floor → zone → area), GeoJSON geometry |
| `domains/work` | Work items / tasks with progress tracking, linked to spatial nodes |
| `domains/quality` | Defects and inspections, severity/status lifecycle |
| `domains/evidence` | Photo/video/document capture linked to work items or defects |
| `domains/dashboard` | Aggregates metrics: task stats, defect severity, zone risk |
| `domains/timeline` | Timeline events for project activity log |
| `domains/auth` | Supabase browser auth (signIn/signUp/signOut) |
| `domains/ai` | AI analysis stub — not yet implemented |
| `features/map-workspace` | Main map UI: draws spatial nodes, shows tasks/defects per zone |

## Folder Structure

```
src/app/
  (auth)/           → /login, /signup pages
  (workspace)/      → /dashboard, /projects
  (project)/[projectId]/map → Map workspace per project
  (executive)/      → Executive dashboard
  (field)/          → Field dashboard
  (admin)/          → Admin dashboard
  api/auth/session  → POST: exchanges tokens → sets server cookies
  api/auth/debug    → GET: debug cookie/session state

src/domains/{domain}/
  model/            → TypeScript interfaces
  actions/          → "use server" Server Actions (called from client)
  queries/          → Supabase read queries (server-side)
  services/         → Business logic classes
  validation/       → Zod schemas

src/lib/supabase/
  supabase-browser.ts   → createBrowserClient (singleton, writes to document.cookie)
  supabase-server.ts    → createServerClient (reads next/headers cookies)
  supabase-middleware.ts → updateSession (refreshes token in middleware)

middleware.ts → Protects /dashboard, /map, /projects, /{id}/map routes
```

## Execution Flow

1. User visits `/login` → `signInWithPassword` via `createBrowserClient`
2. `auth-service.ts` POSTs `{access_token, refresh_token}` to `/api/auth/session`
3. Route handler calls `supabase.auth.setSession()` → writes `sb-*` cookies to browser via `NextResponse`
4. Middleware (`middleware.ts`) runs `updateSession()` on every request → refreshes token, redirects unauthenticated users
5. User navigates to `/projects` → `createProject` Server Action invoked
6. Server Action calls `createSupabaseServer()` → reads cookies → `auth.getUser()` → queries `organization_members` → inserts into `projects`
7. User opens `/[projectId]/map` → `MapWorkspace` renders with `MapProvider` context
8. Controllers (`SpatialController`, `TaskController`, etc.) load data and subscribe to map events
9. User draws polygon → `createSpatialNode` Server Action saves GeoJSON to DB
10. Clicking a zone shows `ZoneTaskPanel` with tasks for that spatial node

## API Interfaces

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/session` | POST | Exchange `{access_token, refresh_token}` → set server-readable cookies |
| `/api/auth/debug` | GET | Returns current cookie count + user from server perspective |
| `/api/health` | GET | Health check |

**Server Actions (key):**
- `createProject(FormData)` — `domains/project/actions/index.ts`
- `createSpatialNode(projectId, input)` — `domains/spatial/actions/create-spatial-node.ts`
- `createWorkItem(input)` — `domains/work/actions/create-work-item.ts`
- `updateWorkProgress(id, percent)` — `domains/work/actions/update-work-progress.ts`
- `updateWorkItem(id, input)` — `domains/work/actions/update-work-item.ts`

## Database Model

```
auth.users (Supabase managed)
  └─ organizations (name, owner_id → users)
       └─ organization_members (organization_id, user_id, role: owner|admin|member)
            └─ projects (name, organization_id)
                 └─ project_members (project_id, user_id, role: manager|engineer|viewer)
                 └─ spatial_nodes (project_id, parent_id, type, name, geometry GeoJSON)
                      └─ work_items (project_id, spatial_node_id, title, status, progress)
                      └─ defects (project_id, spatial_node_id, inspection_id, severity, status)
                      └─ evidence (project_id, spatial_node_id, work_item_id, defect_id, file_url)
                      └─ inspections (project_id, spatial_node_id, status)
                      └─ timeline_events (project_id, spatial_node_id, type, timestamp)
                      └─ progress_records (project_id, spatial_node_id, progress_percent)
```

**Spatial node types:** `site → building → floor → zone → area` (self-referencing tree via `parent_id`)

**RLS:** All tables have Row Level Security. Access scoped to organization membership.

## External Services

| Service | Usage |
|---|---|
| **Supabase** | PostgreSQL DB, Auth (email/password), Row Level Security, Storage (evidence files) |
| **Mapbox GL JS** | Interactive map rendering, layer management |
| **@mapbox/mapbox-gl-draw** | Drawing tools for spatial zone polygons |

**Environment variables required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN` (assumed, used in map)

## Key Business Logic

1. **Multi-tenancy:** Every resource is scoped to `organization_id`. User → org via `organization_members`. New user auto-creates org via DB trigger `handle_new_user_org` (migration 002b).

2. **Spatial hierarchy:** Zones are nodes in a tree. Tasks/defects/evidence attach to any node in the tree via `spatial_node_id`. This enables zone-level progress tracking.

3. **Progress tracking:** `work_items.progress` (0–100). Auto-completes (`status = completed`) when progress reaches 100 via `updateWorkProgress` action.

4. **Session bridging:** `createBrowserClient` writes session to `document.cookie`. After login, `/api/auth/session` route is called to explicitly set server-readable HTTP cookies via `NextResponse.cookies`. This is the critical bridge for Server Actions to authenticate.

5. **Dashboard aggregation:** `DashboardService` aggregates tasks by status, defects by severity, overdue tasks, completion rate, and tasks-per-zone in a single parallel fetch.

6. **RLS recursive issue (known):** `organization_members` had a recursive self-referencing policy that caused empty results. Fixed in migration `005_fix_org_members_rls.sql` using `user_id = auth.uid()` directly.

## Important Files

| File | Why |
|---|---|
| `middleware.ts` | Auth guard + session refresh for all routes |
| `src/lib/supabase/supabase-server.ts` | Server client — used by ALL Server Actions |
| `src/lib/supabase/supabase-middleware.ts` | Session refresh in middleware |
| `src/app/api/auth/session/route.ts` | Critical bridge: sets server cookies after browser login |
| `src/domains/auth/services/auth-service.ts` | signIn/signUp — calls /api/auth/session after login |
| `src/domains/project/actions/index.ts` | createProject Server Action |
| `src/domains/spatial/actions/create-spatial-node.ts` | Creates map zones |
| `src/domains/work/actions/create-work-item.ts` | Creates tasks |
| `src/features/map-workspace/map-workspace.tsx` | Root map UI component |
| `src/features/map-workspace/spatial-controller.tsx` | Handles zone drawing + selection |
| `src/domains/dashboard/services/dashboard-service.ts` | Metrics aggregation |
| `supabase/migrations/002_auth_organizations.sql` | Org/membership tables + RLS |
| `supabase/migrations/002b_fix_trigger.sql` | Auto-create org on signup trigger |
| `supabase/migrations/005_fix_org_members_rls.sql` | Fix recursive RLS on org_members |

## Where To Add New Features

| Feature type | Location |
|---|---|
| New DB entity | Add migration in `supabase/migrations/`, create model in `src/domains/{domain}/model/` |
| New Server Action | `src/domains/{domain}/actions/` with `"use server"` directive |
| New DB query | `src/domains/{domain}/queries/` using `createSupabaseServer()` |
| New page/route | `src/app/(group)/path/page.tsx` |
| New map controller | `src/features/map-workspace/{name}-controller.tsx`, register in `map-workspace.tsx` |
| New UI feature | `src/features/{domain}/components/` |
| New dashboard metric | Extend `ProjectMetrics` interface + `DashboardService.getProjectMetrics()` |

## Known Issues / Technical Debt

1. **RLS recursive policy** on `organization_members` — fixed in migration 005 but must be run manually in Supabase SQL Editor.

2. **Session cookie bridging** — `/api/auth/session` is a workaround. Ideal fix: use Supabase Auth with PKCE redirect flow or server-side `signInWithPassword` via a Server Action.

3. **`as any` casts** — Supabase generated types (`database.types.ts`) may not cover all tables added in migrations 002+. Tables like `organizations`, `organization_members`, `project_members` are cast with `as any` in Server Actions.

4. **AI domain is a stub** — `domains/ai/actions/index.ts` throws `Not implemented` for all methods.

5. **`updateProject` and `archiveProject`** were removed from `domains/project/actions/index.ts` — need re-implementation if project editing is required.

6. **Email rate limiting** on Supabase free tier (3/hour) — disable email confirmations in Supabase Auth Settings for development.

7. **No optimistic UI** — all mutations await server confirmation before updating UI.

8. **`work_items.progress` vs `progressPercent`** — both fields exist on `WorkItem` model and map to the same DB column (`progress`). `progressPercent` is an alias.

## AI QUICK CONTEXT

ammap is a Next.js 14 App Router construction management SaaS with Supabase backend and Mapbox map.
Multi-tenant: User → Organization → Projects → SpatialNodes (zone tree) → WorkItems/Defects/Evidence.
Auth uses @supabase/ssr: browser client writes cookies, `/api/auth/session` route bridges them to server-readable HTTP cookies for Server Actions.
All data mutations go through "use server" Server Actions in `src/domains/{domain}/actions/`.
The main UI is a Mapbox map workspace where users draw zones, then manage tasks/defects per zone.
RLS policies on all Supabase tables — scoped to organization membership.
Migrations in `supabase/migrations/` must be run manually in Supabase SQL Editor (no CLI setup).
Critical pending fix: run `005_fix_org_members_rls.sql` to fix recursive RLS causing "No organization found" errors.
