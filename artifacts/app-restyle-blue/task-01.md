# Task-01 — Swap night-theme color tokens to landing palette

## Goal
Make every in-app accent and surface inherit the landing's sky/cyan color story via `theme.css` token changes only — zero shape/layout edits.

## Write scope
`frontend/css/theme.css` only.

## Concrete edits

### body.night (~line 60–90)
- `--purple: #60a5fa` → `#7dd3fc` (landing sky-300 — primary accent across landing CTAs, links, icons)
- `--pink: #38bdf8` → keep (already landing sky-400)
- `--orange: #ff8c5a` → `#bae6fd` (landing sky-200, removes the orange outlier; if any component relied on the warm hue, task-03 can patch)
- `--bg: #020617` → keep (matches landing bg-deep)
- `--card: #0f172a` → keep (matches landing slate-900)
- `--text: #e2e8f0` → keep (matches landing slate-200)
- `--muted: #64748b` → keep (close to landing slate-400)
- `--border: #1e293b` → keep (matches landing slate-800)
- `--shadow: 0 2px 14px rgba(0, 0, 0, 0.4)` → keep, but ADD a sibling token
- ADD `--shadow-sky: 0 0 35px rgba(56, 189, 248, 0.35)` (landing CTA glow)
- ADD `--shadow-sky-soft: 0 0 55px rgba(56, 189, 248, 0.18)`

### Leave alone for now
- `:root` light mode tokens (out of scope per plan)
- All `--auth-*` tokens (auth modal has its own scope via auth.css)
- `--glass-*` tokens (already match landing — `rgba(255,255,255,0.07)`)
- `--dp-bg` gradient (already matches `linear-gradient(135deg, #020617 0%, #0f172a 48%, #082f49 100%)`)

## Done criteria
- Only theme.css modified.
- `tsc -p frontend/tsconfig.build.json --noEmit` exit 0.
- Committed + pushed to `feat/app-restyle-blue`.
- User sees the in-app accents shift from blue-400 to sky-300 (more vibrant cyan-blue) and the orange-tinted bits go cool.

## Out of scope
- Adding `box-shadow: var(--shadow-sky)` calls. We only DEFINE the token here; consumers come in task-02 / task-03.
- Editing layout.css / styles.css.
- Touching any non-night CSS.

## Risk
Low. Token swaps with the same color family. No selector changes.
