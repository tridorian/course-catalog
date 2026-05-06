# Documentation

## Course Content Management

The course content is managed within `app.js` in the `courseSteps` array.

### Adding a New Module

To add a new module, append a new object to the `courseSteps` array with the following format:

```javascript
{
  id: 10,
  title: "10. New Module Title",
  duration: "5 mins",
  content: (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold text-white mb-6">New Module Title</h1>
      <p className="text-lg text-[#bbf7d0]">Description of the new module.</p>
      {/* Add more JSX content here */}
    </div>
  )
}
```

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
