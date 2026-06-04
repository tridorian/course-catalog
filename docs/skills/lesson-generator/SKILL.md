---
name: lesson-generator
description: "Generate structured 90% course drafts and manage track folders inside Google Drive using the gws CLI."
metadata:
  version: 1.0.0
  openclaw:
    category: "content-generation"
    requires:
      bins:
        - gws
        - gcloud
    cliHelp: "gws docs --help"
---

# Lesson Generator Skill

This skill guides an AI agent to initialize Google Drive folder structures, create course draft documents, and structure content so it can be parsed by the course catalog sync engine.

---

## 1. Authentication (ADC Token Extraction)

To authenticate the `gws` CLI calls, extract an OAuth2 access token from `gcloud` Application Default Credentials (ADC) and export it as `GOOGLE_WORKSPACE_CLI_TOKEN`.

```bash
# Extract and export token
export GOOGLE_WORKSPACE_CLI_TOKEN=$(gcloud auth application-default print-access-token)
```

Ensure this token is set in the environment before executing any subsequent `gws` command.

---

## 2. Track Folder Management

Track folders are located in the parent directory `1UTsC7YPjz72BiwqJDyJx6VydyHGgW160` (supports shared drives).

### A. Checking for an Existing Track Folder
Use the track title to see if the folder already exists in the parent directory. Be sure to enable `supportsAllDrives` and `includeItemsFromAllDrives`.

```bash
gws drive files list --params '{
  "q": "\u00271UTsC7YPjz72BiwqJDyJx6VydyHGgW160\u0027 in parents and mimeType = \u0027application/vnd.google-apps.folder\u0027 and name = \u0027<Track Title>\u0027 and trashed = false",
  "supportsAllDrives": true,
  "includeItemsFromAllDrives": true
}'
```

### B. Creating a Missing Track Folder
If the folder does not exist, create it in the parent folder `1UTsC7YPjz72BiwqJDyJx6VydyHGgW160`.

```bash
gws drive files create --params '{"supportsAllDrives": true}' --json '{
  "name": "<Track Title>",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["1UTsC7YPjz72BiwqJDyJx6VydyHGgW160"]
}'
```
*Take note of the created folder's `"id"` from the stdout response.*

---

## 3. Creating Google Docs inside the Track Folder

Create a blank Google Doc within the corresponding Track Folder ID:

```bash
gws drive files create --params '{"supportsAllDrives": true}' --json '{
  "name": "<Course Title> Draft",
  "mimeType": "application/vnd.google-apps.document",
  "parents": ["<TRACK_FOLDER_ID>"]
}'
```
*Take note of the returned document `"id"` from the output.*

---

## 4. Structuring a 90% Course Draft

Courses can be formatted in one of two formats: **Single-Doc** (preferred/simpler) or **Multi-Tab**. Both are supported by the sync engine.

### Option A: Single-Doc (Tabless) Structure (Recommended)

In this format, all sections are in the main body of the document, separated by `HEADING_1` style headers that act as boundaries:

#### 1. Configuration Section: `# [Config]`
Must start with Heading 1 containing `# [Config]` or `[Config]`. Below it, place a table with two columns for metadata:

| Key | Value |
|---|---|
| course_id: | `agv-101` |
| title: | `Agentic Engineering 101` |
| version: | `1.0.0` |
| author: | `Taylor` |
| status: | `Draft` (or `Published`) |

> [!IMPORTANT]
> If `status` is set to `Draft`, the sync engine will skip parsing this course and successfully terminate without writing local files.

#### 2. Introduction Section: `# [Intro]`
Must start with Heading 1 containing `# [Intro]` or `[Intro]`. It contains:
- The course description as a normal paragraph.
- A two-column highlights table. The first column contains an icon/emoji; the second column contains a bold title followed by a line break and description.

#### 3. Module Sections: `# [01-Module Name]`
Each module starts with a Heading 1 containing `# [01-Module Name]` or `[01-Module Name]`. Content block types inside modules are:
- **Normal Paragraphs**: Styled as standard text.
- **Code Blocks**: Formatted with Courier New or Consolas font.
- **Callout Boxes**: A single-cell table with background colors:
  - Info/Tip box: Background color `#dcfce7` (light green)
  - Warning box: Background color `#fee2e2` (light red)
- **Media elements**: Link formatted like `[Slides Title](https://docs.google.com/presentation/d/...)` or `[Video Title](https://drive.google.com/file/d/...)`.
- **List Items**: Standard bullet points or numbered lists.

---

### Option B: Multi-Tab Structure

For multi-tab documents, rather than boundaries in the body, create separate Google Docs tabs:
- A tab named exactly `[Config]` containing the metadata table.
- A tab named exactly `[Intro]` containing the course description and highlights table.
- Tabs named like `[01-Module Name]` for each course module.

To manage tabs or append text to tabs via `gws`, use the `docs.documents.batchUpdate` API.
Example request body for creating a tab:
```json
{
  "requests": [
    {
      "createTab": {
        "tabProperties": {
          "title": "[Config]"
        }
      }
    }
  ]
}
```

Example request body for inserting text into a specific tab:
```json
{
  "requests": [
    {
      "insertText": {
        "text": "course_id: agv-101\ntitle: ...",
        "location": {
          "segmentId": "<TAB_ID>",
          "index": 1
        }
      }
    }
  ]
}
```
