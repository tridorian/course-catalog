# Adding a New Theme

This guide explains how to add a custom theme to the tridorian Course Catalog.

## Quick Start (3 files to edit)

### Step 1: Define CSS Variables — `src/index.css`

Add a new theme block after the existing themes. Copy this template:

```css
/* My Theme Name — short description */
.theme-mytheme {
  color-scheme: dark; /* or light */

  /* Backgrounds (darkest → lightest for dark themes, lightest → darkest for light) */
  --bg-base:     #______;   /* Page background */
  --bg-panel:    #______;   /* Card / panel background */
  --bg-muted:    #______;   /* Subtle highlight, code block bg */
  --bg-elevated: #______;   /* Hover states, elevated surfaces */

  /* Text */
  --text-main:   #______;   /* Primary body text — MUST have 4.5:1 contrast against bg-base */
  --text-muted:  #______;   /* Secondary text — MUST have 4.5:1 contrast against bg-base */

  /* Borders */
  --border-main:   #______; /* Primary borders */
  --border-subtle: #______; /* Subtle dividers */

  /* Accent (brand color) */
  --accent-bg:     #______; /* Accent button background */
  --accent-fg:     #______; /* Text ON accent buttons (usually black or white) */
  --accent-text:   #______; /* Accent-colored text — MUST have 4.5:1 vs bg-panel */
  --accent-muted:  rgba(R, G, B, 0.08);  /* Subtle accent tint */
  --accent-border: rgba(R, G, B, 0.25);  /* Accent-colored borders */

  /* Shadows */
  --shadow-accent: 0 0 15px rgba(R, G, B, 0.2);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

### Step 2: Register the Theme — `src/hooks/useTheme.js`

Add your theme ID to the `VALID_THEMES` array:

```diff
-const VALID_THEMES = ['dark', 'light', 'kitten', 'caribbean', 'lunar'];
+const VALID_THEMES = ['dark', 'light', 'kitten', 'caribbean', 'lunar', 'mytheme'];
```

### Step 3: Add to Picker — `src/components/ThemePicker.jsx`

Add an entry to the `THEME_OPTIONS` array:

```diff
 const THEME_OPTIONS = [
   // ... existing themes
+  { id: 'mytheme', label: '🎨 My Theme', swatches: ['#bg-base', '#accent-bg', '#text-main'] },
 ];
```

The `swatches` are the 3 colors shown as preview circles in the picker (background, accent, text).

## Design Rules

### WCAG AA Contrast Requirements (mandatory)
Every theme MUST pass these contrast checks:

| Pair | Minimum Ratio | Check With |
|---|---|---|
| `text-main` on `bg-base` | 4.5:1 | [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) |
| `text-main` on `bg-panel` | 4.5:1 | |
| `text-muted` on `bg-base` | 4.5:1 | |
| `accent-text` on `bg-panel` | 4.5:1 | |
| `accent-fg` on `accent-bg` | 4.5:1 | |

### Color Scheme Declaration
- Dark themes: `color-scheme: dark;` — tells the browser to use dark scrollbars, form controls, etc.
- Light themes: `color-scheme: light;`

### Variable Naming Convention
- CSS class: `.theme-{id}` (lowercase, no spaces, kebab-case)
- Theme ID in JS: same as CSS class without `theme-` prefix
- All 14 CSS variables must be defined (missing ones will fall through to `:root` default)

## Existing Themes

| Theme | ID | Type | Accent | Personality |
|---|---|---|---|---|
| 🌿 tridorian Dark | `dark` | Dark | Green `#4ade80` | Professional, default |
| ☀️ Clean Light | `light` | Light | Green `#16a34a` | Bright, minimal |
| 🐱 Rainbow Kitten | `kitten` | Light | Pink `#e91e8c` | Playful, warm |
| 🏝️ Caribbean Mood | `caribbean` | Light | Teal `#0d9e8a` | Tropical, chill |
| 🌙 Lunar Vibe | `lunar` | Dark | White `#e8e8e8` | Focused, monochrome |

## Testing Your Theme

After adding a theme, run the test suite to make sure nothing breaks:

```bash
npx vitest run
```

Then visually verify in the browser:
1. `npm run dev`
2. Click the Theme picker (palette icon in the header)
3. Select your theme
4. Check: sidebar, cards, code blocks, buttons, scrollbars, modals
5. Verify text is readable at all sizes
6. Check both desktop and mobile widths
