# To-Do & Roadmap

## Immediate Tasks
- [x] Fix build configuration for GitHub Pages.
- [x] Set up automated deployment via GitHub Actions.
- [x] Initialize comprehensive documentation (README, ARCH, DOCS).
- [x] Add more interactive elements to course modules (Progress tracking, locked steps).
- [ ] **Google Drive Integration:**
  - [x] Define Document Specification (TDS).
  - [x] Create Apps Script Validator.
  - [ ] Implement `scripts/sync-docs.js` (Google Docs API integration).
  - [ ] Implement `src/components/ContentRenderer.jsx`.
  - [x] Refactor entry point to allow modifications (moved logic to `src/App.jsx`).
  - [ ] Automate sync via GitHub Actions.

## Future Improvements
- [ ] **Search Functionality:** Add a search bar to the sidebar to quickly find modules or topics.
- [ ] **Progress Persistence:** Use `localStorage` to remember the user's progress across sessions.
- [ ] **Quiz Modules:** Implement knowledge check modules with multiple-choice questions.
- [ ] **Dark/Light Mode Toggle:** Support multiple themes.
- [x] **Video Integration:** Embed walkthrough videos and slide decks directly into the course modules.
- [ ] **Multi-language Support:** Internationalization (i18n) for the course content.

## Maintenance
- [ ] Keep dependencies updated.
- [ ] Audit for accessibility (A11y) improvements.
