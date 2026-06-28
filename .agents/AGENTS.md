# Rules for AI Agents (BOZHEMAN ≡ PROTOCOL)

This file contains specific instructions and rules for AI agents working on the **BOZHEMAN ≡ PROTOCOL** project.

## 1. Technology Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6 Modules).
- **Libraries:** Three.js (via CDN and `importmap`), TWEEN.js.
- **Build tools:** Not used. The project runs without Webpack, Vite, or other bundlers (direct inclusion of scripts as `type="module"`). Do not add build tools unless explicitly instructed.

## 2. Design and Aesthetics
- **Style:** Cyberpunk, Hacker, Matrix, Terminal. The project should evoke the feeling of a "hack" or a futuristic interface.
- **Colors (from `main.css`):** 
  - Main background: black (`#000000`).
  - Primary accent: red (`#ff3333`, `#a30000`).
  - Secondary colors for glows and glitches: pink (`#ff00de`), neon green (`#00ff88`), gold (`#ffd700`).
- **Fonts:** Exclusively monospace. The main font is `'Fira Code'`, with fallbacks to `'Courier New', monospace`.
- **Effects:** Heavy use of glitch effects, scanlines, glows, and typewriter animations.

## 3. Writing Code (CSS)
- Do not use TailwindCSS or other CSS frameworks.
- Follow the existing system of CSS variables (Custom Properties) defined in `css/main.css` (e.g., `var(--clr-primary)`, `var(--fs-base)`).
- Separate styles into different files for different pages (e.g., `games.css`, `roulet.css`), but always include global styles (fonts, variables, base resets).

## 4. Writing Code (JavaScript)
- Use a modular approach (`import` / `export`).
- Keep logic related to 3D (Three.js), glitch effects, or audio in separate or appropriate modules.
- Animations and transitions are often driven via `requestAnimationFrame` or TWEEN.js.

## 5. Language and Content
- **Localization:** The main interface language is Russian (for descriptions, button texts, content).
- **Text styling:** System messages, "protocol" logs, and terminal statuses are often written in English (e.g., `> INIT_CONNECTION...`, `SOUND: OFF`, `ACCESS GRANTED`) to maintain the hacker atmosphere.
- Preserve existing audio effects (e.g., `ambient-audio`, `glitch-audio`) to support user immersion.
