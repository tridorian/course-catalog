# Phase 4: State Persistence & Google Drive Sync

## Goal
Enable persistent progress saving via Google Drive and automate content synchronization from Google Docs.

## Prerequisites
- Phases 1, 2, and 3 must be complete and approved.

## Tasks
1. **Cloud Persistence Testing:**
   - Mock Google Drive `appProperties` API.
   - Write tests to verify that `completedSteps` are saved to Drive when a module is finished and loaded upon app initialization.
2. **Google Drive Integration:**
   - Refine `src/services/googleDrive.js` to handle the new hierarchical data structure.
   - Add a "Sync Status" indicator (Success/Saving/Error) to the UI.
3. **Automated Content Sync (CI/CD):**
   - Update `scripts/sync-docs.js` to create the full `public/content/[track]/[course]/` folder structure based on the Google Doc tabs.
   - Ensure the script correctly classifies modules as Lab, Presentation, or Resource based on tab content or naming conventions.

## Exit Criteria (Phase 4)
- User progress survives browser session clears (via Google Drive persistence).
- A push to the 'main' branch or a triggered GitHub Action successfully updates the course content from the source Google Docs.
- The sync script is idempotent and handles folder creation/updates correctly.

**Important:** Prioritize data privacy and ensure Google API tokens are handled securely.
