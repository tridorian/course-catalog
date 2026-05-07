# Tridorian Course Platform Roadmap

This roadmap outlines the phased development of the platform, following a strict "Test-First" methodology. Each phase must meet its defined exit criteria before proceeding.

---

## Phase 1: Core Hierarchy & Schema Validation
**Objective:** Refactor the content loading system to support the 4-tier hierarchy (Track > Course > Module > Step).

### 1.1 Testing Infrastructure (Prerequisite)
- [ ] **Step 1:** Implement unit tests for `fetchCourseManifest` and `fetchModuleContent` utilities.
- [ ] **Step 2:** Create mock JSON structures for valid/invalid Tracks and Courses to test validation logic.
- [ ] **Step 3:** Implement integration tests using Playwright to verify that a course loads correctly given a valid path.

### 1.2 Hierarchy Refactor
- [ ] **Sub-step:** Update `src/App.jsx` to parse Track and Course IDs from the URL (e.g., `/#/labs/agv-01`).
- [ ] **Sub-step:** Refactor file fetching logic to use the new path structure: `public/content/tracks/[track]/[course]/`.
- [ ] **Sub-step:** Implement a `ModuleSchema` validator to ensure JSON files contain required fields (`id`, `type`, `title`, `blocks`).

### Exit Criteria
- Tests pass for manifest loading from arbitrary track/course paths.
- Application gracefully handles "Course Not Found" errors.
- **PR 1:** "Core: Implement 4-tier content loading and schema validation."

---

## Phase 2: Multi-Type Module Support
**Objective:** Implement specialized rendering for Lab, Presentation, and Resource modules.

### 2.1 Component Testing
- [ ] **Step 1:** Write unit tests for `ModuleRenderer` to ensure it switches components based on `module.type`.
- [ ] **Step 2:** Create visual regression tests (screenshots) for `Presentation` (Slides/Video) and `Resource` (Docs) components.

### 2.2 Presentation Modules
- [ ] **Sub-step:** Create `src/components/modules/PresentationModule.jsx`.
- [ ] **Sub-step:** Integrate `VideoEmbed` and `SlideDeckEmbed` into the layout.
- [ ] **Sub-step:** Add support for "Presentation Notes" section below the embed.

### 2.3 Resource Modules
- [ ] **Sub-step:** Create `src/components/modules/ResourceModule.jsx`.
- [ ] **Sub-step:** Implement a "Document Gallery" or "Embedded Guide" view for Google Docs resources.

### Exit Criteria
- Module type `presentation` successfully renders a slide deck.
- Module type `resource` successfully renders a document list/embed.
- **PR 2:** "UI: Add support for Presentation and Resource module types."

---

## Phase 3: Dynamic Navigation & Deep Linking
**Objective:** Enhance the user experience with better navigation and URL persistence.

### 3.1 Navigation Testing
- [ ] **Step 1:** Write tests for the `Sidebar` to verify it correctly highlights the active module and respects "locked" status.
- [ ] **Step 2:** Write tests for breadcrumb generation based on the 4-tier hierarchy.

### 3.2 Routing & Breadcrumbs
- [ ] **Sub-step:** Implement `react-router-dom` (or simple state-based routing) to support deep links to specific modules.
- [ ] **Sub-step:** Add a Breadcrumb component: `Track > Course > Module`.
- [ ] **Sub-step:** Implement "Course Map" view - a high-level overview of all modules in a course.

### Exit Criteria
- Users can share a URL that opens a specific module.
- Breadcrumbs correctly reflect the hierarchy.
- **PR 3:** "UX: Deep linking and hierarchical breadcrumb navigation."

---

## Phase 4: State Persistence & Google Drive Sync
**Objective:** Transition from `localStorage` to cloud-based progress saving and automated content updates.

### 4.1 Sync Testing
- [ ] **Step 1:** Mock Google Drive API responses to test `ProgressService` save/load cycles.
- [ ] **Step 2:** Implement a "Sync Status" indicator test (Idle, Syncing, Error, Success).

### 4.2 Progress Persistence
- [ ] **Sub-step:** Refine `src/services/googleDrive.js` to store `completedSteps` and `activeStep` in `appProperties`.
- [ ] **Sub-step:** Implement "Resume from last session" prompt on course load.

### 4.3 Content Sync Engine (CI/CD)
- [ ] **Sub-step:** Expand `scripts/sync-docs.js` to automatically create/update the `public/content/` folder structure based on the Google Doc tabs.
- [ ] **Sub-step:** Integrate the sync script into GitHub Actions for automated content deployments.

### Exit Criteria
- Progress is saved to Google Drive and survives page refreshes.
- Changes in Google Docs are reflected in the app after a CI/CD run.
- **PR 4:** "Cloud: Google Drive persistence and automated content sync."

---

## Maintenance & Polish
- [ ] Audit all components for accessibility (A11y).
- [ ] Optimize build size and asset loading.
- [ ] Implement search across all modules in a track.
