# In-app restyle to landing aesthetic — plan

## Goal
Re-skin the in-app dashboard / courses / PDF / AI panel / settings to visually match the new landing page and sign-in modal: dark-blue glassmorphism, sky/cyan accents, white-on-blue glass surfaces, soft sky-glow shadows.

## Branch
`feat/app-restyle-blue` off `feat/landing-vanilla-port`. Push only; don't merge to main.

## Scope (user-confirmed)
**Colors + glass surfaces.** Not a full per-component visual port.

That means:
- Swap dark-mode color tokens (`--purple`, `--pink`, `--bg`, glass tokens, shadows) to the landing's sky palette so every accent + surface in the app inherits the new color story via `theme.css`.
- Re-skin the major **glass surfaces** (sidebar, dashboard cards, modals, AI panel, course cards) to use the landing's white/0.07 + backdrop-blur + sky border-glow pattern.

Out of scope (defer):
- Per-screen layout reworks.
- Light-mode (`:root`) palette — keep as-is for now; landing is dark-only.
- Marketing/legal pages.
- Sign-out modal, onboarding wizard.

## Tasks
| ID | Goal | Write scope | Risk |
|---|---|---|---|
| task-01 | Swap dark-mode color tokens in theme.css to landing palette | `frontend/css/theme.css` only | Low — token-level, no shape changes |
| task-02 | Re-skin glass surfaces (sidebar, dashboard cards, modals) to landing glass aesthetic | `frontend/css/layout.css`, `frontend/css/styles.css` (selective) | Medium — touches multiple components |
| task-03 | Visual-review fixes for screens that regressed | targeted | Low–medium |

Strict sequencing: 01 → user verifies → 02 → user verifies → 03 if needed.

## Reference palettes
**Landing tokens** (frontend/css/new-landing.css:24–70):
- `--nl-bg #031323`, `--nl-bg-deep #020617`, `--nl-bg-mid #082f49`, `--nl-bg-soft #075985`
- `--nl-sky-300 #7dd3fc` (primary accent), `--nl-sky-400 #38bdf8`, `--nl-sky-500 #0ea5e9`
- `--nl-slate-{200..950}`
- Glass: `rgba(255,255,255,0.07)` bg, `rgba(255,255,255,0.12)` border
- `--nl-shadow-sky: 0 0 35px rgba(56,189,248,0.35)`

**App night theme** (frontend/css/theme.css:60–90) — already in the same family. Main mismatches:
- `--purple: #60a5fa` (blue-400) should be `#7dd3fc` (landing sky-300) — the landing's primary accent is sky-300, not blue-400.
- `--orange: #ff8c5a` is the lone non-blue accent; landing has no orange. Replace with `--nl-sky-200 #bae6fd` or remove.
- Shadows are dark-only; landing uses sky-glow on focused/CTAs. Add `--shadow-sky` token.

## User input needed
None for task-01.
