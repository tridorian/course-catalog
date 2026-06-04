# GCP Architecture & Google Workspace Sync

This document outlines the current architecture for the tridorian Course Platform deployed on Google Cloud Platform (GCP) Cloud Run, utilizing Google Drive and Docs as the primary Content Management System (CMS).

## 1. Google Drive Structure (The CMS)

To avoid building a custom editor, Google Drive serves as the source of truth for course content. The structure maps directly to the application hierarchy:

```
📁 Course Catalog (Root Folder)
├── 📁 Track: Agentic Engineering
│   ├── 📄 Course: AGY-101 (Google Doc)
│   └── 📄 Course: AGY-102 (Google Doc)
└── 📁 Track: Cloud Operations
    ├── 📄 Course: Cloud-101 (Google Doc)
    └── 📄 Course: Kubernetes (Google Doc)
```

### Course Document Structure
Instead of multiple files per course, **a single course is exactly one Google Doc**.
- Modules are separated using **Tabs** within the Google Doc, adhering strictly to the tridorian Document Specification (TDS).
- **Versioning:** Course updates and drafts rely on Google Docs' native **Version History**. Authors edit the live document, and when a "Sync" is triggered, the engine pulls the latest named version or current state. We do *not* duplicate folders for drafts.

## 2. The Sync Engine

To ensure high performance for end-users, the React application does not query the Google Drive API directly for content on every load.

1.  **CI/CD Sync Workflow:** A GitHub Actions workflow (`content-sync.yml`) runs on a nightly schedule (cron) or manually via `workflow_dispatch`.
2.  **Doc Parsing:** The workflow runs `scripts/sync-docs.js` using Node.js, authenticating to the Google Docs API with a Service Account (`GOOGLE_SERVICE_ACCOUNT_KEY`).
3.  **Commit & Deploy:** The parsed JSON course files are generated directly in `public/content/`, committed, and pushed back to the Git repository. A subsequent push to `main` triggers the Cloud Run deployment.

## 3. Frontend & Infrastructure

*   **Hosting:** The React frontend is built as a Vite application and served by Nginx inside a Docker container on Cloud Run. Nginx acts as the primary web server and handles routing as well as API reverse proxying.
*   **Content Delivery:** Course content is served directly as static JSON files from the `/content/` directory via Nginx, ensuring high performance, caching, and decoupling of content from code without requiring database overhead (like Firestore).

## 4. Authentication & Access Control

Access control is implemented client-side via **Google OAuth**.

*   **Authentication:** Users log in using Google Identity Services (GIS) OAuth2 client-side flow.
*   **Authorization / Roles:** The user's role (`admin` or `student`) is dynamically determined. In testing/dev mode, an email comparison is performed (e.g. checking for `taylor@tridorian.com`). In production/non-testing mode, the user's role is checked by querying their edit capabilities on a specific shared Google Drive directory. If they have write/edit access, they are granted `admin` status (enabling features like the sync control panel).

## 5. Technical Validation: Google Docs Tabs API

The single-document-with-tabs approach is fully supported by the Google Docs API.
- The `documents.get` method returns a `Document` resource.
- Within the `Document` resource, the `tabs` property contains an array of `Tab` objects.
- Each `Tab` contains its own `DocumentTab` object, which holds the structural elements (Body, Headers, Footers, etc.) identical to a standard, non-tabbed document.
- The sync engine will iterate through the `tabs` array, treating each tab as a distinct Module according to the tridorian Document Specification (TDS).

## 6. AI-Driven Updates & Sync Orchestration

To streamline the maintenance and generation of course content, the sync process will be designed to be triggered autonomously by AI agents (e.g., Jules or AGY).

*   **Cloud Function / Webhook:** The sync engine will expose a secure Cloud Function endpoint.
*   **MCP Integration:** We will create an MCP (Model Context Protocol) server wrapping this endpoint.
*   **Agentic Workflow:** When an agent updates a course (by editing the Google Doc via API or other means), it can immediately call the MCP tool to trigger the Sync Engine. This allows the agent to verify that the generated JSON in Firestore accurately reflects the changes, completing the CI/CD loop entirely autonomously.

## 7. Google Workspace Add-on & Metadata "Tattooing"

To streamline authoring and prevent data collisions, we will develop a native **Google Workspace Add-on** for both Google Docs and Google Drive.

*   **Authoring Companion:** The Add-on provides a sidebar inside Google Docs, allowing authors to validate the tridorian Document Specification (TDS) syntax, preview module blocks, and manually trigger the Sync Engine without leaving the editor.
*   **Metadata Tattooing:** The Add-on and Sync Engine will utilize the Google Drive `Properties` (or `appProperties`) service and the Docs `DocumentProperties` to "tattoo" crucial metadata directly onto the files.
    *   **Stored Properties:** `last_sync_timestamp`, `live_version_id`, `course_slug`, and `validation_status`.
    *   **Stale Update Prevention:** Before the Sync Engine updates Firestore, it compares the tattooed `live_version_id` against the current Docs version. If a collision is detected (e.g., the doc was modified concurrently), the Add-on alerts the user, preventing stale or conflicting updates from going live.

## 8. Backend API Proxy (For Dynamic Themes)

To protect developer API credentials while ensuring the AI Theme Generator, Music Synthesizer (Lyria), and Image Generator (Imagen) work without exposing raw developer API keys to the browser, requests are routed through a secure backend proxy.

1.  **Architecture**: The client application routes theme, music, and image generation requests to `/api/generate-theme`, `/api/generate-music`, and `/api/generate-image`.
2.  **Nginx Reverse Proxy**: Nginx in the Cloud Run container reverse proxies the `/api/` path to the secure Node.js Cloud Function (`theme-proxy`).
3.  **Access Token via ADC**: The Cloud Function (`theme-proxy`) uses the standard `@google-cloud/functions-framework` and `google-auth-library` to dynamically retrieve an OAuth access token using the GCP Service Account via Application Default Credentials (ADC) with the scopes `https://www.googleapis.com/auth/generative-language` and `https://www.googleapis.com/auth/cloud-platform`.
4.  **Local Development**: In local development, developers can run `scripts/gemini_proxy.js` or configure `VITE_PROXY_URL=http://localhost:5001` in their git-ignored `.env.local` file to bypass direct Google API requests, or run the Cloud Function locally.
5.  **GCP Service Account Binding**: 
    1. Create a dedicated service account:
       ```bash
       gcloud iam service-accounts create theme-generator-sa --display-name="Theme Generator Service Account"
       ```
    2. Grant it restricted access to Vertex AI / Gemini:
       ```bash
       gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
         --member="serviceAccount:theme-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
         --role="roles/aiplatform.user"
       ```

## 9. References

For current implementation details on client-side Google Drive persistence, offline delta syncing, and the local doc parser, refer to:
- [ADR 0004: Progress Persistence & Drive Synchronization](./adr/0004-progress-persistence-drive-synchronization.md)
