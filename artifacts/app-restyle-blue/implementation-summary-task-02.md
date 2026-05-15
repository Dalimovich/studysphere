# Task-02 (partial — high-impact pass) implementation summary

## Why this isn't the full task-02 yet
Task-01's token-only change wasn't visible enough — both `#60a5fa` and `#7dd3fc` are light blues, so the cascade-only swap was imperceptible at glance. This commit lands the **visible** changes:

1. **body.night now has the landing's radial-sky background** (two sky hotspots over a slate linear gradient, `background-attachment: fixed`). This is the single biggest visible delta — every glass surface in the app sees through to it.
2. **--dp-bg replaced** with the same radial+linear combo. Every dashboard / courses / settings screen using `var(--dp-bg)` inherits the new atmosphere.
3. **--dp-modal got a sky radial top-glow** added over its linear base.
4. **Bulk swap of hardcoded blue-400** (`#60a5fa`) → sky-300 (`#7dd3fc`) and `rgba(96,165,250,X)` → `rgba(125,211,252,X)` across `layout.css`, `styles.css`, `theme.css`. ~30 occurrences total. Now every active sidebar item, active course-row, AI panel heading, focused PDF toolbar button, etc. uses the landing's cyan-blue accent.

## Files touched
- `frontend/css/theme.css` — `--dp-bg`, `--dp-modal`, `--dp-solid` updated; new `body.night { background: ... }` rule.
- `frontend/css/layout.css` — bulk replace `#60a5fa` → `#7dd3fc` (23 occurrences); `rgba(96,165,250,...)` → `rgba(125,211,252,...)` (5 occurrences).
- `frontend/css/styles.css` — typing-bubble color swap.
- `frontend/index.html` — cache-bust v=6/v=7.

## What's NOT done yet
- Sidebar glass refinement (it already uses `--glass-bg` so it inherits, but could get sky border-glow on hover/active).
- AI panel and PDF toolbar still have a few small hardcoded grays/blues that might want a pass.
- Light mode (`:root`) untouched, as planned.

## Typecheck
`tsc -p frontend/tsconfig.build.json --noEmit` exit 0.
