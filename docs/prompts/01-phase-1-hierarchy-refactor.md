# Phase 1: Core Hierarchy & Schema Validation

## Goal
Refactor the content loading system in the tridorian Course Platform to support a 4-tier hierarchy: **Track > Course > Module > Step**.

## Context
- The project follows a strict **Test-First** methodology.
- Hierarchy: Tracks contain Courses; Courses contain Modules (Labs, Presentations, Resources); Labs contain Steps.
- Root folder for content: `public/content/tracks/[track_id]/[course_id]/`.
- Key files: `ARCH.md` (Architecture), `TODO.md` (Roadmap).

## Tasks
1. **Testing Infrastructure:**
   - Implement unit tests for a new content loading service that handles manifest and module fetching.
   - Use Playwright or Vitest to mock valid and invalid hierarchy structures.
2. **Hierarchy Refactor:**
   - Update `src/App.jsx` to parse `trackId` and `courseId` (e.g., from URL hash or search params).
   - Update fetch logic to use the new path structure: `public/content/tracks/[track_id]/[course_id]/manifest.json`.
3. **Schema Validation:**
   - Implement a validation layer that checks the integrity of the loaded JSON (e.g., ensures a Module has `type`, `title`, and `blocks` or `url`).

## Exit Criteria (Phase 1)
- Unit tests for manifest loading pass for arbitrary track/course paths.
- Application gracefully handles "Course Not Found" or "Invalid Schema" errors with a user-friendly UI message.
- Content is correctly loaded from the new directory structure.

**Important:** Do not modify `app.js` in the root. Work within `src/App.jsx`.
