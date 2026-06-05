# Agent Instructions — tridorian Course Platform

This document defines the rules, conventions, and context an AI coding agent needs to work effectively on this codebase.

---

## 1. Project Overview

This is a **React + Vite** interactive course platform with a dark "tridorian" terminal theme. Content is stored as JSON files and loaded dynamically at runtime — the app is completely decoupled from its content.

### Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | React 18 | Functional components, hooks only |
| Build | Vite 5 | Config in `vite.config.js` |
| Routing | react-router-dom v7 | HashRouter, `useParams()` returns **strings** |
| Styling | Tailwind CSS 3 | With `tailwindcss-animate` plugin |
| Icons | Lucide React | Import from `lucide-react` |
| Testing | Vitest + React Testing Library | Config in `vitest.config.js` |
| Deployment | GitHub Pages | Via GitHub Actions on `main` |

### Content Hierarchy (4-tier)

```
Track (e.g., "agentic-engineering")
 └── Course (e.g., "agy-101", "gemini-cli")
      └── Module (e.g., "01-course-introduction.json")
           └── Step/Block (content blocks inside a module)
```

---

## 2. Repository Structure

```
course-catalog/
├── AGENTS.md                    # ← You are here
├── README.md                    # Project overview + getting started
├── TODO.md                      # Phased roadmap with checkboxes
├── package.json                 # Dependencies and scripts
├── index.html                   # Vite entry point
├── vite.config.js               # Vite configuration
├── vitest.config.js             # Test configuration
├── tailwind.config.js           # Tailwind theme config
├── postcss.config.js            # PostCSS config
├── .env.example                 # Environment variables template
│
├── docs/                        # All documentation
│   ├── ARCHITECTURE.md          # System architecture & design decisions
│   ├── CONTENT_GUIDE.md         # How to author course content (JSON schemas)
│   ├── TRIDORIAN_SPEC.md        # Google Docs → JSON sync specification
│   └── prompts/                 # Phase-specific implementation prompts
│       ├── 01-phase-1-*.md
│       ├── 02-phase-2-*.md
│       ├── 03-phase-3-*.md
│       └── 04-phase-4-*.md
│
├── src/                         # Application source code
│   ├── main.jsx                 # React root + HashRouter
│   ├── App.jsx                  # Main controller (routing, state, layout)
│   ├── index.css                # Global styles
│   │
│   ├── components/              # UI components
│   │   ├── Dashboard.jsx        # Root landing page — lists all tracks
│   │   ├── TrackPage.jsx        # Track landing page — lists all courses in a track
│   │   ├── ModuleRenderer.jsx   # Routes module.type → correct renderer
│   │   ├── ContentRenderer.jsx  # Renders lab blocks (h1, p, code, grid, etc.)
│   │   ├── Embeds.jsx           # Google Slides / Video embed wrappers + dev-mode URL editor
│   │   ├── CodeBlock.jsx        # Terminal-style code display
│   │   ├── InfoBox.jsx          # Green info callout
│   │   └── WarningBox.jsx       # Red warning callout
│   │
│   ├── services/                # Data fetching & external APIs
│   │   ├── contentLoader.js     # Fetch manifest, metadata, modules + validation
│   │   ├── googleAuth.js        # Google OAuth2 (Phase 4, not yet active)
│   │   └── googleDrive.js       # Google Drive persistence (Phase 4, not yet active)
│   │
│   └── __tests__/               # All tests
│       ├── setup.js             # Vitest setup (jsdom + jest-dom)
│       ├── App.test.jsx         # Integration tests for App
│       ├── Navigation.test.jsx  # Navigation + deep linking tests
│       ├── contentLoader.test.js # Unit tests for fetch utilities
│       └── components/
│           └── ModuleRenderer.test.jsx  # Module type switching tests
│
├── public/content/              # Runtime course content (JSON)
│   ├── catalog.json             # Root catalog listing all tracks
│   └── tracks/
│       └── [track_id]/
│           ├── track.json           # Track manifest listing all courses
│           └── [course_id]/
│               ├── manifest.json    # Course module listing
│               ├── metadata.json    # Course title, author, description
│               └── modules/         # Individual module JSON files
│
├── scripts/                     # Build & sync tooling
│   └── google-apps-script/
│       └── CourseValidator.gs   # Google Apps Script validator
│
└── app.js                       # LEGACY — original monolithic version (DO NOT USE)
```

---

## 3. Critical Rules

### 3.1 Module IDs Must Be Strings

> **This is the #1 source of bugs in this codebase.**

React Router's `useParams()` always returns strings. Module IDs in `manifest.json` and module JSON files **must be strings**:

```json
✅ "id": "1"
❌ "id": 1
```

The app has a defensive `String()` coercion in `App.jsx`, but content should still use strings. **Always verify ID types when creating or modifying content JSON.**

### 3.2 Always Run Tests Before Finishing

```bash
npx vitest run
```

All 14+ tests must pass. Never commit with failing tests.

### 3.3 Test Co-location

Tests live in `src/__tests__/`. Component-specific tests go in `src/__tests__/components/`. Mirror the source structure:

- `src/App.jsx` → `src/__tests__/App.test.jsx`
- `src/components/ModuleRenderer.jsx` → `src/__tests__/components/ModuleRenderer.test.jsx`
- `src/services/contentLoader.js` → `src/__tests__/contentLoader.test.js`

### 3.4 Documentation Sync

> **After every task, update ALL relevant documentation files.**

The following files must be kept in sync with code changes:

| File | Update When |
|------|------------|
| `TODO.md` | Any task/phase item is completed, started, or added |
| `docs/ARCHITECTURE.md` | Architecture, state management, routing, or components change |
| `docs/CONTENT_GUIDE.md` | Content JSON schema, module types, or authoring workflow changes |
| `README.md` | Setup steps, tech stack, or project structure changes |
| `AGENTS.md` | New conventions, rules, or gotchas are discovered |

---

## 4. Development Workflow

### Configuring Jules Environment Setup

Jules runs codebase tasks within an isolated VM. To optimize VM startup times and cache dependencies (like `puppeteer` for screenshots), use the provided setup script:

1. Go to the codebase configuration on the **Jules Web Interface** (https://jules.google).
2. Set the **Initial Setup** command field to:
   ```bash
   ./scripts/setup-jules.sh
   ```
3. Click **Run and Snapshot** to validate the script and create a cached environment snapshot.

### Starting the Dev Server

```bash
npm install    # First time only
npm run dev    # Starts on http://localhost:5173
```

### Running Tests

```bash
npx vitest run           # One-shot, CI-friendly
npx vitest               # Watch mode for development
npx vitest run --reporter=verbose  # Detailed output
```

### Building for Production

```bash
npm run build   # Output in dist/
npm run preview # Preview production build locally
```

### Creating a Feature Branch

```bash
git checkout -b feature/description-here
# ... make changes ...
npx vitest run  # Verify tests pass
git add -A && git commit -m "feat: description"
```

---

## 5. Content Authoring Rules

### Module Types

| Type | Required Fields | Rendered By |
|------|----------------|-------------|
| `lab` | `id`, `title`, `type`, `blocks[]` | `ContentRenderer.jsx` |
| `presentation` | `id`, `title`, `type`, `url` | `Embeds.jsx` (Slides or Video) |
| `resource` | `id`, `title`, `type`, `url` | Resource card with external link |

### Block Types (for `lab` modules)

| Block Type | Description |
|-----------|-------------|
| `h1` | Main heading |
| `h2` | Section heading |
| `h3` | Sub-section heading |
| `p` | Paragraph text |
| `code` | Code block with `language` and `code` fields |
| `list` | Bulleted list with `items[]` |
| `grid` | Card grid with `items[]` (each has `icon`, `title`, `content`) |
| `info` | Green info callout box |
| `warning` | Red warning callout box |
| `slides` | Embedded Google Slides with `url` field |
| `video` | Embedded video with `url` field |
| `collapsible` | Expandable section with `title` and nested `blocks[]` |

### Adding a New Module

1. Create `public/content/tracks/[track]/[course]/modules/NN-slug.json`
2. Add entry to `manifest.json` with a **string** `id`
3. Run `npm run dev` and verify rendering
4. Run `npx vitest run` to confirm no regressions

### Adding a New Track

1. Add entry to `public/content/catalog.json` with `id`, `title`, `description`, `icon`
2. Create directory: `public/content/tracks/[new-track]/`
3. Add `track.json` listing the courses in this track
4. Navigate to `/#/[new-track]` — no code changes needed

### Adding a New Course

1. Create directory: `public/content/tracks/[track]/[new-course]/`
2. Add `manifest.json`, `metadata.json`, and `modules/` directory
3. Add the course to the track's `track.json`
4. Navigate to `/#/[track]/[new-course]` — no code changes needed

---

## 6. State Management

State is managed via React hooks in `AppContent` (inside `App.jsx`):

| State | Type | Purpose |
|-------|------|---------|
| `courseSteps` | `Array<Module>` | All loaded module objects for current course |
| `activeStepIndex` | `number` | Derived from URL `moduleId` param via `findIndex` |
| `completedSteps` | `number[]` | Array indices of completed modules |
| `courseMetadata` | `object` | Title, author, description from `metadata.json` |
| `isLoading` | `boolean` | Loading spinner state |
| `error` | `string\|null` | Error message for failed loads |

**Key behaviors:**
- `completedSteps` resets to `[]` when switching courses
- `activeStepIndex` is derived from URL on every render (not stored in state)
- Clicking "Next" marks the **current** step as completed, then navigates forward
- Step locking: step N is locked unless step N-1 is in `completedSteps`
- On the last module, "Complete Course" marks ALL steps complete and returns to Course Map
- Each loaded module is enriched with `_sourceFile` (the JSON file path) for dev-mode editing

---

## 7. Routing

The app uses `HashRouter` (for GitHub Pages compatibility):

| Pattern | View | Example |
|---------|------|---------|
| `/#/` | Dashboard (all tracks) | `/#/` |
| `/#/:trackId` | Track page (all courses) | `/#/agentic-engineering` |
| `/#/:trackId/:courseId` | Course Map | `/#/agentic-engineering/agy-101` |
| `/#/:trackId/:courseId/:moduleId` | Module view | `/#/agentic-engineering/agy-101/1` |

---

## 8. Known Issues & Gotchas

1. **`app.js` is legacy** — The root-level `app.js` is the original monolithic version with hardcoded JSX content. It is NOT used by the current app. Do not modify it. It will be removed in a future cleanup.

2. **Google services are Phase 4** — `googleAuth.js` and `googleDrive.js` are now functional but integration into the main UI components is still pending. Use the refined `googleDrive.js` for all persistence needs.

3. **Tailwind JIT purging** — Dynamic class names constructed via string interpolation may be purged. Always use full class strings or pass via `style` prop.

4. **Test mock manifests** — When writing tests, the mock manifest must use `file` (not `path`) for module entries to match what `App.jsx` reads: `mod.file`.

5. **Google Drive Document Duplication** — The course doc creation scripts (`create-course-docs.js` and `create-adk-docs.js`) originally queried only the top-level track folder. If `reorganize-drive.js` had moved a course document to its level subfolder (e.g. `L100`), the creation scripts would fail to find it, causing duplicates to be created in the top-level folder. Both scripts now check Drive by ID first (from `sync-config.json`) and fallback to checking both the track folder and its subfolders by name.

6. **Triggering Jules on GitHub Issues** — Creating an issue or tagging `@jules` in the issue body or comments does not automatically trigger the Jules agent. To trigger Jules on a GitHub issue, you must add the label `jules` to the issue. This fires the GitHub webhook to instantiate and run a remote session for that issue.

---

## 9. Current Roadmap Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1: Core Hierarchy | ✅ Complete | 4-tier content loading + schema validation |
| 2: Multi-Type Modules | ✅ Complete | Lab, Presentation, Resource renderers |
| 3: Dynamic Navigation | ✅ Complete | Deep linking, breadcrumbs, course map |
| Bug Fix: Navigation | ✅ Complete | ID type mismatch + multi-course support |
| 4: State Persistence | 🔲 Not Started | Google Drive sync, resume from session |
| Maintenance | 🔲 Ongoing | A11y, search, track-level index |

See [TODO.md](./TODO.md) for the detailed checklist.
