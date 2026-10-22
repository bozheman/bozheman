<!--
Sync Impact Report:
- Version change: template -> 1.0.0
- Initial ratification derived from .agents/AGENTS.md (BOZHEMAN ≡ PROTOCOL)
- Added Core Principles:
  - I. Zero-Build Vanilla Stack (NON-NEGOTIABLE)
  - II. Cyberpunk & Terminal Aesthetics
  - III. CSS Custom Properties & Modular Stylesheets
  - IV. Modular ES6 JavaScript & Animation Discipline
  - V. Russian Localization & Bilingual Hacker Persona
-->
# BOZHEMAN ≡ PROTOCOL Constitution

## Core Principles

### I. Zero-Build Vanilla Stack (NON-NEGOTIABLE)
- Frontend MUST use Vanilla HTML5, CSS3, and JavaScript (ES6 Modules via `type="module"`).
- External 3D/animation libraries MUST be loaded via CDN and `importmap` (specifically Three.js and TWEEN.js).
- Build tools and bundlers (Webpack, Vite, Rollup, Parcel, etc.) MUST NOT be introduced unless explicitly instructed by the user.

### II. Cyberpunk & Terminal Aesthetics
- Every interface MUST evoke a cyberpunk, hacker, Matrix, or terminal aesthetic.
- Color palette MUST adhere to `css/main.css` tokens: black (`#000000`) background, red (`#ff3333`, `#a30000`) primary accents, and secondary glow/glitch accents in pink (`#ff00de`), neon green (`#00ff88`), and gold (`#ffd700`).
- Typography MUST exclusively use monospace fonts (`'Fira Code'` with fallbacks `'Courier New', monospace`).
- Visual feedback SHOULD leverage glitch effects, scanlines, glows, and typewriter animations.

### III. CSS Custom Properties & Modular Stylesheets
- CSS frameworks (such as TailwindCSS, Bootstrap, etc.) MUST NOT be used.
- Styles MUST use the existing CSS Custom Properties defined in `css/main.css` (e.g., `var(--clr-primary)`, `var(--fs-base)`).
- Page-specific styles MUST be separated into dedicated stylesheet files (e.g., `games.css`, `roulet.css`) while always importing or including global styles (fonts, variables, base resets).

### IV. Modular ES6 JavaScript & Animation Discipline
- JavaScript code MUST use native ES6 modules (`import` / `export`).
- Logic for 3D rendering (Three.js), glitch effects, and audio MUST be isolated in separate or dedicated modules.
- Animations and transitions MUST be driven via `requestAnimationFrame` or TWEEN.js where appropriate.

### V. Russian Localization & Bilingual Hacker Persona
- Main user-facing interface text (descriptions, buttons, content) MUST be in Russian.
- System messages, protocol logs, and terminal statuses SHOULD use English hacker/terminal conventions (e.g., `> INIT_CONNECTION...`, `SOUND: OFF`, `ACCESS GRANTED`) to preserve immersion.
- Existing audio effects (such as `ambient-audio` and `glitch-audio`) MUST be preserved to maintain user immersion.

## Technical Constraints

- All pages MUST run directly in a modern browser without a compilation or bundling step.
- Asset paths and module imports MUST remain valid for static hosting.

## Development Workflow

- Feature specifications (`/speckit-specify`) MUST focus on user scenarios and functional requirements before implementation details.
- Implementation plans (`/speckit-plan`) and task breakdowns (`/speckit-tasks`) MUST verify compliance with all five Core Principles above and reference `.agents/AGENTS.md`.

## Governance

- This Constitution and `.agents/AGENTS.md` supersede generic defaults during specification, planning, and implementation.
- Amendments require updating both `.specify/memory/constitution.md` and `.agents/AGENTS.md` when core technical or design rules change, following semantic versioning (`MAJOR.MINOR.PATCH`).

**Version**: 1.0.0 | **Ratified**: 2026-10-22 | **Last Amended**: 2026-10-22
