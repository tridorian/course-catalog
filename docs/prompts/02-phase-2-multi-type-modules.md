# Phase 2: Multi-Type Module Support

## Goal
Implement specialized rendering components for different module types: **Lab**, **Presentation**, and **Resource**.

## Prerequisites
- Phase 1 (Hierarchy Refactor) must be complete and approved.
- The `ModuleRenderer` should be able to identify `module.type` from the manifest.

## Tasks
1. **TDD for Module Selection:**
   - Write tests to verify that a `module.type === "presentation"` renders a presentation-specific view.
   - Write tests to verify that `module.type === "resource"` renders a resource-specific view.
2. **Presentation Module Implementation:**
   - Create a component that utilizes `VideoEmbed` or `SlideDeckEmbed` based on the module's provided URL.
   - Include a "Notes" or "Transcript" section below the embed.
3. **Resource Module Implementation:**
   - Create a component for embedding reference materials (e.g., Google Docs links or structured documentation lists).
4. **Integration:**
   - Update `ContentRenderer` or create a higher-level `ModuleRenderer` to switch between these three types.

## Exit Criteria (Phase 2)
- Presentation modules successfully render an `iframe` with the correct Google Slide/Drive URL.
- Resource modules successfully display their intended content/links.
- Existing "Lab" functionality (step-by-step blocks) remains functional and unaffected (no regressions).

**Important:** Ensure all new components follow the "tridorian" dark theme and responsive design patterns.
