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
