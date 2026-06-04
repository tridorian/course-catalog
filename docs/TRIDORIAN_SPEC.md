# tridorian Document Specification (TDS) v1.0

This document defines the format for creating course materials in Google Docs for synchronization with the tridorian Course Platform.

## 1. Document Structure

The Google Doc must use **Tabs** to organize content.

### Tab 1: `[Config]`
- **Purpose:** Metadata and course-wide settings.
- **Format:** A single 2-column table.
- **Required Keys:**
  - `course_id`: A unique URL-friendly slug (e.g., `agy-101`).
  - `title`: The display name of the course.
  - `version`: Semver versioning (e.g., `1.0.0`).
  - `author`: Name of the creator.

### Tab 2: `[Intro]`
- **Purpose:** The landing page of the course.
- **Title:** Use **Heading 1** for the course title.
- **Body:** Standard text for the description.
- **Features Card:** A 2-column table representing icons and descriptions:
  - Column 1: Lucide Icon Name (e.g., `PlayCircle`, `ShieldAlert`).
  - Column 2: Title & Description text.

### Tabs 3+: `[Module Name]`
- **Purpose:** Individual course steps.
- **Title:** Use **Heading 1** for the module title.
- **Duration:** Use **Heading 2** (e.g., "10 mins").
- **Content Blocks:** See Section 2.

---

## 2. Content Blocks Mapping

The sync engine maps Google Doc elements to React components:

| Google Doc Element | React Component | Notes |
|-------------------|-----------------|-------|
| Paragraph | `<p>` | Standard body text. |
| Bullet/Numbered List | `<ul>` / `<ol>` | Automatically wrapped in list tags. |
| Native Code Block | `<CodeBlock>` | Insert > Building Blocks > Code Block. |
| Table (Green Bg #dcfce7) | `<InfoBox>` | 1x1 table with light green background. |
| Table (Red Bg #fee2e2) | `<WarningBox>` | 1x1 table with light red background. |
| Heading 3 | `<h3>` | Used for sub-sections within a module. |

---

## 3. Validation

Before syncing, use the **tridorian Validator** Apps Script (Extensions > Apps Script) to ensure the document is compliant. The validator checks for:
- Existence of `[Config]` and `[Intro]` tabs.
- Presence of required metadata in the Config table.
- Heading 1 and Heading 2 in every module tab.

## 4. References

For technical decisions and implementation details regarding hierarchy structure, schema validation, and drive synchronization, refer to:
- [ADR 0001: Core Content Hierarchy & Schema Validation](./adr/0001-core-content-hierarchy-schema-validation.md)
- [ADR 0004: Progress Persistence & Drive Synchronization](./adr/0004-progress-persistence-drive-synchronization.md)
