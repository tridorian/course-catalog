# ADR 0004: Progress Persistence & Drive Synchronization

## Date
2026-06-03

## Status
Accepted

## Context
The platform needs to persist user progress across browser sessions and across different devices (such as developer workstations, lab environments, or personal laptops). We want this without hosting a custom database with user accounts and credentials. Users should also be able to earn certificates and badges that are saved as real files in their own Google Drive — visible, shareable, and deletable.

## Decision
We implement a hybrid Dual-Write state persistence model utilizing Google Drive and `localStorage` cache alongside a CI/CD-driven Google Docs synchronization system.

### 1. OAuth Scopes (End-User)
The app requests two Google Drive scopes at sign-in:

| Scope | Purpose | What it can access |
|---|---|---|
| `drive.appdata` | Hidden progress sync | Only the app's private hidden folder — user never sees it, can't browse their files |
| `drive.file` | Certificates, badges, exports | Only files **created by this app** — cannot read user's existing files |

**Consent screen shows:** *"See, edit, create, and delete only the specific Google Drive files you use with this app"* — minimal and trust-friendly.

**What users can do with `drive.file`:**
- View earned certificates and badges in their Drive (in a `Tridorian Certificates/` folder)
- Share certificates via Drive sharing
- Delete their profile data and certificates at any time
- Export saved resources (bookmarked modules, notes) as Drive files

**What the app CANNOT do:**
- Read any existing user files
- List the user's Drive contents
- Access files not created by this app

### 2. Dual-Write Progress Persistence Model
1. **Local Cache (`localStorage`):** The app writes progress updates immediately to local storage under the key `agy_local_progress` to guarantee instantaneous UI updates and support completely offline usage.
2. **Cloud Storage (Google Drive appDataFolder):** User progress is synced to a hidden file named `agy_course_progress.json` stored inside the user's private Google Drive Application Data folder (`appDataFolder`). This folder is restricted and accessible only by our client application.
3. **AppProperties Metadata:** Key details (active step ID, lists of completed step IDs, and timestamp) are written directly to Google Drive file metadata (`appProperties`). This allows fast, low-bandwidth progress querying of courses without loading the full JSON payload.

### 3. User-Visible Drive Artifacts (via `drive.file`)
When a user completes a track or course, the app creates files in a visible Drive folder:
```
My Drive/
└── Tridorian Certificates/            # Created by the app, visible to user
    ├── AGY-101 Certificate.pdf        # Completion certificate
    ├── Agentic Engineering Badge.png  # Track badge image
    └── profile.json                   # User profile data (deletable)
```

### 4. Offline Action Queue & Re-synchronization
- When the network is unavailable or the Google Drive API fails (raising a `NETWORK_ERROR`), progress updates are stored in an offline queue in `localStorage` under `agy_offline_queue`.
- When connectivity is restored, the application merges local offline actions into Google Drive:
  - **Completed Steps:** Merged using a Union set strategy (steps marked complete offline or online are combined).
  - **Active Steps:** Resolved using Last-Write-Wins (LWW) based on timestamps.
- Transparent re-authentication automatically handles Google API `401 Unauthorized` token expiry errors by re-invoking the Google Identity Services signIn flow.


### 3. Multi-Stage Google Drive Content Sync Engine (see [ADR 0005](0005-multi-stage-content-sync-pipeline.md))
- A compilation script (`scripts/sync-docs.js`) exports course Google Docs as **Markdown** and **PDF** via the Drive API.
- The Markdown is parsed into module JSON blocks; the PDF is retained for image detection.
- Generated JSON is validated against the content schema before writing to `public/content/`.
- During CI/CD (GitHub Actions), the pipeline runs to generate updated courses, committing the final compiled JSON assets to static hosting deployment (GitHub Pages).

## Consequences
- No database hosting, maintenance, or user accounts are needed, maximizing security and privacy.
- Resilient to network disruptions via localized caching and transactional queue replay.
- Automated content delivery pipelines ensure writers can publish updates through Google Docs without manual file editing.

## Test Verification
- **Test File:** `src/__tests__/services/googleDrive.test.js`
  - Verifies that `loadProgress` merges localStorage progress and remote file progress correctly.
  - Verifies that `saveCourseProgress` updates local progress, `appProperties`, and writes the full JSON back to Google Drive.
  - Verifies queue management: queues updates offline on network failure and replays them on reconnect using the union/LWW merging logic.
- **Test File:** `src/__tests__/components/SyncStatus.test.jsx`
  - Verifies sync statuses (Idle, Syncing, Error, Success) are displayed correctly.
  - Tests loading/resuming sessions on course load.
- **Test File:** `src/__tests__/services/syncDocs.test.js`
  - Tests `syncCourse` parser logic: skipping drafts, parsing headings/tables/features, and compiling to static JSON files.
