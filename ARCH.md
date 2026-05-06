# Architecture

This document describes the high-level architecture of the AGV Course Demo.

## Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** GitHub Pages via GitHub Actions

## Project Structure

- `index.html`: The entry point for the web application.
- `src/main.jsx`: Initializes the React application and renders the root component.
- `app.js`: The core application component containing the course content and logic.
- `src/index.css`: Global styles and Tailwind CSS imports.
- `vite.config.js`: Configuration for Vite, including JSX support for `.js` files and base path settings.
- `.github/workflows/deploy.yml`: GitHub Actions workflow for automated deployment.

## Core Logic

The application logic resides primarily in `app.js`.

### Content Structure
Course content is defined as an array of objects (`courseSteps`), each representing a module with:
- `id`: Unique identifier.
- `title`: Module title.
- `duration`: Estimated time to complete.
- `content`: JSX representing the module's body.

### State Management
The application uses React's `useState` to track:
- `activeStepIndex`: The current module being viewed.
- `isMobileMenuOpen`: Toggle state for the mobile navigation menu.

### Navigation
Users can navigate through modules using:
- Sidebar (on desktop) or Mobile Menu.
- "Back" and "Next" buttons at the bottom of the page.

## Styling & Theme

The application uses a dark theme ("Tridorian") with green accents (`#4ade80`).
- Tailwind CSS is used for layout and responsive design.
- Custom scrollbar styles are injected via a `<style>` tag in `App.js`.
- `tailwindcss-animate` provides entry animations for content.
