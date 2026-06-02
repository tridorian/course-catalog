# Documentation

## Course Content Management

The course content is dynamically loaded and follows a 4-tier hierarchy (Track > Course > Module > Step). Content is stored in JSON format within the `public/content/tracks/` directory.

### Adding a New Module

1.  **Create the Module File:** Create a new JSON file (e.g., `10-new-module.json`) in the appropriate course directory (e.g., `public/content/tracks/[track_id]/[course_id]/modules/`).
2.  **Define Module Structure:** The JSON file must adhere to the `ModuleSchema`. It requires a `title`, `type` (e.g., `lab`, `presentation`, `resource`), and depending on the type, `blocks` (for labs), `url` (for presentations/resources).
3.  **Update Manifest:** Add the filename of the new module to the `modules` array in the course's `manifest.json` file.
4.  **Using Blocks:** The platform dynamically renders content using `ContentRenderer.jsx`. Define content blocks in the JSON using supported types like `h1`, `p`, `grid`, `code`, `info`, etc. For details on available block types and their properties, refer to `src/components/ContentRenderer.jsx`.

> ⚠️ **Critical: Module IDs Must Be Strings**
>
> All `id` fields in both `manifest.json` and individual module JSON files **must be strings** (e.g., `"id": "1"`), **not numbers** (e.g., ~~`"id": 1`~~). React Router returns URL parameters as strings, and the app uses strict comparison. Numeric IDs will silently break module navigation.

### Adding a New Track

To add a completely new learning track:

1.  **Update `catalog.json`:** Add a new entry to `public/content/catalog.json`:
    ```json
    {
      "id": "cloud-operations",
      "title": "Cloud Operations",
      "description": "Master cloud infrastructure and DevOps workflows.",
      "icon": "Cloud"
    }
    ```
2.  **Create the Track Directory:** Create `public/content/tracks/cloud-operations/`.
3.  **Create `track.json`:** List the courses in this track:
    ```json
    {
      "track_id": "cloud-operations",
      "title": "Cloud Operations",
      "description": "Learn cloud-native development and operations.",
      "courses": [
        { "id": "gke-101", "title": "GKE 101", "description": "Intro to GKE.", "modules": 5, "icon": "Container" }
      ]
    }
    ```
4.  **Create Course Directories:** Add course folders with `manifest.json`, `metadata.json`, and `modules/`.
5.  **Navigate:** The new track will appear on the Dashboard at `/#/`.

### Adding a New Course to a Track

A single track can contain multiple courses. To add a new course:

1.  **Create the Course Directory:** Create a new folder under the track (e.g., `public/content/tracks/agentic-engineering/agy-02/`).
2.  **Create `manifest.json`:** Define the course modules with **string IDs**:
    ```json
    {
      "metadata": "metadata.json",
      "modules": [
        { "id": "1", "title": "Module Title", "file": "modules/01-module.json" }
      ]
    }
    ```
3.  **Create `metadata.json`:** Define the course title and description.
4.  **Create Module Files:** Add JSON files to `modules/` following the schema.
5.  **Update `track.json`:** Add the new course to the track's `track.json` file.
6.  **Navigate:** Access the course via `/#/[track_id]/[course_id]` (e.g., `/#/agentic-engineering/agy-02`).

### UI Components

The application provides reusable UI components for consistent styling within modules:

- `CodeBlock`: For displaying code snippets with a terminal-like header.
  ```javascript
  <CodeBlock language="bash" code="npm run dev" />
  ```
- `InfoBox`: For displaying notes and helpful tips.
  ```javascript
  <InfoBox title="Tip">Always verify your environment.</InfoBox>
  ```
- `WarningBox`: For displaying warnings and critical information.
  ```javascript
  <WarningBox title="Warning">Do not share your API keys.</WarningBox>
  ```

## Customization

### Themes
The primary colors and theme can be adjusted in `tailwind.config.js` and within the component styles in `app.js`.

### Icons
The project uses `lucide-react`. You can import and use any icons from the Lucide library.

## Deployment Details

The deployment uses the `actions/deploy-pages` action. Ensure that the GitHub repository settings have "GitHub Actions" selected as the source for Pages.
