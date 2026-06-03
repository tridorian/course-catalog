# ADR 0002: Multi-Type Module Rendering

## Date
2026-06-03

## Status
Accepted (amended)

## Context
The platform must support a variety of pedagogical content styles. Specifically, some lessons are hands-on labs (step-by-step guides), some are lecture presentations (slides or video walkthroughs), and others are reference guides (links to Google Docs, Sheets, Forms, Sites, PDFs, or other Drive files). We need a unified rendering strategy that routes content depending on its learning type without adding complexity to the root application view.

Course authors should be able to drop **any Google Drive URL** into a module and have it render correctly — no manual embed format conversion required.

## Decision
We implement a polymorphic `<ModuleRenderer>` component that delegates rendering to specialized components based on the `module.type` attribute, and a **universal Drive embed system** that auto-detects file types from URLs.

### 1. Module-Level Rendering Types & Dispatch
The system defines three core module types:
1. **Lab Module (`type: "lab"`):** Delegated to `<ContentRenderer>`. It reads a list of structured `blocks` and renders them in order.
2. **Presentation Module (`type: "presentation"`):** Renders embedded media (slides, video, docs, etc.) with optional lecture notes underneath.
3. **Resource Module (`type: "resource"`):** Renders a card layout highlighting reference material, description, and a button linking out to the external resource.

### 2. Universal Drive Embed System
Within any module's `blocks`, a block of type `embed` (or detected from a URL) is dispatched through a **URL-pattern matcher** in `Embeds.jsx`:

| URL Pattern | Embed Component | Embed URL Format | Aspect Ratio |
|---|---|---|---|
| `docs.google.com/presentation` | `<SlideDeckEmbed>` | `{base}/embed?start=false&loop=false` | 16:9 |
| `drive.google.com/file` (video) | `<VideoEmbed>` | `{base}/preview` | 16:9 |
| `docs.google.com/document` | `<DocEmbed>` | `{base}/preview` | 4:3 (tall) |
| `docs.google.com/spreadsheets` | `<SheetEmbed>` | `{base}/preview` | 16:9 |
| `docs.google.com/forms` | `<FormEmbed>` | `{base}/viewform?embedded=true` | auto-height |
| `sites.google.com` | `<SiteEmbed>` | URL as-is | 16:9 |
| `drive.google.com/file` (PDF) | `<PdfEmbed>` | `{base}/preview` | 4:3 (tall) |
| `drive.google.com/file` (image) | `<ImageEmbed>` | Direct thumbnail URL | auto |
| `youtube.com` / `youtu.be` | `<YouTubeEmbed>` | `youtube.com/embed/{id}` | 16:9 |
| Any other `drive.google.com` | `<DriveEmbed>` | `{base}/preview` (fallback) | 16:9 |

**Dispatch logic** (`getDriveEmbedType(url)` in `Embeds.jsx`):
```js
function getDriveEmbedType(url) {
  if (url.includes('docs.google.com/presentation')) return 'slides';
  if (url.includes('docs.google.com/document'))     return 'doc';
  if (url.includes('docs.google.com/spreadsheets'))  return 'sheet';
  if (url.includes('docs.google.com/forms'))         return 'form';
  if (url.includes('sites.google.com'))              return 'site';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('drive.google.com/file'))         return 'drive-file';
  return 'drive-generic';
}
```

All embed components share the common `<EmbedEditOverlay>` dev-mode tool and `<DevEditButton>`.

### 3. Block-Level Embed Detection
In `ContentRenderer.jsx`, blocks with `type: "embed"` render through the dispatch table above. Additionally, blocks of `type: "p"` containing a bare Google URL are **auto-promoted** to embeds during rendering (no sync-time transformation needed).

### 4. Inline Markdown Formatting
Rather than including a heavy markdown library, a lightweight helper `renderMarkdown(text)` in `<ContentRenderer>` parses:
- Bold text: `**text**` -> `<strong>`
- Code blocks: `` `code` `` -> `<code>`
- Links: `[text](url)` -> `<a>` with `target="_blank"`

## Consequences
- Authors can paste **any Google Workspace URL** and it just works.
- Clean separation of UI logic for different file types.
- Fast, secure rendering of basic formatting without heavy dependency load.
- Seamless editing in development mode through the path-overlay dev tool.
- New Google Workspace file types can be added by extending the dispatch table.

## Test Verification
- **Test File:** `src/__tests__/components/ModuleRenderer.test.jsx`
  - Verifies that a `lab` module is routed to render standard blocks.
  - Verifies that a `presentation` module renders the corresponding embed element.
  - Verifies that a `resource` module displays the reference description and an anchor link pointing to the correct URL.
- **Test File:** `src/__tests__/components/Embeds.test.jsx` (new)
  - Verifies `getDriveEmbedType()` returns correct type for each URL pattern.
  - Verifies each embed component renders the correct iframe src format.
  - Verifies fallback `<DriveEmbed>` handles unknown Drive URLs.

