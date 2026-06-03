# ADR 0003: Dynamic Routing & Breadcrumb Navigation

## Date
2026-06-03

## Status
Accepted (amended — Cloud Run deployment, BrowserRouter)

## Context
A major requirement of the platform is deep linkability, allowing users to share URLs pointing to specific steps, courses, or tracks. The application is deployed to **Google Cloud Run** as a containerized static site (private repo, internal + external access). During implementation, a critical navigation bug was encountered: React Router parameters parsed from the URL are strings, but the manifest originally defined module IDs as numbers. This type mismatch locked active step lookup and prevented navigation progression.

## Decision
We implement a robust client-side routing strategy using `BrowserRouter` (clean URLs) with Cloud Run serving the SPA fallback, plus strict ID coercion rules.

### 1. BrowserRouter Routing Strategy
We use `react-router-dom`'s `BrowserRouter` for clean, standard URLs.
- **URLs:** `courses.tridorian.com/agentic-engineering/agy-101` (no `#` prefix)
- **SPA fallback:** The Cloud Run container uses nginx with `try_files $uri /index.html;` so that direct navigation and page refreshes always serve the React app.
- **Previous decision:** HashRouter was used when targeting GitHub Pages. Now that we deploy to Cloud Run (which supports proper server config), BrowserRouter is the modern standard.

### 2. Deployment Target: Google Cloud Run
- **Reason:** Private repo cannot use GitHub Pages. Tridorian has an existing GCP sandbox.
- **Container:** Lightweight nginx image serving the Vite build output (`dist/`).
- **CI/CD:** GitHub Actions → `docker build` → push to Artifact Registry → deploy to Cloud Run.
- See `Dockerfile` and `.github/workflows/deploy-cloudrun.yml` for implementation.

### 3. URL Route Patterns
We define four core routes in `src/App.jsx`:
- `/` — Root dashboard.
- `/:trackId` — Track index page.
- `/:trackId/:courseId` — Course Map (syllabus view of all modules).
- `/:trackId/:courseId/:moduleId` — Direct deep-linked module step renderer.

### 4. Defensive ID Coercion & String ID Standard
To resolve type mismatch bugs between the URL and JSON files:
- All manifest and module JSON file ID attributes are standardized to **strings** (e.g., `"id": "1"`).
- In the React logic, active step lookups via `params.moduleId` coerce both sides using `String()` when performing equality checks or index lookups:
  ```javascript
  const activeStepIndex = courseSteps.findIndex(
    step => String(step.id) === String(moduleId)
  );
  ```

### 5. Interactive Breadcrumbs
We render a dynamic breadcrumb component (`Track > Course > Module`) derived from the active route parameters. The breadcrumbs are fully clickable to allow users to easily jump back up the hierarchy.

## Consequences
- Clean, shareable URLs without `#` fragments.
- Deep links can be safely shared and refreshed — nginx serves the SPA fallback.
- Private repo support via Cloud Run (no public GitHub Pages needed).
- String ID standard avoids strict comparison bugs between number IDs and string URL parameters.
- Users can easily navigate between tracks, courses, and individual modules.

## Test Verification
- **Test File:** `src/__tests__/Navigation.test.jsx`
  - Verifies that URL parameters are updated when steps are clicked or advanced via Next/Back.
  - Verifies that deep links load the correct modules directly on first load.
- **Test File:** `src/__tests__/App.test.jsx`
  - Contains a regression integration test `handles numeric module IDs from content JSON (regression)` to confirm that even if a legacy module uses a numeric ID, defensive `String()` coercion resolves the correct module and renders its contents without locking progression.
