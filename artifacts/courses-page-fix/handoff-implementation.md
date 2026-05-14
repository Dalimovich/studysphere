# Handoff — courses-page fix, implementation stage

## Context

- **repo:** `Dalimovich/studysphere` (deployed as `minallo.de` via Netlify)
- **branch you MUST work on:** `fix/courses-page` — already pushed to origin. Do NOT commit to `main`. The user wants to PR-review the branch and squash-merge when done.
- **current stage:** implementation (fixes landing one at a time on the branch; each gets reviewed before next)
- **main goal:** make the courses page work reliably — the user describes specific bugs/issues one at a time; you fix each and push to `fix/courses-page`

## What has already been done on this branch

Two commits land on `fix/courses-page` beyond `main`:

1. **`0462513` — perf(courses): make first-load files appear faster**
   - `frontend/js/app-data.js`: `_prewarmCourses` trigger changed from `setTimeout(50)` → `Promise.resolve().then(...)` so prewarm fires on next microtask.
   - `frontend/js/app-data.js`: `_prewarmCourses` reorders the `todo` array so the URL-hash course (`#course=<id>`) is fetched first.
   - `frontend/js/app-storage.js`: `_ufMerge` now goes through a dedup wrapper (`_ufMergeInFlight` map). The async logic moved into `_ufMergeImpl`. When prewarm and a course-open click both fire `_ufMerge` for the same course, the second caller reuses the first call's Promise.
   - Net: on first-ever load, the spinner clears as soon as one in-flight Promise resolves rather than after two sequential round-trips.

2. **`ce3029e` — fix(courses): remove legacy aiTab side button — bubble is sole AI controller**
   - The old `#aiTab` launcher button in `frontend/pages/portal.html` was being un-hidden by `navigation.{js,ts}` (setting `style.display = ''` overrode the inline `display:none!important`). The visible tab overlapped the AI panel and blocked clicks.
   - Deleted `#aiTab` and `#aiHoverZone` divs from `portal.html`.
   - Removed all `aiTab` references from `navigation.{js,ts}`, `app.{js,ts}`, `ai-panel-bridge.{js,ts}`.
   - Now `#aiBubble` is the sole AI panel launcher.

## Also relevant — backend revert on main (already in this branch via merge)

Earlier on `main`, commit `e75f106` restructured `backend/functions/` into domain subfolders (`ai/`, `documents/`, etc.) and updated `netlify.toml` redirect targets to `/.netlify/functions/<domain>/<name>`. **This broke production** — Netlify's esbuild bundler did not discover the nested functions, every `/api/...` route returned 404. The fix commit `8cd70d4` reverted that restructure. `fix/courses-page` has the revert via a merge from main.

**Do not re-attempt the nested-folder restructure.** All 25 functions stay at top level of `backend/functions/`.

## Current task

**The user is fixing courses-page bugs one at a time and has not yet told you the next bug.** When this handoff starts, your first move is to ask the user which specific issue to fix next. Do not guess. The user's pattern so far is: they describe a symptom (sometimes with a screenshot/console log), you scope, fix, commit, push.

Known open items the user mentioned earlier but has not yet asked for fixes on:
- "AI bubble" — user said they wanted to "start with the AI bubble" but pivoted to fixing the 404s first, then prewarm, then the aiTab. They have not yet told you what's wrong with the bubble *specifically*. Ask before touching it.
- Stale session detection: there's a real bug in `frontend/js/supabase.js` lines 695–725 where the "alreadyIn" auth path declares `var alive2 = false;` and never updates it. This was diagnosed but not fixed. The user worked around it by manually clearing localStorage. May want a real fix later — only touch this if the user asks.

## Constraints

- **Commit to `fix/courses-page` only.** Never `main`. Push with plain `git push` after `git checkout fix/courses-page`.
- **Do not auto-deploy.** The user's memory rule: "Push to GitHub OK, never deploy to Netlify." Pushing triggers Netlify auto-build, which is fine — but never run `netlify deploy` commands.
- **Always edit both `.js` and `.ts` when both exist** (e.g., `app.js` + `app.ts`, `ai-panel-bridge.js` + `.ts`). The `.ts` is source, `.js` is the build output that ships. Both must stay in sync.
- **Never restructure `backend/functions/` into subfolders again.** See "backend revert" note above.
- **Cache buster note:** The user has been hitting `minallo.de` directly. Netlify auto-deploys ~1–2 min after each push to `fix/courses-page` (deploy preview URL). Cache-busted JS will show as `?v=<timestamp>` in the browser.
- **Pre-existing M files in `git status`** for many `frontend/js/...` files are NOT from this work — they were modified before the session started. Do not commit them unless the user asks. Specifically, `docs/CLAUDE.md` also shows as modified by something else; leave it alone.

## Relevant files (most likely to touch on courses-related fixes)

- `frontend/pages/portal.html` — main portal HTML, contains `#aiPanel`, `#aiBubble`, course view shell
- `frontend/views/chatbot/{chatbot,ai-bubble}.{html,css,js}` — bubble + chatbot view templates
- `frontend/js/features/ai-chat/ai-panel-bridge.{js,ts}` — panel open/close logic (bubble talks to this)
- `frontend/js/features/courses/{course-view,course-files,course-folders,courses-render,course-search}.{js,ts}` — course UI logic
- `frontend/js/app-data.js` — `_loadUserCourses`, `_prewarmCourses`
- `frontend/js/app-storage.js` — `_ufMerge`, `_ufList`, Supabase storage interaction
- `frontend/js/supabase.js` — auth (`_verifyAndEnter`, `_enterApp`, the "alreadyIn" path bug)
- `frontend/js/services/ai-service.{js,ts}` — `listCourseDocuments` and other API calls
- `frontend/js/core/navigation.{js,ts}` — portal section switching
- `backend/functions/documents-list.ts` — the documents endpoint (flat layout, never subfolder)
- `netlify.toml` — redirects (must stay flat, see backend revert note)

## Plan / task file

No formal plan file. The user is providing bugs one at a time conversationally. They have asked me to follow the templates in `.claude/prompts/`:
- For new planning tasks: `.claude/prompts/create plan.md`
- For critique: `.claude/prompts/criticize plan.md`
- For scoped implementation: `.claude/prompts/implement one scoped task.md`
- For review: `.claude/prompts/review work after implementation.md`

There's a project memory rule (`feedback_use_prompt_templates`) — when the user says "create a plan", "criticize the plan", "implement this task", "review the work", you must follow the matching template's output structure exactly. Read the template before responding.

## Tests already run

- `npm run typecheck:frontend` — passes on `fix/courses-page` after both commits (`0462513` and `ce3029e`).
- `npm run typecheck:backend` — passes on current `main` / `fix/courses-page`.
- No e2e / Playwright run since the changes — user has been validating by reloading `minallo.de` after each Netlify deploy.

## What I need from you

1. Read this handoff fully before doing anything.
2. Run `git checkout fix/courses-page` to make sure you're on the right branch. Verify `git log --oneline main..HEAD` shows `0462513` and `ce3029e`.
3. Ask the user which courses-page bug to fix next. Do NOT pick one yourself. The user has been driving scope.
4. When fixing: scope tight, edit both `.js` and `.ts` versions when both exist, typecheck after, commit with a descriptive message, push to `fix/courses-page`.
5. When all bugs the user wants fixed are done, the user will open a PR for review and squash-merge. Do not merge yourself.

## Important rules

- Do not assume missing context unless it is written here.
- If something is unclear, say exactly what needs verification before proceeding.
- Focus only on the current task — do not refactor unrelated areas.
- Prefer concrete file paths and constraints over narrative summaries.
- Commit to `fix/courses-page`, never `main`.

## Summarize back to the user (before starting work)

At the end of your first response, summarize:
1. Your understanding of the task
2. Risks or unclear areas
3. What you will do first
