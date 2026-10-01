# project over-due

Personal, mobile-first home project task manager (Linear-inspired UI, project → task hierarchy, status swim lanes).

## Docs

| File | Description |
|------|-------------|
| [docs/MVP_SPEC.md](docs/MVP_SPEC.md) | Product spec, UI, data model, implementation plan |
| [docs/project-bundle.schema.json](docs/project-bundle.schema.json) | JSON Schema for AI bundle import (v1) |
| [docs/ai-import-prompt.txt](docs/ai-import-prompt.txt) | Copy-paste prompt for generating bundle JSON in any chat model |

## Design mockup

- [mockup/lane-layout.html](mockup/lane-layout.html) — mobile board layout (vertical lanes, horizontal task scroll)

## App (Phase 0)

Vite + React 19 + TypeScript, Tailwind v4, React Router, Zustand, IndexedDB (`idb`), PWA (`vite-plugin-pwa`).

```bash
npm install
npm run dev
npm run build
```

Source layout: `src/app` (router + pages), `src/features` (domain modules, Phase 1+), `src/lib/db.ts` (repository), `src/stores`, `src/styles/tokens.css`.

First launch seeds an optional **Welcome** demo project in IndexedDB.
