# Architecture

This document describes the high-level architecture of the Tridorian Course Platform.

## Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** GitHub Pages via GitHub Actions

## Content Hierarchy

The platform follows a 4-tier content hierarchy for maximum modularity and scalability:

1.  **Track:** The top-level container (e.g., "AI Engineering", "Cloud Operations"). A Track contains multiple Courses.
2.  **Course:** A specific learning path within a Track (e.g., "AGY-01: Agentic Workflows"). A Course is composed of multiple Modules.
3.  **Module:** A discrete unit of learning. Modules can be of different types:
    - **Lab:** An interactive, step-by-step technical guide (the primary module type).
    - **Presentation:** A module centered around a Google Slides deck or a Google Drive video walkthrough.
    - **Resource:** A reference-heavy module, often embedding Google Docs.
4.  **Step:** (Specific to Labs) Individual blocks of content within a Lab module.

## Project Structure

- `index.html`: Entry point.
- `src/main.jsx`: React root initialization.
- `src/App.jsx`: Main application controller. Handles routing, state, and content orchestration.
- `src/components/`: Reusable UI components.
    - `Dashboard.jsx`: Root landing page showing all available tracks from `catalog.json`.
    - `TrackPage.jsx`: Track landing page showing all courses in a track from `track.json`.
    - `ModuleRenderer.jsx`: Switches rendering strategy based on `module.type` (`lab`, `presentation`, `resource`).
    - `ContentRenderer.jsx`: Dynamically renders lab modules based on block definitions.
    - `Embeds.jsx`: Specialized components for Video and Slide deck embedding + dev-mode URL editor.
    - `CodeBlock.jsx`, `InfoBox.jsx`, `WarningBox.jsx`: Content block primitives.
- `src/services/contentLoader.js`: Fetch utilities for catalog, tracks, manifests, metadata, and module JSON.
- `src/__tests__/`: Unit and integration tests (Vitest + React Testing Library).
- `public/content/catalog.json`: Root catalog listing all available tracks.
- `public/content/tracks/`: The root directory for all course content.
    - `[track_id]/track.json`: Track manifest listing all courses in that track.
    - `[track_id]/[course_id]/manifest.json`: Defines the course module listing.
    - `[track_id]/[course_id]/metadata.json`: Detailed course description and author info.
    - `[track_id]/[course_id]/modules/`: Contains the individual module JSON files.

## Core Logic

### Dynamic Content Loading
The application fetches content dynamically from the `public/content/` directory.
- On initialization, `App.jsx` loads the `manifest.json` for the targeted course.
- It then fetches the corresponding module files listed in the manifest.
- This decoupling allows content updates without rebuilding the application.

### Multi-Course Support
A single Track can contain multiple Courses. Each course lives in its own directory under `public/content/tracks/[track_id]/`. When a user navigates between courses (e.g., from `agy-101` to `gemini-cli`), the application:
- Re-fetches the manifest and all module content for the new course.
- **Resets `completedSteps`** to avoid stale progress from the previous course bleeding over.

### ID Format Requirement
> **Important:** Module IDs in both `manifest.json` and individual module JSON files **must be strings**, not numbers. React Router's `useParams()` returns URL parameters as strings, and the application uses strict comparison. Numeric IDs (e.g., `"id": 1`) will silently break navigation. Always use `"id": "1"`.

### State Management
- `activeStepIndex`: Derived from the URL `moduleId` param matched against `courseSteps[].id` using `String()` coercion.
- `completedSteps`: An array of indices representing finished modules, used for progress tracking and locking. Reset on course switch.
- `courseMetadata`: Stores the high-level information about the current course.

### Routing
The app uses `HashRouter` with four route patterns:
- `/#/` — Dashboard, showing all available tracks from `catalog.json`.
- `/#/:trackId` — Track page, showing all courses in a track from `track.json`.
- `/#/:trackId/:courseId` — Course Map view showing all modules.
- `/#/:trackId/:courseId/:moduleId` — Deep link to a specific module.

### Navigation
Navigation is handled via a sidebar that displays the course structure.
- **Step Locking:** Modules are locked sequentially to ensure a logical learning path.
- **Progress Tracking:** A global progress bar reflects the percentage of completed modules.
- **Next/Back Buttons:** Footer navigation advances or retreats one module. Clicking "Next" marks the current step as completed.
- **Complete Course:** On the last module, a "Complete Course" button replaces "Next". Clicking it marks all steps as complete (100%) and navigates back to the Course Map.

### Dev-Mode Embed Editor
In development (`npm run dev`), all embed components (SlideDeckEmbed, VideoEmbed) display a pencil icon on hover. Clicking it opens an overlay showing:
- The **source JSON file path** where the URL is defined
- The **current URL** value
- **Copy buttons** for both fields

This makes it easy to identify and update stale or broken embed URLs without searching through JSON files manually. The overlay is only visible in dev mode (`import.meta.env.DEV`) and is stripped from production builds.

## Styling & Theme

The application uses the "Tridorian" dark theme:
- **Primary Color:** Green (`#4ade80`).
- **Background:** Deep Green/Black (`#050805`).
- Custom scrollbars and animations are used to provide a "terminal" aesthetic.
- Dynamic styles (like border colors) are passed via props to avoid Tailwind JIT purging issues.
