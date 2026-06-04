# Course Catalog Demo

[![Build and Deploy](https://github.com/tridorian/course-catalog/actions/workflows/deploy-cloudrun.yml/badge.svg)](https://github.com/tridorian/course-catalog/actions/workflows/deploy-cloudrun.yml)

The course catalog demo. This project showcases the capabilities of the tridorian standard for an interactive web-based course.

**[🚀 Launch Live Course Catalog](https://tridorian-labs-zqfmig3vcq-uc.a.run.app)**

## Overview

This application is a React-based interactive course platform. It utilizes a dynamic loading architecture to fetch course content structured in a 4-tier hierarchy (Track > Course > Module > Step). Content is decoupled from the source code, defined in JSON files, and rendered dynamically. Each track supports **multiple courses** — simply add a new directory under `public/content/tracks/[track_id]/` and navigate to it via URL.

The featured courses are listed on the Dashboard.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd course-catalog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production

To build the project for production:
```bash
npm run build
```
The production-ready files will be in the `dist` directory.

## Deployment

This project is configured for automated deployment to Google Cloud Run via GitHub Actions.

- **Vite Config:** Uses `base: './'` for relative asset paths.
- **Workflow:** `.github/workflows/deploy-cloudrun.yml` handles building, pushing Docker images, and deploying to Cloud Run on pushes to the `main` branch.

## Architecture

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

Key architectural decisions are documented as Architecture Decision Records (ADRs) under [docs/adr/](./docs/adr/):
- [ADR 0001: Core Content Hierarchy & Schema Validation](./docs/adr/0001-core-content-hierarchy-schema-validation.md)
- [ADR 0002: Multi-Type Module Rendering](./docs/adr/0002-multi-type-module-rendering.md)
- [ADR 0003: Dynamic Routing & Breadcrumb Navigation](./docs/adr/0003-dynamic-routing-breadcrumb-navigation.md)
- [ADR 0004: Progress Persistence & Drive Synchronization](./docs/adr/0004-progress-persistence-drive-synchronization.md)

## Documentation

See [CONTENT_GUIDE.md](./docs/CONTENT_GUIDE.md) for content authoring and configuration.

## Agent Instructions

See [AGENTS.md](./AGENTS.md) for AI agent coding conventions and workflow rules.

## Roadmap & To-Do

See [TODO.md](./TODO.md) for planned features and tasks.
