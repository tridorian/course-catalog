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
2.  **Course:** A specific learning path within a Track (e.g., "AGV-01: Agentic Workflows"). A Course is composed of multiple Modules.
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
    - `ContentRenderer.jsx`: Dynamically renders modules based on block definitions.
    - `Embeds.jsx`: Specialized components for Video and Slide deck embedding.
    - `CodeBlock.jsx`, `InfoBox.jsx`, `WarningBox.jsx`: Content block primitives.
- `public/content/tracks/`: The root directory for all course content.
    - `[track_id]/[course_id]/manifest.json`: Defines the course metadata and the list of modules.
    - `[track_id]/[course_id]/metadata.json`: Detailed course description and author info.
    - `[track_id]/[course_id]/modules/`: Contains the individual module JSON files.

## Core Logic

### Dynamic Content Loading
The application fetches content dynamically from the `public/content/` directory.
- On initialization, `App.jsx` loads the `manifest.json` for the targeted course.
- It then fetches the corresponding module files listed in the manifest.
- This decoupling allows content updates without rebuilding the application.

### State Management
- `activeStepIndex`: Tracks the current module/step the user is viewing.
- `completedSteps`: An array of indices representing finished modules, used for progress tracking and locking.
- `courseMetadata`: Stores the high-level information about the current course.

### Navigation
Navigation is handled via a sidebar that displays the course structure.
- **Step Locking:** Modules are locked sequentially to ensure a logical learning path.
- **Progress Tracking:** A global progress bar reflects the percentage of completed modules.

## Styling & Theme

The application uses the "Tridorian" dark theme:
- **Primary Color:** Green (`#4ade80`).
- **Background:** Deep Green/Black (`#050805`).
- Custom scrollbars and animations are used to provide a "terminal" aesthetic.
- Dynamic styles (like border colors) are passed via props to avoid Tailwind JIT purging issues.
