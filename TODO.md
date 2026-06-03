# Tridorian Course Platform Roadmap

This roadmap outlines the phased development of the platform, following a strict "Test-First" methodology. Each phase must meet its defined exit criteria before proceeding.

---

## Phase 1: Core Hierarchy & Schema Validation
**Objective:** Refactor the content loading system to support the 4-tier hierarchy (Track > Course > Module > Step).

### 1.1 Testing Infrastructure (Prerequisite)
- [x] **Step 1:** Implement unit tests for `fetchCourseManifest` and `fetchModuleContent` utilities.
- [x] **Step 2:** Create mock JSON structures for valid/invalid Tracks and Courses to test validation logic.
- [x] **Step 3:** Implement integration tests using Vitest/RTL to verify that a course loads correctly given a valid path.

### 1.2 Hierarchy Refactor
- [x] **Sub-step:** Update `src/App.jsx` to parse Track and Course IDs from the URL (e.g., `/#/agentic-engineering/agy-101`).
- [x] **Sub-step:** Refactor file fetching logic to use the new path structure: `public/content/tracks/[track]/[course]/`.
- [x] **Sub-step:** Implement a `ModuleSchema` validator to ensure JSON files contain required fields (`id`, `type`, `title`, `blocks`).

### Exit Criteria
- [x] Tests pass for manifest loading from arbitrary track/course paths.
- [x] Application gracefully handles "Course Not Found" errors.
- [x] **PR 1:** "Core: Implement 4-tier content loading and schema validation."

---

## Phase 2: Multi-Type Module Support
**Objective:** Implement specialized rendering for Lab, Presentation, and Resource modules.

### 2.1 Component Testing
- [x] **Step 1:** Write unit tests for `ModuleRenderer` to ensure it switches components based on `module.type`.
- [x] **Step 2:** Create visual regression tests (screenshots) for `Presentation` (Slides/Video) and `Resource` (Docs) components.

### 2.2 Presentation Modules
- [x] **Sub-step:** Create `src/components/modules/PresentationModule.jsx`.
- [x] **Sub-step:** Integrate `VideoEmbed` and `SlideDeckEmbed` into the layout.
- [x] **Sub-step:** Add support for "Presentation Notes" section below the embed.

### 2.3 Resource Modules
- [x] **Sub-step:** Create `src/components/modules/ResourceModule.jsx`.
- [x] **Sub-step:** Implement a "Document Gallery" or "Embedded Guide" view for Google Docs resources.

### Exit Criteria
- Module type `presentation` successfully renders a slide deck.
- Module type `resource` successfully renders a document list/embed.
- **PR 2:** "UI: Add support for Presentation and Resource module types."

---

## Phase 3: Dynamic Navigation & Deep Linking
**Objective:** Enhance the user experience with better navigation and URL persistence.

### 3.1 Navigation Testing
- [x] **Step 1:** Write tests for the `Sidebar` to verify it correctly highlights the active module and respects "locked" status.
- [x] **Step 2:** Write tests for breadcrumb generation based on the 4-tier hierarchy.

### 3.2 Routing & Breadcrumbs
- [x] **Sub-step:** Implement `react-router-dom` (or simple state-based routing) to support deep links to specific modules.
- [x] **Sub-step:** Add a Breadcrumb component: `Track > Course > Module`.
- [x] **Sub-step:** Implement "Course Map" view - a high-level overview of all modules in a course.

### Exit Criteria
- Users can share a URL that opens a specific module.
- Breadcrumbs correctly reflect the hierarchy.
- **PR 3:** "UX: Deep linking and hierarchical breadcrumb navigation."

---

## Bug Fix: Course Progression Navigation (Resolved)
**Objective:** Fix critical navigation bug preventing course progression via Next/Back/sidebar buttons.

### Root Cause
- [x] Module IDs in manifest and module JSON files were **numeric** (`"id": 1`), but React Router's `useParams()` returns **strings** (`"1"`). Strict equality `1 === "1"` always failed, locking `activeStepIndex` at `0`.

### Fixes Applied
- [x] Convert all module IDs to strings in both `agy-101` and `gemini-cli` courses (manifest + module JSON files).
- [x] Add defensive `String()` coercion in `App.jsx` findIndex lookup to prevent regression.
- [x] Reset `completedSteps` on course switch to support multi-course navigation without stale progress.
- [x] Fix missing `metadata` field in Navigation test mock.
- [x] Add regression test for numeric ID handling.
- [x] Update `ARCH.md` and `DOCS.md` with ID format requirements.
- [x] Add "Complete Course" button on last module (marks 100%, returns to Course Map).
- [x] Add dev-mode embed URL editor (pencil icon overlay showing source file + URL with copy buttons).

### Verification
- [x] 14/14 unit tests passing.
- [x] Browser-tested: Next, Back, sidebar clicks, deep linking, and multi-course switching all verified.
- [x] **Branch:** `fix/course-progression-nav`

---

## Phase 4: State Persistence & Google Drive Sync
**Objective:** Transition from `localStorage` to cloud-based progress saving and automated content updates.

### 4.1 Sync Testing
- [x] **Step 1:** Mock Google Drive API responses to test `ProgressService` save/load cycles.
- [x] **Step 2:** Implement a "Sync Status" indicator test (Idle, Syncing, Error, Success).

### 4.2 Progress Persistence
- [x] **Sub-step:** Refine `src/services/googleDrive.js` to store `completedSteps` and `activeStep` in `appProperties`.
- [x] **Sub-step:** Implement "Resume from last session" prompt on course load.

### 4.3 Content Sync Engine (CI/CD)
- [x] **Sub-step:** Expand `scripts/sync-docs.js` to automatically create/update the `public/content/` folder structure based on the Google Doc tabs.
- [x] **Sub-step:** Integrate the sync script into GitHub Actions for automated content deployments.

### Exit Criteria
- [x] Progress is saved to Google Drive and survives page refreshes.
- [x] Changes in Google Docs are reflected in the app after a CI/CD run.
- [x] **PR 4:** "Cloud: Google Drive persistence and automated content sync."

---

## Maintenance & Polish
- [ ] Audit all components for accessibility (A11y).
- [ ] Optimize build size and asset loading.
- [ ] Implement search across all modules in a track.
- [x] Add a track-level index/landing page for browsing multiple courses within a track.
- [x] Add root Dashboard page (`catalog.json`) for browsing all tracks.
- [x] Add `track.json` manifests for per-track course listings.
- [x] Implement clickable breadcrumbs (Track → Course → Module).
- [x] Dev-mode embed URL editor (pencil icon overlay).
- [x] "Complete Course" button on last module (marks 100%, returns to Course Map).
- [ ] Add inter-course navigation (e.g., "Next Course" after completing all modules).
