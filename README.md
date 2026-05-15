# Course Catalog Demo

[![Build and Deploy](https://github.com/wtg-codes/course-catalog/actions/workflows/deploy.yml/badge.svg)](https://github.com/wtg-codes/course-catalog/actions/workflows/deploy.yml)

The course catalog demo. This project showcases the capabilities of  the Tridorian standard for  an interactive web-based course.

**[🚀 Launch Live Course Catalog](https://wtg-codes.github.io/course-catalog/)**

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

This project is configured for automated deployment to GitHub Pages via GitHub Actions.

- **Vite Config:** Uses `base: './'` for relative asset paths.
- **Workflow:** `.github/workflows/deploy.yml` handles building and deploying on pushes to the `main` branch.

## Architecture

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Documentation

See [CONTENT_GUIDE.md](./docs/CONTENT_GUIDE.md) for content authoring and configuration.

## Agent Instructions

See [AGENTS.md](./AGENTS.md) for AI agent coding conventions and workflow rules.

## Roadmap & To-Do

See [TODO.md](./TODO.md) for planned features and tasks.
