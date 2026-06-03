# ADR 0005: Multi-Stage Content Sync Pipeline

## Date
2026-06-03

## Status
Proposed

## Context
The existing `sync-docs.js` (493 lines) uses the Google Docs API v1 to parse rich-text document elements (paragraphs, text styles, tables, background colors) into module JSON blocks. This is fragile:

- Tightly coupled to Docs API element structure
- Breaks on formatting changes (e.g. new heading styles, nested tables)
- Cannot detect or extract embedded images
- 493 lines of custom parsing code is hard to maintain

Google Drive's `files.export` API natively supports exporting Google Docs as Markdown (`text/markdown`) and PDF (`application/pdf`). Markdown covers 95% of content (text, headings, lists, code blocks, links). PDF serves as a visual reference for images and diagrams that Markdown can't represent.

## Decision
Replace the monolithic Docs API parser with a **multi-stage pipeline**:

### Stage 1: Export
For each Google Doc in `sync-config.json`:
1. **Export as Markdown** via `drive.files.export({ mimeType: 'text/markdown' })`
2. **Export as PDF** via `drive.files.export({ mimeType: 'application/pdf' })`
3. Save both to a staging directory: `public/content/.staging/[course_id]/`

### Stage 2: Parse
Parse the Markdown file into module JSON blocks:
- `# H1` → split into module boundaries (each H1 = one module tab)
- `## H2`, `### H3` → `{ type: 'h2' }`, `{ type: 'h3' }` blocks
- Paragraphs → `{ type: 'p' }` blocks
- Fenced code blocks → `{ type: 'code', language, content }` blocks
- Bullet lists → `{ type: 'list', items: [] }` blocks
- `> blockquote` → `{ type: 'info' }` blocks
- `> ⚠️` prefixed → `{ type: 'warning' }` blocks
- Links to Google Slides → `{ type: 'slides', url }` blocks
- Links to Google Drive video → `{ type: 'video', url }` blocks

### Stage 3: Image Detection
Scan the exported Markdown for `![image](...)` references:
1. If images are embedded as Drive URLs → download via Drive API and save to `public/content/tracks/[track_id]/[course_id]/assets/`
2. If images are inline (base64 or absent from MD) → flag in a `sync-report.json` for manual review
3. The PDF export serves as a visual reference to verify no images were missed

### Stage 4: Validate
Run the generated JSON through the schema validator:
- Course manifest must have `metadata` + `modules` array
- Each module must have `id`, `title`, `type`, `blocks`
- Block types must be from the allowed set
- Log validation results to `sync-report.json`

### Stage 5: Write
Only write to `public/content/tracks/` if validation passes. Use `updateFileIfChanged()` to avoid unnecessary git diffs.

### Directory Structure
```
public/content/
├── .staging/                          # Temporary exports (gitignored)
│   └── [course_id]/
│       ├── content.md                 # Exported Markdown
│       └── content.pdf                # Exported PDF (visual reference)
├── tracks/
│   └── [track_id]/
│       └── [course_id]/
│           ├── manifest.json
│           ├── metadata.json
│           ├── assets/                # Downloaded images
│           │   └── diagram-1.png
│           └── modules/
│               └── 01-intro.json
└── sync-report.json                   # Last sync results
```

## Consequences
- **Simpler:** ~100 lines of Markdown parsing replaces 493 lines of Docs API parsing
- **Robust:** Google handles the Doc→MD conversion; we parse well-defined Markdown
- **Image-aware:** PDF stage catches embedded diagrams that Markdown misses
- **Auditable:** `sync-report.json` and `.staging/` provide full traceability
- **Same output format:** Downstream JSON block structure is unchanged — no UI changes needed

## Migration
1. Add `googleapis` Drive scope (`drive.readonly`) alongside existing Docs scope
2. Rewrite `sync-docs.js` using the new pipeline
3. Add `.staging/` to `.gitignore`
4. Existing tests in `syncDocs.test.js` should be updated to test the new parser
5. Run against all existing courses and diff output to verify parity

## Test Verification
- **Test File:** `src/__tests__/services/syncDocs.test.js`
  - Tests Markdown → JSON block parsing
  - Tests image URL extraction and asset download
  - Tests validation gate (rejects malformed output)
  - Tests draft-skip behavior
  - Tests `updateFileIfChanged` (no-diff skip)
