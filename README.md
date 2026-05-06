# AGV Course Demo

[![Build and Deploy](https://github.com/wtg-codes/agv-course-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/wtg-codes/agv-course-demo/actions/workflows/deploy.yml)

The next generation Agentic SDLC course demo. This project showcases the capabilities of Google Antigravity (AGV) and the Tridorian standard for Secure Agentic Development through an interactive web-based course.

**[🚀 Launch Live Course](https://wtg-codes.github.io/agv-course-demo/)**

## Overview

This application is a React-based interactive course that guides users through setting up and using AGV. It covers:
- Environment Setup (Tier 1-3)
- Mission Control Settings
- Micro-AI Mechanics
- Agent Orchestration & Artifacts
- Visual Walkthroughs
- Rules vs. Workflows
- Disaster Recovery

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agv-course-demo
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

See [ARCH.md](./ARCH.md) for detailed architecture documentation.

## Documentation

See [DOCS.md](./DOCS.md) for more details on course content and configuration.

## Roadmap & To-Do

See [TODO.md](./TODO.md) for planned features and tasks.
