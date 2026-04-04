# Gap Detector Memory

## Project: sample-log-electron

### Key Patterns
- This project uses vanilla JS with IIFE/class patterns exposed via `window.*` globals
- No module bundler; scripts loaded via `<script>` tags in HTML files
- Dual environment: Electron desktop + GitHub Pages web (src/ and docs/ folders mirrored)
- PDCA documents at: docs/01-plan/, docs/02-design/, docs/03-analysis/, docs/04-report/

### Analysis History
- **structural-improvement** (2026-02-18): Match Rate 92%, 31 items checked
  - Key finding: sync-version regex uses `[:]` but constants.js uses `=` assignment
  - Design specified `[:=]` but implementation has `[:]` only -- potential sync failure
  - index.html Tailwind config was additionally externalized (beyond design scope)

### Known File Locations
- Version constant: `src/shared/constants.js` L29 (`const APP_VERSION = '...'`)
- Package scripts: `package.json` "scripts" section
- Sync script: `scripts/sync-docs.js`
- Main init: `src/shared/main-init.js` (extracted from index.html inline)
- Settings script: `src/settings/settings-script.js` (extracted from settings inline)
- CSP config: `src/index.js` L260-278
