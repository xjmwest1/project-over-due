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
  color?: string      // accent for card + board header (preset palette)
  sortOrder: number
  archivedAt?: string // ISO; excluded from default lists
  createdAt: string
  updatedAt: string
}

Task {
  id: string
  projectId: string
  title: string
  status: 'backlog' | 'ready' | 'doing' | 'blocked' | 'done'
  note?: string       // plain text, max ~2k chars
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
   - Long-press or ⋯ → archive, rename, color  

2. **Board (per project)**  
   - Header: back, project name, progress mini-bar  
   - Horizontal scroll **swim lanes** on mobile (one lane full-width optional setting later; MVP: horizontal snap scroll per lane column)  
   - **Alternative MVP layout (recommended):** Vertical stack of lanes; each lane scrolls horizontally for tasks — easier thumb reach than tiny columns  
   - FAB or bottom bar: **Add task** (defaults to Backlog)  
   - Task card: title only; tap → detail sheet; long-press → drag handle mode  

3. **Task detail (bottom sheet)**  
   - Title editable inline  
   - Status as segmented control or lane picker  
   - Note field  
   - Delete with confirm  

4. **Progress overview (segment on home or tab)**  
   - Total remaining tasks  
   - Per-project bars sorted by remaining count  
   - “Blocked” highlight if any blocked > 0  

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
  "project": { "name": "Kitchen Reno", "color": "mint" },
  "tasks": [
    { "title": "Order cabinet pulls", "status": "ready" },
    { "title": "Install countertop", "status": "blocked", "note": "After template" }
  ]
}
```

| Field | Rules |
|-------|--------|
| `version` | Must be `1` |
| `project.name` | Required |
| `project.color` | Optional preset; default `mint` |
| `tasks[].title` | Required |
| `tasks[].status` | Optional; default `backlog` |
| `tasks[].note` | Optional |

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
| Quick complete | Swipe right on card → Done (with undo toast 5s) |
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
│   ├── app/                  routes, layout
│   ├── components/           ui primitives, TaskCard, Lane, ProjectCard
│   ├── features/             projects, board, task-detail, overview
│   ├── lib/                  db, ids, metrics, ai-import-prompt, bundle-schema
│   ├── stores/               projectStore, taskStore
│   └── styles/               tokens, globals
└── public/                   icons for PWA
```

### Persistence

- All reads/writes go through a small **repository layer** (`lib/db.ts`) so sync backend can be added later without UI changes.
- **AI bundle import** — primary bulk create path (see above).
- **Export all JSON** in Settings — full backup for device migration (separate from bundle v1).

---

## API surface (in-app, not HTTP)

```ts
// Projects
createProject(name, color?)
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
```

---

## Implementation plan

### Phase 0 — Scaffold (½ session)

- [ ] Vite React TS, Tailwind, router, Zustand
- [ ] Design tokens (colors, spacing, fonts)
- [ ] IndexedDB schema + seed optional demo project
- [ ] PWA manifest + icons (minimal)

### Phase 1 — Projects home (½ session)

- [ ] Project CRUD + archive
- [ ] Project cards with live metrics
- [ ] Empty state + add project modal
- [ ] **Import from AI** screen: copy prompt + paste JSON + preview + `importProjectBundle`

### Phase 2 — Board + tasks (1 session)

- [ ] Lane layout (vertical lanes, horizontal task scroll per lane)
- [ ] Task CRUD, cards, detail sheet
- [ ] Status change via sheet (ship before drag)

### Phase 3 — Mobile moves (1 session)

- [ ] dnd-kit: drag across lanes + reorder
- [ ] Swipe-to-done + undo toast
- [ ] Touch/scroll conflict tuning

### Phase 4 — Overview + polish (½ session)

- [ ] Global progress view / blocked callout
- [ ] Export all data JSON (backup)
- [ ] Lighthouse mobile pass, meta theme-color, safe-area insets

### Phase 5 — Deploy (optional)

- [ ] Static build + deploy URL
- [ ] Document “Add to Home Screen” for iOS/Android

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

## Open decisions (confirm before build)

1. **Board layout:** Vertical lanes (recommended for mobile) vs horizontal column scroll like Linear desktop?
2. **Default lanes:** Keep fixed five statuses or allow rename only?
3. **Hosting:** Local-only PWA vs deployed URL for phone access away from home Wi‑Fi?

**Decided:** Bulk project creation via **AI bundle** + in-app **copy prompt / paste JSON** (no MCP).

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Drag vs scroll on mobile | Activation delay, vertical lane layout, status picker fallback |
| Data loss | IndexedDB + export all JSON; optional periodic download reminder |
| Invalid AI JSON | Strict schema + preview; strip markdown fences; clear error messages |
| Prompt drift | `version: 1` in bundle + `PROMPT_VERSION` in app |
| Scope creep | Fixed lanes, no subtasks, no auth in MVP |
