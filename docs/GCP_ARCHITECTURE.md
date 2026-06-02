# GCP Architecture & Google Workspace Sync

This document outlines the planned architecture for moving the Tridorian Course Platform from a static GitHub Pages deployment to a dynamic Google Cloud Platform (GCP) deployment, utilizing Google Drive and Docs as the primary Content Management System (CMS).

## 1. Google Drive Structure (The CMS)

To avoid building a custom editor, Google Drive serves as the source of truth for course content. The structure maps directly to the application hierarchy:

```
📁 Course Catalog (Root Folder)
├── 📁 Track: Agentic Engineering
│   ├── 📄 Course: AGV-101 (Google Doc)
│   └── 📄 Course: AGV-102 (Google Doc)
└── 📁 Track: Cloud Operations
    ├── 📄 Course: Cloud-101 (Google Doc)
    └── 📄 Course: Kubernetes (Google Doc)
```

### Course Document Structure
Instead of multiple files per course, **a single course is exactly one Google Doc**.
- Modules are separated using **Tabs** within the Google Doc, adhering strictly to the Tridorian Document Specification (TDS).
- **Versioning:** Course updates and drafts rely on Google Docs' native **Version History**. Authors edit the live document, and when a "Sync" is triggered, the engine pulls the latest named version or current state. We do *not* duplicate folders for drafts.

## 2. The Sync Engine

To ensure high performance for end-users, the React application will not query the Google Drive API directly for content on every load.

1.  **Sync Trigger:** A Google Workspace Add-on (or a webhook/admin dashboard button) triggers a sync.
2.  **Parsing:** A backend service (e.g., Cloud Functions or Cloud Run) reads the Google Doc.
3.  **Storage:** The parsed content (translated from Doc Tabs into JSON objects) is saved into a database (e.g., **Firestore**) for fast, scalable retrieval.

## 3. Frontend & Infrastructure

*   **Hosting:** The React frontend will be hosted on GCP (e.g., Firebase Hosting or Cloud Run), while GitHub Pages will be reserved solely for developer documentation and project landing pages.
*   **Database:** Firestore serves the JSON course content directly to the React frontend.

## 4. Authentication & Access Control

The platform cannot be fully public. Access control will be implemented via **Google OAuth**.

*   **Authentication:** Users must log in using their Google accounts.
*   **Authorization (Phase 1):** Initially, we will gate access based on specific email domains (e.g., `@yourcompany.com`) to keep unauthorized users out.
*   **Authorization (Phase 2):** Implement granular access control lists (ACLs) or Firestore Security Rules for more targeted user management later.

## 5. Technical Validation: Google Docs Tabs API

The single-document-with-tabs approach is fully supported by the Google Docs API.
- The `documents.get` method returns a `Document` resource.
- Within the `Document` resource, the `tabs` property contains an array of `Tab` objects.
- Each `Tab` contains its own `DocumentTab` object, which holds the structural elements (Body, Headers, Footers, etc.) identical to a standard, non-tabbed document.
- The sync engine will iterate through the `tabs` array, treating each tab as a distinct Module according to the Tridorian Document Specification (TDS).

## 6. AI-Driven Updates & Sync Orchestration

To streamline the maintenance and generation of course content, the sync process will be designed to be triggered autonomously by AI agents (e.g., Jules or AGY).

*   **Cloud Function / Webhook:** The sync engine will expose a secure Cloud Function endpoint.
*   **MCP Integration:** We will create an MCP (Model Context Protocol) server wrapping this endpoint.
*   **Agentic Workflow:** When an agent updates a course (by editing the Google Doc via API or other means), it can immediately call the MCP tool to trigger the Sync Engine. This allows the agent to verify that the generated JSON in Firestore accurately reflects the changes, completing the CI/CD loop entirely autonomously.

## 7. Google Workspace Add-on & Metadata "Tattooing"

To streamline authoring and prevent data collisions, we will develop a native **Google Workspace Add-on** for both Google Docs and Google Drive.

*   **Authoring Companion:** The Add-on provides a sidebar inside Google Docs, allowing authors to validate the Tridorian Document Specification (TDS) syntax, preview module blocks, and manually trigger the Sync Engine without leaving the editor.
*   **Metadata Tattooing:** The Add-on and Sync Engine will utilize the Google Drive `Properties` (or `appProperties`) service and the Docs `DocumentProperties` to "tattoo" crucial metadata directly onto the files.
    *   **Stored Properties:** `last_sync_timestamp`, `live_version_id`, `course_slug`, and `validation_status`.
    *   **Stale Update Prevention:** Before the Sync Engine updates Firestore, it compares the tattooed `live_version_id` against the current Docs version. If a collision is detected (e.g., the doc was modified concurrently), the Add-on alerts the user, preventing stale or conflicting updates from going live.
