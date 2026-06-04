# ADR 0001: Core Content Hierarchy & Schema Validation

## Date
2026-06-03

## Status
Accepted

## Context
The tridorian Course Platform needs to render rich educational content dynamically while maintaining a decoupled architecture where content changes do not require rebuilding the application code. We also need a structured hierarchy to organize content logically and validate it client-side to ensure the UI does not crash on malformed data.

## Decision
We establish a strict 4-tier hierarchy and local schema validation rules for all content files loaded by the system.

### 1. Hierarchy Definition
The content is structured into four distinct levels:
1. **Track:** The highest level of grouping, defined in `public/content/catalog.json` and `public/content/tracks/[track_id]/track.json`.
2. **Course:** A single course path inside a track, defined by its directory `public/content/tracks/[track_id]/[course_id]/` containing `manifest.json` and `metadata.json`.
3. **Module:** An individual learning unit of a course. The modules list is specified in the course `manifest.json`, and details are in individual JSON files under `/modules/`.
4. **Step:** (Only applicable to Lab modules) Individual components or instructions (blocks) within a module.

### 2. Directory Structure (Local ↔ Google Drive Mirror)

The local `public/content/` tree and the Google Drive folder structure are **mirrors** of each other. The sync engine (`scripts/sync-docs.js`) maps between them 1:1.

**Local (Git repo — source of truth for deployment):**
```
public/content/
├── catalog.json                       # Catalog of all Tracks
└── tracks/
    └── [track_id]/
        ├── track.json                 # Track Manifest (lists courses)
        └── [course_id]/
            ├── manifest.json          # Course Manifest (lists modules)
            ├── metadata.json          # Course Metadata (author, title, description)
            └── modules/
                ├── module-1.json      # Individual module data
                └── module-2.json
```

**Google Drive (authoring — source of truth for content):**
```
tridorian Course Catalog/             # Root Drive folder
├── tracks/
│   ├── agentic-engineering/           # Track folder = track_id
│   │   ├── agy-101/                   # Course folder = course_id
│   │   │   ├── AGY-101 (Google Doc)   # Content doc (tabs = modules)
│   │   │   ├── Lab Setup (PDF)        # Asset — real file
│   │   │   ├── Config Ref (Sheet)     # Asset — real file
│   │   │   └── Feedback (Form) ⤳      # Asset — Drive shortcut to file elsewhere
│   │   ├── agy-102/
│   │   │   └── AGY-102 (Google Doc)
│   │   └── ...
│   └── adk-development/
│       ├── adk-101/
│       │   └── ADK-101 (Google Doc)
│       └── ...
└── catalog (Google Sheet)             # Optional: track/course registry
```

**Asset rule:** Creators put files (or Drive shortcuts) in the course folder. The sync pipeline resolves shortcuts to real file IDs via `drive.files.get({ fileId, fields: 'shortcutDetails' })`. Either way, the creator pastes the link into the Doc where they want it embedded.

### 3. Schema & Validation Rules
When fetching content client-side via `src/services/contentLoader.js`, validation is applied:
- **Course Manifest (`manifest.json`):** Must contain a `metadata` string field and a `modules` array.
- **Module JSON:** Must contain `id` (as a string), `type` (e.g. `lab`, `presentation`, `resource`), and `title`.
  - For `lab` modules, a `blocks` array is strictly required and must contain content block primitives (e.g., standard text paragraphs, lists, code blocks, info boxes, warning boxes).

## Consequences
- Allows developers and content editors to add tracks, courses, or modules by editing JSON files under `public/content/` without modifying the React code.
- Malformed content yields clear, actionable error boundaries ("Mission Interrupted" screen) instead of white screens of death.

## Test Verification
- **Test File:** `src/__tests__/contentLoader.test.js`
  - Validates `fetchCourseManifest` parses and validates correct schemas.
  - Verifies `fetchCourseManifest` throws on missing `metadata` field.
  - Verifies `fetchModuleContent` loads and validates correct module structure, throwing on missing `blocks` for `lab` modules.
- **Test File:** `src/__tests__/App.test.jsx`
  - Validates loading and integration of Course Manifest and Modules under mock pathways.
  - Verifies application displays gracefully handles errors ("Mission Interrupted") when a manifest fails to fetch.
