# Phase 4 Development Tasks: State Persistence & Google Drive Sync

This document outlines the detailed development tasks and acceptance criteria for **Phase 4: State Persistence & Google Drive Sync**, derived from the Phase 4 specification and the current codebase architecture.

## Specification Summary

> **Goal:**
> "Enable persistent progress saving via Google Drive and automate content synchronization from Google Docs."
>
> **Exit Criteria (Phase 4):**
> - "User progress survives browser session clears (via Google Drive persistence)."
> - "A push to the 'main' branch or a triggered GitHub Action successfully updates the course content from the source Google Docs."
> - "The sync script is idempotent and handles folder creation/updates correctly."
>
> **Important Constraint:**
> "Prioritize data privacy and ensure Google API tokens are handled securely."

---

## Development Tasks

### 4.1: Cloud Persistence Testing

Focuses on validating data serialization and mock-testing Google Drive operations under different states.

#### [ ] Task 4.1.1: Mock Google Drive `appProperties` API
- **Description:** Implement a robust Vitest mock framework for the Google Drive v3 files endpoint (`https://www.googleapis.com/drive/v3/files`) and Google Auth token retrieval (`getAccessToken` from `src/services/googleAuth.js`). This mock must handle searching for `agv_course_progress.json`, file creation (POST), and file updates (PATCH) containing track/course progress.
- **Acceptance Criteria:**
  - Mock API intercepts `fetch` calls to the Google Drive files endpoint.
  - Successfully simulates file existence: returns a file list payload containing the target JSON file with custom `appProperties` or returns an empty list to simulate a new user.
  - Successfully mocks file creation (POST) returning a mock file ID.
  - Successfully mocks metadata patch updates (PATCH) and captures the updated payload to verify proper property names and values.
- **Files to Create/Edit:**
  - `src/__tests__/setup.js` (or a dedicated `src/__tests__/googleDriveMock.js`)
- **Reference:** Specification Section 4.1 "Mock Google Drive `appProperties` API."

#### [ ] Task 4.1.2: Progress Save/Load Unit & Integration Tests
- **Description:** Write comprehensive unit and integration tests using Vitest and React Testing Library to verify that user progress is saved upon completing modules and loaded when the app initializes.
- **Acceptance Criteria:**
  - Test that calling the save progress trigger updates the serialized completed steps on the mocked Google Drive file.
  - Test that on app initialization, if the user is authenticated, the app calls `getProgressFile` and loads the saved progress for the current course, setting the local state (`completedSteps` and `activeStepIndex`).
  - Test edge cases:
    - Guests / unauthenticated users (should fall back to local/in-memory storage without making API calls).
    - API errors (e.g. 401 Unauthorized, 500 Server Error) do not crash the app, but log warnings and transition the UI sync state to `Error`.
- **Files to Create/Edit:**
  - `src/__tests__/googleDrive.test.js` (New test file)
- **Reference:** Specification Section 4.1 "Write tests to verify that `completedSteps` are saved to Drive when a module is finished and loaded upon app initialization."

---

### 4.2: Google Drive Integration

Updates the React client to handle hierarchical progress structures, display real-time sync feedback, and support resuming sessions.

#### [ ] Task 4.2.1: Refine `src/services/googleDrive.js` for Hierarchical Progress
- **Description:** Refactor the progress save and load functions to support multi-course progress across multiple tracks. Since Google Drive `appProperties` keys and values are limited to 124 bytes each (with up to 100 properties per file), we must serialize track-course specific progress using concise flat property keys.
- **Key Scheme Design:**
  - Store progress as: `progress_[trackId]_[courseId]_completed` with value as a comma-separated string of completed module indices (e.g., `"0,1,2"`).
  - Store active position as: `progress_[trackId]_[courseId]_active` with value as the active module ID (e.g., `"3"`).
- **Acceptance Criteria:**
  - Refactored `saveProgress` function accepts `trackId`, `courseId`, `completedSteps` (array), and `activeStepId` (string).
  - Encodes metadata into the flat keys conforming to Google's 124-byte key/value limit.
  - Refactored `getProgressFile` parses the custom keys and exposes a clean nested progress map for all courses in a track.
- **Files to Create/Edit:**
  - `src/services/googleDrive.js`
- **Reference:** Specification Section 4.2 "Refine `src/services/googleDrive.js` to handle the new hierarchical data structure."

#### [ ] Task 4.2.2: Add Sync Status Indicator to UI
- **Description:** Add a "Sync Status" indicator to the sidebar or main navigation header that displays the current sync state with Google Drive.
- **Sync States:**
  - `Idle`: Up-to-date, no active syncing operations.
  - `Saving` (or `Syncing`): Visual indicator (e.g., spinner or flashing dot) showing an API write is in progress.
  - `Success`: Displays a green check/badge briefly after a successful API save.
  - `Error`: Displays a red warning icon/badge if the save fails, indicating the network or auth token is broken, with a visual retry option.
- **Acceptance Criteria:**
  - Indicator correctly updates based on status triggers from the progress sync logic.
  - Stylings match the "Tridorian" theme aesthetics (green `#4ade80`, dark container backgrounds, clean animations).
- **Files to Create/Edit:**
  - `src/App.jsx`
  - `src/components/SyncStatus.jsx` (New component)
- **Reference:** Specification Section 4.2 "Add a 'Sync Status' indicator (Success/Saving/Error) to the UI."

#### [ ] Task 4.2.3: Implement "Resume Last Session" Prompt
- **Description:** Create a prompt that displays upon course initialization if there is a saved active module/step in Google Drive that differs from the default (module 0/first module).
- **Acceptance Criteria:**
  - When loading a course, check if a saved `activeStepId` exists in Google Drive progress.
  - If it exists and is different from the currently navigated module, display a modal or prominent banner prompt: "Would you like to resume your last session at [Module Title]?"
  - Clicking "Yes" navigates the user to the saved module step.
  - Clicking "No" or closing the prompt dismisses the notice, remaining on the default track/course map page without overriding it.
- **Files to Create/Edit:**
  - `src/App.jsx`
- **Reference:** Specification Section 4.2 "Resume Last Session prompt."

---

### 4.3: Automated Content Sync CI/CD

Implements a secure, automated build script to convert Google Docs into static JSON assets matching the Tridorian layout structure.

#### [ ] Task 4.3.1: Create Sync Configuration Mapping
- **Description:** Define a configuration JSON file listing the source Google Docs mapped to the target tracks and courses.
- **Acceptance Criteria:**
  - Create `scripts/sync-config.json` listing the doc mappings (e.g., mapping `GOOGLE_DOC_ID` to track `agentic-engineering` and course `agv-101`).
- **Files to Create/Edit:**
  - `scripts/sync-config.json` (New file)
- **Reference:** Structural configuration mapping for the Node.js sync engine.

#### [ ] Task 4.3.2: Create Content Sync Script (`scripts/sync-docs.js`)
- **Description:** Create `scripts/sync-docs.js` using Node.js to fetch tab contents from Google Docs using the Google Docs API v1 (utilizing `includeTabsContent=true`). The script must parse the tabs according to the Tridorian Document Specification (TDS) and save them to the correct local paths.
- **Parsing Rules:**
  - Tab 1 (`[Config]`): Parses key-value table containing `course_id`, `title`, `version`, `author`.
  - Tab 2 (`[Intro]`): Parses course landing page metadata. Maps Course Title from Heading 1, course description from body text, and features card list from the 2-column icon table, writing them to `metadata.json`.
  - Tabs 3+ (`[Module Name]`): Parses each module. Extracts Title from Heading 1, Duration from Heading 2, and content blocks (paragraph, list, code block, infobox/warningbox tables, Heading 3 subsections) into the `blocks` array of each module JSON.
- **Acceptance Criteria:**
  - The script successfully authenticates using Google OAuth / Service Account credentials.
  - Correctly outputs files to `public/content/tracks/[track_id]/[course_id]/manifest.json`, `metadata.json`, and the `modules/` folder.
  - Validates outputs against ID format requirements: Module IDs in both manifest and module JSONs must be **strings** (e.g., `"id": "1"`).
- **Files to Create/Edit:**
  - `scripts/sync-docs.js` (New file)
- **Reference:** Specification Section 4.3 "Update `scripts/sync-docs.js` to create the full `public/content/[track]/[course]/` folder structure based on the Google Doc tabs."

#### [ ] Task 4.3.3: Implement Module Type Classification & Idempotency
- **Description:** Refine `scripts/sync-docs.js` to dynamically classify modules based on tab details and ensure the writing actions are idempotent.
- **Classification Rules:**
  - If the tab title contains `[Presentation]` or if the tab contains a Google Slides / Video URL, set the module type to `"presentation"` and write notes and url fields.
  - If the tab title contains `[Resource]` or contains reference documentation links, set the module type to `"resource"`.
  - Otherwise, default the type to `"lab"`.
- **Idempotency:**
  - The script must only write/overwrite files if the parsed content has changed (e.g. by comparing content hashes or deep object comparison) to avoid unnecessary file writes and maintain git history cleanliness.
  - Script automatically handles parent folder creation dynamically if folders do not exist.
- **Acceptance Criteria:**
  - Output module files specify the correct `type` property (`lab`, `presentation`, `resource`).
  - Running the script twice without changes produces zero file differences or git changes.
- **Files to Create/Edit:**
  - `scripts/sync-docs.js`
- **Reference:** Specification Section 4.3 "Ensure the script correctly classifies modules as Lab, Presentation, or Resource based on tab content or naming conventions" and Exit Criteria "The sync script is idempotent and handles folder creation/updates correctly."

#### [ ] Task 4.3.4: Integrate GitHub Actions Workflow
- **Description:** Implement a GitHub Actions workflow to run the sync script automatically on repository updates.
- **Acceptance Criteria:**
  - Create `.github/workflows/sync-docs.yml`.
  - Configure the trigger to run on `push` to `main`, manually via `workflow_dispatch`, or periodically (e.g., nightly cron).
  - Configures environment/secrets securely: loads `GOOGLE_SERVICE_ACCOUNT_KEY` (a base64 encoded string or raw JSON of Google service account credentials) from GitHub Secrets.
  - Script runs successfully, synchronizing files, and automatically commits and pushes changes back to the repository if any updates are detected.
- **Files to Create/Edit:**
  - `.github/workflows/sync-docs.yml` (New file)
- **Reference:** Specification Exit Criteria "A push to the 'main' branch or a triggered GitHub Action successfully updates the course content from the source Google Docs."

---

## Technical Notes

### Data Privacy & Google API Token Security
- Google API OAuth flow runs entirely in-browser. All authentication states and active tokens must be held in-memory or transient session storage.
- Never write credentials, raw client secrets, or service account files into the repository source.
- In GitHub Actions, the Service Account Key must be stored strictly within GitHub Repository Secrets (`GOOGLE_SERVICE_ACCOUNT_KEY`) and loaded into the runner environment at execution time.

### Google Drive appProperties Restrictions
- The Google Drive API enforces a size limit of **124 bytes** for each key and value in `appProperties`.
- Do not attempt to stringify complex nested objects into a single `appProperties` key. Use flat string values (like `"0,1,2"`) mapped to distinct, course-specific keys (like `progress_[track]_[course]_completed`).
