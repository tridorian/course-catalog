# Phase 3: Dynamic Navigation & Deep Linking

## Goal
Enhance navigation using `react-router-dom` and implement hierarchical breadcrumbs.

## Prerequisites
- Phase 1 and Phase 2 must be complete and approved.

## Tasks
1. **Testing Navigation:**
   - Write tests to verify that clicking a module in the sidebar updates the URL and changes the displayed content.
   - Verify that deep links (e.g., `#/labs/agy-101/module-3`) load the correct state on page refresh.
2. **Routing:**
   - Introduce `react-router-dom` to `src/App.jsx`.
   - Map routes to the hierarchy: `/:track/:course/:moduleId?`.
3. **Breadcrumbs & Progress:**
   - Implement a Breadcrumb component: `Track Name > Course Name > Current Module`.
   - Ensure the Sidebar correctly highlights the active module based on the current route.
4. **Course Map:**
   - Add a high-level "Course Map" view accessible from the course landing page.

## Exit Criteria (Phase 3)
- Navigation is fully stateful via URL.
- Breadcrumbs accurately reflect the user's position in the 4-tier hierarchy.
- Forward/Back browser navigation works as expected.

**Important:** Maintain the "Mission Control" aesthetic in the navigation UI.
