# Documentation

## Course Content Management

The course content is dynamically loaded and follows a 4-tier hierarchy (Track > Course > Module > Step). Content is stored in JSON format within the `public/content/tracks/` directory.

### Adding a New Module

1.  **Create the Module File:** Create a new JSON file (e.g., `10-new-module.json`) in the appropriate course directory (e.g., `public/content/tracks/[track_id]/[course_id]/modules/`).
2.  **Define Module Structure:** The JSON file must adhere to the `ModuleSchema`. It requires a `title`, `type` (e.g., `lab`, `presentation`, `resource`), and depending on the type, `blocks` (for labs), `url` (for presentations/resources).
3.  **Update Manifest:** Add the filename of the new module to the `modules` array in the course's `manifest.json` file.
4.  **Using Blocks:** The platform dynamically renders content using `ContentRenderer.jsx`. Define content blocks in the JSON using supported types like `h1`, `p`, `grid`, `code`, `info`, etc. For details on available block types and their properties, refer to `src/components/ContentRenderer.jsx`.

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
