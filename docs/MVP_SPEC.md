# Home Projects Task Manager — MVP Spec

## Vision

A **single-user**, **mobile-first** task manager for home projects. Visual language inspired by Linear: dark UI, tight typography, minimal chrome, fast interactions. Core mental model: **Projects → Tasks** organized in **status swim lanes** (kanban columns) with clear **progress and remaining work** at a glance.

---

## Goals (MVP)

| Goal | Success signal |
|------|----------------|
| See all home projects and how each is progressing | Project list shows done/total and % |
| Move tasks between stages on a phone | Drag or one-tap status change without precision UI |
| Know what’s left | “Remaining” count per project and globally |
| Stay simple | No accounts, no collaboration, no integrations |

## Non-goals (MVP)

- Multi-user, sharing, permissions
- Comments, attachments, rich text, @mentions
- Calendar, Gantt, time tracking, reminders/notifications
- Subtasks (defer to v1.1 unless trivial)
- Native iOS/Android apps (PWA is enough for MVP)
- Server sync across devices (optional v1.1)
- MCP / HTTP API for agents (bootstrap uses **AI bundle import** instead)

---

## Personas & flows

**You, on phone, 30 seconds:** Open app → pick project → board view → drag “Fix guest room shelf” to **Doing** → back to home → see one fewer item in **Backlog** for that project.

**You, planning Sunday:** Projects overview → sort by “most remaining” → open **Kitchen Reno** → scan **Blocked** lane → add two tasks via quick-add.

---

## Information architecture

```
Home (Projects overview)
├── Project card → Project board (swim lanes)
│   ├── Lane: Backlog
│   ├── Lane: Ready
│   ├── Lane: Doing
│   ├── Lane: Blocked
│   └── Lane: Done
└── Global progress strip (optional footer on home)

Task detail (sheet / full screen on mobile)
├── Title, status, project (read-only or change)
├── Optional short note (plain text, one field)
└── Delete
```

### Swim lanes (fixed for MVP)

| Lane | Meaning |
|------|---------|
| **Backlog** | Captured, not started |
| **Ready** | Can start now |
| **Doing** | Active (WIP limit: soft warning if >3, not blocking) |
| **Blocked** | Waiting on something |
| **Done** | Complete (hidden from “remaining” counts) |

Lanes are **global statuses** shared across projects on the board view (filter: one project at a time on mobile). Home view aggregates across projects.

---

## Data model

```ts
Project {
  id: string          // uuid
  name: string
  color: string       // user-chosen accent preset (card left border / dot, board header)
  note?: string       // plain text; optional short blurb about the project
  links: Link[]       // reference URLs (docs, shopping lists, etc.); default []
  archivedAt?: string // ISO; excluded from default lists
  createdAt: string
  updatedAt: string
}

Link {
  url: string         // absolute https URL (validate on write)
  label?: string      // optional display title; fallback to URL host/path in UI
}

Task {
  id: string
  projectId: string
  title: string
  status: 'backlog' | 'ready' | 'doing' | 'blocked' | 'done'
  note?: string       // plain text, max ~2k chars
  links: Link[]       // reference URLs for this task; default []
  sortOrder: number   // within lane
  createdAt: string
  updatedAt: string
  completedAt?: string
}

AppMeta {
  schemaVersion: number
  lastOpenedAt?: string
}
```

**Derived metrics (not stored):**

- `remaining(project)` = tasks where `status !== 'done'`
- `progress(project)` = `done / (done + remaining)` or 0 if empty
- Global remaining = sum across non-archived projects

**Home project list order (MVP):** no manual reorder — sort by `updatedAt` descending (most recently touched first). Task `sortOrder` within lanes is unchanged.

**Accent color:** one of the preset tokens (`mint` | `sky` | `violet` | `amber` | `rose` | `slate`). Set on create (default `mint`); user can change anytime from project edit / ⋯ menu. Used only as accent chrome, not lane or task colors.

---

## UI / visual spec (Linear-adjacent)

- **Theme:** Dark base (`#0d0d0f`–`#111`), elevated surfaces `+4%` lightness, 1px borders `white/8%`
- **Type:** System UI stack or Inter; 15–16px body; semibold titles; muted secondary for counts
- **Accent:** Per-project color on left border / dot only (avoid rainbow boards)
- **Density:** Comfortable touch targets ≥ 44px; task rows as cards in lanes
- **Motion:** 150–200ms transitions on status change; haptic-friendly feedback where supported
- **Empty states:** One line + primary action (“Add first task”)

### Key screens

1. **Projects (default route)**  
   - Sticky header: “Projects” + add project  
   - Cards: name, progress bar, `3/12 done · 9 left`  
   - Tap → board  
   - Long-press or ⋯ → archive, rename, accent color, note, links  

2. **Board (per project)**  
   - Header: back, project name, progress mini-bar; optional note + links entry (sheet or compact row)  
   - **Layout (decided):** Vertical stack of the five fixed lanes; each lane scrolls **horizontally** for its task cards (see [mockup/lane-layout.html](../mockup/lane-layout.html))  
   - FAB or bottom bar: **Add task** (defaults to Backlog)  
   - Task card: title only; tap → detail sheet; long-press → drag handle mode  

3. **Task detail (bottom sheet)**  
   - Title editable inline  
   - Status as segmented control or lane picker  
   - Note field  
   - Links list (add / edit / remove)  
   - Delete with confirm  

4. **Progress overview (segment on home or tab)**  
   - Total remaining tasks  
   - Per-project bars sorted by remaining count  

5. **Import from AI (bundle flow)** — see [AI project bundle import](#ai-project-bundle-import)

---

## AI project bundle import

Primary way to **create a new project with many tasks** at once: copy a built-in prompt → paste into any chat model → bring JSON back into the PWA. No server, no MCP.

### User flow (two steps, one screen or stepper)

```
Home → “Import from AI”
  Step A — Prepare
    • Short instructions (3 lines)
    • [Copy prompt] — copies full prompt from app (see docs/ai-import-prompt.txt)
    • User switches to ChatGPT / Claude / etc., pastes prompt, adds project description
  Step B — Import
    • Large paste field for JSON
    • [Parse & preview] → show project name, color, task count, counts per lane
    • [Create project] — disabled until valid; on success → navigate to new board
    • Errors: inline message (schema, unknown fields stripped, empty tasks)
```

**Entry points:** empty-state CTA on home (“Plan with AI”); **+** menu on home; optional link from manual “New project” sheet (“Or import many tasks from AI”).

**Copy prompt UX:** one tap copies to clipboard; toast “Prompt copied”; optional “Copy again”. Prompt is **versioned in code** (`PROMPT_VERSION = 1`) so future schema changes can show “Update your prompt” if needed.

**Paste UX:** accept raw JSON or text wrapped in markdown fences; strip ```json … ``` before parse. Trim BOM/whitespace.

**Preview (required before commit):** do not import on first paste. User must confirm after seeing:

- Project name + color swatch  
- Total tasks  
- Breakdown: Backlog / Ready / Doing / Blocked / Done  
- First ~5 task titles (expandable)

**Import behavior:** single IndexedDB transaction — create `Project`, then create each `Task` with `sortOrder` = array index within same status groups preserved by global index. Set `createdAt` / `updatedAt` server-side (client clock). On failure, roll back entire bundle (no partial project).

**Duplicate names:** allowed (user may have two “Garden” projects). No dedupe in MVP.

### Bundle schema (v1)

Canonical JSON Schema: [`docs/project-bundle.schema.json`](project-bundle.schema.json).

```json
{
  "version": 1,
  "project": { "name": "Kitchen Reno", "color": "mint", "note": "Q2 refresh, keep existing layout" },
  "tasks": [
    { "title": "Order cabinet pulls", "status": "ready" },
    {
      "title": "Install countertop",
      "status": "blocked",
      "note": "After template",
      "links": [{ "url": "https://example.com/counter-vendor", "label": "Fabricator portal" }]
    }
  ]
}
```

| Field | Rules |
|-------|--------|
| `version` | Must be `1` |
| `project.name` | Required |
| `project.color` | Optional accent preset; default `mint` on import |
| `project.note` | Optional; copied to stored project; `project.links` start as `[]` (edit in app) |
| `tasks[].title` | Required |
| `tasks[].status` | Optional; default `backlog` |
| `tasks[].note` | Optional |
| `tasks[].links` | Optional; default `[]`; same shape as stored `Link` |

Validation: use Zod (or similar) mirroring the schema; reject `version !== 1` with message to re-copy prompt.

### Copyable prompt (source of truth for copy button)

Full text lives in [`docs/ai-import-prompt.txt`](ai-import-prompt.txt). The app embeds the same string in `src/lib/ai-import-prompt.ts` (keep in sync when editing).

The prompt ends with `My project:` so the user can paste the prompt and continue typing—or send a follow-up message describing the project.

### In-app repository

```ts
importProjectBundle(bundle: ProjectBundleV1): Promise<{ projectId: string }>
parseProjectBundleJson(raw: string): ProjectBundleV1 // strips fences, JSON.parse, validate
```

### Settings (secondary)

- **Export all data** — full backup JSON (all projects), separate from bundle format.  
- Bundle import is **create-only** in MVP (does not merge into existing project).

---

## Mobile interaction spec

| Action | MVP behavior |
|--------|----------------|
| Move task | Long-press drag between lanes **or** status chips in detail sheet |
| Reorder within lane | Drag handle after long-press (same gesture system) |
| Add task | FAB → inline title → save to Backlog |
| Archive project | Settings on project; tasks stay but hidden from home |

Use **@dnd-kit** with touch sensors and `TouchSensor` activation delay (~200ms) to avoid scroll conflicts.

---

## Technical approach

### Stack (recommended)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| App | **Vite + React 19 + TypeScript** | Fast dev, small bundle |
| Styling | **Tailwind CSS v4** | Linear-like tokens easy |
| Routing | **React Router** or **TanStack Router** | Few routes |
| State | **Zustand** + persist middleware | Simple, works with IndexedDB |
| Storage | **IndexedDB** via `idb` or `localforage` | Survives refresh, enough for thousands of tasks |
| DnD | **@dnd-kit/core** | Mobile touch support |
| PWA | `vite-plugin-pwa` | Add to home screen |
| Deploy | Static host (Cloudflare Pages, Vercel, or nginx on homelab) | No server for MVP |

### Repository layout (planned)

```
/
├── docs/MVP_SPEC.md          (this file)
├── package.json
├── index.html
├── src/
│   ├── app/                  router + root layout + *Page.tsx (one per route)
│   ├── components/           shared UI primitives; cross-feature presentational pieces
│   ├── features/             domain modules (projects, board, task-detail, overview)
│   ├── lib/                  db, ids, metrics, ai-import-prompt, bundle-schema
│   ├── stores/               projectStore, taskStore
│   └── styles/               tokens, globals
└── public/                   icons for PWA
```

**No top-level `pages/` or `routes/` folder** — URL → screen wiring lives entirely under `app/` (see [Decisions log](#decisions-log)).

| Folder | Owns | Does not own |
|--------|------|----------------|
| `app/` | `router.tsx`, layouts, thin `*Page.tsx` that compose features | Business logic, IndexedDB, heavy UI |
| `features/` | Screens parts, modals, hooks used by one product area | Route table, path strings |
| `components/` | Reusable buttons, sheets, cards used by 2+ features | Feature-specific workflows |
| `lib/` | DB repository, validation, metrics, prompts | React components |
| `stores/` | Zustand stores shared across features | Route definitions |

**Import rule (MVP):** `features/*` may import from `components`, `lib`, and `stores`. Features should not import from sibling features; pages in `app/` wire them together. `app/` imports from `features/` and `components/` only as needed for each route.

### Persistence

- All reads/writes go through a small **repository layer** (`lib/db.ts`) so sync backend can be added later without UI changes.
- **AI bundle import** — primary bulk create path (see above).
- **Export all JSON** in Settings — full backup for device migration (separate from bundle v1).

---

## API surface (in-app, not HTTP)

```ts
// Projects
createProject(name, opts?: { color?, note?, links? })
updateProject(id, patch)
archiveProject(id)
listProjects({ includeArchived? })

// Tasks
createTask(projectId, title, status?)
updateTask(id, patch)
moveTask(id, { status, sortOrder? })
deleteTask(id)
listTasksByProject(projectId)
listTasksByStatus(projectId, status)

// Metrics
getProjectMetrics(projectId)
getGlobalMetrics()

// AI bundle
parseProjectBundleJson(raw: string): ProjectBundleV1
importProjectBundle(bundle: ProjectBundleV1): Promise<{ projectId: string }>

// Backup
exportAllData(): Promise<AppBackupV1>
```

---

## Implementation plan

### Phase 0 — Scaffold (½ session)

- [x] Vite React TS, Tailwind, router, Zustand
- [x] Design tokens (colors, spacing, fonts)
- [x] IndexedDB schema + seed optional demo project
- [x] PWA manifest + icons (minimal)

### Phase 1 — Projects home (½ session)

- [x] Project CRUD + archive
- [x] Project cards with live metrics (horizontal status strip + unified board)
- [x] Empty state + add project modal
- [x] **Import from AI** screen: copy prompt + paste JSON + preview + `importProjectBundle`

### Phase 2 — Board + tasks (1 session)

- [x] Lane layout (vertical lanes, horizontal task scroll per lane) — home board + project filter
- [x] Task CRUD, cards, detail sheet
- [x] Status change via sheet (ship before drag)

### Phase 3 — Mobile moves (1 session)

- [x] dnd-kit: drag across lanes + reorder (single-project board / `?p=` filter)
- [x] Touch/scroll conflict tuning

### Phase 4 — Overview + polish (½ session)

- [x] Global progress view
- [x] Export all data JSON (backup)
- [x] General mobile polish: `theme-color`, safe-area insets, small a11y/touch fixes (no formal Lighthouse run required)

### Phase 5 — Deploy (PWA hosting)

- [ ] Static build + **deployed HTTPS URL** (e.g. Cloudflare Pages, Vercel, or homelab static host)
- [ ] PWA installable from that URL; document “Add to Home Screen” for iOS/Android

**MVP definition of done:** You can manage ≥3 projects with 20+ tasks each on a phone: add/edit/delete, move across all lanes, see remaining counts on home, **import a new project from AI-generated bundle JSON**, data persists after reload, installable as PWA.

---

## v1.1 backlog (post-MVP)

- Subtasks or checklist inside a task
- Custom lanes per project (with migration)
- Sync: Supabase single-row JSON blob or ElectricSQL
- Filters: “all projects” combined board
- Search
- Keyboard shortcuts on desktop
- Light theme toggle

---

## Decisions log

Recorded choices for implementation (newest related entries grouped by topic).

### Product & data

| Decision | Choice |
|----------|--------|
| Bulk project + tasks bootstrap | **AI bundle** + in-app copy prompt / paste JSON (no MCP, no HTTP API in MVP) |
| Project home list order | Sort by `updatedAt` desc; **no** `sortOrder` on projects in MVP |
| Project accent | `color` is a **user-editable preset** (`mint` \| `sky` \| `violet` \| `amber` \| `rose` \| `slate`); accent chrome only (card border/dot, board header) |
| Project text field | **`note`** (optional plain text), not `description` |
| Project links | `links: Link[]` on stored project; default `[]`; **not** in AI bundle v1 (edit in app after import) |
| Task links | `links: Link[]` on each task; default `[]`; optional in AI bundle per task |
| Shared link shape | `Link { url, label? }` — validate `https` on write |
| Task lane order | Keep **`sortOrder` on tasks** (within lane) |
| Storage | IndexedDB object stores: `projects`, `tasks`, `meta` — metrics derived, not stored |
| Board layout | **Vertical lanes**, horizontal scroll within each lane (mobile-first); not column-style horizontal lane scroll |
| Swim lanes | **Fixed five statuses** (Backlog, Ready, Doing, Blocked, Done) — no per-project or renameable lanes in MVP |
| Hosting | **Static HTTPS deploy + PWA** — public URL for phone use off local Wi‑Fi; data stays client-side (IndexedDB) |

### Frontend structure

| Decision | Choice |
|----------|--------|
| Routes + pages | **Combined under `src/app/`** — `router.tsx`, layouts, and one `*Page.tsx` per route; no separate `pages/` or `routes/` folder |
| Feature folders | **Domain modules** (`features/projects`, `board`, `task-detail`, `overview`) — UI/logic for that area; **no** route configuration inside features |
| Route pages | Thin: mount layout + import from the matching `features/*` module |
| Cross-feature imports | Avoid feature → feature; compose in `app/*Page.tsx` |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Drag vs scroll on mobile | Activation delay, vertical lane layout, status picker fallback |
| Data loss | IndexedDB + export all JSON; optional periodic download reminder |
| Invalid AI JSON | Strict schema + preview; strip markdown fences; clear error messages |
| Prompt drift | `version: 1` in bundle + `PROMPT_VERSION` in app |
| Scope creep | Fixed lanes, no subtasks, no auth in MVP |
